use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use rand::RngCore;
use rusqlite::{params, Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;
use tracing::warn;
use uuid::Uuid;

/// Length of the encryption key in bytes (256 bits for AES-256).
const KEY_LENGTH: usize = 32;

/// Length of the nonce in bytes (96 bits for AES-GCM).
const NONCE_LENGTH: usize = 12;

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

/// Manages persistent storage of database connections using SQLite.
///
/// Passwords are encrypted using AES-256-GCM before storage.
pub struct ConnectionsStore {
    db: Mutex<Connection>,
    encryption_key: [u8; KEY_LENGTH],
}

impl ConnectionsStore {
    pub fn new(db_path: PathBuf) -> SqlResult<Self> {
        let db = Connection::open(&db_path)?;

        // Load or generate encryption key
        let key_path = db_path.with_extension("key");
        let encryption_key = Self::load_or_generate_key(&key_path);

        let store = ConnectionsStore {
            db: Mutex::new(db),
            encryption_key,
        };
        store.init_tables()?;
        Ok(store)
    }

    /// Loads an existing encryption key or generates a new one.
    fn load_or_generate_key(key_path: &PathBuf) -> [u8; KEY_LENGTH] {
        if key_path.exists() {
            if let Ok(key_data) = std::fs::read(key_path) {
                if key_data.len() == KEY_LENGTH {
                    let mut key = [0u8; KEY_LENGTH];
                    key.copy_from_slice(&key_data);
                    return key;
                }
            }
            warn!("Invalid key file, generating new key");
        }

        // Generate new key
        let mut key = [0u8; KEY_LENGTH];
        OsRng.fill_bytes(&mut key);

        // Save key to file (with restrictive permissions on Unix)
        if let Err(e) = std::fs::write(key_path, &key) {
            warn!("Failed to save encryption key: {}", e);
        }

        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            if let Ok(metadata) = std::fs::metadata(key_path) {
                let mut perms = metadata.permissions();
                perms.set_mode(0o600);
                let _ = std::fs::set_permissions(key_path, perms);
            }
        }

        key
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
        // Graceful migration for older databases
        let _ = db.execute(
            "ALTER TABLE connections ADD COLUMN ssl_mode TEXT NOT NULL DEFAULT 'preferred'",
            [],
        );
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

    #[allow(dead_code)]
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

    /// Encrypts a password using AES-256-GCM.
    ///
    /// Returns a base64-encoded string containing: nonce || ciphertext
    fn encrypt_password(&self, password: &str) -> String {
        use base64::{engine::general_purpose, Engine as _};

        let cipher = Aes256Gcm::new_from_slice(&self.encryption_key)
            .expect("Invalid key length");

        // Generate random nonce
        let mut nonce_bytes = [0u8; NONCE_LENGTH];
        OsRng.fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);

        // Encrypt
        let ciphertext = cipher
            .encrypt(nonce, password.as_bytes())
            .expect("Encryption failed");

        // Combine nonce and ciphertext
        let mut combined = Vec::with_capacity(NONCE_LENGTH + ciphertext.len());
        combined.extend_from_slice(&nonce_bytes);
        combined.extend_from_slice(&ciphertext);

        general_purpose::STANDARD.encode(&combined)
    }

    /// Decrypts a password encrypted with AES-256-GCM.
    ///
    /// Falls back to base64 decoding for backwards compatibility with old data.
    fn decrypt_password(&self, encrypted: &str) -> String {
        use base64::{engine::general_purpose, Engine as _};

        let combined = match general_purpose::STANDARD.decode(encrypted) {
            Ok(data) => data,
            Err(_) => return encrypted.to_string(),
        };

        // Check if this looks like old base64-only encoded password
        // (too short to be nonce + ciphertext)
        if combined.len() < NONCE_LENGTH + 16 {
            // 16 is minimum ciphertext size with auth tag
            // Try to interpret as plain base64 (backwards compatibility)
            return String::from_utf8_lossy(&combined).to_string();
        }

        let cipher = match Aes256Gcm::new_from_slice(&self.encryption_key) {
            Ok(c) => c,
            Err(_) => return encrypted.to_string(),
        };

        let nonce = Nonce::from_slice(&combined[..NONCE_LENGTH]);
        let ciphertext = &combined[NONCE_LENGTH..];

        match cipher.decrypt(nonce, ciphertext) {
            Ok(plaintext) => String::from_utf8_lossy(&plaintext).to_string(),
            Err(_) => {
                // Decryption failed, might be old format - try base64 decode
                String::from_utf8_lossy(&combined).to_string()
            }
        }
    }
}
