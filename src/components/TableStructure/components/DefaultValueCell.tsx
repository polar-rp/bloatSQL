import { Text } from '@mantine/core';

interface DefaultValueCellProps {
  defaultValue: string | null | undefined;
}

export function DefaultValueCell({ defaultValue }: DefaultValueCellProps) {
  if (!defaultValue) {
    return null;
  }

  return (
    <Text size="sm" c="dimmed" style={{ fontFamily: 'var(--mantine-font-family-monospace)' }}>
      {defaultValue}
    </Text>
  );
}
