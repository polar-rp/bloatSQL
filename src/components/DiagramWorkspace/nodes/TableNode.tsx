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
  relatedColumns: Set<string>;
  [key: string]: unknown; // Index signature for React Flow compatibility
}

// Constants for handle positioning
const HEADER_HEIGHT = 34; // Height of table name header
const ROW_HEIGHT = 24; // Height of each column row
const PADDING = 8; // Top padding of ScrollArea

function TableNodeComponent({ data }: NodeProps) {
  const { tableName, columns, showTypes, showOnlyKeys, relatedColumns } = data as TableNodeData;

  const displayColumns = showOnlyKeys
    ? columns.filter((col) => col.isPrimaryKey)
    : columns;

  // Check if a column has a relationship
  const hasRelationship = (columnName: string) => {
    return relatedColumns?.has(columnName);
  };

  return (
    <Paper
      shadow="md"
      p={0}
      withBorder
      style={{
        minWidth: 220,
        maxWidth: 280,
        borderWidth: 2,
        position: 'relative',
      }}
    >
      {/* Render all handles at Paper level for correct positioning */}
      {displayColumns.map((column, index) => {
        const columnHasRelation = hasRelationship(column.name);
        if (!columnHasRelation) return null;

        const handleId = `${tableName}-${column.name}`;
        const handleTop = HEADER_HEIGHT + PADDING + (index * ROW_HEIGHT) + (ROW_HEIGHT / 2);

        return (
          <div key={`handles-${column.name}`}>
            {/* Target handle (left side) */}
            <Handle
              type="target"
              position={Position.Left}
              id={handleId}
              style={{
                top: handleTop,
                left: -4,
                width: 8,
                height: 8,
                background: 'var(--mantine-primary-color-filled)',
                border: '2px solid var(--mantine-color-body)',
                borderRadius: 'var(--mantine-radius-default)',
                transition: 'all 0.2s',
              }}
              className="table-node-handle"
            />

            {/* Source handle (right side) */}
            <Handle
              type="source"
              position={Position.Right}
              id={handleId}
              style={{
                top: handleTop,
                right: -4,
                width: 8,
                height: 8,
                background: 'var(--mantine-primary-color-filled)',
                border: '2px solid var(--mantine-color-body)',
                borderRadius: 'var(--mantine-radius-default)',
                transition: 'all 0.2s',
              }}
              className="table-node-handle"
            />
          </div>
        );
      })}

      {/* Table name header */}
      <Text
        fw={700}
        size="sm"
        p="xs"
      >
        {tableName}
      </Text>

      {/* Columns list */}
      <ScrollArea.Autosize mah={180} p="xs">
        <Stack gap={4}>
          {displayColumns.map((column) => {
            const columnHasRelation = hasRelationship(column.name);

            return (
              <Group
                key={column.name}
                gap={6}
                wrap="nowrap"
                style={{
                  padding: '2px 4px',
                  borderRadius: 4,
                  background: columnHasRelation
                    ? 'var(--mantine-primary-color-light-hover)'
                    : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                {/* Column icon */}
                {column.isPrimaryKey ? (
                  <IconKey
                    size={14}
                    style={{ color: 'var(--mantine-color-yellow-5)', flexShrink: 0 }}
                  />
                ) : (
                  <span style={{ width: 14, flexShrink: 0 }} />
                )}

                {/* Column name */}
                <Text
                  size="xs"
                  fw={columnHasRelation ? 500 : 400}
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {column.name}
                </Text>

                {/* Column type badge */}
                {showTypes && (
                  <Badge size="xs" variant="light" color="gray" style={{ flexShrink: 0 }}>
                    {column.dataType}
                  </Badge>
                )}

                {/* Relationship indicator dot */}
                {columnHasRelation && (
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 'var(--mantine-radius-default)',
                      background: 'var(--mantine-primary-color-filled)',
                      flexShrink: 0,
                    }}
                  />
                )}
              </Group>
            );
          })}

          {displayColumns.length === 0 && (
            <Text size="xs" c="dimmed">
              No columns to display
            </Text>
          )}
        </Stack>
      </ScrollArea.Autosize>
    </Paper>
  );
}

export const TableNode = memo(TableNodeComponent);
