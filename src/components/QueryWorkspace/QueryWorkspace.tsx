import { useState } from 'react';
import { Box, rem } from '@mantine/core';
import { QueryResult } from '../../types/database';
import { QueryEditorCard } from './QueryEditorCard';
import { ResultsCard } from './ResultsCard';

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
  const [editorHeight, setEditorHeight] = useState(250);

  const toggleEditorHeight = () => {
    setEditorHeight((prev) => (prev === 250 ? 150 : 250));
  };

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
      <Box mt={rem(12)} style={{ flex: 1, minHeight: 0 }}>
        <ResultsCard
          results={results}
          isExecuting={isExecuting}
          error={error}
          onClearError={onClearError}
        />
      </Box>
    </Box>
  );
}
