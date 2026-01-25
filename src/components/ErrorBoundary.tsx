import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';
import { ReactNode } from 'react';
import { Button, Center, Stack, Text, Title, Code, Paper } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const err = error as Error;
  return (
    <Center h="100vh" p="xl">
      <Paper p="xl" radius="md" withBorder shadow="md" maw={600}>
        <Stack align="center" gap="lg">
          <IconAlertTriangle size={64} color="var(--mantine-color-red-6)" />
          <Title order={2}>Something went wrong</Title>
          <Text c="dimmed" ta="center">
            An unexpected error occurred. Please try refreshing the page.
          </Text>
          <Code block style={{ maxHeight: 200, overflow: 'auto', width: '100%' }}>
            {err.message}
            {err.stack && `\n\n${err.stack}`}
          </Code>
          <Button onClick={resetErrorBoundary} size="md">
            Refresh Application
          </Button>
        </Stack>
      </Paper>
    </Center>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        window.location.reload();
      }}
      onError={(error, errorInfo) => {
        console.error('Error caught by boundary:', error, errorInfo);
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}
