use crate::db::{create_connection, DatabaseConnection, TableColumn, TableRelationship};
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
    pub new_value: Option<String>,
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
pub async fn get_table_relationships(
    active_conn: tauri::State<'_, ActiveConnection>,
) -> Result<Vec<TableRelationship>, String> {
    let active = active_conn.lock().await;
    match &*active {
        Some(conn) => {
            let relationships = conn
                .get_table_relationships()
                .await
                .map_err(|e| e.message)?;
            Ok(relationships)
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

/// Result of a cell update operation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateCellResult {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<UpdateCellError>,
    /// The SQL query that was executed (only present on success).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub executed_query: Option<String>,
}

/// Detailed error information for cell update failures.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateCellError {
    /// Human-readable error message.
    pub message: String,
    /// Database error code (e.g., PostgreSQL SQLSTATE).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub code: Option<String>,
    /// Additional detail from database.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
    /// Hint on how to fix the issue.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hint: Option<String>,
    /// The table being updated.
    pub table: String,
    /// The column being updated.
    pub column: String,
}

/// Updates a single cell value in a table.
///
/// Returns a structured result with detailed error information on failure.
#[tauri::command]
pub async fn update_cell(
    request: UpdateCellRequest,
    active_conn: tauri::State<'_, ActiveConnection>,
) -> Result<UpdateCellResult, String> {
    debug!("update_cell called with request: {:?}", request);

    let active = active_conn.lock().await;
    match &*active {
        Some(conn) => {
            debug!(
                "Executing update: table={}, column={}, pk_column={}, pk_value={}, new_value={:?}",
                request.table_name,
                request.column_name,
                request.primary_key_column,
                request.primary_key_value,
                request.new_value
            );

            match conn
                .update_cell(
                    &request.table_name,
                    &request.column_name,
                    request.new_value.as_deref(),
                    &request.primary_key_column,
                    &request.primary_key_value,
                )
                .await
            {
                Ok(executed_query) => {
                    debug!(
                        "Successfully updated cell in {}.{} where {} = {} to {:?}",
                        request.table_name,
                        request.column_name,
                        request.primary_key_column,
                        request.primary_key_value,
                        request.new_value
                    );
                    Ok(UpdateCellResult {
                        success: true,
                        error: None,
                        executed_query: Some(executed_query),
                    })
                }
                Err(e) => {
                    tracing::error!(
                        "Failed to update {}.{}: {} (code: {:?}, detail: {:?}, hint: {:?})",
                        request.table_name,
                        request.column_name,
                        e.message,
                        e.code,
                        e.detail,
                        e.hint
                    );
                    Ok(UpdateCellResult {
                        success: false,
                        error: Some(UpdateCellError {
                            message: e.message,
                            code: e.code,
                            detail: e.detail,
                            hint: e.hint,
                            table: request.table_name,
                            column: request.column_name,
                        }),
                        executed_query: None,
                    })
                }
            }
        }
        None => {
            tracing::error!("No active database connection");
            Ok(UpdateCellResult {
                success: false,
                error: Some(UpdateCellError {
                    message: "No active database connection".to_string(),
                    code: Some("NO_CONNECTION".to_string()),
                    detail: None,
                    hint: Some("Please connect to a database first".to_string()),
                    table: request.table_name,
                    column: request.column_name,
                }),
                executed_query: None,
            })
        }
    }
}

#[tauri::command]
pub async fn ping_connection(
    active_conn: tauri::State<'_, ActiveConnection>,
) -> Result<u64, String> {
    let active = active_conn.lock().await;
    match &*active {
        Some(conn) => {
            let start = std::time::Instant::now();
            conn.test_connection().await.map_err(|e| e.message)?;
            let elapsed = start.elapsed().as_millis() as u64;
            debug!("Connection ping: {} ms", elapsed);
            Ok(elapsed)
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
