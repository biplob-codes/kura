use std::{fs, path::Path};
use serde::Serialize;
mod server;
mod config;
use config::{AppConfig, read_config, write_config};
use tauri::AppHandle;
use sqlx::postgres::{PgPool, PgPoolOptions};
use uuid::Uuid;

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

impl DbState {
    fn get_pool(&self) -> Result<PgPool, String> {
        self.0
            .lock()
            .unwrap()
            .clone()
            .ok_or_else(|| "Database is not connected. Enable it in Settings first.".to_string())
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

    // Fixed: match on the Result directly instead of `?`-unwrapping it first.
    // No DB connected is a valid state here (id = None), not a hard error.
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
        Err(_) => None,
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|_app| {
            std::thread::spawn(|| {
                server::main();
            });
            Ok(())
        })
        .manage(DbState(std::sync::Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            get_config,
            update_directories,
            list_files,
            create_folder,
            move_video,
            list_inbox_files,
            update_settings,
            get_library_folders
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}