import { useMemo, useCallback, useState } from 'react';
import {
  Text,
  Loader,
  Center,
  Alert,
  Box,
  Menu,
} from '@mantine/core';
import { IconAlertCircle, IconDownload } from '@tabler/icons-react';
import { type ColumnDef, type Row } from '@tanstack/react-table';
import { QueryResult } from '../../types/database';
import { useSelectCell, useSelectedCell } from '../../stores/editCellStore';
import { useLoadedTable, useTableColumns } from '../../stores/queryStore';
import { DataTable } from '../common/DataTable';
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

// Sub-komponent czytający selectedCell bezpośrednio ze store –
// unika uwzględniania selectedCell w deps kolumn i nie powoduje
// ich przebudowy przy każdym kliknięciu komórki.
interface ResultCellProps {
  rowIndex: number;
  columnName: string;
  value: unknown;
  rowData: Record<string, unknown>;
  onCellClick: (rowIndex: number, columnName: string, rowData: Record<string, unknown>) => void;
}

function ResultCell({ rowIndex, columnName, value, rowData, onCellClick }: ResultCellProps) {
  const selectedCell = useSelectedCell();
  const isFocused =
    selectedCell?.rowIndex === rowIndex && selectedCell?.columnName === columnName;

  return (
    <span
      className={`${styles.cellClickable} ${isFocused ? styles.cellFocused : ''}`}
      onClick={() => onCellClick(rowIndex, columnName, rowData)}
    >
      {formatCellValue(value)}
    </span>
  );
}

export function ResultsCard({
  results,
  isExecuting,
  error,
  onClearError,
  onOpenExportModal,
}: ResultsCardProps) {
  const selectCell = useSelectCell();
  const loadedTable = useLoadedTable();
  const tableColumns = useTableColumns();
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    rowData: Record<string, unknown>;
  } | null>(null);

  const rows = useMemo(() => results?.rows ?? [], [results]);

  const handleCellClick = useCallback(
    (rowIndex: number, columnName: string, rowData: Record<string, unknown>) => {
      const primaryKeyColumn = tableColumns.find((col) => col.isPrimaryKey);
      selectCell({
        rowIndex,
        columnName,
        focusedColumn: columnName,
        rowData,
        tableName: loadedTable,
        primaryKeyColumn: primaryKeyColumn?.name,
        primaryKeyValue: primaryKeyColumn ? rowData[primaryKeyColumn.name] : undefined,
      });
    },
    [tableColumns, selectCell, loadedTable]
  );

  const columns = useMemo<ColumnDef<Record<string, unknown>, unknown>[]>(() => {
    return (results?.columns ?? []).map((col) => ({
      id: col,
      accessorFn: (row) => row[col],
      header: col,
      cell: ({ row, getValue }) => (
        <ResultCell
          rowIndex={row.index}
          columnName={col}
          value={getValue()}
          rowData={row.original}
          onCellClick={handleCellClick}
        />
      ),
    }));
  }, [results?.columns, handleCellClick]);

  const getRowProps = useCallback(
    (row: Row<Record<string, unknown>>) => ({
      onContextMenu: (e: React.MouseEvent<HTMLTableRowElement>) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, rowData: row.original });
      },
    }),
    []
  );

  const handleCloseContextMenu = useCallback(() => setContextMenu(null), []);

  const handleExportRow = useCallback(() => {
    if (contextMenu === null || !onOpenExportModal) return;
    onOpenExportModal(contextMenu.rowData);
    handleCloseContextMenu();
  }, [contextMenu, onOpenExportModal, handleCloseContextMenu]);

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
        <DataTable
          data={rows}
          columns={columns}
          striped
          highlightOnHover
          withColumnBorders
          enableSorting
          getRowProps={getRowProps}
          className={`${styles.resultsTable} ${isExecuting ? styles.resultsTableExecuting : ''}`}
          estimatedRowHeight={36}
        />
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
