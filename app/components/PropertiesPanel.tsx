'use client';

import { useState } from 'react';
import { Node } from 'reactflow';
import { X, Settings, Save, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { AgentPropertyDefinition, PropertyValue } from './component-categoriees';

/** Type representing agent-specific configuration values */
type NodeProperties = Record<string, PropertyValue>;
/** Type for the generic node data object stored in ReactFlow */
type NodeData = Record<
  string,
  PropertyValue | AgentPropertyDefinition[] | NodeProperties | undefined
>;

interface PropertiesPanelProps {
  /** The ReactFlow node currently selected on the canvas */
  selectedNode: Node | null;
  /** Callback fired when the close button is clicked */
  onClose?: () => void;
  /** Callback to propagate data changes back to the workflow state */
  onUpdateNode?: (nodeId: string, newData: NodeData) => void;
  /** Callback for global save action */
  onSave?: () => void;
}

/**
 * PropertiesPanel - Sidebar component for editing agent node configurations.
 *
 * It dynamically renders form fields based on the node's `propertySchema`
 * and allows editing basic metadata like name and description.
 */
export default function PropertiesPanel({
  selectedNode,
  onClose,
  onUpdateNode,
  onSave,
}: PropertiesPanelProps) {
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Updates a nested property inside the 'properties' bag.
   * Used for agent-specific configurations like API keys, URLs, etc.
   */
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

  /**
   * Saves the current node's configuration to the global registry (catalog).
   * This updates the master definition for this node type in the database.
   */
  const handleSaveToRegistry = async () => {
    if (!selectedNode) return;

    setIsSaving(true);
    try {
      const nodeData = selectedNode.data as any;
      // Ensure property_schema is formatted correctly for the backend
      const payload = {
        ...nodeData,
        property_schema: nodeData.property_schema || nodeData.propertySchema,
      };
      await api.updateNode(payload);
      if (onSave) onSave();
    } catch (error) {
      console.error('Failed to update node registry:', error);
    } finally {
      setIsSaving(false);
    }
  };

  /** Helper to safely retrieve current value or appropriate default for the field type */
  const getPropertyValue = (properties: NodeProperties, field: AgentPropertyDefinition) => {
    if (properties[field.key] !== undefined) return properties[field.key];
    if (field.type === 'boolean') return false;
    if (field.multiple) return [];
    return '';
  };

  /** Renders the appropriate UI input based on the field definition from the agent schema */
  const renderPropertyField = (field: AgentPropertyDefinition, properties: NodeProperties) => {
    const value = getPropertyValue(properties, field);

    // Boolean Toggle
    if (field.type === 'boolean') {
      return (
        <label
          key={field.key}
          className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm"
        >
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

    // Choice Selection
    if (field.type === 'choice') {
      // Multi-select mode
      if (field.multiple) {
        return (
          <div key={field.key}>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">{field.label}</label>
            <select
              multiple
              value={Array.isArray(value) ? value.map(String) : []}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                const values = Array.from(event.target.selectedOptions, (option) => option.value);
                handlePropertyChange(field.key, values);
              }}
              className="h-28 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              {(field.options || []).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );
      }

      // Single dropdown mode
      return (
        <div key={field.key}>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">{field.label}</label>
          <select
            value={String(value)}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
              handlePropertyChange(field.key, event.target.value)
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
          >
            {(field.options || []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );
    }

    // Multiline text area
    if (field.type === 'textarea') {
      return (
        <div key={field.key}>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">{field.label}</label>
          <textarea
            value={String(value)}
            placeholder={field.placeholder}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
              handlePropertyChange(field.key, event.target.value)
            }
            className="h-28 w-full resize-y rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-sm bg-white text-gray-900 focus:outline-none focus:border-blue-500"
          />
        </div>
      );
    }

    // Standard inputs: text, password, number
    return (
      <div key={field.key}>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">{field.label}</label>
        <input
          type={
            field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : 'text'
          }
          value={String(value ?? '')}
          placeholder={field.placeholder}
          onChange={(event) =>
            handlePropertyChange(
              field.key,
              field.type === 'number' ? Number(event.target.value) : event.target.value,
            )
          }
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:border-blue-500"
        />
      </div>
    );
  };

  // Placeholder state when no node is selected
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
  const rawSchema = (localData.propertySchema || localData.property_schema) as any;
  const propertySchema: AgentPropertyDefinition[] = (
    Array.isArray(rawSchema) ? rawSchema : []
  ).filter((f: any) => typeof f === 'object' && f !== null);

  const properties = (localData.properties || {}) as NodeProperties;

  return (
    <div className="w-80 border-l border-gray-200 bg-white flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 flex items-center justify-between shrink-0">
        <div className="font-semibold text-gray-900 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Node Properties
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-5 space-y-6">
        {propertySchema.length > 0 ? (
          <div className="space-y-5">
            {propertySchema.map((field) => renderPropertyField(field, properties))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400">
            <Settings className="w-8 h-8 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No configurable properties for this node.</p>
          </div>
        )}
      </div>

      {/* Footer - Save Button */}
      {(onSave || selectedNode) && (
        <div className="p-4 border-t bg-gray-50 shrink-0">
          <button
            onClick={handleSaveToRegistry}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg text-sm font-medium text-white transition-colors shadow-sm"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Updating Registry...' : 'Save Properties'}
          </button>
        </div>
      )}
    </div>
  );
}
