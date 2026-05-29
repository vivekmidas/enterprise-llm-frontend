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
} from 'lucide-react';
import { AgentIcon, componentCategories, getComponentCategory } from './component-categoriees';

const iconMap: Record<AgentIcon, ComponentType<{ className?: string }>> = {
  shield: Shield,
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
  'alert-circle': AlertTriangle, // fallback
};

/** Maps node groups to visual styles defined in component-categories */
export default function CustomNode({ data, selected }: NodeProps) {
  const group = getComponentCategory(data.group || data.category);
  const category = componentCategories[group];
  const Icon = iconMap[data.icon as AgentIcon] || iconMap[category.icon];

  return (
    <div
      className={`bg-white border-2 shadow-sm hover:shadow-md transition-all rounded-lg p-2 min-w-[48 px] max-w-40 ${category.borderColor} ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
    >
      <div className="flex items-start gap-1">
        <div className={`rounded-md p-1 ${category.bgColor}`}>
          <Icon className={`h-5 w-5 ${category.textColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          {/* <div className="font-semibold text-gray-900 text-[15px] leading-tight">{data.name || data.label}</div> */}
          <div className="mt-1 flex items-center gap-1">
            <div className={`text-xs font-medium ${category.textColor}`}>{group}</div>
            {data.executionStatus && (
              <div
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${data.executionStatus === 'success'
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

      {data.group !== 'Start' && (
        /* Standard input handle for all nodes except Start */
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-white border-2 border-gray-400"
        />
      )}

      /* Standard output handle for linear nodes. Hidden for Condition (multi-output) and End nodes. */
      {data.group !== 'End' && data.group !== 'Condition' && (
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-white border-2 border-gray-400"
        />
      )}

      /* Specialized handles for the Condition node to support Success/Failure branching */
      {data.group === 'Condition' && (
        <>
          <Handle
            type="source"
            id="success"
            position={Position.Right}
            style={{
              top: '30%',
              backgroundColor: '#10b981',
              width: 12,
              height: 12,
              border: '2px solid white',
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
              width: 12,
              height: 12,
              border: '2px solid white',
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
