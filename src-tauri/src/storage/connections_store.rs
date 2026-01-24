use rusqlite::{params, Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredConnection {
    pub id: String,
    pub name: String,
    pub db_type: String,
    pub host: String,
    pub port: i32,
    pub username: String,
    pub password_encrypted: String,
    pub database: String,
    pub ssl_mode: String,
}

pub struct ConnectionsStore {
    db: Mutex<Connection>,
}

impl ConnectionsStore {
    pub fn new(db_path: PathBuf) -> SqlResult<Self> {
        let db = Connection::open(db_path)?;
        let store = ConnectionsStore {
            db: Mutex::new(db),
        };
        store.init_tables()?;
        Ok(store)
    }

    fn init_tables(&self) -> SqlResult<()> {
        let db = self.db.lock().unwrap();
        db.execute(
            "CREATE TABLE IF NOT EXISTS connections (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                db_type TEXT NOT NULL,
                host TEXT NOT NULL,
                port INTEGER NOT NULL,
                username TEXT NOT NULL,
                password_encrypted TEXT NOT NULL,
                database TEXT NOT NULL,
                ssl_mode TEXT NOT NULL DEFAULT 'preferred',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;
        // Migration for existing databases
        let _ = db.execute("ALTER TABLE connections ADD COLUMN ssl_mode TEXT NOT NULL DEFAULT 'preferred'", []);
        Ok(())
    }

    pub fn save_connection(&self, conn: StoredConnection) -> SqlResult<StoredConnection> {
        let id = if conn.id.is_empty() {
            Uuid::new_v4().to_string()
        } else {
            conn.id.clone()
        };

        let password_encrypted = self.encrypt_password(&conn.password_encrypted);
        let db = self.db.lock().unwrap();

        db.execute(
            "INSERT OR REPLACE INTO connections (id, name, db_type, host, port, username, password_encrypted, database, ssl_mode)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![
                &id,
                &conn.name,
                &conn.db_type,
                &conn.host,
                conn.port,
                &conn.username,
                password_encrypted,
                &conn.database,
                &conn.ssl_mode
            ],
        )?;

        Ok(StoredConnection {
            id,
            name: conn.name,
            db_type: conn.db_type,
            host: conn.host,
            port: conn.port,
            username: conn.username,
            password_encrypted: conn.password_encrypted,
            database: conn.database,
            ssl_mode: conn.ssl_mode,
        })
    }

    pub fn get_all_connections(&self) -> SqlResult<Vec<StoredConnection>> {
        let db = self.db.lock().unwrap();
        let mut stmt = db.prepare(
            "SELECT id, name, db_type, host, port, username, password_encrypted, database, ssl_mode
             FROM connections ORDER BY created_at DESC",
        )?;

        let connections = stmt.query_map([], |row| {
            let password_encrypted: String = row.get(6)?;
            let password = self.decrypt_password(&password_encrypted);

            Ok(StoredConnection {
                id: row.get(0)?,
                name: row.get(1)?,
                db_type: row.get(2)?,
                host: row.get(3)?,
                port: row.get(4)?,
                username: row.get(5)?,
                password_encrypted: password,
                database: row.get(7)?,
                ssl_mode: row.get(8)?,
            })
        })?;

        let mut result = Vec::new();
        for conn in connections {
            if let Ok(c) = conn {
                result.push(c);
            }
        }
        Ok(result)
    }

    pub fn get_connection(&self, id: &str) -> SqlResult<Option<StoredConnection>> {
        let db = self.db.lock().unwrap();
        let mut stmt = db.prepare(
            "SELECT id, name, db_type, host, port, username, password_encrypted, database, ssl_mode
             FROM connections WHERE id = ?",
        )?;

        let result = stmt.query_row(params![id], |row| {
            let password_encrypted: String = row.get(6)?;
            let password = self.decrypt_password(&password_encrypted);

            Ok(StoredConnection {
                id: row.get(0)?,
                name: row.get(1)?,
                db_type: row.get(2)?,
                host: row.get(3)?,
                port: row.get(4)?,
                username: row.get(5)?,
                password_encrypted: password,
                database: row.get(7)?,
                ssl_mode: row.get(8)?,
            })
        });

        match result {
            Ok(conn) => Ok(Some(conn)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    pub fn delete_connection(&self, id: &str) -> SqlResult<bool> {
        let db = self.db.lock().unwrap();
        let rows_deleted = db.execute("DELETE FROM connections WHERE id = ?", params![id])?;
        Ok(rows_deleted > 0)
    }

    // Simple password encryption/decryption (base64)
    // In production, use proper encryption like AES
    fn encrypt_password(&self, password: &str) -> String {
        use base64::Engine;
        let engine = base64::engine::general_purpose::STANDARD;
        engine.encode(password.as_bytes())
    }

    fn decrypt_password(&self, encrypted: &str) -> String {
        use base64::Engine;
        let engine = base64::engine::general_purpose::STANDARD;
        match engine.decode(encrypted) {
            Ok(bytes) => String::from_utf8_lossy(&bytes).to_string(),
            Err(_) => encrypted.to_string(),
        }
    }
}
