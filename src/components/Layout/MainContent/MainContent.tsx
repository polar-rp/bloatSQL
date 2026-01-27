import { memo } from "react";
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

function MainContentComponent({
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
  );
}

export const MainContent = memo(MainContentComponent);
