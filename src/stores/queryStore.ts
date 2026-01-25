import { create } from 'zustand';
import { tauriCommands } from '../tauri/commands';
import { QueryResult } from '../types/database';

interface QueryState {
  queryText: string;
  results: QueryResult | null;
  isExecuting: boolean;
  error: string | null;
  lastExecutionTime: number | null;
  tables: string[] | null;
  isLoadingTables: boolean;
  loadedTable: string | null;
}

interface QueryActions {
  setQueryText: (text: string) => void;
  executeQuery: () => Promise<void>;
  loadTables: () => Promise<void>;
  selectTable: (tableName: string) => Promise<void>;
  clearResults: () => void;
  clearError: () => void;
}

type QueryStore = QueryState & QueryActions;

export const useQueryStore = create<QueryStore>((set, get) => ({
  queryText: '',
  results: null,
  isExecuting: false,
  error: null,
  lastExecutionTime: null,
  tables: null,
  isLoadingTables: false,
  loadedTable: null,

  setQueryText: (text) => {
    set({ queryText: text });
  },

  executeQuery: async () => {
    const { queryText } = get();
    if (!queryText.trim()) {
      set({ error: 'Query is empty' });
      return;
    }

    set({ isExecuting: true, error: null });
    try {
      const results = await tauriCommands.executeQuery(queryText);
      set({
        results,
        isExecuting: false,
        lastExecutionTime: results.executionTime,
        loadedTable: null,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Query execution failed';
      set({
        error: errorMsg,
        isExecuting: false,
      });
    }
  },

  loadTables: async () => {
    set({ isLoadingTables: true, error: null });
    try {
      const tables = await tauriCommands.listTables();
      set({ tables, isLoadingTables: false });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load tables';
      set({
        error: errorMsg,
        isLoadingTables: false,
      });
    }
  },

  selectTable: async (tableName: string) => {
    const { loadedTable } = get();

    if (loadedTable === tableName) {
      return;
    }

    const query = `SELECT * FROM \`${tableName}\``;

    set({
      queryText: query,
      isExecuting: true,
      error: null,
    });

    try {
      const results = await tauriCommands.executeQuery(query);
      set({
        results,
        isExecuting: false,
        lastExecutionTime: results.executionTime,
        loadedTable: tableName,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Query execution failed';
      set({
        error: errorMsg,
        isExecuting: false,
        results: null,
        loadedTable: null,
      });
    }
  },

  clearResults: () => {
    set({ results: null, error: null, lastExecutionTime: null, loadedTable: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));

export const useQueryText = () => useQueryStore((s) => s.queryText);
export const useSetQueryText = () => useQueryStore((s) => s.setQueryText);
export const useQueryResults = () => useQueryStore((s) => s.results);
export const useIsExecuting = () => useQueryStore((s) => s.isExecuting);
export const useQueryError = () => useQueryStore((s) => s.error);
export const useLastExecutionTime = () => useQueryStore((s) => s.lastExecutionTime);
export const useTables = () => useQueryStore((s) => s.tables);
export const useIsLoadingTables = () => useQueryStore((s) => s.isLoadingTables);
export const useLoadedTable = () => useQueryStore((s) => s.loadedTable);
export const useExecuteQuery = () => useQueryStore((s) => s.executeQuery);
export const useLoadTables = () => useQueryStore((s) => s.loadTables);
export const useSelectTable = () => useQueryStore((s) => s.selectTable);
export const useClearResults = () => useQueryStore((s) => s.clearResults);
export const useClearQueryError = () => useQueryStore((s) => s.clearError);
