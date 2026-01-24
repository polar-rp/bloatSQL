import { memo, useRef, useMemo } from 'react';
import {
  Card,
  Group,
  Text,
  Badge,
  ScrollArea,
  Table,
  Loader,
  Center,
  Alert,
  Overlay,
  Box,
} from '@mantine/core';
import { IconTable, IconAlertCircle } from '@tabler/icons-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { QueryResult } from '../../types/database';

interface ResultsCardProps {
  results: QueryResult | null;
  isExecuting: boolean;
  error: string | null;
  onClearError: () => void;
}

// Pre-format cell value to avoid JSON.stringify in render loop
function formatCellValue(value: unknown): string {
  if (value === null) return 'NULL';
  if (value === undefined) return '-';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

// Memoized table row component
const TableRow = memo(function TableRow({
  columns,
  rowIndex,
  formattedValues,
}: {
  columns: string[];
  rowIndex: number;
  formattedValues: string[];
}) {
  return (
    <Table.Tr>
      {columns.map((col, colIndex) => (
        <Table.Td key={`${rowIndex}-${col}`}>
          <Text
            size="sm"
            style={{
              fontFamily: 'monospace',
              maxWidth: '300px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={formattedValues[colIndex]}
          >
            {formattedValues[colIndex]}
          </Text>
        </Table.Td>
      ))}
    </Table.Tr>
  );
});

// Memoized header component
const TableHeader = memo(function TableHeader({ columns }: { columns: string[] }) {
  return (
    <Table.Thead
      style={{
        position: 'sticky',
        top: 0,
        background: 'var(--mantine-color-body)',
        zIndex: 1,
      }}
    >
      <Table.Tr>
        {columns.map((col) => (
          <Table.Th key={col}>{col}</Table.Th>
        ))}
      </Table.Tr>
    </Table.Thead>
  );
});

// Virtualized table body for large datasets
function VirtualizedTableBody({
  rows,
  columns,
}: {
  rows: Record<string, unknown>[];
  columns: string[];
}) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Pre-compute formatted values for all visible rows
  const formattedRows = useMemo(() => {
    return rows.map((row) =>
      columns.map((col) => formatCellValue(row[col]))
    );
  }, [rows, columns]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 41, // Estimated row height
    overscan: 20, // Render extra rows for smoother scrolling
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  return (
    <Box
      ref={parentRef}
      style={{
        height: '100%',
        overflow: 'auto',
        contain: 'strict',
      }}
    >
      <Table striped highlightOnHover style={{ tableLayout: 'fixed' }}>
        <TableHeader columns={columns} />
        <Table.Tbody>
          {/* Spacer for virtualization */}
          {virtualRows.length > 0 && (
            <tr style={{ height: virtualRows[0].start }} />
          )}
          {virtualRows.map((virtualRow) => {
            return (
              <TableRow
                key={virtualRow.index}
                columns={columns}
                rowIndex={virtualRow.index}
                formattedValues={formattedRows[virtualRow.index]}
              />
            );
          })}
          {/* Bottom spacer */}
          {virtualRows.length > 0 && (
            <tr
              style={{
                height: totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0),
              }}
            />
          )}
        </Table.Tbody>
      </Table>
    </Box>
  );
}

// Simple table for small datasets (< 100 rows)
function SimpleTable({
  rows,
  columns,
}: {
  rows: Record<string, unknown>[];
  columns: string[];
}) {
  // Pre-compute formatted values
  const formattedRows = useMemo(() => {
    return rows.map((row) =>
      columns.map((col) => formatCellValue(row[col]))
    );
  }, [rows, columns]);

  return (
    <ScrollArea style={{ flex: 1 }}>
      <Table striped highlightOnHover>
        <TableHeader columns={columns} />
        <Table.Tbody>
          {rows.map((_, idx) => (
            <TableRow
              key={idx}
              columns={columns}
              rowIndex={idx}
              formattedValues={formattedRows[idx]}
            />
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}

export function ResultsCard({
  results,
  isExecuting,
  error,
  onClearError,
}: ResultsCardProps) {
  const hasResults = results && results.rows.length > 0;
  const useVirtualization = hasResults && results.rows.length > 100;

  return (
    <Card
      withBorder
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          <IconTable size={16} />
          <Text size="sm" fw={500}>
            Results
          </Text>
          {results && (
            <Badge variant="light">{results.rowCount} rows</Badge>
          )}
          {isExecuting && (
            <Loader size="xs" />
          )}
        </Group>
        {results && <Badge>{results.executionTime}ms</Badge>}
      </Group>

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

      <Box style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {/* Loading overlay - keeps old results visible */}
        {isExecuting && hasResults && (
          <Overlay
            color="var(--mantine-color-body)"
            backgroundOpacity={0.6}
            blur={1}
            zIndex={10}
          />
        )}

        {!results ? (
          <Center h={200}>
            {isExecuting ? (
              <Loader />
            ) : (
              <Text c="dimmed">Execute a query to see results</Text>
            )}
          </Center>
        ) : results.rows.length === 0 ? (
          <Center h={200}>
            <Text c="dimmed">No data returned</Text>
          </Center>
        ) : useVirtualization ? (
          <VirtualizedTableBody
            rows={results.rows as Record<string, unknown>[]}
            columns={results.columns}
          />
        ) : (
          <SimpleTable
            rows={results.rows as Record<string, unknown>[]}
            columns={results.columns}
          />
        )}
      </Box>
    </Card>
  );
}
