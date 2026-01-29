import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Node, Edge } from '@xyflow/react';

interface DiagramState {
  nodes: Node[];
  edges: Edge[];
  selectedTables: string[];
  showColumnTypes: boolean;
  showOnlyKeys: boolean;
  isLoading: boolean;
  error: string | null;
}

interface DiagramActions {
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  updateNodePositions: (nodes: Node[]) => void;
  setSelectedTables: (tables: string[]) => void;
  toggleTable: (tableName: string) => void;
  toggleColumnTypes: () => void;
  toggleOnlyKeys: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetDiagram: () => void;
}

type DiagramStore = DiagramState & DiagramActions;

export const useDiagramStore = create<DiagramStore>()(
  persist(
    (set) => ({
      nodes: [],
      edges: [],
      selectedTables: [],
      showColumnTypes: true,
      showOnlyKeys: false,
      isLoading: false,
      error: null,

      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),
      updateNodePositions: (nodes) => set({ nodes }),
      setSelectedTables: (tables) => set({ selectedTables: tables }),
      toggleTable: (tableName) =>
        set((state) => ({
          selectedTables: state.selectedTables.includes(tableName)
            ? state.selectedTables.filter((t) => t !== tableName)
            : [...state.selectedTables, tableName],
        })),
      toggleColumnTypes: () =>
        set((state) => ({ showColumnTypes: !state.showColumnTypes })),
      toggleOnlyKeys: () =>
        set((state) => ({ showOnlyKeys: !state.showOnlyKeys })),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      resetDiagram: () =>
        set({
          nodes: [],
          edges: [],
          selectedTables: [],
          error: null,
        }),
    }),
    {
      name: 'diagram-storage',
      partialize: (state) => ({
        showColumnTypes: state.showColumnTypes,
        showOnlyKeys: state.showOnlyKeys,
      }),
    }
  )
);

// Selectors
export const useDiagramNodes = () => useDiagramStore((s) => s.nodes);
export const useDiagramEdges = () => useDiagramStore((s) => s.edges);
export const useDiagramLoading = () => useDiagramStore((s) => s.isLoading);
export const useDiagramError = () => useDiagramStore((s) => s.error);
export const useShowColumnTypes = () => useDiagramStore((s) => s.showColumnTypes);
export const useShowOnlyKeys = () => useDiagramStore((s) => s.showOnlyKeys);
