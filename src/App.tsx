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

function App() {
  // Connection store - granular selectors
  const connections = useConnections();
  const activeConnection = useActiveConnection();
  const connectionLoading = useConnectionLoading();
  const loadConnections = useLoadConnections();
  const connectToDatabase = useConnectToDatabase();
  const disconnectFromDatabase = useDisconnectFromDatabase();
  const deleteConnection = useDeleteConnection();

  // Query store - granular selectors
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

  // Export store - granular selectors
  const exportDatabase = useExportDatabase();
  const exportError = useExportError();
  const successMessage = useExportSuccessMessage();
  const clearExportError = useClearExportError();
  const clearSuccess = useClearExportSuccess();

  // Layout state
  const [navbarCollapsed, setNavbarCollapsed] = useState(false);
  const [asideCollapsed, setAsideCollapsed] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  // Modal state with useDisclosure
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

  // Tabs store - granular selectors
  const activeTab = useActiveTab();
  const addTableTab = useAddTableTab();
  const updateTabQuery = useUpdateTabQuery();
  const currentTabQuery = useCurrentTabQuery();

  // History state - use useRef-backed state to avoid re-renders on history updates
  const [queryHistory, setQueryHistory] = useState<HistoryItem[]>([]);

  // React 19 transition for non-blocking table selection
  const [isTableTransitionPending, startTableTransition] = useTransition();

  // Load connections on mount
  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  // Load tables when connected
  useEffect(() => {
    if (activeConnection) {
      loadTables();
    }
  }, [activeConnection, loadTables]);

  // Show notifications for export results
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

  // Sync queryText with active tab when switching tabs
  useEffect(() => {
    setQueryText(currentTabQuery);
  }, [activeTab, currentTabQuery, setQueryText]);

  // Sync tab query with store when editing
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

    // Add to history after execution
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
      // Immediate UI update (high priority)
      setSelectedTable(tableName);

      // Create new tab with the table query
      addTableTab(tableName);

      // Defer data loading (low priority) - keeps UI responsive
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

  // Memoize navbar toggle handler
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
            onNewConnection={openConnectionForm}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onEditConnection={handleEditConnection}
            onDeleteConnection={handleDeleteConnection}
            onSelectTable={handleTableSelect}
          />
        </AppShell.Navbar>

        <AppShell.Aside p="md">
          <Aside
            queryHistory={queryHistory}
            onLoadQuery={loadQueryFromHistory}
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
