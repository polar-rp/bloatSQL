import {
  Stack,
} from '@mantine/core';
import { Connection } from '../../types/database';
import { TitleBar } from './TitleBar';

interface HeaderProps {
  activeConnection: Connection | null;
  onExecuteQuery: () => void;
  onOpenExportModal: () => void;
  navbarCollapsed: boolean;
  asideCollapsed: boolean;
  onToggleNavbar: () => void;
  onToggleAside: () => void;
}

export function Header({
  activeConnection,
  onExecuteQuery,
  onOpenExportModal,
  navbarCollapsed,
  asideCollapsed,
  onToggleNavbar,
  onToggleAside,
}: HeaderProps) {
  return (
    <Stack gap={0} w="100%">
      <TitleBar
        activeConnection={activeConnection}
        onExecuteQuery={onExecuteQuery}
        onOpenExportModal={onOpenExportModal}
        navbarCollapsed={navbarCollapsed}
        asideCollapsed={asideCollapsed}
        onToggleNavbar={onToggleNavbar}
        onToggleAside={onToggleAside}
      />
    </Stack>
  );
}
