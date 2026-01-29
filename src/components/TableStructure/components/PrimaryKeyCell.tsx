import { Badge } from '@mantine/core';

interface PrimaryKeyCellProps {
  isPrimaryKey: boolean;
}

export function PrimaryKeyCell({ isPrimaryKey }: PrimaryKeyCellProps) {
  if (!isPrimaryKey) {
    return null;
  }

  return (
    <Badge color="yellow" variant="light" size="sm">
      PK
    </Badge>
  );
}
