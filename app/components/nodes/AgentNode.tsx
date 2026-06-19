import React from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { Play, Bot, MessageSquare } from 'lucide-react';

// ✅ Only define the DATA shape (this is what you had before)
export type CustomNodeData = {
  [key: string]: unknown;
  label: string;
  model?: string;
  icon?: string | React.ReactNode;
  subIcon?: string | React.ReactNode;
  variant?: 'start' | 'detector' | 'agent';
};

// Custom Node Component
const CustomNode = ({ data, selected }: NodeProps<Node<CustomNodeData>>) => {
  const { label, model, icon, subIcon, variant = 'agent' } = data;

  if (variant === 'start') {
    return (
      <div className="px-4 py-3 bg-emerald-500 rounded-2xl shadow-xl border border-emerald-400 text-white flex items-center gap-3 min-w-[140px]">
        <div className="w-9 h-9 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
          <Play className="w-5 h-5" fill="white" />
        </div>
        <div className="font-semibold text-lg">Start</div>
        <Handle type="source" position={Position.Right} className="w-3 h-3 bg-white" />
      </div>
    );
  }

  if (variant === 'detector') {
    return (
      <div className="bg-[#2a1a2e] border border-[#c026d3] rounded-3xl shadow-2xl p-1 min-w-[260px]">
        <div className="bg-[#3f2a44] rounded-[22px] p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-pink-500 rounded-2xl flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-white font-medium text-lg">{label}</div>
            {model && (
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-[10px] font-bold">
                  A
                </div>
                <span className="text-blue-400 text-sm font-medium">{model}</span>
              </div>
            )}
          </div>
        </div>
        <Handle type="target" position={Position.Left} className="w-3 h-3 bg-pink-400" />
        <Handle type="source" position={Position.Right} className="w-3 h-3 bg-pink-400" id="0" />
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-pink-400 -mt-6"
          id="1"
        />
      </div>
    );
  }

  // Agent Nodes (Technical / Sales)
  return (
    <div className="bg-[#0f1b2e] border border-[#1e90ff] rounded-3xl shadow-2xl overflow-hidden min-w-[240px]">
      {/* Header */}
      <div className="bg-[#1e3a5f] px-5 py-3 flex items-center gap-3 border-b border-[#1e90ff]/30">
        <div className="w-9 h-9 bg-cyan-400 rounded-2xl flex items-center justify-center">
          <Bot className="w-6 h-6 text-[#0f1b2e]" />
        </div>
        <div className="text-white font-semibold text-lg">{label}</div>
      </div>

      {/* Model Info */}
      <div className="p-4 flex items-center gap-3">
        {subIcon && <div className="text-2xl">{subIcon}</div>}

        {model && (
          <div className="bg-zinc-800 text-white text-sm px-3 py-1.5 rounded-2xl flex items-center gap-2">
            {model}
          </div>
        )}
      </div>

      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-cyan-400" />
    </div>
  );
};

export default CustomNode;
