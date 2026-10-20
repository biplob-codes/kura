use crate::db::DbState;
use serde::Serialize;
use uuid::Uuid;

#[derive(Serialize, sqlx::FromRow)]
pub struct Model {
    pub id: Uuid,
    pub name: String,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct ModelCard {
    pub id: Uuid,
    pub name: String,
    pub thumbnail_path: Option<String>,
    pub video_count: i64,
}

#[tauri::command]
pub async fn create_model(db_state: tauri::State<'_, DbState>, name: String) -> Result<Model, String> {
    let pool = db_state.get_pool()?;
    let id = Uuid::new_v4();
    sqlx::query_as::<_, Model>("INSERT INTO models (id, name) VALUES ($1, $2) RETURNING id, name")
        .bind(id)
        .bind(&name)
        .fetch_one(&pool)
        .await
        .map_err(|e| format!("Couldn't create model: {e}"))
}

#[tauri::command]
pub async fn get_models(db_state: tauri::State<'_, DbState>) -> Result<Vec<ModelCard>, String> {
    let pool = db_state.get_pool()?;

    sqlx::query_as::<_, ModelCard>(
        "SELECT
            m.id,
            m.name,
            v.thumbnail_path,
            COALESCE(vc.video_count, 0) AS video_count
         FROM models m
         LEFT JOIN LATERAL (
             SELECT vid.thumbnail_path
             FROM video_models vm
             JOIN videos vid ON vid.id = vm.video_id
             WHERE vm.model_id = m.id
               AND vid.thumbnail_path IS NOT NULL
               AND vid.watched = false
               AND vid.is_deleted = false
             ORDER BY random()
             LIMIT 1
         ) v ON true
         LEFT JOIN LATERAL (
             SELECT COUNT(*) AS video_count
             FROM video_models vm
             JOIN videos vid ON vid.id = vm.video_id
             WHERE vm.model_id = m.id
               AND vid.watched = false
               AND vid.is_deleted = false
         ) vc ON true
         ORDER BY m.name",
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Couldn't fetch models: {e}"))
}
use crate::video::VideoCard;

#[derive(Serialize)]
pub struct ModelVideosResponse {
    pub model_name: String,
    pub videos: Vec<VideoCard>,
}

#[tauri::command]
pub async fn get_model_videos(
    db_state: tauri::State<'_, DbState>,
    model_id: Uuid,
) -> Result<ModelVideosResponse, String> {
    let pool = db_state.get_pool()?;

    let name_q = sqlx::query_scalar::<_, String>("SELECT name FROM models WHERE id = $1")
        .bind(model_id)
        .fetch_optional(&pool);

        let videos_q = sqlx::query_as::<_, VideoCard>(
        "SELECT v.id, v.title, v.thumbnail_path, v.duration_seconds, v.size_bytes, v.created_at
         FROM videos v
         JOIN video_models vm ON vm.video_id = v.id
         WHERE vm.model_id = $1
           AND v.watched = false
           AND v.is_deleted = false
         ORDER BY v.created_at DESC",
    )
    .bind(model_id)
    .fetch_all(&pool);

    let (name_result, videos_result) = tokio::join!(name_q, videos_q);

    let model_name = name_result
        .map_err(|e| format!("Couldn't look up this model: {e}"))?
        .ok_or_else(|| "This model doesn't exist.".to_string())?;

    let videos =
        videos_result.map_err(|e| format!("Couldn't fetch videos for this model: {e}"))?;

    Ok(ModelVideosResponse { model_name, videos })
}