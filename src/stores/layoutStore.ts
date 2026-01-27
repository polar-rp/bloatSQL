import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LayoutState {
  navbarCollapsed: boolean;
  asideCollapsed: boolean;
  footerCollapsed: boolean;
}

interface LayoutActions {
  toggleNavbar: () => void;
  toggleAside: () => void;
  toggleFooter: () => void;
  setNavbarCollapsed: (collapsed: boolean) => void;
  setAsideCollapsed: (collapsed: boolean) => void;
  setFooterCollapsed: (collapsed: boolean) => void;
}

type LayoutStore = LayoutState & LayoutActions;

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set) => ({
      navbarCollapsed: false,
      asideCollapsed: false,
      footerCollapsed: false,

      toggleNavbar: () => set((s) => ({ navbarCollapsed: !s.navbarCollapsed })),
      toggleAside: () => set((s) => ({ asideCollapsed: !s.asideCollapsed })),
      toggleFooter: () => set((s) => ({ footerCollapsed: !s.footerCollapsed })),
      setNavbarCollapsed: (collapsed) => set({ navbarCollapsed: collapsed }),
      setAsideCollapsed: (collapsed) => set({ asideCollapsed: collapsed }),
      setFooterCollapsed: (collapsed) => set({ footerCollapsed: collapsed }),
    }),
    {
      name: 'bloat-sql-layout',
    }
  )
);

// Atomic selectors - each component only re-renders when its specific value changes
export const useNavbarCollapsed = () => useLayoutStore((s) => s.navbarCollapsed);
export const useAsideCollapsed = () => useLayoutStore((s) => s.asideCollapsed);
export const useFooterCollapsed = () => useLayoutStore((s) => s.footerCollapsed);
export const useToggleNavbar = () => useLayoutStore((s) => s.toggleNavbar);
export const useToggleAside = () => useLayoutStore((s) => s.toggleAside);
export const useToggleFooter = () => useLayoutStore((s) => s.toggleFooter);
export const useSetAsideCollapsed = () => useLayoutStore((s) => s.setAsideCollapsed);
