import { Table, ActionIcon, Tooltip } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { DisplayColumn, AlterColumnOperation } from '../../../types/tableStructure';
import { ColumnNameCell } from './ColumnNameCell';
import { DataTypeCell } from './DataTypeCell';
import { LengthCell } from './LengthCell';
import { NullableCell } from './NullableCell';
import { DefaultValueCell } from './DefaultValueCell';
import { PrimaryKeyCell } from './PrimaryKeyCell';
import styles from '../TableStructureView.module.css';

interface StructureTableProps {
  columns: DisplayColumn[];
  isEditing?: boolean;
  pendingOperations?: AlterColumnOperation[];
  onColumnClick?: (column: DisplayColumn) => void;
  onDropColumn?: (columnName: string) => void;
}

function getRowHighlight(
  columnName: string,
  pendingOperations: AlterColumnOperation[]
): string | undefined {
  const op = pendingOperations.find((o) => o.columnName === columnName);
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

export function StructureTable({
  columns,
  isEditing = false,
  pendingOperations = [],
  onColumnClick,
  onDropColumn,
}: StructureTableProps) {
  // Check if a column has a pending ADD operation (for new columns in preview)
  const addedColumns = pendingOperations
    .filter((op) => op.type === 'ADD_COLUMN' && op.newDefinition)
    .map((op) => op.newDefinition!);

  return (
    <Table.ScrollContainer minWidth={600} className={styles.tableContainer}>
      <Table
        striped
        highlightOnHover
        withColumnBorders
        stickyHeader
        captionSide="top"
        className={styles.structureTable}
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Column name</Table.Th>
            <Table.Th>Data type</Table.Th>
            <Table.Th>Length/Set</Table.Th>
            <Table.Th>Nullable</Table.Th>
            <Table.Th>Default</Table.Th>
            <Table.Th>Primary key</Table.Th>
            {isEditing && <Table.Th w={50}>Actions</Table.Th>}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {columns.map((col) => {
            const rowBg = getRowHighlight(col.name, pendingOperations);
            const isDropped = pendingOperations.some(
              (op) => op.type === 'DROP_COLUMN' && op.columnName === col.name
            );

            return (
              <Table.Tr
                key={col.name}
                onClick={onColumnClick && !isDropped ? () => onColumnClick(col) : undefined}
                style={{
                  cursor: onColumnClick && isEditing && !isDropped ? 'pointer' : undefined,
                  backgroundColor: rowBg,
                  opacity: isDropped ? 0.5 : 1,
                  textDecoration: isDropped ? 'line-through' : undefined,
                }}
              >
                <Table.Td>
                  <ColumnNameCell name={col.name} isPrimaryKey={col.isPrimaryKey} />
                </Table.Td>
                <Table.Td>
                  <DataTypeCell baseType={col.parsed.baseType} />
                </Table.Td>
                <Table.Td>
                  <LengthCell displayLength={col.displayLength} />
                </Table.Td>
                <Table.Td>
                  <NullableCell isNullable={col.isNullable} />
                </Table.Td>
                <Table.Td>
                  <DefaultValueCell defaultValue={col.columnDefault} />
                </Table.Td>
                <Table.Td>
                  <PrimaryKeyCell isPrimaryKey={col.isPrimaryKey} />
                </Table.Td>
                {isEditing && (
                  <Table.Td>
                    {!isDropped && (
                      <Tooltip label="Delete column">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDropColumn?.(col.name);
                          }}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </Table.Td>
                )}
              </Table.Tr>
            );
          })}

          {/* Show pending ADD columns */}
          {addedColumns.map((def) => (
            <Table.Tr
              key={`new-${def.name}`}
              style={{
                backgroundColor: 'var(--mantine-color-green-9)',
              }}
            >
              <Table.Td>
                <ColumnNameCell name={def.name} isPrimaryKey={def.isPrimaryKey} />
              </Table.Td>
              <Table.Td>
                <DataTypeCell baseType={def.dataType} />
              </Table.Td>
              <Table.Td>
                <LengthCell displayLength={def.length?.toString() ?? null} />
              </Table.Td>
              <Table.Td>
                <NullableCell isNullable={def.isNullable} />
              </Table.Td>
              <Table.Td>
                <DefaultValueCell defaultValue={def.defaultValue} />
              </Table.Td>
              <Table.Td>
                <PrimaryKeyCell isPrimaryKey={def.isPrimaryKey} />
              </Table.Td>
              {isEditing && <Table.Td />}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
