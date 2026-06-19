'use client';

import { AlertCircle, CheckCircle, Clock, X } from 'lucide-react';

import type { WorkflowTraceStep } from '../types';

type ExecutionTracePanelProps = {
  trace: WorkflowTraceStep[];
  onClear: () => void;
};

export default function ExecutionTracePanel({ trace, onClear }: ExecutionTracePanelProps) {
  if (trace.length === 0) return null;

  return (
    <div className="absolute bottom-4 left-4 right-4 z-20 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl pointer-events-auto flex flex-col">
      <div className="flex items-center justify-between p-3 border-b bg-gray-50 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-blue-500" />
          <h3 className="font-semibold text-sm text-gray-700">Agent Execution Trace</h3>
          <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full text-gray-600">
            {trace.length} steps
          </span>
        </div>
        <button
          onClick={onClear}
          className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
        >
          <X size={16} />
        </button>
      </div>
      <div className="p-2 space-y-1">
        {trace.map((step) => (
          <div
            key={step.id}
            className="group p-2 hover:bg-gray-50 rounded border border-transparent hover:border-gray-100 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {step.status === 'success' ? (
                  <CheckCircle size={14} className="text-green-500" />
                ) : (
                  <AlertCircle size={14} className="text-red-500" />
                )}
                <span className="font-bold text-xs text-black">{step.nodeName}</span>
                <span className="text-[10px] text-gray-400 uppercase font-medium">
                  {step.group}
                </span>
              </div>
              <span className="text-[10px] font-mono text-gray-400">{step.durationMs}ms</span>
            </div>
            {step.error && (
              <p className="mt-1 text-[11px] text-red-600 bg-red-50 p-1 rounded border border-red-100">
                {step.error}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
