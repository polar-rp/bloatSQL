import { Stack, Center, Text, ThemeIcon } from '@mantine/core';
import { IconEditCircle } from '@tabler/icons-react';

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
    <Center h="100%">
      <Stack gap="xs" align="center">
        <ThemeIcon
          variant="light"
          size={50}
          color="gray"
        >
          <IconEditCircle size={30} stroke={1.5} />
        </ThemeIcon>

        <Stack gap={4} align="center">
          <Text fw={500} size="md" c="bright">
            Brak aktywnego pola
          </Text>
          <Text c="dimmed" size="sm" ta="center">
            Wybierz element w edytorze, aby rozpocząć konfigurację parametrów.
          </Text>
        </Stack>
      </Stack>
    </Center>
  );
}