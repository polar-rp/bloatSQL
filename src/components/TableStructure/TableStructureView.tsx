import { Box, Text, Loader, Center, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useState, useCallback } from 'react';
import { useSelectedTable } from '../../stores/tableViewStore';
import {
  useStructureEditStore,
  useIsEditingStructure,
  usePendingOperations,
  useEditingColumnDraft,
  useDraftColumnPreview,
} from '../../stores/structureEditStore';
import { DisplayColumn } from '../../types/tableStructure';
import { useTableStructure } from './hooks/useTableStructure';
import { StructureTable } from './components/StructureTable';
import { DropColumnConfirmModal } from './components/DropColumnConfirmModal';

export function TableStructureView() {
  const selectedTable = useSelectedTable();

  const { columns, isLoading, error, clearError } = useTableStructure(selectedTable);

  const isEditing = useIsEditingStructure();
  const pendingOperations = usePendingOperations();
  const editingColumn = useEditingColumnDraft();
  const draftColumnPreview = useDraftColumnPreview();

  const {
    dropColumn,
    startEditingColumnInAside,
  } = useStructureEditStore();

  const [droppingColumn, setDroppingColumn] = useState<string | null>(null);

  const handleColumnClick = useCallback(
    (column: DisplayColumn) => {
      if (isEditing) {
        startEditingColumnInAside(column);
      }
    },
    [isEditing, startEditingColumnInAside]
  );

  const handleDropColumnRequest = useCallback((columnName: string) => {
    setDroppingColumn(columnName);
  }, []);

  const handleConfirmDrop = useCallback(() => {
    if (droppingColumn) {
      dropColumn(droppingColumn);
      setDroppingColumn(null);
    }
  }, [droppingColumn, dropColumn]);

  if (!selectedTable) {
    return (
      <Box>
        <Center h={200}>
          <Text c="dimmed" ta="center">
            Select a table to view its structure
          </Text>
        </Center>
      </Box>
    );
  }

  return (
    <Box h="100%">
      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Error"
          color="red"
          withCloseButton
          onClose={clearError}
          mb="md"
        >
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Center h={200}>
          <Loader />
        </Center>
      ) : columns.length === 0 ? (
        <Center h={200}>
          <Text c="dimmed">No columns found</Text>
        </Center>
      ) : (
        <StructureTable
          columns={columns}
          isEditing={isEditing}
          pendingOperations={pendingOperations}
          editingColumnName={editingColumn?.name ?? null}
          draftColumnPreview={draftColumnPreview}
          onColumnClick={handleColumnClick}
          onDropColumn={handleDropColumnRequest}
        />
      )}

      <DropColumnConfirmModal
        opened={droppingColumn !== null}
        onClose={() => setDroppingColumn(null)}
        columnName={droppingColumn}
        onConfirm={handleConfirmDrop}
      />
    </Box>
  );
}
