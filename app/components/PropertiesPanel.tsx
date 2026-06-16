'use client';

import { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { X, Settings, Save, Loader2, CheckCircle2, XCircle, HelpCircle, Braces } from 'lucide-react';
import { api } from '@/lib/api';
import {
  AgentPropertyDefinition,
  PropertyValue,
  ContractProperty,
  getDefaultOutputContract,
  getDefaultInputContract,
} from './component-categoriees';

type NodeProperties = Record<string, PropertyValue>;
type NodeData = Record<string, PropertyValue | AgentPropertyDefinition[] | NodeProperties | undefined>;

interface PropertiesPanelProps {
  selectedNode: Node | null;
  onClose?: () => void;
  onUpdateNode?: (nodeId: string, newData: NodeData) => void;
  onSave?: () => void;
  workflowId?: string;
  /** Direct predecessor nodes connected to the selected node via edges */
  upstreamNodes?: Node[];
}

const TYPE_COLORS: Record<string, string> = {
  string: 'bg-blue-50 text-blue-700 border border-blue-100',
  number: 'bg-purple-50 text-purple-700 border border-purple-100',
  boolean: 'bg-amber-50 text-amber-700 border border-amber-100',
  object: 'bg-teal-50 text-teal-700 border border-teal-100',
  array: 'bg-orange-50 text-orange-700 border border-orange-100',
};

function getCategoryString(data: any): string {
  return String(data?.category || data?.group || '');
}

function getNodeOutputContract(node: Node): ContractProperty[] {
  const data = node.data as any;
  if (Array.isArray(data?.outputContract) && data.outputContract.length > 0) {
    return data.outputContract as ContractProperty[];
  }
  return getDefaultOutputContract(getCategoryString(data));
}

function getNodeInputContract(node: Node): ContractProperty[] {
  const data = node.data as any;
  if (Array.isArray(data?.inputContract) && data.inputContract.length > 0) {
    return data.inputContract as ContractProperty[];
  }
  return getDefaultInputContract(getCategoryString(data));
}

function getNodeSlug(node: Node): string {
  const label = String(node.data?.label || node.data?.name || node.id);
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export default function PropertiesPanel({
  selectedNode,
  onClose,
  onUpdateNode,
  onSave,
  workflowId,
  upstreamNodes = [],
}: PropertiesPanelProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [showAuthForm, setShowAuthForm] = useState<string | null>(null);
  const [newConn, setNewConn] = useState({ name: '', clientId: '', clientSecret: '' });
  const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'properties' | 'input' | 'output'>('properties');
  const [variablePickerField, setVariablePickerField] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab('properties');
    setVariablePickerField(null);
  }, [selectedNode?.id]);

  useEffect(() => {
    api.getProviders().then(setProviders).catch(() => {});
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'CREDENTIAL_CREATED') {
        const { credentialId, credentialName } = event.data;
        setCredentials((prev) => [
          ...prev,
          { id: credentialId, name: credentialName, type: showAuthForm },
        ]);
        if (activeFieldKey) handlePropertyChange(activeFieldKey, credentialId);
        setShowAuthForm(null);
        setSelectedProvider('');
        setNewConn({ name: '', clientId: '', clientSecret: '' });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [showAuthForm, activeFieldKey]);

  const handlePropertyChange = (key: string, value: PropertyValue) => {
    if (!selectedNode || !onUpdateNode) return;
    const nodeData = selectedNode.data as NodeData;
    const properties = (nodeData.properties || {}) as NodeProperties;
    onUpdateNode(selectedNode.id, {
      ...nodeData,
      properties: { ...properties, [key]: value },
    });
  };

  const handleSaveToRegistry = async () => {
    if (!selectedNode) return;
    setIsSaving(true);
    try {
      const nodeData = selectedNode.data as any;
      await api.updateNode({
        ...nodeData,
        property_schema: nodeData.property_schema || nodeData.propertySchema,
      });
      if (onSave) onSave();
    } catch (error) {
      console.error('Failed to update node registry:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const insertVariable = (fieldKey: string, varExpression: string) => {
    if (!selectedNode) return;
    const nodeData = selectedNode.data as NodeData;
    const properties = (nodeData.properties || {}) as NodeProperties;
    const current = String(properties[fieldKey] || '');
    handlePropertyChange(fieldKey, current + varExpression);
    setVariablePickerField(null);
  };

  const getPropertyValue = (properties: NodeProperties, field: AgentPropertyDefinition) => {
    if (properties[field.key] !== undefined) return properties[field.key];
    if (field.type === 'boolean') return false;
    if (field.multiple) return [];
    return '';
  };

  const upstreamVariableGroups = upstreamNodes.map((node) => ({
    nodeLabel: String(node.data?.label || node.data?.name || node.id),
    nodeSlug: getNodeSlug(node),
    outputs: getNodeOutputContract(node),
  }));

  const renderVariablePicker = (fieldKey: string) => {
    if (upstreamVariableGroups.length === 0) {
      return (
        <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-400 text-center">
          No upstream nodes connected yet
        </div>
      );
    }
    return (
      <div className="mt-1 border border-blue-200 bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-3 py-2 bg-blue-50 border-b border-blue-100 text-[10px] font-semibold text-blue-700 uppercase tracking-wider">
          Available variables — click to insert
        </div>
        <div className="max-h-52 overflow-y-auto divide-y divide-gray-50">
          {upstreamVariableGroups.map((group) => (
            <div key={group.nodeSlug}>
              <div className="px-3 py-1.5 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider sticky top-0">
                {group.nodeLabel}
              </div>
              {group.outputs.map((prop) => (
                <button
                  key={prop.key}
                  type="button"
                  onClick={() => insertVariable(fieldKey, `{{${group.nodeSlug}.${prop.key}}}`)}
                  className="w-full flex items-start gap-2.5 px-3 py-2 hover:bg-blue-50 transition-colors text-left"
                >
                  <span
                    className={`shrink-0 mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded ${TYPE_COLORS[prop.type] || TYPE_COLORS.string}`}
                  >
                    {prop.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-xs text-gray-800 truncate">
                      {`{{${group.nodeSlug}.${prop.key}}}`}
                    </div>
                    {prop.description && (
                      <div className="text-[10px] text-gray-400 leading-tight mt-0.5 truncate">
                        {prop.description}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPropertyField = (field: AgentPropertyDefinition, properties: NodeProperties) => {
    const value = getPropertyValue(properties, field);
    const canInsertVariable =
      ['string', 'textarea'].includes(field.type) && upstreamVariableGroups.length > 0;

    const FieldHeader = () => (
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-medium text-gray-500">
          {field.label}
          {field.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {canInsertVariable && (
          <button
            type="button"
            onClick={() =>
              setVariablePickerField(variablePickerField === field.key ? null : field.key)
            }
            className={`flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full transition-colors ${
              variablePickerField === field.key
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title="Insert variable from upstream node"
          >
            <Braces size={11} />
            <span>insert</span>
          </button>
        )}
      </div>
    );

    if (field.type === 'boolean') {
      return (
        <label
          key={field.key}
          className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm text-black"
        >
          <div>
            <span className="font-medium">{field.label}</span>
            {field.description && (
              <p className="text-[11px] text-gray-400 mt-0.5">{field.description}</p>
            )}
          </div>
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => handlePropertyChange(field.key, event.target.checked)}
            className="h-4 w-4 accent-blue-600"
          />
        </label>
      );
    }

    if (field.type === 'oauth') {
      const clientIdKey = `${field.key}_client_id`;
      const clientSecretKey = `${field.key}_client_secret`;
      const credentialId = String(value || '');
      const clientId = String(properties[clientIdKey] || '');
      const clientSecret = String(properties[clientSecretKey] || '');

      return (
        <div key={field.key} className="space-y-4 p-4 border rounded-xl bg-slate-50 shadow-sm">
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
            {providers.length > 0 && (
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                  Provider
                </label>
                <select
                  value={selectedProvider || (properties[`${field.key}_provider`] as string) || ''}
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

          <button
            type="button"
            disabled={!clientId || !clientSecret || !selectedProvider}
            onClick={() => {
              setActiveFieldKey(field.key);
              const url = `/api/oauth/google/connect?client_id=${clientId}&client_secret=${clientSecret}&workflow_id=${workflowId}&node_id=${selectedNode?.id}`;
              const width = 600,
                height = 700;
              const left = window.screenX + (window.outerWidth - width) / 2;
              const top = window.screenY + (window.outerHeight - height) / 2;
              window.open(url, 'auth-popup', `width=${width},height=${height},left=${left},top=${top}`);
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
      );
    }

    if (field.type === 'choice') {
      if (field.multiple) {
        return (
          <div key={field.key}>
            <FieldHeader />
            <select
              multiple
              value={Array.isArray(value) ? value.map(String) : []}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                handlePropertyChange(
                  field.key,
                  Array.from(event.target.selectedOptions, (o) => o.value),
                )
              }
              className="h-28 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              {(field.options || []).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {field.description && (
              <p className="mt-1 text-[11px] text-gray-400">{field.description}</p>
            )}
          </div>
        );
      }
      return (
        <div key={field.key}>
          <FieldHeader />
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
          {field.description && (
            <p className="mt-1 text-[11px] text-gray-400">{field.description}</p>
          )}
        </div>
      );
    }

    if (field.type === 'textarea') {
      return (
        <div key={field.key}>
          <FieldHeader />
          <textarea
            value={String(value)}
            placeholder={field.placeholder}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
              handlePropertyChange(field.key, event.target.value)
            }
            className="h-28 w-full resize-y rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-sm bg-white text-black focus:outline-none focus:border-blue-500"
          />
          {variablePickerField === field.key && renderVariablePicker(field.key)}
          {field.description && (
            <p className="mt-1 text-[11px] text-gray-400">{field.description}</p>
          )}
        </div>
      );
    }

    // Standard inputs: text, password, number
    return (
      <div key={field.key}>
        <FieldHeader />
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
        {variablePickerField === field.key && renderVariablePicker(field.key)}
        {field.description && (
          <p className="mt-1 text-[11px] text-gray-400">{field.description}</p>
        )}
      </div>
    );
  };

  const renderInputContractTab = () => {
    if (!selectedNode) return null;
    const inputContract = getNodeInputContract(selectedNode);

    const availableKeys = new Set<string>();
    upstreamNodes.forEach((n) => {
      getNodeOutputContract(n).forEach((p) => availableKeys.add(p.key));
    });

    if (inputContract.length === 0) {
      return (
        <div className="text-center py-10 text-gray-400">
          <HelpCircle className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No input contract defined.</p>
          <p className="text-xs mt-1 text-gray-300">This node accepts any upstream data.</p>
        </div>
      );
    }

    const allRequired = inputContract.filter((p) => p.required);
    const missingRequired = allRequired.filter((p) => !availableKeys.has(p.key));

    return (
      <div className="space-y-4">
        <p className="text-xs text-gray-400 leading-relaxed">
          Properties this node expects from upstream. Required fields must be provided by a
          connected predecessor node.
        </p>

        {missingRequired.length > 0 && upstreamNodes.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-700">
            <span className="font-semibold">Missing required inputs:</span>{' '}
            {missingRequired.map((p) => p.key).join(', ')}
          </div>
        )}

        <div className="space-y-2">
          {inputContract.map((prop) => {
            const isAvailable = availableKeys.has(prop.key);
            const sourceNode = isAvailable
              ? upstreamNodes.find((n) => getNodeOutputContract(n).some((o) => o.key === prop.key))
              : null;
            const sourceLabel = sourceNode
              ? String(sourceNode.data?.label || sourceNode.data?.name || '')
              : null;

            return (
              <div
                key={prop.key}
                className={`p-3 rounded-lg border ${
                  prop.required && !isAvailable
                    ? 'border-amber-200 bg-amber-50'
                    : isAvailable
                      ? 'border-green-100 bg-green-50/40'
                      : 'border-gray-100 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded ${TYPE_COLORS[prop.type] || TYPE_COLORS.string}`}
                    >
                      {prop.type}
                    </span>
                    <span className="font-mono text-xs font-semibold text-gray-800 truncate">
                      {prop.key}
                    </span>
                    {prop.required && (
                      <span className="shrink-0 text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                        required
                      </span>
                    )}
                  </div>
                  {isAvailable ? (
                    <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                  ) : (
                    <XCircle
                      size={14}
                      className={`shrink-0 ${prop.required ? 'text-amber-500' : 'text-gray-300'}`}
                    />
                  )}
                </div>
                {prop.description && (
                  <p className="mt-1 text-[11px] text-gray-400 leading-tight">{prop.description}</p>
                )}
                {isAvailable && sourceLabel && (
                  <p className="mt-1 text-[10px] text-green-600 font-medium">
                    ✓ Provided by {sourceLabel}
                  </p>
                )}
                {!isAvailable && upstreamNodes.length === 0 && (
                  <p className="mt-1 text-[10px] text-gray-400">
                    Connect an upstream node to provide this value
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderOutputContractTab = () => {
    if (!selectedNode) return null;
    const outputContract = getNodeOutputContract(selectedNode);
    const nodeSlug = getNodeSlug(selectedNode);

    return (
      <div className="space-y-4">
        <p className="text-xs text-gray-400 leading-relaxed">
          Properties this node produces. Reference them in downstream node configurations using{' '}
          <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-600 text-[10px]">
            {`{{${nodeSlug}.key}}`}
          </span>
        </p>

        <div className="space-y-2">
          {outputContract.map((prop) => (
            <div
              key={prop.key}
              className="group p-3 rounded-lg border border-gray-100 bg-gray-50 hover:border-blue-100 hover:bg-blue-50/30 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded ${TYPE_COLORS[prop.type] || TYPE_COLORS.string}`}
                  >
                    {prop.type}
                  </span>
                  <span className="font-mono text-xs font-semibold text-gray-800 truncate">
                    {prop.key}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigator.clipboard?.writeText(`{{${nodeSlug}.${prop.key}}}`)
                  }
                  className="shrink-0 text-[10px] text-gray-400 hover:text-blue-600 font-mono px-1.5 py-0.5 rounded hover:bg-blue-100 opacity-0 group-hover:opacity-100 transition-all"
                  title="Copy variable reference to clipboard"
                >
                  copy
                </button>
              </div>
              {prop.description && (
                <p className="mt-1 text-[11px] text-gray-400 leading-tight">{prop.description}</p>
              )}
              {prop.example && (
                <p className="mt-0.5 text-[10px] font-mono text-gray-300">e.g. {prop.example}</p>
              )}
            </div>
          ))}
        </div>

        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-[10px] font-semibold text-gray-500 uppercase mb-1.5">
            Reference pattern
          </div>
          <div className="font-mono text-xs text-gray-700 bg-white px-3 py-2 rounded border border-gray-200 select-all">
            {`{{${nodeSlug}.property}}`}
          </div>
        </div>
      </div>
    );
  };

  if (!selectedNode) {
    return (
      <div className="w-80 border-l border-gray-200 bg-white p-6">
        <div className="text-center text-gray-400 mt-10">
          <Settings className="w-8 h-8 mx-auto mb-3" />
          <p className="text-sm">Select a node to edit properties</p>
          <p className="text-xs mt-2 text-gray-300 leading-relaxed">
            Click any node on the canvas to configure it and inspect its data contracts.
          </p>
        </div>
      </div>
    );
  }

  const localData = selectedNode.data as NodeData;
  const rawSchema = (localData.propertySchema || (localData as any).property_schema) as any;
  const propertySchema: AgentPropertyDefinition[] = (
    Array.isArray(rawSchema) ? rawSchema : []
  ).filter((f: any) => typeof f === 'object' && f !== null);

  const properties = (localData.properties || {}) as NodeProperties;
  const categoryName = getCategoryString(localData);
  const nodeLabel = String(localData.label || localData.name || selectedNode.id);

  const tabs = [
    { id: 'properties' as const, label: 'Config' },
    { id: 'input' as const, label: 'Inputs' },
    { id: 'output' as const, label: 'Outputs' },
  ];

  const inputContract = getNodeInputContract(selectedNode);
  const outputContract = getNodeOutputContract(selectedNode);

  return (
    <div className="w-80 border-l border-gray-200 bg-white flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 flex items-center justify-between shrink-0">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-black flex items-center gap-2 text-sm">
            <Settings className="w-4 h-4 shrink-0" />
            <span className="truncate">{nodeLabel}</span>
          </div>
          {categoryName && (
            <div className="text-[11px] text-gray-400 mt-0.5 ml-6">{categoryName}</div>
          )}
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0 ml-2">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-gray-200 bg-white shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.id === 'input' && inputContract.length > 0 && (
              <span className="ml-1 text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-bold">
                {inputContract.length}
              </span>
            )}
            {tab.id === 'output' && outputContract.length > 0 && (
              <span className="ml-1 text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-bold">
                {outputContract.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'properties' && (
          <div className="space-y-4">
            {propertySchema.length > 0 ? (
              propertySchema.map((field) => (
                <div key={field.key}>{renderPropertyField(field, properties)}</div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-400">
                <Settings className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No configurable properties.</p>
                <p className="text-xs mt-1 text-gray-300">
                  Check the Inputs and Outputs tabs to understand the data contract.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'input' && renderInputContractTab()}
        {activeTab === 'output' && renderOutputContractTab()}
      </div>

      {/* Footer — only shown on Config tab */}
      {activeTab === 'properties' && (
        <div className="p-4 border-t bg-gray-50 shrink-0">
          <button
            onClick={handleSaveToRegistry}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg text-sm font-medium text-white transition-colors shadow-sm"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? 'Updating Registry...' : 'Save Properties'}
          </button>
        </div>
      )}
    </div>
  );
}
