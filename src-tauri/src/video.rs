use crate::db::DbState;
use serde::Serialize;
use std::path::Path;
use std::process::{Command, Stdio};
use uuid::Uuid;

#[derive(Serialize, sqlx::FromRow)]
pub struct Video {
    pub id: Uuid,
    pub folder_id: Uuid,
    pub title: String,
    pub file_path: String,
    pub thumbnail_path: Option<String>,
    pub duration_seconds: Option<f32>,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub size_bytes: i64,
    pub watched: bool,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct VideoCard {
    pub id: Uuid,
    pub title: String,
    pub thumbnail_path: Option<String>,
    pub duration_seconds: Option<f32>,
    pub size_bytes: i64,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub in_watchlist: bool,
}

#[derive(Serialize)]
pub struct HomeVideos {
    recent: Vec<VideoCard>,
    oldest: Vec<VideoCard>,
    biggest: Vec<VideoCard>,
    smallest: Vec<VideoCard>,
}

#[tauri::command]
pub async fn get_home_videos(db_state: tauri::State<'_, DbState>) -> Result<HomeVideos, String> {
    let pool = db_state.get_pool()?;

    let recent_q = sqlx::query_as::<_, VideoCard>(
        "SELECT id, title, thumbnail_path, duration_seconds, size_bytes, created_at, in_watchlist
         FROM videos WHERE watched = false AND is_deleted = false
         ORDER BY created_at DESC LIMIT 12",
    )
    .fetch_all(&pool);

    let oldest_q = sqlx::query_as::<_, VideoCard>(
        "SELECT id, title, thumbnail_path, duration_seconds, size_bytes, created_at, in_watchlist
         FROM videos WHERE watched = false AND is_deleted = false
         ORDER BY created_at ASC LIMIT 12",
    )
    .fetch_all(&pool);

    let biggest_q = sqlx::query_as::<_, VideoCard>(
        "SELECT id, title, thumbnail_path, duration_seconds, size_bytes, created_at, in_watchlist
         FROM videos WHERE watched = false AND is_deleted = false
         ORDER BY size_bytes DESC LIMIT 12",
    )
    .fetch_all(&pool);

    let smallest_q = sqlx::query_as::<_, VideoCard>(
        "SELECT id, title, thumbnail_path, duration_seconds, size_bytes, created_at, in_watchlist
         FROM videos WHERE watched = false AND is_deleted = false
         ORDER BY size_bytes ASC LIMIT 12",
    )
    .fetch_all(&pool);

    let (recent, oldest, biggest, smallest) =
        tokio::join!(recent_q, oldest_q, biggest_q, smallest_q);

    Ok(HomeVideos {
        recent: recent.map_err(|e| format!("Couldn't fetch recent videos: {e}"))?,
        oldest: oldest.map_err(|e| format!("Couldn't fetch oldest videos: {e}"))?,
        biggest: biggest.map_err(|e| format!("Couldn't fetch biggest videos: {e}"))?,
        smallest: smallest.map_err(|e| format!("Couldn't fetch smallest videos: {e}"))?,
    })
}

/// Shared UPDATE used by set_video_watched and play_video.
async fn mark_video_watched(pool: &sqlx::PgPool, video_id: Uuid, watched: bool) -> Result<(), String> {
    let result = sqlx::query(
        "UPDATE videos
         SET watched = $1, watched_at = CASE WHEN $1 THEN now() ELSE NULL END
         WHERE id = $2",
    )
    .bind(watched)
    .bind(video_id)
    .execute(pool)
    .await
    .map_err(|e| format!("Couldn't update watched status: {e}"))?;

    if result.rows_affected() == 0 {
        return Err("This video doesn't exist.".to_string());
    }
    Ok(())
}

#[tauri::command]
pub async fn set_video_watched(
    db_state: tauri::State<'_, DbState>,
    video_id: Uuid,
    watched: bool,
) -> Result<(), String> {
    let pool = db_state.get_pool()?;
    mark_video_watched(&pool, video_id, watched).await
}

/// Open the video in Celluloid and mark it watched.
/// Returns immediately after spawn — does not wait for the player to exit.
#[tauri::command]
pub async fn play_video(
    db_state: tauri::State<'_, DbState>,
    video_id: Uuid,
) -> Result<(), String> {
    let pool = db_state.get_pool()?;

    let file_path = sqlx::query_scalar::<_, String>("SELECT file_path FROM videos WHERE id = $1")
        .bind(video_id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| format!("Couldn't look up this video: {e}"))?
        .ok_or_else(|| "This video doesn't exist.".to_string())?;

    if !Path::new(&file_path).is_file() {
        return Err(format!("File is missing on disk: {file_path}"));
    }

    // --new-window: separate window (verified celluloid man page)
    // --mpv-fs=yes: fullscreen via mpv
    // --mpv-save-position-on-quit=yes: resume position (mpv option)
    Command::new("celluloid")
        .args([
            "--new-window",
            "--mpv-fs=yes",
            "--mpv-save-position-on-quit=yes",
            &file_path,
        ])
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| {
            format!("Couldn't run celluloid (is it installed and on PATH?): {e}")
        })?;

    if let Err(e) = mark_video_watched(&pool, video_id, true).await {
        eprintln!("play_video: opened player but couldn't mark watched: {e}");
    }

    Ok(())
}

#[derive(Serialize)]
pub struct WatchedGroup {
    date: String,
    videos: Vec<VideoCard>,
}

#[tauri::command]
pub async fn get_watched_videos(
    db_state: tauri::State<'_, DbState>,
) -> Result<Vec<WatchedGroup>, String> {
    let pool = db_state.get_pool()?;

    #[derive(sqlx::FromRow)]
    struct Row {
        id: Uuid,
        title: String,
        thumbnail_path: Option<String>,
        duration_seconds: Option<f32>,
        size_bytes: i64,
        created_at: chrono::DateTime<chrono::Utc>,
        watched_at: chrono::DateTime<chrono::Utc>,
        in_watchlist: bool,
    }

    let rows = sqlx::query_as::<_, Row>(
        "SELECT id, title, thumbnail_path, duration_seconds, size_bytes, created_at, watched_at, in_watchlist
         FROM videos
         WHERE watched = true AND watched_at IS NOT NULL AND is_deleted = false
         ORDER BY watched_at DESC",
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Couldn't fetch watched videos: {e}"))?;

    let mut groups: Vec<WatchedGroup> = Vec::new();
    for row in rows {
        let date = row.watched_at.format("%Y-%m-%d").to_string();
        let card = VideoCard {
            id: row.id,
            title: row.title,
            thumbnail_path: row.thumbnail_path,
            duration_seconds: row.duration_seconds,
            size_bytes: row.size_bytes,
            created_at: row.created_at,
            in_watchlist: row.in_watchlist,
        };

        match groups.last_mut() {
            Some(group) if group.date == date => group.videos.push(card),
            _ => groups.push(WatchedGroup {
                date,
                videos: vec![card],
            }),
        }
    }

    Ok(groups)
}

#[tauri::command]
pub async fn set_video_watchlist(
    db_state: tauri::State<'_, DbState>,
    video_id: Uuid,
    in_watchlist: bool,
) -> Result<(), String> {
    let pool = db_state.get_pool()?;

    let result = sqlx::query("UPDATE videos SET in_watchlist = $1 WHERE id = $2")
        .bind(in_watchlist)
        .bind(video_id)
        .execute(&pool)
        .await
        .map_err(|e| format!("Couldn't update watchlist: {e}"))?;

    if result.rows_affected() == 0 {
        return Err("This video doesn't exist.".to_string());
    }

    Ok(())
}

#[tauri::command]
pub async fn get_watchlist_videos(
    db_state: tauri::State<'_, DbState>,
) -> Result<Vec<VideoCard>, String> {
    let pool = db_state.get_pool()?;

    sqlx::query_as::<_, VideoCard>(
        "SELECT id, title, thumbnail_path, duration_seconds, size_bytes, created_at, in_watchlist
         FROM videos
         WHERE in_watchlist = true AND is_deleted = false AND watched = false
         ORDER BY created_at DESC",
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Couldn't fetch watchlist: {e}"))
}

#[tauri::command]
pub async fn move_video_to_trash(
    db_state: tauri::State<'_, DbState>,
    video_id: Uuid,
) -> Result<(), String> {
    let pool = db_state.get_pool()?;

    let file_path = sqlx::query_scalar::<_, String>("SELECT file_path FROM videos WHERE id = $1")
        .bind(video_id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| format!("Couldn't look up this video: {e}"))?
        .ok_or_else(|| "This video doesn't exist.".to_string())?;

    let path_for_trash = file_path.clone();
    tokio::task::spawn_blocking(move || trash::delete(&path_for_trash))
        .await
        .map_err(|e| format!("Trash task panicked: {e}"))?
        .map_err(|e| format!("Couldn't move '{file_path}' to the trash: {e}"))?;

    let result = sqlx::query("UPDATE videos SET is_deleted = true, deleted_at = now() WHERE id = $1")
        .bind(video_id)
        .execute(&pool)
        .await
        .map_err(|e| {
            format!("The file was moved to trash, but updating the database failed: {e}")
        })?;

    if result.rows_affected() == 0 {
        return Err(
            "The file was moved to trash, but this video's database record was missing."
                .to_string(),
        );
    }

    Ok(())
}

#[derive(Serialize)]
pub struct DeletedGroup {
    month: String,
    videos: Vec<VideoCard>,
}

#[tauri::command]
pub async fn get_deleted_videos(
    db_state: tauri::State<'_, DbState>,
) -> Result<Vec<DeletedGroup>, String> {
    let pool = db_state.get_pool()?;

    #[derive(sqlx::FromRow)]
    struct Row {
        id: Uuid,
        title: String,
        thumbnail_path: Option<String>,
        duration_seconds: Option<f32>,
        size_bytes: i64,
        created_at: chrono::DateTime<chrono::Utc>,
        in_watchlist: bool,
        deleted_at: chrono::DateTime<chrono::Utc>,
    }

    let rows = sqlx::query_as::<_, Row>(
        "SELECT id, title, thumbnail_path, duration_seconds, size_bytes, created_at, in_watchlist, deleted_at
         FROM videos
         WHERE is_deleted = true AND deleted_at IS NOT NULL
         ORDER BY deleted_at DESC",
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Couldn't fetch deleted videos: {e}"))?;

    let mut groups: Vec<DeletedGroup> = Vec::new();
    for row in rows {
        let month = row.deleted_at.format("%Y-%m").to_string();
        let card = VideoCard {
            id: row.id,
            title: row.title,
            thumbnail_path: row.thumbnail_path,
            duration_seconds: row.duration_seconds,
            size_bytes: row.size_bytes,
            created_at: row.created_at,
            in_watchlist: row.in_watchlist,
        };

        match groups.last_mut() {
            Some(group) if group.month == month => group.videos.push(card),
            _ => groups.push(DeletedGroup {
                month,
                videos: vec![card],
            }),
        }
    }

    Ok(groups)
}