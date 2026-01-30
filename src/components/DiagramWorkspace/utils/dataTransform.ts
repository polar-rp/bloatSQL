import type { Node, Edge } from '@xyflow/react';
import type { TableColumn, TableRelationship } from '../../../types/database';

export function transformToReactFlow(
  tables: Map<string, TableColumn[]>,
  relationships: TableRelationship[],
  showTypes: boolean,
  showOnlyKeys: boolean
): { nodes: Node[]; edges: Edge[] } {
  // Build a map of which columns have relationships for each table
  const tableRelatedColumns = new Map<string, Set<string>>();

  relationships.forEach((rel) => {
    if (!tableRelatedColumns.has(rel.fromTable)) {
      tableRelatedColumns.set(rel.fromTable, new Set());
    }
    if (!tableRelatedColumns.has(rel.toTable)) {
      tableRelatedColumns.set(rel.toTable, new Set());
    }
    tableRelatedColumns.get(rel.fromTable)!.add(rel.fromColumn);
    tableRelatedColumns.get(rel.toTable)!.add(rel.toColumn);
  });

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
        // Pass related columns to the node for handle rendering
        relatedColumns: tableRelatedColumns.get(tableName) || new Set(),
      },
    })
  );

  // Create edges from relationships with specific handle connections
  const edges: Edge[] = relationships.map((rel, index) => ({
    id: `${rel.constraintName}-${index}`,
    source: rel.fromTable,
    sourceHandle: `${rel.fromTable}-${rel.fromColumn}`,
    target: rel.toTable,
    targetHandle: `${rel.toTable}-${rel.toColumn}`,
    type: 'relationshipEdge',
    data: {
      fromColumn: rel.fromColumn,
      toColumn: rel.toColumn,
      constraintName: rel.constraintName,
    },
  }));

  return { nodes, edges };
}
