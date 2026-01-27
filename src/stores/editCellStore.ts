import { create } from 'zustand';

export interface CellEditData {
  rowIndex: number;
  columnName: string;
  focusedColumn: string;
  rowData: Record<string, unknown>;
  tableName: string | null;
  primaryKeyColumn?: string;
  primaryKeyValue?: unknown;
}

interface EditCellState {
  selectedCell: CellEditData | null;
  isEditing: boolean;
  isSaving: boolean;
  error: string | null;
}

interface EditCellActions {
  selectCell: (data: CellEditData) => void;
  clearSelection: () => void;
  setError: (error: string | null) => void;
  setSaving: (isSaving: boolean) => void;
}

type EditCellStore = EditCellState & EditCellActions;

export const useEditCellStore = create<EditCellStore>((set) => ({
  selectedCell: null,
  isEditing: false,
  isSaving: false,
  error: null,

  selectCell: (data) => {
    set({
      selectedCell: data,
      isEditing: true,
      error: null,
    });
  },

  clearSelection: () => {
    set({
      selectedCell: null,
      isEditing: false,
      error: null,
    });
  },

  setError: (error) => {
    set({ error });
  },

  setSaving: (isSaving) => {
    set({ isSaving });
  },
}));

// Selectors
export const useSelectedCell = () => useEditCellStore((s) => s.selectedCell);
export const useIsEditingCell = () => useEditCellStore((s) => s.isEditing);
export const useIsSavingCell = () => useEditCellStore((s) => s.isSaving);
export const useEditCellError = () => useEditCellStore((s) => s.error);
export const useSelectCell = () => useEditCellStore((s) => s.selectCell);
export const useClearCellSelection = () => useEditCellStore((s) => s.clearSelection);
export const useSetEditCellError = () => useEditCellStore((s) => s.setError);
export const useSetSavingCell = () => useEditCellStore((s) => s.setSaving);
