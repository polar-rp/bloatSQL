use serde::{Deserialize, Serialize};
use std::time::Duration;

/// Maximum number of rows returned from a single query to prevent memory exhaustion.
pub const MAX_QUERY_ROWS: usize = 10_000;

/// Default timeout for database operations.
pub const DEFAULT_QUERY_TIMEOUT: Duration = Duration::from_secs(30);

/// Result of executing a SQL query.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryResult {
    /// Column names in order.
    pub columns: Vec<String>,
    /// Row data as JSON values.
    pub rows: Vec<serde_json::Value>,
    /// Total number of rows returned.
    pub row_count: usize,
    /// Query execution time in milliseconds.
    pub execution_time: u128,
    /// Whether results were truncated due to MAX_QUERY_ROWS limit.
    pub truncated: bool,
}

/// Error returned from database operations.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryError {
    /// Human-readable error message.
    pub message: String,
    /// Optional error code for programmatic handling.
    pub code: Option<String>,
}

/// Error codes for consistent error handling across drivers.
#[allow(dead_code)]
pub mod error_codes {
    pub const CONNECTION_ERROR: &str = "CONNECTION_ERROR";
    pub const QUERY_ERROR: &str = "QUERY_ERROR";
    pub const TIMEOUT_ERROR: &str = "TIMEOUT_ERROR";
    pub const SSL_ERROR: &str = "SSL_ERROR";
    pub const TLS_ERROR: &str = "TLS_ERROR";
    pub const INVALID_DB_TYPE: &str = "INVALID_DB_TYPE";
}

/// Metadata about a table column.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableColumn {
    /// Column name.
    pub name: String,
    /// Data type (database-specific format).
    pub data_type: String,
    /// Whether the column accepts NULL values.
    pub is_nullable: bool,
    /// Whether the column is part of the primary key.
    pub is_primary_key: bool,
    /// Default value for the column.
    pub column_default: Option<String>,
    /// Maximum character length (for CHAR, VARCHAR, etc.).
    pub character_maximum_length: Option<i64>,
    /// Numeric precision (for INT, DECIMAL, etc.).
    pub numeric_precision: Option<i64>,
}

pub type DbResult<T> = Result<T, QueryError>;

/// Trait defining the interface for database connections.
///
/// All methods are async and should handle timeouts internally.
/// Implementations must be thread-safe (Send + Sync).
///
/// # Error Handling
/// All methods return `DbResult<T>` with appropriate error codes from `error_codes` module.
///
/// # Timeout Behavior
/// Long-running operations should respect `DEFAULT_QUERY_TIMEOUT`.
#[async_trait::async_trait]
pub trait DatabaseConnection: Send + Sync {
    /// Tests if the connection is alive.
    ///
    /// # Errors
    /// Returns `CONNECTION_ERROR` if the connection is not valid.
    async fn test_connection(&self) -> DbResult<()>;

    /// Executes a SQL query and returns the results.
    ///
    /// Results are limited to `MAX_QUERY_ROWS` rows. Check `QueryResult::truncated`
    /// to determine if results were cut off.
    ///
    /// # Errors
    /// - `QUERY_ERROR` for SQL syntax errors or execution failures
    /// - `TIMEOUT_ERROR` if query exceeds timeout
    async fn execute_query(&self, query: &str) -> DbResult<QueryResult>;

    /// Returns a list of table names in the current database.
    async fn list_tables(&self) -> DbResult<Vec<String>>;

    /// Returns a list of available database names.
    async fn list_databases(&self) -> DbResult<Vec<String>>;

    /// Switches to a different database.
    ///
    /// # Note
    /// For PostgreSQL, this creates a new connection as USE is not supported.
    async fn change_database(&self, database_name: &str) -> DbResult<()>;

    /// Returns the name of the currently selected database.
    async fn get_current_database(&self) -> DbResult<String>;

    /// Returns column metadata for the specified table.
    async fn get_table_columns(&self, table_name: &str) -> DbResult<Vec<TableColumn>>;

    /// Closes the database connection and releases resources.
    async fn disconnect(&self) -> DbResult<()>;

    /// Exports database tables to SQL format.
    ///
    /// # Arguments
    /// * `include_drop` - Include DROP TABLE statements
    /// * `include_create` - Include CREATE TABLE statements
    /// * `data_mode` - "insert", "replace", "insert_ignore", or "no_data"
    /// * `selected_tables` - Tables to export (empty = all tables)
    /// * `max_insert_size` - Maximum rows per INSERT statement
    async fn export_database_with_options(
        &self,
        include_drop: bool,
        include_create: bool,
        data_mode: &str,
        selected_tables: &[String],
        max_insert_size: usize,
    ) -> DbResult<String>;

    /// Updates a single cell value using primary key.
    ///
    /// # Arguments
    /// * `table_name` - Name of the table
    /// * `column_name` - Column to update
    /// * `new_value` - New value (will be properly escaped)
    /// * `primary_key_column` - Name of the primary key column
    /// * `primary_key_value` - Value of the primary key
    ///
    /// # Security
    /// This method uses parameterized queries to prevent SQL injection.
    async fn update_cell(
        &self,
        table_name: &str,
        column_name: &str,
        new_value: &str,
        primary_key_column: &str,
        primary_key_value: &str,
    ) -> DbResult<()>;
}
