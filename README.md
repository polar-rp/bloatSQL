# BloatSQL

A modern, cross-platform database client built with Tauri, React, and Rust. BloatSQL provides a fast and intuitive interface for managing MySQL/MariaDB and PostgreSQL databases.

![Version](https://img.shields.io/badge/version-0.0.1-blue)
![Tauri](https://img.shields.io/badge/Tauri-2.x-24C8D8?logo=tauri)
![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)
![Rust](https://img.shields.io/badge/Rust-Latest-orange?logo=rust)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

### Core Functionality
- **Multi-Database Support**: Connect to MySQL, MariaDB, and PostgreSQL databases
- **Connection Management**: Save, edit, and organize multiple database connections
- **Query Execution**: Write and execute SQL queries with timing information
- **Query History**: Track your last 20 executed queries
- **Database Navigation**: Browse databases, tables, and view table structures
- **Data Export**: Export entire databases or selected tables to SQL files
- **Cell Editing**: Edit individual cells directly in result views
- **SSL/TLS Support**: Secure connections with multiple SSL modes (disabled, preferred, required)

### User Experience
- **Modern UI**: Clean interface built with Mantine components
- **Theme Support**: Dark and light themes with customizable colors
- **Virtual Scrolling**: Handle large result sets efficiently
- **Split View**: Simultaneous query editing and result viewing
- **Connection Testing**: Verify connections before saving
- **Error Handling**: User-friendly error messages and boundaries

## Screenshots

### Darkmode
<img width="1920" height="1032" alt="image" src="https://github.com/user-attachments/assets/2932dc73-c4fc-4eb3-94f9-7770bd73e07c" />

### Lightmode
<img width="1920" height="1032" alt="image" src="https://github.com/user-attachments/assets/4ace2f8a-2a45-4d70-8a95-0823ed122460" />

### Settings
<img width="1920" height="1032" alt="image" src="https://github.com/user-attachments/assets/20781802-08cf-47c2-aa73-031c606801af" />

### Connect modal
<img width="1920" height="1032" alt="image" src="https://github.com/user-attachments/assets/8c9ae521-6884-490a-b4db-de15f06a94cc" />


## Tech Stack

### Frontend
- **[React](https://react.dev/)** 19.2 - UI framework
- **[TypeScript](https://www.typescriptlang.org/)** 5.9 - Type safety
- **[Mantine](https://mantine.dev/)** 8.3 - Component library
- **[Zustand](https://github.com/pmndrs/zustand)** 4.4 - State management
- **[Vite](https://vitejs.dev/)** 6.3 - Build tool
- **[TanStack Virtual](https://tanstack.com/virtual)** 3.13 - Virtualization
- **[Tabler Icons](https://tabler-icons.io/)** 3.0 - Icon library

### Backend
- **[Tauri](https://tauri.app/)** 2.x - Desktop framework
- **[Rust](https://www.rust-lang.org/)** - Backend runtime
- **[Tokio](https://tokio.rs/)** - Async runtime
- **[tokio-postgres](https://github.com/sfackler/rust-postgres)** 0.7 - PostgreSQL driver
- **[mysql_async](https://github.com/blackbeam/mysql_async)** 0.34 - MySQL/MariaDB driver
- **[rusqlite](https://github.com/rusqlite/rusqlite)** 0.31 - SQLite for local storage
- **[Serde](https://serde.rs/)** - Serialization/deserialization

## Getting Started

### Prerequisites

Before running BloatSQL, ensure you have the following installed:

- **[Node.js](https://nodejs.org/)** 18.x or higher
- **[npm](https://www.npmjs.com/)** 9.x or higher
- **[Rust](https://www.rust-lang.org/tools/install)** (latest stable)
- **[Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites)** for your platform

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/bloatsql.git
cd bloatsql
```

2. Install frontend dependencies:
```bash
npm install
```

3. Rust dependencies will be installed automatically during the first build.

### Development

#### Start the development server:
```bash
npm run dev
```

This will:
- Start the Vite dev server on `http://localhost:5174`
- Launch the Tauri development window with hot-reload enabled

#### Frontend only (useful for UI development):
```bash
npm run dev:vite
```

#### Type checking:
```bash
npm run type-check
```

### Building

Build the production application:

```bash
npm run build
```

This will create a distributable installer in `src-tauri/target/release/bundle/`.

On Windows, it generates an NSIS installer (`.exe`).

## Project Structure

```
bloatsql/
├── src/                          # Frontend (React/TypeScript)
│   ├── components/               # React components
│   │   ├── ConnectionManager/    # Connection CRUD operations
│   │   ├── Layout/               # App layout (Header, Navbar, Aside)
│   │   ├── QueryWorkspace/       # Query editor and results
│   │   ├── CellEditor/           # Inline cell editing
│   │   └── modals/               # Modal dialogs (export, settings)
│   ├── stores/                   # Zustand state stores
│   │   ├── connectionStore.ts    # Connection management
│   │   ├── queryStore.ts         # Query execution and results
│   │   ├── exportStore.ts        # Export operations
│   │   ├── tableViewStore.ts     # Table view state
│   │   ├── editCellStore.ts      # Cell editing state
│   │   ├── layoutStore.ts        # Layout preferences
│   │   └── settingsStore.ts      # User settings
│   ├── tauri/                    # Tauri integration
│   │   ├── commands.ts           # Backend command definitions
│   │   └── TauriProvider.tsx     # Tauri context
│   ├── types/                    # TypeScript types
│   ├── App.tsx                   # Root component
│   ├── Providers.tsx             # Global providers
│   └── main.tsx                  # Entry point
│
├── src-tauri/                    # Backend (Rust)
│   ├── src/
│   │   ├── main.rs               # Tauri app initialization
│   │   ├── commands.rs           # Command handlers (17 commands)
│   │   ├── storage/              # Local data persistence
│   │   │   └── connections_store.rs  # SQLite connection storage
│   │   └── db/                   # Database abstraction layer
│   │       ├── mod.rs            # Module exports
│   │       ├── connection.rs     # DatabaseConnection trait
│   │       ├── factory.rs        # Connection factory
│   │       ├── postgresql.rs     # PostgreSQL implementation
│   │       └── mariadb.rs        # MySQL/MariaDB implementation
│   ├── tauri.conf.json           # Tauri configuration
│   ├── Cargo.toml                # Rust dependencies
│   └── build.rs                  # Build script
│
├── public/                       # Static assets
├── vite.config.ts                # Vite configuration
├── package.json                  # Node dependencies
└── tsconfig.json                 # TypeScript configuration
```

## Usage

### Adding a Database Connection

1. Click the "+" button in the navbar
2. Fill in connection details:
   - **Name**: Friendly name for the connection
   - **Database Type**: MySQL/MariaDB or PostgreSQL
   - **Host**: Database server address
   - **Port**: Database port (auto-filled based on type)
   - **Username**: Database user
   - **Password**: Database password
   - **Database**: Initial database name (optional)
   - **SSL Mode**: disabled, preferred, or required
3. Click "Test Connection" to verify
4. Click "Save" to store the connection

### Executing Queries

1. Select a connection from the navbar
2. Choose a database from the dropdown
3. Write your SQL query in the editor
4. Click "Execute" or press the execute button
5. View results in the table below
6. Execution time is displayed in the header

### Exporting Databases

1. Click the "Export" button in the header
2. Configure export options:
   - **Include DROP statements**: Add DROP TABLE IF EXISTS
   - **Include CREATE statements**: Add CREATE TABLE
   - **Data mode**: no_data, insert, replace, or insert_ignore
   - **Batch size**: Number of rows per INSERT statement
   - **Tables**: Select which tables to export
3. Choose the output file location
4. Click "Export"

### Viewing Table Structure

1. Select a table from the navbar
2. Switch to "Structure" view mode
3. View columns with:
   - Column name
   - Data type
   - Nullable status
   - Primary key indicator
   - Default values

## Architecture

### Frontend-Backend Communication

BloatSQL uses Tauri's IPC (Inter-Process Communication) to bridge the React frontend and Rust backend:

```
React Component → Zustand Store → Tauri Command → Rust Handler → Database Driver
```

### State Management

The application uses Zustand for client-side state with separate stores for:
- **Connection Management**: Active and saved connections
- **Query Execution**: Query text, results, and execution state
- **Database Navigation**: Available databases and tables
- **Export Operations**: Export configuration and status
- **UI Settings**: Theme, layout, and preferences

### Database Abstraction

The backend implements a trait-based abstraction layer:

```rust
pub trait DatabaseConnection: Send + Sync {
    async fn test_connection(&self) -> DbResult<()>;
    async fn execute_query(&self, query: &str) -> DbResult<QueryResult>;
    async fn list_databases(&self) -> DbResult<Vec<String>>;
    async fn list_tables(&self, database: &str) -> DbResult<Vec<String>>;
    // ... more methods
}
```

This allows for:
- Easy addition of new database types
- Consistent error handling
- Async/await throughout
- Type-safe query results

## Configuration

### Tauri Configuration

Key settings in `src-tauri/tauri.conf.json`:

- **Window size**: 1400x900 (default)
- **Decorations**: Custom window controls (disabled by default)
- **Splashscreen**: 400x400 transparent window
- **Bundle targets**: NSIS installer for Windows

### Frontend Configuration

Vite configuration in `vite.config.ts`:

- **Dev server**: Port 5174
- **Build output**: `dist/`
- **Code splitting**: Separate chunks for large dependencies
- **Optimization**: Tree-shaking and minification

### Backend Configuration

Rust build optimization in `Cargo.toml`:

- **LTO**: Link-time optimization enabled
- **Opt-level**: Size optimization (`z`)
- **Strip**: Debug symbols removed
- **Codegen units**: 1 (maximum optimization)

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write TypeScript types for all new code
- Test database operations with both MySQL and PostgreSQL
- Update documentation for new features
- Keep commits atomic and well-described

### Code Structure

- **Frontend**: Use functional React components with hooks
- **State Management**: Create new Zustand stores for major features
- **Backend**: Implement new database operations in the trait
- **Types**: Define shared types in `src/types/`

## Security

### Password Storage

Passwords are currently stored using base64 encoding in a local SQLite database. **This is not cryptographically secure** and should be improved for production use. Consider implementing:

- Platform-specific secure storage (Windows Credential Manager, macOS Keychain, Linux Secret Service)
- Encryption at rest
- Master password protection

### Database Connections

- SSL/TLS support for encrypted connections
- Connection testing before saving
- Parameterized queries to prevent SQL injection
- Error messages sanitized to avoid leaking sensitive information

## Roadmap

- [ ] Support for additional databases (MongoDB, SQLite, SQL Server)
- [ ] Query autocomplete and syntax highlighting
- [ ] Visual query builder
- [ ] Schema visualization
- [ ] SSH tunnel support for remote connections
- [ ] Query performance analysis
- [ ] Saved queries and snippets
- [ ] Multi-tab query editing
- [ ] CSV/JSON export formats
- [ ] Improved password encryption
- [ ] Connection import/export
- [ ] Dark mode improvements

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Tauri](https://tauri.app/) - Amazing desktop framework
- UI powered by [Mantine](https://mantine.dev/) - Beautiful React components
- Icons by [Tabler Icons](https://tabler-icons.io/)
- Database drivers by the Rust community

---

**Note**: BloatSQL is under active development. Features and APIs may change.

For issues, feature requests, or contributions, please visit the [GitHub repository](https://github.com/yourusername/bloatsql).
