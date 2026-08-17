use crate::config::{read_config, write_config, AppConfig};
use serde::Serialize;
use std::fs;
use tauri::AppHandle;

#[derive(Serialize)]
pub struct File {
    pub name: String,
    pub path: String,
    pub size: u64,
}

#[tauri::command]
pub fn list_files(path: String) -> Result<Vec<File>, String> {
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
pub fn move_video(old: String, new: String) -> Result<(), String> {
    println!("FROM SERVER: {old} ----- {new}");
    fs::rename(&old, &new).map_err(|e| format!("Couldn't move {old} to {new}: {e}"))
}

#[tauri::command]
pub fn list_inbox_files(app: AppHandle) -> Result<Vec<File>, String> {
    let conf = read_config(&app);
    list_files(conf.inbox)
}

#[tauri::command]
pub fn update_directories(app: AppHandle, folder: &str, folder_path: &str) -> AppConfig {
    let mut conf = read_config(&app);
    match folder {
        "inbox" => conf.inbox = folder_path.to_string(),
        "library" => conf.library = folder_path.to_string(),
        _ => println!("Unknown directory folder."),
    }
    write_config(&app, &conf);
    conf
}
