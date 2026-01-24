import { invoke } from '@tauri-apps/api/core';
import { Connection, QueryResult, ExportOptions, TableColumn } from '../types/database';

// Backend connection type (snake_case)
interface BackendConnection {
  id: string;
  name: string;
  db_type: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl_mode: string;
}

// Backend export options type (snake_case)
interface BackendExportOptions {
  include_drop: boolean;
  include_create: boolean;
  data_mode: string;
  selected_tables: string[];
  output_path: string;
  file_name: string;
  max_insert_size: number;
}

// Backend table column type (snake_case)
interface BackendTableColumn {
  name: string;
  data_type: string;
  is_nullable: boolean;
  is_primary_key: boolean;
}

// Convert backend column to frontend format
function toFrontendTableColumn(col: BackendTableColumn): TableColumn {
  return {
    name: col.name,
    dataType: col.data_type,
    isNullable: col.is_nullable,
    isPrimaryKey: col.is_primary_key,
  };
}

// Convert frontend Connection to backend format
function toBackendConnection(conn: Connection | Omit<Connection, 'id'> & { id?: string }): BackendConnection {
  return {
    id: conn.id || crypto.randomUUID(),
    name: conn.name,
    db_type: conn.dbType,
    host: conn.host,
    port: conn.port,
    username: conn.username,
    password: conn.password,
    database: conn.database,
    ssl_mode: conn.sslMode,
  };
}

// Convert backend connection to frontend format
function toFrontendConnection(conn: BackendConnection): Connection {
  return {
    id: conn.id,
    name: conn.name,
    dbType: conn.db_type as Connection['dbType'],
    host: conn.host,
    port: conn.port,
    username: conn.username,
    password: conn.password,
    database: conn.database,
    sslMode: conn.ssl_mode as Connection['sslMode'],
  };
}

// Convert frontend ExportOptions to backend format
function toBackendExportOptions(options: ExportOptions): BackendExportOptions {
  return {
    include_drop: options.includeDrop,
    include_create: options.includeCreate,
    data_mode: options.dataMode,
    selected_tables: options.selectedTables,
    output_path: options.outputPath,
    file_name: options.fileName,
    max_insert_size: options.maxInsertSize,
  };
}

export const tauriCommands = {
  // Connection management
  async saveConnection(conn: Omit<Connection, 'id'> & { id?: string }): Promise<Connection> {
    const backendConn = toBackendConnection(conn);
    await invoke('save_connection', { conn: backendConn });
    return toFrontendConnection(backendConn);
  },

  async getConnections(): Promise<Connection[]> {
    const rawConnections = await invoke<BackendConnection[]>('get_connections');
    return rawConnections.map(toFrontendConnection);
  },

  async deleteConnection(id: string): Promise<void> {
    await invoke('delete_connection', { id });
  },

  // Connection lifecycle
  async testConnection(conn: Connection): Promise<void> {
    await invoke('test_connection', { conn: toBackendConnection(conn) });
  },

  async connectToDatabase(conn: Connection): Promise<void> {
    await invoke('connect_to_database', { conn: toBackendConnection(conn) });
  },

  async disconnectFromDatabase(): Promise<void> {
    await invoke('disconnect_from_database');
  },

  // Query operations
  async executeQuery(query: string): Promise<QueryResult> {
    return invoke<QueryResult>('execute_query', { query });
  },

  async listTables(): Promise<string[]> {
    return invoke<string[]>('list_tables');
  },

  async getTableColumns(tableName: string): Promise<TableColumn[]> {
    const rawColumns = await invoke<BackendTableColumn[]>('get_table_columns', { tableName });
    return rawColumns.map(toFrontendTableColumn);
  },

  // Export
  async exportDatabase(options: ExportOptions): Promise<void> {
    await invoke('export_database', { options: toBackendExportOptions(options) });
  },
};

export type TauriCommands = typeof tauriCommands;
