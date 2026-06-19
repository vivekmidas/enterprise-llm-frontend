'use client';

import { Edit2, Trash2 } from 'lucide-react';

import WorkflowToolbar from '../../components/WorkflowToolbar';

type WorkflowHeaderProps = {
  agentId: string;
  agentName: string;
  agentVersion: number | null;
  agentDescription:string;
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
}: WorkflowHeaderProps) {
  return (
    <>
    <div className="h-16 border-b bg-white flex items-center px-6 justify-between shadow-sm">
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
              className="text-2xl font-semibold text-black border-b-2 border-blue-500 focus:outline-none bg-transparent py-0.5 px-1 max-w-[250px]"
            />
          ) : (
           <>
            <div
              onClick={() => onEditingNameChange(true)}
              className="flex items-center gap-2 cursor-pointer group hover:bg-gray-50 rounded-lg py-1 px-2 transition-all -ml-2"
              title="Click to rename workflow"
            >
              <h1 className="text-2xl font-semibold text-black">
                {agentName || 'Unnamed Workflow'}
              </h1>
              <Edit2
                size={16}
                className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
           
            </>
          )}
        </div>

        <div className="text-sm text-gray-500 flex items-center gap-3">
          {agentId && <span className="font-mono text-gray-400">{agentId}</span>}
          <span className="text-gray-300">•</span>
          <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-mono text-xs">
            v{agentVersion ?? 1}
          </span>
          <span className="text-gray-300">•</span>

          {isDirty ? (
            <span className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 font-medium animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Unsaved changes
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-200 font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Saved
            </span>
          )}

          <span className="text-gray-300">•</span>

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
            <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
            <span className="ms-2 text-sm font-medium text-gray-600">
              {isAgentEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </label>

          {canDelete && (
            <>
              <span className="text-gray-300">•</span>
              <button
                onClick={onDelete}
                className="flex items-center gap-1.5 text-red-500 hover:text-red-700 transition-colors px-2 py-1 rounded hover:bg-red-50"
                title="Delete Workflow"
              >
                <Trash2 size={16} />
                <span className="font-medium">Delete</span>
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
      />
      {/* <div className="text-sm ">{agentDescription}</div> */}
    </div>
     
     </>
  );
}
