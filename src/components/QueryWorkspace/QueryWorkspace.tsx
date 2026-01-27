import { useState } from 'react';
import { Box, Stack } from '@mantine/core';
import { QueryResult } from '../../types/database';
import { QueryEditorCard } from './QueryEditorCard';
import { ResultsCard } from './ResultsCard';
import { TableStructureView } from './TableStructureView';
import { useViewMode, useQueryEditorVisible } from '../../stores/tableViewStore';
import styles from './QueryWorkspace.module.css';

interface QueryWorkspaceProps {
  query: string;
  onQueryChange: (query: string) => void;
  onExecute: () => void;
  isExecuting: boolean;
  isConnected: boolean;
  results: QueryResult | null;
  error: string | null;
  onClearError: () => void;
  lastExecutionTime: number | null;
}

export function QueryWorkspace({
  query,
  onQueryChange,
  onExecute,
  isExecuting,
  isConnected,
  results,
  error,
  onClearError,
  lastExecutionTime,
}: QueryWorkspaceProps) {
  const [editorHeight, setEditorHeight] = useState<string>('45vh');
  const viewMode = useViewMode();
  const queryEditorVisible = useQueryEditorVisible();

  const toggleEditorHeight = () => {
    setEditorHeight((prev) => (prev === '45vh' ? '30vh' : '45vh'));
  };

  return (
    <Box h="100%">
      {viewMode === 'data' ? (
        queryEditorVisible ? (
          <Stack gap="md" h="100%">
            <QueryEditorCard
              query={query}
              onQueryChange={onQueryChange}
              onExecute={onExecute}
              isExecuting={isExecuting}
              isConnected={isConnected}
              lastExecutionTime={lastExecutionTime}
              editorHeight={editorHeight}
              onToggleHeight={toggleEditorHeight}
            />
            <Box className={styles.resultsContainer}>
              <ResultsCard
                results={results}
                isExecuting={isExecuting}
                error={error}
                onClearError={onClearError}
              />
            </Box>
          </Stack>
        ) : (
          <Box h="100%">
            <ResultsCard
              results={results}
              isExecuting={isExecuting}
              error={error}
              onClearError={onClearError}
            />
          </Box>
        )
      ) : (
        <TableStructureView />
      )}
    </Box>
  );
}
