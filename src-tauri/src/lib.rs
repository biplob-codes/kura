use std::{fs, path::Path, vec};
use toml;
use serde::{Deserialize, Serialize};

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

#[tauri::command]
fn update_directories(folder:&str,folder_path:&str){
    let path="config.toml";
    let file=fs::read_to_string(path).unwrap();
    let mut directories:Directories=toml::from_str(&file).unwrap();
    match folder{
        "inbox" =>{
            directories.inbox=folder_path.to_string();
        },
        "library" =>{
            directories.library=folder_path.to_string();
        },
        _ => println!("Unknown directory folder.")
    }
    let toml_write=toml::to_string_pretty(&directories).unwrap();
    fs::write(path, toml_write).unwrap();
}

#[derive(Serialize)]
struct Folder{
 name:String,
 path:String
}

#[tauri::command]
fn list_folders(dir:&str)->Vec<Folder>{
    let dirs=get_directories();
    match dir{
        "inbox"=>{
            get_folders(dirs.inbox)
        },
        "library"=>{
            get_folders(dirs.library)
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_directories,update_directories,list_folders,list_files])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
