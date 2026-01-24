import { Button, Group, Image, Menu, Text, UnstyledButton, Badge } from '@mantine/core';
import { IconFileDownload, IconMinus, IconPlayerPlay, IconSquare, IconSquares, IconX } from '@tabler/icons-react';
import { useWindowControls, useTauriContext } from '../../tauri/TauriProvider';
import { Connection } from '../../types/database';
import classes from './TitleBar.module.css';
import { Led } from '@gfazioli/mantine-led';
import '@gfazioli/mantine-led/styles.layer.css';
import appIcon from '../../assets/icon.png';

interface TitleBarProps {
  activeConnection: Connection | null;
  onExecuteQuery: () => void;
  onOpenExportModal: () => void;
}

export function TitleBar({ activeConnection, onExecuteQuery, onOpenExportModal }: TitleBarProps) {
  const { minimize, toggleMaximize, close } = useWindowControls();
  const { isMaximized } = useTauriContext();

  return (
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
        <Menu shadow="md" width={200} position="bottom-start">
          <Menu.Target>
            <Button
              variant="subtle"
              color="gray"
              c={'var(--mantine-color-placeholder)'}
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
            <Text size="xs" c="dimmed">Connected</Text>
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

      {/* Right section: Window controls */}
      <Group gap={0} wrap="nowrap" h="100%">
        <UnstyledButton
          onClick={() => minimize()}
          className={classes.windowControl}
          aria-label="Minimize"
        >
          <IconMinus size={16} stroke={1.7} />
        </UnstyledButton>
        <UnstyledButton
          onClick={() => toggleMaximize()}
          className={classes.windowControl}
          aria-label={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? <IconSquares size={14} stroke={1.7} /> : <IconSquare size={14} stroke={1.7} />}
        </UnstyledButton>
        <UnstyledButton
          onClick={() => close()}
          className={`${classes.windowControl} ${classes.closeButton}`}
          aria-label="Close"
        >
          <IconX size={18} stroke={1.7} />
        </UnstyledButton>
      </Group>
    </Group>
  );
}
