use crate::config::{read_config, write_config, AppConfig};
use crate::db::DbState;
use sqlx::postgres::PgPoolOptions;
use tauri::{AppHandle, Manager};

#[derive(serde::Serialize)]
pub struct SettingsResult {
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
pub async fn update_settings(
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
            Err(e) => {
                return Ok(SettingsResult::err(format!("Couldn't connect to that database: {e}")))
            }
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
pub fn get_config(app: tauri::AppHandle) -> AppConfig {
    read_config(&app)
}

/// Attempts to reconnect to the DB on startup using the saved config, so the
/// user doesn't have to revisit Settings every launch just to reconnect.
/// Deliberately does NOT run migrations here — that stays an
/// `update_settings`-only action — and deliberately does NOT fail loudly:
/// if the DB is unreachable at launch (e.g. laptop closed, DB temporarily
/// down), the app should still open and just fall back to disk-only
/// behavior, same as if the user had never enabled the DB at all.
///
/// NOTE (carried over unchanged from the original file): this gates on
/// `config.use_thumbnails`, not a "database enabled" flag. That looks like
/// it may have been meant to read a different field — worth double
/// checking against `config.rs` since as written, turning thumbnails off
/// will also skip reconnecting to the DB on startup.
pub async fn connect_on_startup(app: &AppHandle) {
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
