import { memo, useCallback, useState } from "react";
import { Button, Badge, Tooltip } from "@mantine/core";
import { IconEdit, IconPlus, IconCheck, IconX } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import {
  useStructureEditStore,
  useIsEditingStructure,
  usePendingOperations,
  useIsApplyingStructure,
  useOriginalColumns,
  useStructureTableName,
} from "../../../stores/structureEditStore";
import { useSelectedTable } from "../../../stores/tableViewStore";
import { useActiveConnection } from "../../../stores/connectionStore";
import { DatabaseType } from "../../../types/database";
import { useApplyStructureChanges } from "../../TableStructure/hooks/useApplyStructureChanges";
import { ColumnEditModal } from "../../TableStructure/components/ColumnEditModal";
import { ColumnDefinition } from "../../../types/tableStructure";
import { useTableStructure } from "../../TableStructure/hooks/useTableStructure";

function StructureControlsComponent() {
  const selectedTable = useSelectedTable();
  const activeConnection = useActiveConnection();
  const dbType = activeConnection?.dbType ?? DatabaseType.MariaDB;

  const { columns, refetch } = useTableStructure(selectedTable);

  const isEditing = useIsEditingStructure();
  const pendingOperations = usePendingOperations();
  const isApplyingStore = useIsApplyingStructure();
  const originalColumns = useOriginalColumns();
  const structureTableName = useStructureTableName();

  const {
    startEditing,
    stopEditing,
    addColumn,
    clearAllPending,
    setApplying,
    setError: setStoreError,
  } = useStructureEditStore();

  const [isAddModalOpen, setAddModalOpen] = useState(false);

  const { applyChanges, isApplying: isApplyingHook } = useApplyStructureChanges();
  const isApplying = isApplyingStore || isApplyingHook;

  const handleStartEdit = useCallback(() => {
    if (selectedTable) {
      startEditing(selectedTable, columns);
    }
  }, [selectedTable, columns, startEditing]);

  const handleStopEdit = useCallback(() => {
    stopEditing();
  }, [stopEditing]);

  const handleAddColumn = useCallback(() => {
    setAddModalOpen(true);
  }, []);

  const handleSaveColumn = useCallback(
    (definition: ColumnDefinition) => {
      addColumn(definition);
      setAddModalOpen(false);
    },
    [addColumn]
  );

  const handleApplyChanges = useCallback(async () => {
    if (!selectedTable || pendingOperations.length === 0) return;

    setApplying(true);
    setStoreError(null);

    const result = await applyChanges(selectedTable, pendingOperations, dbType);

    setApplying(false);

    if (result.success) {
      notifications.show({
        title: 'Success',
        message: `Applied ${result.executedCount} structure change${result.executedCount !== 1 ? 's' : ''}`,
        color: 'green',
      });
      clearAllPending();
      stopEditing();
      await refetch();
    } else {
      const errorMsg = result.errors.join('\n\n');
      setStoreError(errorMsg);
      notifications.show({
        title: 'Error',
        message: `Applied ${result.executedCount}/${result.totalCount} operations. Check error details.`,
        color: 'red',
      });
    }
  }, [
    selectedTable,
    pendingOperations,
    dbType,
    applyChanges,
    setApplying,
    setStoreError,
    clearAllPending,
    stopEditing,
    refetch,
  ]);

  const handleCancelChanges = useCallback(() => {
    if (pendingOperations.length > 0) {
      clearAllPending();
    } else {
      stopEditing();
    }
  }, [pendingOperations.length, clearAllPending, stopEditing]);

  if (!selectedTable) {
    return null;
  }

  if (!isEditing) {
    return (
      <Button
        variant="light"
        leftSection={<IconEdit size={16} />}
        onClick={handleStartEdit}
      >
        Edit structure
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="light"
        leftSection={<IconPlus size={16} />}
        onClick={handleAddColumn}
      >
        Add column
      </Button>

      <Tooltip label="Apply all pending changes" disabled={pendingOperations.length === 0}>
        <Button
          variant="filled"
          color="green"
          leftSection={<IconCheck size={16} />}
          onClick={handleApplyChanges}
          disabled={pendingOperations.length === 0}
          loading={isApplying}
          rightSection={
            pendingOperations.length > 0 ? (
              <Badge size="sm" color="white" variant="filled" circle>
                {pendingOperations.length}
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
        onClick={handleCancelChanges}
      >
        {pendingOperations.length > 0 ? 'Cancel changes' : 'Stop editing'}
      </Button>

      {/* Add Column Modal */}
      <ColumnEditModal
        opened={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        mode="add"
        onSave={handleSaveColumn}
      />
    </>
  );
}

export const StructureControls = memo(StructureControlsComponent);
