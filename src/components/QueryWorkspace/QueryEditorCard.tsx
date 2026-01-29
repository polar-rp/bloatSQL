import { Group, Kbd, Stack } from '@mantine/core';
import { MonacoSqlEditor } from './MonacoSqlEditor';
import { SplitButton, SplitButtonMenuItem } from '../common';

interface QueryEditorCardProps {
  query: string;
  onQueryChange: (query: string) => void;
  onExecute: () => void;
  isExecuting: boolean;
  isConnected: boolean;
  editorHeight: number | string;
}

export function QueryEditorCard({
  query,
  onQueryChange,
  onExecute,
  isExecuting,
  isConnected,
  editorHeight,
}: QueryEditorCardProps) {
  const menuItems: SplitButtonMenuItem[] = [
    {
      label: 'Run All',
      onClick: () => {
        // TODO: Implement run all functionality
        console.log('Run all queries');
      },
    },
    {
      label: 'Run Selection',
      onClick: () => {
        // TODO: Implement run selection functionality
        console.log('Run selected query');
      },
    },
  ];

  return (
    <Stack gap={0} style={{ height: editorHeight }}>
      <MonacoSqlEditor
        value={query}
        onChange={onQueryChange}
        onExecute={onExecute}
      />

      <Group justify="flex-end" px={'md'} py={4}>
        <SplitButton
          label="Run Current"
          onClick={onExecute}
          menuItems={menuItems}
          size="xs"
          variant="default"
          rightSection={
            <Group gap={4}>
              <Kbd size={'xs'}>Ctrl</Kbd> <Kbd size={'xs'}>Enter</Kbd>
            </Group>
          }
          disabled={!isConnected || !query.trim()}
          loading={isExecuting}
        />
      </Group>
    </Stack>
  );
}
