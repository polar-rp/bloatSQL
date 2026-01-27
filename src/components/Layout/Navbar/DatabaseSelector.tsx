import { Select, Stack, Group, Text, Button, Loader, Card, ThemeIcon } from '@mantine/core';
import { IconDatabase, IconPlugOff } from '@tabler/icons-react';
import { Led } from '@gfazioli/mantine-led';
import { Connection } from '../../../types/database';

interface DatabaseSelectorProps {
  activeConnection: Connection | null;
  databases: string[];
  currentDatabase: string;
  isLoadingDatabases: boolean;
  onDatabaseChange: (database: string) => void;
  onDisconnect: () => void;
}

export function DatabaseSelector({
  activeConnection,
  databases,
  currentDatabase,
  isLoadingDatabases,
  onDatabaseChange,
  onDisconnect,
}: DatabaseSelectorProps) {
  if (!activeConnection) {
    return null;
  }

  return (
    <Stack gap="xs">
      <Card withBorder>
        <Card.Section p={'xs'}>
          <Group gap="xs" wrap="nowrap">
            <ThemeIcon size={'lg'} variant='light'>
              <IconDatabase size={18}  />
            </ThemeIcon>
            
            <Stack gap={0} >
              <Group gap={6} wrap="nowrap">
                <Text size="sm" fw={600} truncate>
                  {activeConnection.name}
                </Text>
                <Led animate size="xs" animationType="pulse" animationDuration={3.5} />
              </Group>
              <Text size="xs" c="dimmed" truncate>
                {activeConnection.username}@{activeConnection.host}
              </Text>
            </Stack>
          </Group>
        </Card.Section>

        <Card.Section p={'xs'}>
          <Button
            size="sm"
            variant="light"
            color="red"
            leftSection={<IconPlugOff size={16} />}
            onClick={onDisconnect}
            fullWidth
          >
            Disconnect
          </Button>
        </Card.Section>
        
      </Card>
     
      <Select
        size="xs"
        placeholder={isLoadingDatabases ? 'Loading...' : 'Select database'}
        data={databases}
        value={currentDatabase || null}
        onChange={(value) => value && onDatabaseChange(value)}
        disabled={isLoadingDatabases}
        leftSection={isLoadingDatabases ? <Loader size={14} /> : <IconDatabase size={14} />}
        searchable
        nothingFoundMessage="No databases found"
        comboboxProps={{ withinPortal: true }}
      />


    </Stack>
  );
}
