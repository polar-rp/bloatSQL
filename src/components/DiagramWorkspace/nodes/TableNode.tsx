import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Paper, Text, Stack, Badge, Group, ScrollArea } from '@mantine/core';
import { IconKey } from '@tabler/icons-react';
import type { TableColumn } from '../../../types/database';

// Node data structure
interface TableNodeData {
  tableName: string;
  columns: TableColumn[];
  showTypes: boolean;
  showOnlyKeys: boolean;
  [key: string]: unknown; // Index signature for React Flow compatibility
}

function TableNodeComponent({ data }: NodeProps) {
  const { tableName, columns, showTypes, showOnlyKeys } = data as TableNodeData;

  const displayColumns = showOnlyKeys
    ? columns.filter((col) => col.isPrimaryKey)
    : columns;

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: 'var(--mantine-primary-color-filled)' }}
      />

      <Paper
        shadow="md"
        p={0}
        withBorder
        style={{
          minWidth: 220,
          maxWidth: 280,
          borderWidth: 2,
        }}
      >
        <Text
          fw={700}
          size="sm"
          p="xs"
        >
          {tableName}
        </Text>

        <ScrollArea.Autosize mah={180} p="xs">
          <Stack gap={4}>
            {displayColumns.map((column) => (
              <Group key={column.name} gap={6} wrap="nowrap">
                {column.isPrimaryKey ? (
                  <IconKey
                    size={14}
                    style={{ color: 'var(--mantine-color-yellow-5)', flexShrink: 0 }}
                  />
                ) : (
                  <span style={{ width: 14, flexShrink: 0 }} />
                )}

                <Text
                  size="xs"
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {column.name}
                </Text>

                {showTypes && (
                  <Badge size="xs" variant="light" color="gray" style={{ flexShrink: 0 }}>
                    {column.dataType}
                  </Badge>
                )}
              </Group>
            ))}

            {displayColumns.length === 0 && (
              <Text size="xs" c="dimmed">
                No columns to display
              </Text>
            )}
          </Stack>
        </ScrollArea.Autosize>
      </Paper>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: 'var(--mantine-primary-color-filled)' }}
      />
    </>
  );
}

export const TableNode = memo(TableNodeComponent);
