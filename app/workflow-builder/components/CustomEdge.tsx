'use client';

import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  type Edge,
  type EdgeProps,
  getBezierPath,
  useReactFlow,
} from '@xyflow/react';

type CustomLabelEdgeType = Edge<{
  condition?: string;
  expression?: string;
  label?: string;
}>;

type CustomLabelEdgeProps = EdgeProps<CustomLabelEdgeType>;

export function CustomLabelEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  sourceHandleId,
  data,
  style = {},
  markerEnd,
  markerStart,
}: CustomLabelEdgeProps) {
  const { getEdge } = useReactFlow();
  // Retrieve the edge definition to get any saved condition or expression fields
  const edge = getEdge(id);
  const condition =
    data?.condition ||
    (edge as any)?.condition ||
    sourceHandleId ||
    edge?.sourceHandle ||
    '';
  const expression =
    data?.expression ||
    (edge as any)?.expression ||
    '';

  const isSuccessType = String(condition || '').toLowerCase() === 'success';
  const isFailureType = String(condition || '').toLowerCase() === 'failure';

  // Label to render (only show the condition name/label, and not the raw expression)
  const labelText = condition || (expression ? 'Custom' : '');
  const displayLabel = labelText
    ? labelText.charAt(0).toUpperCase() + labelText.slice(1)
    : '';

  // Edge stroke and label colors based on the condition type
  let strokeColor = '#cbd5e1'; // Default gray (slate-300)
  let strokeWidth = 2.5;
  let labelColor = '#4b5563'; // Gray 600
  let labelBgColor = '#ffffff';
  let labelBorderColor = '#e2e8f0'; // Slate 200

  if (isSuccessType) {
    strokeColor = '#10b981'; // Emerald 500
    labelColor = '#047857'; // Emerald 700
    labelBgColor = '#ecfdf5'; // Emerald 50
    labelBorderColor = '#10b981'; // Emerald 500
  } else if (isFailureType) {
    strokeColor = '#ef4444'; // Red 500
    labelColor = '#b91c1c'; // Red 700
    labelBgColor = '#fef2f2'; // Red 50
    labelBorderColor = '#ef4444'; // Red 500
  } else if ((condition && condition !== 'default') || expression) {
    strokeColor = '#3b82f6'; // Blue 500
    labelColor = '#1d4ed8'; // Blue 700
    labelBgColor = '#eff6ff'; // Blue 50
    labelBorderColor = '#3b82f6'; // Blue 500
  }

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...(style || {}),
          stroke: strokeColor,
          strokeWidth,
          transition: 'stroke 0.3s ease, stroke-width 0.3s ease',
        }}
        markerEnd={
          markerEnd
            ? `url(#${id}-marker-end)`
            : undefined
        }
        markerStart={
          markerStart
            ? `url(#${id}-marker-start)`
            : undefined
        }
      />

      {/* Dynamic colored SVG markers for edge arrows */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <marker
            id={`${id}-marker-end`}
            viewBox="0 0 16 16"
            refX="12"
            refY="8"
            markerWidth="8"
            markerHeight="8"
            orient="auto-start-reverse"
          >
            <path
              d="M 0 0 L 16 8 L 0 16 z"
              fill={strokeColor}
              style={{ transition: 'fill 0.3s ease' }}
            />
          </marker>
        </defs>
      </svg>

      {/* Render the Condition Pill Badge */}
      {displayLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'none', // Set to none so clicks fall through to select the edge path underneath
              backgroundColor: labelBgColor,
              color: labelColor,
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              border: `1.5px solid ${labelBorderColor}`,
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              userSelect: 'none',
              transition: 'all 0.3s ease',
            }}
            className="nodrag nopan hover:scale-105 active:scale-95"
          >
            {displayLabel}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}