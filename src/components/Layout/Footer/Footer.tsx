import { memo } from "react";
import { SegmentedControl, Center, Box, Group, ActionIcon, Tooltip, Button, Stack } from "@mantine/core";
import { IconTable, IconList, IconCode, IconPlus } from "@tabler/icons-react";
import styles from "./Footer.module.css";
import { useFooterCollapsed } from "../../../stores/layoutStore";
import {
  useViewMode,
  useSetViewMode,
  useSelectedTable,
  useQueryEditorVisible,
  useToggleQueryEditor,
} from "../../../stores/tableViewStore";
import { ConsoleLog } from "./ConsoleLog";

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
              onChange={(value) => setViewMode(value as 'data' | 'structure')}
              disabled={!selectedTable}
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
              ]}
            />

            <Button
              variant="default"
              leftSection={<IconPlus size={16} />}
              disabled={!selectedTable || viewMode !== 'data'}
            >
              Add row
            </Button>
          </Group>

          <Tooltip label={queryEditorVisible ? "Hide Query Editor" : "Show Query Editor"}>
            <ActionIcon
              variant={queryEditorVisible ? "filled" : "default"}
              size="lg"
              onClick={toggleQueryEditor}
              disabled={!selectedTable}
            >
              <IconCode size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>

        <ConsoleLog />
      </Stack>
    </Box>
  );
}

export const Footer = memo(FooterComponent);
