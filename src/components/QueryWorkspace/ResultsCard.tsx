import { useMemo, useEffect, useState } from 'react';
import {
  Text,
  Loader,
  Center,
  Alert,
  Box,
  Table,
  Menu,
} from '@mantine/core';
import { IconAlertCircle, IconDownload, IconTrash } from '@tabler/icons-react';
import { QueryResult, TableColumn, DatabaseType } from '../../types/database';
import { useSelectCell, useSelectedCell } from '../../stores/editCellStore';
import { useLoadedTable, useQueryStore } from '../../stores/queryStore';
import { useConnectionStore } from '../../stores/connectionStore';
import { tauriCommands } from '../../tauri/commands';
import styles from './ResultsCard.module.css';

interface ResultsCardProps {
  results: QueryResult | null;
  isExecuting: boolean;
  error: string | null;
  onClearError: () => void;
  onOpenExportModal?: (rowData?: Record<string, unknown>) => void;
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
  onOpenExportModal,
}: ResultsCardProps) {
  const selectCell = useSelectCell();
  const selectedCell = useSelectedCell();
  const loadedTable = useLoadedTable();
  const [tableColumns, setTableColumns] = useState<TableColumn[]>([]);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    rowIndex: number;
  } | null>(null);

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

  const getRowKey = (row: Record<string, unknown>, rowIndex: number): string => {
    const primaryKeyColumn = tableColumns.find((col) => col.isPrimaryKey);
    if (primaryKeyColumn?.name && row[primaryKeyColumn.name] !== undefined) {
      return String(row[primaryKeyColumn.name]);
    }
    return `${rowIndex}-${JSON.stringify(row)}`;
  };

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

  const handleContextMenu = (e: React.MouseEvent, rowIndex: number) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      rowIndex,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleExportRow = () => {
    if (contextMenu === null || !onOpenExportModal) return;
    const row = rows[contextMenu.rowIndex];

    const rowData: Record<string, unknown> = {};
    columns.forEach((col) => {
      rowData[col] = row[col];
    });

    onOpenExportModal(rowData);
    handleCloseContextMenu();
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
                <Table.Tr
                  key={getRowKey(row, rowIndex)}
                  onContextMenu={(e) => handleContextMenu(e, rowIndex)}
                >
                  {columns.map((col) => {
                    const isFocused =
                      selectedCell?.rowIndex === rowIndex &&
                      selectedCell?.columnName === col;

                    return (
                      <Table.Td
                        key={col}
                        onClick={() => handleCellClick(rowIndex, col)}
                        className={`${styles.cellClickable} ${isFocused ? styles.cellFocused : ''}`}
                      >
                        {formatCellValue(row[col])}
                      </Table.Td>
                    );
                  })}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}

      <Menu
        opened={contextMenu !== null}
        onClose={handleCloseContextMenu}
        position="bottom-start"
        withinPortal
      >
        <Menu.Target>
          <div
            style={{
              position: 'fixed',
              left: contextMenu?.x ?? 0,
              top: contextMenu?.y ?? 0,
              width: 1,
              height: 1,
              pointerEvents: 'none',
            }}
          />
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item
            leftSection={<IconDownload size={16} />}
            onClick={handleExportRow}
          >
            Eksportuj wiersz
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Box>
  );
}
