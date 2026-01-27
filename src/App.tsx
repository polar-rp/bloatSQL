import {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  useConnections,
  useActiveConnection,
  useConnectionLoading,
  useLoadConnections,
  useConnectToDatabase,
  useDisconnectFromDatabase,
  useDeleteConnection,
} from "./stores/connectionStore";
import {
  useQueryText,
  useSetQueryText,
  useQueryResults,
  useIsExecuting,
  useQueryError,
  useLastExecutionTime,
  useTables,
  useIsLoadingTables,
  useExecuteQuery,
  useSelectTable,
  useClearQueryError,
  useDatabases,
  useCurrentDatabase,
  useIsLoadingDatabases,
  useLoadDatabases,
  useChangeDatabase,
  useResetDatabaseState,
} from "./stores/queryStore";
import {
  useExportDatabase,
  useExportError,
  useExportSuccessMessage,
  useClearExportError,
  useClearExportSuccess,
} from "./stores/exportStore";
import { useSetSelectedTable as useSetTableViewSelected } from "./stores/tableViewStore";
import { Connection, ExportOptions } from "./types/database";
import {
  Header,
  Navbar,
  Aside,
  HistoryItem,
  MainContent,
  AppLayout,
} from "./components/Layout";
import { ConnectionModal } from "./components/ConnectionManager";
import { ExportModal } from "./components/modals";
import { tauriCommands } from "./tauri/commands";

function App() {
  const connections = useConnections();
  const activeConnection = useActiveConnection();
  const connectionLoading = useConnectionLoading();
  const loadConnections = useLoadConnections();
  const connectToDatabase = useConnectToDatabase();
  const disconnectFromDatabase = useDisconnectFromDatabase();
  const deleteConnection = useDeleteConnection();

  const queryText = useQueryText();
  const setQueryText = useSetQueryText();
  const results = useQueryResults();
  const isExecuting = useIsExecuting();
  const queryError = useQueryError();
  const lastExecutionTime = useLastExecutionTime();
  const tables = useTables();
  const isLoadingTables = useIsLoadingTables();
  const executeQuery = useExecuteQuery();
  const selectTable = useSelectTable();
  const clearError = useClearQueryError();
  const databases = useDatabases();
  const currentDatabase = useCurrentDatabase();
  const isLoadingDatabases = useIsLoadingDatabases();
  const loadDatabases = useLoadDatabases();
  const changeDatabase = useChangeDatabase();
  const resetDatabaseState = useResetDatabaseState();

  const exportDatabase = useExportDatabase();
  const exportError = useExportError();
  const successMessage = useExportSuccessMessage();
  const clearExportError = useClearExportError();
  const clearSuccess = useClearExportSuccess();

  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const [
    connectionFormOpened,
    { open: openConnectionForm, close: closeConnectionForm },
  ] = useDisclosure(false);
  const [
    exportModalOpened,
    { open: openExportModal, close: closeExportModal },
  ] = useDisclosure(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(
    null,
  );

  const setTableViewSelected = useSetTableViewSelected();

  const [queryHistory, setQueryHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    tauriCommands.closeSplashscreen();
  }, []);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  useEffect(() => {
    if (activeConnection) {
      loadDatabases();
    }
  }, [activeConnection, loadDatabases]);

  useEffect(() => {
    if (successMessage) {
      notifications.show({
        title: "Success",
        message: successMessage,
        color: "green",
      });
      clearSuccess();
    }
  }, [successMessage, clearSuccess]);

  useEffect(() => {
    if (exportError) {
      notifications.show({
        title: "Error",
        message: exportError,
        color: "red",
      });
      clearExportError();
    }
  }, [exportError, clearExportError]);

  // queryText is managed by queryStore

  const handleExecute = useCallback(async () => {
    if (!activeConnection) return;

    await executeQuery();

    const currentTime = lastExecutionTime;
    if (currentTime !== null) {
      setQueryHistory((prev) =>
        [
          {
            query: queryText,
            timestamp: new Date(),
            executionTime: currentTime,
          },
          ...prev,
        ].slice(0, 20),
      );
    }
  }, [activeConnection, executeQuery, lastExecutionTime, queryText]);

  const handleConnect = useCallback(
    async (connection: Connection) => {
      try {
        await connectToDatabase(connection);
      } catch (error) {
        console.error("Failed to connect:", error);
      }
    },
    [connectToDatabase],
  );

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnectFromDatabase();
      resetDatabaseState();
      setSelectedTable(null);
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  }, [disconnectFromDatabase, resetDatabaseState]);

  const handleDatabaseChange = useCallback(
    async (database: string) => {
      try {
        await changeDatabase(database);
        setSelectedTable(null);
      } catch (error) {
        console.error("Failed to change database:", error);
      }
    },
    [changeDatabase],
  );

  const handleDeleteConnection = useCallback(
    async (id: string) => {
      if (confirm("Are you sure you want to delete this connection?")) {
        try {
          await deleteConnection(id);
          await loadConnections();
        } catch (error) {
          console.error("Failed to delete connection:", error);
        }
      }
    },
    [deleteConnection, loadConnections],
  );

  const handleEditConnection = useCallback(
    (connection: Connection) => {
      setEditingConnection(connection);
      openConnectionForm();
    },
    [openConnectionForm],
  );

  const handleCloseConnectionForm = useCallback(() => {
    closeConnectionForm();
    setEditingConnection(null);
    loadConnections();
  }, [closeConnectionForm, loadConnections]);

  const handleConnectionFormSuccess = useCallback(() => {
    closeConnectionForm();
    setEditingConnection(null);
    loadConnections();
  }, [closeConnectionForm, loadConnections]);

  const handleTableSelect = useCallback(
    (tableName: string) => {
      setSelectedTable(tableName);
      setTableViewSelected(tableName);
      selectTable(tableName);
    },
    [selectTable, setTableViewSelected],
  );

  const handleExport = useCallback(
    async (options: ExportOptions) => {
      await exportDatabase(options);
    },
    [exportDatabase],
  );

  const loadQueryFromHistory = useCallback(
    (query: string) => {
      setQueryText(query);
    },
    [setQueryText],
  );

  const handleQueryChange = useCallback(
    (query: string) => {
      setQueryText(query);
    },
    [setQueryText],
  );

  const isConnected = useMemo(() => !!activeConnection, [activeConnection]);

  return (
    <>
      <AppLayout
        header={
          <Header
            activeConnection={activeConnection}
            onExecuteQuery={handleExecute}
            onOpenExportModal={openExportModal}
          />
        }
        navbar={
          <Navbar
            connections={connections}
            activeConnection={activeConnection}
            tables={tables}
            databases={databases}
            currentDatabase={currentDatabase}
            connectionLoading={connectionLoading}
            isLoadingTables={isLoadingTables}
            isLoadingDatabases={isLoadingDatabases}
            selectedTable={selectedTable}
            queryHistory={queryHistory}
            onNewConnection={openConnectionForm}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onEditConnection={handleEditConnection}
            onDeleteConnection={handleDeleteConnection}
            onSelectTable={handleTableSelect}
            onDatabaseChange={handleDatabaseChange}
            onLoadQuery={loadQueryFromHistory}
          />
        }
        aside={<Aside />}
      >
        <MainContent
          queryText={queryText}
          handleQueryChange={handleQueryChange}
          handleExecute={handleExecute}
          isExecuting={isExecuting}
          isConnected={isConnected}
          results={results}
          error={queryError}
          clearError={clearError}
          lastExecutionTime={lastExecutionTime}
          isTableTransitionPending={false}
        />
      </AppLayout>

      <ConnectionModal
        opened={connectionFormOpened}
        onClose={handleCloseConnectionForm}
        onSuccess={handleConnectionFormSuccess}
        connection={editingConnection || undefined}
      />

      {/* Export Modal */}
      {activeConnection && (
        <ExportModal
          opened={exportModalOpened}
          onClose={closeExportModal}
          onExport={handleExport}
          databaseName={activeConnection.name}
        />
      )}
    </>
  );
}

export default App;
