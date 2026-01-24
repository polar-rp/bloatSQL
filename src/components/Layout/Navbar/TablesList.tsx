import { useState, useCallback, useEffect, useTransition, memo } from 'react';
import {
  Stack,
  TextInput,
  Text,
  Center,
  Loader,
  NavLink,
  Badge,
  Group,
  rem,
} from '@mantine/core';
import {
  IconSearch,
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
}

// Memoized column item to prevent re-renders
const ColumnItem = memo(function ColumnItem({ column }: { column: TableColumn }) {
  const icon = column.isPrimaryKey
    ? <IconKey size={12} color="var(--mantine-color-yellow-6)" />
    : <IconColumns size={12} />;

  const typeBadge = (() => {
    const type = column.dataType.toLowerCase();
    let color = 'gray';

    if (type.includes('int') || type.includes('decimal') || type.includes('float') || type.includes('double')) {
      color = 'blue';
    } else if (type.includes('varchar') || type.includes('text') || type.includes('char')) {
      color = 'green';
    } else if (type.includes('date') || type.includes('time')) {
      color = 'orange';
    } else if (type.includes('bool')) {
      color = 'violet';
    }

    return (
      <Badge size="xs" variant="light" color={color}>
        {column.dataType}
      </Badge>
    );
  })();

  return (
    <NavLink
      label={
        <Group gap={4} wrap="nowrap">
          <Text size="xs" fw={column.isPrimaryKey ? 600 : 400}>
            {column.name}
          </Text>
          {!column.isNullable && (
            <Text component="span" size="xs" c="red">
              *
            </Text>
          )}
        </Group>
      }
      leftSection={icon}
      rightSection={typeBadge}
      styles={{
        label: { fontSize: rem(12) },
        root: { cursor: 'default' },
      }}
      variant="subtle"
    />
  );
});

// Memoized table item
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
        label: { fontSize: rem(13) },
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
}: TablesListProps) {
  const [tableSearch, setTableSearch] = useState('');
  const [tableColumns, setTableColumns] = useState<Record<string, TableColumn[]>>({});
  const [loadingColumns, setLoadingColumns] = useState<Set<string>>(new Set());

  // Use transition for column loading (non-blocking)
  const [, startColumnTransition] = useTransition();

  const filteredTables =
    tables?.filter((table) =>
      table.toLowerCase().includes(tableSearch.toLowerCase())
    ) || [];

  const loadColumnsForTable = useCallback((tableName: string) => {
    // Skip if already loaded or loading
    if (tableColumns[tableName] || loadingColumns.has(tableName)) {
      return;
    }

    setLoadingColumns((prev) => new Set(prev).add(tableName));

    // Use transition to keep UI responsive
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

  // Clear columns cache when tables change (e.g., reconnecting)
  useEffect(() => {
    setTableColumns({});
  }, [tables]);

  if (isLoadingTables) {
    return (
      <Stack gap="xs" style={{ flex: 1, minHeight: 0 }}>
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
    <Stack gap="xs" >
      <TextInput
        placeholder="Search tables..."
        leftSection={<IconSearch size={16} />}
        value={tableSearch}
        onChange={(e) => setTableSearch(e.currentTarget.value)}
        size="xs"
      />

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
    </Stack>
  );
}
