use crate::db::DbState;
use crate::video::VideoCard;
use serde::Serialize;
use uuid::Uuid;

#[derive(Serialize, sqlx::FromRow)]
pub struct Playlist {
    pub id: Uuid,
    pub name: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub video_count: i64,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct PlaylistDetail {
    pub id: Uuid,
    pub name: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[tauri::command]
pub async fn create_playlist(
    db_state: tauri::State<'_, DbState>,
    name: String,
) -> Result<Playlist, String> {
    let name = name.trim().to_string();
    if name.is_empty() {
        return Err("Playlist name can't be empty.".to_string());
    }

    let pool = db_state.get_pool()?;
    let id = Uuid::new_v4();

    sqlx::query_as::<_, Playlist>(
        "INSERT INTO playlists (id, name)
         VALUES ($1, $2)
         RETURNING id, name, created_at, 0::bigint AS video_count",
    )
    .bind(id)
    .bind(&name)
    .fetch_one(&pool)
    .await
    .map_err(|e| format!("Couldn't create playlist: {e}"))
}

#[tauri::command]
pub async fn get_playlists(
    db_state: tauri::State<'_, DbState>,
) -> Result<Vec<Playlist>, String> {
    let pool = db_state.get_pool()?;

    sqlx::query_as::<_, Playlist>(
        "SELECT p.id, p.name, p.created_at,
                COUNT(pv.video_id)::bigint AS video_count
         FROM playlists p
         LEFT JOIN playlist_videos pv ON pv.playlist_id = p.id
         GROUP BY p.id, p.name, p.created_at
         ORDER BY p.created_at DESC",
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Couldn't fetch playlists: {e}"))
}

#[tauri::command]
pub async fn get_playlist(
    db_state: tauri::State<'_, DbState>,
    playlist_id: Uuid,
) -> Result<PlaylistDetail, String> {
    let pool = db_state.get_pool()?;

    sqlx::query_as::<_, PlaylistDetail>(
        "SELECT id, name, created_at FROM playlists WHERE id = $1",
    )
    .bind(playlist_id)
    .fetch_optional(&pool)
    .await
    .map_err(|e| format!("Couldn't fetch playlist: {e}"))?
    .ok_or_else(|| "This playlist doesn't exist.".to_string())
}

#[tauri::command]
pub async fn get_playlist_videos(
    db_state: tauri::State<'_, DbState>,
    playlist_id: Uuid,
) -> Result<Vec<VideoCard>, String> {
    let pool = db_state.get_pool()?;

    sqlx::query_as::<_, VideoCard>(
        "SELECT v.id, v.title, v.thumbnail_path, v.duration_seconds,
                v.size_bytes, v.created_at
         FROM playlist_videos pv
         JOIN videos v ON v.id = pv.video_id
         WHERE pv.playlist_id = $1
           AND v.is_deleted = false
         ORDER BY pv.added_at DESC",
    )
    .bind(playlist_id)
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Couldn't fetch playlist videos: {e}"))
}

#[tauri::command]
pub async fn add_video_to_playlist(
    db_state: tauri::State<'_, DbState>,
    playlist_id: Uuid,
    video_id: Uuid,
) -> Result<(), String> {
    let pool = db_state.get_pool()?;

    let result = sqlx::query(
        "INSERT INTO playlist_videos (playlist_id, video_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING",
    )
    .bind(playlist_id)
    .bind(video_id)
    .execute(&pool)
    .await
    .map_err(|e| format!("Couldn't add video to playlist: {e}"))?;

    // rows_affected == 0 means it was already in the playlist — that's fine
    let _ = result;

    Ok(())
}

#[tauri::command]
pub async fn remove_video_from_playlist(
    db_state: tauri::State<'_, DbState>,
    playlist_id: Uuid,
    video_id: Uuid,
) -> Result<(), String> {
    let pool = db_state.get_pool()?;

    sqlx::query("DELETE FROM playlist_videos WHERE playlist_id = $1 AND video_id = $2")
        .bind(playlist_id)
        .bind(video_id)
        .execute(&pool)
        .await
        .map_err(|e| format!("Couldn't remove video from playlist: {e}"))?;

    Ok(())
}

#[tauri::command]
pub async fn get_video_playlist_ids(
    db_state: tauri::State<'_, DbState>,
    video_id: Uuid,
) -> Result<Vec<Uuid>, String> {
    let pool = db_state.get_pool()?;

    sqlx::query_scalar::<_, Uuid>(
        "SELECT playlist_id FROM playlist_videos WHERE video_id = $1",
    )
    .bind(video_id)
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Couldn't fetch video playlists: {e}"))
}