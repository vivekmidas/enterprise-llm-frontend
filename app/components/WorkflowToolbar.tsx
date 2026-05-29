'use client';

import { Download, Play, Save, SaveAll, CheckCircle } from 'lucide-react';

interface WorkflowToolbarProps {
  onValidate: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onGet: () => void;
  onExecute: () => void;
  isExecuting?: boolean;
  status?: string;
}

export default function WorkflowToolbar({
  onValidate,
  onSave,
  onSaveAs,
  onGet,
  onExecute,
  isExecuting,
  status,
}: WorkflowToolbarProps) {
  return (
    <div className="flex items-center gap-3">
      {status && <div className="max-w-72 truncate text-sm text-gray-600">{status}</div>}
      <button
        onClick={onValidate}
        className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-sm font-medium text-white"
      >
        <CheckCircle className="w-4 h-4" /> Validate
      </button>
      <button
        onClick={onGet}
        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-800 rounded-lg text-sm font-medium text-white"
      >
        <Download className="w-4 h-4" /> Get
      </button>
      <button
        onClick={onSaveAs}
        className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-sm font-medium text-white"
      >
        <SaveAll className="w-4 h-4" /> Save As...
      </button>
      <button
        onClick={onSave}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium text-white"
      >
        <Save className="w-4 h-4" /> Save
      </button>
      <button
        onClick={onExecute}
        disabled={isExecuting}
        className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300 rounded-lg text-sm font-medium text-white"
      >
        <Play className="w-4 h-4" /> {isExecuting ? 'Running' : 'Execute'}
      </button>
    </div>
  );
}
