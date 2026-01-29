use super::connection::{
    error_codes, DatabaseConnection, DbResult, QueryError, QueryResult, TableColumn,
    TableRelationship, DEFAULT_QUERY_TIMEOUT, MAX_QUERY_ROWS,
};
use async_trait::async_trait;
use native_tls::TlsConnector;
use postgres_native_tls::MakeTlsConnector;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::time::timeout;
use tokio_postgres::{types::Type, Client, NoTls, Row};
use tracing::{debug, error, warn};

/// Converts a tokio_postgres error to a QueryError with full details.
fn pg_error_to_query_error(err: tokio_postgres::Error, code: &str) -> QueryError {
    // Try to extract detailed PostgreSQL error information
    if let Some(db_err) = err.as_db_error() {
        let mut query_err = QueryError::with_code(db_err.message().to_string(), code);

        // Add PostgreSQL error code (e.g., "22P02" for invalid_text_representation)
        if let Some(pg_code) = Some(db_err.code().code()) {
            query_err.code = Some(pg_code.to_string());
        }

        // Add detail if available
        if let Some(detail) = db_err.detail() {
            query_err = query_err.with_detail(detail);
        }

        // Add hint if available
        if let Some(hint) = db_err.hint() {
            query_err = query_err.with_hint(hint);
        }

        // If no hint provided, add contextual hint based on error code
        if query_err.hint.is_none() {
            let hint = match db_err.code().code() {
                "22P02" => Some("Value has invalid format for the target column type"),
                "22003" => Some("Value is out of range for the target column type"),
                "23502" => Some("Column does not allow NULL values"),
                "23503" => Some("Referenced value does not exist (foreign key violation)"),
                "23505" => Some("Value already exists (unique constraint violation)"),
                "42703" => Some("Check column name spelling"),
                "42P01" => Some("Check table name spelling"),
                _ => None,
            };
            if let Some(h) = hint {
                query_err = query_err.with_hint(h);
            }
        }

        query_err
    } else {
        // Fallback for non-database errors
        QueryError::with_code(err.to_string(), code)
    }
}

/// PostgreSQL database connection implementation.
pub struct PostgresConnection {
    client: Arc<Mutex<Client>>,
    host: String,
    port: u16,
    username: String,
    password: String,
    current_database: Arc<Mutex<String>>,
    ssl_mode: String,
}

impl PostgresConnection {
    pub async fn new(
        host: &str,
        port: u16,
        username: &str,
        password: &str,
        database: &str,
        ssl_mode: &str,
    ) -> DbResult<Self> {
        let client =
            Self::create_client(host, port, username, password, database, ssl_mode).await?;

        Ok(PostgresConnection {
            client: Arc::new(Mutex::new(client)),
            host: host.to_string(),
            port,
            username: username.to_string(),
            password: password.to_string(),
            current_database: Arc::new(Mutex::new(database.to_string())),
            ssl_mode: ssl_mode.to_string(),
        })
    }

    /// Creates a new PostgreSQL client with the specified parameters.
    async fn create_client(
        host: &str,
        port: u16,
        username: &str,
        password: &str,
        database: &str,
        ssl_mode: &str,
    ) -> DbResult<Client> {
        let config = format!(
            "host={} port={} user={} password={} dbname={}",
            host, port, username, password, database
        );

        if ssl_mode == "required" || ssl_mode == "preferred" {
            let connector = TlsConnector::builder()
                .danger_accept_invalid_certs(true)
                .build()
                .map_err(|e| QueryError {
                    message: format!("TLS configuration error: {}", e),
                    code: Some(error_codes::TLS_ERROR.to_string()),
            ..Default::default()
                })?;

            let tls_connector = MakeTlsConnector::new(connector);

            match tokio_postgres::connect(&config, tls_connector).await {
                Ok((client, connection)) => {
                    tokio::spawn(async move {
                        if let Err(e) = connection.await {
                            error!("PostgreSQL TLS connection error: {}", e);
                        }
                    });
                    debug!("PostgreSQL TLS connection established");
                    return Ok(client);
                }
                Err(e) => {
                    if ssl_mode == "required" {
                        return Err(QueryError {
                            message: format!("SSL connection failed: {}", e),
                            code: Some(error_codes::SSL_ERROR.to_string()),
            ..Default::default()
                        });
                    }
                    warn!("SSL connection failed, falling back to non-SSL: {}", e);
                }
            }
        }

        // No SSL or fallback from preferred
        let (client, connection) = tokio_postgres::connect(&config, NoTls)
            .await
            .map_err(|e| QueryError {
                message: format!("Connection failed: {}", e),
                code: Some(error_codes::CONNECTION_ERROR.to_string()),
            ..Default::default()
            })?;

        tokio::spawn(async move {
            if let Err(e) = connection.await {
                error!("PostgreSQL connection error: {}", e);
            }
        });

        debug!("PostgreSQL non-SSL connection established");
        Ok(client)
    }

    /// Escapes an identifier (table/column name) for safe use in SQL.
    #[inline]
    fn escape_identifier(name: &str) -> String {
        name.replace('"', "\"\"")
    }

    /// Escapes a string value for safe use in SQL.
    #[inline]
    fn escape_string(value: &str) -> String {
        value.replace('\'', "''")
    }

    #[inline]
    fn pg_value_to_json(row: &Row, idx: usize, col_type: &Type) -> serde_json::Value {
        match *col_type {
            Type::BOOL => row
                .try_get::<_, Option<bool>>(idx)
                .ok()
                .flatten()
                .map(serde_json::Value::Bool)
                .unwrap_or(serde_json::Value::Null),

            Type::INT2 => row
                .try_get::<_, Option<i16>>(idx)
                .ok()
                .flatten()
                .map(|v| serde_json::json!(v))
                .unwrap_or(serde_json::Value::Null),

            Type::INT4 => row
                .try_get::<_, Option<i32>>(idx)
                .ok()
                .flatten()
                .map(|v| serde_json::json!(v))
                .unwrap_or(serde_json::Value::Null),

            Type::INT8 => row
                .try_get::<_, Option<i64>>(idx)
                .ok()
                .flatten()
                .map(|v| serde_json::json!(v))
                .unwrap_or(serde_json::Value::Null),

            Type::FLOAT4 => row
                .try_get::<_, Option<f32>>(idx)
                .ok()
                .flatten()
                .map(|v| serde_json::json!(v))
                .unwrap_or(serde_json::Value::Null),

            Type::FLOAT8 => row
                .try_get::<_, Option<f64>>(idx)
                .ok()
                .flatten()
                .map(|v| serde_json::json!(v))
                .unwrap_or(serde_json::Value::Null),

            Type::VARCHAR | Type::TEXT | Type::CHAR | Type::BPCHAR | Type::NAME => row
                .try_get::<_, Option<String>>(idx)
                .ok()
                .flatten()
                .map(serde_json::Value::String)
                .unwrap_or(serde_json::Value::Null),

            Type::BYTEA => row
                .try_get::<_, Option<Vec<u8>>>(idx)
                .ok()
                .flatten()
                .map(|v| {
                    use base64::{engine::general_purpose, Engine as _};
                    serde_json::Value::String(general_purpose::STANDARD.encode(&v))
                })
                .unwrap_or(serde_json::Value::Null),

            Type::TIMESTAMP | Type::TIMESTAMPTZ => row
                .try_get::<_, Option<chrono::NaiveDateTime>>(idx)
                .ok()
                .flatten()
                .map(|v| serde_json::Value::String(v.format("%Y-%m-%d %H:%M:%S").to_string()))
                .unwrap_or(serde_json::Value::Null),

            Type::DATE => row
                .try_get::<_, Option<chrono::NaiveDate>>(idx)
                .ok()
                .flatten()
                .map(|v| serde_json::Value::String(v.format("%Y-%m-%d").to_string()))
                .unwrap_or(serde_json::Value::Null),

            Type::TIME | Type::TIMETZ => row
                .try_get::<_, Option<chrono::NaiveTime>>(idx)
                .ok()
                .flatten()
                .map(|v| serde_json::Value::String(v.format("%H:%M:%S").to_string()))
                .unwrap_or(serde_json::Value::Null),

            Type::JSON | Type::JSONB => row
                .try_get::<_, Option<serde_json::Value>>(idx)
                .ok()
                .flatten()
                .unwrap_or(serde_json::Value::Null),

            Type::UUID => row
                .try_get::<_, Option<uuid::Uuid>>(idx)
                .ok()
                .flatten()
                .map(|v| serde_json::Value::String(v.to_string()))
                .unwrap_or(serde_json::Value::Null),

            _ => row
                .try_get::<_, Option<String>>(idx)
                .ok()
                .flatten()
                .map(serde_json::Value::String)
                .unwrap_or(serde_json::Value::Null),
        }
    }

    #[inline]
    fn pg_value_to_sql(row: &Row, idx: usize, col_type: &Type) -> String {
        match *col_type {
            Type::BOOL => row
                .try_get::<_, Option<bool>>(idx)
                .ok()
                .flatten()
                .map(|v| if v { "TRUE" } else { "FALSE" }.to_string())
                .unwrap_or_else(|| "NULL".to_string()),

            Type::INT2 | Type::INT4 | Type::INT8 | Type::FLOAT4 | Type::FLOAT8 => row
                .try_get::<_, Option<String>>(idx)
                .ok()
                .flatten()
                .unwrap_or_else(|| "NULL".to_string()),

            Type::VARCHAR | Type::TEXT | Type::CHAR | Type::BPCHAR | Type::NAME => row
                .try_get::<_, Option<String>>(idx)
                .ok()
                .flatten()
                .map(|v| format!("'{}'", Self::escape_string(&v)))
                .unwrap_or_else(|| "NULL".to_string()),

            Type::TIMESTAMP | Type::TIMESTAMPTZ => row
                .try_get::<_, Option<chrono::NaiveDateTime>>(idx)
                .ok()
                .flatten()
                .map(|v| format!("'{}'", v.format("%Y-%m-%d %H:%M:%S")))
                .unwrap_or_else(|| "NULL".to_string()),

            Type::DATE => row
                .try_get::<_, Option<chrono::NaiveDate>>(idx)
                .ok()
                .flatten()
                .map(|v| format!("'{}'", v.format("%Y-%m-%d")))
                .unwrap_or_else(|| "NULL".to_string()),

            Type::TIME | Type::TIMETZ => row
                .try_get::<_, Option<chrono::NaiveTime>>(idx)
                .ok()
                .flatten()
                .map(|v| format!("'{}'", v.format("%H:%M:%S")))
                .unwrap_or_else(|| "NULL".to_string()),

            _ => row
                .try_get::<_, Option<String>>(idx)
                .ok()
                .flatten()
                .map(|v| format!("'{}'", Self::escape_string(&v)))
                .unwrap_or_else(|| "NULL".to_string()),
        }
    }

    fn format_insert_statement(
        table_name: &str,
        columns: &[String],
        rows: &[Vec<String>],
        data_mode: &str,
    ) -> String {
        let column_list = columns
            .iter()
            .map(|c| format!("\"{}\"", Self::escape_identifier(c)))
            .collect::<Vec<_>>()
            .join(", ");

        let values_list = rows
            .iter()
            .map(|row| format!("({})", row.join(", ")))
            .collect::<Vec<_>>()
            .join(",\n  ");

        let conflict_clause = match data_mode {
            "replace" => format!(
                " ON CONFLICT DO UPDATE SET {}",
                columns
                    .iter()
                    .map(|c| format!(
                        "\"{}\" = EXCLUDED.\"{}\"",
                        Self::escape_identifier(c),
                        Self::escape_identifier(c)
                    ))
                    .collect::<Vec<_>>()
                    .join(", ")
            ),
            "insert_ignore" => " ON CONFLICT DO NOTHING".to_string(),
            _ => String::new(),
        };

        format!(
            "INSERT INTO \"{}\" ({}) VALUES\n  {}{};\n",
            Self::escape_identifier(table_name),
            column_list,
            values_list,
            conflict_clause
        )
    }
}

#[async_trait]
impl DatabaseConnection for PostgresConnection {
    async fn test_connection(&self) -> DbResult<()> {
        let client = self.client.lock().await;

        timeout(DEFAULT_QUERY_TIMEOUT, client.simple_query("SELECT 1"))
            .await
            .map_err(|_| QueryError {
                message: "Connection test timed out".to_string(),
                code: Some(error_codes::TIMEOUT_ERROR.to_string()),
            ..Default::default()
            })?
            .map_err(|e| QueryError {
                message: e.to_string(),
                code: Some(error_codes::CONNECTION_ERROR.to_string()),
            ..Default::default()
            })?;

        Ok(())
    }

    async fn execute_query(&self, query: &str) -> DbResult<QueryResult> {
        let client = self.client.lock().await;
        let start = std::time::Instant::now();

        let rows = timeout(DEFAULT_QUERY_TIMEOUT, client.query(query, &[]))
            .await
            .map_err(|_| QueryError {
                message: "Query timed out".to_string(),
                code: Some(error_codes::TIMEOUT_ERROR.to_string()),
            ..Default::default()
            })?
            .map_err(|e| QueryError {
                message: e.to_string(),
                code: Some(error_codes::QUERY_ERROR.to_string()),
            ..Default::default()
            })?;

        let columns: Vec<String> = if !rows.is_empty() {
            rows[0]
                .columns()
                .iter()
                .map(|col| col.name().to_string())
                .collect()
        } else {
            Vec::new()
        };

        let total_rows = rows.len();
        let truncated = total_rows > MAX_QUERY_ROWS;
        let rows_to_process = if truncated { MAX_QUERY_ROWS } else { total_rows };

        let mut result_rows = Vec::with_capacity(rows_to_process);

        for row in rows.iter().take(rows_to_process) {
            let mut row_map = serde_json::Map::with_capacity(columns.len());

            for (i, col_name) in columns.iter().enumerate() {
                let col_type = row.columns()[i].type_();
                let value = Self::pg_value_to_json(row, i, col_type);
                row_map.insert(col_name.clone(), value);
            }

            result_rows.push(serde_json::Value::Object(row_map));
        }

        let execution_time = start.elapsed().as_millis();

        Ok(QueryResult {
            columns,
            rows: result_rows,
            row_count: total_rows,
            execution_time,
            truncated,
        })
    }

    async fn list_tables(&self) -> DbResult<Vec<String>> {
        let client = self.client.lock().await;

        let query = "SELECT table_name FROM information_schema.tables
                     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
                     ORDER BY table_name";

        let rows = timeout(DEFAULT_QUERY_TIMEOUT, client.query(query, &[]))
            .await
            .map_err(|_| QueryError {
                message: "Query timed out".to_string(),
                code: Some(error_codes::TIMEOUT_ERROR.to_string()),
            ..Default::default()
            })?
            .map_err(|e| QueryError {
                message: e.to_string(),
                code: Some(error_codes::QUERY_ERROR.to_string()),
            ..Default::default()
            })?;

        let tables: Vec<String> = rows
            .iter()
            .filter_map(|row| row.try_get::<_, String>(0).ok())
            .collect();

        Ok(tables)
    }

    async fn list_databases(&self) -> DbResult<Vec<String>> {
        let client = self.client.lock().await;

        let query = "SELECT datname FROM pg_database
                     WHERE datistemplate = false
                     ORDER BY datname";

        let rows = timeout(DEFAULT_QUERY_TIMEOUT, client.query(query, &[]))
            .await
            .map_err(|_| QueryError {
                message: "Query timed out".to_string(),
                code: Some(error_codes::TIMEOUT_ERROR.to_string()),
            ..Default::default()
            })?
            .map_err(|e| QueryError {
                message: e.to_string(),
                code: Some(error_codes::QUERY_ERROR.to_string()),
            ..Default::default()
            })?;

        let databases: Vec<String> = rows
            .iter()
            .filter_map(|row| row.try_get::<_, String>(0).ok())
            .collect();

        Ok(databases)
    }

    async fn change_database(&self, database_name: &str) -> DbResult<()> {
        // PostgreSQL doesn't have USE statement, we need to reconnect
        let new_client = Self::create_client(
            &self.host,
            self.port,
            &self.username,
            &self.password,
            database_name,
            &self.ssl_mode,
        )
        .await?;

        // Replace the client
        let mut client = self.client.lock().await;
        *client = new_client;

        // Update current database
        let mut current_db = self.current_database.lock().await;
        *current_db = database_name.to_string();

        debug!("Changed database to: {}", database_name);
        Ok(())
    }

    async fn get_current_database(&self) -> DbResult<String> {
        let current_db = self.current_database.lock().await;
        Ok(current_db.clone())
    }

    async fn get_table_columns(&self, table_name: &str) -> DbResult<Vec<TableColumn>> {
        let client = self.client.lock().await;

        let query = "SELECT
                        c.column_name,
                        c.udt_name,
                        c.is_nullable,
                        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary,
                        c.column_default,
                        c.character_maximum_length,
                        c.numeric_precision
                     FROM information_schema.columns c
                     LEFT JOIN (
                        SELECT ku.column_name
                        FROM information_schema.table_constraints tc
                        JOIN information_schema.key_column_usage ku
                            ON tc.constraint_name = ku.constraint_name
                        WHERE tc.constraint_type = 'PRIMARY KEY'
                            AND tc.table_name = $1
                            AND tc.table_schema = 'public'
                     ) pk ON c.column_name = pk.column_name
                     WHERE c.table_name = $1
                        AND c.table_schema = 'public'
                     ORDER BY c.ordinal_position";

        let rows = timeout(DEFAULT_QUERY_TIMEOUT, client.query(query, &[&table_name]))
            .await
            .map_err(|_| QueryError {
                message: "Query timed out".to_string(),
                code: Some(error_codes::TIMEOUT_ERROR.to_string()),
            ..Default::default()
            })?
            .map_err(|e| QueryError {
                message: e.to_string(),
                code: Some(error_codes::QUERY_ERROR.to_string()),
            ..Default::default()
            })?;

        let columns: Vec<TableColumn> = rows
            .iter()
            .filter_map(|row| {
                Some(TableColumn {
                    name: row.try_get::<_, String>(0).ok()?,
                    data_type: row.try_get::<_, String>(1).ok()?,
                    is_nullable: row.try_get::<_, String>(2).ok()? == "YES",
                    is_primary_key: row.try_get::<_, bool>(3).ok()?,
                    column_default: row.try_get::<_, String>(4).ok(),
                    character_maximum_length: row.try_get::<_, i32>(5).ok().map(|v| v as i64),
                    numeric_precision: row.try_get::<_, i32>(6).ok().map(|v| v as i64),
                })
            })
            .collect();

        Ok(columns)
    }

    async fn get_table_relationships(&self) -> DbResult<Vec<TableRelationship>> {
        let client = self.client.lock().await;

        let query = "SELECT
                        tc.table_name AS from_table,
                        kcu.column_name AS from_column,
                        ccu.table_name AS to_table,
                        ccu.column_name AS to_column,
                        tc.constraint_name
                     FROM information_schema.table_constraints tc
                     JOIN information_schema.key_column_usage kcu
                        ON tc.constraint_name = kcu.constraint_name
                        AND tc.table_schema = kcu.table_schema
                     JOIN information_schema.constraint_column_usage ccu
                        ON ccu.constraint_name = tc.constraint_name
                        AND ccu.table_schema = tc.table_schema
                     WHERE tc.constraint_type = 'FOREIGN KEY'
                        AND tc.table_schema = 'public'
                     ORDER BY tc.table_name";

        let rows = timeout(DEFAULT_QUERY_TIMEOUT, client.query(query, &[]))
            .await
            .map_err(|_| QueryError {
                message: "Query timed out".to_string(),
                code: Some(error_codes::TIMEOUT_ERROR.to_string()),
            ..Default::default()
            })?
            .map_err(|e| QueryError {
                message: e.to_string(),
                code: Some(error_codes::QUERY_ERROR.to_string()),
            ..Default::default()
            })?;

        let relationships: Vec<TableRelationship> = rows
            .iter()
            .filter_map(|row| {
                Some(TableRelationship {
                    from_table: row.try_get::<_, String>(0).ok()?,
                    from_column: row.try_get::<_, String>(1).ok()?,
                    to_table: row.try_get::<_, String>(2).ok()?,
                    to_column: row.try_get::<_, String>(3).ok()?,
                    constraint_name: row.try_get::<_, String>(4).ok()?,
                })
            })
            .collect();

        Ok(relationships)
    }

    async fn disconnect(&self) -> DbResult<()> {
        // PostgreSQL client automatically disconnects when dropped
        debug!("PostgreSQL connection disconnected");
        Ok(())
    }

    async fn update_cell(
        &self,
        table_name: &str,
        column_name: &str,
        new_value: Option<&str>,
        primary_key_column: &str,
        primary_key_value: &str,
    ) -> DbResult<()> {
        let client = self.client.lock().await;

        // Build UPDATE query with proper escaping
        // We use simple_query to avoid type inference issues with parameterized queries
        // since we don't know the column type and need PostgreSQL to handle the conversion
        let query = match new_value {
            Some(value) => {
                format!(
                    "UPDATE \"{}\" SET \"{}\" = '{}' WHERE \"{}\" = '{}'",
                    Self::escape_identifier(table_name),
                    Self::escape_identifier(column_name),
                    Self::escape_string(value),
                    Self::escape_identifier(primary_key_column),
                    Self::escape_string(primary_key_value)
                )
            }
            None => {
                format!(
                    "UPDATE \"{}\" SET \"{}\" = NULL WHERE \"{}\" = '{}'",
                    Self::escape_identifier(table_name),
                    Self::escape_identifier(column_name),
                    Self::escape_identifier(primary_key_column),
                    Self::escape_string(primary_key_value)
                )
            }
        };

        debug!("Executing update query: {}", query);

        timeout(DEFAULT_QUERY_TIMEOUT, client.simple_query(&query))
            .await
            .map_err(|_| {
                QueryError::with_code("Update operation timed out", error_codes::TIMEOUT_ERROR)
                    .with_hint("The database took too long to respond. Try again or check database load.")
            })?
            .map_err(|e| pg_error_to_query_error(e, error_codes::QUERY_ERROR))?;

        Ok(())
    }

    async fn export_database_with_options(
        &self,
        include_drop: bool,
        include_create: bool,
        data_mode: &str,
        selected_tables: &[String],
        max_insert_size: usize,
    ) -> DbResult<String> {
        let client = self.client.lock().await;
        let mut sql_content = String::with_capacity(1024 * 1024);

        let tables_to_export = if selected_tables.is_empty() {
            let query = "SELECT table_name FROM information_schema.tables
                         WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
                         ORDER BY table_name";

            let rows = client.query(query, &[]).await.map_err(|e| QueryError {
                message: e.to_string(),
                code: Some(error_codes::QUERY_ERROR.to_string()),
            ..Default::default()
            })?;

            rows.iter()
                .filter_map(|row| row.try_get::<_, String>(0).ok())
                .collect()
        } else {
            selected_tables.to_vec()
        };

        for table_name in tables_to_export {
            sql_content.push_str(&format!("\n-- Table: {}\n", table_name));

            if include_drop {
                sql_content.push_str(&format!(
                    "DROP TABLE IF EXISTS \"{}\" CASCADE;\n",
                    Self::escape_identifier(&table_name)
                ));
            }

            if include_create {
                let columns_query = "SELECT
                        column_name,
                        data_type,
                        character_maximum_length,
                        is_nullable,
                        column_default
                     FROM information_schema.columns
                     WHERE table_name = $1 AND table_schema = 'public'
                     ORDER BY ordinal_position";

                let col_rows = client
                    .query(columns_query, &[&table_name])
                    .await
                    .map_err(|e| QueryError {
                        message: e.to_string(),
                        code: Some(error_codes::QUERY_ERROR.to_string()),
            ..Default::default()
                    })?;

                sql_content.push_str(&format!(
                    "CREATE TABLE \"{}\" (\n",
                    Self::escape_identifier(&table_name)
                ));

                let col_defs: Vec<String> = col_rows
                    .iter()
                    .filter_map(|row| {
                        let name = row.try_get::<_, String>(0).ok()?;
                        let data_type = row.try_get::<_, String>(1).ok()?;
                        let max_len = row.try_get::<_, Option<i32>>(2).ok()?;
                        let nullable = row.try_get::<_, String>(3).ok()?;
                        let default = row.try_get::<_, Option<String>>(4).ok()?;

                        let mut def = format!(
                            "  \"{}\" {}",
                            Self::escape_identifier(&name),
                            data_type.to_uppercase()
                        );

                        if let Some(len) = max_len {
                            def.push_str(&format!("({})", len));
                        }

                        if nullable == "NO" {
                            def.push_str(" NOT NULL");
                        }

                        if let Some(default_val) = default {
                            def.push_str(&format!(" DEFAULT {}", default_val));
                        }

                        Some(def)
                    })
                    .collect();

                sql_content.push_str(&col_defs.join(",\n"));
                sql_content.push_str("\n);\n\n");
            }

            if data_mode != "no_data" {
                const BATCH_SIZE: i64 = 10000;
                let mut offset: i64 = 0;

                loop {
                    let data_query = format!(
                        "SELECT * FROM \"{}\" LIMIT {} OFFSET {}",
                        Self::escape_identifier(&table_name),
                        BATCH_SIZE,
                        offset
                    );

                    let data_rows = client.query(&data_query, &[]).await.map_err(|e| QueryError {
                        message: e.to_string(),
                        code: Some(error_codes::QUERY_ERROR.to_string()),
            ..Default::default()
                    })?;

                    if data_rows.is_empty() {
                        break;
                    }

                    let columns: Vec<String> = if !data_rows.is_empty() {
                        data_rows[0]
                            .columns()
                            .iter()
                            .map(|col| col.name().to_string())
                            .collect()
                    } else {
                        Vec::new()
                    };

                    let mut row_buffer: Vec<Vec<String>> = Vec::with_capacity(max_insert_size);

                    for row in &data_rows {
                        let mut values: Vec<String> = Vec::with_capacity(columns.len());

                        for i in 0..columns.len() {
                            let col_type = row.columns()[i].type_();
                            values.push(Self::pg_value_to_sql(row, i, col_type));
                        }

                        row_buffer.push(values);

                        if row_buffer.len() >= max_insert_size {
                            sql_content.push_str(&Self::format_insert_statement(
                                &table_name,
                                &columns,
                                &row_buffer,
                                data_mode,
                            ));
                            row_buffer.clear();
                        }
                    }

                    if !row_buffer.is_empty() {
                        sql_content.push_str(&Self::format_insert_statement(
                            &table_name,
                            &columns,
                            &row_buffer,
                            data_mode,
                        ));
                    }

                    if data_rows.len() < BATCH_SIZE as usize {
                        break;
                    }

                    offset += BATCH_SIZE;
                }

                sql_content.push('\n');
            }
        }

        Ok(sql_content)
    }
}
