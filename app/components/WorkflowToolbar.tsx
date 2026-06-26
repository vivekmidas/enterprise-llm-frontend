'use client';

import { Download, Play, Save, SaveAll, CheckCircle, Loader2, Maximize2 } from 'lucide-react';

interface WorkflowToolbarProps {
  onValidate: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onGet: () => void;
  onExecute: () => void;
  onCenter: () => void;
  isExecuting?: boolean;
  status?: string;
}

export default function WorkflowToolbar({
  onValidate,
  onSave,
  onSaveAs,
  onGet,
  onExecute,
  onCenter,
  isExecuting,
  status,
}: WorkflowToolbarProps) {
  return (
    <div className="flex items-center gap-3">
      {status && (
        <div className="max-w-[240px] truncate text-xs text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-md font-medium" title={status}>
          {status}
        </div>
      )}
      <button
        onClick={onValidate}
        className="flex items-center gap-1.5 px-3.5 py-1.5 border border-amber-250 text-amber-700 bg-amber-50/50 hover:bg-amber-50 rounded-lg text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
      >
        <CheckCircle className="w-3.5 h-3.5" /> Validate
      </button>

      <button
        onClick={onCenter}
        className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-350 rounded-lg text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        title="Center/Fit graph view"
      >
        <Maximize2 className="w-3.5 h-3.5 text-slate-500" /> Center
      </button>
      
      <button
        onClick={onSaveAs}
        className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 text-slate-700 bg-white hover:bg-slate-55 hover:border-slate-300 rounded-lg text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
      >
        <SaveAll className="w-3.5 h-3.5 text-slate-500" /> Save As...
      </button>

      <button
        onClick={onSave}
        className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] hover:shadow-md active:scale-[0.98] cursor-pointer"
      >
        <Save className="w-3.5 h-3.5" /> Save
      </button>

      <button
        onClick={onExecute}
        disabled={isExecuting}
        className="flex items-center gap-1.5 px-4.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-450 rounded-lg text-xs font-bold text-white shadow-sm transition-all hover:scale-[1.02] hover:shadow-md active:scale-[0.98] cursor-pointer"
      >
        {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
        {isExecuting ? 'Executing...' : 'Run'}
      </button>
    </div>
  );
}
