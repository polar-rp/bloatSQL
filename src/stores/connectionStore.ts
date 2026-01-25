import { create } from 'zustand';
import { tauriCommands } from '../tauri/commands';
import { Connection } from '../types/database';

interface ConnectionState {
  connections: Connection[];
  activeConnection: Connection | null;
  isLoading: boolean;
  error: string | null;
}

interface ConnectionActions {
  loadConnections: () => Promise<void>;
  saveConnection: (connection: Omit<Connection, 'id'> & { id?: string }) => Promise<Connection>;
  deleteConnection: (id: string) => Promise<void>;
  testConnection: (connection: Connection) => Promise<void>;
  connectToDatabase: (connection: Connection) => Promise<void>;
  disconnectFromDatabase: () => Promise<void>;
  setActiveConnection: (connection: Connection | null) => void;
  clearError: () => void;
}

type ConnectionStore = ConnectionState & ConnectionActions;

export const useConnectionStore = create<ConnectionStore>((set) => ({
  connections: [],
  activeConnection: null,
  isLoading: false,
  error: null,

  loadConnections: async () => {
    set({ isLoading: true, error: null });
    try {
      const connections = await tauriCommands.getConnections();
      set({ connections, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load connections',
        isLoading: false,
      });
    }
  },

  saveConnection: async (connection) => {
    set({ isLoading: true, error: null });
    try {
      const saved = await tauriCommands.saveConnection(connection);

      set((state) => ({
        connections: state.connections.some((c) => c.id === saved.id)
          ? state.connections.map((c) => (c.id === saved.id ? saved : c))
          : [...state.connections, saved],
        isLoading: false,
      }));

      return saved;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to save connection';
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  deleteConnection: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await tauriCommands.deleteConnection(id);
      set((state) => ({
        connections: state.connections.filter((c) => c.id !== id),
        activeConnection: state.activeConnection?.id === id ? null : state.activeConnection,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete connection',
        isLoading: false,
      });
      throw error;
    }
  },

  testConnection: async (connection) => {
    set({ isLoading: true, error: null });
    try {
      await tauriCommands.testConnection(connection);
      set({ isLoading: false });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Connection test failed';
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  connectToDatabase: async (connection) => {
    set({ isLoading: true, error: null });
    try {
      await tauriCommands.connectToDatabase(connection);
      set({ activeConnection: connection, isLoading: false });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to connect';
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  disconnectFromDatabase: async () => {
    set({ isLoading: true, error: null });
    try {
      await tauriCommands.disconnectFromDatabase();
      set({ activeConnection: null, isLoading: false });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to disconnect';
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  setActiveConnection: (connection) => {
    set({ activeConnection: connection });
  },

  clearError: () => {
    set({ error: null });
  },
}));

export const useConnections = () => useConnectionStore((s) => s.connections);
export const useActiveConnection = () => useConnectionStore((s) => s.activeConnection);
export const useConnectionLoading = () => useConnectionStore((s) => s.isLoading);
export const useConnectionError = () => useConnectionStore((s) => s.error);
export const useLoadConnections = () => useConnectionStore((s) => s.loadConnections);
export const useSaveConnection = () => useConnectionStore((s) => s.saveConnection);
export const useDeleteConnection = () => useConnectionStore((s) => s.deleteConnection);
export const useTestConnection = () => useConnectionStore((s) => s.testConnection);
export const useConnectToDatabase = () => useConnectionStore((s) => s.connectToDatabase);
export const useDisconnectFromDatabase = () => useConnectionStore((s) => s.disconnectFromDatabase);
export const useSetActiveConnection = () => useConnectionStore((s) => s.setActiveConnection);
export const useClearConnectionError = () => useConnectionStore((s) => s.clearError);
