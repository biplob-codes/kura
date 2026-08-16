use std::{fs, path::Path, vec};
use serde::{ Serialize};
mod server;
mod config;
use config::{AppConfig,read_config,write_config};
use tauri::AppHandle;
use sqlx::postgres::{PgPool, PgPoolOptions};
pub struct DbState(pub std::sync::Mutex<Option<PgPool>>);
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

#[tauri::command]
fn update_directories(app: AppHandle, folder: &str, folder_path: &str)-> AppConfig {
    let mut conf = read_config(&app);
    match folder {
        "inbox" => conf.inbox = folder_path.to_string(),
        "library" => conf.library = folder_path.to_string(),
        _ => println!("Unknown directory folder."),
    }
    write_config(&app, &conf);
    conf
}


#[tauri::command]
fn create_folder(app:AppHandle,name:&str)->Folder{
    let conf=get_config(app);
    let path=Path::new(&conf.library).join(&name);
    fs::create_dir_all(&path).unwrap();
    let folder=Folder{name:name.to_string(),path:path.to_string_lossy().into_owned()};
    return folder;
 }

#[derive(Serialize)]
struct Folder{
 name:String,
 path:String
}

#[tauri::command]
fn list_folders(app:AppHandle,dir:&str)->Vec<Folder>{
    let conf=get_config(app);
    match dir{
        "inbox"=>{
            get_folders(conf.inbox)
        },
        "library"=>{
            get_folders(conf.library)
        },
        _ =>{
            println!("Unknown directory");
            Vec::<Folder>::new()
        }
    }
}
fn get_folders(dir:String)->Vec<Folder>{
     let mut folders:Vec<Folder>=vec![];
    let entries=fs::read_dir(dir).unwrap();
    for entry in entries{
        let entry=entry.unwrap();
        if entry.path().is_dir(){
            let name=entry.file_name().to_string_lossy().into_owned();
            let path=entry.path().to_string_lossy().into_owned();
            let folder=Folder{name,path};
            folders.push(folder);
        }
    }
    folders
}

#[derive(Serialize)]
struct File{
    name:String,
    path:String,
    size:u64
}
#[tauri::command]
fn list_files(path:String)->Vec<File>{
    let entries=fs::read_dir(path).unwrap();
    let mut files:Vec<File>=vec![];
    for entry in entries{
        let entry=entry.unwrap();
        let name=entry.file_name().to_string_lossy().into_owned();
        let path=entry.path().to_string_lossy().into_owned();
        let size=entry.metadata().unwrap().len();
        let file=File{name,path,size};
        files.push(file);
    }
    files
}
#[tauri::command]
fn move_video(old:String,new:String){
    println!("FROM SERVER: {} ----- {}",old,new);
    fs::rename(old, new).unwrap();
}
#[tauri::command]
fn list_inbox_files(app:AppHandle)->Vec<File>{
    let conf=get_config(app);
    list_files(conf.inbox)
}
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init()).setup(|_app|{
            std::thread::spawn(||{
                server::main();
            });
            Ok(())
        }).manage(DbState(std::sync::Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![get_config,update_directories,list_folders,list_files,create_folder,move_video,list_inbox_files,update_settings])
        .run(tauri::generate_context!())
        
        .expect("error while running tauri application");
}
