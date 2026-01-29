import { Text } from '@mantine/core';

interface ColumnNameCellProps {
  name: string;
  isPrimaryKey: boolean;
}

export function ColumnNameCell({ name, isPrimaryKey }: ColumnNameCellProps) {
  return (
    <Text fw={isPrimaryKey ? 600 : 400}>
      {name}
    </Text>
  );
}
