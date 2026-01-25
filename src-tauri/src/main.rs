#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;
mod storage;

use std::sync::Arc;
use storage::ConnectionsStore;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_os::init())
        .setup(|app| {
            let app_dir = app.path().app_data_dir().unwrap_or_default();
            if !app_dir.exists() {
                std::fs::create_dir_all(&app_dir).ok();
            }

            let db_path = app_dir.join("connections.db");
            let store = Arc::new(ConnectionsStore::new(db_path).expect("Failed to initialize storage"));
            let active_connection: Arc<tokio::sync::Mutex<Option<Arc<dyn crate::db::DatabaseConnection>>>> = Arc::new(tokio::sync::Mutex::new(None));

            app.manage(store);
            app.manage(active_connection);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::close_splashscreen,
            commands::save_connection,
            commands::get_connections,
            commands::delete_connection,
            commands::test_connection,
            commands::connect_to_database,
            commands::execute_query,
            commands::list_tables,
            commands::get_table_columns,
            commands::disconnect_from_database,
            commands::export_database,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
