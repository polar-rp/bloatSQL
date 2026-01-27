import { createContext, useContext, useEffect, useState, useMemo, useCallback, ReactNode } from 'react';
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
    setOs(osType());

    const setupListeners = async () => {
      try {
        setIsFullScreen(await appWindow.isFullscreen());
        setIsMaximized(await appWindow.isMaximized());
        setScaleFactor(await appWindow.scaleFactor());

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

  const refreshWindowState = useCallback(async () => {
    setIsFullScreen(await appWindow.isFullscreen());
    setIsMaximized(await appWindow.isMaximized());
  }, [appWindow]);

  const value = useMemo<TauriContextValue>(() => ({
    osType: os,
    isFullScreen,
    isMaximized,
    scaleFactor,
    appWindow,
    refreshWindowState,
  }), [os, isFullScreen, isMaximized, scaleFactor, appWindow, refreshWindowState]);

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

export function useWindowControls() {
  const { appWindow, refreshWindowState } = useTauriContext();

  const minimize = useCallback(() => appWindow.minimize(), [appWindow]);

  const toggleMaximize = useCallback(async () => {
    await appWindow.toggleMaximize();
    // Timeout is intentionally not cleaned up as it's a one-time UI update
    setTimeout(refreshWindowState, 50);
  }, [appWindow, refreshWindowState]);

  const close = useCallback(() => appWindow.close(), [appWindow]);

  const setFullscreen = useCallback(
    (fullscreen: boolean) => appWindow.setFullscreen(fullscreen),
    [appWindow]
  );

  return useMemo(() => ({
    minimize,
    toggleMaximize,
    close,
    setFullscreen,
  }), [minimize, toggleMaximize, close, setFullscreen]);
}
