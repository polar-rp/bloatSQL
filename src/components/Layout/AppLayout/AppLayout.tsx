import { ReactNode } from "react";
import { AppShell, Box, ScrollArea, Flex } from "@mantine/core";
import { useViewMode, useSetViewMode, useSelectedTable, useQueryEditorVisible, useToggleQueryEditor } from "../../../stores/tableViewStore";
import { Footer } from "../Footer";

interface AppLayoutProps {
    navbarCollapsed: boolean;
    asideCollapsed: boolean;
    footerCollapsed: boolean;
    header: ReactNode;
    navbar: ReactNode;
    aside: ReactNode;
    children: ReactNode;
}

export function AppLayout({
    navbarCollapsed,
    asideCollapsed,
    footerCollapsed,
    header,
    navbar,
    aside,
    children,
}: AppLayoutProps) {
    const viewMode = useViewMode();
    const setViewMode = useSetViewMode();
    const selectedTable = useSelectedTable();
    const queryEditorVisible = useQueryEditorVisible();
    const toggleQueryEditor = useToggleQueryEditor();

    return (
        <Box h="100%">
            <AppShell
                header={{ height: 32 }}
                navbar={{
                    width: 300,
                    breakpoint: "sm",
                    collapsed: { mobile: navbarCollapsed, desktop: navbarCollapsed },
                }}
                aside={{
                    width: 300,
                    breakpoint: "md",
                    collapsed: { mobile: asideCollapsed, desktop: asideCollapsed },
                }}
            >
                <AppShell.Header>
                    {header}
                </AppShell.Header>

                <AppShell.Navbar p="md">
                    {navbar}
                </AppShell.Navbar>

                <AppShell.Aside p="md">
                    {aside}
                </AppShell.Aside>

                <AppShell.Main>
                    <Flex direction="column" h="calc(100vh - var(--app-shell-header-height, 0px))">
                        <ScrollArea flex={1} p="md">
                            {children}
                        </ScrollArea>

                        <Footer
                            collapsed={footerCollapsed}
                            viewMode={viewMode}
                            onViewModeChange={setViewMode}
                            selectedTable={selectedTable}
                            queryEditorVisible={queryEditorVisible}
                            onToggleQueryEditor={toggleQueryEditor}
                        />
                    </Flex>
                </AppShell.Main>
            </AppShell>
        </Box>
    );
}
