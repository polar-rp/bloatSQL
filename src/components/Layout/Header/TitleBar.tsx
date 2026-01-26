import { Button, Group, Image, Menu, Text, UnstyledButton, Badge, ActionIcon } from '@mantine/core';
import {
  IconFileDownload,
  IconLayoutSidebarFilled,
  IconLayoutSidebar,
  IconLayoutSidebarRightFilled,
  IconLayoutSidebarRight,
  IconLayoutBottombarFilled,
  IconLayoutBottombar,
  IconMinus,
  IconPlayerPlay,
  IconSquare,
  IconSquares,
  IconX,
  IconSettings
} from '@tabler/icons-react';
import { useWindowControls, useTauriContext } from '../../../tauri/TauriProvider';
import { Connection } from '../../../types/database';
import classes from './TitleBar.module.css';
import { Led } from '@gfazioli/mantine-led';
import '@gfazioli/mantine-led/styles.layer.css';
import appIcon from '../../../assets/BloatSQL1024x1024Logo.png';
import { useDisclosure } from '@mantine/hooks';
import { SettingsModal } from '../../modals';

interface TitleBarProps {
  activeConnection: Connection | null;
  onExecuteQuery: () => void;
  onOpenExportModal: () => void;
  navbarCollapsed: boolean;
  asideCollapsed: boolean;
  footerCollapsed: boolean;
  onToggleNavbar: () => void;
  onToggleAside: () => void;
  onToggleFooter: () => void;
}

export function TitleBar({
  activeConnection,
  onExecuteQuery,
  onOpenExportModal,
  navbarCollapsed,
  asideCollapsed,
  footerCollapsed,
  onToggleNavbar,
  onToggleAside,
  onToggleFooter,
}: TitleBarProps) {
  const { minimize, toggleMaximize, close } = useWindowControls();
  const { isMaximized } = useTauriContext();
  const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);

  return (
    <>
      <Group
        justify="space-between"
        h={32}
        gap={0}
        wrap="nowrap"
        className={classes.titleBar}
      >
        {/* Left section: Logo + Menu */}
        <Group h="100%" px="md" gap="xs" wrap="nowrap">
          <Image src={appIcon} w={18} h={18} />

          <Menu shadow="md" width={200} position="bottom-start" trigger="hover">
            <Menu.Target>
              <Button
                variant="subtle"
                color='var(--mantine-color-text)'
                size="compact-xs"
              >
                File
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconSettings size={14} />}
                onClick={openSettings}
              >
                Settings
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          <Menu shadow="md" width={200} position="bottom-start" trigger="hover">
            <Menu.Target>
              <Button
                variant="subtle"
                color='var(--mantine-color-text)'
                size="compact-xs"
              >
                Database
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconPlayerPlay size={14} />}
                onClick={onExecuteQuery}
                disabled={!activeConnection}
              >
                Run SQL
              </Menu.Item>
              <Menu.Item
                leftSection={<IconFileDownload size={14} />}
                onClick={onOpenExportModal}
                disabled={!activeConnection}
              >
                Export Database
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        {/* Center section: Connection status */}
        <Group
          data-tauri-drag-region
          flex={1}
          h="100%"
          justify="center"
          style={{ cursor: 'default' }}
        >
          {activeConnection && (
            <Group gap={6}>
              <Led animate animationType="pulse" animationDuration={3.5} />
              <Text size="xs" c="var(--mantine-color-text)">Connected</Text>
              <Badge
                size="xs"
                variant="light"
                color={activeConnection.sslMode === 'required' ? 'green' : activeConnection.sslMode === 'preferred' ? 'blue' : 'gray'}
              >
                SSL: {activeConnection.sslMode.charAt(0).toUpperCase() + activeConnection.sslMode.slice(1)}
              </Badge>
            </Group>
          )}
        </Group>


        <Group gap={2} mr={4}>
          <ActionIcon
            onClick={onToggleNavbar}
            variant="subtle"
            color="gray"
            size="sm"
            aria-label={navbarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {navbarCollapsed ? (
              <IconLayoutSidebar color='var(--mantine-color-text)' />
            ) : (
              <IconLayoutSidebarFilled color='var(--mantine-color-text)' />
            )}
          </ActionIcon>
          <ActionIcon
            onClick={onToggleFooter}
            variant="subtle"
            color="gray"
            size="sm"
            aria-label={footerCollapsed ? "Expand footer" : "Collapse footer"}
          >
            {footerCollapsed ? (
              <IconLayoutBottombar color='var(--mantine-color-text)' />
            ) : (
              <IconLayoutBottombarFilled color='var(--mantine-color-text)' />
            )}
          </ActionIcon>
          <ActionIcon
            onClick={onToggleAside}
            variant="subtle"
            color="gray"
            size="sm"
            aria-label={asideCollapsed ? "Expand history" : "Collapse history"}
          >
            {asideCollapsed ? (
              <IconLayoutSidebarRight color='var(--mantine-color-text)' />
            ) : (
              <IconLayoutSidebarRightFilled color='var(--mantine-color-text)' />
            )}
          </ActionIcon>
        </Group>

        <Group gap={0} wrap="nowrap" h="100%">
          <UnstyledButton
            onClick={() => minimize()}
            className={classes.windowControl}
            aria-label="Minimize"
          >
            <IconMinus size={16} stroke={1.7} color='var(--mantine-color-text)' />
          </UnstyledButton>
          <UnstyledButton
            onClick={() => toggleMaximize()}
            className={classes.windowControl}
            aria-label={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? <IconSquares size={14} stroke={1.7} color='var(--mantine-color-text)' /> : <IconSquare size={14} stroke={1.7} color='var(--mantine-color-text)' />}
          </UnstyledButton>
          <UnstyledButton
            onClick={() => close()}
            className={`${classes.windowControl} ${classes.closeButton}`}
            aria-label="Close"
          >
            <IconX size={18} stroke={1.7} color='var(--mantine-color-text)' />
          </UnstyledButton>
        </Group>
      </Group>

      <SettingsModal opened={settingsOpened} onClose={closeSettings} />
    </>
  );
}
