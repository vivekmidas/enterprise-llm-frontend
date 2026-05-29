'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils'; // shadcn/ui utility

export interface BaseNodeData {
  label: string;
  group: string;
  description: string;
  icon: LucideIcon;
  color: string; // Primary brand color (hex)
  badge?: string; // e.g. "Model", "Tool", "Memory"
  subLabel?: string;
}

interface BaseNodeProps extends NodeProps {
  data: BaseNodeData;
  className?: string;
}

export const BaseNode = React.memo<BaseNodeProps>(({ data, className }) => {
  const { label, group, description, icon: Icon, color, badge = 'Node', subLabel } = data;

  // MELT Observability: Easy to add telemetry later
  // console.debug('[Node] Rendered:', label); // Remove in prod or use proper logger

  return (
    <div
      className={cn(
        'bg-zinc-900 border-2 rounded-2xl p-5 min-w-12 shadow-2xl transition-all duration-200 hover:shadow-3xl',
        'hover:border-opacity-80',
        className,
      )}
      style={{ borderColor: color }}
    >
      {/* Top Badge */}
      <div className="flex justify-center -mt-6 mb-4">
        <div
          className="px-4 py-1 text-xs font-medium rounded-full border bg-zinc-950"
          style={{
            color: color,
            borderColor: `${color}40`,
          }}
        >
          {badge}
        </div>
      </div>

      {/* Icon Circle */}
      <div className="flex justify-center mb-4">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center border-[5px] shadow-inner"
          style={{
            borderColor: color,
            backgroundColor: `${color}15`,
          }}
        >
          <Icon className="w-10 h-10" style={{ color }} strokeWidth={2.25} />
        </div>
      </div>

      {/* Main Content */}
      <div className="text-center space-y-1.5">
        <div className="font-semibold text-lg leading-tight" style={{ color }}>
          {label}
        </div>

        {subLabel && <div className="text-sm text-zinc-400">{subLabel}</div>}

        {description && (
          <div className="text-xs text-zinc-500 line-clamp-2 mt-2">{description}</div>
        )}

        {group && (
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">{group}</div>
        )}
      </div>

      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-zinc-400 border-2 border-zinc-900"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-zinc-400 border-2 border-zinc-900"
      />
    </div>
  );
});

BaseNode.displayName = 'BaseNode';
