import {
  Stack,
  Divider,
  Group,
  Text,
  ActionIcon,
  ScrollArea,
  Card,
  Code,
  Badge,
  rem,
} from '@mantine/core';
import { IconChevronRight, IconHistory } from '@tabler/icons-react';

export interface HistoryItem {
  query: string;
  timestamp: Date;
  executionTime: number;
}

interface AsideProps {
  queryHistory: HistoryItem[];
  onLoadQuery: (query: string) => void;
  onCollapse: () => void;
}

export function Aside({ queryHistory, onLoadQuery, onCollapse }: AsideProps) {
  return (
    <Stack gap="md" h="100%">
      <Group justify="space-between">
        <Group gap="xs">
          <IconHistory size={16} />
          <Text size="sm" fw={600}>
            Query History
          </Text>
        </Group>
        <ActionIcon
          variant="subtle"
          size="sm"
          onClick={onCollapse}
        >
          <IconChevronRight size={16} />
        </ActionIcon>
      </Group>

      <Divider />

      <ScrollArea style={{ flex: 1 }}>
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
      </ScrollArea>
    </Stack>
  );
}
