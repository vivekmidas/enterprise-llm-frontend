'use client';

import { useEffect, useState } from 'react';
import { DragEvent } from 'react';
import { Plus } from 'lucide-react';

export default function AgentSidebar() {
    const [agents, setAgents] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/agents`)
            .then(res => res.json())
            .then(data => {
                setAgents(data.agents || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const onDragStart = (event: DragEvent<HTMLDivElement>, agentName: string) => {
        event.dataTransfer.setData('application/reactflow', agentName);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="w-72 border-r border-gray-200 bg-white p-5 overflow-auto">
            <div className="flex items-center gap-2 mb-6">
                <Plus className="w-5 h-5 text-gray-700" />
                <h2 className="font-semibold text-lg text-gray-900">Agents Library</h2>
            </div>

            {loading ? (
                <p className="text-gray-500">Loading agents...</p>
            ) : (
                <div className="space-y-2">
                    {agents.map((agent) => (
                        <div
                            key={agent}
                            draggable
                            onDragStart={(e) => onDragStart(e, agent)}
                            className="group px-4 py-3 bg-white border border-gray-200 hover:border-blue-500 rounded-xl cursor-grab active:cursor-grabbing transition-all hover:shadow-sm"
                        >
                            <div className="font-medium text-gray-800 text-sm">{agent}</div>
                            <div className="text-xs text-gray-500 mt-1">Agent</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}