import { ReactNode } from 'react';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { TauriProvider } from './tauri/TauriProvider';
import { ErrorBoundary } from './components/modals';
import { useSettingsStore } from './stores/settingsStore';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const { primaryColor, colorScheme, defaultRadius } = useSettingsStore();

  const theme = createTheme({
    primaryColor,
    defaultRadius,
    components: {
      Tooltip: {
        defaultProps: {
          bg: 'var(--mantine-color-default)',
          arrowSize: 8, 
        },
        styles: {
          tooltip: {
            border: '1px solid var(--mantine-color-default-border)',
            color: 'var(--mantine-color-text)',
          },
          arrow: {
            border: '1px solid var(--mantine-color-default-border)',
          },
        },
      },
    },
  });

  return (
    <TauriProvider>
      <MantineProvider theme={theme} defaultColorScheme={colorScheme} forceColorScheme={colorScheme === 'auto' ? undefined : colorScheme}>
        <Notifications position="top-right" />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </MantineProvider>
    </TauriProvider>
  );
}
