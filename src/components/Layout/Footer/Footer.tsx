import { memo } from "react";
import { SegmentedControl, Center, Box, Group, ActionIcon, Tooltip } from "@mantine/core";
import { IconTable, IconList, IconCode } from "@tabler/icons-react";
import styles from "./Footer.module.css";
import { useFooterCollapsed } from "../../../stores/layoutStore";
import {
    useViewMode,
    useSetViewMode,
    useSelectedTable,
    useQueryEditorVisible,
    useToggleQueryEditor,
} from "../../../stores/tableViewStore";

function FooterComponent() {
    // Layout state
    const collapsed = useFooterCollapsed();

    // View state - each selector subscribes only to what it needs
    const viewMode = useViewMode();
    const setViewMode = useSetViewMode();
    const selectedTable = useSelectedTable();
    const queryEditorVisible = useQueryEditorVisible();
    const toggleQueryEditor = useToggleQueryEditor();

    return (
        <Box
            className={`${styles.footer} ${collapsed ? styles.footerHidden : styles.footerVisible}`}
        >
            <Group gap="md">
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
                {viewMode === 'data' && selectedTable && (
                    <Tooltip label={queryEditorVisible ? "Hide Query Editor" : "Show Query Editor"}>
                        <ActionIcon
                            variant={queryEditorVisible ? "filled" : "default"}
                            size="lg"
                            onClick={toggleQueryEditor}
                        >
                            <IconCode size={18} />
                        </ActionIcon>
                    </Tooltip>
                )}
            </Group>
        </Box>
    );
}

export const Footer = memo(FooterComponent);
