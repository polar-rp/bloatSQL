import { useMemo } from 'react';
import {
  Card,
  Group,
  Text,
  Badge,
  Loader,
  Center,
  Alert,
  Overlay,
  Box,
} from '@mantine/core';
import { DataTable, DataTableColumn } from 'mantine-datatable';
import { IconTable, IconAlertCircle } from '@tabler/icons-react';
import { QueryResult } from '../../types/database';

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

type RowData = Record<string, unknown>;

export function ResultsCard({
  results,
  isExecuting,
  error,
  onClearError,
}: ResultsCardProps) {
  const hasResults = results && results.rows.length > 0;

  const columns = useMemo<DataTableColumn<RowData>[]>(() => {
    if (!results) return [];
    return results.columns.map((col) => ({
      accessor: col,
      title: col,
      ellipsis: true,
      width: 200,
      render: (record) => formatCellValue(record[col]),
    }));
  }, [results]);

  const records = useMemo(() => {
    if (!results) return [];
    return results.rows.map((row, index) => ({
      ...row,
      _id: index,
    })) as RowData[];
  }, [results]);

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
        ) : (
          <DataTable
            withTableBorder
            striped
            highlightOnHover
            height="100%"
            idAccessor="_id"
            columns={columns}
            records={records}
            fetching={isExecuting}
            ff={'monospace'}
            fz="sm"
          />
        )}
      </Box>
    </Card>
  );
}
