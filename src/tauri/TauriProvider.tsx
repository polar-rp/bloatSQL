import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getCurrentWindow, Window } from '@tauri-apps/api/window';
import { type as osType, OsType } from '@tauri-apps/plugin-os';

interface TauriContextValue {
  osType: OsType | null;
  isFullScreen: boolean;
  isMaximized: boolean;
  scaleFactor: number;
  appWindow: Window;
  refreshWindowState: () => void;
}

const TauriContext = createContext<TauriContextValue | null>(null);

interface TauriProviderProps {
  children: ReactNode;
}

export function TauriProvider({ children }: TauriProviderProps) {
  const [os, setOs] = useState<OsType | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(1);
  const [appWindow] = useState(() => getCurrentWindow());

  useEffect(() => {
    // Get OS type (synchronous in Tauri v2)
    setOs(osType());

    // Setup window state listeners
    const setupListeners = async () => {
      try {
        // Get initial state
        setIsFullScreen(await appWindow.isFullscreen());
        setIsMaximized(await appWindow.isMaximized());
        setScaleFactor(await appWindow.scaleFactor());

        // Listen for changes using tauri:// events (more reliable than onResized/onMoved)
        const handleWindowStateChange = async () => {
          setIsFullScreen(await appWindow.isFullscreen());
          setIsMaximized(await appWindow.isMaximized());
        };

        const unlistenResize = await appWindow.listen('tauri://resize', handleWindowStateChange);
        const unlistenMove = await appWindow.listen('tauri://move', handleWindowStateChange);

        const unlistenScale = await appWindow.onScaleChanged(({ payload }) => {
          setScaleFactor(payload.scaleFactor);
        });

        return () => {
          unlistenResize();
          unlistenMove();
          unlistenScale();
        };
      } catch (error) {
        console.error('Failed to setup window listeners:', error);
      }
    };

    const cleanup = setupListeners();
    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, [appWindow]);

  const refreshWindowState = async () => {
    setIsFullScreen(await appWindow.isFullscreen());
    setIsMaximized(await appWindow.isMaximized());
  };

  const value: TauriContextValue = {
    osType: os,
    isFullScreen,
    isMaximized,
    scaleFactor,
    appWindow,
    refreshWindowState,
  };

  return (
    <TauriContext.Provider value={value}>
      {children}
    </TauriContext.Provider>
  );
}

export function useTauriContext() {
  const context = useContext(TauriContext);
  if (!context) {
    throw new Error('useTauriContext must be used within a TauriProvider');
  }
  return context;
}

// Export window control helpers
export function useWindowControls() {
  const { appWindow, refreshWindowState } = useTauriContext();

  return {
    minimize: () => appWindow.minimize(),
    toggleMaximize: async () => {
      await appWindow.toggleMaximize();
      // Small delay to let the window state update
      setTimeout(refreshWindowState, 50);
    },
    close: () => appWindow.close(),
    setFullscreen: (fullscreen: boolean) => appWindow.setFullscreen(fullscreen),
  };
}
