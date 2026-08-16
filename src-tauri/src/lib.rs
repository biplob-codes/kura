use std::{fs, path::Path, vec};
use serde::{ Serialize};
mod server;
mod config;
use config::{AppConfig,read_config,write_config};
use tauri::AppHandle;
#[tauri::command]
fn get_config(app: tauri::AppHandle) -> AppConfig {
    read_config(&app)
}

#[tauri::command]
fn update_directories(app: AppHandle, folder: &str, folder_path: &str) {
    let mut conf = read_config(&app);
    match folder {
        "inbox" => conf.inbox = folder_path.to_string(),
        "library" => conf.library = folder_path.to_string(),
        _ => println!("Unknown directory folder."),
    }
    write_config(&app, &conf);
}

#[tauri::command]
fn update_thumbnail_settings(app: AppHandle, generate_thumbnails: bool, thumbnail_percent: f32) {
    let mut conf = read_config(&app);
    conf.generate_thumbnails = generate_thumbnails;
    conf.thumbnail_percent = thumbnail_percent;
    write_config(&app, &conf);
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
        })
        .invoke_handler(tauri::generate_handler![get_config,update_directories,list_folders,list_files,create_folder,move_video,list_inbox_files,update_thumbnail_settings])
        .run(tauri::generate_context!())
        
        .expect("error while running tauri application");
}
