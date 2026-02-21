import { useMemo, useCallback } from 'react';
import { ActionIcon, Tooltip } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { type ColumnDef, type Row } from '@tanstack/react-table';
import { DisplayColumn, AlterColumnOperation, ColumnDefinition } from '../../../types/tableStructure';
import { ColumnNameCell } from './ColumnNameCell';
import { DataTypeCell } from './DataTypeCell';
import { LengthCell } from './LengthCell';
import { NullableCell } from './NullableCell';
import { DefaultValueCell } from './DefaultValueCell';
import { PrimaryKeyCell } from './PrimaryKeyCell';
import { DataTable, type RowProps } from '../../common/DataTable';
import styles from '../TableStructureView.module.css';

// Zunifikowany typ wewnętrzny – łączy DisplayColumn, draft i added ColumnDefinition
// w jednorodną tablicę dla TanStack Table.
interface StructureTableRow {
  kind: 'existing' | 'draft' | 'added';
  name: string;
  baseType: string;
  displayLength: string | null;
  isNullable: boolean;
  columnDefault: string | null;
  isPrimaryKey: boolean;
  displayColumn?: DisplayColumn; // tylko kind='existing', potrzebne dla onColumnClick
}

function fromDisplayColumn(col: DisplayColumn): StructureTableRow {
  return {
    kind: 'existing',
    name: col.name,
    baseType: col.parsed.baseType,
    displayLength: col.displayLength,
    isNullable: col.isNullable,
    columnDefault: col.columnDefault ?? null,
    isPrimaryKey: col.isPrimaryKey,
    displayColumn: col,
  };
}

function fromColumnDefinition(
  def: ColumnDefinition,
  kind: 'draft' | 'added'
): StructureTableRow {
  return {
    kind,
    name: def.name,
    baseType: def.dataType,
    displayLength: def.length?.toString() ?? null,
    isNullable: def.isNullable,
    columnDefault: def.defaultValue ?? null,
    isPrimaryKey: def.isPrimaryKey,
  };
}

function getRowHighlight(
  name: string,
  pendingOperations: AlterColumnOperation[]
): string | undefined {
  const op = pendingOperations.find((o) => o.columnName === name);
  if (!op) return undefined;
  switch (op.type) {
    case 'DROP_COLUMN':
      return 'var(--mantine-color-red-9)';
    case 'MODIFY_COLUMN':
      return 'var(--mantine-color-blue-9)';
    case 'RENAME_COLUMN':
      return 'var(--mantine-color-orange-9)';
    default:
      return undefined;
  }
}

interface StructureTableProps {
  columns: DisplayColumn[];
  isEditing?: boolean;
  pendingOperations?: AlterColumnOperation[];
  editingColumnName?: string | null;
  draftColumnPreview?: ColumnDefinition | null;
  onColumnClick?: (column: DisplayColumn) => void;
  onDropColumn?: (columnName: string) => void;
}

export function StructureTable({
  columns,
  isEditing = false,
  pendingOperations = [],
  editingColumnName = null,
  draftColumnPreview = null,
  onColumnClick,
  onDropColumn,
}: StructureTableProps) {
  // Budujemy zunifikowaną tablicę danych
  const data = useMemo<StructureTableRow[]>(() => {
    const rows: StructureTableRow[] = columns.map(fromDisplayColumn);

    if (draftColumnPreview) {
      rows.push(fromColumnDefinition(draftColumnPreview, 'draft'));
    }

    const addedColumns = pendingOperations
      .filter((op) => op.type === 'ADD_COLUMN' && op.newDefinition)
      .map((op) => fromColumnDefinition(op.newDefinition!, 'added'));

    rows.push(...addedColumns);

    return rows;
  }, [columns, draftColumnPreview, pendingOperations]);

  const columnDefs = useMemo<ColumnDef<StructureTableRow, unknown>[]>(() => {
    const defs: ColumnDef<StructureTableRow, unknown>[] = [
      {
        id: 'name',
        accessorKey: 'name',
        header: 'Column name',
        enableSorting: false,
        cell: ({ row }) => (
          <ColumnNameCell name={row.original.name} isPrimaryKey={row.original.isPrimaryKey} />
        ),
      },
      {
        id: 'dataType',
        accessorKey: 'baseType',
        header: 'Data type',
        enableSorting: false,
        cell: ({ getValue }) => <DataTypeCell baseType={getValue() as string} />,
      },
      {
        id: 'length',
        accessorKey: 'displayLength',
        header: 'Length/Set',
        enableSorting: false,
        cell: ({ getValue }) => <LengthCell displayLength={getValue() as string | null} />,
      },
      {
        id: 'nullable',
        accessorKey: 'isNullable',
        header: 'Nullable',
        enableSorting: false,
        cell: ({ getValue }) => <NullableCell isNullable={getValue() as boolean} />,
      },
      {
        id: 'default',
        accessorKey: 'columnDefault',
        header: 'Default',
        enableSorting: false,
        cell: ({ getValue }) => <DefaultValueCell defaultValue={getValue() as string | null} />,
      },
      {
        id: 'primaryKey',
        accessorKey: 'isPrimaryKey',
        header: 'Primary key',
        enableSorting: false,
        cell: ({ getValue }) => <PrimaryKeyCell isPrimaryKey={getValue() as boolean} />,
      },
    ];

    if (isEditing) {
      defs.push({
        id: 'actions',
        header: '',
        size: 50,
        enableSorting: false,
        cell: ({ row }) => {
          const isDropped = pendingOperations.some(
            (op) => op.type === 'DROP_COLUMN' && op.columnName === row.original.name
          );
          if (isDropped || row.original.kind !== 'existing') return null;
          return (
            <Tooltip label="Delete column">
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDropColumn?.(row.original.name);
                }}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Tooltip>
          );
        },
      });
    }

    return defs;
  }, [isEditing, pendingOperations, onDropColumn]);

  const getRowProps = useCallback(
    (row: Row<StructureTableRow>): RowProps => {
      const r = row.original;

      if (r.kind === 'draft') {
        return { className: styles.rowDraftPreview };
      }

      if (r.kind === 'added') {
        return { style: { backgroundColor: 'var(--mantine-color-green-9)' } };
      }

      // kind === 'existing'
      const isDropped = pendingOperations.some(
        (op) => op.type === 'DROP_COLUMN' && op.columnName === r.name
      );
      const rowBg = getRowHighlight(r.name, pendingOperations);
      const isEditingThisRow = editingColumnName === r.name;

      return {
        style: {
          cursor: onColumnClick && isEditing && !isDropped ? 'pointer' : undefined,
          backgroundColor: rowBg,
          opacity: isDropped ? 0.5 : 1,
          textDecoration: isDropped ? 'line-through' : undefined,
        },
        className: isEditingThisRow ? styles.rowEditing : undefined,
        onClick:
          onColumnClick && !isDropped && r.displayColumn
            ? () => onColumnClick(r.displayColumn!)
            : undefined,
      };
    },
    [pendingOperations, editingColumnName, isEditing, onColumnClick]
  );

  return (
    <DataTable
      data={data}
      columns={columnDefs}
      striped
      highlightOnHover
      withColumnBorders
      getRowProps={getRowProps}
      style={{ maxHeight: 'calc(100vh - 200px)' }}
      className={styles.structureTable}
      estimatedRowHeight={36}
    />
  );
}
