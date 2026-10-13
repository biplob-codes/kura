use crate::db::DbState;
use serde::Serialize;
use uuid::Uuid;

#[derive(Serialize, sqlx::FromRow)]
pub struct Model {
    pub id: Uuid,
    pub name: String,
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
pub async fn get_models(db_state: tauri::State<'_, DbState>) -> Result<Vec<Model>, String> {
    let pool = db_state.get_pool()?;
    sqlx::query_as::<_, Model>("SELECT id, name FROM models ORDER BY name")
        .fetch_all(&pool)
        .await
        .map_err(|e| format!("Couldn't fetch models: {e}"))
}