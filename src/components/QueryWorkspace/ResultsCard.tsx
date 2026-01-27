import { useMemo, useEffect, useState } from 'react';
import {
  Text,
  Loader,
  Center,
  Alert,
  Box,
  Table,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { QueryResult, TableColumn } from '../../types/database';
import { useSelectCell } from '../../stores/editCellStore';
import { useLoadedTable } from '../../stores/queryStore';
import { tauriCommands } from '../../tauri/commands';
import styles from './ResultsCard.module.css';

interface ResultsCardProps {
  results: QueryResult | null;
  isExecuting: boolean;
  error: string | null;
  onClearError: () => void;
}

function formatCellValue(value: unknown): string {
  if (value === null) return 'NULL';
  if (value === undefined) return '-';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

export function ResultsCard({
  results,
  isExecuting,
  error,
  onClearError,
}: ResultsCardProps) {
  const selectCell = useSelectCell();
  const loadedTable = useLoadedTable();
  const [tableColumns, setTableColumns] = useState<TableColumn[]>([]);

  const columns = useMemo(() => {
    return results?.columns || [];
  }, [results]);

  const rows = useMemo(() => {
    return results?.rows || [];
  }, [results]);

  useEffect(() => {
    const loadTableColumns = async () => {
      if (loadedTable) {
        try {
          const cols = await tauriCommands.getTableColumns(loadedTable);
          setTableColumns(cols);
        } catch (err) {
          console.error('Failed to load table columns:', err);
        }
      }
    };

    loadTableColumns();
  }, [loadedTable]);

  const handleCellClick = (rowIndex: number, columnName: string) => {
    const primaryKeyColumn = tableColumns.find((col) => col.isPrimaryKey);
    const row = rows[rowIndex];

    selectCell({
      rowIndex,
      columnName,
      focusedColumn: columnName,
      rowData: row,
      tableName: loadedTable,
      primaryKeyColumn: primaryKeyColumn?.name,
      primaryKeyValue: primaryKeyColumn ? row[primaryKeyColumn.name] : undefined,
    });
  };

  return (
    <Box h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Query Error"
          color="red"
          mb="md"
          withCloseButton
          onClose={onClearError}
        >
          {error}
        </Alert>
      )}

      {!results ? (
        <Center h={200}>
          {isExecuting ? (
            <Loader />
          ) : (
            <Text c="dimmed">Execute a query to see results</Text>
          )}
        </Center>
      ) : rows.length === 0 ? (
        <Center h={200}>
          <Text c="dimmed">No data returned</Text>
        </Center>
      ) : (
        <Table.ScrollContainer minWidth={500} className={styles.tableContainer}>
          <Table
            striped
            highlightOnHover
            withTableBorder
            withColumnBorders
            stickyHeader
            className={`${styles.resultsTable} ${isExecuting ? styles.resultsTableExecuting : ''}`}
          >
            <Table.Thead>
              <Table.Tr>
                {columns.map((col) => (
                  <Table.Th key={col}>{col}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((row, rowIndex) => (
                <Table.Tr key={rowIndex}>
                  {columns.map((col) => (
                    <Table.Td
                      key={col}
                      onClick={() => handleCellClick(rowIndex, col)}
                      className={styles.cellClickable}
                    >
                      {formatCellValue(row[col])}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Box>
  );
}
