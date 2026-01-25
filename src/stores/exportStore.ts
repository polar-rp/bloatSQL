import { create } from 'zustand';
import { tauriCommands } from '../tauri/commands';
import { ExportOptions } from '../types/database';

interface ExportState {
  isExporting: boolean;
  error: string | null;
  successMessage: string | null;
}

interface ExportActions {
  exportDatabase: (options: ExportOptions) => Promise<void>;
  clearError: () => void;
  clearSuccess: () => void;
}

type ExportStore = ExportState & ExportActions;

let successTimeoutId: ReturnType<typeof setTimeout> | null = null;

export const useExportStore = create<ExportStore>((set) => ({
  isExporting: false,
  error: null,
  successMessage: null,

  exportDatabase: async (options: ExportOptions) => {
    set({ isExporting: true, error: null, successMessage: null });
    try {
      await tauriCommands.exportDatabase(options);
      set({
        isExporting: false,
        successMessage: `Database exported successfully to ${options.outputPath}/${options.fileName}`,
      });

      if (successTimeoutId) {
        clearTimeout(successTimeoutId);
      }

      successTimeoutId = setTimeout(() => {
        set({ successMessage: null });
        successTimeoutId = null;
      }, 5000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Export failed';
      set({
        error: errorMsg,
        isExporting: false,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  clearSuccess: () => {
    if (successTimeoutId) {
      clearTimeout(successTimeoutId);
      successTimeoutId = null;
    }
    set({ successMessage: null });
  },
}));

export const useIsExporting = () => useExportStore((s) => s.isExporting);
export const useExportError = () => useExportStore((s) => s.error);
export const useExportSuccessMessage = () => useExportStore((s) => s.successMessage);
export const useExportDatabase = () => useExportStore((s) => s.exportDatabase);
export const useClearExportError = () => useExportStore((s) => s.clearError);
export const useClearExportSuccess = () => useExportStore((s) => s.clearSuccess);
