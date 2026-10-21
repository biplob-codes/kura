mod config;
mod db;
mod files;
mod folders;
mod models;
mod password;
mod playlists;
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
            tauri::async_runtime::spawn(async {
                server::start().await;
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
            models::create_model,
            models::get_models,
            models::get_model_videos,
            transfer::queue_transfer_video,
            video::get_home_videos,
            video::set_video_watched,
            video::play_video,
            video::get_watched_videos,
            video::move_video_to_trash,
            video::get_deleted_videos,
            video::get_history_videos,
            video::remove_from_history,
            video::complete_and_trash_video,
            playlists::create_playlist,
            playlists::get_playlists,
            playlists::get_playlist,
            playlists::get_playlist_videos,
            playlists::add_video_to_playlist,
            playlists::remove_video_from_playlist,
            playlists::get_video_playlist_ids,
            password::is_password_enabled,
            password::set_app_password,
            password::clear_app_password,
            password::verify_app_password,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}