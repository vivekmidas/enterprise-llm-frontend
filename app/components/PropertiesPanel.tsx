'use client';

import { useState, useEffect, useMemo } from 'react';
import { Node, Edge } from '@xyflow/react';
import {
  X,
  Settings,
  Save,
  Loader2,
  ArrowRightLeft,
  Wand2,
  Info,
  Trash2,
  Lock,
  Copy,
  Check,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { api } from '@/lib/api';
import { NodePropertyDefinition, PropertyValue } from './component-categoriees';
import JsonSchemaGeneratorModal from './JsonSchemaGeneratorModal';

// Helper to normalize and parse system properties from different database formats
const parseSystemProperties = (value: any): Record<string, any> => {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      return parseSystemProperties(JSON.parse(value));
    } catch {
      return {};
    }
  }
  if (Array.isArray(value)) {
    const result: Record<string, any> = {};
    value.forEach((item) => {
      let entry = item;
      if (typeof item === 'string') {
        try {
          entry = JSON.parse(item);
        } catch {
          return;
        }
      }
      if (entry && typeof entry === 'object' && entry.key) {
        result[entry.key] =
          entry.value !== undefined
            ? entry.value
            : entry.default !== undefined
              ? entry.default
              : '';
      }
    });
    return result;
  }
  if (typeof value === 'object') {
    const result: Record<string, any> = {};
    Object.entries(value).forEach(([k, v]) => {
      if (v && typeof v === 'object' && ('value' in v || 'default' in v)) {
        const obj = v as any;
        result[k] =
          obj.value !== undefined ? obj.value : obj.default !== undefined ? obj.default : '';
      } else {
        result[k] = v;
      }
    });
    return result;
  }
  return {};
};
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

/** Modal for visual field mapping between source and target nodes */
function FieldMapperModal({
  isOpen,
  onClose,
  sourceContract,
  targetContract,
  currentMapping,
  onSaveMapping,
}: {
  isOpen: boolean;
  onClose: () => void;
  sourceContract: any;
  targetContract: any;
  currentMapping: Record<string, string>;
  onSaveMapping: (mapping: Record<string, string>) => void;
}) {
  const [mapping, setMapping] = useState<Record<string, string>>(currentMapping);

  const sourceFields = useMemo(() => {
    const props = sourceContract?.properties || sourceContract || {};
    return Object.keys(props);
  }, [sourceContract]);

  const targetFields = useMemo(() => {
    const props = targetContract?.properties || targetContract || {};
    return Object.keys(props);
  }, [targetContract]);

  const handleAutoMap = () => {
    const newMapping = { ...mapping };
    targetFields.forEach((target) => {
      // Simple case-insensitive match
      const match = sourceFields.find((s) => s.toLowerCase() === target.toLowerCase());
      if (match) {
        newMapping[target] = `{{ input_data.${match} }}`;
      }
    });
    setMapping(newMapping);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-800">Field Mapper</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 bg-blue-50 border-b flex items-center justify-between">
          <p className="text-xs text-blue-700 flex items-center gap-2">
            <Info size={14} />
            Map fields from the previous node's output to the next node's input.
          </p>
          <button
            onClick={handleAutoMap}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all"
          >
            <Wand2 size={14} />
            Auto-map Fields
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b">
                <th className="pb-2 font-semibold">Target Field (Input)</th>
                <th className="pb-2 font-semibold text-center">→</th>
                <th className="pb-2 font-semibold">Source Data (Jinja2)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {targetFields.map((field) => (
                <tr key={field} className="group">
                  <td className="py-3 font-medium text-gray-700">{field}</td>
                  <td className="py-3 text-center text-gray-300">→</td>
                  <td className="py-3">
                    <input
                      type="text"
                      value={mapping[field] || ''}
                      onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                      placeholder="{{ input_data.field_name }}"
                      className="w-full border rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onSaveMapping(mapping)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg"
          >
            Apply Mapping
          </button>
        </div>
      </div>
    </div>
  );
}

/** Type representing agent-specific configuration values */
type NodeProperties = Record<string, PropertyValue>;
/** Type for the generic node data object stored in ReactFlow */
type NodeData = Record<string, PropertyValue | NodeProperties | undefined>;

interface PropertiesPanelProps {
  /** The ReactFlow node currently selected on the canvas */
  selectedNode: Node | null;
  /** The ReactFlow edge currently selected on the canvas */
  selectedEdge?: Edge | null;
  /** Callback fired when the close button is clicked (non-optional) */
  onClose: () => void;
  /** Callback to propagate data changes back to the workflow state (local ReactFlow update only) */
  onUpdateNode: (nodeId: string, newData: NodeData) => void;
  onUpdateEdge?: (edgeId: string, newEdge: Partial<Edge>) => void;
  /** Callback for global save action */
  onSave?: () => void;
  /** The ID of the current workflow (agent) */
  workflowId?: string;
  /** Callback to explicitly save instance-specific properties to the backend */
  onSaveInstanceProperties: (nodeId: string, properties: NodeProperties) => Promise<void>;
  /** Callback to delete node from canvas */
  onDeleteNode?: (nodeId: string) => void;
  onOpenMapper?: () => void;
  hasPredecessor?: boolean;
  userRole?: string;
}

/**
 * PropertiesPanel - Sidebar component for editing agent node configurations.
 *
 * It dynamically renders form fields
 * and allows editing basic metadata like name and description.
 */
export default function PropertiesPanel({
  selectedNode,
  selectedEdge,
  onClose,
  onUpdateNode, // Keep original name, but its behavior is now just local state update
  onUpdateEdge,
  onSaveInstanceProperties, // New prop for explicit instance property saving
  onSave,
  workflowId,
  onDeleteNode,
  onOpenMapper,
  hasPredecessor = false,
  userRole,
}: PropertiesPanelProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [showAuthForm, setShowAuthForm] = useState<string | null>(null);
  const [newConn, setNewConn] = useState({ name: '', clientId: '', clientSecret: '' });
  const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [viewMode, setViewMode] = useState<'config' | 'contract'>('config');
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
  const [generatorModalType, setGeneratorModalType] = useState<'input' | 'output'>('input');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    parameters: false,
    mapping: false,
    system: true,
  });

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Local state for fetched contracts and properties from API
  const [inputContract, setInputContract] = useState<any>({});
  const [outputContract, setOutputContract] = useState<any>({});
  const [properties, setProperties] = useState<NodeProperties>({});
  const [systemProperties, setSystemProperties] = useState<NodeProperties>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const systemKeys = Object.keys(systemProperties);
  const entries = Object.entries(properties).filter(
    ([key]) => key.toLowerCase() !== 'mapping_template' && !systemKeys.includes(key),
  );
  const systemEntries = Object.entries(systemProperties);

  const handleSaveContract = (type: 'input' | 'output', newSchema: any) => {
    if (!selectedNode) return;

    const updatedData = {
      ...(selectedNode.data as any),
      [type === 'input' ? 'input_contract' : 'output_contract']: newSchema,
    };

    if (type === 'input') {
      setInputContract(newSchema);
    } else {
      setOutputContract(newSchema);
    }

    onUpdateNode(selectedNode.id, updatedData);
  };

  const handleCopy = (key: string, value: any) => {
    navigator.clipboard.writeText(String(value ?? ''));
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // Edge editor state
  const [edgeCondition, setEdgeCondition] = useState<string>('');
  const [edgeExpression, setEdgeExpression] = useState<string>('');
  const [sourceOutputPreview, setSourceOutputPreview] = useState<any>(null);
  const [allowedConditions, setAllowedConditions] = useState<string[]>([]);

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

  useEffect(() => {
    // Reset properties if nothing is selected
    if (!selectedNode && !selectedEdge) {
      setInputContract({});
      setOutputContract({});
      setProperties({});
      setSystemProperties({});
      setSourceOutputPreview(null);
      setAllowedConditions(['success', 'failure']);
      setEdgeCondition('');
      setEdgeExpression('');
      return;
    }

    // Load node properties if selected
    if (selectedNode) {
      const localData = selectedNode.data as NodeData;

      setInputContract(
        (localData.input_contract || localData.inputContract || {}) as Record<string, any>,
      );
      setOutputContract(
        (localData.output_contract || localData.outputContract || {}) as Record<string, any>,
      );
      setProperties((localData.properties || {}) as NodeProperties);
      setSystemProperties(
        parseSystemProperties(localData.system_properties || localData.systemProperties),
      );

      api
        .getAgentNodeProperties(workflowId || '', selectedNode.id)
        .then((res) => {
          if (!res) return;
          setInputContract(res?.input_contract || res?.inputContract || {});
          setOutputContract(res?.output_contract || res?.outputContract || {});
          setProperties(res?.properties || {});
          setSystemProperties(
            parseSystemProperties(res?.system_level_properties || res?.system_properties || {}),
          );
        })
        .catch((err) => console.error('Failed to fetch node contracts', err));
    }

    // Load edge properties if selected
    if (selectedEdge && workflowId) {
      const srcId = String((selectedEdge as any).source || '');
      api
        .getAgentNodeProperties(workflowId || '', srcId)
        .then((res) => {
          setSourceOutputPreview(
            res?.output_example || res?.output_contract || res?.outputContract || null,
          );
          const declared = (
            (res?.properties?.conditions ||
              res?.user_properties?.conditions ||
              res?.userProperties?.conditions ||
              []) as string[]
          ).filter((c) => c !== 'default');
          setAllowedConditions(declared.length ? declared : ['success', 'failure']);

          const edgeData = (selectedEdge as any).data || {};
          let currentCondition =
            edgeData.condition ||
            (selectedEdge as any).condition ||
            (selectedEdge as any).sourceHandle ||
            '';
          if (currentCondition === 'source-right' || currentCondition === 'source-bottom') {
            currentCondition = 'default';
          }
          const currentExpression = edgeData.expression || (selectedEdge as any).expression || '';

          setEdgeCondition(currentCondition);
          setEdgeExpression(currentExpression);
        })
        .catch((err) =>
          console.error('Failed to fetch source node properties for edge preview', err),
        );
    } else {
      setSourceOutputPreview(null);
      setAllowedConditions(['success', 'failure', 'default']);
      setEdgeCondition('');
      setEdgeExpression('');
    }
  }, [selectedNode?.id, selectedEdge?.id, workflowId]);

  // Sync properties from selectedNode if they change externally (e.g., from mapping controller or other modals)
  const stringifiedNodeProps = JSON.stringify((selectedNode?.data as any)?.properties || {});
  useEffect(() => {
    if (selectedNode) {
      const nodeProps = ((selectedNode.data as any)?.properties || {}) as NodeProperties;
      if (JSON.stringify(properties) !== JSON.stringify(nodeProps)) {
        setProperties(nodeProps);
      }
    }
  }, [stringifiedNodeProps, selectedNode?.id]);

  const stringifiedInputContract = JSON.stringify((selectedNode?.data as any)?.input_contract || (selectedNode?.data as any)?.inputContract || {});
  const stringifiedOutputContract = JSON.stringify((selectedNode?.data as any)?.output_contract || (selectedNode?.data as any)?.outputContract || {});
  useEffect(() => {
    if (selectedNode) {
      const localData = selectedNode.data as any;
      const nodeInput = (localData.input_contract || localData.inputContract || {});
      const nodeOutput = (localData.output_contract || localData.outputContract || {});
      
      if (JSON.stringify(inputContract) !== JSON.stringify(nodeInput)) {
        setInputContract(nodeInput);
      }
      if (JSON.stringify(outputContract) !== JSON.stringify(nodeOutput)) {
        setOutputContract(nodeOutput);
      }
    }
  }, [stringifiedInputContract, stringifiedOutputContract, selectedNode?.id]);

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

  const handleStateMappingChange = (outputField: string, isChecked: boolean, customKey?: string) => {
    if (!selectedNode || !onUpdateNode) return;

    const currentProps = ((selectedNode.data as any)?.properties || {}) as Record<string, any>;
    const currentStateMappings = { ...(currentProps.state_mappings || currentProps.output_mappings || {}) };

    if (!isChecked) {
      // Find and delete the mapping that resolves to outputField
      for (const [k, v] of Object.entries(currentStateMappings)) {
        if (v === outputField || v === `{{ ${outputField} }}`) {
          delete currentStateMappings[k];
        }
      }
    } else {
      // Add or update the mapping
      const keyToUse = customKey || outputField;
      // First, remove any existing mapping for this field to avoid duplicates
      for (const [k, v] of Object.entries(currentStateMappings)) {
        if (v === outputField || v === `{{ ${outputField} }}`) {
          delete currentStateMappings[k];
        }
      }
      currentStateMappings[keyToUse] = outputField;
    }

    const updatedProps = {
      ...currentProps,
      state_mappings: currentStateMappings,
    };

    setProperties(updatedProps);

    const nodeData = selectedNode.data as any;
    const newData = {
      ...nodeData,
      properties: updatedProps,
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
      const payload = {
        ...nodeData,

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
      const localData = selectedNode.data as any;
      const userPropsArray = Array.isArray(localData.user_properties) ? (localData.user_properties as any[]) : [];
      const systemPropsArray = Array.isArray(localData.system_properties) ? (localData.system_properties as any[]) : [];
      const schemaArray = (localData.propertySchema || localData.property_schema || []) as any[];

      const sanitizedProps = { ...properties };
      Object.keys(sanitizedProps).forEach((key) => {
        const fieldSchema = schemaArray.find((f: any) => f.key === key) ||
                            userPropsArray.find((f: any) => f.key === key) ||
                            systemPropsArray.find((f: any) => f.key === key);
        if (fieldSchema) {
          const fieldType = fieldSchema.type || fieldSchema.field_type;
          if (fieldType === 'choice' && !fieldSchema.multiple) {
            const rawOptions = fieldSchema.options || fieldSchema.value;
            const options: string[] = Array.isArray(rawOptions)
              ? rawOptions
              : typeof rawOptions === 'string'
                ? (() => {
                    try {
                      const parsed = JSON.parse(rawOptions);
                      return Array.isArray(parsed) ? parsed : [];
                    } catch {
                      return rawOptions.split(',').map((s: string) => s.trim());
                    }
                  })()
                : [];
            const valStr = String(sanitizedProps[key] ?? '');
            if (valStr.includes(',') || !options.includes(valStr)) {
              sanitizedProps[key] = options[0] || '';
            }
          }
        }
      });

      const payload = {
        ...sanitizedProps,
        label: (selectedNode.data as any).label || (selectedNode.data as any).name || '',
      };
      await onSaveInstanceProperties(selectedNode.id, payload);

      // Refresh the panel's data from the backend to ensure consistency and resolve defaults
      const res = await api.getAgentNodeProperties(workflowId || '', selectedNode.id);
      if (res) {
        setInputContract(res?.input_contract || res?.inputContract || {});
        setOutputContract(res?.output_contract || res?.outputContract || {});
        setProperties(res?.properties || {});
        setSystemProperties(
          parseSystemProperties(res?.system_level_properties || res?.system_properties || {}),
        );

        // Also sync the resolved values back to the canvas/reactflow node data
        const nodeData = selectedNode.data as NodeData;
        const newData = {
          ...nodeData,
          properties: res?.properties || {},
          input_contract: res?.input_contract || res?.inputContract || {},
          output_contract: res?.output_contract || res?.outputContract || {},
          property_schema: res?.property_schema || res?.propertySchema || nodeData.property_schema || [],
          propertySchema: res?.property_schema || res?.propertySchema || nodeData.propertySchema || [],
        };
        onUpdateNode(selectedNode.id, newData);
      }
    } catch (error) {
      console.error('Failed to save node instance properties:', error);
    } finally {
      setIsSaving(false);
    }
  };

  /** Helper to safely retrieve current value or appropriate default for the field type */
  const getPropertyValue = (properties: NodeProperties, field: NodePropertyDefinition) => {
    if (properties[field.key] !== undefined) return properties[field.key];
    if (field.default !== undefined && field.default !== null) return field.default;
    const fieldType = field.type || (field as any).field_type;
    if (fieldType === 'boolean') return false;
    if (field.multiple) return [];
    return '';
  };

  /** Renders the appropriate UI input based on the field definition from the agent schema */
  const renderPropertyField = (
    field: NodePropertyDefinition,
    userProps: NodeProperties,
    systemProps: NodeProperties,
  ) => {
    const hasUserValue = userProps.hasOwnProperty(field.key);
    const isSystem = systemProps.hasOwnProperty(field.key) && !hasUserValue;
    const value = hasUserValue
      ? userProps[field.key]
      : systemProps.hasOwnProperty(field.key)
        ? systemProps[field.key]
        : getPropertyValue(userProps, field);
    const isDisabled = isSystem;
    const fieldType = field.type || (field as any).field_type;
    const displayValue =
      (isSystem || hasUserValue) && fieldType === 'password' && value
        ? '••••••••'
        : String(value ?? '');

    // Boolean Toggle
    if (fieldType === 'boolean') {
      return (
        <div key={field.key} className="flex flex-col gap-1.5">
          <label
            className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm text-black cursor-help"
            title={field.description}
          >
            <span className="font-medium flex items-center gap-1.5">
              {field.label}
              {field.description && (
                <span className="text-[9px] text-blue-500 font-bold bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full leading-none shadow-sm">
                  i
                </span>
              )}
            </span>
            <input
              type="checkbox"
              checked={Boolean(value)}
              disabled={isDisabled}
              onChange={(event) =>
                !isDisabled && handlePropertyChange(field.key, event.target.checked)
              }
              className="h-4 w-4 accent-blue-600"
            />
          </label>
        </div>
      );
    }

    // OAuth Configuration and Connection Flow
    if (fieldType === 'oauth') {
      const clientIdKey = `${field.key}_client_id`;
      const clientSecretKey = `${field.key}_client_secret`;
      const credentialId = String(value || '');

      const clientId = String(isSystem ? systemProps[clientIdKey] : userProps[clientIdKey] || '');
      const clientSecret = String(
        isSystem ? systemProps[clientSecretKey] : userProps[clientSecretKey] || '',
      );

      return (
        <div
          key={field.key}
          className="space-y-4 p-4 border rounded-xl h-full overflow-hidden bg-slate-50 shadow-sm transition-all"
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
                  value={String(
                    selectedProvider ||
                      (isSystem
                        ? systemProps[`${field.key}_provider`]
                        : (userProps[`${field.key}_provider`] as string)) ||
                      '',
                  )}
                  disabled={isDisabled}
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
                  disabled={isDisabled}
                  onChange={(e) => !isDisabled && handlePropertyChange(clientIdKey, e.target.value)}
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
                  disabled={isDisabled}
                  onChange={(e) =>
                    !isDisabled && handlePropertyChange(clientSecretKey, e.target.value)
                  }
                  className="w-full border rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="••••••••••••"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={isDisabled || !clientId || !clientSecret || !selectedProvider}
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
    if (fieldType === 'choice') {
      const rawOptions = field.options || (field as any).values;
      const options: string[] = Array.isArray(rawOptions)
        ? rawOptions
        : typeof rawOptions === 'string'
          ? (() => {
              try {
                const parsed = JSON.parse(rawOptions);
                return Array.isArray(parsed) ? parsed : [];
              } catch {
                return rawOptions.split(',').map((s: string) => s.trim());
              }
            })()
          : [];

      // Multi-select mode
      if (field.multiple) {
        return (
          <div key={field.key}>
            <label
              className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1.5 cursor-help"
              title={field.description}
            >
              {field.label}
              {field.description && (
                <span className="text-[9px] text-blue-500 font-bold bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full leading-none shadow-sm">
                  i
                </span>
              )}
            </label>
            <select
              multiple
              disabled={isDisabled}
              value={Array.isArray(value) ? value.map(String) : []}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                const values = Array.from(event.target.selectedOptions, (option) => option.value);
                !isDisabled && handlePropertyChange(field.key, values);
              }}
              className="h-28 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              {options.map((option) => (
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
          <label
            className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1.5 cursor-help"
            title={field.description}
          >
            {field.label}
            {field.description && (
              <span className="text-[9px] text-blue-500 font-bold bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full leading-none shadow-sm">
                i
              </span>
            )}
          </label>
          <select
            disabled={isDisabled}
            value={String(value)}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
              !isDisabled && handlePropertyChange(field.key, event.target.value)
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
          >
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );
    }

    // Multiline text area
    if (fieldType === 'textarea') {
      return (
        <div key={field.key}>
          <label
            className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1.5 cursor-help"
            title={field.description}
          >
            {field.label}
            {field.description && (
              <span className="text-[9px] text-blue-500 font-bold bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full leading-none shadow-sm">
                i
              </span>
            )}
          </label>
          <textarea
            disabled={isDisabled}
            value={String(value)}
            placeholder={field.placeholder}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
              !isDisabled && handlePropertyChange(field.key, event.target.value)
            }
            className="h-28 w-full resize-y rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-sm bg-white text-black focus:outline-none focus:border-blue-500"
          />
        </div>
      );
    }

    // Standard inputs: text, password, number
    return (
      <div key={field.key}>
        <label
          className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1.5 cursor-help"
          title={field.description}
        >
          {field.label}
          {field.description && (
            <span className="text-[9px] text-blue-500 font-bold bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full leading-none shadow-sm">
              i
            </span>
          )}
        </label>
        <input
          type={
            fieldType === 'password' ? 'password' : fieldType === 'number' ? 'number' : 'text'
          }
          disabled={isDisabled}
          value={displayValue}
          placeholder={field.placeholder}
          onChange={(event) =>
            !isDisabled &&
            handlePropertyChange(
              field.key,
              fieldType === 'number' ? Number(event.target.value) : event.target.value,
            )
          }
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white text-black focus:outline-none focus:border-blue-500"
        />
      </div>
    );
  };

  // Placeholder state when no node is selected
  if (!selectedNode && !selectedEdge) {
    return (
      <div className="w-[340px] shrink-0 border-l border-slate-100 bg-white p-6 flex flex-col items-center justify-center h-full">
        <div className="text-center text-slate-400 max-w-[200px]">
          <div className="w-12 h-12 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Settings className="w-5 h-5 text-slate-500 animate-[spin_6s_linear_infinite]" />
          </div>
          <h3 className="font-semibold text-slate-700 text-sm mb-1">Properties</h3>
          <p className="text-xs text-slate-400 leading-normal">
            Select a canvas node or connection line to configure settings.
          </p>
        </div>
      </div>
    );
  }

  // If an edge is selected, render the Edge Editor
  if (selectedEdge) {
    return (
      <div className="w-[340px] shrink-0 border-l border-slate-100 bg-white flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="font-bold text-xs text-slate-700 flex items-center gap-2 uppercase tracking-wider">
            <ArrowRightLeft className="w-4 h-4 text-indigo-500" />
            Connection Settings
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
          <div className="space-y-1.5">
            <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest">
              Source Output Sample
            </label>
            <pre className="p-3 bg-slate-905 text-emerald-400 text-[10px] rounded-xl overflow-x-auto font-mono border border-slate-800 shadow-inner max-h-40 custom-scrollbar">
              {JSON.stringify(sourceOutputPreview || {}, null, 2)}
            </pre>
          </div>

          <div className="space-y-2">
            <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest">
              Branch Condition
            </label>
            <select
              value={allowedConditions.includes(edgeCondition) ? edgeCondition : 'custom'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'custom') {
                  setEdgeCondition('');
                } else {
                  setEdgeCondition(val);
                }
              }}
              className="w-full border border-slate-200 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs bg-slate-50/50 focus:bg-white text-slate-700 outline-none transition-all cursor-pointer"
            >
              {allowedConditions.map((c) => (
                <option key={c} value={c}>
                  {c.toUpperCase()}
                </option>
              ))}
              <option value="custom">Custom Condition Variable...</option>
            </select>

            {(!allowedConditions.includes(edgeCondition) || edgeCondition === '') && (
              <input
                type="text"
                value={edgeCondition}
                onChange={(e) => setEdgeCondition(e.target.value)}
                placeholder="Enter custom condition name (e.g. is_safe)"
                className="w-full border border-slate-250 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 bg-white outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            )}
            <p className="text-[10px] text-slate-400 leading-normal">
              Define when execution traverses this path.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest">
              Condition Expression (Optional)
            </label>
            <textarea
              value={edgeExpression}
              onChange={(e) => setEdgeExpression(e.target.value)}
              placeholder={'e.g. output.score > 0.5 or output.intent == "cancel"'}
              className="w-full border border-slate-200 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs font-mono h-28 bg-slate-50/50 focus:bg-white text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
            />
            <p className="text-[10px] text-slate-450 leading-normal">
              JavaScript expression evaluated against source node output. Prefix variables with{' '}
              <code className="bg-slate-100 px-1 rounded text-[9px] font-mono">output.</code>.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 shrink-0 flex gap-2">
          <button
            onClick={() => onClose()}
            className="flex-1 py-2 text-xs font-semibold text-slate-650 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (onUpdateEdge && selectedEdge) {
                const trimmedCondition = (edgeCondition || '').trim();
                const trimmedExpression = (edgeExpression || '').trim();

                if (trimmedExpression && !trimmedCondition) {
                  alert(
                    'Please specify a condition name/label for your custom expression (e.g. is_safe, high_profit).',
                  );
                  return;
                }

                onUpdateEdge(selectedEdge.id || `${selectedEdge.source}_${selectedEdge.target}`, {
                  condition: trimmedCondition,
                  expression: trimmedExpression,
                } as any);
              }
            }}
            className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-750 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            Save Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[340px] shrink-0 border-l border-slate-100 bg-white flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="font-bold text-xs text-slate-700 flex items-center gap-2 uppercase tracking-wider">
          <Settings className="w-4 h-4 text-indigo-500" />
          Configure Node
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Node Metadata (Label & Color) */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/20 space-y-4 shrink-0 shadow-sm">
        <div className="space-y-1.5">
          <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest">
            Node Label / Display Name
          </label>
          <input
            type="text"
            value={String(
              selectedNode
                ? (selectedNode.data as any).label || (selectedNode.data as any).name || ''
                : '',
            )}
            onChange={(e) => {
              if (!selectedNode) return;
              const val = e.target.value;
              onUpdateNode(selectedNode.id, {
                ...(selectedNode.data as any),
                label: val,
              });
            }}
            disabled={false}
            placeholder="e.g. LLM Node"
            className="w-full border border-slate-200 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs bg-white text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-500 shrink-0">
        <button
          onClick={() => setViewMode('config')}
          className={`flex-1 py-3 text-center transition-all cursor-pointer ${
            viewMode === 'config'
              ? 'bg-white text-indigo-650 border-b-2 border-indigo-600 font-bold'
              : 'bg-slate-50/50 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          Properties
        </button>
        <button
          onClick={() => setViewMode('contract')}
          className={`flex-1 py-3 text-center text-[10px] transition-all cursor-pointer ${
            viewMode === 'contract'
              ? 'bg-white text-indigo-650 border-b-2 border-indigo-600 font-bold'
              : 'bg-slate-50/50 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          Data Contracts
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
        {(() => {
          if (viewMode === 'contract') {
            return (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">
                      Input Structure
                    </label>
                    <span className="flex items-center gap-1 text-[9px] font-bold text-slate-450 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 tracking-wide uppercase">
                      <Lock className="w-2.5 h-2.5" />
                      Read-only
                    </span>
                  </div>
                  <pre className="p-3 bg-slate-905 text-indigo-400 text-[10px] rounded-xl overflow-x-auto font-mono border border-slate-800 shadow-inner max-h-48 custom-scrollbar">
                    {JSON.stringify(inputContract || {}, null, 2)}
                  </pre>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">
                      Output Structure
                    </label>
                    <button
                      onClick={() => {
                        setGeneratorModalType('output');
                        setIsGeneratorModalOpen(true);
                      }}
                      className="flex items-center gap-1 text-[11px] font-bold text-emerald-650 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-2 py-1 rounded transition-colors cursor-pointer border border-emerald-150"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      Define from JSON
                    </button>
                  </div>
                  {(() => {
                    const schemaProps = outputContract?.properties || outputContract || {};
                    const propKeys = Object.keys(schemaProps);
                    
                    if (propKeys.length === 0) {
                      return (
                        <pre className="p-3 bg-slate-905 text-emerald-400 text-[10px] rounded-xl overflow-x-auto font-mono border border-slate-800 shadow-inner max-h-48 custom-scrollbar">
                          {JSON.stringify(outputContract || {}, null, 2)}
                        </pre>
                      );
                    }
                    
                    const stateMappings = (properties as any).state_mappings || (properties as any).output_mappings || {};
                    
                    return (
                      <div className="space-y-2.5 bg-slate-905 p-4 rounded-xl border border-slate-800">
                        <div className="text-[10px] font-bold text-slate-400 border-b border-slate-800 pb-1.5 mb-2 uppercase tracking-wide">
                          Export to Workflow State:
                        </div>
                        {propKeys.map((fieldKey) => {
                          let isMapped = false;
                          let mappedVarName = fieldKey;
                          
                          for (const [k, v] of Object.entries(stateMappings)) {
                            if (v === fieldKey || v === `{{ ${fieldKey} }}`) {
                              isMapped = true;
                              mappedVarName = k;
                              break;
                            }
                          }
                          
                          const propType = typeof schemaProps[fieldKey] === 'object' 
                            ? (schemaProps[fieldKey]?.type || 'any') 
                            : 'any';
                          
                          return (
                            <div key={fieldKey} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 hover:bg-slate-800/40 rounded-lg transition-colors border border-transparent hover:border-slate-800">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isMapped}
                                  id={`chk-state-${fieldKey}`}
                                  onChange={(e) => handleStateMappingChange(fieldKey, e.target.checked, mappedVarName)}
                                  className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-950 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <label htmlFor={`chk-state-${fieldKey}`} className="text-[11px] font-mono font-medium text-emerald-400 cursor-pointer">
                                  {fieldKey}
                                </label>
                                <span className="text-[8px] text-slate-500 bg-slate-950 px-1 rounded border border-slate-800 uppercase">
                                  {propType}
                                </span>
                              </div>
                              
                              {isMapped && (
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] text-slate-500 font-mono">as: state.</span>
                                  <input
                                    type="text"
                                    value={mappedVarName}
                                    onChange={(e) => handleStateMappingChange(fieldKey, true, e.target.value)}
                                    placeholder={fieldKey}
                                    className="px-2 py-0.5 text-[10px] font-mono text-slate-200 bg-slate-950 rounded border border-slate-700 focus:outline-none focus:border-emerald-500 w-24"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
                <p className="text-[10px] text-slate-450 leading-relaxed italic bg-indigo-50/40 p-3 rounded-xl border border-indigo-50">
                  Inject data values dynamically from upstream nodes using
                  <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[9px] font-mono text-indigo-700 mx-1 font-bold">
                    {'{{ node_id.output_key }}'}
                  </code>
                  syntax in text parameters.
                </p>
              </div>
            );
          }

          const formatLabel = (k: string) => {
            return k.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
          };

          const isTrigger =
            String(
              (selectedNode?.data as any)?.node_type || (selectedNode?.data as any)?.nodeType || '',
            ).toUpperCase() === 'TRIGGER';


          return (
            <div className="space-y-4">
              {/* Accordion Item: Parameters */}
              <div className="border border-slate-150 rounded-xl overflow-hidden shadow-sm bg-white">
                <button
                  type="button"
                  onClick={() => toggleSection('parameters')}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                      Parameters
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-450 transition-transform duration-200 ${
                      collapsedSections.parameters ? '-rotate-90' : 'rotate-0'
                    }`}
                  />
                </button>
                {!collapsedSections.parameters && (
                  <div className="p-4 space-y-4 border-t border-slate-100 bg-white">
                    {entries.length > 0 ? (
                      <div className="space-y-4">
                        {entries.map(([key, value]) => {
                          const label = formatLabel(key);
                          const valueType =
                            typeof value === 'boolean'
                              ? 'boolean'
                              : typeof value === 'number'
                                ? 'number'
                                : 'string';

                          const userPropsArray = Array.isArray((selectedNode?.data as any)?.user_properties) ? (selectedNode?.data as any)?.user_properties : [];
                          const systemPropsArray = Array.isArray((selectedNode?.data as any)?.system_properties) ? (selectedNode?.data as any)?.system_properties : [];
                          const schemaArray = (selectedNode?.data as any)?.propertySchema || (selectedNode?.data as any)?.property_schema || [];

                          const fieldSchema = schemaArray.find((f: any) => f.key === key) ||
                                              userPropsArray.find((f: any) => f.key === key) ||
                                              systemPropsArray.find((f: any) => f.key === key);
                          const fieldType = fieldSchema?.type || fieldSchema?.field_type || valueType;

                          if (fieldType === 'choice') {
                            const rawOptions = fieldSchema?.options || fieldSchema?.value;
                            const options: string[] = Array.isArray(rawOptions)
                              ? rawOptions
                              : typeof rawOptions === 'string'
                                ? (() => {
                                    try {
                                      const parsed = JSON.parse(rawOptions);
                                      return Array.isArray(parsed) ? parsed : [];
                                    } catch {
                                      return rawOptions.split(',').map((s: string) => s.trim());
                                    }
                                  })()
                                : [];

                            const isMultiple = Boolean(fieldSchema?.multiple);

                            if (isMultiple) {
                              return (
                                <div key={key} className="space-y-1.5">
                                  <label
                                    className="block text-[10px] font-bold text-slate-455 uppercase tracking-widest flex items-center gap-1.5 cursor-help"
                                    title={fieldSchema?.description}
                                  >
                                    {label}
                                    {fieldSchema?.description && (
                                      <span className="text-[9px] text-blue-500 font-bold bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full leading-none shadow-sm">
                                        i
                                      </span>
                                    )}
                                  </label>
                                  <select
                                    multiple
                                    value={Array.isArray(value) ? value.map(String) : []}
                                    onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                                      const values = Array.from(event.target.selectedOptions, (option) => option.value);
                                      handlePropertyChange(key, values);
                                    }}
                                    className="h-28 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50/30 focus:bg-white text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 transition-all shadow-inner-sm"
                                  >
                                    {options.map((option) => (
                                      <option key={option} value={option}>
                                        {option}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              );
                            }

                            return (
                              <div key={key} className="space-y-1.5">
                                <label
                                  className="block text-[10px] font-bold text-slate-455 uppercase tracking-widest flex items-center gap-1.5 cursor-help"
                                  title={fieldSchema?.description}
                                >
                                  {label}
                                  {fieldSchema?.description && (
                                    <span className="text-[9px] text-blue-500 font-bold bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full leading-none shadow-sm">
                                      i
                                    </span>
                                  )}
                                </label>
                                <select
                                  value={options.includes(String(value)) ? String(value) : (options[0] || '')}
                                  onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                                    handlePropertyChange(key, event.target.value)
                                  }
                                  className="w-full border border-slate-200 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs bg-slate-50/30 focus:bg-white text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 transition-all shadow-inner-sm cursor-pointer"
                                >
                                  {options.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          }

                          if (fieldType === 'boolean') {
                            return (
                              <label
                                key={key}
                                className="flex items-center justify-between gap-3 rounded-xl border border-slate-150 bg-slate-50/30 px-3.5 py-2.5 text-xs text-slate-700 cursor-pointer shadow-sm hover:border-slate-250 transition-all hover:bg-slate-50"
                              >
                                <span className="font-semibold text-slate-655">{label}</span>
                                <input
                                  type="checkbox"
                                  checked={Boolean(value)}
                                  onChange={(e) => handlePropertyChange(key, e.target.checked)}
                                  className="h-4 w-4 accent-indigo-600 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                              </label>
                            );
                          }

                          if (fieldType === 'number') {
                            return (
                              <div key={key} className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-widest">
                                  {label}
                                </label>
                                <input
                                  type="number"
                                  value={Number(value ?? 0)}
                                  onChange={(e) => handlePropertyChange(key, Number(e.target.value))}
                                  placeholder="Value"
                                  className="w-full border border-slate-200 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs bg-slate-50/30 focus:bg-white text-slate-800 outline-none transition-all shadow-inner-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                              </div>
                            );
                          }

                          // Multiline textarea for prompts/long strings
                          const isMultiline =
                            String(value ?? '').length > 40 ||
                            key.toLowerCase().includes('prompt') ||
                            key.toLowerCase().includes('query');

                          return (
                            <div key={key} className="space-y-1.5">
                              <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-widest">
                                {label}
                              </label>
                              {isMultiline ? (
                                <textarea
                                  value={String(value ?? '')}
                                  onChange={(e) => handlePropertyChange(key, e.target.value)}
                                  placeholder="Enter text/variables..."
                                  rows={3}
                                  className="w-full border border-slate-200 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs font-mono bg-slate-50/30 focus:bg-white text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 transition-all resize-y min-h-20 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                              ) : (
                                <input
                                  type={
                                    key.toLowerCase().includes('password') ||
                                    key.toLowerCase().includes('secret')
                                      ? 'password'
                                      : 'text'
                                  }
                                  value={String(value ?? '')}
                                  onChange={(e) => handlePropertyChange(key, e.target.value)}
                                  placeholder="Enter value..."
                                  className="w-full border border-slate-200 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs bg-slate-50/30 focus:bg-white text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 transition-all shadow-inner-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <p className="text-xs italic">No configurable parameters.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Accordion Item: Field Mapping */}
              {!isTrigger && (
                <div className="border border-slate-150 rounded-xl overflow-hidden shadow-sm bg-white">
                  <button
                    type="button"
                    onClick={() => toggleSection('mapping')}
                    className="w-full flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                        Field Mapping
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasPredecessor && onOpenMapper && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation(); // prevent collapsing section
                            onOpenMapper();
                          }}
                          className="flex items-center gap-1 text-[11px] font-bold text-indigo-650 hover:text-indigo-850 transition-colors cursor-pointer bg-transparent border-0 p-0 mr-1"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          Modify Mapping
                        </button>
                      )}
                      <ChevronDown
                        className={`w-4 h-4 text-slate-450 transition-transform duration-200 ${
                          collapsedSections.mapping ? '-rotate-90' : 'rotate-0'
                        }`}
                      />
                    </div>
                  </button>
                  {!collapsedSections.mapping && (
                    <div className="p-4 space-y-4 border-t border-slate-100 bg-white">
                      {hasPredecessor ? (
                        <div className="text-[10px] text-slate-655 bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-1.5 font-mono max-h-32 overflow-y-auto custom-scrollbar shadow-inner-sm">
                          {(() => {
                            let currentMapping: Record<string, string> = {};
                            try {
                              const value = properties.mapping_template;
                              currentMapping =
                                typeof value === 'string' ? JSON.parse(value) : value || {};
                            } catch {
                              currentMapping = {};
                            }

                            return Object.keys(currentMapping).length > 0 ? (
                              Object.entries(currentMapping).map(([tgt, src]) => (
                                <div
                                  key={tgt}
                                  className="truncate flex items-center justify-between gap-1.5 border-b border-slate-100/50 pb-1 last:border-0 last:pb-0"
                                >
                                  <span className="text-indigo-655 font-semibold">{tgt}</span>
                                  <span className="text-slate-450 font-normal truncate">
                                    &larr; {String(src)}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p className="text-[10px] text-slate-455 italic font-sans py-1 text-center">
                                {userRole === 'user'
                                  ? 'No fields mapped yet.'
                                  : 'No fields mapped yet. Click Modify Mapping to configure.'}
                              </p>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-slate-450 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                          <p className="text-[10px] italic">
                            Connect an upstream node to enable field mapping.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Accordion Item: Runtime System */}
              {systemEntries.length > 0 && (
                <div className="border border-slate-150 rounded-xl overflow-hidden shadow-sm bg-white">
                  <button
                    type="button"
                    onClick={() => toggleSection('system')}
                    className="w-full flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-slate-450" />
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                        Runtime System
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-bold text-slate-450 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-150 tracking-wide uppercase shrink-0">
                        READ ONLY
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-450 transition-transform duration-200 ${
                          collapsedSections.system ? '-rotate-90' : 'rotate-0'
                        }`}
                      />
                    </div>
                  </button>
                  {!collapsedSections.system && (
                    <div className="p-4 space-y-4 border-t border-slate-100 bg-white">
                      <div className="bg-slate-50/75 rounded-xl p-3 border border-slate-150 space-y-2.5 shadow-sm">
                        {systemEntries.map(([key, value]) => {
                          const label = formatLabel(key);
                          const isCopied = copiedKey === key;
                          return (
                            <div
                              key={key}
                              className="flex justify-between items-center gap-2 py-0.5 group/row"
                            >
                              <span className="font-semibold text-[10px] text-slate-500 truncate">
                                {label}
                              </span>
                              <div className="flex items-center gap-1.5 max-w-[70%]">
                                <span
                                  className="font-mono text-[10px] text-slate-700 bg-white border border-slate-150 px-2 py-0.5 rounded shadow-inner-sm truncate"
                                  title={String(value ?? '')}
                                >
                                  {String(value ?? '')}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(key, value)}
                                  className="p-1 hover:bg-slate-150 rounded transition-colors shrink-0 opacity-0 group-hover/row:opacity-100 focus:opacity-100 text-slate-400 hover:text-slate-655 cursor-pointer"
                                  title="Copy to clipboard"
                                >
                                  {isCopied ? (
                                    <Check className="w-3 h-3 text-emerald-600 font-bold" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Footer - Save & Delete Buttons */}
      {(onSave || selectedNode) && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/30 shrink-0 flex flex-col gap-2">
          <button
            onClick={handleSaveInstanceProperties}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-750 disabled:bg-indigo-400 rounded-xl text-xs font-bold text-white shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {isSaving ? 'Saving...' : entries.length > 0 ? 'Save Parameters' : 'Save Label'}
          </button>
          {userRole !== 'user' && onDeleteNode && selectedNode && (
            <button
              onClick={() => {
                const nodeName =
                  (selectedNode.data as any).label ||
                  (selectedNode.data as any).name ||
                  selectedNode.id;
                if (window.confirm(`Are you sure you want to delete the node "${nodeName}"?`)) {
                  onDeleteNode(selectedNode.id);
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-rose-200 hover:border-rose-350 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Node
            </button>
          )}
        </div>
      )}

      {/* Modal for defining input/output contracts from JSON sample */}
      <JsonSchemaGeneratorModal
        isOpen={isGeneratorModalOpen}
        onClose={() => setIsGeneratorModalOpen(false)}
        initialSchema={generatorModalType === 'input' ? inputContract : outputContract}
        onSave={(schema) => handleSaveContract(generatorModalType, schema)}
        title={
          generatorModalType === 'input'
            ? `Define Input Contract for ${(selectedNode?.data as any)?.label || 'Node'}`
            : `Define Output Contract for ${(selectedNode?.data as any)?.label || 'Node'}`
        }
      />
    </div>
  );
}
