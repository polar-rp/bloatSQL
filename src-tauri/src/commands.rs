use crate::db::{create_connection, DatabaseConnection, TableColumn};
use crate::storage::{ConnectionsStore, StoredConnection};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{Manager, WebviewWindow};
use tokio::sync::Mutex;
use tracing::debug;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Connection {
    pub id: String,
    pub name: String,
    pub db_type: String,
    pub host: String,
    pub port: i32,
    pub username: String,
    pub password: String,
    pub database: String,
    pub ssl_mode: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryResult {
    pub columns: Vec<String>,
    pub rows: Vec<serde_json::Value>,
    pub row_count: usize,
    pub execution_time: u128,
    pub truncated: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportOptions {
    pub include_drop: bool,
    pub include_create: bool,
    pub data_mode: String,
    pub selected_tables: Vec<String>,
    pub output_path: String,
    pub file_name: String,
    pub max_insert_size: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateCellRequest {
    pub table_name: String,
    pub column_name: String,
    pub new_value: String,
    pub primary_key_column: String,
    pub primary_key_value: String,
}

impl From<crate::db::QueryResult> for QueryResult {
    fn from(result: crate::db::QueryResult) -> Self {
        QueryResult {
            columns: result.columns,
            rows: result.rows,
            row_count: result.row_count,
            execution_time: result.execution_time,
            truncated: result.truncated,
        }
    }
}

pub type ActiveConnection = Arc<Mutex<Option<Arc<dyn DatabaseConnection>>>>;

#[tauri::command]
pub async fn close_splashscreen(window: WebviewWindow) {
    if let Some(splashscreen) = window.get_webview_window("splashscreen") {
        let _ = splashscreen.close();
    }
    if let Some(main) = window.get_webview_window("main") {
        let _ = main.show();
    }
}

#[tauri::command]
pub async fn save_connection(
    store: tauri::State<'_, Arc<ConnectionsStore>>,
    conn: Connection,
) -> Result<Connection, String> {
    let stored = StoredConnection {
        id: conn.id.clone(),
        name: conn.name.clone(),
        db_type: conn.db_type.clone(),
        host: conn.host.clone(),
        port: conn.port,
        username: conn.username.clone(),
        password_encrypted: conn.password.clone(),
        database: conn.database.clone(),
        ssl_mode: conn.ssl_mode.clone(),
    };

    store
        .save_connection(stored)
        .map_err(|e| e.to_string())?;

    debug!("Saved connection: {}", conn.name);
    Ok(conn)
}

#[tauri::command]
pub async fn get_connections(
    store: tauri::State<'_, Arc<ConnectionsStore>>,
) -> Result<Vec<Connection>, String> {
    let stored_connections = store
        .get_all_connections()
        .map_err(|e| e.to_string())?;

    Ok(stored_connections
        .into_iter()
        .map(|sc| Connection {
            id: sc.id,
            name: sc.name,
            db_type: sc.db_type,
            host: sc.host,
            port: sc.port,
            username: sc.username,
            password: sc.password_encrypted,
            database: sc.database,
            ssl_mode: sc.ssl_mode,
        })
        .collect())
}

#[tauri::command]
pub async fn delete_connection(
    store: tauri::State<'_, Arc<ConnectionsStore>>,
    id: String,
) -> Result<bool, String> {
    let result = store
        .delete_connection(&id)
        .map_err(|e| e.to_string())?;

    debug!("Deleted connection: {}", id);
    Ok(result)
}

#[tauri::command]
pub async fn test_connection(conn: Connection) -> Result<(), String> {
    let db_conn = create_connection(
        &conn.db_type,
        &conn.host,
        conn.port as u16,
        &conn.username,
        &conn.password,
        &conn.database,
        &conn.ssl_mode,
    )
    .await
    .map_err(|e| e.message)?;

    db_conn.test_connection().await.map_err(|e| e.message)?;
    debug!("Connection test successful: {}", conn.name);
    Ok(())
}

#[tauri::command]
pub async fn connect_to_database(
    conn: Connection,
    active_conn: tauri::State<'_, ActiveConnection>,
) -> Result<(), String> {
    let db_conn = create_connection(
        &conn.db_type,
        &conn.host,
        conn.port as u16,
        &conn.username,
        &conn.password,
        &conn.database,
        &conn.ssl_mode,
    )
    .await
    .map_err(|e| e.message)?;

    let mut active = active_conn.lock().await;
    *active = Some(db_conn);

    debug!("Connected to database: {}", conn.name);
    Ok(())
}

#[tauri::command]
pub async fn execute_query(
    query: String,
    active_conn: tauri::State<'_, ActiveConnection>,
) -> Result<QueryResult, String> {
    let active = active_conn.lock().await;
    match &*active {
        Some(conn) => {
            let result = conn.execute_query(&query).await.map_err(|e| e.message)?;
            Ok(result.into())
        }
        None => Err("No active connection".to_string()),
    }
}

#[tauri::command]
pub async fn list_tables(
    active_conn: tauri::State<'_, ActiveConnection>,
) -> Result<Vec<String>, String> {
    let active = active_conn.lock().await;
    match &*active {
        Some(conn) => {
            let tables = conn.list_tables().await.map_err(|e| e.message)?;
            Ok(tables)
        }
        None => Err("No active connection".to_string()),
    }
}

#[tauri::command]
pub async fn list_databases(
    active_conn: tauri::State<'_, ActiveConnection>,
) -> Result<Vec<String>, String> {
    let active = active_conn.lock().await;
    match &*active {
        Some(conn) => {
            let databases = conn.list_databases().await.map_err(|e| e.message)?;
            Ok(databases)
        }
        None => Err("No active connection".to_string()),
    }
}

#[tauri::command]
pub async fn change_database(
    database_name: String,
    active_conn: tauri::State<'_, ActiveConnection>,
) -> Result<(), String> {
    let active = active_conn.lock().await;
    match &*active {
        Some(conn) => {
            conn.change_database(&database_name)
                .await
                .map_err(|e| e.message)?;
            debug!("Changed database to: {}", database_name);
            Ok(())
        }
        None => Err("No active connection".to_string()),
    }
}

#[tauri::command]
pub async fn get_current_database(
    active_conn: tauri::State<'_, ActiveConnection>,
) -> Result<String, String> {
    let active = active_conn.lock().await;
    match &*active {
        Some(conn) => {
            let db_name = conn.get_current_database().await.map_err(|e| e.message)?;
            Ok(db_name)
        }
        None => Err("No active connection".to_string()),
    }
}

#[tauri::command]
pub async fn get_table_columns(
    table_name: String,
    active_conn: tauri::State<'_, ActiveConnection>,
) -> Result<Vec<TableColumn>, String> {
    let active = active_conn.lock().await;
    match &*active {
        Some(conn) => {
            let columns = conn
                .get_table_columns(&table_name)
                .await
                .map_err(|e| e.message)?;
            Ok(columns)
        }
        None => Err("No active connection".to_string()),
    }
}

#[tauri::command]
pub async fn disconnect_from_database(
    active_conn: tauri::State<'_, ActiveConnection>,
) -> Result<(), String> {
    let mut active = active_conn.lock().await;
    if let Some(conn) = active.take() {
        conn.disconnect().await.map_err(|e| e.message)?;
        debug!("Disconnected from database");
    }
    Ok(())
}

#[tauri::command]
pub async fn export_database(
    options: ExportOptions,
    active_conn: tauri::State<'_, ActiveConnection>,
) -> Result<(), String> {
    let active = active_conn.lock().await;
    match &*active {
        Some(conn) => {
            let sql_content = conn
                .export_database_with_options(
                    options.include_drop,
                    options.include_create,
                    &options.data_mode,
                    &options.selected_tables,
                    options.max_insert_size,
                )
                .await
                .map_err(|e| e.message)?;

            let file_path = std::path::Path::new(&options.output_path).join(&options.file_name);

            // Use async file I/O
            tokio::fs::write(&file_path, sql_content)
                .await
                .map_err(|e| format!("Failed to write file: {}", e))?;

            debug!("Exported database to: {:?}", file_path);
            Ok(())
        }
        None => Err("No active connection".to_string()),
    }
}

/// Updates a single cell value in a table.
///
/// Uses parameterized queries to prevent SQL injection.
#[tauri::command]
pub async fn update_cell(
    request: UpdateCellRequest,
    active_conn: tauri::State<'_, ActiveConnection>,
) -> Result<(), String> {
    let active = active_conn.lock().await;
    match &*active {
        Some(conn) => {
            conn.update_cell(
                &request.table_name,
                &request.column_name,
                &request.new_value,
                &request.primary_key_column,
                &request.primary_key_value,
            )
            .await
            .map_err(|e| e.message)?;

            debug!(
                "Updated cell in {}.{} where {} = {}",
                request.table_name,
                request.column_name,
                request.primary_key_column,
                request.primary_key_value
            );
            Ok(())
        }
        None => Err("No active connection".to_string()),
    }
}

#[tauri::command]
pub async fn write_text_file(path: String, content: String) -> Result<(), String> {
    // Use async file I/O
    tokio::fs::write(&path, content)
        .await
        .map_err(|e| format!("Failed to write file: {}", e))?;

    debug!("Wrote text file: {}", path);
    Ok(())
}
