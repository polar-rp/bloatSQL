import { memo } from "react";
import { SegmentedControl, Center, Box, Group, ActionIcon, Tooltip, Button, Stack } from "@mantine/core";
import { IconTable, IconList, IconSql, IconPlus, IconSchema } from "@tabler/icons-react";
import styles from "./Footer.module.css";
import { useFooterCollapsed, useLayoutStore } from "../../../stores/layoutStore";
import {
  useViewMode,
  useSetViewMode,
  useSelectedTable,
  useQueryEditorVisible,
  useToggleQueryEditor,
} from "../../../stores/tableViewStore";
import { ConsoleLog } from "./ConsoleLog";
import { tauriCommands } from "../../../tauri/commands";
import { useEditCellStore } from "../../../stores/editCellStore";

function FooterComponent() {
  const collapsed = useFooterCollapsed();

  const viewMode = useViewMode();
  const setViewMode = useSetViewMode();
  const selectedTable = useSelectedTable();
  const queryEditorVisible = useQueryEditorVisible();
  const toggleQueryEditor = useToggleQueryEditor();

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

            {viewMode !== 'diagram' && (
              <Button
                variant="default"
                leftSection={<IconPlus size={16} />}
                disabled={!selectedTable || viewMode !== 'data'}
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
          </Group>

          {viewMode !== 'diagram' && (
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

        <ConsoleLog />
      </Stack>
    </Box>
  );
}

export const Footer = memo(FooterComponent);
