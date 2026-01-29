import { useEffect, useCallback } from 'react';
import { Center, Loader, Stack, Text, Card } from '@mantine/core';
import { ReactFlowProvider } from '@xyflow/react';

import { useDiagramStore } from '../../stores/diagramStore';
import { useConnectionStore } from '../../stores/connectionStore';
import { tauriCommands } from '../../tauri/commands';
import { transformToReactFlow } from './utils/dataTransform';
import { getLayoutedElements } from './utils/layoutAlgorithms';
import { DiagramCanvas } from './DiagramCanvas';

export function DiagramWorkspace() {
  const activeConnection = useConnectionStore((s) => s.activeConnection);
  const {
    nodes,
    showColumnTypes,
    showOnlyKeys,
    isLoading,
    error,
    setNodes,
    setEdges,
    setLoading,
    setError,
  } = useDiagramStore();

  const loadDiagramData = useCallback(async () => {
    if (!activeConnection) {
      setError('No active connection');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all tables
      const tableNames = await tauriCommands.listTables();
      const tableColumnsMap = new Map();

      // Fetch columns for each table
      for (const tableName of tableNames) {
        const columns = await tauriCommands.getTableColumns(tableName);
        tableColumnsMap.set(tableName, columns);
      }

      // Fetch relationships
      const relationships = await tauriCommands.getTableRelationships();

      // Transform to React Flow format
      const { nodes: transformedNodes, edges: transformedEdges } = transformToReactFlow(
        tableColumnsMap,
        relationships,
        showColumnTypes,
        showOnlyKeys
      );

      // Apply auto-layout
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

  // Load data when connection changes
  useEffect(() => {
    if (activeConnection) {
      loadDiagramData();
    }
  }, [activeConnection]); // eslint-disable-line react-hooks/exhaustive-deps

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
