/**
 * CustomNode - A specialized ReactFlow node component.
 * Handles dynamic icon rendering, category-based styling,
 * and conditional handle (port) visibility for branching logic.
 */
'use client';

import type { ComponentType } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import {
  Shield,
  Bot,
  UserCog,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  PlayCircle,
  XCircle,
  Database,
  Workflow,
  Clock,
  Brain,
  BrainCircuit,
  Cloud,
  KeyRound,
  Mail,
  Megaphone,
  Network,
  Fence,
} from 'lucide-react';
import { getCategory } from './component-categoriees';

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  shield: Shield,
  brain: Brain,
  cloud: Cloud,
  key: KeyRound,
  fence: Fence,
  mail: Mail,
  megaphone: Megaphone,
  network: Network,
  'brain-circuit': BrainCircuit,
  'alert-triangle': AlertTriangle,
  'user-cog': UserCog,
  bot: Bot,
  clock: Clock,
  'check-circle': CheckCircle,
  'play-circle': PlayCircle,
  'message-square': MessageSquare,
  'x-circle': XCircle,
  database: Database,
  workflow: Workflow,
  'alert-circle': AlertTriangle,
};

const getCategoryColors = (color: string) => {
  const styles: Record<string, { border: string; text: string; bg: string }> = {
    emerald: { border: 'border-emerald-600', text: 'text-emerald-700', bg: 'bg-emerald-50' },
    red: { border: 'border-red-500', text: 'text-red-600', bg: 'bg-red-50' },
    amber: { border: 'border-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' },
    blue: { border: 'border-blue-500', text: 'text-blue-600', bg: 'bg-blue-50' },
    purple: { border: 'border-purple-600', text: 'text-purple-600', bg: 'bg-purple-50' },
    gray: { border: 'border-gray-500', text: 'text-gray-700', bg: 'bg-gray-50' },
    cyan: { border: 'border-cyan-500', text: 'text-cyan-700', bg: 'bg-cyan-50' },
    indigo: { border: 'border-indigo-500', text: 'text-indigo-700', bg: 'bg-indigo-50' },
    orange: { border: 'border-orange-500', text: 'text-orange-700', bg: 'bg-orange-50' },
    yellow: { border: 'border-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50' },
  };
  return styles[color] || styles.gray;
};

/** Maps node groups to visual styles defined in component-categories */
export default function CustomNode({ data, selected }: NodeProps) {
  const category = getCategory(data.category || data.group);
  const Icon = iconMap[data.icon as string] || iconMap[category.icon] || Bot;

  const customColor = data.color as string | undefined;
  const isKnownColor =
    customColor &&
    [
      'emerald',
      'red',
      'amber',
      'blue',
      'purple',
      'gray',
      'cyan',
      'indigo',
      'orange',
      'yellow',
    ].includes(customColor);

  const resolvedCategoryColor = isKnownColor ? customColor : category.color;
  const colors = getCategoryColors(resolvedCategoryColor);

  const isCustomStyle = customColor && !isKnownColor;

  const borderStyle = isCustomStyle ? { borderColor: customColor } : {};
  const iconBgStyle = isCustomStyle
    ? { backgroundColor: `color-mix(in srgb, ${customColor} 10%, transparent)` }
    : {};
  const iconStyle = isCustomStyle ? { color: customColor } : {};
  const textStyle = isCustomStyle ? { color: customColor } : {};

  const categoryName = category?.name || String(data.category || data.group || '');
  const isTrigger =
    data.node_type.toUpperCase() === 'TRIGGER' ||
    data.nodeType === 'trigger' ||
    categoryName === 'Trigger' ||
    data.name === 'Start';

  return (
    <div
      className={`bg-white border-2 shadow-sm hover:shadow-md transition-all rounded-lg p-2 min-w-[140px] max-w-52 select-none ${isCustomStyle ? '' : colors.border} ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
      style={{ cursor: 'grab', ...borderStyle }} // Visual feedback
    >
      <div className="flex items-start gap-1">
        <div className={`rounded-md p-1 ${isCustomStyle ? '' : colors.bg}`} style={iconBgStyle}>
          <Icon className={`h-5 w-5 ${isCustomStyle ? '' : colors.text}`} style={iconStyle} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 text-[15px] leading-tight truncate">
            {data.label}
          </div>
          <div className="mt-1 flex items-center gap-1">
            <div
              className={`text-xs font-medium ${isCustomStyle ? '' : colors.text}`}
              style={textStyle}
            >
              {data.node_type}
            </div>
            {data.executionStatus && (
              <div
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  data.executionStatus === 'success'
                    ? 'bg-emerald-100 text-emerald-700'
                    : data.executionStatus === 'error'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-blue-100 text-blue-700'
                }`}
              >
                {data.executionStatus}
              </div>
            )}
          </div>
        </div>
      </div>

      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-4 h-4 bg-blue-600 border-2 border-white shadow-md hover:scale-125 transition-transform !z-50 !pointer-events-auto cursor-crosshair"
        />
      )}

      {/* Standard output handle for linear nodes. Hidden for Condition (multi-output) and End nodes. */}
      {categoryName !== 'End' && categoryName !== 'Condition' && data.name !== 'End' && (
        <Handle
          type="source"
          position={Position.Right}
          className="w-4 h-4 bg-blue-600 border-2 border-white shadow-md hover:scale-125 transition-transform !z-50 !pointer-events-auto cursor-crosshair"
        />
      )}

      {/* Specialized handles for the Condition node to support Success/Failure branching */}
      {(categoryName === 'Condition' || data.name === 'Condition') && (
        <>
          <Handle
            type="source"
            id="success"
            position={Position.Right}
            style={{
              top: '30%',
              backgroundColor: '#10b981',
              width: 14,
              height: 12,
              border: '2px solid white',
              zIndex: 50,
              pointerEvents: 'auto',
            }}
          />
          <div className="absolute right-4 top-[30%] -translate-y-1/2 text-[9px] font-bold text-emerald-600 uppercase">
            Success
          </div>

          <Handle
            type="source"
            id="failure"
            position={Position.Right}
            style={{
              top: '70%',
              backgroundColor: '#ef4444',
              width: 14,
              height: 12,
              border: '2px solid white',
              zIndex: 50,
              pointerEvents: 'auto',
            }}
          />
          <div className="absolute right-4 top-[70%] -translate-y-1/2 text-[9px] font-bold text-red-600 uppercase">
            Failure
          </div>
        </>
      )}
    </div>
  );
}
