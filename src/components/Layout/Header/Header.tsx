import {
  Stack,
} from '@mantine/core';
import { Connection } from '../../../types/database';
import { TitleBar } from './TitleBar';

interface HeaderProps {
  activeConnection: Connection | null;
  onExecuteQuery: () => void;
  onOpenExportModal: () => void;
  navbarCollapsed: boolean;
  asideCollapsed: boolean;
  footerCollapsed: boolean;
  onToggleNavbar: () => void;
  onToggleAside: () => void;
  onToggleFooter: () => void;
}

export function Header({
  activeConnection,
  onExecuteQuery,
  onOpenExportModal,
  navbarCollapsed,
  asideCollapsed,
  footerCollapsed,
  onToggleNavbar,
  onToggleAside,
  onToggleFooter,
}: HeaderProps) {
  return (
    <Stack gap={0} w="100%">
      <TitleBar
        activeConnection={activeConnection}
        onExecuteQuery={onExecuteQuery}
        onOpenExportModal={onOpenExportModal}
        navbarCollapsed={navbarCollapsed}
        asideCollapsed={asideCollapsed}
        footerCollapsed={footerCollapsed}
        onToggleNavbar={onToggleNavbar}
        onToggleAside={onToggleAside}
        onToggleFooter={onToggleFooter}
      />
    </Stack>
  );
}
