import { create } from 'zustand';
import { DisplayColumn, AlterColumnOperation, ColumnDefinition } from '../types/tableStructure';

interface StructureEditState {
  tableName: string | null;
  originalColumns: DisplayColumn[];
  pendingOperations: AlterColumnOperation[];
  selectedColumn: DisplayColumn | null;
  isEditingColumn: boolean;
  isApplying: boolean;
  error: string | null;
}

interface StructureEditActions {
  startEditing: (tableName: string, columns: DisplayColumn[]) => void;
  stopEditing: () => void;
  selectColumn: (column: DisplayColumn) => void;
  clearColumnSelection: () => void;
  addColumn: (definition: ColumnDefinition) => void;
  modifyColumn: (columnName: string, newDefinition: ColumnDefinition) => void;
  dropColumn: (columnName: string) => void;
  renameColumn: (columnName: string, newName: string) => void;
  undoOperation: () => void;
  removeOperationByIndex: (index: number) => void;
  clearAllPending: () => void;
  setApplying: (isApplying: boolean) => void;
  setError: (error: string | null) => void;
}

type StructureEditStore = StructureEditState & StructureEditActions;

export const useStructureEditStore = create<StructureEditStore>((set) => ({
  tableName: null,
  originalColumns: [],
  pendingOperations: [],
  selectedColumn: null,
  isEditingColumn: false,
  isApplying: false,
  error: null,

  startEditing: (tableName, columns) => {
    set({
      tableName,
      originalColumns: columns,
      pendingOperations: [],
      selectedColumn: null,
      isEditingColumn: true,
      error: null,
    });
  },

  stopEditing: () => {
    set({
      tableName: null,
      originalColumns: [],
      pendingOperations: [],
      selectedColumn: null,
      isEditingColumn: false,
      error: null,
    });
  },

  selectColumn: (column) => {
    set({ selectedColumn: column });
  },

  clearColumnSelection: () => {
    set({ selectedColumn: null });
  },

  addColumn: (definition) => {
    set((state) => ({
      pendingOperations: [
        ...state.pendingOperations,
        {
          type: 'ADD_COLUMN',
          columnName: definition.name,
          newDefinition: definition,
        },
      ],
    }));
  },

  modifyColumn: (columnName, newDefinition) => {
    set((state) => ({
      pendingOperations: [
        ...state.pendingOperations,
        {
          type: 'MODIFY_COLUMN',
          columnName,
          newDefinition,
        },
      ],
    }));
  },

  dropColumn: (columnName) => {
    set((state) => ({
      pendingOperations: [
        ...state.pendingOperations,
        {
          type: 'DROP_COLUMN',
          columnName,
        },
      ],
    }));
  },

  renameColumn: (columnName, newName) => {
    set((state) => ({
      pendingOperations: [
        ...state.pendingOperations,
        {
          type: 'RENAME_COLUMN',
          columnName,
          newColumnName: newName,
        },
      ],
    }));
  },

  undoOperation: () => {
    set((state) => ({
      pendingOperations: state.pendingOperations.slice(0, -1),
    }));
  },

  removeOperationByIndex: (index) => {
    set((state) => ({
      pendingOperations: state.pendingOperations.filter((_, i) => i !== index),
    }));
  },

  clearAllPending: () => {
    set({ pendingOperations: [] });
  },

  setApplying: (isApplying) => {
    set({ isApplying });
  },

  setError: (error) => {
    set({ error });
  },
}));

// Fine-grained selectors for performance
export const useSelectedStructureColumn = () =>
  useStructureEditStore((s) => s.selectedColumn);

export const usePendingOperations = () =>
  useStructureEditStore((s) => s.pendingOperations);

export const useHasPendingChanges = () =>
  useStructureEditStore((s) => s.pendingOperations.length > 0);

export const useIsEditingStructure = () =>
  useStructureEditStore((s) => s.isEditingColumn);

export const useIsApplyingStructure = () =>
  useStructureEditStore((s) => s.isApplying);

export const useStructureEditError = () =>
  useStructureEditStore((s) => s.error);

export const useStructureTableName = () =>
  useStructureEditStore((s) => s.tableName);

export const useOriginalColumns = () =>
  useStructureEditStore((s) => s.originalColumns);

export const useRemoveOperationByIndex = () =>
  useStructureEditStore((s) => s.removeOperationByIndex);
