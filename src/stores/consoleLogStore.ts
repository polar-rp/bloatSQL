import { create } from 'zustand';

export interface ConsoleLogEntry {
  id: string;
  timestamp: string;
  action: string;
}

interface ConsoleLogState {
  logs: ConsoleLogEntry[];
}

interface ConsoleLogActions {
  addLog: (action: string) => void;
  clearLogs: () => void;
}

type ConsoleLogStore = ConsoleLogState & ConsoleLogActions;

const formatTimestamp = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(4, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
};

export const useConsoleLogStore = create<ConsoleLogStore>((set) => ({
  logs: [],

  addLog: (action) => {
    const newLog: ConsoleLogEntry = {
      id: crypto.randomUUID(),
      timestamp: formatTimestamp(),
      action,
    };
    set((state) => ({
      logs: [...state.logs, newLog]
    }));
  },

  clearLogs: () => {
    set({ logs: [] });
  },
}));

export const useConsoleLogs = () => useConsoleLogStore((s) => s.logs);
export const useAddLog = () => useConsoleLogStore((s) => s.addLog);
export const useClearLogs = () => useConsoleLogStore((s) => s.clearLogs);
