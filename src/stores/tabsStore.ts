import { create } from 'zustand';

export interface QueryTab {
  id: string;
  title: string;
  query: string;
}

interface TabsState {
  tabs: QueryTab[];
  activeTab: string;
}

interface TabsActions {
  setActiveTab: (tabId: string) => void;
  addTab: () => void;
  addTableTab: (tableName: string) => void;
  closeTab: (tabId: string) => void;
  updateTabQuery: (tabId: string, query: string) => void;
  setTabs: (tabs: QueryTab[]) => void;
}

type TabsStore = TabsState & TabsActions;

const createTabId = () => `${Date.now()}`;

export const useTabsStore = create<TabsStore>((set, get) => ({
  tabs: [{ id: '1', title: 'Query 1', query: '' }],
  activeTab: '1',

  setActiveTab: (tabId) => {
    set({ activeTab: tabId });
  },

  addTab: () => {
    const { tabs } = get();
    const newId = createTabId();
    const newTab: QueryTab = {
      id: newId,
      title: `Query ${tabs.length + 1}`,
      query: '',
    };
    set({
      tabs: [...tabs, newTab],
      activeTab: newId,
    });
  },

  addTableTab: (tableName) => {
    const { tabs } = get();
    const newId = createTabId();
    const query = `SELECT * FROM \`${tableName}\``;
    const newTab: QueryTab = {
      id: newId,
      title: tableName,
      query,
    };
    set({
      tabs: [...tabs, newTab],
      activeTab: newId,
    });
  },

  closeTab: (tabId) => {
    const { tabs, activeTab } = get();
    const newTabs = tabs.filter((t) => t.id !== tabId);

    if (newTabs.length === 0) {
      const newId = createTabId();
      set({
        tabs: [{ id: newId, title: 'Query 1', query: '' }],
        activeTab: newId,
      });
      return;
    }

    const newState: Partial<TabsStore> = { tabs: newTabs };
    if (activeTab === tabId) {
      newState.activeTab = newTabs[newTabs.length - 1].id;
    }
    set(newState);
  },

  updateTabQuery: (tabId, query) => {
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, query } : t)),
    }));
  },

  setTabs: (tabs) => {
    set({ tabs });
  },
}));

// Granular selectors for performance
export const useTabs = () => useTabsStore((s) => s.tabs);
export const useActiveTab = () => useTabsStore((s) => s.activeTab);
export const useSetActiveTab = () => useTabsStore((s) => s.setActiveTab);
export const useAddTab = () => useTabsStore((s) => s.addTab);
export const useAddTableTab = () => useTabsStore((s) => s.addTableTab);
export const useCloseTab = () => useTabsStore((s) => s.closeTab);
export const useUpdateTabQuery = () => useTabsStore((s) => s.updateTabQuery);
export const useSetTabs = () => useTabsStore((s) => s.setTabs);

// Derived selector - gets current tab's query
export const useCurrentTabQuery = () =>
  useTabsStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTab);
    return tab?.query ?? '';
  });
