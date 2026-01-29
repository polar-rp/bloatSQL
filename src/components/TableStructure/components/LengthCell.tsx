import { Text } from '@mantine/core';

interface LengthCellProps {
  displayLength: string | null;
}

export function LengthCell({ displayLength }: LengthCellProps) {
  if (!displayLength) {
    return null;
  }

  return (
    <Text size="sm" c="dimmed">
      {displayLength}
    </Text>
  );
}
