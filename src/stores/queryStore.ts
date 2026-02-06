import { create } from 'zustand';
import { tauriCommands } from '../tauri/commands';
import { QueryResult, DatabaseType } from '../types/database';
import { useConnectionStore } from './connectionStore';
import { useConsoleLogStore } from './consoleLogStore';
import { useEditCellStore } from './editCellStore';

interface QueryState {
  queryText: string;
  results: QueryResult | null;
  isExecuting: boolean;
  error: string | null;
  lastExecutionTime: number | null;
  tables: string[] | null;
  isLoadingTables: boolean;
  loadedTable: string | null;
  databases: string[];
  currentDatabase: string;
  isLoadingDatabases: boolean;
}

interface QueryActions {
  setQueryText: (text: string) => void;
  executeQuery: () => Promise<void>;
  loadTables: () => Promise<void>;
  loadDatabases: () => Promise<void>;
  changeDatabase: (databaseName: string) => Promise<void>;
  selectTable: (tableName: string) => Promise<void>;
  refreshTable: () => Promise<void>;
  clearResults: () => void;
  clearError: () => void;
  resetDatabaseState: () => void;
}

type QueryStore = QueryState & QueryActions;

function formatTableName(tableName: string, dbType: DatabaseType | undefined): string {
  if (!dbType) return tableName;

  if (dbType === DatabaseType.PostgreSQL) {
    return `"${tableName}"`;
  } else {
    return `\`${tableName}\``;
  }
}

export const useQueryStore = create<QueryStore>((set, get) => ({
  queryText: '',
  results: null,
  isExecuting: false,
  error: null,
  lastExecutionTime: null,
  tables: null,
  isLoadingTables: false,
  loadedTable: null,
  databases: [],
  currentDatabase: '',
  isLoadingDatabases: false,

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

    useConsoleLogStore.getState().addLog(queryText);

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

  loadDatabases: async () => {
    set({ isLoadingDatabases: true, error: null });
    try {
      const [databases, currentDatabase] = await Promise.all([
        tauriCommands.listDatabases(),
        tauriCommands.getCurrentDatabase(),
      ]);
      set({ databases, currentDatabase, isLoadingDatabases: false });

      if (currentDatabase) {
        await get().loadTables();
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load databases';
      set({
        error: errorMsg,
        isLoadingDatabases: false,
      });
    }
  },

  changeDatabase: async (databaseName: string) => {
    set({ isLoadingTables: true, error: null, tables: null });

    const activeConnection = useConnectionStore.getState().activeConnection;
    const dbType = activeConnection?.dbType;

    let logCommand: string;
    if (dbType === DatabaseType.PostgreSQL) {
      logCommand = `\\c ${databaseName}`;
    } else {
      logCommand = `USE \`${databaseName}\`;`;
    }

    useConsoleLogStore.getState().addLog(logCommand);

    try {
      await tauriCommands.changeDatabase(databaseName);
      set({ currentDatabase: databaseName });
      const tables = await tauriCommands.listTables();
      set({ tables, isLoadingTables: false, loadedTable: null, results: null });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to change database';
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

    useEditCellStore.getState().clearSelection();

    const activeConnection = useConnectionStore.getState().activeConnection;
    const formattedTableName = formatTableName(tableName, activeConnection?.dbType);
    const query = `SELECT * FROM ${formattedTableName}`;

    set({
      queryText: query,
      isExecuting: true,
      error: null,
    });

    useConsoleLogStore.getState().addLog(query);

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

  refreshTable: async () => {
    const { loadedTable } = get();
    if (!loadedTable) return;

    const activeConnection = useConnectionStore.getState().activeConnection;
    const formattedTableName = formatTableName(loadedTable, activeConnection?.dbType);
    const query = `SELECT * FROM ${formattedTableName}`;

    set({ isExecuting: true, error: null });

    useConsoleLogStore.getState().addLog(query);

    try {
      const results = await tauriCommands.executeQuery(query);
      set({
        results,
        isExecuting: false,
        lastExecutionTime: results.executionTime,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to refresh table';
      set({
        error: errorMsg,
        isExecuting: false,
      });
    }
  },

  clearResults: () => {
    set({ results: null, error: null, lastExecutionTime: null, loadedTable: null });
  },

  clearError: () => {
    set({ error: null });
  },

  resetDatabaseState: () => {
    set({
      databases: [],
      currentDatabase: '',
      tables: null,
      loadedTable: null,
      results: null,
    });
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
export const useRefreshTable = () => useQueryStore((s) => s.refreshTable);
export const useClearResults = () => useQueryStore((s) => s.clearResults);
export const useClearQueryError = () => useQueryStore((s) => s.clearError);
export const useDatabases = () => useQueryStore((s) => s.databases);
export const useCurrentDatabase = () => useQueryStore((s) => s.currentDatabase);
export const useIsLoadingDatabases = () => useQueryStore((s) => s.isLoadingDatabases);
export const useLoadDatabases = () => useQueryStore((s) => s.loadDatabases);
export const useChangeDatabase = () => useQueryStore((s) => s.changeDatabase);
export const useResetDatabaseState = () => useQueryStore((s) => s.resetDatabaseState);
