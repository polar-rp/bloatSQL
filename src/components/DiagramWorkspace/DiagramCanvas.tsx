import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  applyNodeChanges,
  applyEdgeChanges,
  type OnNodesChange,
  type OnEdgesChange,
  type Node,
  type Edge,
} from '@xyflow/react';

import { useDiagramStore } from '../../stores/diagramStore';
import { TableNode } from './nodes/TableNode';
import { RelationshipEdge } from './edges/RelationshipEdge';
import { DiagramToolbar } from './DiagramToolbar';
import { getLayoutedElements } from './utils/layoutAlgorithms';

// Define nodeTypes OUTSIDE the component to prevent re-renders (per React Flow docs)
const nodeTypes = {
  tableNode: TableNode,
} as const;

// Define edgeTypes OUTSIDE the component to prevent re-renders (per React Flow docs)
const edgeTypes = {
  relationshipEdge: RelationshipEdge,
} as const;

// Define fitViewOptions OUTSIDE the component (per React Flow performance docs)
const fitViewOptions = { padding: 0.2 };

export function DiagramCanvas() {
  const {
    nodes,
    edges,
    showColumnTypes,
    showOnlyKeys,
    setNodes,
    setEdges,
  } = useDiagramStore();

  // Handle node changes
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setNodes(applyNodeChanges(changes, nodes));
    },
    [nodes, setNodes]
  );

  // Handle edge changes
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      setEdges(applyEdgeChanges(changes, edges));
    },
    [edges, setEdges]
  );

  // Reset layout handler
  const handleResetLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [nodes, edges, setNodes, setEdges]);

  // Memoize nodes with updated display settings
  const displayNodes = useMemo<Node[]>(() => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        showTypes: showColumnTypes,
        showOnlyKeys: showOnlyKeys,
      },
    }));
  }, [nodes, showColumnTypes, showOnlyKeys]);

  // SVG marker definition - memoized
  const markerDefs = useMemo(
    () => (
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <marker
            id="diagram-arrow"
            markerWidth="12"
            markerHeight="12"
            refX="10"
            refY="6"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path
              d="M2,2 L10,6 L2,10 L4,6 Z"
              fill="var(--mantine-primary-color-filled)"
            />
          </marker>
        </defs>
      </svg>
    ),
    []
  );

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {markerDefs}
      <ReactFlow
        nodes={displayNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={fitViewOptions}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          style={{
            background: 'var(--mantine-color-body)',
            border: '1px solid var(--mantine-color-default-border)',
          }}
        />
        <Panel position="top-center">
          <DiagramToolbar onResetLayout={handleResetLayout} />
        </Panel>
      </ReactFlow>
    </div>
  );
}
