import { stratify, tree } from 'd3-hierarchy';
import type { Node, Edge } from '@xyflow/react';

const NODE_WIDTH = 250;
const NODE_HEIGHT = 200;

interface LayoutNode {
  id: string;
  parentId?: string;
}

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
): { nodes: Node[]; edges: Edge[] } {
  if (nodes.length === 0) {
    return { nodes, edges };
  }

  // Build parent-child relationships from edges
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const childToParent = new Map<string, string>();

  edges.forEach((edge) => {
    childToParent.set(edge.target, edge.source);
  });

  // Find root nodes (nodes with no parent)
  const rootNodes = nodes.filter((node) => !childToParent.has(node.id));

  // If no edges or all nodes are disconnected, use simple grid layout
  if (edges.length === 0 || rootNodes.length === nodes.length) {
    return {
      nodes: nodes.map((node, index) => ({
        ...node,
        position: {
          x: (index % 4) * 300,
          y: Math.floor(index / 4) * 250,
        },
      })),
      edges,
    };
  }

  // Use the first root as the tree root, or first node if no clear root
  const rootNode = rootNodes[0] || nodes[0];

  // Prepare data for d3-hierarchy
  const hierarchyData: LayoutNode[] = nodes.map((node) => ({
    id: node.id,
    parentId: childToParent.get(node.id),
  }));

  try {
    // Create hierarchy
    const root = stratify<LayoutNode>()
      .id((d) => d.id)
      .parentId((d) => d.parentId)(hierarchyData);

    // Create tree layout
    const treeLayout = tree<LayoutNode>()
      .nodeSize(
        direction === 'TB'
          ? [NODE_WIDTH + 50, NODE_HEIGHT + 100]
          : [NODE_HEIGHT + 100, NODE_WIDTH + 50]
      );

    // Apply layout
    const layoutRoot = treeLayout(root);

    // Update node positions
    const layoutedNodes = nodes.map((node) => {
      const layoutNode = layoutRoot.descendants().find((d) => d.id === node.id);

      if (!layoutNode) {
        return node;
      }

      return {
        ...node,
        position: {
          x: direction === 'TB' ? layoutNode.x : layoutNode.y,
          y: direction === 'TB' ? layoutNode.y : layoutNode.x,
        },
      };
    });

    return { nodes: layoutedNodes, edges };
  } catch (error) {
    // Fallback to grid layout if hierarchy fails
    console.warn('Layout failed, using grid fallback:', error);
    return {
      nodes: nodes.map((node, index) => ({
        ...node,
        position: {
          x: (index % 4) * 300,
          y: Math.floor(index / 4) * 250,
        },
      })),
      edges,
    };
  }
}
