'use client';

import { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { X, Settings, Save, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { AgentPropertyDefinition, PropertyValue } from './component-categoriees';
// Assuming AgentPropertyDefinition and PropertyValue are defined in component-categoriees.ts
// If not, you would define them here:
// export type PropertyValue = string | number | boolean | string[] | undefined;
// export interface AgentPropertyDefinition {
//   key: string;
//   label: string;
//   type: 'string' | 'number' | 'boolean' | 'choice' | 'textarea' | 'password' | 'credential';
//   placeholder?: string;
//   default?: PropertyValue;
//   options?: string[]; // For 'choice' type
//   multiple?: boolean; // For 'choice' type
//   description?: string;
//   credentialType?: string; // New field for 'credential' type
// }

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
  /** Callback fired when the close button is clicked (non-optional) */
  onClose: () => void;
  /** Callback to propagate data changes back to the workflow state (local ReactFlow update only) */
  onUpdateNode: (nodeId: string, newData: NodeData) => void;
  /** Callback for global save action */
  onSave?: () => void;
  /** The ID of the current workflow (agent) */
  workflowId?: string;
  /** Callback to explicitly save instance-specific properties to the backend */
  onSaveInstanceProperties: (nodeId: string, properties: NodeProperties) => Promise<void>;
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
  onUpdateNode, // Keep original name, but its behavior is now just local state update
  onSaveInstanceProperties, // New prop for explicit instance property saving
  onSave,
  workflowId,
}: PropertiesPanelProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [showAuthForm, setShowAuthForm] = useState<string | null>(null);
  const [newConn, setNewConn] = useState({ name: '', clientId: '', clientSecret: '' });
  const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [viewMode, setViewMode] = useState<'config' | 'contract'>('config');

  // Local state for fetched contracts and properties from API
  const [inputContract, setInputContract] = useState<any>({});
  const [outputContract, setOutputContract] = useState<any>({});
  const [propertySchema, setPropertySchema] = useState<AgentPropertyDefinition[]>([]);
  const [properties, setProperties] = useState<NodeProperties>({});

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const data = await api.getProviders();
        setProviders(data || []);
      } catch (err) {
        console.error('Failed to load OAuth providers', err);
      }
    };
    fetchProviders();
  }, []);

  const handleStartAuth = (provider: string) => {
    const providerKey = provider || selectedProvider;
    const url = `/auth/${providerKey}/connect/?client_id=${newConn.clientId}&client_secret=${newConn.clientSecret}&name=${encodeURIComponent(newConn.name)}`;
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(url, 'auth-popup', `width=${width},height=${height},left=${left},top=${top}`);
  };

  // Add this useEffect to PropertiesPanel.tsx
  useEffect(() => {
    console.log('PropertiesPanel: selectedNode changed', selectedNode);
    if (selectedNode) {
      const localData = selectedNode.data as NodeData;

      // Fetch full details including contracts from the API
      api
        .getAgentNodeProperties(workflowId || '', selectedNode.id)
        .then((res) => {
          if (!res) return;
          // Ensure that state variables are set to objects/arrays even if API returns null/undefined
          setInputContract(res?.input_contract || {});
          setOutputContract(res?.output_contract || {});
          setPropertySchema(res?.property_schema || []);
          setProperties(res?.properties || {});
        })
        .catch((err) => console.error('Failed to fetch node contracts', err));
    } else {
      setInputContract({});
      setOutputContract({});
      setPropertySchema([]);
      setProperties({});
    }
  }, [selectedNode?.id, workflowId]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'CREDENTIAL_CREATED') {
        const { credentialId, credentialName } = event.data;
        setCredentials((prev) => [
          ...prev,
          { id: credentialId, name: credentialName, type: showAuthForm },
        ]);
        if (activeFieldKey) {
          handlePropertyChange(activeFieldKey, credentialId);
        }
        setShowAuthForm(null);
        setSelectedProvider('');
        setNewConn({ name: '', clientId: '', clientSecret: '' });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [showAuthForm, activeFieldKey]);

  /**
   * Updates a nested property inside the 'properties' bag.
   * Used for agent-specific configurations like API keys, URLs, etc.
   */
  const handlePropertyChange = (key: string, value: PropertyValue) => {
    if (!selectedNode || !onUpdateNode) return;

    // Update local state for immediate UI feedback so fields are editable
    setProperties((prev) => ({
      ...prev,
      [key]: value,
    }));

    const nodeData = selectedNode.data as NodeData;
    const currentProps = (nodeData.properties || {}) as NodeProperties;
    const newData = {
      ...nodeData,
      properties: {
        ...currentProps,
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
    // This function remains for saving the node type definition to the global registry
    setIsSaving(true);
    try {
      const nodeData = selectedNode.data as any;
      // Ensure property_schema is formatted correctly for the backend
      const payload = {
        ...nodeData,
        property_schema: nodeData.property_schema || nodeData.propertySchema,
        // Ensure properties are included for the registry update
        properties: nodeData.properties,
        input_contract: nodeData.input_contract,
        output_contract: nodeData.output_contract,
        // Also include other top-level fields that might be edited in AdminPage
        name: nodeData.name,
        label: nodeData.label,
        description: nodeData.description,
        node_type: nodeData.node_type,
        version: nodeData.version,
        category: nodeData.category,
        group: nodeData.group,
        icon: nodeData.icon,
        color: nodeData.color,
      };
      await api.updateNode(payload);
      if (onSave) onSave();
    } catch (error) {
      console.error('Failed to update node registry:', error);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Saves the current node's instance-specific configuration to the backend.
   * This updates the properties for this specific node within the current workflow.
   */
  const handleSaveInstanceProperties = async () => {
    if (!selectedNode || !onSaveInstanceProperties) return;
    setIsSaving(true);
    try {
      await onSaveInstanceProperties(selectedNode.id, properties);
    } catch (error) {
      console.error('Failed to save node instance properties:', error);
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
          className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm text-black"
        >
          <span className="font-medium">{field.label}</span>
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => handlePropertyChange(field.key, event.target.checked)}
            className="h-4 w-4 accent-blue-600"
          />
        </label>
      );
    }

    // OAuth Configuration and Connection Flow
    if (field.type === 'oauth') {
      const clientIdKey = `${field.key}_client_id`;
      const clientSecretKey = `${field.key}_client_secret`;
      const credentialId = String(value || '');

      const clientId = String(properties[clientIdKey] || '');
      const clientSecret = String(properties[clientSecretKey] || '');

      return (
        <div
          key={field.key}
          className="space-y-4 p-4 border rounded-xl bg-slate-50 shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {field.label}
            </label>
            {credentialId && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                CONNECTED
              </span>
            )}
          </div>

          <div className="space-y-3">
            {providers && Array.isArray(providers) && providers.length > 0 && (
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                  Provider
                </label>
                <select
                  value={selectedProvider || (properties?.[`${field.key}_provider`] as string) || ''}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100"
                >
                  <option value="">Choose OAuth Provider...</option>
                  {providers.map((p: any) => (
                    <option key={p.id} value={p.name}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                  Client ID
                </label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => handlePropertyChange(clientIdKey, e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. 8234-abc..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                  Client Secret
                </label>
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => handlePropertyChange(clientSecretKey, e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="••••••••••••"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={!clientId || !clientSecret || !selectedProvider}
              onClick={() => {
                setActiveFieldKey(field.key);
                const providerKey = selectedProvider;
                const url = `/api/oauth/google/connect?client_id=${clientId}&client_secret=${clientSecret}&workflow_id=${workflowId}&node_id=${selectedNode?.id}`;

                const width = 600;
                const height = 700;
                const left = window.screenX + (window.outerWidth - width) / 2;
                const top = window.screenY + (window.outerHeight - height) / 2;
                window.open(
                  url,
                  'auth-popup',
                  `width=${width},height=${height},left=${left},top=${top}`,
                );
              }}
              className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 ${
                credentialId
                  ? 'bg-white border border-blue-200 text-blue-600 hover:bg-blue-50'
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none'
              }`}
            >
              {credentialId ? 'Reconnect Account' : 'Authenticate & Connect'}
            </button>
          </div>

          {/* {field.description && (
            <p className="text-[10px] text-slate-400 leading-tight bg-slate-100 p-2 rounded-md border border-slate-200 italic">
              {field.description}
            </p>
          )} */}
        </div>
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
            className="h-28 w-full resize-y rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-sm bg-white text-black focus:outline-none focus:border-blue-500"
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
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white text-black focus:outline-none focus:border-blue-500"
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
 
  return (
    <div className="w-80 border-l border-gray-200 bg-white flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 flex items-center justify-between shrink-0">
        <div className="font-semibold text-black flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Node Properties
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b text-xs font-semibold uppercase tracking-wider text-gray-500">
        <button
          onClick={() => setViewMode('config')}
          className={`flex-1 py-3 text-center transition-colors ${viewMode === 'config' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-gray-50 hover:bg-gray-100'}`}
        >
          Config
        </button>
        <button
          onClick={() => setViewMode('contract')}
          className={`flex-1 py-3 text-center transition-colors ${viewMode === 'contract' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-gray-50 hover:bg-gray-100'}`}
        >
          Data Contract
        </button>
      </div>

      <div className="flex-1 overflow-auto p-5 space-y-6">
        {viewMode === 'config' ? (
          <div className="space-y-5">
            {propertySchema && Array.isArray(propertySchema) && propertySchema.map((field) => field && renderPropertyField(field, properties))}
            {(!propertySchema || propertySchema.length === 0) && (
              <div className="text-center py-10 text-gray-400">
                <Settings className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No configurable properties.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">
                Input Contract
              </label>
              <pre className="mt-2 p-3 bg-gray-900 text-green-400 text-[10px] rounded-lg overflow-x-auto font-mono border border-gray-800 shadow-inner">
                {JSON.stringify(inputContract || {}, null, 2)}
              </pre>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">
                Output Contract
              </label>
              <pre className="mt-2 p-3 bg-gray-900 text-blue-400 text-[10px] rounded-lg overflow-x-auto font-mono border border-gray-800 shadow-inner">
                {JSON.stringify(outputContract || {}, null, 2)}
              </pre>
            </div>
            <p className="text-[10px] text-gray-400 italic leading-relaxed">
              Mapping can be achieved by referencing upstream nodes in your config using
              <code className="bg-gray-100 px-1 rounded">{'{{ node_id.output_key }}'}</code>.
            </p>
          </div>
        )}
      </div>

      {/* Footer - Save Button */}
      {(onSave || selectedNode) && (
        <div className="p-4 border-t bg-gray-50 shrink-0 flex gap-2">
          <button
            onClick={handleSaveInstanceProperties}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg text-sm font-medium text-white transition-colors shadow-sm"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving...' : 'Save Properties'}
          </button>
          {/* <button
            onClick={handleSaveToRegistry}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 rounded-lg text-sm font-medium text-white transition-colors shadow-sm"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Updating...' : 'Save Type'}
          </button> */}
        </div>
      )}
    </div>
  );
}
