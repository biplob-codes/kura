use crate::db::DbState;
use serde::Serialize;
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

/// All four lists are scoped to `watched = false` — this is the "still to
/// watch" home feed, so anything already marked watched is excluded at the
/// query level rather than filtered client-side. `is_deleted = false` is
/// there for the same reason: a soft-deleted video shouldn't resurface
/// just because it's also unwatched.
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

/// watched_at is set to now() when marking watched, and cleared back to
/// NULL when un-marking — so it always reflects "currently marked watched
/// since X", not "was ever watched at some point".
#[tauri::command]
pub async fn set_video_watched(
    db_state: tauri::State<'_, DbState>,
    video_id: Uuid,
    watched: bool,
) -> Result<(), String> {
    let pool = db_state.get_pool()?;

    let result = sqlx::query(
        "UPDATE videos
         SET watched = $1, watched_at = CASE WHEN $1 THEN now() ELSE NULL END
         WHERE id = $2",
    )
    .bind(watched)
    .bind(video_id)
    .execute(&pool)
    .await
    .map_err(|e| format!("Couldn't update watched status: {e}"))?;

    if result.rows_affected() == 0 {
        return Err("This video doesn't exist.".to_string());
    }

    Ok(())
}

#[derive(Serialize)]
pub struct WatchedGroup {
    date: String, // "YYYY-MM-DD"
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

    // watched_at IS NOT NULL is redundant with watched = true given how
    // set_video_watched keeps them in sync, but kept explicit here so this
    // query stays correct even if that invariant is ever broken elsewhere
    // (e.g. a manual DB edit, a future bulk-import script).
    let rows = sqlx::query_as::<_, Row>(
        "SELECT id, title, thumbnail_path, duration_seconds, size_bytes, created_at, watched_at, in_watchlist
         FROM videos
         WHERE watched = true AND watched_at IS NOT NULL AND is_deleted = false
         ORDER BY watched_at DESC",
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Couldn't fetch watched videos: {e}"))?;

    // Rows are already sorted by watched_at DESC, so consecutive rows
    // sharing a date land next to each other — a single linear pass is
    // enough to group them, no HashMap or re-sort needed.
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
            _ => groups.push(WatchedGroup { date, videos: vec![card] }),
        }
    }

    Ok(groups)
}

/// Explicit bool rather than a server-side toggle — the frontend already
/// knows the card's current state, so it just tells us what it wants next.
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
/// Sends the actual video file to the OS trash/recycle bin — the user can
/// recover it from there the normal way if this was a mistake. Only the
/// video file is touched: thumbnail_path is never read or moved, so the
/// thumbnail stays exactly where it is on disk and in the DB.
///
/// Note: this does NOT try to undo itself. If a video is trashed and later
/// someone restores the file from the OS trash back to its original path,
/// this row's is_deleted/deleted_at won't automatically flip back — that'd
/// need a separate "restore from trash" flow that isn't built yet.
#[tauri::command]
pub async fn move_video_to_trash(
    db_state: tauri::State<'_, DbState>,
    video_id: Uuid,
) -> Result<(), String> {
    let pool = db_state.get_pool()?;

    // Need the file path before we can do anything with it.
    let file_path = sqlx::query_scalar::<_, String>("SELECT file_path FROM videos WHERE id = $1")
        .bind(video_id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| format!("Couldn't look up this video: {e}"))?
        .ok_or_else(|| "This video doesn't exist.".to_string())?;

    // trash::delete talks to OS-specific APIs (Shell32 on Windows, NSFileManager
    // on macOS, the freedesktop trash spec on Linux) and blocks while it does —
    // run it on a blocking thread so it doesn't stall the async runtime.
    let path_for_trash = file_path.clone();
    tokio::task::spawn_blocking(move || trash::delete(&path_for_trash))
        .await
        .map_err(|e| format!("Trash task panicked: {e}"))?
        .map_err(|e| format!("Couldn't move '{file_path}' to the trash: {e}"))?;

    // File is already gone from its original location at this point — if
    // this UPDATE fails, the DB is now out of sync with reality (file
    // trashed, but is_deleted still false). Worth surfacing clearly if it
    // ever happens rather than a generic error.
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
    month: String, // "YYYY-MM"
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

    // Rows are already sorted by deleted_at DESC, so a single linear pass
    // groups them by month — same approach as get_watched_videos.
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
            _ => groups.push(DeletedGroup { month, videos: vec![card] }),
        }
    }

    Ok(groups)
}