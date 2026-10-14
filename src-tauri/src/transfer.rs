use crate::config::read_config;
use crate::db::DbState;
use crate::video::Video;
use std::{fs, path::Path};
use tauri::{AppHandle, Manager};
use tokio::sync::mpsc;
use uuid::Uuid;

#[derive(Debug)]
struct VideoProbe {
    duration_seconds: Option<f32>,
    width: Option<i32>,
    height: Option<i32>,
}

/// Reads duration/resolution via ffprobe. Non-fatal on failure — the caller
/// decides whether to proceed with NULLs, same philosophy as thumbnail
/// generation below.
async fn probe_video(path: &str) -> Result<VideoProbe, String> {
    let output = tokio::process::Command::new("ffprobe")
        .args([
            "-v", "error",
            "-select_streams", "v:0",
            "-show_entries", "stream=width,height:format=duration",
            "-of", "json",
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
    // ffprobe returns duration as a JSON *string*, not a number.
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

/// Captures a single frame at `percent` of the video's duration into
/// `output_path`. Non-fatal on failure by design — the transfer should
/// still succeed with thumbnail_path left NULL.
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
            &timestamp, // seek before -i: fast (keyframe-ish) seek
            "-i",
            video_path,
            "-frames:v",
            "1",
            "-q:v",
            "2",
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

/// One unit of work for the transfer queue: everything needed to move a
/// video out of the inbox and into the library as a full DB record.
pub struct TransferJob {
    pub old: String,
    pub new: String,
    pub folder_id: Uuid,
    pub title: String,
    pub tag_ids: Vec<Uuid>,
    pub model_ids: Vec<Uuid>,
}

/// Sender half lives in managed state so any command can hand off a job;
/// the receiver half is owned by the single background worker spawned in
/// `run()`. mpsc::Sender is Clone + Send + Sync on its own, so no Mutex
/// needed here.
pub struct QueueState(pub mpsc::Sender<TransferJob>);

/// The actual pipeline: move file -> read size -> probe metadata ->
/// (maybe) generate thumbnail -> insert video + tag + model rows atomically.
/// Runs entirely inside the background worker — nothing in the UI awaits
/// this directly.
async fn process_transfer(app: &AppHandle, job: TransferJob) -> Result<Video, String> {
    let db_state = app.state::<DbState>();
    let pool = db_state.get_pool()?;

    // 1. Move the file
    fs::rename(&job.old, &job.new)
        .map_err(|e| format!("Couldn't move file from {} to {}: {e}", job.old, job.new))?;

    // 2. File size
    let size_bytes = fs::metadata(&job.new)
        .map(|m| m.len() as i64)
        .unwrap_or(0);

    // 3. Probe
    let probe = probe_video(&job.new).await.unwrap_or(VideoProbe {
        duration_seconds: None,
        width: None,
        height: None,
    });

    // Generate id up front so the thumbnail filename can use it
    let video_id = Uuid::new_v4();

    // 4. Optional thumbnail — stored under the app data dir, not next to the video
    let config = read_config(app);
    let thumbnail_path: Option<String> = if config.use_thumbnails {
        if let Some(duration) = probe.duration_seconds {
            let thumb_dir = app
                .path()
                .app_data_dir()
                .map_err(|e| format!("Couldn't resolve app data dir: {e}"))?
                .join("thumbnails");
            let _ = fs::create_dir_all(&thumb_dir);
            let thumb_file = thumb_dir.join(format!("{video_id}.jpg"));
            match generate_thumbnail(
                &job.new,
                duration,
                config.thumbnail_percent,
                &thumb_file,
            )
            .await
            {
                Ok(()) => Some(thumb_file.to_string_lossy().to_string()),
                Err(e) => {
                    println!("thumbnail generation failed (non-fatal): {e}");
                    None
                }
            }
        } else {
            None
        }
    } else {
        None
    };

    // 5. Insert video + tags + models in one transaction
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
    .bind(&thumbnail_path)
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

    Ok(video)
}

/// Single background worker: pulls jobs off the channel one at a time and
/// processes them sequentially. Errors are logged and swallowed — by
/// design, nothing in the UI is waiting on this, so there's nowhere to
/// surface them.
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

/// Thin command: just hands the job to the queue and returns immediately.
/// The frontend should NOT await meaningful work here — it should move on
/// to the next video right after this resolves.
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