import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';
import type { Node, Edge } from '@xyflow/react';
import type { TableColumn } from '../../../types/database';

const NODE_WIDTH = 250;
const SIMULATION_ITERATIONS = 300; // Run simulation for stable layout

interface SimulationNode {
  id: string;
  x?: number;
  y?: number;
  width: number;
  height: number;
}

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[]
): { nodes: Node[]; edges: Edge[] } {
  if (nodes.length === 0) {
    return { nodes, edges };
  }

  // Create simulation nodes with dimensions
  const simulationNodes: SimulationNode[] = nodes.map((node) => {
    const columns = (node.data.columns as TableColumn[] | undefined) || [];
    const showOnlyKeys = node.data.showOnlyKeys as boolean | undefined;

    const columnCount = columns.length;
    const displayCount = showOnlyKeys
      ? columns.filter((col) => col.isPrimaryKey).length
      : columnCount;

    const nodeHeight = Math.min(34 + 16 + displayCount * 24, 180);

    return {
      id: node.id,
      width: NODE_WIDTH,
      height: nodeHeight,
      x: Math.random() * 1000,
      y: Math.random() * 1000,
    };
  });

  // Create simulation links
  const simulationLinks = edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
  }));

  // Configure force simulation
  const simulation = forceSimulation(simulationNodes)
    .force(
      'link',
      forceLink(simulationLinks)
        .id((d: any) => d.id)
        .distance(200)
        .strength(0.5)
    )
    .force('charge', forceManyBody().strength(-1000))
    .force('center', forceCenter(500, 300))
    .force(
      'collide',
      forceCollide((d: any) => Math.max(d.width, d.height) / 2 + 50)
    );

  // Run simulation synchronously
  simulation.stop();
  for (let i = 0; i < SIMULATION_ITERATIONS; i++) {
    simulation.tick();
  }

  // Map positions back to nodes
  const layoutedNodes = nodes.map((node) => {
    const simNode = simulationNodes.find((n) => n.id === node.id);

    return {
      ...node,
      position: {
        x: (simNode?.x ?? 0) - (simNode?.width ?? NODE_WIDTH) / 2,
        y: (simNode?.y ?? 0) - (simNode?.height ?? 180) / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
