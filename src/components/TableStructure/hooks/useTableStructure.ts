import { useEffect, useState, useCallback } from 'react';
import { tauriCommands } from '../../../tauri/commands';
import { TableColumn } from '../../../types/database';
import { DisplayColumn } from '../../../types/tableStructure';
import { parseDataType, getLengthDisplay } from '../utils/dataTypeParser';

interface UseTableStructureResult {
  columns: DisplayColumn[];
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  refetch: () => Promise<void>;
}

function transformToDisplayColumn(column: TableColumn): DisplayColumn {
  return {
    ...column,
    parsed: parseDataType(column),
    displayLength: getLengthDisplay(column),
  };
}

export function useTableStructure(tableName: string | null): UseTableStructureResult {
  const [columns, setColumns] = useState<DisplayColumn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const fetchColumns = useCallback(async () => {
    if (!tableName) {
      setColumns([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const tableColumns = await tauriCommands.getTableColumns(tableName);
      const displayColumns = tableColumns.map(transformToDisplayColumn);
      setColumns(displayColumns);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load table structure');
      setColumns([]);
    } finally {
      setIsLoading(false);
    }
  }, [tableName]);

  useEffect(() => {
    fetchColumns();
  }, [fetchColumns]);

  return {
    columns,
    isLoading,
    error,
    clearError,
    refetch: fetchColumns,
  };
}
