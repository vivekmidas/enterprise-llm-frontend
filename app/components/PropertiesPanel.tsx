'use client';

import { Node } from 'reactflow';
import { X, Settings } from 'lucide-react';
import { AgentPropertyDefinition, PropertyValue } from './component-categoriees';

type NodeProperties = Record<string, PropertyValue>;
type NodeData = Record<string, PropertyValue | AgentPropertyDefinition[] | NodeProperties | undefined>;

interface PropertiesPanelProps {
    selectedNode: Node | null;
    onClose?: () => void;
    onUpdateNode?: (nodeId: string, newData: NodeData) => void;
}

export default function PropertiesPanel({
    selectedNode,
    onClose,
    onUpdateNode
}: PropertiesPanelProps) {

    const handleChange = (key: string, value: PropertyValue | AgentPropertyDefinition[] | NodeProperties) => {
        if (!selectedNode || !onUpdateNode) return;

        const newData = { ...(selectedNode.data as NodeData), [key]: value };
        onUpdateNode(selectedNode.id, newData);
    };

    const handleChanges = (changes: NodeData) => {
        if (!selectedNode || !onUpdateNode) return;

        const newData = { ...(selectedNode.data as NodeData), ...changes };
        onUpdateNode(selectedNode.id, newData);
    };

    const handlePropertyChange = (key: string, value: PropertyValue) => {
        if (!selectedNode || !onUpdateNode) return;

        const nodeData = selectedNode.data as NodeData;
        const properties = (nodeData.properties || {}) as NodeProperties;
        const newData = {
            ...nodeData,
            properties: {
                ...properties,
                [key]: value,
            },
        };

        onUpdateNode(selectedNode.id, newData);
    };

    const getPropertyValue = (properties: NodeProperties, field: AgentPropertyDefinition) => {
        if (properties[field.key] !== undefined) return properties[field.key];
        if (field.type === 'boolean') return false;
        if (field.multiple) return [];
        return '';
    };

    const renderPropertyField = (
        field: AgentPropertyDefinition,
        properties: NodeProperties,
    ) => {
        const value = getPropertyValue(properties, field);

        if (field.type === 'boolean') {
            return (
                <label key={field.key} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm">
                    <span className="font-medium text-gray-700">{field.label}</span>
                    <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(event) => handlePropertyChange(field.key, event.target.checked)}
                        className="h-4 w-4 accent-blue-600"
                    />
                </label>
            );
        }

        if (field.type === 'choice') {
            if (field.multiple) {
                return (
                    <div key={field.key}>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">{field.label}</label>
                        <select
                            multiple
                            value={Array.isArray(value) ? value.map(String) : []}
                            onChange={(event) => {
                                const values = Array.from(event.target.selectedOptions, (option) => option.value);
                                handlePropertyChange(field.key, values);
                            }}
                            className="h-28 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                        >
                            {(field.options || []).map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                );
            }

            return (
                <div key={field.key}>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">{field.label}</label>
                    <select
                        value={String(value)}
                        onChange={(event) => handlePropertyChange(field.key, event.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                    >
                        {(field.options || []).map((option) => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>
            );
        }

        if (field.type === 'textarea') {
            return (
                <div key={field.key}>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">{field.label}</label>
                    <textarea
                        value={String(value)}
                        placeholder={field.placeholder}
                        onChange={(event) => handlePropertyChange(field.key, event.target.value)}
                        className="h-28 w-full resize-y rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-blue-500"
                    />
                </div>
            );
        }

        return (
            <div key={field.key}>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">{field.label}</label>
                <input
                    type={field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : 'text'}
                    value={String(value)}
                    placeholder={field.placeholder}
                    onChange={(event) => handlePropertyChange(field.key, field.type === 'number' ? Number(event.target.value) : event.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
            </div>
        );
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

    const localData = selectedNode.data as NodeData;
    const propertySchema = Array.isArray(localData.propertySchema)
        ? localData.propertySchema as AgentPropertyDefinition[]
        : [];
    const properties = (localData.properties || {}) as NodeProperties;

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
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">NAME</label>
                    <input
                        type="text"
                        value={String(localData.name || localData.label || '')}
                        onChange={(e) => handleChanges({ name: e.target.value, label: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">DESCRIPTION</label>
                    <textarea
                        value={String(localData.description || '')}
                        onChange={(e) => handleChange('description', e.target.value)}
                        className="w-full h-24 border border-gray-300 rounded-lg px-4 py-3 text-sm resize-y focus:outline-none focus:border-blue-500"
                    />
                </div>

                {/* Group */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">GROUP</label>
                    <input
                        type="text"
                        value={String(localData.group || localData.category || '')}
                        onChange={(e) => handleChanges({ group: e.target.value, category: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                    />
                </div>

                {/* Icon */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">ICON</label>
                    <input
                        type="text"
                        value={String(localData.icon || '')}
                        onChange={(e) => handleChange('icon', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                    />
                </div>

                {/* Configuration */}
                <div>
                    <h4 className="font-medium text-gray-900 mb-3">Configuration</h4>

                    {propertySchema.length > 0 ? (
                        <div className="space-y-5">
                            {propertySchema.map((field) => renderPropertyField(field, properties))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No configurable properties for this node.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
