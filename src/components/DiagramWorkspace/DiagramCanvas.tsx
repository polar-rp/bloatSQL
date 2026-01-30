import { useCallback, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
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

const nodeTypes = {
  tableNode: TableNode,
} as const;

const edgeTypes = {
  relationshipEdge: RelationshipEdge,
} as const;

const fitViewOptions = { padding: 0.2 };

const connectionLineStyle = {
  strokeWidth: 2,
  stroke: 'var(--mantine-primary-color-filled)',
};

export function DiagramCanvas() {
  const [localNodes, setLocalNodes] = useState<Node[]>([]);
  const [localEdges, setLocalEdges] = useState<Edge[]>([]);

  const localNodesRef = useRef<Node[]>([]);
  const localEdgesRef = useRef<Edge[]>([]);

  const nodes = useDiagramStore((s) => s.nodes);
  const edges = useDiagramStore((s) => s.edges);
  const showColumnTypes = useDiagramStore((s) => s.showColumnTypes);
  const showOnlyKeys = useDiagramStore((s) => s.showOnlyKeys);
  const setStoreNodes = useDiagramStore((s) => s.setNodes);
  const setStoreEdges = useDiagramStore((s) => s.setEdges);

  useEffect(() => {
    localNodesRef.current = localNodes;
  }, [localNodes]);

  useEffect(() => {
    localEdgesRef.current = localEdges;
  }, [localEdges]);

  useEffect(() => {
    const nodesWithSettings = nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        showTypes: showColumnTypes,
        showOnlyKeys: showOnlyKeys,
      },
    }));
    setLocalNodes(nodesWithSettings);
  }, [nodes, showColumnTypes, showOnlyKeys]);

  useEffect(() => {
    setLocalEdges(edges);
  }, [edges]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setLocalNodes((nds) => applyNodeChanges(changes, nds));
    },
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      setLocalEdges((eds) => applyEdgeChanges(changes, eds));
    },
    []
  );

  const handleNodesChangeEnd = useCallback(() => {
    setStoreNodes(localNodesRef.current);
  }, [setStoreNodes]);

  const handleResetLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      localNodesRef.current,
      localEdgesRef.current
    );
    setLocalNodes(layoutedNodes);
    setLocalEdges(layoutedEdges);
    setStoreNodes(layoutedNodes);
    setStoreEdges(layoutedEdges);
  }, [setStoreNodes, setStoreEdges]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <style>
        {`
          /* Handle hover states */
          .table-node-handle:hover {
            width: 10px !important;
            height: 10px !important;
            background: var(--mantine-primary-color-light) !important;
          }

          /* Handle connecting state */
          .table-node-handle.connecting {
            background: var(--mantine-color-blue-5) !important;
          }

          /* Handle valid connection state */
          .table-node-handle.valid {
            background: var(--mantine-color-green-5) !important;
          }

          /* Selected edge arrow color */
          .react-flow__edge.selected path {
            stroke: var(--mantine-primary-color-filled) !important;
          }
        `}
      </style>
      <ReactFlow
        nodes={localNodes}
        edges={localEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={handleNodesChangeEnd}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={fitViewOptions}
        connectionLineStyle={connectionLineStyle}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        {/* Custom SVG marker for relationship arrows */}
        <svg style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <marker
              id="relationship-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path
                d="M 0 0 L 10 5 L 0 10 z"
                fill="var(--mantine-color-default-border)"
                style={{ transition: 'fill 0.2s' }}
              />
            </marker>
          </defs>
        </svg>

        <Background gap={16} size={1} />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          bgColor='var(--mantine-color-body)'
          maskColor='var(--mantine-primary-color-light)'
          style={{
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
