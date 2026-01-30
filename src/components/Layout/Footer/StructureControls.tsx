import { memo, useCallback } from "react";
import { Button } from "@mantine/core";
import { IconEdit, IconPlus } from "@tabler/icons-react";
import {
  useStructureEditStore,
  useIsEditingStructure,
} from "../../../stores/structureEditStore";
import { useSelectedTable } from "../../../stores/tableViewStore";
import { useTableStructure } from "../../TableStructure/hooks/useTableStructure";

function StructureControlsComponent() {
  const selectedTable = useSelectedTable();
  const { columns } = useTableStructure(selectedTable);

  const isEditing = useIsEditingStructure();

  const {
    startEditing,
    startAddingColumnInAside,
  } = useStructureEditStore();

  const handleStartEdit = useCallback(() => {
    if (selectedTable) {
      startEditing(selectedTable, columns);
    }
  }, [selectedTable, columns, startEditing]);

  const handleAddColumn = useCallback(() => {
    startAddingColumnInAside();
  }, [startAddingColumnInAside]);

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
    <Button
      variant="light"
      leftSection={<IconPlus size={16} />}
      onClick={handleAddColumn}
    >
      Add column
    </Button>
  );
}

export const StructureControls = memo(StructureControlsComponent);
