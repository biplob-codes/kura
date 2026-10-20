use crate::config::read_config;
use crate::db::DbState;
use crate::models::Model;
use crate::tags::Tag;
use crate::video::{Video, VideoCard};
use serde::Serialize;
use std::{collections::HashMap, fs, path::Path};
use uuid::Uuid;

#[derive(Serialize)]
pub struct Folder {
    pub id: Option<Uuid>,
    pub name: String,
    pub path: String,
}

#[tauri::command]
pub async fn create_folder(
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
pub async fn get_library_folders(db_state: tauri::State<'_, DbState>) -> Result<Vec<Folder>, String> {
    let pool = db_state.get_pool()?;

    #[derive(sqlx::FromRow)]
    struct FolderRow {
        id: Uuid,
        name: String,
        path: String,
    }

    let rows = sqlx::query_as::<_, FolderRow>("SELECT id, name, path FROM folders ORDER BY name")
        .fetch_all(&pool)
        .await
        .map_err(|e| format!("Couldn't fetch folders: {e}"))?;

    Ok(rows
        .into_iter()
        .map(|r| Folder { id: Some(r.id), name: r.name, path: r.path })
        .collect())
}

#[derive(Serialize, sqlx::FromRow)]
pub struct FolderCard {
    pub id: Uuid,
    pub name: String,
    pub thumbnail_path: Option<String>,
    pub video_count: i64,
}

/// Both the preview thumbnail (picked via LATERAL) and the video count are
/// scoped to `watched = false`. This is the "what's left to watch" folder
/// browser, so already-watched videos neither count toward the folder's
/// total nor get picked as its cover image.
#[tauri::command]
pub async fn get_folders(db_state: tauri::State<'_, DbState>) -> Result<Vec<FolderCard>, String> {
    let pool = db_state.get_pool()?;

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
             WHERE folder_id = f.id AND thumbnail_path IS NOT NULL AND watched = false
             ORDER BY random()
             LIMIT 1
         ) v ON true
         LEFT JOIN LATERAL (
             SELECT COUNT(*) AS video_count
             FROM videos
             WHERE folder_id = f.id AND watched = false
         ) vc ON true
         ORDER BY f.name",
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Couldn't fetch folders: {e}"))
}

#[derive(Serialize)]
pub struct FolderVideosResponse {
    folder_name: String,
    videos: Vec<VideoCard>,
}

#[tauri::command]
pub async fn get_folder_videos(
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
         WHERE folder_id = $1 AND watched = false AND is_deleted = false
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

#[derive(Serialize)]
pub struct VideoWithTags {
    #[serde(flatten)]
    video: Video,
    tags: Vec<Tag>,
    models: Vec<Model>,
}

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

#[derive(Serialize)]
pub struct FolderSiblingsResponse {
    folder_name: String,
    videos: Vec<VideoWithTags>,
}

/// Given a video's id, finds which folder it lives in and returns every
/// *unwatched* video in that same folder (siblings) with their tags
/// attached, plus the folder's name.
#[tauri::command]
pub async fn get_folder_siblings(
    db_state: tauri::State<'_, DbState>,
    video_id: Uuid,
) -> Result<FolderSiblingsResponse, String> {
    let pool = db_state.get_pool()?;

    // Have to know the folder before anything else — this lookup is a
    // dependency, not something that can run concurrently with the rest.
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
         WHERE folder_id = $1 AND watched = false
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

    // One query for every video's tags, rather than one query per video.
    // If the folder is empty, video_ids is empty and `= ANY($1)` just
    // matches nothing — no special-casing needed.
    let video_ids: Vec<Uuid> = videos.iter().map(|v| v.id).collect();
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

    let videos_with_tags = videos
        .into_iter()
        .map(|video| {
            let tags = tags_by_video.remove(&video.id).unwrap_or_default();
            let models = models_by_video.remove(&video.id).unwrap_or_default();
            VideoWithTags {
                video,
                tags,
                models,
            }
        })
        .collect();

    Ok(FolderSiblingsResponse {
        folder_name,
        videos: videos_with_tags,
    })
}