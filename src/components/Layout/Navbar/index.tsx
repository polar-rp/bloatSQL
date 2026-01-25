import { Stack, Center, Loader, AppShell, Button, Text, ActionIcon, Group, Card, ScrollArea, ThemeIcon, TextInput, SegmentedControl, Code, Badge, rem } from '@mantine/core';
import { IconPlus, IconDatabase, IconEdit, IconTrash, IconPlugOff, IconPlug, IconSearch, IconTable, IconHistory } from '@tabler/icons-react';
import { Connection } from '../../../types/database';
import { TablesList } from './TablesList';
import { Led } from '@gfazioli/mantine-led';
import { useState } from 'react';
import { HistoryItem } from '../Aside';

interface NavbarProps {
  connections: Connection[];
  activeConnection: Connection | null;
  tables: string[] | null;
  connectionLoading: boolean;
  isLoadingTables: boolean;
  selectedTable: string | null;
  queryHistory: HistoryItem[];
  onNewConnection: () => void;
  onConnect: (connection: Connection) => void;
  onDisconnect: () => void;
  onEditConnection: (connection: Connection) => void;
  onDeleteConnection: (id: string) => void;
  onSelectTable: (tableName: string) => void;
  onLoadQuery: (query: string) => void;
}

export function Navbar({
  connections,
  activeConnection,
  tables,
  connectionLoading,
  isLoadingTables,
  selectedTable,
  queryHistory,
  onNewConnection,
  onConnect,
  onDisconnect,
  onEditConnection,
  onDeleteConnection,
  onSelectTable,
  onLoadQuery,
}: NavbarProps) {
  const [tableSearch, setTableSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'tables' | 'history'>('tables');

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
          <Card withBorder padding="sm">
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

      {isConnected && (
        <>
          <AppShell.Section mb="sm">
            <TextInput
              placeholder="Search tables..."
              leftSection={<IconSearch size={16} />}
              value={tableSearch}
              onChange={(e) => setTableSearch(e.currentTarget.value)}
              size="xs"
            />
          </AppShell.Section>

          <AppShell.Section mb="md">
            <SegmentedControl
              fullWidth
              size="xs"
              value={activeTab}
              onChange={(value) => setActiveTab(value as 'tables' | 'history')}
              data={[
                {
                  value: 'tables',
                  label: (
                    <Center style={{ gap: 10 }}>
                      <IconTable size={14} />
                      <span>Tables</span>
                    </Center>
                  ),
                },
                {
                  value: 'history',
                  label: (
                    <Center style={{ gap: 10 }}>
                      <IconHistory size={14} />
                      <span>History</span>
                    </Center>
                  ),
                },
              ]}
            />
          </AppShell.Section>
        </>
      )}

      <AppShell.Section
        grow
        component={ScrollArea}
        type="hover"
        viewportProps={{ style: { overflowX: 'hidden' } }}
      >
        {isConnected ? (
          activeTab === 'tables' ? (
            <TablesList
              tables={tables}
              isLoadingTables={isLoadingTables}
              isConnected={isConnected}
              selectedTable={selectedTable}
              onSelectTable={onSelectTable}
              searchQuery={tableSearch}
            />
          ) : (
            <Stack gap="xs">
              {queryHistory.length === 0 ? (
                <Text size="sm" c="dimmed" ta="center" py="xl">
                  No query history yet
                </Text>
              ) : (
                queryHistory.map((item, idx) => (
                  <Card
                    key={idx}
                    p="xs"
                    withBorder
                    style={{ cursor: 'pointer' }}
                    onClick={() => onLoadQuery(item.query)}
                  >
                    <Stack gap={4}>
                      <Code
                        block
                        style={{
                          fontSize: rem(11),
                          maxHeight: rem(60),
                          overflow: 'hidden',
                        }}
                      >
                        {item.query.slice(0, 100)}
                        {item.query.length > 100 && '...'}
                      </Code>
                      <Group gap="xs" justify="space-between">
                        <Text size="xs" c="dimmed">
                          {item.timestamp.toLocaleTimeString()}
                        </Text>
                        <Badge size="xs" variant="light">
                          {item.executionTime}ms
                        </Badge>
                      </Group>
                    </Stack>
                  </Card>
                ))
              )}
            </Stack>
          )
        ) : (
          <Stack gap="sm">
            {connections.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="xl">
                No saved connections
              </Text>
            ) : (
              connections.map((conn) => (
                <Card key={conn.id} withBorder padding="sm">
                  <Stack gap="sm">
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap="xs" style={{ minWidth: 0 }}>
                        <IconDatabase size={18} />
                        <Text size="sm" fw={500} truncate>
                          {conn.name}
                        </Text>
                      </Group>
                      <Group gap={4} wrap="nowrap">
                        <ActionIcon
                          variant="subtle"
                          size="sm"
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