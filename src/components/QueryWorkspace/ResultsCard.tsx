import { useMemo } from 'react';
import {
  Text,
  Loader,
  Center,
  Alert,
  Box,
  Table,
  ScrollArea,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
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

export function ResultsCard({
  results,
  isExecuting,
  error,
  onClearError,
}: ResultsCardProps) {
  const columns = useMemo(() => {
    return results?.columns || [];
  }, [results]);

  const rows = useMemo(() => {
    return results?.rows || [];
  }, [results]);

  return (
    <Box>
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
        <ScrollArea>
          <Table
            striped
            highlightOnHover
            withTableBorder
            withColumnBorders
            style={{
              fontFamily: 'monospace',
              fontSize: 'var(--mantine-font-size-sm)',
              opacity: isExecuting ? 0.6 : 1,
              pointerEvents: isExecuting ? 'none' : 'auto',
            }}
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
                    <Table.Td key={col}>
                      {formatCellValue(row[col])}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      )}
    </Box>
  );
}
