import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';

// Edge data structure
interface RelationshipEdgeData {
  fromColumn: string;
  toColumn: string;
  constraintName: string;
  [key: string]: unknown; // Index signature for React Flow compatibility
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
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const edgeData = data as RelationshipEdgeData | undefined;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected
            ? 'var(--mantine-primary-color-filled)'
            : 'var(--mantine-color-default-border)',
          strokeWidth: selected ? 3 : 2,
        }}
      />

      {selected && edgeData && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: 'var(--mantine-color-body)',
              padding: '4px 8px',
              fontSize: 10,
              fontWeight: 500,
              border: '1px solid var(--mantine-primary-color-filled)',
              pointerEvents: 'all',
            }}
          >
            {edgeData.fromColumn} → {edgeData.toColumn}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const RelationshipEdge = memo(RelationshipEdgeComponent);
