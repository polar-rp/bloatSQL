import { invoke } from '@tauri-apps/api/core';
import {
  Connection,
  QueryResult,
  ExportOptions,
  TableColumn,
  TableRelationship,
  UpdateCellRequest,
  UpdateCellResult,
  formatUpdateCellError,
} from '../types/database';

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

interface BackendExportOptions {
  include_drop: boolean;
  include_create: boolean;
  data_mode: string;
  selected_tables: string[];
  output_path: string;
  file_name: string;
  max_insert_size: number;
}

interface BackendTableColumn {
  name: string;
  data_type: string;
  is_nullable: boolean;
  is_primary_key: boolean;
  column_default?: string | null;
  character_maximum_length?: number | null;
  numeric_precision?: number | null;
}

interface BackendTableRelationship {
  from_table: string;
  from_column: string;
  to_table: string;
  to_column: string;
  constraint_name: string;
}

function toFrontendTableColumn(col: BackendTableColumn): TableColumn {
  return {
    name: col.name,
    dataType: col.data_type,
    isNullable: col.is_nullable,
    isPrimaryKey: col.is_primary_key,
    columnDefault: col.column_default,
    characterMaximumLength: col.character_maximum_length,
    numericPrecision: col.numeric_precision,
  };
}

function toFrontendTableRelationship(rel: BackendTableRelationship): TableRelationship {
  return {
    fromTable: rel.from_table,
    fromColumn: rel.from_column,
    toTable: rel.to_table,
    toColumn: rel.to_column,
    constraintName: rel.constraint_name,
  };
}

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

  async testConnection(conn: Connection): Promise<void> {
    await invoke('test_connection', { conn: toBackendConnection(conn) });
  },

  async connectToDatabase(conn: Connection): Promise<void> {
    await invoke('connect_to_database', { conn: toBackendConnection(conn) });
  },

  async disconnectFromDatabase(): Promise<void> {
    await invoke('disconnect_from_database');
  },

  async executeQuery(query: string): Promise<QueryResult> {
    return invoke<QueryResult>('execute_query', { query });
  },

  async listTables(): Promise<string[]> {
    return invoke<string[]>('list_tables');
  },

  async listDatabases(): Promise<string[]> {
    return invoke<string[]>('list_databases');
  },

  async changeDatabase(databaseName: string): Promise<void> {
    await invoke('change_database', { databaseName });
  },

  async getCurrentDatabase(): Promise<string> {
    return invoke<string>('get_current_database');
  },

  async getTableColumns(tableName: string): Promise<TableColumn[]> {
    const rawColumns = await invoke<BackendTableColumn[]>('get_table_columns', { tableName });
    return rawColumns.map(toFrontendTableColumn);
  },

  async getTableRelationships(): Promise<TableRelationship[]> {
    const rawRelationships = await invoke<BackendTableRelationship[]>('get_table_relationships');
    return rawRelationships.map(toFrontendTableRelationship);
  },

  async exportDatabase(options: ExportOptions): Promise<void> {
    await invoke('export_database', { options: toBackendExportOptions(options) });
  },

  async closeSplashscreen(): Promise<void> {
    await invoke('close_splashscreen');
  },

  async pingConnection(): Promise<number> {
    return invoke<number>('ping_connection');
  },

  async updateCell(params: UpdateCellRequest): Promise<UpdateCellResult> {
    const request = {
      table_name: params.tableName,
      column_name: params.columnName,
      new_value: params.newValue,
      primary_key_column: params.primaryKeyColumn,
      primary_key_value: params.primaryKeyValue,
    };

    interface BackendUpdateCellResult {
      success: boolean;
      error?: {
        message: string;
        code?: string;
        detail?: string;
        hint?: string;
        table: string;
        column: string;
      };
      executed_query?: string;
    }

    const result = await invoke<BackendUpdateCellResult>('update_cell', { request });

    if (!result.success && result.error) {
      throw new Error(formatUpdateCellError(result.error));
    }

    return {
      success: result.success,
      error: result.error,
      executedQuery: result.executed_query,
    };
  },
};

export type TauriCommands = typeof tauriCommands;
