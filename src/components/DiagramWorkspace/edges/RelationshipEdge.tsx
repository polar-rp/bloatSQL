import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
  type Edge,
} from '@xyflow/react';

interface RelationshipEdgeData {
  fromColumn: string;
  toColumn: string;
  constraintName: string;
  [key: string]: unknown;
}

function RelationshipEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  style = {},
}: EdgeProps<Edge<RelationshipEdgeData>>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 12,
  });

  const edgeData = data as RelationshipEdgeData | undefined;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: selected
            ? 'var(--mantine-primary-color-filled)'
            : 'var(--mantine-color-default-border)',
          strokeWidth: selected ? 2.5 : 1.5,
          strokeDasharray: '8 4',
          animation: 'dashdraw 2s linear infinite',
          cursor: 'pointer',
        }}
      />

      {selected && edgeData && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: 'var(--mantine-color-body)',
              padding: '6px 10px',
              fontSize: 11,
              fontWeight: 500,
              border: '1.5px solid var(--mantine-primary-color-filled)',
              borderRadius: 'var(--mantine-radius-sm)',
              boxShadow: 'var(--mantine-shadow-sm)',
              pointerEvents: 'all',
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{ fontFamily: 'monospace', color: 'var(--mantine-primary-color-filled)' }}>
              {edgeData.fromColumn} → {edgeData.toColumn}
            </div>
            {edgeData.constraintName && (
              <div
                style={{
                  fontSize: 9,
                  color: 'var(--mantine-color-dimmed)',
                  marginTop: 2,
                }}
              >
                {edgeData.constraintName}
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const RelationshipEdge = memo(RelationshipEdgeComponent);
