import { useState } from 'react';
import { Box, Stack } from '@mantine/core';
import { QueryResult } from '../../types/database';
import { QueryEditorCard } from './QueryEditorCard';
import { ResultsCard } from './ResultsCard';
import { TableStructureView } from '../TableStructure';
import { DiagramWorkspace } from '../DiagramWorkspace';
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
  onOpenExportModal?: (rowData?: Record<string, unknown> | Record<string, unknown>[]) => void;
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
  onOpenExportModal,
}: QueryWorkspaceProps) {
  const [editorHeight] = useState<string>('45vh');
  const viewMode = useViewMode();
  const queryEditorVisible = useQueryEditorVisible();

  return (
    <Box h="100%">
      {viewMode === 'data' ? (
        queryEditorVisible ? (
          <Stack gap={0} h="100%">
            <QueryEditorCard
              query={query}
              onQueryChange={onQueryChange}
              onExecute={onExecute}
              isExecuting={isExecuting}
              isConnected={isConnected}
              editorHeight={editorHeight}
            />
            <Box className={styles.resultsContainer}>
              <ResultsCard
                results={results}
                isExecuting={isExecuting}
                error={error}
                onClearError={onClearError}
                onOpenExportModal={onOpenExportModal}
              />
            </Box>
          </Stack>
        ) : (
            <ResultsCard
              results={results}
              isExecuting={isExecuting}
              error={error}
              onClearError={onClearError}
              onOpenExportModal={onOpenExportModal}
            />
        )
      ) : viewMode === 'structure' ? (
        <TableStructureView />
      ) : (
        <DiagramWorkspace />
      )}
    </Box>
  );
}
