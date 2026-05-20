'use client';

import type { ComponentType } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Shield, Bot, UserCog, MessageSquare, CheckCircle, AlertTriangle, PlayCircle, XCircle, Database } from 'lucide-react';
import { AgentIcon, componentCategories, getComponentCategory } from './component-categoriees';

const iconMap: Record<AgentIcon, ComponentType<{ className?: string }>> = {
  shield: Shield,
  'alert-triangle': AlertTriangle,
  'user-cog': UserCog,
  bot: Bot,
  'check-circle': CheckCircle,
  'play-circle': PlayCircle,
  'message-square': MessageSquare,
  'x-circle': XCircle,
  database: Database,
};

export default function CustomNode({ data, selected }: NodeProps) {
  const group = getComponentCategory(data.group || data.category);
  const category = componentCategories[group];
  const Icon = iconMap[data.icon as AgentIcon] || iconMap[category.icon];

  return (
    <div className={`bg-white border-2 shadow-sm hover:shadow-md transition-all rounded-lg p-4 min-w-[220px] max-w-[280px] ${category.borderColor} ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}>
      <div className="flex items-start gap-3">
        <div className={`rounded-md p-1.5 ${category.bgColor}`}>
          <Icon className={`h-5 w-5 ${category.textColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 text-[15px] leading-tight">{data.name || data.label}</div>
          <div className="text-xs text-gray-500 mt-1 leading-snug">{data.description}</div>
          <div className="mt-2 flex items-center gap-2">
            <div className={`text-xs font-medium ${category.textColor}`}>{group}</div>
            {data.executionStatus && (
              <div className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                data.executionStatus === 'success'
                  ? 'bg-emerald-100 text-emerald-700'
                  : data.executionStatus === 'error'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-blue-100 text-blue-700'
              }`}>
                {data.executionStatus}
              </div>
            )}
          </div>
        </div>
      </div>

      {data.group !== 'Start' && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-white border-2 border-gray-400"
        />
      )}
      {data.group !== 'End' && (
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-white border-2 border-gray-400"
        />
      )}
    </div>
  );
}
