import { create } from 'zustand';

interface RowSelectionStore {
  selectedRows: Record<string, unknown>[];
  clearFn: (() => void) | null;
  exportFn: ((rows: Record<string, unknown>[]) => void) | null;
  setSelection: (rows: Record<string, unknown>[], clearFn: () => void) => void;
  setExportFn: (fn: ((rows: Record<string, unknown>[]) => void) | null) => void;
  reset: () => void;
}

export const useRowSelectionStore = create<RowSelectionStore>((set) => ({
  selectedRows: [],
  clearFn: null,
  exportFn: null,
  setSelection: (selectedRows, clearFn) => set({ selectedRows, clearFn }),
  setExportFn: (exportFn) => set({ exportFn }),
  reset: () => set({ selectedRows: [], clearFn: null }),
}));

export const useSelectedRows = () => useRowSelectionStore((s) => s.selectedRows);
export const useSelectedRowCount = () => useRowSelectionStore((s) => s.selectedRows.length);
export const useClearRowSelection = () => useRowSelectionStore((s) => s.clearFn);
export const useExportRowsFn = () => useRowSelectionStore((s) => s.exportFn);
