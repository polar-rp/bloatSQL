import { Modal } from '@mantine/core';
import { ExportForm } from './ExportForm';

interface ExportModalProps {
  opened: boolean;
  onClose: () => void;
  databaseName: string;
  rowData?: Record<string, unknown>;
}

export function ExportModal({ opened, onClose, databaseName, rowData }: ExportModalProps) {
  const isRowExport = !!rowData;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isRowExport ? "Export Row" : "Export Database"}
      size="xl"
      centered
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <ExportForm databaseName={databaseName} onSuccess={onClose} rowData={rowData} />
    </Modal>
  );
}
