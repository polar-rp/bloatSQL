import { Badge } from '@mantine/core';

interface NullableCellProps {
  isNullable: boolean;
}

export function NullableCell({ isNullable }: NullableCellProps) {
  return (
    <Badge color={isNullable ? 'gray' : 'red'} variant="light" size="sm">
      {isNullable ? 'NULL' : 'NOT NULL'}
    </Badge>
  );
}
