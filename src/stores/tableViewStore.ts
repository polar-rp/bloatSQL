import { create } from 'zustand';

export type ViewMode = 'data' | 'structure';

interface TableViewState {
  selectedTable: string | null;
  viewMode: ViewMode;
  queryEditorVisible: boolean;
}

interface TableViewActions {
  setSelectedTable: (tableName: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  resetViewMode: () => void;
  setQueryEditorVisible: (visible: boolean) => void;
  toggleQueryEditor: () => void;
}

type TableViewStore = TableViewState & TableViewActions;

export const useTableViewStore = create<TableViewStore>((set) => ({
  selectedTable: null,
  viewMode: 'data',
  queryEditorVisible: false,

  setSelectedTable: (tableName) => {
    set({ selectedTable: tableName, viewMode: 'data' });
  },

  setViewMode: (mode) => {
    set({ viewMode: mode });
  },

  resetViewMode: () => {
    set({ viewMode: 'data' });
  },

  setQueryEditorVisible: (visible) => {
    set({ queryEditorVisible: visible });
  },

  toggleQueryEditor: () => {
    set((state) => ({ queryEditorVisible: !state.queryEditorVisible }));
  },
}));

// Selectors for optimal re-render performance
export const useSelectedTable = () => useTableViewStore((s) => s.selectedTable);
export const useViewMode = () => useTableViewStore((s) => s.viewMode);
export const useSetSelectedTable = () => useTableViewStore((s) => s.setSelectedTable);
export const useSetViewMode = () => useTableViewStore((s) => s.setViewMode);
export const useResetViewMode = () => useTableViewStore((s) => s.resetViewMode);
export const useQueryEditorVisible = () => useTableViewStore((s) => s.queryEditorVisible);
export const useToggleQueryEditor = () => useTableViewStore((s) => s.toggleQueryEditor);
