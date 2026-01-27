# BloatSQL v0.0.1

Initial release of BloatSQL - A modern, cross-platform database client.

## Features

- **Multi-Database Support**: Connect to MySQL/MariaDB and PostgreSQL databases
- **Connection Management**: Save, edit, and organize multiple database connections
- **Query Execution**: Write and execute SQL queries with timing information
- **Query History**: Track your last 20 executed queries
- **Database Navigation**: Browse databases, tables, and view table structures
- **Data Export**: Export entire databases or selected tables to SQL files
- **SSL/TLS Support**: Secure connections with multiple SSL modes
- **Modern UI**: Clean interface with dark/light theme support

## Tech Stack

- Frontend: React 19.2, TypeScript 5.9, Mantine 8.3
- Backend: Tauri 2.x, Rust, Tokio
- Database Drivers: tokio-postgres, mysql_async

## Installation

### Windows
Download `BloatSQL_0.0.1_x64-setup.exe` and run the installer.

## Known Issues

- Password storage uses base64 encoding (not cryptographically secure)
- Windows only (Linux and macOS builds coming soon)

## System Requirements

- Windows 10/11 (64-bit)
- 100 MB disk space
