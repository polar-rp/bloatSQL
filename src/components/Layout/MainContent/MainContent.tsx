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
  isTableTransitionPending: boolean;
  onOpenExportModal?: (rowData?: Record<string, unknown> | Record<string, unknown>[]) => void;
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
  isTableTransitionPending,
  onOpenExportModal,
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
      onOpenExportModal={onOpenExportModal}
    />
  );
}

export const MainContent = memo(MainContentComponent);
