import { Modal } from '@mantine/core';
import { ExportForm } from './ExportForm';

interface ExportModalProps {
  opened: boolean;
  onClose: () => void;
  databaseName: string;
  rowData?: Record<string, unknown> | Record<string, unknown>[];
}

export function ExportModal({ opened, onClose, databaseName, rowData }: ExportModalProps) {
  const isRowExport = !!rowData;
  const rowCount = Array.isArray(rowData) ? rowData.length : rowData ? 1 : 0;
  const title = !isRowExport
    ? 'Export Database'
    : rowCount === 1
    ? 'Export Row'
    : `Export ${rowCount} Rows`;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
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
