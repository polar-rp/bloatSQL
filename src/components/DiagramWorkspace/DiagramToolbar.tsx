import { memo } from 'react';
import { Group, ActionIcon, Tooltip, Switch, Text } from '@mantine/core';
import {
  IconZoomIn,
  IconZoomOut,
  IconFocusCentered,
  IconRefresh,
} from '@tabler/icons-react';
import { useReactFlow } from '@xyflow/react';
import { useDiagramStore } from '../../stores/diagramStore';

interface DiagramToolbarProps {
  onResetLayout: () => void;
}

function DiagramToolbarComponent({ onResetLayout }: DiagramToolbarProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { showColumnTypes, showOnlyKeys, toggleColumnTypes, toggleOnlyKeys } =
    useDiagramStore();

  return (
    <Group
      gap="md"
      p="xs"
      style={{
        background: 'var(--mantine-color-body)',
        borderRadius: 'var(--mantine-radius-md)',
        border: '1px solid var(--mantine-color-default-border)',
        boxShadow: 'var(--mantine-shadow-sm)',
      }}
    >
      <Group gap="xs">
        <Tooltip label="Zoom In">
          <ActionIcon variant="subtle" onClick={() => zoomIn()}>
            <IconZoomIn size={18} />
          </ActionIcon>
        </Tooltip>

        <Tooltip label="Zoom Out">
          <ActionIcon variant="subtle" onClick={() => zoomOut()}>
            <IconZoomOut size={18} />
          </ActionIcon>
        </Tooltip>

        <Tooltip label="Fit View">
          <ActionIcon variant="subtle" onClick={() => fitView({ padding: 0.2 })}>
            <IconFocusCentered size={18} />
          </ActionIcon>
        </Tooltip>

        <Tooltip label="Reset Layout">
          <ActionIcon variant="subtle" onClick={onResetLayout}>
            <IconRefresh size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <Group gap="md">
        <Group gap={6}>
          <Switch
            size="xs"
            checked={showColumnTypes}
            onChange={toggleColumnTypes}
          />
          <Text size="xs">Types</Text>
        </Group>

        <Group gap={6}>
          <Switch
            size="xs"
            checked={showOnlyKeys}
            onChange={toggleOnlyKeys}
          />
          <Text size="xs">Keys only</Text>
        </Group>
      </Group>
    </Group>
  );
}

export const DiagramToolbar = memo(DiagramToolbarComponent);
