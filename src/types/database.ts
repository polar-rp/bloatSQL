export enum DatabaseType {
  MariaDB = "mariadb",
  PostgreSQL = "postgresql",
}

export interface Connection {
  id: string;
  name: string;
  dbType: DatabaseType;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  sslMode: 'disabled' | 'preferred' | 'required';
}

export interface ConnectionFormData {
  name: string;
  dbType: DatabaseType;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  sslMode: 'disabled' | 'preferred' | 'required';
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTime: number;
}

export interface QueryError {
  message: string;
  code?: string;
}

export interface ExecuteQueryRequest {
  connectionId: string;
  query: string;
}

export interface ExecuteQueryResponse {
  success: boolean;
  data?: QueryResult;
  error?: QueryError;
}

export enum DataExportMode {
  NoData = "no_data",
  Insert = "insert",
  Replace = "replace",
  InsertIgnore = "insert_ignore",
}

export interface ExportOptions {
  includeDrop: boolean;
  includeCreate: boolean;
  dataMode: DataExportMode;
  selectedTables: string[];
  outputPath: string;
  fileName: string;
  maxInsertSize: number;
}

export interface TableColumn {
  name: string;
  dataType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  columnDefault?: string | null;
  characterMaximumLength?: number | null;
  numericPrecision?: number | null;
}

export interface TableRelationship {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  constraintName: string;
}
