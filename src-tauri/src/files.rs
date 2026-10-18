use crate::config::{read_config, write_config, AppConfig};
use serde::Serialize;
use tauri::AppHandle;

#[derive(Serialize)]
pub struct File {
    pub name: String,
    pub path: String,
    pub size: u64,
}

fn list_files_sync(path: String) -> Result<Vec<File>, String> {
    let entries = std::fs::read_dir(&path)
        .map_err(|e| format!("Couldn't read directory {path}: {e}"))?;
    let mut files: Vec<File> = vec![];
    for entry in entries {
        let entry = entry.map_err(|e| format!("Couldn't read a directory entry: {e}"))?;
        let name = entry.file_name().to_string_lossy().into_owned();
        let entry_path = entry.path().to_string_lossy().into_owned();
        let size = entry
            .metadata()
            .map_err(|e| format!("Couldn't read metadata for {name}: {e}"))?
            .len();
        files.push(File {
            name,
            path: entry_path,
            size,
        });
    }
    Ok(files)
}

#[tauri::command]
pub async fn list_files(path: String) -> Result<Vec<File>, String> {
    tokio::task::spawn_blocking(move || list_files_sync(path))
        .await
        .map_err(|e| format!("list_files task panicked: {e}"))?
}

#[tauri::command]
pub async fn move_video(old: String, new: String) -> Result<(), String> {
    tokio::task::spawn_blocking(move || {
        std::fs::rename(&old, &new)
            .map_err(|e| format!("Couldn't move {old} to {new}: {e}"))
    })
    .await
    .map_err(|e| format!("move_video task panicked: {e}"))?
}

#[tauri::command]
pub async fn list_inbox_files(app: AppHandle) -> Result<Vec<File>, String> {
    let conf = read_config(&app);
    let inbox = conf.inbox;
    tokio::task::spawn_blocking(move || list_files_sync(inbox))
        .await
        .map_err(|e| format!("list_inbox_files task panicked: {e}"))?
}

#[tauri::command]
pub async fn update_directories(
    app: AppHandle,
    folder: String,
    folder_path: String,
) -> AppConfig {
    tokio::task::spawn_blocking(move || {
        let mut conf = read_config(&app);
        match folder.as_str() {
            "inbox" => conf.inbox = folder_path,
            "library" => conf.library = folder_path,
            _ => println!("Unknown directory folder."),
        }
        write_config(&app, &conf);
        conf
    })
    .await
    .expect("update_directories task panicked")
}