import { memo, useCallback } from "react";
import { SegmentedControl, Center, Box, Group, ActionIcon, Tooltip, Button, Stack, Badge } from "@mantine/core";
import { IconTable, IconList, IconSql, IconPlus, IconSchema, IconEdit, IconCheck, IconX } from "@tabler/icons-react";
import styles from "./Footer.module.css";
import { useFooterCollapsed, useLayoutStore } from "../../../stores/layoutStore";
import {
  useViewMode,
  useSetViewMode,
  useSelectedTable,
  useQueryEditorVisible,
  useToggleQueryEditor,
} from "../../../stores/tableViewStore";
import {
  useIsEditingStructure,
  usePendingOperations,
  useStructureEditStore,
} from "../../../stores/structureEditStore";
import { ConsoleLog } from "./ConsoleLog";
import { StructureControls } from "./StructureControls";
import { PendingChangesPreview } from "../../TableStructure/components/PendingChangesPreview";
import { tauriCommands } from "../../../tauri/commands";
import { useEditCellStore } from "../../../stores/editCellStore";
import { useActiveConnection } from "../../../stores/connectionStore";
import { DatabaseType } from "../../../types/database";

function FooterComponent() {
  const collapsed = useFooterCollapsed();

  const viewMode = useViewMode();
  const setViewMode = useSetViewMode();
  const selectedTable = useSelectedTable();
  const queryEditorVisible = useQueryEditorVisible();
  const toggleQueryEditor = useToggleQueryEditor();

  // Structure editing state
  const isEditingStructure = useIsEditingStructure();
  const pendingOperations = usePendingOperations();
  const activeConnection = useActiveConnection();
  const dbType = activeConnection?.dbType ?? DatabaseType.MariaDB;

  const { removeOperationByIndex, clearAllPending } = useStructureEditStore();

  const handleUndoOperation = useCallback(
    (index: number) => {
      removeOperationByIndex(index);
    },
    [removeOperationByIndex]
  );

  const handleClearAll = useCallback(() => {
    clearAllPending();
  }, [clearAllPending]);

  // Show PendingChangesPreview when in structure mode, editing, and has pending operations
  const showPendingPreview = viewMode === 'structure' && isEditingStructure && pendingOperations.length > 0;

  return (
    <Box
      className={`${styles.footer} ${collapsed ? styles.footerHidden : styles.footerVisible}`}
    >
      <Stack gap={0} w="100%">
        <Group justify="space-between" w="100%" px="md" className={styles.controls}>
          <Group gap="xs">
            <SegmentedControl
              value={viewMode}
              onChange={(value) => setViewMode(value as 'data' | 'structure' | 'diagram')}
              disabled={!selectedTable && viewMode !== 'diagram'}
              data={[
                {
                  value: 'data',
                  label: (
                    <Center className={styles.segmentLabel}>
                      <IconTable size={16} stroke={1.5} />
                      <span>Data</span>
                    </Center>
                  ),
                },
                {
                  value: 'structure',
                  label: (
                    <Center className={styles.segmentLabel}>
                      <IconList size={16} stroke={1.5} />
                      <span>Structure</span>
                    </Center>
                  ),
                },
                {
                  value: 'diagram',
                  label: (
                    <Center className={styles.segmentLabel}>
                      <IconSchema size={16} stroke={1.5} />
                      <span>Diagram</span>
                    </Center>
                  ),
                },
              ]}
            />

            {/* Data mode controls */}
            {viewMode === 'data' && (
              <Button
                variant="default"
                leftSection={<IconPlus size={16} />}
                disabled={!selectedTable}
                onClick={async () => {
                  if (!selectedTable) return;
                  try {
                    const columns = await tauriCommands.getTableColumns(selectedTable);
                    useEditCellStore.getState().startAddRow(selectedTable, columns);
                    useLayoutStore.getState().setAsideCollapsed(false);
                  } catch {
                    // Column fetch failed - button stays enabled for retry
                  }
                }}
              >
                Add row
              </Button>
            )}

            {/* Structure mode controls */}
            {viewMode === 'structure' && selectedTable && (
              <StructureControls />
            )}
          </Group>

          {/* Right side controls */}
          {viewMode === 'data' && (
            <Tooltip withArrow label={queryEditorVisible ? "Hide Query Editor" : "Show Query Editor"}>
              <ActionIcon
                variant={queryEditorVisible ? "filled" : "default"}
                size="lg"
                onClick={toggleQueryEditor}
                disabled={!selectedTable}
              >
                <IconSql stroke={1.5} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>

        {/* Bottom section: ConsoleLog or PendingChangesPreview */}
        {showPendingPreview ? (
          <Box
            w="100%"
            style={{
              borderTop: '1px solid var(--mantine-color-default-border)',
              overflow: 'auto'
            }}
            bg="var(--mantine-color-default)"
            h={239}
            p="md"
          >
            <PendingChangesPreview
              tableName={selectedTable!}
              operations={pendingOperations}
              dbType={dbType}
              onUndoOperation={handleUndoOperation}
              onClearAll={handleClearAll}
            />
          </Box>
        ) : (
          <ConsoleLog />
        )}
      </Stack>
    </Box>
  );
}

export const Footer = memo(FooterComponent);
