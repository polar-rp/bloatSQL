use super::connection::{DatabaseConnection, DbResult, QueryError, QueryResult, TableColumn};
use async_trait::async_trait;
use base64::{engine::general_purpose, Engine as _};
use native_tls::TlsConnector;
use postgres_native_tls::MakeTlsConnector;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio_postgres::{types::Type, Client, NoTls, Row};

pub struct PostgresConnection {
    client: Arc<Mutex<Client>>,
    // Store connection parameters for reconnection (needed for change_database)
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
        let config = format!(
            "host={} port={} user={} password={} dbname={}",
            host, port, username, password, database
        );

        let client = if ssl_mode == "required" || ssl_mode == "preferred" {
            let connector = TlsConnector::builder()
                .danger_accept_invalid_certs(true)
                .build()
                .map_err(|e| QueryError {
                    message: format!("TLS configuration error: {}", e),
                    code: Some("TLS_ERROR".to_string()),
                })?;

            let tls_connector = MakeTlsConnector::new(connector);

            match tokio_postgres::connect(&config, tls_connector).await {
                Ok((client, connection)) => {
                    tokio::spawn(async move {
                        if let Err(e) = connection.await {
                            eprintln!("PostgreSQL TLS connection error: {}", e);
                        }
                    });
                    client
                }
                Err(e) => {
                    if ssl_mode == "required" {
                        return Err(QueryError {
                            message: format!("SSL connection failed: {}", e),
                            code: Some("SSL_ERROR".to_string()),
                        });
                    }
                    // Fall through to no-SSL connection for "preferred" mode
                    let (client, connection) = tokio_postgres::connect(&config, NoTls)
                        .await
                        .map_err(|e| QueryError {
                            message: format!("Connection failed: {}", e),
                            code: Some("CONNECTION_ERROR".to_string()),
                        })?;

                    tokio::spawn(async move {
                        if let Err(e) = connection.await {
                            eprintln!("PostgreSQL connection error: {}", e);
                        }
                    });
                    client
                }
            }
        } else {
            // No SSL
            let (client, connection) = tokio_postgres::connect(&config, NoTls)
                .await
                .map_err(|e| QueryError {
                    message: format!("Connection failed: {}", e),
                    code: Some("CONNECTION_ERROR".to_string()),
                })?;

            tokio::spawn(async move {
                if let Err(e) = connection.await {
                    eprintln!("PostgreSQL connection error: {}", e);
                }
            });
            client
        };

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

    #[inline]
    fn pg_value_to_json(row: &Row, idx: usize, col_type: &Type) -> serde_json::Value {
        use tokio_postgres::types::Type;

        match *col_type {
            Type::BOOL => row
                .try_get::<_, Option<bool>>(idx)
                .ok()
                .flatten()
                .map(|v| serde_json::Value::Bool(v))
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
                .map(|v| serde_json::Value::String(v))
                .unwrap_or(serde_json::Value::Null),

            Type::BYTEA => row
                .try_get::<_, Option<Vec<u8>>>(idx)
                .ok()
                .flatten()
                .map(|v| serde_json::Value::String(general_purpose::STANDARD.encode(&v)))
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

            _ => {
                // Fallback: try to get as string
                row.try_get::<_, Option<String>>(idx)
                    .ok()
                    .flatten()
                    .map(|v| serde_json::Value::String(v))
                    .unwrap_or(serde_json::Value::Null)
            }
        }
    }

    #[inline]
    fn pg_value_to_sql(row: &Row, idx: usize, col_type: &Type) -> String {
        use tokio_postgres::types::Type;

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
                .map(|v| format!("'{}'", v.replace('\'', "''")))
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
                .map(|v| format!("'{}'", v.replace('\'', "''")))
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
            .map(|c| format!("\"{}\"", c))
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
                    .map(|c| format!("\"{}\" = EXCLUDED.\"{}\"", c, c))
                    .collect::<Vec<_>>()
                    .join(", ")
            ),
            "insert_ignore" => " ON CONFLICT DO NOTHING".to_string(),
            _ => String::new(),
        };

        format!(
            "INSERT INTO \"{}\" ({}) VALUES\n  {}{};\n",
            table_name, column_list, values_list, conflict_clause
        )
    }
}

#[async_trait]
impl DatabaseConnection for PostgresConnection {
    async fn test_connection(&self) -> DbResult<()> {
        let client = self.client.lock().await;
        client
            .simple_query("SELECT 1")
            .await
            .map_err(|e| QueryError {
                message: e.to_string(),
                code: Some("TEST_FAILED".to_string()),
            })?;
        Ok(())
    }

    async fn execute_query(&self, query: &str) -> DbResult<QueryResult> {
        let client = self.client.lock().await;
        let start = std::time::Instant::now();

        let rows = client.query(query, &[]).await.map_err(|e| QueryError {
            message: e.to_string(),
            code: Some("QUERY_ERROR".to_string()),
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

        let row_count = rows.len();
        let mut result_rows = Vec::with_capacity(row_count);

        for row in &rows {
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
            row_count,
            execution_time,
        })
    }

    async fn list_tables(&self) -> DbResult<Vec<String>> {
        let client = self.client.lock().await;

        let query = "SELECT table_name FROM information_schema.tables
                     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
                     ORDER BY table_name";

        let rows = client.query(query, &[]).await.map_err(|e| QueryError {
            message: e.to_string(),
            code: Some("QUERY_ERROR".to_string()),
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

        let rows = client.query(query, &[]).await.map_err(|e| QueryError {
            message: e.to_string(),
            code: Some("QUERY_ERROR".to_string()),
        })?;

        let databases: Vec<String> = rows
            .iter()
            .filter_map(|row| row.try_get::<_, String>(0).ok())
            .collect();

        Ok(databases)
    }

    async fn change_database(&self, database_name: &str) -> DbResult<()> {
        // PostgreSQL doesn't have USE statement, we need to reconnect
        let config = format!(
            "host={} port={} user={} password={} dbname={}",
            self.host, self.port, self.username, self.password, database_name
        );

        let new_client = if self.ssl_mode == "required" || self.ssl_mode == "preferred" {
            let connector = TlsConnector::builder()
                .danger_accept_invalid_certs(true)
                .build()
                .map_err(|e| QueryError {
                    message: format!("TLS configuration error: {}", e),
                    code: Some("TLS_ERROR".to_string()),
                })?;

            let tls_connector = MakeTlsConnector::new(connector);

            match tokio_postgres::connect(&config, tls_connector).await {
                Ok((client, connection)) => {
                    tokio::spawn(async move {
                        if let Err(e) = connection.await {
                            eprintln!("PostgreSQL TLS connection error: {}", e);
                        }
                    });
                    client
                }
                Err(e) => {
                    if self.ssl_mode == "required" {
                        return Err(QueryError {
                            message: format!("SSL connection failed: {}", e),
                            code: Some("SSL_ERROR".to_string()),
                        });
                    }
                    // Fall through to no-SSL connection for "preferred" mode
                    let (client, connection) = tokio_postgres::connect(&config, NoTls)
                        .await
                        .map_err(|e| QueryError {
                            message: format!("Connection failed: {}", e),
                            code: Some("CONNECTION_ERROR".to_string()),
                        })?;

                    tokio::spawn(async move {
                        if let Err(e) = connection.await {
                            eprintln!("PostgreSQL connection error: {}", e);
                        }
                    });
                    client
                }
            }
        } else {
            // No SSL
            let (client, connection) = tokio_postgres::connect(&config, NoTls)
                .await
                .map_err(|e| QueryError {
                    message: format!("Connection failed: {}", e),
                    code: Some("CONNECTION_ERROR".to_string()),
                })?;

            tokio::spawn(async move {
                if let Err(e) = connection.await {
                    eprintln!("PostgreSQL connection error: {}", e);
                }
            });
            client
        };

        // Replace the client
        let mut client = self.client.lock().await;
        *client = new_client;

        // Update current database
        let mut current_db = self.current_database.lock().await;
        *current_db = database_name.to_string();

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
                        c.data_type,
                        c.is_nullable,
                        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary
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

        let rows = client
            .query(query, &[&table_name])
            .await
            .map_err(|e| QueryError {
                message: e.to_string(),
                code: Some("QUERY_ERROR".to_string()),
            })?;

        let columns: Vec<TableColumn> = rows
            .iter()
            .filter_map(|row| {
                Some(TableColumn {
                    name: row.try_get::<_, String>(0).ok()?,
                    data_type: row.try_get::<_, String>(1).ok()?,
                    is_nullable: row.try_get::<_, String>(2).ok()? == "YES",
                    is_primary_key: row.try_get::<_, bool>(3).ok()?,
                })
            })
            .collect();

        Ok(columns)
    }

    async fn disconnect(&self) -> DbResult<()> {
        // PostgreSQL client automatically disconnects when dropped
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
                code: Some("QUERY_ERROR".to_string()),
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
                sql_content.push_str(&format!("DROP TABLE IF EXISTS \"{}\" CASCADE;\n", table_name));
            }

            if include_create {
                // Get table definition (simplified version)
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
                        code: Some("QUERY_ERROR".to_string()),
                    })?;

                sql_content.push_str(&format!("CREATE TABLE \"{}\" (\n", table_name));

                let col_defs: Vec<String> = col_rows
                    .iter()
                    .filter_map(|row| {
                        let name = row.try_get::<_, String>(0).ok()?;
                        let data_type = row.try_get::<_, String>(1).ok()?;
                        let max_len = row.try_get::<_, Option<i32>>(2).ok()?;
                        let nullable = row.try_get::<_, String>(3).ok()?;
                        let default = row.try_get::<_, Option<String>>(4).ok()?;

                        let mut def = format!("  \"{}\" {}", name, data_type.to_uppercase());

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
                        table_name, BATCH_SIZE, offset
                    );

                    let data_rows = client
                        .query(&data_query, &[])
                        .await
                        .map_err(|e| QueryError {
                            message: e.to_string(),
                            code: Some("QUERY_ERROR".to_string()),
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
