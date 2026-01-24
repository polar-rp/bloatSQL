import { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { TauriProvider } from './tauri/TauriProvider';
import { ErrorBoundary } from './components/ErrorBoundary';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <TauriProvider>
      <MantineProvider>
        <Notifications position="top-right" />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </MantineProvider>
    </TauriProvider>
  );
}
