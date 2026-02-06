import { memo, useCallback } from 'react';
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

const FIT_VIEW_OPTIONS = { padding: 0.2 };

function DiagramToolbarComponent({ onResetLayout }: DiagramToolbarProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const showColumnTypes = useDiagramStore((s) => s.showColumnTypes);
  const showOnlyKeys = useDiagramStore((s) => s.showOnlyKeys);
  const toggleColumnTypes = useDiagramStore((s) => s.toggleColumnTypes);
  const toggleOnlyKeys = useDiagramStore((s) => s.toggleOnlyKeys);

  const handleZoomIn = useCallback(() => {
    zoomIn();
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut();
  }, [zoomOut]);

  const handleFitView = useCallback(() => {
    fitView(FIT_VIEW_OPTIONS);
  }, [fitView]);

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
          <ActionIcon variant="subtle" onClick={handleZoomIn}>
            <IconZoomIn size={18} />
          </ActionIcon>
        </Tooltip>

        <Tooltip label="Zoom Out">
          <ActionIcon variant="subtle" onClick={handleZoomOut}>
            <IconZoomOut size={18} />
          </ActionIcon>
        </Tooltip>

        <Tooltip label="Fit View">
          <ActionIcon variant="subtle" onClick={handleFitView}>
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
