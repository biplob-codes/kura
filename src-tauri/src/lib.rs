use std::fs;

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

#[tauri::command]
fn create_email(name: &str) -> String {
    format!("Your email is: {}@gmail.com", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![list_files, create_email])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
