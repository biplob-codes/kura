mod config;
mod db;
mod files;
mod folders;
mod server;
mod settings;
mod tags;
mod transfer;
mod video;


use db::DbState;
use transfer::{run_transfer_queue, QueueState, TransferJob};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let (transfer_tx, transfer_rx) = tokio::sync::mpsc::channel::<TransferJob>(256);

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(DbState(std::sync::Mutex::new(None)))
        .manage(QueueState(transfer_tx))
        .setup(move |app| {
            std::thread::spawn(|| {
                server::main();
            });

            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                settings::connect_on_startup(&handle).await;
            });

            let queue_handle = app.handle().clone();
            tauri::async_runtime::spawn(run_transfer_queue(queue_handle, transfer_rx));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            settings::get_config,
            settings::update_settings,
            files::update_directories,
            files::list_files,
            files::move_video,
            files::list_inbox_files,
            folders::create_folder,
            folders::get_library_folders,
            folders::get_folders,
            folders::get_folder_videos,
            folders::get_folder_siblings,
            tags::create_tag,
            tags::get_tags,
            transfer::queue_transfer_video,
            video::get_home_videos,
            video::set_video_watched,
            video::get_watched_videos,
            video::set_video_watchlist,
            video::get_watchlist_videos,
            video::move_video_to_trash,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
