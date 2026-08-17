use crate::db::DbState;
use serde::Serialize;
use uuid::Uuid;

#[derive(Serialize, sqlx::FromRow)]
pub struct Tag {
    pub id: Uuid,
    pub name: String,
}

#[tauri::command]
pub async fn create_tag(db_state: tauri::State<'_, DbState>, name: String) -> Result<Tag, String> {
    let pool = db_state.get_pool()?;
    let id = Uuid::new_v4();
    sqlx::query_as::<_, Tag>("INSERT INTO tags (id, name) VALUES ($1, $2) RETURNING id, name")
        .bind(id)
        .bind(&name)
        .fetch_one(&pool)
        .await
        .map_err(|e| format!("Couldn't create tag: {e}"))
}

#[tauri::command]
pub async fn get_tags(db_state: tauri::State<'_, DbState>) -> Result<Vec<Tag>, String> {
    let pool = db_state.get_pool()?;
    sqlx::query_as::<_, Tag>("SELECT id, name FROM tags ORDER BY name")
        .fetch_all(&pool)
        .await
        .map_err(|e| format!("Couldn't fetch tags: {e}"))
}
