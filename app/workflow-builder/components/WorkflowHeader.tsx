'use client';

import { Edit2, Trash2, Plus } from 'lucide-react';

import WorkflowToolbar from '../../components/WorkflowToolbar';

type WorkflowHeaderProps = {
  agentId: string;
  agentName: string;
  agentVersion: number | null;
  agentDescription: string;
  isAgentEnabled: boolean;
  isDirty: boolean;
  isEditingName: boolean;
  isExecuting: boolean;
  status: string;
  canDelete: boolean;
  onAgentNameChange: (name: string) => void;
  onAgentEnabledChange: (enabled: boolean) => void;
  onEditingNameChange: (isEditing: boolean) => void;
  onDirtyChange: (isDirty: boolean) => void;
  onDelete: () => void;
  onValidate: () => boolean;
  onSave: () => Promise<void>;
  onSaveAs: () => Promise<void>;
  onGet: () => Promise<void>;
  onExecute: () => Promise<void>;
  onCenter: () => void;
  onNewAgent: () => void;
};

export default function WorkflowHeader({
  agentId,
  agentName,
  agentVersion,
  isAgentEnabled,
  isDirty,
  isEditingName,
  isExecuting,
  status,
  canDelete,
  agentDescription,
  onAgentNameChange,
  onAgentEnabledChange,
  onEditingNameChange,
  onDirtyChange,
  onDelete,
  onValidate,
  onSave,
  onSaveAs,
  onGet,
  onExecute,
  onCenter,
  onNewAgent,
}: WorkflowHeaderProps) {
  return (
    <>
      <div className="h-16 border-b border-slate-100 bg-white flex items-center px-6 justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <input
                type="text"
                value={agentName}
                onChange={(e) => {
                  onAgentNameChange(e.target.value);
                  onDirtyChange(true);
                }}
                onBlur={() => onEditingNameChange(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onEditingNameChange(false);
                }}
                autoFocus
                className="text-xl font-bold text-slate-800 border-b-2 border-indigo-600 focus:outline-none bg-transparent py-0.5 px-1 max-w-[250px]"
              />
            ) : (
              <>
                <div
                  onClick={() => onEditingNameChange(true)}
                  className="flex items-center gap-2 cursor-pointer group hover:bg-slate-50 rounded-lg py-1 px-2 transition-all -ml-2"
                  title="Click to rename workflow"
                >
                  <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                    {agentName || 'Unnamed Workflow'}
                  </h1>
                  <Edit2
                    size={14}
                    className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </>
            )}

            {/* New Workflow Button */}
            <button
              onClick={onNewAgent}
              className="flex items-center justify-center p-1.5 ml-1 rounded-lg border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 transition-all text-slate-650 cursor-pointer shadow-sm hover:scale-[1.05] active:scale-[0.95]"
              title="New Workflow"
            >
              <Plus size={13} className="text-slate-500 font-bold" />
            </button>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-3">
            {agentId && <span className="font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{agentId}</span>}
            <span className="text-slate-300">•</span>
            <span className="bg-indigo-50 px-2.5 py-0.5 rounded text-indigo-700 font-mono text-[10px] font-bold border border-indigo-100">
              v{agentVersion ?? 1}
            </span>
            <span className="text-slate-300">•</span>

            {isDirty ? (
              <span className="flex items-center gap-1.5 text-[10px] text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 font-semibold animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Unsaved changes
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Saved
              </span>
            )}

            <span className="text-slate-300">•</span>

            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isAgentEnabled}
                onChange={(e) => {
                  onAgentEnabledChange(e.target.checked);
                  onDirtyChange(true);
                }}
                className="sr-only peer"
              />
              <div className="relative w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600"></div>
              <span className="ms-2 text-xs font-semibold text-slate-600">
                {isAgentEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>

            {canDelete && (
              <>
                <span className="text-slate-300">•</span>
                <button
                  onClick={onDelete}
                  className="flex items-center gap-1 text-rose-600 hover:text-rose-700 transition-colors px-2 py-1 rounded-md hover:bg-rose-50 border border-transparent hover:border-rose-100"
                  title="Delete Workflow"
                >
                  <Trash2 size={13} />
                  <span className="font-semibold">Delete</span>
                </button>
              </>
            )}
          </div>
        </div>

        <WorkflowToolbar
          onValidate={onValidate}
          onSave={onSave}
          onSaveAs={onSaveAs}
          onGet={onGet}
          onExecute={onExecute}
          isExecuting={isExecuting}
          status={status}
          onCenter={onCenter}
        />
        {/* <div className="text-sm ">{agentDescription}</div> */}
      </div>
    </>
  );
}
