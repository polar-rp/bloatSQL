import { TableColumn } from './database';

export interface ParsedDataType {
  baseType: string;
  lengthOrSet: string | null;
}

export interface DisplayColumn extends TableColumn {
  parsed: ParsedDataType;
  displayLength: string | null;
}

export type AlterOperationType =
  | 'ADD_COLUMN'
  | 'DROP_COLUMN'
  | 'MODIFY_COLUMN'
  | 'RENAME_COLUMN';

export interface ColumnDefinition {
  name: string;
  dataType: string;
  length?: number;
  isNullable: boolean;
  isPrimaryKey: boolean;
  defaultValue?: string | null;
}

export interface AlterColumnOperation {
  type: AlterOperationType;
  columnName: string;
  newColumnName?: string;
  newDefinition?: ColumnDefinition;
}
