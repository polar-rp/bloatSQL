use super::connection::{DatabaseConnection, DbResult, QueryError, QueryResult, TableColumn};
use async_trait::async_trait;
use mysql_async::{prelude::*, Conn, Opts, OptsBuilder, Pool, PoolConstraints, PoolOpts};
use std::sync::Arc;
use tokio::sync::Mutex;

/// MariaDB/MySQL connection using connection pooling for better performance.
/// Pool automatically manages connection reuse and handles reconnection.
pub struct MariaDbConnection {
    pool: Pool,
    // Keep a dedicated connection for operations that need transaction consistency
    dedicated_conn: Arc<Mutex<Option<Conn>>>,
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
        let make_opts = |enable_ssl: bool| -> Opts {
            let pool_opts = PoolOpts::default()
                .with_constraints(
                    PoolConstraints::new(1, 5).unwrap()
                );

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

        // Try SSL first if requested
        if ssl_mode == "required" || ssl_mode == "preferred" {
            let opts = make_opts(true);
            let pool = Pool::new(opts);
            
            match pool.get_conn().await {
                Ok(conn) => {
                    return Ok(MariaDbConnection {
                        pool,
                        dedicated_conn: Arc::new(Mutex::new(Some(conn))),
                    });
                }
                Err(e) => {
                    // If required, fail immediately
                    if ssl_mode == "required" {
                        return Err(QueryError {
                            message: format!("SSL Connection failed: {}", e),
                            code: None,
                        });
                    }
                    // If preferred, fall through to try non-SSL
                }
            }
        }

        // Fallback to non-SSL (or if disabled)
        let opts = make_opts(false);
        let pool = Pool::new(opts);
        
        let conn = pool.get_conn().await.map_err(|e| QueryError {
            message: e.to_string(),
            code: None,
        })?;

        Ok(MariaDbConnection {
            pool,
            dedicated_conn: Arc::new(Mutex::new(Some(conn))),
        })
    }

    /// Get a connection from the pool
    async fn get_conn(&self) -> DbResult<Conn> {
        self.pool.get_conn().await.map_err(|e| QueryError {
            message: e.to_string(),
            code: None,
        })
    }

    /// Helper to convert MySQL value to JSON
    #[inline]
    fn mysql_value_to_json(value: mysql_async::Value) -> serde_json::Value {
        match value {
            mysql_async::Value::NULL => serde_json::Value::Null,
            mysql_async::Value::Bytes(b) => {
                serde_json::Value::String(String::from_utf8_lossy(&b).into_owned())
            }
            mysql_async::Value::Int(i) => serde_json::Value::Number(i.into()),
            mysql_async::Value::UInt(u) => serde_json::Value::Number(u.into()),
            mysql_async::Value::Float(f) => {
                serde_json::Number::from_f64(f as f64)
                    .map(serde_json::Value::Number)
                    .unwrap_or(serde_json::Value::Null)
            }
            mysql_async::Value::Double(d) => {
                serde_json::Number::from_f64(d)
                    .map(serde_json::Value::Number)
                    .unwrap_or(serde_json::Value::Null)
            }
            mysql_async::Value::Date(y, m, d, h, min, s, _) => {
                serde_json::Value::String(format!(
                    "{:04}-{:02}-{:02} {:02}:{:02}:{:02}",
                    y, m, d, h, min, s
                ))
            }
            mysql_async::Value::Time(_, h, m, s, _, _) => {
                serde_json::Value::String(format!("{:02}:{:02}:{:02}", h, m, s))
            }
        }
    }

    /// Helper to convert MySQL value to SQL string for export
    #[inline]
    fn mysql_value_to_sql(value: mysql_async::Value) -> String {
        match value {
            mysql_async::Value::NULL => "NULL".to_string(),
            mysql_async::Value::Bytes(b) => {
                let s = String::from_utf8_lossy(&b);
                format!("'{}'", s.replace('\'', "''"))
            }
            mysql_async::Value::Int(i) => i.to_string(),
            mysql_async::Value::UInt(u) => u.to_string(),
            mysql_async::Value::Float(f) => f.to_string(),
            mysql_async::Value::Double(d) => d.to_string(),
            mysql_async::Value::Date(y, m, d, h, min, s, _) => {
                format!("'{:04}-{:02}-{:02} {:02}:{:02}:{:02}'", y, m, d, h, min, s)
            }
            mysql_async::Value::Time(_, h, m, s, _, _) => {
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
            .map(|c| format!("`{}`", c))
            .collect::<Vec<_>>()
            .join(", ");

        let values_list = rows
            .iter()
            .map(|row| format!("({})", row.join(", ")))
            .collect::<Vec<_>>()
            .join(",\n  ");

        format!(
            "{} INTO `{}` ({}) VALUES\n  {};\n",
            statement_type, table_name, column_list, values_list
        )
    }
}

#[async_trait]
impl DatabaseConnection for MariaDbConnection {
    async fn test_connection(&self) -> DbResult<()> {
        let mut conn = self.get_conn().await?;
        conn.ping().await.map_err(|e| QueryError {
            message: e.to_string(),
            code: None,
        })?;
        Ok(())
    }

    async fn execute_query(&self, query: &str) -> DbResult<QueryResult> {
        let mut conn = self.get_conn().await?;
        let start = std::time::Instant::now();

        let result = conn.query_iter(query).await.map_err(|e| QueryError {
            message: e.to_string(),
            code: None,
        })?;

        let columns: Vec<String> = result
            .columns()
            .map(|cols| cols.iter().map(|col| col.name_str().to_string()).collect())
            .unwrap_or_default();

        // Pre-allocate with estimated capacity
        let mut result_rows: Vec<serde_json::Value> = Vec::with_capacity(1000);
        let mut row_count = 0;
        let column_count = columns.len();

        let mut result = result;
        while let Some(row) = result.next().await.map_err(|e| QueryError {
            message: e.to_string(),
            code: None,
        })? {
            row_count += 1;

            // Pre-allocate map with known capacity
            let mut row_map = serde_json::Map::with_capacity(column_count);

            for (i, col) in columns.iter().enumerate() {
                let value: mysql_async::Value = row.get(i).unwrap_or(mysql_async::Value::NULL);
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
        })
    }

    async fn list_tables(&self) -> DbResult<Vec<String>> {
        let mut conn = self.get_conn().await?;

        let result = conn.query_iter("SHOW TABLES").await.map_err(|e| QueryError {
            message: e.to_string(),
            code: None,
        })?;

        let mut tables: Vec<String> = Vec::with_capacity(100);
        let mut result = result;

        while let Some(row) = result.next().await.map_err(|e| QueryError {
            message: e.to_string(),
            code: None,
        })? {
            let table_name: String = row.get(0).unwrap_or_default();
            tables.push(table_name);
        }

        Ok(tables)
    }

    async fn get_table_columns(&self, table_name: &str) -> DbResult<Vec<TableColumn>> {
        let mut conn = self.get_conn().await?;

        let query = format!("SHOW COLUMNS FROM `{}`", table_name);
        let result = conn.query_iter(query.as_str()).await.map_err(|e| QueryError {
            message: e.to_string(),
            code: None,
        })?;

        let mut columns: Vec<TableColumn> = Vec::with_capacity(50);
        let mut result = result;

        while let Some(row) = result.next().await.map_err(|e| QueryError {
            message: e.to_string(),
            code: None,
        })? {
            let name: String = row.get(0).unwrap_or_default();
            let data_type: String = row.get(1).unwrap_or_default();
            let nullable: String = row.get(2).unwrap_or_default();
            let key: String = row.get(3).unwrap_or_default();

            columns.push(TableColumn {
                name,
                data_type,
                is_nullable: nullable == "YES",
                is_primary_key: key == "PRI",
            });
        }

        Ok(columns)
    }

    async fn disconnect(&self) -> DbResult<()> {
        // Clear the dedicated connection
        let mut dedicated = self.dedicated_conn.lock().await;
        *dedicated = None;

        // Disconnect the pool (drops all connections)
        self.pool.clone().disconnect().await.map_err(|e| QueryError {
            message: e.to_string(),
            code: None,
        })?;

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
        let mut conn = self.get_conn().await?;

        // Estimate initial capacity based on typical export size
        let mut sql_content = String::with_capacity(1024 * 1024); // 1MB initial capacity

        // Get tables to export
        let tables_to_export = if selected_tables.is_empty() {
            // Export all tables
            let result = conn.query_iter("SHOW TABLES").await.map_err(|e| QueryError {
                message: e.to_string(),
                code: None,
            })?;

            let mut tables: Vec<String> = Vec::new();
            let mut result = result;
            while let Some(row) = result.next().await.map_err(|e| QueryError {
                message: e.to_string(),
                code: None,
            })? {
                let table_name: String = row.get(0).unwrap_or_default();
                tables.push(table_name);
            }
            tables
        } else {
            selected_tables.to_vec()
        };

        // Process each table
        for table_name in tables_to_export {
            sql_content.push_str(&format!("\n-- Table: {}\n", table_name));

            // DROP TABLE
            if include_drop {
                sql_content.push_str(&format!("DROP TABLE IF EXISTS `{}`;\n", table_name));
            }

            // CREATE TABLE
            if include_create {
                let create_query = format!("SHOW CREATE TABLE `{}`", table_name);
                let create_result = conn.query_iter(create_query.as_str()).await.map_err(|e| QueryError {
                    message: e.to_string(),
                    code: None,
                })?;

                let mut create_result = create_result;
                if let Some(row) = create_result.next().await.map_err(|e| QueryError {
                    message: e.to_string(),
                    code: None,
                })? {
                    let create_statement: String = row.get(1).unwrap_or_default();
                    sql_content.push_str(&create_statement);
                    sql_content.push_str(";\n\n");
                }
            }

            // Export data with streaming/batching
            if data_mode != "no_data" {
                // Use pagination to avoid loading entire table into memory
                const BATCH_SIZE: usize = 10000;
                let mut offset: usize = 0;

                loop {
                    let data_query = format!(
                        "SELECT * FROM `{}` LIMIT {} OFFSET {}",
                        table_name, BATCH_SIZE, offset
                    );

                    let data_result = conn.query_iter(data_query.as_str()).await.map_err(|e| QueryError {
                        message: e.to_string(),
                        code: None,
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
                        code: None,
                    })? {
                        rows_in_batch += 1;
                        let mut values: Vec<String> = Vec::with_capacity(columns.len());

                        for i in 0..columns.len() {
                            let value: mysql_async::Value = row.get(i).unwrap_or(mysql_async::Value::NULL);
                            values.push(Self::mysql_value_to_sql(value));
                        }

                        row_buffer.push(values);

                        // Flush buffer when it reaches max_insert_size
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

                    // Flush remaining rows in buffer
                    if !row_buffer.is_empty() {
                        sql_content.push_str(&Self::format_insert_statement(
                            &table_name,
                            &columns,
                            &row_buffer,
                            data_mode,
                        ));
                    }

                    // If we got fewer rows than BATCH_SIZE, we've reached the end
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
