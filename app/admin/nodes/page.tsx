'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { IconMap } from '@/lib/icons';
import { AgentNode, NodeCategory } from '@components/component-categoriees';
import JsonSchemaGeneratorModal from '@components/JsonSchemaGeneratorModal';
import {
  Plus,
  Box,
  Code2,
  Trash2,
  Lock,
  Edit2,
  X,
  Settings,
  Info,
  CheckCircle,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';

type PropertyTarget = 'user' | 'system';

type PropertyEntry = {
  key: string;
  label?: string;
  type?: string;
  value?: any;
  default?: any;
  multiple?: boolean;
  description?: string;
  source?: string;
};

type PropertyRow = PropertyEntry & {
  category: PropertyTarget;
  sourceIndex: number;
};

type ContractRule = {
  field_name: string;
  field_type: string;
  required?: boolean | string;
  description?: string;
  min_length?: number | '';
  max_length?: number | '';
  min_items?: number | '';
  max_items?: number | '';
  minimum?: number | '';
  maximum?: number | '';
  allow_negative?: boolean;
  format?: string;
  allowed_values?: string[];
  redact?: boolean;
  nullable?: boolean;
};

type FlatInputContract = {
  version: string;
  rules: ContractRule[];
  additional_fields?: boolean;
};

const CONTRACT_FIELD_TYPES = [
  'string',
  'number',
  'integer',
  'boolean',
  'object',
  'array',
  'enum',
  'json',
  'email',
  'password',
  'phone',
  'credit_card',
  'url',
  'uuid',
  'date',
  'datetime',
  'ip_address',
  'file',
  'pdf',
  'doc',
  'docx',
  'image',
];

const IS_PII = ['email', 'password', 'phone', 'credit_card'];

const numberOrEmpty = (value: any) => {
  if (value === '' || value === null || value === undefined) return '';
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : '';
};

const hasNumberValue = (value: number | '' | undefined) => value !== '' && value !== undefined;

const boolFromValue = (value: any) =>
  value === true || String(value).trim().toLowerCase() === 'true';

const safeJsonParse = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const propertyEntriesFromValue = (value: any): PropertyEntry[] => {
  if (!value) return [];
  if (typeof value === 'string') {
    const parsed = safeJsonParse(value);
    return propertyEntriesFromValue(parsed);
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? safeJsonParse(item) : item))
      .filter((item): item is PropertyEntry => !!item && typeof item === 'object' && typeof item.key === 'string');
  }
  if (typeof value === 'object') {
    return Object.entries(value).map(([key, entryValue]) => ({
      key,
      label: key,
      type: Array.isArray(entryValue) ? 'list' : typeof entryValue,
      value: entryValue,
    }));
  }
  return [];
};

const propertyEntriesToJsonStrings = (entries: PropertyEntry[]): any[] =>
  entries.map((entry) => ({
    key: entry.key,
    label: entry.label || entry.key,
    type: entry.type || 'string',
    value: entry.value ?? '',
    default: entry.default ?? '',
    description: entry.description ?? '',
    source: entry.source || undefined,
    multiple: entry.multiple || undefined,
  }));

const normalizeContractRule = (rule: any): ContractRule => {
  const fieldType = rule.field_type || rule.type || 'string';
  return {
    field_name: rule.field_name || rule.field || rule.key || '',
    field_type: fieldType,
    required: boolFromValue(rule.required ?? rule.mandatory ?? false),
    description: rule.description || '',
    min_length: numberOrEmpty(rule.min_length ?? rule.minLength),
    max_length: numberOrEmpty(rule.max_length ?? rule.maxLength),
    min_items: numberOrEmpty(rule.min_items ?? rule.minItems),
    max_items: numberOrEmpty(rule.max_items ?? rule.maxItems),
    minimum: numberOrEmpty(rule.minimum),
    maximum: numberOrEmpty(rule.maximum),
    allow_negative: rule.allow_negative ?? undefined,
    format: rule.format || '',
    allowed_values: Array.isArray(rule.allowed_values)
      ? rule.allowed_values
      : Array.isArray(rule.enum)
        ? rule.enum
        : [],
    redact: boolFromValue(rule.redact ?? (IS_PII.includes(fieldType) ? true : false)),
    nullable: boolFromValue(rule.nullable ?? false),
  };
};

const contractFromValue = (value: any): FlatInputContract => {
  const emptyContract = { version: '1.0', rules: [], additional_fields: true };
  if (!value) return emptyContract;

  const parsed = typeof value === 'string' ? safeJsonParse(value) : value;
  if (!parsed || typeof parsed !== 'object') return emptyContract;

  if (Array.isArray(parsed.rules)) {
    return {
      version: parsed.version || '1.0',
      rules: parsed.rules.map(normalizeContractRule),
      additional_fields: parsed.additional_fields ?? parsed.additionalProperties ?? true,
    };
  }

  const rules: ContractRule[] = [];
  const addLegacyRule = (fieldName: string, rule: any) => {
    if (!fieldName || fieldName === 'type' || fieldName === 'required') return;
    if (rule && typeof rule === 'object' && !rule.type && !rule.field_type) {
      Object.entries(rule).forEach(([childName, childRule]) => {
        if (['required', 'mandatory', 'values'].includes(childName)) return;
        addLegacyRule(`${fieldName}.${childName}`, childRule);
      });
      return;
    }
    rules.push(
      normalizeContractRule({
        field_name: fieldName,
        field_type: rule?.type || rule?.field_type || (Array.isArray(rule?.values) ? 'array' : 'json'),
        required: rule?.required ?? rule?.mandatory ?? false,
        description: rule?.description || '',
      })
    );
  };

  if (parsed.type === 'object' && parsed.properties && typeof parsed.properties === 'object') {
    Object.entries(parsed.properties).forEach(([fieldName, rule]) => {
      rules.push(
        normalizeContractRule({
          ...(rule as object),
          field_name: fieldName,
          required: Array.isArray(parsed.required) && parsed.required.includes(fieldName),
        })
      );
    });
  } else {
    Object.entries(parsed).forEach(([fieldName, rule]) => addLegacyRule(fieldName, rule));
  }

  return {
    version: parsed.version || '1.0',
    rules,
    additional_fields: parsed.additional_fields ?? parsed.additionalProperties ?? true,
  };
};

const cleanContractRule = (rule: ContractRule): ContractRule => {
  const cleaned: Record<string, any> = {
    field_name: rule.field_name.trim(),
    field_type: rule.field_type || 'string',
    required: boolFromValue(rule.required),
  };

  if (rule.description?.trim()) cleaned.description = rule.description.trim();
  if (rule.field_type === 'array') {
    if (hasNumberValue(rule.min_items)) cleaned.min_items = Number(rule.min_items);
    if (hasNumberValue(rule.max_items)) cleaned.max_items = Number(rule.max_items);
  } else {
    if (hasNumberValue(rule.min_length)) cleaned.min_length = Number(rule.min_length);
    if (hasNumberValue(rule.max_length)) cleaned.max_length = Number(rule.max_length);
  }
  if (hasNumberValue(rule.minimum)) cleaned.minimum = Number(rule.minimum);
  if (hasNumberValue(rule.maximum)) cleaned.maximum = Number(rule.maximum);
  if (rule.allow_negative !== undefined) cleaned.allow_negative = rule.allow_negative;
  if (rule.format) cleaned.format = rule.format;
  if (rule.allowed_values?.length) cleaned.allowed_values = rule.allowed_values;
  if (rule.redact) cleaned.redact = true;
  if (rule.nullable) cleaned.nullable = true;

  return cleaned as ContractRule;
};

const cleanInputContract = (contract: FlatInputContract): FlatInputContract => ({
  version: contract.version || '1.0',
  rules: contract.rules.map(cleanContractRule),
  additional_fields: contract.additional_fields ?? true,
});

const validateInputContract = (contract: FlatInputContract): FlatInputContract => ({
  version: contract.version || '1.0',
  rules: contract.rules.filter((rule) => rule.field_name.trim()).map(cleanContractRule),
  additional_fields: contract.additional_fields ?? true,
});

interface NodesTabProps {
  userRole: string | null;
  customerId?: number | null;
}

export default function NodesTab({ userRole, customerId }: NodesTabProps) {
  const [agents, setAgents] = useState<AgentNode[]>([]);
  const [categories, setCategories] = useState<NodeCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [jsonExpandedState, setJsonExpandedState] = useState<Record<string, boolean>>({});

  // Category Edit State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<NodeCategory> | null>(null);

  // Agent Node Edit State
  const [editingAgent, setEditingAgent] = useState<AgentNode | null>(null);
  const [isEditingProp, setIsEditingProp] = useState(false);
  const [propModal, setPropModal] = useState({
    isOpen: false,
    target: 'user' as PropertyTarget,
    originalTarget: 'user' as PropertyTarget,
    sourceIndex: -1,
    key: '',
    label: '',
    type: 'string',
    defaultValue: '',
    value: '',
    description: '',
    source: '',
    multiple: false,
  });

  const [contractGenerator, setContractGenerator] = useState({
    isOpen: false,
    type: 'input' as 'input' | 'output',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const nodesRes = (await api.getNodes()) as any;
      setAgents(nodesRes.nodes || nodesRes.agents || []);
      const catsRes = await api.getNodesCategories();
      const cats = Array.isArray(catsRes) ? catsRes : catsRes.categories || [];
      const normalizedCats = cats.map((cat: any) =>
        typeof cat === 'string'
          ? { name: cat, label: cat }
          : { ...cat, name: cat.group || cat.name }
      );
      setCategories(normalizedCats);
    } catch (err) {
      console.error('Failed to load nodes catalog data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const nodeTypes = Array.from(new Set(agents.map((a) => a.node_type.toUpperCase())));

  const filteredAgents = agents.filter((agent) => {
    if (filterCategory !== 'all') {
      const catMatches =
        agent.category === filterCategory ||
        categories.find((c) => String(c.id) === String(filterCategory))?.name === agent.category;
      if (!catMatches) return false;
    }
    if (filterType !== 'all') {
      if (agent.node_type.toLowerCase() !== filterType.toLowerCase()) return false;
    }
    return true;
  });

  const toggleJsonExpanded = (agent: AgentNode) => {
    const agentKey = agent.id?.toString() || agent.name;
    setJsonExpandedState((prev) => ({
      ...prev,
      [agentKey]: !prev[agentKey],
    }));
  };

  const handleSaveCategory = async () => {
    if (!editingCategory) return;
    try {
      if (editingCategory.id) {
        await api.updateCategory(editingCategory.id, editingCategory);
      } else {
        await api.createCategory(editingCategory);
      }
      fetchData();
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.deleteCategory(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const openPropModal = (field?: any, isSystem?: boolean) => {
    if (field) {
      const target = isSystem ? 'system' : 'user';
      setPropModal({
        isOpen: true,
        target,
        originalTarget: target,
        sourceIndex: field.sourceIndex ?? -1,
        key: field.key,
        label: field.label || field.key,
        type: field.type || 'string',
        defaultValue: field.default || '',
        value: field.value ?? '',
        description: field.description || '',
        source: field.source || '',
        multiple: !!field.multiple,
      });
      setIsEditingProp(true);
    } else {
      setPropModal({
        isOpen: true,
        target: 'user',
        originalTarget: 'user',
        sourceIndex: -1,
        key: '',
        label: '',
        type: 'string',
        defaultValue: '',
        value: '',
        description: '',
        source: '',
        multiple: false,
      });
      setIsEditingProp(false);
    }
  };

  const handleSavePropFromModal = () => {
    if (!propModal.key || !editingAgent) return;

    setEditingAgent((prev) => {
      if (!prev) return null;

      const isUser = propModal.target === 'user';
      const userProps = propertyEntriesFromValue(prev.user_properties);
      const sysProps = propertyEntriesFromValue(prev.system_properties);
      const nextEntry = {
        key: propModal.key,
        label: propModal.label || propModal.key,
        type: propModal.type || 'string',
        value: propModal.value,
        default: propModal.defaultValue,
        description: propModal.description || '',
        source: propModal.source || undefined,
        multiple: propModal.multiple || undefined,
      };

      if (isEditingProp && propModal.sourceIndex >= 0) {
        const originalProps = propModal.originalTarget === 'user' ? userProps : sysProps;
        originalProps.splice(propModal.sourceIndex, 1);
      }

      if (isUser) {
        userProps.push(nextEntry);
      } else {
        sysProps.push(nextEntry);
      }

      return {
        ...prev,
        user_properties: propertyEntriesToJsonStrings(userProps),
        system_properties: propertyEntriesToJsonStrings(sysProps),
      };
    });
    setPropModal((prev) => ({ ...prev, isOpen: false }));
  };

  const updateProperty = (row: PropertyRow, value: any) => {
    setEditingAgent((prev) => {
      if (!prev) return null;
      const userProps = propertyEntriesFromValue(prev.user_properties);
      const sysProps = propertyEntriesFromValue(prev.system_properties);
      const entries = row.category === 'user' ? userProps : sysProps;

      if (!entries[row.sourceIndex]) return prev;
      entries[row.sourceIndex] = { ...entries[row.sourceIndex], value };

      return {
        ...prev,
        user_properties: propertyEntriesToJsonStrings(userProps),
        system_properties: propertyEntriesToJsonStrings(sysProps),
      };
    });
  };

  const updateInputContract = (updater: (contract: FlatInputContract) => FlatInputContract) => {
    setEditingAgent((prev) => {
      if (!prev) return null;
      const currentContract = contractFromValue(prev.input_contract);
      return {
        ...prev,
        input_contract: cleanInputContract(updater(currentContract)),
      };
    });
  };

  const handleGeneratedContract = (schema: any) => {
    setEditingAgent((prev) => {
      if (!prev) return null;

      if (contractGenerator.type === 'input') {
        return {
          ...prev,
          input_contract: cleanInputContract(contractFromValue(schema)),
        };
      }

      return {
        ...prev,
        output_contract: schema,
      };
    });
  };

  const handleSaveInputContract = async () => {
    if (!editingAgent) return;
    if (editingAgent.is_enabled === false) {
      alert('This node is locked and cannot be configured because it has been disabled.');
      return;
    }

    try {
      const currentContract = contractFromValue(editingAgent.input_contract);
      const validatedContract = validateInputContract(currentContract);

      if (customerId) {
        const overrides: Record<string, any> = {};
        const userProps = propertyEntriesFromValue(editingAgent.user_properties);
        const sysProps = propertyEntriesFromValue(editingAgent.system_properties);
        [...userProps, ...sysProps].forEach((entry: any) => {
          if (entry.key) {
            overrides[entry.key] = entry.value !== undefined ? entry.value : entry.default;
          }
        });

        let finalOutputContract = {};
        try {
          if (typeof editingAgent.output_contract === 'string' && editingAgent.output_contract.trim() !== '') {
            finalOutputContract = JSON.parse(editingAgent.output_contract);
          } else if (editingAgent.output_contract && typeof editingAgent.output_contract === 'object') {
            finalOutputContract = editingAgent.output_contract;
          }
        } catch (e) {}

        await api.configureCustomerNode(
          editingAgent.name,
          {
            properties: overrides,
            user_properties: propertyEntriesToJsonStrings(userProps),
            system_properties: propertyEntriesToJsonStrings(sysProps),
            is_enabled: editingAgent.is_enabled !== undefined ? editingAgent.is_enabled : true,
            input_contract: validatedContract,
            output_contract: finalOutputContract,
            label: editingAgent.label,
          },
          customerId || undefined
        );

        fetchData();
        alert('Input contract overrides saved successfully!');
        return;
      }

      if (!editingAgent.id) {
        alert('Please create the node first before saving input contracts separately.');
        return;
      }

      const updatedAgent = { ...editingAgent, input_contract: validatedContract };
      await api.updateNode(updatedAgent);
      fetchData();
      alert('Input contract saved successfully!');
    } catch (error) {
      console.error('Failed to save input contract:', error);
      alert('Failed to save input contract.');
    }
  };

  const handleSaveNode = async () => {
    if (!editingAgent) return;
    const finalAgent = { ...editingAgent };

    try {
      if (typeof finalAgent.input_contract === 'string' && finalAgent.input_contract.trim() !== '') {
        finalAgent.input_contract = validateInputContract(contractFromValue(finalAgent.input_contract));
      } else if (typeof finalAgent.input_contract === 'string') {
        finalAgent.input_contract = validateInputContract(contractFromValue({}));
      } else {
        finalAgent.input_contract = validateInputContract(contractFromValue(finalAgent.input_contract));
      }
    } catch (e) {
      alert('Invalid JSON in Input Contract field.');
      return;
    }

    try {
      if (typeof finalAgent.output_contract === 'string' && finalAgent.output_contract.trim() !== '') {
        finalAgent.output_contract = JSON.parse(finalAgent.output_contract);
      } else if (typeof finalAgent.output_contract === 'string') {
        finalAgent.output_contract = {};
      }
    } catch (e) {
      alert('Invalid JSON in Output Contract field.');
      return;
    }

    try {
      finalAgent.user_properties = propertyEntriesToJsonStrings(propertyEntriesFromValue(finalAgent.user_properties));
    } catch (e) {
      alert('Invalid JSON in User Properties field.');
      return;
    }

    try {
      finalAgent.system_properties = propertyEntriesToJsonStrings(propertyEntriesFromValue(finalAgent.system_properties));
    } catch (e) {
      alert('Invalid JSON in System Properties field.');
      return;
    }

    if (finalAgent.category) {
      const matchingCat = categories.find(
        (cat) =>
          String(cat.id) === String(finalAgent.category) ||
          cat.name === finalAgent.category ||
          cat.group === finalAgent.category ||
          cat.label === finalAgent.category
      );
      if (matchingCat && matchingCat.id !== undefined) {
        finalAgent.category = String(matchingCat.id);
      }
    } else if (categories.length > 0) {
      finalAgent.category = String(categories[0].id);
    }

    try {
      if (finalAgent.id) {
        await api.updateNode(finalAgent);
      } else {
        await api.createNode(finalAgent);
      }
      fetchData();
      setEditingAgent(null);
    } catch (error) {
      const isUpdate = !!editingAgent.id;
      console.error(`Failed to ${isUpdate ? 'save' : 'create'} node:`, error);
      alert(`Failed to ${isUpdate ? 'save' : 'create'} node.`);
    }
  };

  const handleDeleteNode = async (nodeName: string) => {
    if (!confirm(`Are you sure you want to delete the node type "${nodeName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      // Endpoint logic if exposed in API
      alert(`Node type "${nodeName}" deletion triggered. (Requires backend implementation)`);
      fetchData();
    } catch (error) {
      console.error('Failed to delete node:', error);
    }
  };

  const renderValueInput = (field: PropertyRow, value: any) => {
    const handleValChange = (v: any) => updateProperty(field, v);
    const commonClasses =
      'w-full bg-white border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 text-sm text-black';

    const displayValue = value !== undefined && value !== null ? value : field.default;
    const isDisabled = userRole !== 'system_admin' && !customerId;

    if (field.type === 'password' || field.type?.toLowerCase().includes('secret')) {
      return (
        <input
          type="password"
          className={`${commonClasses} text-black`}
          value={String(displayValue ?? '')}
          placeholder="••••••••"
          autoComplete="new-password"
          onChange={(e) => handleValChange(e.target.value)}
          disabled={isDisabled}
        />
      );
    }

    if (field.type === 'source') {
      const isUser = field.category === 'user';
      return (
        <div className="space-y-1 w-full font-sans">
          <input
            type="text"
            className={`${commonClasses} text-black font-mono`}
            value={field.source || ''}
            placeholder="e.g. /api/knowledge/bases"
            disabled={isDisabled}
            onChange={(e) => {
              const newSourceVal = e.target.value;
              setEditingAgent((prev) => {
                if (!prev) return null;
                const userProps = propertyEntriesFromValue(prev.user_properties);
                const sysProps = propertyEntriesFromValue(prev.system_properties);
                const entries = isUser ? userProps : sysProps;
                if (field.sourceIndex >= 0 && entries[field.sourceIndex]) {
                  entries[field.sourceIndex] = {
                    ...entries[field.sourceIndex],
                    source: newSourceVal,
                  };
                }
                return {
                  ...prev,
                  user_properties: propertyEntriesToJsonStrings(userProps),
                  system_properties: propertyEntriesToJsonStrings(sysProps),
                };
              });
            }}
          />
        </div>
      );
    }

    if (field.type === 'boolean') {
      return (
        <select
          className={`${commonClasses} text-black`}
          value={String(displayValue ?? false)}
          onChange={(e) => handleValChange(e.target.value === 'true')}
          disabled={isDisabled}
        >
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      );
    }

    if (field.type === 'number') {
      return (
        <input
          type="number"
          className={`${commonClasses} text-black`}
          value={displayValue ?? 0}
          onChange={(e) => handleValChange(Number(e.target.value))}
          disabled={isDisabled}
        />
      );
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          className={`${commonClasses} text-black min-h-[60px] resize-y`}
          value={String(displayValue ?? '')}
          placeholder="Multiline content..."
          onChange={(e) => handleValChange(e.target.value)}
          disabled={isDisabled}
        />
      );
    }

    if (field.multiple || field.type === 'list') {
      return (
        <input
          className={`${commonClasses} text-black`}
          value={Array.isArray(displayValue) ? displayValue.join(', ') : String(displayValue ?? '')}
          placeholder="val1, val2, val3..."
          onChange={(e) =>
            handleValChange(
              e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            )
          }
          disabled={isDisabled}
        />
      );
    }

    return (
      <input
        className={`${commonClasses} text-black`}
        value={typeof displayValue === 'object' ? JSON.stringify(displayValue) : String(displayValue ?? '')}
        placeholder="Enter value..."
        onChange={(e) => handleValChange(e.target.value)}
        disabled={isDisabled}
      />
    );
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400 text-sm font-medium">Loading nodes catalog...</div>;
  }

  return (
    <>
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Box className="h-5 w-5 text-gray-400" />
            <h2 className="text-xl font-semibold text-black">Nodes Catalog Registry</h2>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Dropdown Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Category:</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-black focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map((cat, idx) => (
                  <option key={`filter-cat-${cat.id || idx}`} value={cat.id ? String(cat.id) : cat.name}>
                    {cat.label || cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Dropdown Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Type:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-black focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="default">Default</option>
                <option value="trigger">Trigger</option>
                <option value="tool">Tool</option>
                <option value="node">Node</option>
                {nodeTypes
                  .filter((t) => !['DEFAULT', 'TRIGGER', 'TOOL', 'NODE'].includes(t))
                  .map((t) => (
                    <option key={`filter-type-${t}`} value={t.toLowerCase()}>
                      {t}
                    </option>
                  ))}
              </select>
            </div>

            {!customerId && (
              <button
                onClick={() =>
                  setEditingAgent({
                    name: '',
                    label: '',
                    description: '',
                    node_type: 'default',
                    version: '1.0.0',
                    category: categories[0]?.id?.toString() || '',
                    group: '',
                    icon: 'bot',
                    color: '#5E0CEC',
                    badge: 'Node',
                    sub_label: '',
                    system_properties: [],
                    user_properties: [],
                    input_contract: { version: '1.0', rules: [], additional_fields: true },
                    output_contract: {},
                  })
                }
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm cursor-pointer"
              >
                + Add New Node
              </button>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Label</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Name (ID) / Version</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">JSON Definition</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAgents.map((agent, idx) => {
                const agentKey = agent.id?.toString() || agent.name;
                const AgentIcon = (agent.icon && IconMap[agent.icon.toLowerCase()]) || IconMap.box || IconMap.bot;

                return (
                  <tr key={agent.id ? `node-${agent.id}` : `node-${agent.name}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border shadow-sm"
                          style={{
                            borderColor: agent.color && agent.color.length === 7 ? `${agent.color}40` : '#e5e7eb',
                            backgroundColor: agent.color && agent.color.length === 7 ? `${agent.color}10` : '#f9fafb',
                            color: agent.color || '#6b7280',
                          }}
                        >
                          <AgentIcon className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-black">{agent.label || agent.name}</span>
                          </div>
                          {agent.sub_label && <span className="text-xs text-blue-600 font-medium mt-0.5">{agent.sub_label}</span>}
                          <p className="text-xs text-gray-650 line-clamp-2 mt-0.5">{agent.description || 'No description.'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-700 font-mono">{agent.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono mt-0.5">v{agent.version}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-bold uppercase ${
                          agent.node_type.toLowerCase() === 'trigger'
                            ? 'bg-green-50 text-green-700 border border-green-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}
                      >
                        {agent.node_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleJsonExpanded(agent)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-xs whitespace-nowrap cursor-pointer"
                      >
                        <Code2 className="h-3.5 w-3.5" />
                        {jsonExpandedState[agentKey] ? 'Hide Definition' : 'Show Definition'}
                      </button>
                      <div
                        className={`w-full max-w-xs overflow-hidden rounded-lg bg-gray-950 font-mono text-emerald-400 shadow-inner transition-all duration-300 ${
                          jsonExpandedState[agentKey] ? 'max-h-64 p-3 mt-2 overflow-auto opacity-100' : 'max-h-0 p-0 opacity-0'
                        }`}
                      >
                        <pre className="text-[10px]">
                          {JSON.stringify(
                            {
                              properties: agent.user_properties,
                              system_properties: agent.system_properties,
                              input_contract: agent.input_contract,
                              output_contract: agent.output_contract,
                            },
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right min-w-[100px]">
                      <div className="flex items-center justify-end gap-2">
                        {customerId &&
                          (agent.is_enabled === false ? (
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border bg-red-50 text-red-700 border-red-200 cursor-not-allowed select-none transition-all shadow-sm">
                              <Lock className="h-3 w-3 text-red-500" />
                              <span>Locked</span>
                            </div>
                          ) : (
                            <button
                              onClick={async () => {
                                try {
                                  await api.configureCustomerNode(
                                    agent.name,
                                    { fieldname: 'is_enabled', value: false },
                                    customerId || undefined
                                  );
                                  fetchData();
                                } catch (err: any) {
                                  alert('Failed to toggle status: ' + err.message);
                                }
                              }}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg border transition-all bg-green-50 text-green-700 border-green-200 hover:bg-green-100 cursor-pointer"
                              title="Click to Disable"
                            >
                              Enabled
                            </button>
                          ))}
                        <button
                          onClick={() => {
                            if (agent.is_enabled === false) return;
                            setEditingAgent({ ...agent });
                          }}
                          disabled={agent.is_enabled === false}
                          className={`p-1 rounded transition-colors ${
                            agent.is_enabled === false ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50 cursor-pointer'
                          }`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {!customerId && (
                          <button
                            onClick={() => handleDeleteNode(agent.name)}
                            className="p-1 text-red-650 hover:bg-red-50 rounded cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Edit Agent/Node Modal */}
      {editingAgent && (
        <div className="fixed max-w-full inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
              <div className="flex flex-col">
                <h3 className="text-xl font-bold font-mono text-black">
                  {customerId ? `${editingAgent.name}` : editingAgent.id ? 'Edit Node Registry' : 'Create New Node Type'}
                </h3>
                <p className="text-xs text-gray-500 font-mono uppercase mt-0.5">
                  {editingAgent.id ? `${editingAgent.name} v${editingAgent.version || '1.0.0'}` : 'New Registry Entry'}
                </p>
              </div>
              <button onClick={() => setEditingAgent(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Display Label</label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={editingAgent.label || ''}
                    onChange={(e) => setEditingAgent({ ...editingAgent, label: e.target.value })}
                    placeholder="e.g. My Custom Agent"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Node Category</label>
                  <select
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
                    value={editingAgent.category || ''}
                    onChange={(e) => setEditingAgent({ ...editingAgent, category: e.target.value })}
                    disabled={userRole !== 'system_admin'}
                  >
                    {categories.map((cat, idx) => (
                      <option key={`opt-${cat.id || cat.name || idx}`} value={cat.id}>
                        {cat.label || cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Sub Label</label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={editingAgent.sub_label || ''}
                    onChange={(e) => setEditingAgent({ ...editingAgent, sub_label: e.target.value })}
                    disabled={userRole !== 'system_admin'}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Node Type</label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={editingAgent.node_type || ''}
                    onChange={(e) => setEditingAgent({ ...editingAgent, node_type: e.target.value })}
                    disabled={userRole !== 'system_admin'}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">UI Group</label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={editingAgent.group || ''}
                    onChange={(e) => setEditingAgent({ ...editingAgent, group: e.target.value })}
                    disabled={userRole !== 'system_admin'}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Icon Name (Lucide)</label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={editingAgent.icon || ''}
                    onChange={(e) => setEditingAgent({ ...editingAgent, icon: e.target.value })}
                    disabled={userRole !== 'system_admin'}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Description</label>
                  <textarea
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 h-20 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingAgent.description || ''}
                    onChange={(e) => setEditingAgent({ ...editingAgent, description: e.target.value })}
                    disabled={userRole !== 'system_admin'}
                  />
                </div>
              </div>

              {/* Property Registry */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div>
                    <h4 className="font-bold text-black">Property Registry</h4>
                    <p className="text-xs text-gray-500">Configure User (UI-visible) and System (Internal) properties.</p>
                  </div>
                  {userRole === 'system_admin' && (
                    <button
                      onClick={() => openPropModal()}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 uppercase bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 cursor-pointer"
                    >
                      + Add Property
                    </button>
                  )}
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Property Name (Key)</th>
                        <th className="px-4 py-3">UI Label</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Default Value</th>
                        {userRole === 'system_admin' && <th className="px-4 py-3 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {(() => {
                        const userProps = propertyEntriesFromValue(editingAgent.user_properties);
                        const sysProps = propertyEntriesFromValue(editingAgent.system_properties);

                        const rows: PropertyRow[] = [
                          ...sysProps.map((prop, sourceIndex) => ({
                            ...prop,
                            label: prop.label || prop.key,
                            type: prop.type || 'string',
                            category: 'system' as const,
                            sourceIndex,
                          })),
                          ...userProps.map((prop, sourceIndex) => ({
                            ...prop,
                            label: prop.label || prop.key,
                            type: prop.type || 'string',
                            category: 'user' as const,
                            sourceIndex,
                          })),
                        ];

                        return rows.map((row, idx) => (
                          <tr
                            key={`unified-row-${idx}`}
                            className={`group hover:bg-gray-50 transition-colors ${userRole === 'system_admin' ? 'cursor-pointer' : ''}`}
                            onClick={() => {
                              if (userRole === 'system_admin') {
                                openPropModal(row, row.category === 'system');
                              }
                            }}
                          >
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                  row.category === 'user' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-100 text-gray-600 border-gray-200'
                                }`}
                              >
                                {row.category}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-black">{row.key}</td>
                            <td className="px-4 py-3 text-gray-600">
                              <div className="font-semibold text-sm">{row.label}</div>
                              {row.description && <div className="text-xs text-gray-405 italic mt-0.5">{row.description}</div>}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-[10px] font-mono text-gray-400">{row.type}</span>
                            </td>
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              {row.category === 'user' ? (
                                renderValueInput(row, row.value)
                              ) : (
                                <span className="text-gray-400 font-mono text-xs">{String(row.value)}</span>
                              )}
                            </td>
                            {userRole === 'system_admin' && (
                              <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() =>
                                    setEditingAgent((prev) => {
                                      if (!prev) return null;
                                      const userProps = propertyEntriesFromValue(prev.user_properties);
                                      const sysProps = propertyEntriesFromValue(prev.system_properties);
                                      const entries = row.category === 'user' ? userProps : sysProps;
                                      entries.splice(row.sourceIndex, 1);
                                      return {
                                        ...prev,
                                        user_properties: propertyEntriesToJsonStrings(userProps),
                                        system_properties: propertyEntriesToJsonStrings(sysProps),
                                      };
                                    })
                                  }
                                  className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Input Contract Section */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                <div className="col-span-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-black">Input Contract</h4>
                      <p className="text-xs text-gray-500">Define the JSON body a node must receive before execution.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setContractGenerator({ isOpen: true, type: 'input' })}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 underline cursor-pointer"
                    >
                      Generate from JSON
                    </button>
                  </div>
                  <div className="flex gap-3 items-start">
                    <details className="flex-1 rounded-xl border border-gray-200 bg-gray-50">
                      <summary className="cursor-pointer px-4 py-3 text-xs font-bold uppercase text-gray-500 select-none">
                        JSON Preview
                      </summary>
                      <pre className="max-h-64 overflow-auto border-t border-gray-200 p-4 text-xs text-gray-700">
                        {JSON.stringify(cleanInputContract(contractFromValue(editingAgent.input_contract)), null, 2)}
                      </pre>
                    </details>
                    {editingAgent.id && (
                      <button
                        onClick={handleSaveInputContract}
                        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 shadow-md transition-all whitespace-nowrap h-fit mt-1 cursor-pointer"
                      >
                        Save Input Contract
                      </button>
                    )}
                  </div>
                </div>

                <div className="col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-black">Output Contract</h4>
                      <p className="text-xs text-gray-500">Define the JSON body a node sends after execution.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setContractGenerator({ isOpen: true, type: 'output' })}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 underline cursor-pointer"
                    >
                      Generate from JSON
                    </button>
                  </div>
                  <div className="flex gap-3 items-start">
                    <details className="flex-1 rounded-xl border border-gray-200 bg-gray-50">
                      <summary className="cursor-pointer px-4 py-3 text-xs font-bold uppercase text-gray-500 select-none">
                        JSON Preview
                      </summary>
                      <pre className="max-h-64 overflow-auto border-t border-gray-200 p-4 text-xs text-gray-700">
                        {JSON.stringify(editingAgent.output_contract, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t bg-gray-50 px-8 py-4 flex justify-end gap-3">
              <button
                onClick={() => setEditingAgent(null)}
                className="rounded-lg px-6 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNode}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-2 text-sm font-bold text-white hover:bg-blue-700 shadow-md transition-all cursor-pointer"
              >
                {editingAgent.id ? 'Update Registry' : 'Create Node Type'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contract Generator Modal */}
      {contractGenerator.isOpen && editingAgent && (
        <JsonSchemaGeneratorModal
          isOpen={contractGenerator.isOpen}
          onClose={() => setContractGenerator((prev) => ({ ...prev, isOpen: false }))}
          initialSchema={contractGenerator.type === 'input' ? editingAgent.input_contract : editingAgent.output_contract}
          onSave={handleGeneratedContract}
          title={
            contractGenerator.type === 'input'
              ? `Generate Input Contract for ${editingAgent.label || editingAgent.name || 'Node'}`
              : `Generate Output Contract for ${editingAgent.label || editingAgent.name || 'Node'}`
          }
        />
      )}

      {/* Add Property Modal */}
      {propModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
              <h3 className="text-lg font-bold text-black flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                {isEditingProp ? 'Edit Property' : 'Add Property'}
              </h3>
              <button
                onClick={() => setPropModal({ ...propModal, isOpen: false })}
                className="text-gray-400 hover:text-gray-655 cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setPropModal({ ...propModal, target: 'user' })}
                  className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                    propModal.target === 'user' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  User Property
                </button>
                <button
                  onClick={() => setPropModal({ ...propModal, target: 'system' })}
                  className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                    propModal.target === 'system' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  System Property
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">Property Key (ID)</label>
                <input
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-500 outline-none font-mono bg-white"
                  value={propModal.key}
                  onChange={(e) =>
                    setPropModal({
                      ...propModal,
                      key: e.target.value.toLowerCase().replaceAll(' ', '_'),
                    })
                  }
                  placeholder="e.g. api_timeout"
                />
              </div>

              {propModal.target === 'user' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">UI Label</label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={propModal.label}
                    onChange={(e) => setPropModal({ ...propModal, label: e.target.value })}
                    placeholder="e.g. API Timeout (ms)"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Field Type</label>
                  <select
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
                    value={propModal.type}
                    onChange={(e) => setPropModal({ ...propModal, type: e.target.value })}
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="password">Password</option>
                    <option value="textarea">Textarea</option>
                    <option value="choice">Choice</option>
                    <option value="source">Source</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Value (In Catalog)</label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={propModal.value}
                    onChange={(e) => setPropModal({ ...propModal, value: e.target.value })}
                    placeholder="Registry value"
                  />
                </div>
              </div>

              {propModal.type === 'source' && (
                <div className="space-y-3 p-3 border rounded bg-gray-50/50">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Source URL (Internal API)</label>
                    <input
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      value={propModal.source || ''}
                      onChange={(e) => setPropModal({ ...propModal, source: e.target.value })}
                      placeholder="e.g. /api/knowledge/bases"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="prop-multiple"
                      checked={!!propModal.multiple}
                      onChange={(e) => setPropModal({ ...propModal, multiple: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                    />
                    <label htmlFor="prop-multiple" className="text-[10px] font-bold text-gray-500 uppercase cursor-pointer select-none">
                      Allow Multiple Values Selection (List)
                    </label>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Description / Guide</label>
                <textarea
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  value={propModal.description || ''}
                  onChange={(e) => setPropModal({ ...propModal, description: e.target.value })}
                  placeholder="Helper text for users configuring this property"
                  rows={2}
                />
              </div>
            </div>
            <div className="border-t bg-gray-50 px-4 py-3 flex justify-end gap-3">
              <button
                onClick={() => setPropModal({ ...propModal, isOpen: false })}
                className="px-4 py-2 text-sm font-semibold text-gray-605 hover:text-gray-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePropFromModal}
                className="bg-blue-600 px-6 py-2 text-sm font-bold text-white rounded-lg shadow-md hover:bg-blue-700 transition-all cursor-pointer"
              >
                Save Property
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
