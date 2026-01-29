import { Box, Text, Loader, Center, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useState, useCallback } from 'react';
import { useSelectedTable } from '../../stores/tableViewStore';
import {
  useStructureEditStore,
  useIsEditingStructure,
  usePendingOperations,
} from '../../stores/structureEditStore';
import { DisplayColumn, ColumnDefinition } from '../../types/tableStructure';
import { useTableStructure } from './hooks/useTableStructure';
import { StructureTable } from './components/StructureTable';
import { ColumnEditModal } from './components/ColumnEditModal';
import { DropColumnConfirmModal } from './components/DropColumnConfirmModal';

export function TableStructureView() {
  const selectedTable = useSelectedTable();

  const { columns, isLoading, error, clearError } = useTableStructure(selectedTable);

  // Store state
  const isEditing = useIsEditingStructure();
  const pendingOperations = usePendingOperations();

  const {
    modifyColumn,
    dropColumn,
  } = useStructureEditStore();

  // Local state for modals
  const [editingColumn, setEditingColumn] = useState<DisplayColumn | null>(null);
  const [droppingColumn, setDroppingColumn] = useState<string | null>(null);

  // Handlers
  const handleColumnClick = useCallback(
    (column: DisplayColumn) => {
      if (isEditing) {
        setEditingColumn(column);
      }
    },
    [isEditing]
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

  const handleSaveColumn = useCallback(
    (definition: ColumnDefinition, originalName?: string) => {
      if (originalName) {
        // Editing existing column
        modifyColumn(originalName, definition);
      }
      setEditingColumn(null);
    },
    [modifyColumn]
  );

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
          onColumnClick={handleColumnClick}
          onDropColumn={handleDropColumnRequest}
        />
      )}

      {/* Edit Column Modal */}
      <ColumnEditModal
        opened={editingColumn !== null}
        onClose={() => setEditingColumn(null)}
        mode="edit"
        column={editingColumn}
        onSave={handleSaveColumn}
      />

      {/* Drop Column Confirm Modal */}
      <DropColumnConfirmModal
        opened={droppingColumn !== null}
        onClose={() => setDroppingColumn(null)}
        columnName={droppingColumn}
        onConfirm={handleConfirmDrop}
      />
    </Box>
  );
}
