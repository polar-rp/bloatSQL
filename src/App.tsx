import {
  useState,
  useEffect,
  useCallback,
  useTransition,
  useMemo,
} from "react";
import { AppShell, Box } from "@mantine/core";
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
  useLoadTables,
  useSelectTable,
  useClearQueryError,
} from "./stores/queryStore";
import {
  useExportDatabase,
  useExportError,
  useExportSuccessMessage,
  useClearExportError,
  useClearExportSuccess,
} from "./stores/exportStore";
import { Connection, ExportOptions } from "./types/database";
import {
  Header,
  Navbar,
  Aside,
  HistoryItem,
  MainContent,
} from "./components/Layout";
import { ConnectionModal } from "./components/ConnectionManager";
import {
  useActiveTab,
  useAddTableTab,
  useUpdateTabQuery,
  useCurrentTabQuery,
} from "./stores/tabsStore";
import { ExportModal } from "./components/ExportModal";
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
  const loadTables = useLoadTables();
  const selectTable = useSelectTable();
  const clearError = useClearQueryError();

  const exportDatabase = useExportDatabase();
  const exportError = useExportError();
  const successMessage = useExportSuccessMessage();
  const clearExportError = useClearExportError();
  const clearSuccess = useClearExportSuccess();

  const [navbarCollapsed, setNavbarCollapsed] = useState(false);
  const [asideCollapsed, setAsideCollapsed] = useState(false);
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

  const activeTab = useActiveTab();
  const addTableTab = useAddTableTab();
  const updateTabQuery = useUpdateTabQuery();
  const currentTabQuery = useCurrentTabQuery();

  const [queryHistory, setQueryHistory] = useState<HistoryItem[]>([]);

  const [isTableTransitionPending, startTableTransition] = useTransition();

  useEffect(() => {
    tauriCommands.closeSplashscreen();
  }, []);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  useEffect(() => {
    if (activeConnection) {
      loadTables();
    }
  }, [activeConnection, loadTables]);

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

  useEffect(() => {
    setQueryText(currentTabQuery);
  }, [activeTab, currentTabQuery, setQueryText]);

  const handleTabQueryUpdate = useCallback(
    (tabId: string, query: string) => {
      updateTabQuery(tabId, query);
      if (tabId === activeTab) {
        setQueryText(query);
      }
    },
    [updateTabQuery, activeTab, setQueryText],
  );

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
        await loadTables();
      } catch (error) {
        console.error("Failed to connect:", error);
      }
    },
    [connectToDatabase, loadTables],
  );

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnectFromDatabase();
      setSelectedTable(null);
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  }, [disconnectFromDatabase]);

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

      addTableTab(tableName);

      startTableTransition(() => {
        selectTable(tableName);
      });
    },
    [selectTable, addTableTab],
  );

  const handleExport = useCallback(
    async (options: ExportOptions) => {
      await exportDatabase(options);
    },
    [exportDatabase],
  );

  const loadQueryFromHistory = useCallback(
    (query: string) => {
      handleTabQueryUpdate(activeTab, query);
    },
    [handleTabQueryUpdate, activeTab],
  );

  const handleToggleNavbar = useCallback(() => {
    setNavbarCollapsed((prev) => !prev);
  }, []);

  const handleCollapseAside = useCallback(() => {
    setAsideCollapsed(true);
  }, []);

  const handleQueryChange = useCallback(
    (query: string) => {
      handleTabQueryUpdate(activeTab, query);
    },
    [handleTabQueryUpdate, activeTab],
  );

  const isConnected = useMemo(() => !!activeConnection, [activeConnection]);

  return (
    <Box h="100%">
      <AppShell
        header={{ height: 32 }}
        navbar={{
          width: 300,
          breakpoint: "sm",
          collapsed: { mobile: navbarCollapsed, desktop: navbarCollapsed },
        }}
        aside={{
          width: 300,
          breakpoint: "md",
          collapsed: { mobile: asideCollapsed, desktop: asideCollapsed },
        }}
        padding="md"
      >
        <AppShell.Header>
          <Header
            activeConnection={activeConnection}
            onExecuteQuery={handleExecute}
            onOpenExportModal={openExportModal}
            navbarCollapsed={navbarCollapsed}
            asideCollapsed={asideCollapsed}
            onToggleNavbar={handleToggleNavbar}
            onToggleAside={() => setAsideCollapsed(!asideCollapsed)}
          />
        </AppShell.Header>

        <AppShell.Navbar p="md">
          <Navbar
            connections={connections}
            activeConnection={activeConnection}
            tables={tables}
            connectionLoading={connectionLoading}
            isLoadingTables={isLoadingTables}
            selectedTable={selectedTable}
            queryHistory={queryHistory}
            onNewConnection={openConnectionForm}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onEditConnection={handleEditConnection}
            onDeleteConnection={handleDeleteConnection}
            onSelectTable={handleTableSelect}
            onLoadQuery={loadQueryFromHistory}
          />
        </AppShell.Navbar>

        <AppShell.Aside p="md">
          <Aside
            onCollapse={handleCollapseAside}
          />
        </AppShell.Aside>

        <AppShell.Main
          style={{
            display: "flex",
            flexDirection: "column",
            height:
              "calc(100vh - var(--app-shell-header-height, 0px) - var(--mantine-spacing-md) * 2)",
          }}
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
            isTableTransitionPending={isTableTransitionPending}
          />
        </AppShell.Main>

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
      </AppShell>
    </Box>
  );
}

export default App;
