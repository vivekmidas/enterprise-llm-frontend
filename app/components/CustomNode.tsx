'use client';

import { Handle, Position, NodeProps } from 'reactflow';
import { Shield, Bot, UserCog, MessageSquare, CheckCircle, AlertTriangle, PlayCircle } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  Guardrails: <Shield className="w-5 h-5 text-red-500" />,
  Validation: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  Context: <UserCog className="w-5 h-5 text-blue-500" />,
  LLM: <Bot className="w-5 h-5 text-purple-600" />,
  Output: <CheckCircle className="w-5 h-5 text-emerald-500" />,
  Trigger: <PlayCircle className="w-5 h-5 text-emerald-600" />,
  Custom: <MessageSquare className="w-5 h-5 text-gray-500" />,
};

export default function CustomNode({ data, selected }: NodeProps) {
  const category = data.category || 'Agent';
  const icon = iconMap[category] || iconMap.Custom;

  return (
    <div className={`bg-white border-2 shadow-sm hover:shadow-md transition-all rounded-2xl p-4 min-w-[200px] ${selected ? 'border-blue-600 shadow-blue-200' : 'border-gray-200'}`}>
      <div className="flex items-center gap-3">
        <div className="text-xl">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 text-[15px] leading-tight">{data.label}</div>
          <div className="text-xs text-gray-500 mt-0.5">{category}</div>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-white border-2 border-gray-400"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-white border-2 border-gray-400"
      />
    </div>
  );
}