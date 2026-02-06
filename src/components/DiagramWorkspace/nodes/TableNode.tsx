import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Card, Text, Stack, Badge, Group } from '@mantine/core';
import { IconKey, IconTable } from '@tabler/icons-react';
import type { TableColumn } from '../../../types/database';
import styles from './TableNode.module.css';

interface TableNodeData {
  tableName: string;
  columns: TableColumn[];
  showTypes: boolean;
  showOnlyKeys: boolean;
  relatedColumns: Set<string>;
  [key: string]: unknown;
}

function TableNodeComponent({ data }: NodeProps) {
  const { tableName, columns, showTypes, showOnlyKeys, relatedColumns } = data as TableNodeData;

  const displayColumns = showOnlyKeys
    ? columns.filter((col) => col.isPrimaryKey)
    : columns;

  const hasRelationship = (columnName: string) => relatedColumns?.has(columnName);

  return (
    <Card shadow="md" withBorder className={styles.card} style={{ overflow: 'visible' }}>
      <Card.Section p="xs" withBorder>
        <Group gap={'xs'} align="center">
          <IconTable size={16} color="var(--mantine-color-dimmed)" style={{ flexShrink: 0 }} />
          <Text fw={600} size="sm">{tableName}</Text>
        </Group>
      </Card.Section>

      <Card.Section>
        <Stack gap={0}>
          {displayColumns.map((column) => {
            const hasRelation = hasRelationship(column.name);
            const handleId = `${tableName}-${column.name}`;

            return (
              <Group
                key={column.name}
                gap={6}
                wrap="nowrap"
                className={`${styles.row}${hasRelation ? ` ${styles.rowRelation}` : ''}`}
              >
                {hasRelation && (
                  <>
                    <Handle
                      type="target"
                      position={Position.Left}
                      id={handleId}
                      className={`${styles.handle} ${styles.handleTarget}`}
                      style={{ left: -4 }}
                    />
                    <Handle
                      type="source"
                      position={Position.Right}
                      id={handleId}
                      className={`${styles.handle} ${styles.handleSource}`}
                      style={{ right: -4 }}
                    />
                  </>
                )}

                <div className={styles.relationDot} />

                {column.isPrimaryKey ? (
                  <IconKey size={14} color="var(--mantine-color-yellow-5)" style={{ flexShrink: 0 }} />
                ) : (
                  <div className={styles.iconSpacer} />
                )}

                <Text size="xs" fw={hasRelation ? 500 : 400} className={styles.columnName}>
                  {column.name}
                </Text>

                {showTypes && (
                  <Badge size="xs" variant="light" color="gray" style={{ flexShrink: 0 }}>
                    {column.dataType}
                  </Badge>
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
      </Card.Section>
    </Card>
  );
}

export const TableNode = memo(TableNodeComponent);
