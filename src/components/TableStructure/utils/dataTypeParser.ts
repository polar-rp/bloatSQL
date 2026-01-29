import { TableColumn } from '../../../types/database';
import { ParsedDataType } from '../../../types/tableStructure';

export function parseDataType(column: TableColumn): ParsedDataType {
  const dataType = column.dataType;

  // Extract base type and length/set from format like "int(11)" or "varchar(255)"
  const match = dataType.match(/^(\w+)(?:\((.+)\))?/);
  if (match) {
    return {
      baseType: match[1].toUpperCase(),
      lengthOrSet: match[2] || null,
    };
  }

  return {
    baseType: dataType.toUpperCase(),
    lengthOrSet: null,
  };
}

export function getLengthDisplay(column: TableColumn): string | null {
  const parsed = parseDataType(column);

  // Prefer parsed length from data type
  if (parsed.lengthOrSet) {
    return parsed.lengthOrSet;
  }

  // Fall back to character_maximum_length or numeric_precision
  if (column.characterMaximumLength !== null && column.characterMaximumLength !== undefined) {
    return String(column.characterMaximumLength);
  }

  if (column.numericPrecision !== null && column.numericPrecision !== undefined) {
    return String(column.numericPrecision);
  }

  return null;
}
