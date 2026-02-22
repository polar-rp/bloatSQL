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
  usePingMs,
  useMeasurePing,
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
  useRefreshTable,
} from "./stores/queryStore";
import {
  useExportError,
  useExportSuccessMessage,
  useClearExportError,
  useClearExportSuccess,
} from "./stores/exportStore";
import { useSetSelectedTable as useSetTableViewSelected } from "./stores/tableViewStore";
import { useStructureEditStore } from "./stores/structureEditStore";
import { useEditCellStore } from "./stores/editCellStore";
import { Connection } from "./types/database";
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
import { useNavigationHistory } from "./hooks/useNavigationHistory";

function App() {
  const connections = useConnections();
  const activeConnection = useActiveConnection();
  const connectionLoading = useConnectionLoading();
  const loadConnections = useLoadConnections();
  const connectToDatabase = useConnectToDatabase();
  const disconnectFromDatabase = useDisconnectFromDatabase();
  const deleteConnection = useDeleteConnection();

  const pingMs = usePingMs();
  const measurePing = useMeasurePing();

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
  const refreshTable = useRefreshTable();

  const exportError = useExportError();
  const successMessage = useExportSuccessMessage();
  const clearExportError = useClearExportError();
  const clearSuccess = useClearExportSuccess();

  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const navigationHistory = useNavigationHistory<string>(
    (tableName) => {
      setSelectedTable(tableName);
      setTableViewSelected(tableName);
      selectTable(tableName);
    },
    (a, b) => a === b
  );

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
  const [exportRowData, setExportRowData] = useState<Record<string, unknown> | Record<string, unknown>[] | undefined>(undefined);

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
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F5') {
        event.preventDefault();
        if (activeConnection) {
          refreshTable();
          notifications.show({
            title: "Odświeżanie",
            message: "Dane zostały odświeżone",
            color: "blue",
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeConnection, refreshTable]);

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
      setTableViewSelected(null);
      useStructureEditStore.getState().stopEditing();
      useEditCellStore.getState().clearSelection();
      useEditCellStore.getState().stopAddRow();
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  }, [disconnectFromDatabase, resetDatabaseState, setTableViewSelected]);

  const handleRefreshConnection = useCallback(async () => {
    if (!activeConnection) return;
    await Promise.all([loadDatabases(), measurePing()]);
  }, [activeConnection, loadDatabases, measurePing]);

  const handleDatabaseChange = useCallback(
    async (database: string) => {
      try {
        await changeDatabase(database);
        setSelectedTable(null);
        setTableViewSelected(null);
        useStructureEditStore.getState().stopEditing();
        useEditCellStore.getState().clearSelection();
        useEditCellStore.getState().stopAddRow();
      } catch (error) {
        console.error("Failed to change database:", error);
      }
    },
    [changeDatabase, setTableViewSelected],
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
      navigationHistory.push(tableName);
    },
    [selectTable, setTableViewSelected, navigationHistory],
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

  const handleOpenExportModalWithRow = useCallback(
    (rowData?: Record<string, unknown> | Record<string, unknown>[]) => {
      setExportRowData(rowData);
      openExportModal();
    },
    [openExportModal],
  );

  const handleCloseExportModal = useCallback(() => {
    closeExportModal();
    setExportRowData(undefined);
  }, [closeExportModal]);

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
            pingMs={pingMs}
            onNewConnection={openConnectionForm}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onEditConnection={handleEditConnection}
            onDeleteConnection={handleDeleteConnection}
            onSelectTable={handleTableSelect}
            onDatabaseChange={handleDatabaseChange}
            onLoadQuery={loadQueryFromHistory}
            onRefresh={handleRefreshConnection}
          />
        }
        aside={<Aside />}
        onNavigateBack={navigationHistory.canGoBack ? navigationHistory.goBack : undefined}
        onNavigateForward={navigationHistory.canGoForward ? navigationHistory.goForward : undefined}
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
          isTableTransitionPending={false}
          onOpenExportModal={handleOpenExportModalWithRow}
        />
      </AppLayout>

      <ConnectionModal
        opened={connectionFormOpened}
        onClose={handleCloseConnectionForm}
        onSuccess={handleConnectionFormSuccess}
        connection={editingConnection || undefined}
      />

      {activeConnection && currentDatabase && (
        <ExportModal
          opened={exportModalOpened}
          onClose={handleCloseExportModal}
          databaseName={currentDatabase}
          rowData={exportRowData}
        />
      )}
    </>
  );
}

export default App;
