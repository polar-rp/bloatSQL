pub mod connection;
pub mod mariadb;

pub use connection::{DatabaseConnection, QueryResult, TableColumn};
pub use mariadb::MariaDbConnection;
