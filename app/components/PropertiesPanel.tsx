'use client';

import { Node } from 'reactflow';
import { X, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PropertiesPanelProps {
    selectedNode: Node | null;
    onClose?: () => void;
    onUpdateNode?: (nodeId: string, newData: any) => void;
}

export default function PropertiesPanel({
    selectedNode,
    onClose,
    onUpdateNode
}: PropertiesPanelProps) {

    const [localData, setLocalData] = useState<any>({});

    // Sync with selected node
    useEffect(() => {
        if (selectedNode) {
            setLocalData(selectedNode.data);
        }
    }, [selectedNode]);

    const handleChange = (key: string, value: any) => {
        if (!selectedNode || !onUpdateNode) return;

        const newData = { ...localData, [key]: value };
        setLocalData(newData);

        // Update React Flow node in real-time
        onUpdateNode(selectedNode.id, newData);
    };

    if (!selectedNode) {
        return (
            <div className="w-80 border-l border-gray-200 bg-white p-6">
                <div className="text-center text-gray-400 mt-10">
                    <Settings className="w-8 h-8 mx-auto mb-3" />
                    <p>Select a node to edit properties</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-80 border-l border-gray-200 bg-white overflow-auto">
            {/* Header */}
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between sticky top-0">
                <div className="font-semibold text-gray-900 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Node Properties
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-5 space-y-6">
                {/* Label */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">LABEL</label>
                    <input
                        type="text"
                        value={localData.label || ''}
                        onChange={(e) => handleChange('label', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                    />
                </div>

                {/* Category */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">CATEGORY</label>
                    <input
                        type="text"
                        value={localData.category || ''}
                        onChange={(e) => handleChange('category', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                    />
                </div>

                {/* Configuration */}
                <div>
                    <h4 className="font-medium text-gray-900 mb-3">Configuration</h4>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Temperature</label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={localData.temperature || 0.7}
                                onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                                className="w-full accent-blue-600"
                            />
                            <div className="text-right text-xs text-gray-500 mt-1">
                                {localData.temperature || 0.7}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Max Tokens</label>
                            <input
                                type="number"
                                value={localData.maxTokens || 1024}
                                onChange={(e) => handleChange('maxTokens', parseInt(e.target.value))}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Custom Config (JSON)</label>
                            <textarea
                                value={localData.customConfig || '{\n  "score_threshold": 0.65\n}'}
                                onChange={(e) => handleChange('customConfig', e.target.value)}
                                className="w-full h-32 border border-gray-300 rounded-lg px-4 py-3 text-sm font-mono resize-y"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}