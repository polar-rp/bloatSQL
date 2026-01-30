use super::connection::{
    error_codes, DatabaseConnection, DbResult, QueryError, QueryResult, TableColumn,
    TableRelationship, DEFAULT_QUERY_TIMEOUT, MAX_QUERY_ROWS,
};
use async_trait::async_trait;
use mysql_async::{prelude::*, Opts, OptsBuilder, Pool, PoolConstraints, PoolOpts, Value};
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::time::timeout;
use tracing::{debug, warn};

/// MariaDB/MySQL database connection implementation.
pub struct MariaDbConnection {
    pool: Pool,
    current_database: Arc<Mutex<String>>,
    // Connection parameters stored for potential future reconnection
    #[allow(dead_code)]
    host: String,
    #[allow(dead_code)]
    port: u16,
    #[allow(dead_code)]
    username: String,
    #[allow(dead_code)]
    password: String,
    #[allow(dead_code)]
    ssl_mode: String,
}

impl MariaDbConnection {
    pub async fn new(
        host: &str,
        port: u16,
        user: &str,
        password: &str,
        dbname: &str,
        ssl_mode: &str,
    ) -> DbResult<Self> {
        let pool = Self::create_pool(host, port, user, password, dbname, ssl_mode).await?;

        // Verify connection works
        let conn = pool.get_conn().await.map_err(|e| QueryError {
            message: format!("Failed to connect: {}", e),
            code: Some(error_codes::CONNECTION_ERROR.to_string()),
            ..Default::default()
        })?;
        drop(conn);

        Ok(MariaDbConnection {
            pool,
            current_database: Arc::new(Mutex::new(dbname.to_string())),
            host: host.to_string(),
            port,
            username: user.to_string(),
            password: password.to_string(),
            ssl_mode: ssl_mode.to_string(),
        })
    }

    async fn create_pool(
        host: &str,
        port: u16,
        user: &str,
        password: &str,
        dbname: &str,
        ssl_mode: &str,
    ) -> DbResult<Pool> {
        let make_opts = |enable_ssl: bool| -> Opts {
            let pool_opts =
                PoolOpts::default().with_constraints(PoolConstraints::new(1, 5).unwrap());

            let ssl_opts = if enable_ssl {
                Some(mysql_async::SslOpts::default().with_danger_accept_invalid_certs(true))
            } else {
                None
            };

            OptsBuilder::default()
                .ip_or_hostname(host)
                .tcp_port(port)
                .user(Some(user.to_string()))
                .pass(Some(password.to_string()))
                .db_name(Some(dbname.to_string()))
                .pool_opts(pool_opts)
                .ssl_opts(ssl_opts)
                .into()
        };

        if ssl_mode == "required" || ssl_mode == "preferred" {
            let opts = make_opts(true);
            let pool = Pool::new(opts);

            match pool.get_conn().await {
                Ok(conn) => {
                    drop(conn);
                    debug!("MariaDB SSL connection established");
                    return Ok(pool);
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

        let opts = make_opts(false);
        let pool = Pool::new(opts);

        pool.get_conn().await.map_err(|e| QueryError {
            message: format!("Connection failed: {}", e),
            code: Some(error_codes::CONNECTION_ERROR.to_string()),
            ..Default::default()
        })?;

        debug!("MariaDB non-SSL connection established");
        Ok(pool)
    }

    async fn get_conn(&self) -> DbResult<mysql_async::Conn> {
        let current_db = self.current_database.lock().await.clone();

        let mut conn = self.pool.get_conn().await.map_err(|e| QueryError {
            message: e.to_string(),
            code: Some(error_codes::CONNECTION_ERROR.to_string()),
            ..Default::default()
        })?;

        // Ensure we're using the correct database
        let query = format!("USE `{}`", Self::escape_identifier(&current_db));
        conn.query_drop(&query).await.map_err(|e| QueryError {
            message: e.to_string(),
            code: Some(error_codes::QUERY_ERROR.to_string()),
            ..Default::default()
        })?;

        Ok(conn)
    }

    /// Escapes an identifier (table/column name) for safe use in SQL.
    #[inline]
    fn escape_identifier(name: &str) -> String {
        name.replace('`', "``")
    }

    /// Escapes a string value for safe use in SQL.
    #[inline]
    fn escape_string(value: &str) -> String {
        value.replace('\'', "''").replace('\\', "\\\\")
    }

    #[inline]
    fn mysql_value_to_json(value: Value) -> serde_json::Value {
        match value {
            Value::NULL => serde_json::Value::Null,
            Value::Bytes(b) => {
                serde_json::Value::String(String::from_utf8_lossy(&b).into_owned())
            }
            Value::Int(i) => serde_json::Value::Number(i.into()),
            Value::UInt(u) => serde_json::Value::Number(u.into()),
            Value::Float(f) => serde_json::Number::from_f64(f as f64)
                .map(serde_json::Value::Number)
                .unwrap_or(serde_json::Value::Null),
            Value::Double(d) => serde_json::Number::from_f64(d)
                .map(serde_json::Value::Number)
                .unwrap_or(serde_json::Value::Null),
            Value::Date(y, m, d, h, min, s, _) => serde_json::Value::String(format!(
                "{:04}-{:02}-{:02} {:02}:{:02}:{:02}",
                y, m, d, h, min, s
            )),
            Value::Time(_, h, m, s, _, _) => {
                serde_json::Value::String(format!("{:02}:{:02}:{:02}", h, m, s))
            }
        }
    }

    #[inline]
    fn mysql_value_to_sql(value: Value) -> String {
        match value {
            Value::NULL => "NULL".to_string(),
            Value::Bytes(b) => {
                let s = String::from_utf8_lossy(&b);
                format!("'{}'", Self::escape_string(&s))
            }
            Value::Int(i) => i.to_string(),
            Value::UInt(u) => u.to_string(),
            Value::Float(f) => f.to_string(),
            Value::Double(d) => d.to_string(),
            Value::Date(y, m, d, h, min, s, _) => {
                format!("'{:04}-{:02}-{:02} {:02}:{:02}:{:02}'", y, m, d, h, min, s)
            }
            Value::Time(_, h, m, s, _, _) => {
                format!("'{:02}:{:02}:{:02}'", h, m, s)
            }
        }
    }

    fn format_insert_statement(
        table_name: &str,
        columns: &[String],
        rows: &[Vec<String>],
        data_mode: &str,
    ) -> String {
        let statement_type = match data_mode {
            "replace" => "REPLACE",
            "insert_ignore" => "INSERT IGNORE",
            _ => "INSERT",
        };

        let column_list = columns
            .iter()
            .map(|c| format!("`{}`", Self::escape_identifier(c)))
            .collect::<Vec<_>>()
            .join(", ");

        let values_list = rows
            .iter()
            .map(|row| format!("({})", row.join(", ")))
            .collect::<Vec<_>>()
            .join(",\n  ");

        format!(
            "{} INTO `{}` ({}) VALUES\n  {};\n",
            statement_type,
            Self::escape_identifier(table_name),
            column_list,
            values_list
        )
    }
}

#[async_trait]
impl DatabaseConnection for MariaDbConnection {
    async fn test_connection(&self) -> DbResult<()> {
        let mut conn = self.get_conn().await?;

        timeout(DEFAULT_QUERY_TIMEOUT, conn.ping())
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
        let mut conn = self.get_conn().await?;
        let start = std::time::Instant::now();

        let result = timeout(DEFAULT_QUERY_TIMEOUT, conn.query_iter(query))
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

        let columns: Vec<String> = result
            .columns()
            .map(|cols| cols.iter().map(|col| col.name_str().to_string()).collect())
            .unwrap_or_default();

        let mut result_rows: Vec<serde_json::Value> = Vec::with_capacity(1000);
        let mut row_count = 0;
        let mut truncated = false;
        let column_count = columns.len();

        let mut result = result;
        while let Some(row) = result.next().await.map_err(|e| QueryError {
            message: e.to_string(),
            code: Some(error_codes::QUERY_ERROR.to_string()),
            ..Default::default()
        })? {
            row_count += 1;

            if row_count > MAX_QUERY_ROWS {
                truncated = true;
                continue; // Count remaining rows but don't store them
            }

            let mut row_map = serde_json::Map::with_capacity(column_count);

            for (i, col) in columns.iter().enumerate() {
                let value: Value = row.get(i).unwrap_or(Value::NULL);
                row_map.insert(col.clone(), Self::mysql_value_to_json(value));
            }

            result_rows.push(serde_json::Value::Object(row_map));
        }

        let execution_time = start.elapsed().as_millis();

        Ok(QueryResult {
            columns,
            rows: result_rows,
            row_count,
            execution_time,
            truncated,
        })
    }

    async fn list_tables(&self) -> DbResult<Vec<String>> {
        let mut conn = self.get_conn().await?;

        let result = timeout(DEFAULT_QUERY_TIMEOUT, conn.query_iter("SHOW TABLES"))
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

        let mut tables: Vec<String> = Vec::with_capacity(100);
        let mut result = result;

        while let Some(row) = result.next().await.map_err(|e| QueryError {
            message: e.to_string(),
            code: Some(error_codes::QUERY_ERROR.to_string()),
            ..Default::default()
        })? {
            let table_name: String = row.get(0).unwrap_or_default();
            tables.push(table_name);
        }

        Ok(tables)
    }

    async fn list_databases(&self) -> DbResult<Vec<String>> {
        let mut conn = self.pool.get_conn().await.map_err(|e| QueryError {
            message: e.to_string(),
            code: Some(error_codes::CONNECTION_ERROR.to_string()),
            ..Default::default()
        })?;

        let result = timeout(DEFAULT_QUERY_TIMEOUT, conn.query_iter("SHOW DATABASES"))
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

        let mut databases: Vec<String> = Vec::with_capacity(20);
        let mut result = result;

        while let Some(row) = result.next().await.map_err(|e| QueryError {
            message: e.to_string(),
            code: Some(error_codes::QUERY_ERROR.to_string()),
            ..Default::default()
        })? {
            let db_name: String = row.get(0).unwrap_or_default();
            databases.push(db_name);
        }

        Ok(databases)
    }

    async fn change_database(&self, database_name: &str) -> DbResult<()> {
        // Verify the database exists by trying to use it
        let mut conn = self.pool.get_conn().await.map_err(|e| QueryError {
            message: e.to_string(),
            code: Some(error_codes::CONNECTION_ERROR.to_string()),
            ..Default::default()
        })?;

        let query = format!("USE `{}`", Self::escape_identifier(database_name));
        conn.query_drop(&query).await.map_err(|e| QueryError {
            message: e.to_string(),
            code: Some(error_codes::QUERY_ERROR.to_string()),
            ..Default::default()
        })?;

        // Update the stored database name for future connections
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
        let mut conn = self.get_conn().await?;

        // Get current database name
        let db_name: String = conn
            .query_first("SELECT DATABASE()")
            .await
            .map_err(|e| QueryError {
                message: e.to_string(),
                code: Some(error_codes::QUERY_ERROR.to_string()),
            ..Default::default()
            })?
            .unwrap_or_default();

        let query = "SELECT
                        c.COLUMN_NAME,
                        c.COLUMN_TYPE,
                        c.IS_NULLABLE,
                        c.COLUMN_KEY,
                        c.COLUMN_DEFAULT,
                        c.CHARACTER_MAXIMUM_LENGTH,
                        c.NUMERIC_PRECISION
                     FROM information_schema.COLUMNS c
                     WHERE c.TABLE_SCHEMA = ?
                        AND c.TABLE_NAME = ?
                     ORDER BY c.ORDINAL_POSITION";

        let result = timeout(
            DEFAULT_QUERY_TIMEOUT,
            conn.exec_iter(query, (&db_name, table_name)),
        )
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

        let mut columns: Vec<TableColumn> = Vec::with_capacity(50);
        let mut result = result;

        while let Some(row) = result.next().await.map_err(|e| QueryError {
            message: e.to_string(),
            code: Some(error_codes::QUERY_ERROR.to_string()),
            ..Default::default()
        })? {
            let name: Value = row.get(0).unwrap_or(Value::NULL);
            let column_type: Value = row.get(1).unwrap_or(Value::NULL);
            let nullable: Value = row.get(2).unwrap_or(Value::NULL);
            let key: Value = row.get(3).unwrap_or(Value::NULL);
            let column_default: Value = row.get(4).unwrap_or(Value::NULL);
            let character_maximum_length: Value = row.get(5).unwrap_or(Value::NULL);
            let numeric_precision: Value = row.get(6).unwrap_or(Value::NULL);

            // Helper to convert Value to String
            let value_to_string = |v: Value| -> String {
                match v {
                    Value::Bytes(b) => String::from_utf8_lossy(&b).into_owned(),
                    _ => String::new(),
                }
            };

            // Helper to convert Value to Option<String>
            let value_to_option_string = |v: Value| -> Option<String> {
                match v {
                    Value::NULL => None,
                    Value::Bytes(b) => Some(String::from_utf8_lossy(&b).into_owned()),
                    _ => None,
                }
            };

            // Helper to convert Value to Option<i64>
            let value_to_option_i64 = |v: Value| -> Option<i64> {
                match v {
                    Value::NULL => None,
                    Value::Int(i) => Some(i),
                    Value::UInt(u) => Some(u as i64),
                    _ => None,
                }
            };

            columns.push(TableColumn {
                name: value_to_string(name),
                data_type: value_to_string(column_type),
                is_nullable: value_to_string(nullable) == "YES",
                is_primary_key: value_to_string(key) == "PRI",
                column_default: value_to_option_string(column_default),
                character_maximum_length: value_to_option_i64(character_maximum_length),
                numeric_precision: value_to_option_i64(numeric_precision),
            });
        }

        Ok(columns)
    }

    async fn get_table_relationships(&self) -> DbResult<Vec<TableRelationship>> {
        let mut conn = self.get_conn().await?;

        let db_name: String = conn
            .query_first("SELECT DATABASE()")
            .await
            .map_err(|e| QueryError {
                message: e.to_string(),
                code: Some(error_codes::QUERY_ERROR.to_string()),
            ..Default::default()
            })?
            .unwrap_or_default();

        let query = "SELECT
                        kcu.TABLE_NAME,
                        kcu.COLUMN_NAME,
                        kcu.REFERENCED_TABLE_NAME,
                        kcu.REFERENCED_COLUMN_NAME,
                        kcu.CONSTRAINT_NAME
                     FROM information_schema.KEY_COLUMN_USAGE kcu
                     WHERE kcu.TABLE_SCHEMA = ?
                        AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
                     ORDER BY kcu.TABLE_NAME, kcu.ORDINAL_POSITION";

        let result = timeout(DEFAULT_QUERY_TIMEOUT, conn.exec_iter(query, (&db_name,)))
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

        let mut relationships: Vec<TableRelationship> = Vec::new();
        let mut result = result;

        while let Some(row) = result.next().await.map_err(|e| QueryError {
            message: e.to_string(),
            code: Some(error_codes::QUERY_ERROR.to_string()),
            ..Default::default()
        })? {
            let from_table: String = row.get(0).unwrap_or_default();
            let from_column: String = row.get(1).unwrap_or_default();
            let to_table: String = row.get(2).unwrap_or_default();
            let to_column: String = row.get(3).unwrap_or_default();
            let constraint_name: String = row.get(4).unwrap_or_default();

            relationships.push(TableRelationship {
                from_table,
                from_column,
                to_table,
                to_column,
                constraint_name,
            });
        }

        Ok(relationships)
    }

    async fn disconnect(&self) -> DbResult<()> {
        self.pool.clone().disconnect().await.map_err(|e| QueryError {
            message: e.to_string(),
            code: Some(error_codes::CONNECTION_ERROR.to_string()),
            ..Default::default()
        })?;

        debug!("MariaDB connection disconnected");
        Ok(())
    }

    async fn update_cell(
        &self,
        table_name: &str,
        column_name: &str,
        new_value: Option<&str>,
        primary_key_column: &str,
        primary_key_value: &str,
    ) -> DbResult<String> {
        let mut conn = self.get_conn().await?;

        // Build the logged query with actual values for display purposes
        let logged_query = match new_value {
            Some(value) => {
                format!(
                    "UPDATE `{}` SET `{}` = '{}' WHERE `{}` = '{}'",
                    Self::escape_identifier(table_name),
                    Self::escape_identifier(column_name),
                    Self::escape_string(value),
                    Self::escape_identifier(primary_key_column),
                    Self::escape_string(primary_key_value)
                )
            }
            None => {
                format!(
                    "UPDATE `{}` SET `{}` = NULL WHERE `{}` = '{}'",
                    Self::escape_identifier(table_name),
                    Self::escape_identifier(column_name),
                    Self::escape_identifier(primary_key_column),
                    Self::escape_string(primary_key_value)
                )
            }
        };

        // Handle NULL and non-NULL cases separately to avoid type serialization issues
        match new_value {
            Some(value) => {
                let query = format!(
                    "UPDATE `{}` SET `{}` = ? WHERE `{}` = ?",
                    Self::escape_identifier(table_name),
                    Self::escape_identifier(column_name),
                    Self::escape_identifier(primary_key_column)
                );

                timeout(
                    DEFAULT_QUERY_TIMEOUT,
                    conn.exec_drop(&query, (value, primary_key_value)),
                )
                .await
                .map_err(|_| QueryError {
                    message: "Update timed out".to_string(),
                    code: Some(error_codes::TIMEOUT_ERROR.to_string()),
            ..Default::default()
                })?
                .map_err(|e| QueryError {
                    message: e.to_string(),
                    code: Some(error_codes::QUERY_ERROR.to_string()),
            ..Default::default()
                })?;
            }
            None => {
                let query = format!(
                    "UPDATE `{}` SET `{}` = NULL WHERE `{}` = ?",
                    Self::escape_identifier(table_name),
                    Self::escape_identifier(column_name),
                    Self::escape_identifier(primary_key_column)
                );

                timeout(
                    DEFAULT_QUERY_TIMEOUT,
                    conn.exec_drop(&query, (primary_key_value,)),
                )
                .await
                .map_err(|_| QueryError {
                    message: "Update timed out".to_string(),
                    code: Some(error_codes::TIMEOUT_ERROR.to_string()),
            ..Default::default()
                })?
                .map_err(|e| QueryError {
                    message: e.to_string(),
                    code: Some(error_codes::QUERY_ERROR.to_string()),
            ..Default::default()
                })?;
            }
        }

        Ok(logged_query)
    }

    async fn export_database_with_options(
        &self,
        include_drop: bool,
        include_create: bool,
        data_mode: &str,
        selected_tables: &[String],
        max_insert_size: usize,
    ) -> DbResult<String> {
        let mut conn = self.get_conn().await?;

        let mut sql_content = String::with_capacity(1024 * 1024);

        let tables_to_export = if selected_tables.is_empty() {
            let result = conn.query_iter("SHOW TABLES").await.map_err(|e| QueryError {
                message: e.to_string(),
                code: Some(error_codes::QUERY_ERROR.to_string()),
            ..Default::default()
            })?;

            let mut tables: Vec<String> = Vec::new();
            let mut result = result;
            while let Some(row) = result.next().await.map_err(|e| QueryError {
                message: e.to_string(),
                code: Some(error_codes::QUERY_ERROR.to_string()),
            ..Default::default()
            })? {
                let table_name: String = row.get(0).unwrap_or_default();
                tables.push(table_name);
            }
            tables
        } else {
            selected_tables.to_vec()
        };

        for table_name in tables_to_export {
            sql_content.push_str(&format!("\n-- Table: {}\n", table_name));

            if include_drop {
                sql_content.push_str(&format!(
                    "DROP TABLE IF EXISTS `{}`;\n",
                    Self::escape_identifier(&table_name)
                ));
            }

            if include_create {
                let create_query = format!(
                    "SHOW CREATE TABLE `{}`",
                    Self::escape_identifier(&table_name)
                );
                let create_result =
                    conn.query_iter(create_query.as_str())
                        .await
                        .map_err(|e| QueryError {
                            message: e.to_string(),
                            code: Some(error_codes::QUERY_ERROR.to_string()),
            ..Default::default()
                        })?;

                let mut create_result = create_result;
                if let Some(row) = create_result.next().await.map_err(|e| QueryError {
                    message: e.to_string(),
                    code: Some(error_codes::QUERY_ERROR.to_string()),
            ..Default::default()
                })? {
                    let create_statement: String = row.get(1).unwrap_or_default();
                    sql_content.push_str(&create_statement);
                    sql_content.push_str(";\n\n");
                }
            }

            if data_mode != "no_data" {
                const BATCH_SIZE: usize = 10000;
                let mut offset: usize = 0;

                loop {
                    let data_query = format!(
                        "SELECT * FROM `{}` LIMIT {} OFFSET {}",
                        Self::escape_identifier(&table_name),
                        BATCH_SIZE,
                        offset
                    );

                    let data_result =
                        conn.query_iter(data_query.as_str())
                            .await
                            .map_err(|e| QueryError {
                                message: e.to_string(),
                                code: Some(error_codes::QUERY_ERROR.to_string()),
            ..Default::default()
                            })?;

                    let columns: Vec<String> = data_result
                        .columns()
                        .map(|cols| cols.iter().map(|col| col.name_str().to_string()).collect())
                        .unwrap_or_default();

                    let mut data_result = data_result;
                    let mut row_buffer: Vec<Vec<String>> = Vec::with_capacity(max_insert_size);
                    let mut rows_in_batch = 0;

                    while let Some(row) = data_result.next().await.map_err(|e| QueryError {
                        message: e.to_string(),
                        code: Some(error_codes::QUERY_ERROR.to_string()),
            ..Default::default()
                    })? {
                        rows_in_batch += 1;
                        let mut values: Vec<String> = Vec::with_capacity(columns.len());

                        for i in 0..columns.len() {
                            let value: Value = row.get(i).unwrap_or(Value::NULL);
                            values.push(Self::mysql_value_to_sql(value));
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

                    if rows_in_batch < BATCH_SIZE {
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
