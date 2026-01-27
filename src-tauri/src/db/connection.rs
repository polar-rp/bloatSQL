use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryResult {
    pub columns: Vec<String>,
    pub rows: Vec<serde_json::Value>,
    pub row_count: usize,
    pub execution_time: u128,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryError {
    pub message: String,
    pub code: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableColumn {
    pub name: String,
    pub data_type: String,
    pub is_nullable: bool,
    pub is_primary_key: bool,
}

pub type DbResult<T> = Result<T, QueryError>;

#[async_trait::async_trait]
pub trait DatabaseConnection: Send + Sync {
    async fn test_connection(&self) -> DbResult<()>;
    async fn execute_query(&self, query: &str) -> DbResult<QueryResult>;
    async fn list_tables(&self) -> DbResult<Vec<String>>;
    async fn list_databases(&self) -> DbResult<Vec<String>>;
    async fn change_database(&self, database_name: &str) -> DbResult<()>;
    async fn get_current_database(&self) -> DbResult<String>;
    async fn get_table_columns(&self, table_name: &str) -> DbResult<Vec<TableColumn>>;
    async fn disconnect(&self) -> DbResult<()>;
    async fn export_database_with_options(
        &self,
        include_drop: bool,
        include_create: bool,
        data_mode: &str,
        selected_tables: &[String],
        max_insert_size: usize,
    ) -> DbResult<String>;
}
