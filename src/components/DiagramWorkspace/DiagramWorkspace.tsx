import { useEffect, useCallback } from 'react';
import { Center, Loader, Stack, Text } from '@mantine/core';
import { ReactFlowProvider } from '@xyflow/react';

import { useDiagramStore } from '../../stores/diagramStore';
import { useConnectionStore } from '../../stores/connectionStore';
import { tauriCommands } from '../../tauri/commands';
import { transformToReactFlow } from './utils/dataTransform';
import { getLayoutedElements } from './utils/layoutAlgorithms';
import { DiagramCanvas } from './DiagramCanvas';

export function DiagramWorkspace() {
  const activeConnection = useConnectionStore((s) => s.activeConnection);

  const nodes = useDiagramStore((s) => s.nodes);
  const showColumnTypes = useDiagramStore((s) => s.showColumnTypes);
  const showOnlyKeys = useDiagramStore((s) => s.showOnlyKeys);
  const isLoading = useDiagramStore((s) => s.isLoading);
  const error = useDiagramStore((s) => s.error);
  const setNodes = useDiagramStore((s) => s.setNodes);
  const setEdges = useDiagramStore((s) => s.setEdges);
  const setLoading = useDiagramStore((s) => s.setLoading);
  const setError = useDiagramStore((s) => s.setError);

  const loadDiagramData = useCallback(async () => {
    if (!activeConnection) {
      setError('No active connection');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const tableNames = await tauriCommands.listTables();
      const tableColumnsMap = new Map();

      for (const tableName of tableNames) {
        const columns = await tauriCommands.getTableColumns(tableName);
        tableColumnsMap.set(tableName, columns);
      }

      const relationships = await tauriCommands.getTableRelationships();

      const { nodes: transformedNodes, edges: transformedEdges } = transformToReactFlow(
        tableColumnsMap,
        relationships,
        showColumnTypes,
        showOnlyKeys
      );

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        transformedNodes,
        transformedEdges
      );

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } catch (err) {
      console.error('Failed to load diagram data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load diagram');
    } finally {
      setLoading(false);
    }
  }, [activeConnection, showColumnTypes, showOnlyKeys, setNodes, setEdges, setLoading, setError]);

  useEffect(() => {
    if (activeConnection) {
      loadDiagramData();
    }
  }, [activeConnection, loadDiagramData]);

  if (!activeConnection) {
    return (
      <Center h="100%">
        <Stack align="center" gap="md">
          <Text c="dimmed">Connect to a database to view the diagram</Text>
        </Stack>
      </Center>
    );
  }

  if (isLoading) {
    return (
      <Center h="100%">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Loading database schema...</Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center h="100%">
        <Stack align="center" gap="md">
          <Text c="red" fw={500}>
            Error loading diagram
          </Text>
          <Text c="dimmed" size="sm">
            {error}
          </Text>
        </Stack>
      </Center>
    );
  }

  if (nodes.length === 0) {
    return (
      <Center h="100%">
        <Stack align="center" gap="md">
          <Text c="dimmed">No tables found in the database</Text>
        </Stack>
      </Center>
    );
  }

  return (
      <ReactFlowProvider>
        <DiagramCanvas />
      </ReactFlowProvider>
  );
}
