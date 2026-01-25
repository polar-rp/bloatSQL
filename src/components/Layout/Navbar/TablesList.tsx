import { useState, useCallback, useEffect, useTransition, memo } from 'react';
import {
  Stack,
  Text,
  Center,
  Loader,
  NavLink,
  Group,
  rem,
  Tooltip,
} from '@mantine/core';
import {
  IconTable,
  IconKey,
  IconColumns,
} from '@tabler/icons-react';
import { TableColumn } from '../../../types/database';
import { tauriCommands } from '../../../tauri/commands';

interface TablesListProps {
  tables: string[] | null;
  isLoadingTables: boolean;
  isConnected: boolean;
  selectedTable: string | null;
  onSelectTable: (tableName: string) => void;
  searchQuery: string;
}

const ColumnItem = memo(function ColumnItem({ column }: { column: TableColumn }) {
  const icon = column.isPrimaryKey
    ? <IconKey size={12} color="var(--mantine-primary-color-filled)" />
    : <IconColumns size={12} />;

  const dataTypeLabel = (
    <Tooltip label={column.dataType.toLowerCase()} withArrow position="right">
      <Text
        size="xs"
        c="dimmed"
        truncate="end"
        style={{ maxWidth: rem(80), flexShrink: 0 }}
      >
        {column.dataType.toLowerCase()}
      </Text>
    </Tooltip>
  );

  return (
    <NavLink
      label={
        <Group gap={2} wrap="nowrap">
          <Text
            size="sm"
            fw={column.isPrimaryKey ? 600 : 400}
            truncate="end"
          >
            {column.name}
          </Text>
          {!column.isNullable && (
            <Text component="span" size="sm" c="red" style={{ flexShrink: 0 }}>
              *
            </Text>
          )}
        </Group>
      }
      styles={{
        root: {
          borderRadius: 'var(--mantine-radius-default)',
        },
      }}
      leftSection={icon}
      rightSection={dataTypeLabel}
      variant="subtle"
    />
  );
});

const TableItem = memo(function TableItem({
  table,
  isSelected,
  columns,
  isLoadingColumns,
  onSelect,
  onOpen,
}: {
  table: string;
  isSelected: boolean;
  columns: TableColumn[] | undefined;
  isLoadingColumns: boolean;
  onSelect: (table: string) => void;
  onOpen: (table: string) => void;
}) {
  const handleChange = useCallback((opened: boolean) => {
    if (opened) {
      onOpen(table);
      onSelect(table);
    }
  }, [table, onOpen, onSelect]);

  return (
    <NavLink
      label={table}
      leftSection={<IconTable size={16} />}
      active={isSelected}
      defaultOpened={isSelected}
      onChange={handleChange}
      childrenOffset={28}
      styles={{
        root: {
          borderRadius: 'var(--mantine-radius-default)',
        },
      }}

    >
      {isLoadingColumns ? (
        <Center py="xs">
          <Loader size="xs" />
        </Center>
      ) : columns && columns.length > 0 ? (
        columns.map((column) => (
          <ColumnItem key={column.name} column={column} />
        ))
      ) : (
        <Text size="xs" c="dimmed" pl="md" py="xs">
          No columns
        </Text>
      )}
    </NavLink>
  );
});

export function TablesList({
  tables,
  isLoadingTables,
  isConnected,
  selectedTable,
  onSelectTable,
  searchQuery,
}: TablesListProps) {
  const [tableColumns, setTableColumns] = useState<Record<string, TableColumn[]>>({});
  const [loadingColumns, setLoadingColumns] = useState<Set<string>>(new Set());

  const [, startColumnTransition] = useTransition();

  const filteredTables =
    tables?.filter((table) =>
      table.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const loadColumnsForTable = useCallback((tableName: string) => {
    if (tableColumns[tableName] || loadingColumns.has(tableName)) {
      return;
    }

    setLoadingColumns((prev) => new Set(prev).add(tableName));

    startColumnTransition(() => {
      tauriCommands.getTableColumns(tableName)
        .then((columns) => {
          setTableColumns((prev) => ({ ...prev, [tableName]: columns }));
        })
        .catch((error) => {
          console.error('Failed to load columns:', error);
        })
        .finally(() => {
          setLoadingColumns((prev) => {
            const newSet = new Set(prev);
            newSet.delete(tableName);
            return newSet;
          });
        });
    });
  }, [tableColumns, loadingColumns, startColumnTransition]);

  useEffect(() => {
    setTableColumns({});
  }, [tables]);

  if (isLoadingTables) {
    return (
      <Stack gap="xs" flex={1}>
        <Center h={100}>
          <Loader size="sm" />
        </Center>
      </Stack>
    );
  }

  if (!tables || tables.length === 0) {
    return (
      <Stack gap="xs">
        <Center h={100}>
          <Text size="sm" c="dimmed" ta="center">
            {isConnected ? 'No tables found' : 'Connect to see tables'}
          </Text>
        </Center>
      </Stack>
    );
  }

  return (
    <Stack gap={0}>
      <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb="xs" px="xs">
        Tables ({filteredTables.length})
      </Text>
      {filteredTables.map((table) => (
        <TableItem
          key={table}
          table={table}
          isSelected={selectedTable === table}
          columns={tableColumns[table]}
          isLoadingColumns={loadingColumns.has(table)}
          onSelect={onSelectTable}
          onOpen={loadColumnsForTable}
        />
      ))}
    </Stack>
  );
}
