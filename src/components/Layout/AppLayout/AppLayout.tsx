import { ReactNode, memo } from "react";
import { AppShell, Box } from "@mantine/core";
import { useNavbarCollapsed, useAsideCollapsed } from "../../../stores/layoutStore";
import { Footer } from "../Footer";
import styles from "./AppLayout.module.css";

interface AppLayoutProps {
    header: ReactNode;
    navbar: ReactNode;
    aside: ReactNode;
    children: ReactNode;
}

function AppLayoutComponent({
    header,
    navbar,
    aside,
    children,
}: AppLayoutProps) {
    // Layout state from store - only re-renders when these specific values change
    const navbarCollapsed = useNavbarCollapsed();
    const asideCollapsed = useAsideCollapsed();

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
                    <Box className={styles.mainContainer}>
                        <Box className={styles.mainContent}>
                            {children}
                        </Box>

                        <Footer />
                    </Box>
                </AppShell.Main>
            </AppShell>
        </Box>
    );
}

export const AppLayout = memo(AppLayoutComponent);
