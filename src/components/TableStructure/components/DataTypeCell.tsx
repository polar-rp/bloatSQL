import { Badge } from '@mantine/core';

interface DataTypeCellProps {
  baseType: string;
}

export function DataTypeCell({ baseType }: DataTypeCellProps) {
  return (
    <Badge variant="light" size="sm">
      {baseType}
    </Badge>
  );
}
