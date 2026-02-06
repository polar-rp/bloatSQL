import type { Node, Edge } from '@xyflow/react';
import type { TableColumn } from '../../../types/database';

const VERTICAL_GAP = 30;
const HORIZONTAL_GAP = 400;

function getNodeHeight(node: Node): number {
  const columns = (node.data.columns as TableColumn[] | undefined) || [];
  const showOnlyKeys = node.data.showOnlyKeys as boolean | undefined;
  const displayCount = showOnlyKeys
    ? columns.filter((col) => col.isPrimaryKey).length
    : columns.length;
  return 34 + 16 + displayCount * 24;
}

function findMainNodeId(nodes: Node[], edges: Edge[]): string {
  const connectionCount = new Map<string, number>();
  nodes.forEach((node) => connectionCount.set(node.id, 0));

  edges.forEach((edge) => {
    connectionCount.set(edge.source, (connectionCount.get(edge.source) || 0) + 1);
    connectionCount.set(edge.target, (connectionCount.get(edge.target) || 0) + 1);
  });

  let maxId = nodes[0].id;
  let maxCount = 0;
  connectionCount.forEach((count, id) => {
    if (count > maxCount) {
      maxCount = count;
      maxId = id;
    }
  });

  return maxId;
}

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[]
): { nodes: Node[]; edges: Edge[] } {
  if (nodes.length === 0) return { nodes, edges };

  if (edges.length === 0) {
    let y = 0;
    const layoutedNodes = nodes
      .slice()
      .sort((a, b) => (a.id as string).localeCompare(b.id as string))
      .map((node) => {
        const positioned = { ...node, position: { x: 0, y } };
        y += getNodeHeight(node) + VERTICAL_GAP;
        return positioned;
      });
    return { nodes: layoutedNodes, edges };
  }

  const mainNodeId = findMainNodeId(nodes, edges);
  const mainNode = nodes.find((n) => n.id === mainNodeId)!;

  const sideNodes = nodes
    .filter((n) => n.id !== mainNodeId)
    .sort((a, b) => (a.id as string).localeCompare(b.id as string));

  let y = 0;
  const sidePositions = new Map<string, { x: number; y: number }>();

  sideNodes.forEach((node) => {
    sidePositions.set(node.id, { x: 0, y });
    y += getNodeHeight(node) + VERTICAL_GAP;
  });

  const totalLeftHeight = y - VERTICAL_GAP;
  const mainNodeHeight = getNodeHeight(mainNode);
  const mainY = Math.max(0, (totalLeftHeight - mainNodeHeight) / 2);

  const layoutedNodes = nodes.map((node) => {
    if (node.id === mainNodeId) {
      return { ...node, position: { x: HORIZONTAL_GAP, y: mainY } };
    }
    const pos = sidePositions.get(node.id)!;
    return { ...node, position: pos };
  });

  return { nodes: layoutedNodes, edges };
}
