import { useEffect, useState } from 'react';
import { Box, Text, Stack, Table, Badge, Loader, Center, Alert } from '@mantine/core';
import { IconAlertCircle, IconKey, IconCheck, IconX } from '@tabler/icons-react';
import { useSelectedTable } from '../../stores/tableViewStore';
import { tauriCommands } from '../../tauri/commands';
import { TableColumn } from '../../types/database';
import styles from './TableStructureView.module.css';

export function TableStructureView() {
  const selectedTable = useSelectedTable();
  const [columns, setColumns] = useState<TableColumn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedTable) {
      setColumns([]);
      setError(null);
      return;
    }

    const loadTableStructure = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const tableColumns = await tauriCommands.getTableColumns(selectedTable);
        setColumns(tableColumns);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load table structure');
        setColumns([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTableStructure();
  }, [selectedTable]);

  if (!selectedTable) {
    return (
      <Box>
        <Center h={200}>
          <Text c="dimmed" ta="center">
            Select a table to view its structure
          </Text>
        </Center>
      </Box>
    );
  }

  return (
    <Stack gap="md">
      <Text size="lg" fw={600}>
        Table Structure: {selectedTable}
      </Text>

        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Error"
            color="red"
            withCloseButton
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {isLoading ? (
          <Center h={200}>
            <Loader />
          </Center>
        ) : columns.length === 0 ? (
          <Center h={200}>
            <Text c="dimmed">No columns found</Text>
          </Center>
        ) : (
          <Table.ScrollContainer minWidth={400} className={styles.tableContainer}>
            <Table
              striped
              highlightOnHover
              withTableBorder
              withColumnBorders
              stickyHeader
              className={styles.structureTable}
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Column Name</Table.Th>
                  <Table.Th>Data Type</Table.Th>
                  <Table.Th>Nullable</Table.Th>
                  <Table.Th>Primary Key</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {columns.map((col) => (
                  <Table.Tr key={col.name}>
                    <Table.Td>
                      <Text fw={col.isPrimaryKey ? 600 : 400}>
                        {col.name}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" size="sm">
                        {col.dataType}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {col.isNullable ? (
                        <IconCheck size={16} color="green" />
                      ) : (
                        <IconX size={16} color="red" />
                      )}
                    </Table.Td>
                    <Table.Td>
                      {col.isPrimaryKey && (
                        <IconKey size={16} color="var(--mantine-color-blue-6)" />
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
    </Stack>
  );
}
