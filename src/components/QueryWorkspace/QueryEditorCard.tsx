import {
  Card,
  Group,
  Text,
  Badge,
  Button,
  ActionIcon,
  Kbd,
  Textarea,
} from '@mantine/core';
import {
  IconChevronDown,
  IconChevronUp,
  IconFileCode,
  IconPlayerPlay,
} from '@tabler/icons-react';

interface QueryEditorCardProps {
  query: string;
  onQueryChange: (query: string) => void;
  onExecute: () => void;
  isExecuting: boolean;
  isConnected: boolean;
  lastExecutionTime: number | null;
  editorHeight: number;
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
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      onExecute();
    }
  };

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
            <Kbd size="xs">Ctrl</Kbd> + <Kbd size="xs">Enter</Kbd>
          </Text>
          <ActionIcon variant="subtle" size="sm" onClick={onToggleHeight}>
            {editorHeight === 250 ? (
              <IconChevronUp size={16} />
            ) : (
              <IconChevronDown size={16} />
            )}
          </ActionIcon>
        </Group>
      </Group>

      <Textarea
        value={query}
        onChange={(e) => onQueryChange(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter your SQL query here..."
        autosize={false}
        styles={{
          root: { flex: 1, display: 'flex', flexDirection: 'column' },
          wrapper: { flex: 1 },
          input: {
            flex: 1,
            fontFamily: 'monospace',
            fontSize: 13,
            resize: 'none',
            height: '100%',
          },
        }}
      />

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
