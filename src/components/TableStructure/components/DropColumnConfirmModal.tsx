import { Modal, Text, Button, Group, Alert, Stack } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

interface DropColumnConfirmModalProps {
  opened: boolean;
  onClose: () => void;
  columnName: string | null;
  onConfirm: () => void;
}

export function DropColumnConfirmModal({
  opened,
  onClose,
  columnName,
  onConfirm,
}: DropColumnConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Confirm column deletion"
      size="sm"
    >
      <Stack gap="md">
        <Alert
          icon={<IconAlertTriangle size={16} />}
          color="red"
          variant="light"
        >
          This operation is irreversible!
        </Alert>

        <Text>
          Are you sure you want to delete column <strong>{columnName}</strong>?
        </Text>

        <Text size="sm" c="dimmed">
          All data stored in this column will be permanently lost.
          Make sure you have a backup if the data is important.
        </Text>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button color="red" onClick={handleConfirm}>
            Delete column
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
