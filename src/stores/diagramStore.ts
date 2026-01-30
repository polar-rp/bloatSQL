import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Node, Edge } from '@xyflow/react';

interface DiagramState {
  nodes: Node[];
  edges: Edge[];
  showColumnTypes: boolean;
  showOnlyKeys: boolean;
  isLoading: boolean;
  error: string | null;
}

interface DiagramActions {
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
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
      showColumnTypes: true,
      showOnlyKeys: false,
      isLoading: false,
      error: null,

      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),
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
