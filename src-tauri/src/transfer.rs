use crate::config::read_config;
use crate::db::DbState;
use crate::video::Video;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};
use tokio::sync::mpsc;
use uuid::Uuid;

#[derive(Debug)]
struct VideoProbe {
    duration_seconds: Option<f32>,
    width: Option<i32>,
    height: Option<i32>,
}

/// Reads duration/resolution via ffprobe. Non-fatal on failure.
async fn probe_video(path: &str) -> Result<VideoProbe, String> {
    let output = tokio::process::Command::new("ffprobe")
        .args([
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=width,height:format=duration",
            "-of",
            "json",
            path,
        ])
        .output()
        .await
        .map_err(|e| format!("Couldn't run ffprobe (is it installed and on PATH?): {e}"))?;

    if !output.status.success() {
        return Err(format!(
            "ffprobe exited with an error: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    let json: serde_json::Value = serde_json::from_slice(&output.stdout)
        .map_err(|e| format!("Couldn't parse ffprobe output: {e}"))?;

    let stream = json.get("streams").and_then(|s| s.get(0));
    let width = stream
        .and_then(|s| s.get("width"))
        .and_then(|w| w.as_i64())
        .map(|w| w as i32);
    let height = stream
        .and_then(|s| s.get("height"))
        .and_then(|h| h.as_i64())
        .map(|h| h as i32);
    let duration_seconds = json
        .get("format")
        .and_then(|f| f.get("duration"))
        .and_then(|d| d.as_str())
        .and_then(|d| d.parse::<f32>().ok());

    Ok(VideoProbe {
        duration_seconds,
        width,
        height,
    })
}

/// Captures a single frame scaled to max 1280px wide.
/// Good enough for hero/ambient, much cheaper than full-res frames.
async fn generate_thumbnail(
    video_path: &str,
    duration_seconds: f32,
    percent: f32,
    output_path: &Path,
) -> Result<(), String> {
    let capture_at = (duration_seconds * (percent / 100.0)).max(0.0);
    let timestamp = format!("{:.2}", capture_at);

    let output = tokio::process::Command::new("ffmpeg")
        .args([
            "-y",
            "-ss",
            &timestamp, // seek before -i = fast keyframe seek
            "-i",
            video_path,
            "-frames:v",
            "1",
            "-vf",
            "scale='min(1280,iw)':-2", // max width 1280, keep aspect
            "-q:v",
            "3", // still sharp, smaller than q=2
            output_path.to_str().unwrap(),
        ])
        .output()
        .await
        .map_err(|e| format!("Couldn't run ffmpeg (is it installed and on PATH?): {e}"))?;

    if !output.status.success() {
        return Err(format!(
            "ffmpeg exited with an error: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    Ok(())
}

pub struct TransferJob {
    pub old: String,
    pub new: String,
    pub folder_id: Uuid,
    pub title: String,
    pub tag_ids: Vec<Uuid>,
    pub model_ids: Vec<Uuid>,
}

pub struct QueueState(pub mpsc::Sender<TransferJob>);

/// Move file + metadata + DB insert. Thumbnail is done afterwards.
async fn process_transfer(app: &AppHandle, job: TransferJob) -> Result<Video, String> {
    let db_state = app.state::<DbState>();
    let pool = db_state.get_pool()?;

    let old = job.old.clone();
    let new = job.new.clone();

    // 1. Move the file (blocking FS → spawn_blocking)
    tokio::task::spawn_blocking(move || std::fs::rename(&old, &new))
        .await
        .map_err(|e| format!("Rename task panicked: {e}"))?
        .map_err(|e| format!("Couldn't move file from {} to {}: {e}", job.old, job.new))?;

    // 2. File size (blocking FS → spawn_blocking)
    let new_for_meta = job.new.clone();
    let size_bytes = tokio::task::spawn_blocking(move || {
        std::fs::metadata(&new_for_meta)
            .map(|m| m.len() as i64)
            .unwrap_or(0)
    })
    .await
    .unwrap_or(0);

    // 3. Probe
    let probe = probe_video(&job.new).await.unwrap_or(VideoProbe {
        duration_seconds: None,
        width: None,
        height: None,
    });

    let video_id = Uuid::new_v4();

    // 4. Insert video + tags + models FIRST (thumbnail comes later)
    let mut tx = pool
        .begin()
        .await
        .map_err(|e| format!("Couldn't start transaction: {e}"))?;

    let video = sqlx::query_as::<_, Video>(
        "INSERT INTO videos (id, folder_id, title, file_path, thumbnail_path, duration_seconds, width, height, size_bytes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, folder_id, title, file_path, thumbnail_path, duration_seconds, width, height, size_bytes, watched",
    )
    .bind(video_id)
    .bind(job.folder_id)
    .bind(&job.title)
    .bind(&job.new)
    .bind::<Option<String>>(None)
    .bind(probe.duration_seconds)
    .bind(probe.width)
    .bind(probe.height)
    .bind(size_bytes)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| {
        format!(
            "Video was moved to {}, but saving its database record failed: {e}",
            job.new
        )
    })?;

    for tag_id in &job.tag_ids {
        sqlx::query("INSERT INTO video_tags (video_id, tag_id) VALUES ($1, $2)")
            .bind(video_id)
            .bind(tag_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| format!("Video saved, but linking a tag failed: {e}"))?;
    }

    for model_id in &job.model_ids {
        sqlx::query("INSERT INTO video_models (video_id, model_id) VALUES ($1, $2)")
            .bind(video_id)
            .bind(model_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| format!("Video saved, but linking a model failed: {e}"))?;
    }

    tx.commit()
        .await
        .map_err(|e| format!("Couldn't commit the video/tags/models transaction: {e}"))?;

    // 5. Optional thumbnail AFTER the video is already in the DB
    let config = read_config(app);
    if config.use_thumbnails {
        if let Some(duration) = probe.duration_seconds {
            let app_data = app
                .path()
                .app_data_dir()
                .map_err(|e| format!("Couldn't resolve app data dir: {e}"))?;

            let thumb_dir = app_data.join("thumbnails");
            let thumb_dir_clone = thumb_dir.clone();
            tokio::task::spawn_blocking(move || {
                let _ = std::fs::create_dir_all(&thumb_dir_clone);
            })
            .await
            .ok();

            let thumb_file = thumb_dir.join(format!("{video_id}.jpg"));
            match generate_thumbnail(
                &job.new,
                duration,
                config.thumbnail_percent,
                &thumb_file,
            )
            .await
            {
                Ok(()) => {
                    let thumb_path = thumb_file.to_string_lossy().to_string();
                    if let Err(e) = sqlx::query(
                        "UPDATE videos SET thumbnail_path = $1 WHERE id = $2",
                    )
                    .bind(&thumb_path)
                    .bind(video_id)
                    .execute(&pool)
                    .await
                    {
                        println!("thumbnail path update failed (non-fatal): {e}");
                    }
                }
                Err(e) => {
                    println!("thumbnail generation failed (non-fatal): {e}");
                }
            }
        }
    }

    Ok(video)
}

pub async fn run_transfer_queue(app: AppHandle, mut rx: mpsc::Receiver<TransferJob>) {
    while let Some(job) = rx.recv().await {
        let old = job.old.clone();
        let new = job.new.clone();
        match process_transfer(&app, job).await {
            Ok(video) => println!(
                "transfer_queue: transferred '{}' -> {}",
                video.title, video.file_path
            ),
            Err(e) => println!("transfer_queue: failed to transfer {old} -> {new}: {e}"),
        }
    }
}

#[tauri::command]
pub async fn queue_transfer_video(
    queue: tauri::State<'_, QueueState>,
    old: String,
    new: String,
    folder_id: Uuid,
    title: String,
    tag_ids: Vec<Uuid>,
    model_ids: Vec<Uuid>,
) -> Result<(), String> {
    let job = TransferJob {
        old,
        new,
        folder_id,
        title,
        tag_ids,
        model_ids,
    };
    queue
        .0
        .send(job)
        .await
        .map_err(|_| "Transfer queue is closed".to_string())
}