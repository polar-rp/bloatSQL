import { Group, Button, Badge, Tooltip } from '@mantine/core';
import { IconEdit, IconPlus, IconCheck, IconX } from '@tabler/icons-react';

interface StructureToolbarProps {
  isEditing: boolean;
  pendingCount: number;
  isApplying: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onAddColumn: () => void;
  onApplyChanges: () => void;
  onCancelChanges: () => void;
}

export function StructureToolbar({
  isEditing,
  pendingCount,
  isApplying,
  onStartEdit,
  onStopEdit,
  onAddColumn,
  onApplyChanges,
  onCancelChanges,
}: StructureToolbarProps) {
  if (!isEditing) {
    return (
      <Group>
        <Button
          variant="light"
          leftSection={<IconEdit size={16} />}
          onClick={onStartEdit}
        >
          Edit structure
        </Button>
      </Group>
    );
  }

  return (
    <Group>
      <Button
        variant="light"
        leftSection={<IconPlus size={16} />}
        onClick={onAddColumn}
      >
        Add column
      </Button>

      <Tooltip label="Apply all pending changes" disabled={pendingCount === 0}>
        <Button
          variant="filled"
          color="green"
          leftSection={<IconCheck size={16} />}
          onClick={onApplyChanges}
          disabled={pendingCount === 0}
          loading={isApplying}
          rightSection={
            pendingCount > 0 ? (
              <Badge size="sm" color="white" variant="filled" circle>
                {pendingCount}
              </Badge>
            ) : undefined
          }
        >
          Apply changes
        </Button>
      </Tooltip>

      <Button
        variant="subtle"
        color="gray"
        leftSection={<IconX size={16} />}
        onClick={pendingCount > 0 ? onCancelChanges : onStopEdit}
      >
        {pendingCount > 0 ? 'Cancel changes' : 'Stop editing'}
      </Button>
    </Group>
  );
}
