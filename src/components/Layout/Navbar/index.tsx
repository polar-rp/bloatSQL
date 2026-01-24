import { Stack, Center, Loader, AppShell, Button, Text, ActionIcon, Group, Card, ScrollArea, ThemeIcon } from '@mantine/core';
import { IconPlus, IconDatabase, IconEdit, IconTrash, IconPlugOff, IconPlug } from '@tabler/icons-react';
import { Connection } from '../../../types/database';
import { TablesList } from './TablesList';
import { Led } from '@gfazioli/mantine-led';

interface NavbarProps {
  connections: Connection[];
  activeConnection: Connection | null;
  tables: string[] | null;
  connectionLoading: boolean;
  isLoadingTables: boolean;
  selectedTable: string | null;
  onNewConnection: () => void;
  onConnect: (connection: Connection) => void;
  onDisconnect: () => void;
  onEditConnection: (connection: Connection) => void;
  onDeleteConnection: (id: string) => void;
  onSelectTable: (tableName: string) => void;
}

export function Navbar({
  connections,
  activeConnection,
  tables,
  connectionLoading,
  isLoadingTables,
  selectedTable,
  onNewConnection,
  onConnect,
  onDisconnect,
  onEditConnection,
  onDeleteConnection,
  onSelectTable,
}: NavbarProps) {
  if (connectionLoading) {
    return (
      <Stack h="100%" justify="center" align="center">
        <Center>
          <Loader size="sm" />
        </Center>
      </Stack>
    );
  }

  const isConnected = !!activeConnection;

  return (
    <>
      <AppShell.Section mb="md">
        {!isConnected ? (
          <Button
            fullWidth
            leftSection={<IconPlus size={16} />}
            onClick={onNewConnection}
          >
            New Connection
          </Button>
        ) : (
          <Card withBorder padding="sm" radius="md">
            <Stack gap="xs">
              <Group justify="space-between" wrap="nowrap">
                <Group gap="xs" >
                  <ThemeIcon size={'lg'} variant='light'>
                    <IconDatabase />
                  </ThemeIcon>
                  
                  <Stack gap={0}>
                    <Group gap={5}>
                      <Text size="sm" fw={600} truncate>
                        {activeConnection.name}
                      </Text>
                      <Led animate size='xs' animationType="pulse" animationDuration={3.5} />
                    </Group>

                    <Text size="xs" c="dimmed" truncate>
                      {activeConnection.host}
                    </Text>
                  </Stack>
                </Group>
              </Group>
              <Button
                size="xs"
                variant="light"
                color="red"
                leftSection={<IconPlugOff size={14} />}
                onClick={onDisconnect}
                fullWidth
              >
                Disconnect
              </Button>
            </Stack>
          </Card>
        )}
      </AppShell.Section>

      <AppShell.Section grow component={ScrollArea}>
        {isConnected ? (
          <TablesList
            tables={tables}
            isLoadingTables={isLoadingTables}
            isConnected={isConnected}
            selectedTable={selectedTable}
            onSelectTable={onSelectTable}
          />
        ) : (
          <Stack gap="sm">
            {connections.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="xl">
                No saved connections
              </Text>
            ) : (
              connections.map((conn) => (
                <Card key={conn.id} withBorder padding="sm" radius="md">
                  <Stack gap="sm">
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap="xs" style={{ minWidth: 0 }}>
                        <IconDatabase size={18} style={{ flexShrink: 0 }} color="var(--mantine-color-blue-6)" />
                        <Text size="sm" fw={500} truncate>
                          {conn.name}
                        </Text>
                      </Group>
                      <Group gap={4} wrap="nowrap">
                        <ActionIcon
                          variant="subtle"
                          size="sm"
                          color="gray"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditConnection(conn);
                          }}
                        >
                          <IconEdit size={14} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          size="sm"
                          color="red"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConnection(conn.id);
                          }}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    </Group>

                    <Text size="xs" c="dimmed" lineClamp={1}>
                      {conn.username}@{conn.host}:{conn.port}
                    </Text>

                    <Button
                      size="xs"
                      variant="light"
                      fullWidth
                      leftSection={<IconPlug size={14} />}
                      onClick={() => onConnect(conn)}
                    >
                      Connect
                    </Button>
                  </Stack>
                </Card>
              ))
            )}
          </Stack>
        )}
      </AppShell.Section>
    </>
  );
}

export { TablesList } from './TablesList';
