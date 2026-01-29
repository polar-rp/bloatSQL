import type { Node, Edge } from '@xyflow/react';
import type { TableColumn, TableRelationship } from '../../../types/database';

export function transformToReactFlow(
  tables: Map<string, TableColumn[]>,
  relationships: TableRelationship[],
  showTypes: boolean,
  showOnlyKeys: boolean
): { nodes: Node[]; edges: Edge[] } {
  // Create nodes from tables
  const nodes: Node[] = Array.from(tables.entries()).map(
    ([tableName, columns], index) => ({
      id: tableName,
      type: 'tableNode',
      position: { x: (index % 4) * 300, y: Math.floor(index / 4) * 250 },
      data: {
        tableName,
        columns,
        showTypes,
        showOnlyKeys,
      },
    })
  );

  // Create edges from relationships
  const edges: Edge[] = relationships.map((rel, index) => ({
    id: `${rel.fromTable}-${rel.toTable}-${rel.constraintName}-${index}`,
    source: rel.fromTable,
    target: rel.toTable,
    type: 'relationshipEdge',
    data: {
      fromColumn: rel.fromColumn,
      toColumn: rel.toColumn,
      constraintName: rel.constraintName,
    },
  }));

  return { nodes, edges };
}
