use std::{fs, path::Path};
use toml;
use serde::{Deserialize, Serialize};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn list_files() -> Result<Vec<String>, String> {
    let mut files = Vec::new();

    for entry in
        fs::read_dir("/mnt/entertainment/Library/Little Caprice").map_err(|e| e.to_string())?
    {
        let entry = entry.map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().into_owned();
        files.push(name);
    }
    Ok(files)
}
#[derive(Default,Debug,Serialize,Deserialize)]
struct Directories{
    inbox:String,
    library:String
}

#[tauri::command]
fn get_directories() -> Directories {
    let path="config.toml";
    if !Path::new(path).exists(){
        let default_directories=Directories::default();
        //Change the unwrap to more robust error handling
        let toml_write=toml::to_string_pretty(&default_directories).unwrap();
        fs::write(path,toml_write).unwrap();

    }
    let file=fs::read_to_string(path).unwrap();
    let directories:Directories=toml::from_str(&file).unwrap();
    directories
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![list_files,get_directories])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
