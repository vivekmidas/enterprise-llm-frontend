'use client';

import { Play, Save, SaveAll, CheckCircle } from 'lucide-react';

interface WorkflowToolbarProps {
    onSave: () => void;
    onExecute: () => void;
}

export default function WorkflowToolbar({ onSave, onExecute }: WorkflowToolbarProps) {
    return (
        <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> Validate
            </button>
            <button onClick={onSave} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-sm font-medium">
                <SaveAll className="w-4 h-4" /> Save As...
            </button>
            <button onClick={onSave} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium">
                <Save className="w-4 h-4" /> Save
            </button>
            <button onClick={onExecute} className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium">
                <Play className="w-4 h-4" /> Execute
            </button>
        </div>
    );
}