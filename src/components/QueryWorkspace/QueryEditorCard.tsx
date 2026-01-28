import {
  Card,
  Group,
  Text,
  Badge,
  Button,
  ActionIcon,
  Kbd,
  Box,
} from '@mantine/core';
import {
  IconChevronDown,
  IconChevronUp,
  IconFileCode,
  IconPlayerPlay,
} from '@tabler/icons-react';
import { MonacoSqlEditor } from './MonacoSqlEditor';

interface QueryEditorCardProps {
  query: string;
  onQueryChange: (query: string) => void;
  onExecute: () => void;
  isExecuting: boolean;
  isConnected: boolean;
  lastExecutionTime: number | null;
  editorHeight: number | string;
  onToggleHeight: () => void;
}

export function QueryEditorCard({
  query,
  onQueryChange,
  onExecute,
  isExecuting,
  isConnected,
  lastExecutionTime,
  editorHeight,
  onToggleHeight,
}: QueryEditorCardProps) {
  return (
    <Card
      withBorder
      style={{
        height: editorHeight,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          <IconFileCode size={16} />
          <Text size="sm" fw={500}>
            Query Editor
          </Text>
          {isConnected && (
            <Badge color="green" size="xs">
              Connected
            </Badge>
          )}
        </Group>
        <Group gap="xs">
          <Text size="xs" c="dimmed">
            <Kbd size="xs">Ctrl</Kbd> + <Kbd size="xs">Enter</Kbd> to run
          </Text>
          <Text size="xs" c="dimmed">
            |
          </Text>
          <Text size="xs" c="dimmed">
            <Kbd size="xs">Shift</Kbd> + <Kbd size="xs">Alt</Kbd> + <Kbd size="xs">F</Kbd> to format
          </Text>
          <ActionIcon variant="subtle" size="sm" onClick={onToggleHeight}>
            {editorHeight === '45vh' || editorHeight === 250 ? (
              <IconChevronUp size={16} />
            ) : (
              <IconChevronDown size={16} />
            )}
          </ActionIcon>
        </Group>
      </Group>

      <Box h={'100%'}>
        <MonacoSqlEditor
          value={query}
          onChange={onQueryChange}
          onExecute={onExecute}
        />
      </Box>

      <Group justify="space-between" mt="xs">
        <Button
          leftSection={<IconPlayerPlay size={16} />}
          onClick={onExecute}
          loading={isExecuting}
          disabled={!isConnected || !query.trim()}
        >
          Execute
        </Button>
        {lastExecutionTime !== null && (
          <Text size="sm" c="dimmed">
            Execution time: {lastExecutionTime}ms
          </Text>
        )}
      </Group>
    </Card>
  );
}
