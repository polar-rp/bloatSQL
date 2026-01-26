import { SegmentedControl, Center, Box, Group, ActionIcon, Tooltip } from "@mantine/core";
import { IconTable, IconList, IconCode } from "@tabler/icons-react";
import styles from "./Footer.module.css";

interface FooterProps {
    collapsed: boolean;
    viewMode: 'data' | 'structure';
    onViewModeChange: (value: 'data' | 'structure') => void;
    selectedTable: string | null;
    queryEditorVisible: boolean;
    onToggleQueryEditor: () => void;
}

export function Footer({
    collapsed,
    viewMode,
    onViewModeChange,
    selectedTable,
    queryEditorVisible,
    onToggleQueryEditor,
}: FooterProps) {
    return (
        <Box
            className={`${styles.footer} ${collapsed ? styles.footerHidden : styles.footerVisible}`}
        >
            <Group gap="md">
                <SegmentedControl
                    value={viewMode}
                    onChange={(value) => onViewModeChange(value as 'data' | 'structure')}
                    disabled={!selectedTable}
                    data={[
                        {
                            value: 'data',
                            label: (
                                <Center style={{ gap: 8 }}>
                                    <IconTable size={16} stroke={1.5} />
                                    <span>Data</span>
                                </Center>
                            ),
                        },
                        {
                            value: 'structure',
                            label: (
                                <Center style={{ gap: 8 }}>
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
                            onClick={onToggleQueryEditor}
                        >
                            <IconCode size={18} />
                        </ActionIcon>
                    </Tooltip>
                )}
            </Group>
        </Box>
    );
}
