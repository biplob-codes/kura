use tauri::Manager;
use std::{fs};
use serde::{Deserialize, Serialize};
#[derive(Default, Debug, Serialize, Deserialize)]
pub struct AppConfig {
   pub inbox: String,
  pub  library: String,
    #[serde(default)]
  pub  generate_thumbnails: bool,
    #[serde(default)]
  pub  thumbnail_percent: f32,
}

fn config_path(app: &tauri::AppHandle) -> std::path::PathBuf {
    let dir = app
        .path()
        .app_config_dir()
        .expect("failed to resolve app config dir");
    fs::create_dir_all(&dir).unwrap();
    dir.join("config.toml")
}

pub fn read_config(app: &tauri::AppHandle) -> AppConfig {
    let path = config_path(app);
    if !path.exists() {
        let default_config = AppConfig::default();
        let toml_write = toml::to_string_pretty(&default_config).unwrap();
        fs::write(&path, toml_write).unwrap();
    }
    let file = fs::read_to_string(&path).unwrap();
    toml::from_str(&file).unwrap()
}

pub fn write_config(app: &tauri::AppHandle, config: &AppConfig) {
    let path = config_path(app);
    let toml_write = toml::to_string_pretty(config).unwrap();
    fs::write(path, toml_write).unwrap();
}
