use std::{fs, path::Path};
use serde::Serialize;
mod server;
mod config;
use config::{AppConfig, read_config, write_config};
use tauri::{AppHandle, Manager};
use sqlx::postgres::{PgPool, PgPoolOptions};

use uuid::Uuid;
use tokio::sync::mpsc;

struct DbState(std::sync::Mutex<Option<PgPool>>);

#[derive(serde::Serialize)]
struct SettingsResult {
    success: bool,
    config: Option<AppConfig>,
    message: Option<String>,
}

impl SettingsResult {
    fn ok(config: AppConfig) -> Self {
        Self { success: true, config: Some(config), message: None }
    }

    fn err(message: impl Into<String>) -> Self {
        Self { success: false, config: None, message: Some(message.into()) }
    }
}

#[tauri::command]
async fn update_settings(
    app: tauri::AppHandle,
    db_state: tauri::State<'_, DbState>,
    use_database: bool,
    database_url: String,
    use_thumbnails: bool,
    thumbnail_percent: f32,
) -> Result<SettingsResult, ()> {
    if use_database {
        let pool = match PgPoolOptions::new()
            .max_connections(5)
            .acquire_timeout(std::time::Duration::from_secs(5))
            .connect(&database_url)
            .await
        {
            Ok(pool) => pool,
            Err(e) => return Ok(SettingsResult::err(format!("Couldn't connect to that database: {e}"))),
        };

        // update_settings is the only place migrations run — a user-initiated
        // "turn the DB on" action, not something that happens silently on every launch.
        if let Err(e) = sqlx::migrate!("./migrations").run(&pool).await {
            return Ok(SettingsResult::err(format!("Connected, but running migrations failed: {e}")));
        }

        *db_state.inner().0.lock().unwrap() = Some(pool);
    } else {
        *db_state.inner().0.lock().unwrap() = None;
    }

    let mut config = read_config(&app);
    config.database_url = database_url;
    config.use_thumbnails = use_thumbnails;
    config.thumbnail_percent = thumbnail_percent;
    write_config(&app, &config);

    Ok(SettingsResult::ok(config))
}

#[tauri::command]
fn get_config(app: tauri::AppHandle) -> AppConfig {
    read_config(&app)
}
#[tauri::command]
async fn get_tags(db_state: tauri::State<'_, DbState>) -> Result<Vec<Tag>, String> {
    let pool = db_state.get_pool()?;
    sqlx::query_as::<_, Tag>("SELECT id, name FROM tags ORDER BY name")
        .fetch_all(&pool)
        .await
        .map_err(|e| format!("Couldn't fetch tags: {e}"))
}
impl DbState {
    fn get_pool(&self) -> Result<PgPool, String> {
        self.0
            .lock()
            .unwrap()
            .clone()
            .ok_or_else(|| "Database is not connected. Enable it in Settings first.".to_string())
    }
}

/// Attempts to reconnect to the DB on startup using the saved config, so the
/// user doesn't have to revisit Settings every launch just to reconnect.
/// Deliberately does NOT run migrations here — that stays a `update_settings`-only
/// action — and deliberately does NOT fail loudly: if the DB is unreachable at
/// launch (e.g. laptop closed, DB temporarily down), the app should still open
/// and just fall back to disk-only behavior, same as if the user had never
/// enabled the DB at all.
async fn connect_on_startup(app: &AppHandle) {
    let config = read_config(app);

    if !config.use_thumbnails || config.database_url.is_empty() {
        return;
    }

    match PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(std::time::Duration::from_secs(5))
        .connect(&config.database_url)
        .await
    {
        Ok(pool) => {
            let db_state = app.state::<DbState>();
            *db_state.inner().0.lock().unwrap() = Some(pool);
        }
        Err(e) => {
            // Silent by design — log for your own debugging, but don't
            // surface anything to the user or block startup.
            println!("connect_on_startup: DB unreachable, continuing without it — {e}");
        }
    }
}

#[tauri::command]
fn update_directories(app: AppHandle, folder: &str, folder_path: &str) -> AppConfig {
    let mut conf = read_config(&app);
    match folder {
        "inbox" => conf.inbox = folder_path.to_string(),
        "library" => conf.library = folder_path.to_string(),
        _ => println!("Unknown directory folder."),
    }
    write_config(&app, &conf);
    conf
}

#[derive(Serialize)]
struct Folder {
    id: Option<Uuid>,
    name: String,
    path: String,
}

#[tauri::command]
async fn create_folder(
    app: tauri::AppHandle,
    db_state: tauri::State<'_, DbState>,
    name: &str,
) -> Result<Folder, String> {
    let config = read_config(&app);
    let path = Path::new(&config.library).join(name);
    fs::create_dir_all(&path).map_err(|e| format!("Couldn't create folder on disk: {e}"))?;
    let path_str = path.to_string_lossy().into_owned();

    let id = match db_state.get_pool() {
        Ok(pool) => {
            let new_id = Uuid::new_v4();
            sqlx::query("INSERT INTO folders (id, name, path) VALUES ($1, $2, $3)")
                .bind(new_id)
                .bind(name)
                .bind(&path_str)
                .execute(&pool)
                .await
                .map_err(|e| format!("Folder created on disk, but the database insert failed: {e}"))?;
            Some(new_id)
        }
        Err(e) => {
            println!("create_folder: skipping DB insert — {e}");
            None
        }
    };

    Ok(Folder { id, name: name.to_string(), path: path_str })
}

#[tauri::command]
async fn get_library_folders(db_state: tauri::State<'_, DbState>) -> Result<Vec<Folder>, String> {
    let pool = db_state.get_pool()?;

    #[derive(sqlx::FromRow)]
    struct FolderRow {
        id: Uuid,
        name: String,
        path: String,
    }

    let rows = sqlx::query_as::<_, FolderRow>(
        "SELECT id, name, path FROM folders ORDER BY name"
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Couldn't fetch folders: {e}"))?;

    Ok(rows
        .into_iter()
        .map(|r| Folder { id: Some(r.id), name: r.name, path: r.path })
        .collect())
}

#[derive(Serialize, sqlx::FromRow)]
struct Tag {
    id: Uuid,
    name: String,
}

#[tauri::command]
async fn create_tag(db_state: tauri::State<'_, DbState>, name: String) -> Result<Tag, String> {
    let pool = db_state.get_pool()?;
    let id = Uuid::new_v4();
    sqlx::query_as::<_, Tag>("INSERT INTO tags (id, name) VALUES ($1, $2) RETURNING id, name")
        .bind(id)
        .bind(&name)
        .fetch_one(&pool)
        .await
        .map_err(|e| format!("Couldn't create tag: {e}"))
}

#[derive(Serialize)]
struct File {
    name: String,
    path: String,
    size: u64,
}

#[tauri::command]
fn list_files(path: String) -> Result<Vec<File>, String> {
    let entries = fs::read_dir(&path).map_err(|e| format!("Couldn't read directory {path}: {e}"))?;
    let mut files: Vec<File> = vec![];
    for entry in entries {
        let entry = entry.map_err(|e| format!("Couldn't read a directory entry: {e}"))?;
        let name = entry.file_name().to_string_lossy().into_owned();
        let entry_path = entry.path().to_string_lossy().into_owned();
        let size = entry
            .metadata()
            .map_err(|e| format!("Couldn't read metadata for {name}: {e}"))?
            .len();
        files.push(File { name, path: entry_path, size });
    }
    Ok(files)
}

#[tauri::command]
fn move_video(old: String, new: String) -> Result<(), String> {
    println!("FROM SERVER: {old} ----- {new}");
    fs::rename(&old, &new).map_err(|e| format!("Couldn't move {old} to {new}: {e}"))
}

#[tauri::command]
fn list_inbox_files(app: AppHandle) -> Result<Vec<File>, String> {
    let conf = get_config(app);
    list_files(conf.inbox)
}

// ── Transfer pipeline ───────────────────────────────────────────────────

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

    Ok(VideoProbe { duration_seconds, width, height })
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
            "-ss", &timestamp, // seek before -i: fast (keyframe-ish) seek
            "-i", video_path,
            "-frames:v", "1",
            "-q:v", "2",
            output_path
                .to_str()
                .ok_or("Invalid thumbnail output path")?,
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

#[derive(Serialize, sqlx::FromRow)]
struct Video {
    id: Uuid,
    folder_id: Uuid,
    title: String,
    file_path: String,
    thumbnail_path: Option<String>,
    duration_seconds: Option<f32>,
    width: Option<i32>,
    height: Option<i32>,
    size_bytes: i64,
    watched: bool,
}

/// One unit of work for the transfer queue: everything needed to move a
/// video out of the inbox and into the library as a full DB record.
struct TransferJob {
    old: String,
    new: String,
    folder_id: Uuid,
    title: String,
    tag_ids: Vec<Uuid>,
}

/// Sender half lives in managed state so any command can hand off a job;
/// the receiver half is owned by the single background worker spawned in
/// `run()`. mpsc::Sender is Clone + Send + Sync on its own, so no Mutex
/// needed here.
struct QueueState(mpsc::Sender<TransferJob>);

/// The actual pipeline: move file -> read size -> probe metadata ->
/// (maybe) generate thumbnail -> insert video + tag rows atomically.
/// Runs entirely inside the background worker — nothing in the UI awaits
/// this directly.
async fn process_transfer(app: &AppHandle, job: TransferJob) -> Result<Video, String> {
    let db_state = app.state::<DbState>();
    let pool = db_state.get_pool()?;
    let config = read_config(app);

    // 1. Actually move the file first — everything after this reads from
    // its new location.
    fs::rename(&job.old, &job.new)
        .map_err(|e| format!("Couldn't move {} to {}: {e}", job.old, job.new))?;

    // 2. Size is a plain fs read, not ffprobe's job.
    let size_bytes = fs::metadata(&job.new)
        .map_err(|e| format!("File was moved, but couldn't read its size: {e}"))?
        .len() as i64;

    // 3. Duration/resolution. Non-fatal: a probe failure just means those
    // columns stay NULL — the video's still safely in the library.
    let probe = probe_video(&job.new).await.unwrap_or_else(|e| {
        println!("transfer_queue: ffprobe failed, continuing without metadata — {e}");
        VideoProbe { duration_seconds: None, width: None, height: None }
    });

    let video_id = Uuid::new_v4();

    // 4. Thumbnail — only if enabled and we actually know the duration.
    let mut thumbnail_path: Option<String> = None;
    if config.use_thumbnails {
        if let Some(duration) = probe.duration_seconds {
            let thumb_dir = app
                .path()
                .app_data_dir()
                .map_err(|e| format!("Couldn't resolve app data dir: {e}"))?
                .join("thumbnails");
            fs::create_dir_all(&thumb_dir)
                .map_err(|e| format!("Couldn't create thumbnails dir: {e}"))?;
            let thumb_path = thumb_dir.join(format!("{video_id}.jpg"));

            match generate_thumbnail(&job.new, duration, config.thumbnail_percent, &thumb_path).await
            {
                Ok(()) => thumbnail_path = Some(thumb_path.to_string_lossy().into_owned()),
                Err(e) => println!(
                    "transfer_queue: thumbnail generation failed, continuing without one — {e}"
                ),
            }
        }
    }

    // 5. Video row + tag links are one atomic unit — either both happen or
    // neither does. The file move above is NOT part of this transaction
    // (can't be — it's a filesystem op), same tradeoff create_folder already
    // accepts elsewhere in this file.
    let mut tx = pool.begin().await.map_err(|e| {
        format!("Video was moved to {}, but starting a transaction failed: {e}", job.new)
    })?;

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
    .map_err(|e| format!("Video was moved to {}, but saving its database record failed: {e}", job.new))?;

    for tag_id in &job.tag_ids {
        sqlx::query("INSERT INTO video_tags (video_id, tag_id) VALUES ($1, $2)")
            .bind(video_id)
            .bind(tag_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| format!("Video saved, but linking a tag failed: {e}"))?;
    }

    tx.commit()
        .await
        .map_err(|e| format!("Couldn't commit the video/tags transaction: {e}"))?;

    Ok(video)
}

/// Single background worker: pulls jobs off the channel one at a time and
/// processes them sequentially. Errors are logged and swallowed — by
/// design, nothing in the UI is waiting on this, so there's nowhere to
/// surface them.
async fn run_transfer_queue(app: AppHandle, mut rx: mpsc::Receiver<TransferJob>) {
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
async fn queue_transfer_video(
    queue: tauri::State<'_, QueueState>,
    old: String,
    new: String,
    folder_id: Uuid,
    title: String,
    tag_ids: Vec<Uuid>,
) -> Result<(), String> {
    let job = TransferJob { old, new, folder_id, title, tag_ids };
    queue
        .0
        .send(job)
        .await
        .map_err(|_| "Transfer queue is closed".to_string())
}
//------------------------------------------------------------------
#[derive(Serialize, sqlx::FromRow)]
struct VideoCard {
    id: Uuid,
    title: String,
    thumbnail_path: Option<String>,
    duration_seconds: Option<f32>,
    size_bytes: i64,
    created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Serialize)]
struct HomeVideos {
    recent: Vec<VideoCard>,
    oldest: Vec<VideoCard>,
    biggest: Vec<VideoCard>,
    smallest: Vec<VideoCard>,
}
#[tauri::command]
async fn get_home_videos(db_state: tauri::State<'_, DbState>) -> Result<HomeVideos, String> {
    let pool = db_state.get_pool()?;

    let recent_q = sqlx::query_as::<_, VideoCard>(
        "SELECT id, title, thumbnail_path, duration_seconds, size_bytes, created_at
         FROM videos ORDER BY created_at DESC LIMIT 12",
    )
    .fetch_all(&pool);

    let oldest_q = sqlx::query_as::<_, VideoCard>(
        "SELECT id, title, thumbnail_path, duration_seconds, size_bytes, created_at
         FROM videos ORDER BY created_at ASC LIMIT 12",
    )
    .fetch_all(&pool);

    let biggest_q = sqlx::query_as::<_, VideoCard>(
        "SELECT id, title, thumbnail_path, duration_seconds, size_bytes, created_at
         FROM videos ORDER BY size_bytes DESC LIMIT 12",
    )
    .fetch_all(&pool);

    let smallest_q = sqlx::query_as::<_, VideoCard>(
        "SELECT id, title, thumbnail_path, duration_seconds, size_bytes, created_at
         FROM videos ORDER BY size_bytes ASC LIMIT 12",
    )
    .fetch_all(&pool);

    // All 4 queries fire concurrently on the pool (each borrows its own
    // connection), so this takes roughly as long as the slowest single
    // query, not the sum of all 4.
    let (recent, oldest, biggest, smallest) =
        tokio::join!(recent_q, oldest_q, biggest_q, smallest_q);

    Ok(HomeVideos {
        recent: recent.map_err(|e| format!("Couldn't fetch recent videos: {e}"))?,
        oldest: oldest.map_err(|e| format!("Couldn't fetch oldest videos: {e}"))?,
        biggest: biggest.map_err(|e| format!("Couldn't fetch biggest videos: {e}"))?,
        smallest: smallest.map_err(|e| format!("Couldn't fetch smallest videos: {e}"))?,
    })
}
//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
#[derive(Serialize, sqlx::FromRow)]
struct FolderCard {
    id: Uuid,
    name: String,
    thumbnail_path: Option<String>,
    video_count: i64,
}

#[tauri::command]
async fn get_folders(db_state: tauri::State<'_, DbState>) -> Result<Vec<FolderCard>, String> {
    let pool = db_state.get_pool()?;

    // LATERAL picks one random video per folder in a single round trip,
    // instead of N+1 queries (one per folder). Only videos that actually
    // have a thumbnail are eligible — no point landing on a video whose
    // thumbnail generation failed or was disabled at the time.
    // video_count is a plain COUNT of everything in the folder (thumbnail
    // or not), since that's a general folder stat, not tied to the image pick.
    sqlx::query_as::<_, FolderCard>(
        "SELECT
            f.id,
            f.name,
            v.thumbnail_path,
            COALESCE(vc.video_count, 0) AS video_count
         FROM folders f
         LEFT JOIN LATERAL (
             SELECT thumbnail_path
             FROM videos
             WHERE folder_id = f.id AND thumbnail_path IS NOT NULL
             ORDER BY random()
             LIMIT 1
         ) v ON true
         LEFT JOIN LATERAL (
             SELECT COUNT(*) AS video_count
             FROM videos
             WHERE folder_id = f.id
         ) vc ON true
         ORDER BY f.name",
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Couldn't fetch folders: {e}"))
}
//````````````````````````````````````````````````````````````
#[derive(Serialize)]
struct FolderVideosResponse {
    folder_name: String,
    videos: Vec<VideoCard>,
}

#[tauri::command]
async fn get_folder_videos(
    db_state: tauri::State<'_, DbState>,
    folder_id: Uuid,
) -> Result<FolderVideosResponse, String> {
    let pool = db_state.get_pool()?;

    let name_q = sqlx::query_scalar::<_, String>("SELECT name FROM folders WHERE id = $1")
        .bind(folder_id)
        .fetch_optional(&pool);

    let videos_q = sqlx::query_as::<_, VideoCard>(
        "SELECT id, title, thumbnail_path, duration_seconds, size_bytes, created_at
         FROM videos
         WHERE folder_id = $1
         ORDER BY created_at DESC",
    )
    .bind(folder_id)
    .fetch_all(&pool);

    // Independent queries, run concurrently rather than one after another.
    let (name_result, videos_result) = tokio::join!(name_q, videos_q);

    let folder_name = name_result
        .map_err(|e| format!("Couldn't look up this folder: {e}"))?
        .ok_or_else(|| "This folder doesn't exist.".to_string())?;

    let videos =
        videos_result.map_err(|e| format!("Couldn't fetch videos for this folder: {e}"))?;

    Ok(FolderVideosResponse { folder_name, videos })
}
//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
#[derive(Serialize)]
struct FolderSiblingsResponse {
    folder_name: String,
    videos: Vec<Video>,
}

/// Given a video's id, finds which folder it lives in and returns every
/// video in that same folder (siblings), plus the folder's name. Uses
/// the full `Video` struct (not the lighter `VideoCard`) since this feeds
/// a player view that needs `file_path` to actually play something, not
/// just a thumbnail grid.
#[tauri::command]
async fn get_folder_siblings(
    db_state: tauri::State<'_, DbState>,
    video_id: Uuid,
) -> Result<FolderSiblingsResponse, String> {
    let pool = db_state.get_pool()?;

    // Have to know the folder before we can do anything else, so this
    // lookup can't run concurrently with the rest — it's a dependency,
    // not an independent query like the name/videos pair below.
    let folder_id = sqlx::query_scalar::<_, Uuid>("SELECT folder_id FROM videos WHERE id = $1")
        .bind(video_id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| format!("Couldn't look up this video: {e}"))?
        .ok_or_else(|| "This video doesn't exist.".to_string())?;

    let name_q = sqlx::query_scalar::<_, String>("SELECT name FROM folders WHERE id = $1")
        .bind(folder_id)
        .fetch_optional(&pool);

    let videos_q = sqlx::query_as::<_, Video>(
        "SELECT id, folder_id, title, file_path, thumbnail_path, duration_seconds, width, height, size_bytes, watched
         FROM videos
         WHERE folder_id = $1
         ORDER BY created_at DESC",
    )
    .bind(folder_id)
    .fetch_all(&pool);

    let (name_result, videos_result) = tokio::join!(name_q, videos_q);

    let folder_name = name_result
        .map_err(|e| format!("Couldn't look up this folder: {e}"))?
        .ok_or_else(|| "This folder doesn't exist.".to_string())?;

    let videos =
        videos_result.map_err(|e| format!("Couldn't fetch videos for this folder: {e}"))?;

    Ok(FolderSiblingsResponse { folder_name, videos })
}
//------------------------------------------------------------------
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let (transfer_tx, transfer_rx) = mpsc::channel::<TransferJob>(256);

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(DbState(std::sync::Mutex::new(None)))
        .manage(QueueState(transfer_tx))
        .setup(move |app| {
            std::thread::spawn(|| {
                server::main();
            });

            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                connect_on_startup(&handle).await;
            });

            let queue_handle = app.handle().clone();
            tauri::async_runtime::spawn(run_transfer_queue(queue_handle, transfer_rx));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_config,
            update_directories,
            list_files,
            create_folder,
            move_video,
            list_inbox_files,
            update_settings,
            get_library_folders,
            create_tag,
            get_tags,
            queue_transfer_video,
             get_home_videos ,get_folders,get_folder_videos,get_folder_siblings
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}