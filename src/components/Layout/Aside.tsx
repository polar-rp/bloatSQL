import {
  Stack,
  Center,
  Text,
} from '@mantine/core';

export interface HistoryItem {
  query: string;
  timestamp: Date;
  executionTime: number;
}

interface AsideProps {
  onCollapse: () => void;
}

export function Aside({ }: AsideProps) {
  return (
    <Stack gap="md" h="100%" justify="center">
      <Center>
        <Text c="dimmed" size="sm">
          Edytor aktywnego pola
        </Text>
      </Center>
    </Stack>
  );
}
