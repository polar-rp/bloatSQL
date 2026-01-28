import { memo } from 'react';
import { AppShell, Stack, Center, Text, ThemeIcon } from '@mantine/core';
import { IconEditCircle } from '@tabler/icons-react';
import { useIsEditingCell } from '../../../stores/editCellStore';
import { CellEditForm } from '../../CellEditor';

export interface HistoryItem {
  query: string;
  timestamp: Date;
  executionTime: number;
}

function EmptyState() {
  return (
<AppShell.Section grow>
      <Center h="100%">
        <Stack gap="xs" align="center">
          <ThemeIcon variant="light" size={50} color="gray">
            <IconEditCircle size={30} stroke={1.5} />
          </ThemeIcon>
          <Stack gap={4} align="center">
            <Text fw={500} size="md" c="bright">
              No active field
            </Text>
            <Text c="dimmed" size="sm" ta="center">
              Click on a table cell to start editing.
            </Text>
          </Stack>
        </Stack>
      </Center>
    </AppShell.Section>
  );
}

function AsideComponent() {
  const isEditing = useIsEditingCell();

  return isEditing ? <CellEditForm /> : <EmptyState />;
}

export const Aside = memo(AsideComponent);
