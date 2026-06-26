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
    <div className="absolute bottom-4 left-4 z-20 w-80 max-h-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl pointer-events-auto flex flex-col transition-all animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Console Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-55 sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-indigo-500 animate-[pulse_2s_infinite]" />
          <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Run Log</h3>
          <span className="text-[9px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full text-slate-500 font-bold font-mono">
            {trace.length} steps
          </span>
        </div>
        <button
          onClick={onClear}
          className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
          title="Clear Logs"
        >
          <X size={14} />
        </button>
      </div>

      {/* Trace Step Rows */}
      <div className="p-2.5 overflow-y-auto custom-scrollbar flex-1 space-y-1 bg-slate-50/20">
        {trace.map((step) => (
          <div
            key={step.id}
            className="group p-2 bg-white hover:bg-slate-50 rounded-lg border border-slate-150 transition-all hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-2 min-w-0">
                {step.status === 'success' ? (
                  <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle size={13} className="text-rose-500 shrink-0" />
                )}
                <span className="font-semibold text-xs text-slate-700 truncate">{step.nodeName}</span>
                <span className="text-[8px] text-slate-400 font-bold bg-slate-100 px-1 py-0.5 rounded border border-slate-150 shrink-0 uppercase tracking-wider">
                  {step.group}
                </span>
              </div>
              <span className="text-[9px] font-mono text-slate-400 shrink-0 font-medium">{step.durationMs}ms</span>
            </div>
            
            {step.error && (
              <p className="mt-1.5 text-[10px] text-rose-600 bg-rose-50 border border-rose-100 p-2 rounded-lg font-mono break-words leading-relaxed">
                {step.error}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
