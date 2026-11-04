use crate::db::DbState;
use crate::models::Model;
use crate::tags::Tag;
use serde::Serialize;
use std::collections::HashMap;
use std::path::Path;
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
        "SELECT id, title, thumbnail_path, duration_seconds, size_bytes, created_at
         FROM videos WHERE watched = false AND is_deleted = false
         ORDER BY created_at DESC LIMIT 12",
    )
    .fetch_all(&pool);

    let oldest_q = sqlx::query_as::<_, VideoCard>(
        "SELECT id, title, thumbnail_path, duration_seconds, size_bytes, created_at
         FROM videos WHERE watched = false AND is_deleted = false
         ORDER BY created_at ASC LIMIT 12",
    )
    .fetch_all(&pool);

    let biggest_q = sqlx::query_as::<_, VideoCard>(
        "SELECT id, title, thumbnail_path, duration_seconds, size_bytes, created_at
         FROM videos WHERE watched = false AND is_deleted = false
         ORDER BY size_bytes DESC LIMIT 12",
    )
    .fetch_all(&pool);

    let smallest_q = sqlx::query_as::<_, VideoCard>(
        "SELECT id, title, thumbnail_path, duration_seconds, size_bytes, created_at
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

/// Open the video with the system default player and record it in play history.
/// Does NOT mark the video as watched / completed.
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

    tauri_plugin_opener::open_path(&file_path, None::<&str>).map_err(|e| {
        format!("Couldn't open video with the default player: {e}")
    })?;

    if let Err(e) = sqlx::query("UPDATE videos SET last_played_at = now() WHERE id = $1")
        .bind(video_id)
        .execute(&pool)
        .await
    {
        eprintln!("play_video: opened player but couldn't record history: {e}");
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
    }

    let rows = sqlx::query_as::<_, Row>(
        "SELECT id, title, thumbnail_path, duration_seconds, size_bytes, created_at, watched_at
         FROM videos
         WHERE watched = true AND watched_at IS NOT NULL
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

/// Clear play history for a video (does not delete the file or change watched).
#[tauri::command]
pub async fn remove_from_history(
    db_state: tauri::State<'_, DbState>,
    video_id: Uuid,
) -> Result<(), String> {
    let pool = db_state.get_pool()?;

    let result = sqlx::query("UPDATE videos SET last_played_at = NULL WHERE id = $1")
        .bind(video_id)
        .execute(&pool)
        .await
        .map_err(|e| format!("Couldn't remove from history: {e}"))?;

    if result.rows_affected() == 0 {
        return Err("This video doesn't exist.".to_string());
    }

    Ok(())
}

/// Mark watched, move file to system trash, soft-delete. Used from History menu.
#[tauri::command]
pub async fn complete_and_trash_video(
    db_state: tauri::State<'_, DbState>,
    video_id: Uuid,
) -> Result<(), String> {
    let pool = db_state.get_pool()?;

    mark_video_watched(&pool, video_id, true).await?;

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

    let result = sqlx::query(
        "UPDATE videos
         SET is_deleted = true, deleted_at = now(), last_played_at = NULL
         WHERE id = $1",
    )
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
        deleted_at: chrono::DateTime<chrono::Utc>,
    }

    let rows = sqlx::query_as::<_, Row>(
        "SELECT id, title, thumbnail_path, duration_seconds, size_bytes, created_at, deleted_at
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

#[derive(Serialize)]
pub struct HistoryVideo {
    pub id: Uuid,
    pub title: String,
    pub thumbnail_path: Option<String>,
    pub duration_seconds: Option<f32>,
    pub size_bytes: i64,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub last_played_at: chrono::DateTime<chrono::Utc>,
    pub folder_id: Uuid,
    pub folder_name: String,
    pub models: Vec<Model>,
    pub tags: Vec<Tag>,
}

#[derive(Serialize)]
pub struct HistoryGroup {
    date: String,
    videos: Vec<HistoryVideo>,
}

#[tauri::command]
pub async fn get_history_videos(

    db_state: tauri::State<'_, DbState>,
) -> Result<Vec<HistoryGroup>, String> {
    let pool = db_state.get_pool()?;

    #[derive(sqlx::FromRow)]
    struct Row {
        id: Uuid,
        title: String,
        thumbnail_path: Option<String>,
        duration_seconds: Option<f32>,
        size_bytes: i64,
        created_at: chrono::DateTime<chrono::Utc>,
        last_played_at: chrono::DateTime<chrono::Utc>,
        folder_id: Uuid,
        folder_name: String,
    }

    let rows = sqlx::query_as::<_, Row>(
        "SELECT
            v.id,
            v.title,
            v.thumbnail_path,
            v.duration_seconds,
            v.size_bytes,
            v.created_at,
            v.last_played_at,
            v.folder_id,
            f.name AS folder_name
         FROM videos v
         JOIN folders f ON f.id = v.folder_id
         WHERE v.last_played_at IS NOT NULL AND v.is_deleted = false
         ORDER BY v.last_played_at DESC",
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Couldn't fetch history videos: {e}"))?;

    if rows.is_empty() {
        return Ok(Vec::new());
    }

    let video_ids: Vec<Uuid> = rows.iter().map(|r| r.id).collect();

    #[derive(sqlx::FromRow)]
    struct VideoTagRow {
        video_id: Uuid,
        tag_id: Uuid,
        tag_name: String,
    }

    #[derive(sqlx::FromRow)]
    struct VideoModelRow {
        video_id: Uuid,
        model_id: Uuid,
        model_name: String,
    }

    let tag_rows = sqlx::query_as::<_, VideoTagRow>(
        "SELECT vt.video_id, t.id AS tag_id, t.name AS tag_name
         FROM video_tags vt
         JOIN tags t ON t.id = vt.tag_id
         WHERE vt.video_id = ANY($1)
         ORDER BY t.name",
    )
    .bind(&video_ids)
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Couldn't fetch tags: {e}"))?;

    let model_rows = sqlx::query_as::<_, VideoModelRow>(
        "SELECT vm.video_id, m.id AS model_id, m.name AS model_name
         FROM video_models vm
         JOIN models m ON m.id = vm.model_id
         WHERE vm.video_id = ANY($1)
         ORDER BY m.name",
    )
    .bind(&video_ids)
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Couldn't fetch models: {e}"))?;

    let mut tags_by_video: HashMap<Uuid, Vec<Tag>> = HashMap::new();
    for row in tag_rows {
        tags_by_video
            .entry(row.video_id)
            .or_default()
            .push(Tag {
                id: row.tag_id,
                name: row.tag_name,
            });
    }

    let mut models_by_video: HashMap<Uuid, Vec<Model>> = HashMap::new();
    for row in model_rows {
        models_by_video
            .entry(row.video_id)
            .or_default()
            .push(Model {
                id: row.model_id,
                name: row.model_name,
            });
    }

    let mut groups: Vec<HistoryGroup> = Vec::new();
    for row in rows {
        let date = row.last_played_at.format("%Y-%m-%d").to_string();
        let video = HistoryVideo {
            id: row.id,
            title: row.title,
            thumbnail_path: row.thumbnail_path,
            duration_seconds: row.duration_seconds,
            size_bytes: row.size_bytes,
            created_at: row.created_at,
            last_played_at: row.last_played_at,
            folder_id: row.folder_id,
            folder_name: row.folder_name,
            models: models_by_video.remove(&row.id).unwrap_or_default(),
            tags: tags_by_video.remove(&row.id).unwrap_or_default(),
        };

        match groups.last_mut() {
            Some(group) if group.date == date => group.videos.push(video),
            _ => groups.push(HistoryGroup {
                date,
                videos: vec![video],
            }),
        }
    }

    Ok(groups)
}
/// Permanently remove a video: trash the file + thumbnail, then hard-delete the DB row
/// (junction tables cascade). After this the video no longer exists in the library.
#[tauri::command]
pub async fn permanently_delete_video(
    db_state: tauri::State<'_, DbState>,
    video_id: Uuid,
) -> Result<(), String> {
    let pool = db_state.get_pool()?;

    #[derive(sqlx::FromRow)]
    struct Paths {
        file_path: String,
        thumbnail_path: Option<String>,
    }

    let paths = sqlx::query_as::<_, Paths>(
        "SELECT file_path, thumbnail_path FROM videos WHERE id = $1",
    )
    .bind(video_id)
    .fetch_optional(&pool)
    .await
    .map_err(|e| format!("Couldn't look up this video: {e}"))?
    .ok_or_else(|| "This video doesn't exist.".to_string())?;

    // Trash the video file (system recycle bin)
    let path_for_trash = paths.file_path.clone();
    tokio::task::spawn_blocking(move || trash::delete(&path_for_trash))
        .await
        .map_err(|e| format!("Trash task panicked: {e}"))?
        .map_err(|e| format!("Couldn't move '{path}' to the trash: {e}", path = paths.file_path))?;

    // Remove thumbnail from disk if we have one (best-effort)
    if let Some(thumb) = paths.thumbnail_path {
        let thumb_path = thumb.clone();
        let _ = tokio::task::spawn_blocking(move || {
            let p = Path::new(&thumb_path);
            if p.is_file() {
                let _ = std::fs::remove_file(p);
            }
        })
        .await;
    }

    // Hard-delete the row — video_models / video_tags / playlist_videos cascade
    let result = sqlx::query("DELETE FROM videos WHERE id = $1")
        .bind(video_id)
        .execute(&pool)
        .await
        .map_err(|e| {
            format!(
                "The file was moved to trash, but removing the database record failed: {e}"
            )
        })?;

    if result.rows_affected() == 0 {
        return Err(
            "The file was moved to trash, but this video's database record was missing."
                .to_string(),
        );
    }

    Ok(())
}
/// Move a video into another library folder: rename the file on disk and update folder_id + file_path.
#[tauri::command]
pub async fn move_video_to_folder(
    db_state: tauri::State<'_, DbState>,
    video_id: Uuid,
    folder_id: Uuid,
) -> Result<(), String> {
    let pool = db_state.get_pool()?;

    #[derive(sqlx::FromRow)]
    struct VideoRow {
        file_path: String,
        folder_id: Uuid,
    }

    let video = sqlx::query_as::<_, VideoRow>(
        "SELECT file_path, folder_id FROM videos WHERE id = $1",
    )
    .bind(video_id)
    .fetch_optional(&pool)
    .await
    .map_err(|e| format!("Couldn't look up this video: {e}"))?
    .ok_or_else(|| "This video doesn't exist.".to_string())?;

    if video.folder_id == folder_id {
        return Ok(());
    }

    let dest_path = sqlx::query_scalar::<_, String>("SELECT path FROM folders WHERE id = $1")
        .bind(folder_id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| format!("Couldn't look up the destination folder: {e}"))?
        .ok_or_else(|| "That folder doesn't exist.".to_string())?;

    let src = Path::new(&video.file_path);
    if !src.is_file() {
        return Err(format!("File is missing on disk: {}", video.file_path));
    }

    let file_name = src
        .file_name()
        .ok_or_else(|| "Couldn't read the video file name.".to_string())?
        .to_string_lossy()
        .into_owned();

    let dest_dir = Path::new(&dest_path);
    if !dest_dir.is_dir() {
        tokio::task::spawn_blocking({
            let dest_dir = dest_dir.to_path_buf();
            move || std::fs::create_dir_all(&dest_dir)
        })
        .await
        .map_err(|e| format!("create_dir task panicked: {e}"))?
        .map_err(|e| format!("Couldn't create destination folder on disk: {e}"))?;
    }

    // Avoid overwriting an existing file with the same name
    let mut dest = dest_dir.join(&file_name);
    if dest.exists() {
        let stem = src
            .file_stem()
            .map(|s| s.to_string_lossy().into_owned())
            .unwrap_or_else(|| "video".to_string());
        let ext = src
            .extension()
            .map(|e| format!(".{}", e.to_string_lossy()))
            .unwrap_or_default();
        let unique = format!("{stem}-{}{}", Uuid::new_v4().simple(), ext);
        dest = dest_dir.join(unique);
    }

    let old_path = video.file_path.clone();
    let new_path = dest.to_string_lossy().into_owned();
    let new_path_for_fs = new_path.clone();

    tokio::task::spawn_blocking(move || std::fs::rename(&old_path, &new_path_for_fs))
        .await
        .map_err(|e| format!("move task panicked: {e}"))?
        .map_err(|e| format!("Couldn't move the file on disk: {e}"))?;

    let result = sqlx::query(
        "UPDATE videos SET folder_id = $1, file_path = $2 WHERE id = $3",
    )
    .bind(folder_id)
    .bind(&new_path)
    .bind(video_id)
    .execute(&pool)
    .await
    .map_err(|e| {
        format!("File was moved, but updating the database failed: {e}")
    })?;

    if result.rows_affected() == 0 {
        return Err(
            "File was moved, but this video's database record was missing.".to_string(),
        );
    }

    Ok(())
}