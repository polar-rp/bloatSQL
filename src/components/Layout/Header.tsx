import {
  Stack,
} from '@mantine/core';
import { Connection } from '../../types/database';
import { TitleBar } from './TitleBar';

interface HeaderProps {
  activeConnection: Connection | null;
  onExecuteQuery: () => void;
  onOpenExportModal: () => void;
}

export function Header({
  activeConnection,
  onExecuteQuery,
  onOpenExportModal,
}: HeaderProps) {
  return (
    <Stack gap={0} w="100%">
      <TitleBar
        activeConnection={activeConnection}
        onExecuteQuery={onExecuteQuery}
        onOpenExportModal={onOpenExportModal}
      />
    </Stack>
  );
}
