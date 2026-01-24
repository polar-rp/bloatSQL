import {
  Box,
} from "@mantine/core";
import { EditorTabs } from "../../QueryEditor";
import { QueryWorkspace } from "../../QueryWorkspace";

type MainContentProps = {
  queryText: string;
  handleQueryChange: (query: string) => void;
  handleExecute: () => void;
  isExecuting: boolean;
  isConnected: boolean;
  results: any;
  error: string | null;
  clearError: () => void;
  lastExecutionTime: number | null;
  isTableTransitionPending: boolean;
};

export function MainContent({
  queryText,
  handleQueryChange,
  handleExecute,
  isExecuting,
  isConnected,
  results,
  error,
  clearError,
  lastExecutionTime,
  isTableTransitionPending,
}: MainContentProps) {
  return (
    <>
      <EditorTabs />

      <Box
        mt="md"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <QueryWorkspace
          query={queryText}
          onQueryChange={handleQueryChange}
          onExecute={handleExecute}
          isExecuting={isExecuting || isTableTransitionPending}
          isConnected={isConnected}
          results={results}
          error={error}
          onClearError={clearError}
          lastExecutionTime={lastExecutionTime}
        />
      </Box>
    </>
  );
}
