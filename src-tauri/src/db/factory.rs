use super::connection::{DatabaseConnection, DbResult, QueryError};
use super::mariadb::MariaDbConnection;
use super::postgresql::PostgresConnection;
use std::sync::Arc;

/// Creates a database connection based on the specified database type.
///
/// # Supported Database Types
/// - "mariadb" or "mysql" - Creates a MariaDB/MySQL connection
/// - "postgresql" or "postgres" - Creates a PostgreSQL connection
///
/// # Arguments
/// * `db_type` - The type of database (case-insensitive)
/// * `host` - The database host address
/// * `port` - The database port number
/// * `username` - The database username
/// * `password` - The database password
/// * `database` - The database name to connect to
/// * `ssl_mode` - The SSL mode ("disabled", "preferred", or "required")
///
/// # Returns
/// Returns `Arc<dyn DatabaseConnection>` ready to be inserted into ActiveConnection
///
/// # Errors
/// - Returns `INVALID_DB_TYPE` error code for unsupported database types
/// - Propagates connection errors from the underlying database driver
pub async fn create_connection(
    db_type: &str,
    host: &str,
    port: u16,
    username: &str,
    password: &str,
    database: &str,
    ssl_mode: &str,
) -> DbResult<Arc<dyn DatabaseConnection>> {
    match db_type.to_lowercase().as_str() {
        "mariadb" | "mysql" => {
            let conn = MariaDbConnection::new(host, port, username, password, database, ssl_mode)
                .await?;
            Ok(Arc::new(conn))
        }
        "postgresql" | "postgres" => {
            let conn = PostgresConnection::new(host, port, username, password, database, ssl_mode)
                .await?;
            Ok(Arc::new(conn))
        }
        _ => Err(QueryError::with_code(
            format!(
                "Unsupported database type: '{}'. Supported types: mariadb, mysql, postgresql, postgres",
                db_type
            ),
            "INVALID_DB_TYPE",
        )),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_mariadb_case_insensitive() {
        let test_cases = vec!["mariadb", "MariaDB", "MARIADB", "MaRiAdB"];

        for db_type in test_cases {
            let result = create_connection(
                db_type,
                "localhost",
                3306,
                "root",
                "password",
                "test",
                "disabled",
            )
            .await;

            // We expect connection attempt (which may fail due to no server),
            // but we should NOT get INVALID_DB_TYPE or NOT_IMPLEMENTED errors
            if let Err(e) = result {
                assert_ne!(
                    e.code.as_deref(),
                    Some("INVALID_DB_TYPE"),
                    "Case '{}' should be recognized as valid",
                    db_type
                );
                assert_ne!(
                    e.code.as_deref(),
                    Some("NOT_IMPLEMENTED"),
                    "Case '{}' should not return NOT_IMPLEMENTED",
                    db_type
                );
            }
        }
    }

    #[tokio::test]
    async fn test_mysql_alias() {
        let test_cases = vec!["mysql", "MySQL", "MYSQL"];

        for db_type in test_cases {
            let result = create_connection(
                db_type,
                "localhost",
                3306,
                "root",
                "password",
                "test",
                "disabled",
            )
            .await;

            // Same as above - should be recognized as valid type
            if let Err(e) = result {
                assert_ne!(
                    e.code.as_deref(),
                    Some("INVALID_DB_TYPE"),
                    "Case '{}' should be recognized as valid MySQL alias",
                    db_type
                );
                assert_ne!(
                    e.code.as_deref(),
                    Some("NOT_IMPLEMENTED"),
                    "Case '{}' should not return NOT_IMPLEMENTED",
                    db_type
                );
            }
        }
    }

    #[tokio::test]
    async fn test_postgresql_alias() {
        let test_cases = vec!["postgresql", "PostgreSQL", "POSTGRESQL", "postgres", "Postgres"];

        for db_type in test_cases {
            let result = create_connection(
                db_type,
                "localhost",
                5432,
                "postgres",
                "password",
                "test",
                "disabled",
            )
            .await;

            // We expect connection attempt (which may fail due to no server),
            // but we should NOT get INVALID_DB_TYPE error
            if let Err(e) = result {
                assert_ne!(
                    e.code.as_deref(),
                    Some("INVALID_DB_TYPE"),
                    "Case '{}' should be recognized as valid PostgreSQL type",
                    db_type
                );
                // We expect CONNECTION_ERROR or SSL_ERROR, not INVALID_DB_TYPE
                assert!(
                    e.code.as_deref() == Some("CONNECTION_ERROR")
                        || e.code.as_deref() == Some("SSL_ERROR")
                        || e.code.as_deref() == Some("TLS_ERROR"),
                    "Case '{}' should return connection error, got: {:?}",
                    db_type,
                    e.code
                );
            }
        }
    }

    #[tokio::test]
    async fn test_invalid_db_type() {
        let invalid_types = vec!["mongodb", "redis", "sqlite", "oracle", "mssql", ""];

        for db_type in invalid_types {
            let result = create_connection(
                db_type,
                "localhost",
                3306,
                "user",
                "password",
                "test",
                "disabled",
            )
            .await;

            match result {
                Ok(_) => panic!("Invalid type '{}' should return an error", db_type),
                Err(err) => {
                    assert_eq!(
                        err.code.as_deref(),
                        Some("INVALID_DB_TYPE"),
                        "Invalid type '{}' should return INVALID_DB_TYPE error code",
                        db_type
                    );
                    assert!(
                        err.message.contains("Unsupported database type"),
                        "Error message should indicate unsupported type for '{}'",
                        db_type
                    );
                }
            }
        }
    }
}
