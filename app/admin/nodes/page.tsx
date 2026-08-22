'use client';

import React, { useEffect, useState } from 'react';
import { api, getHeaders } from '@/lib/api';
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
  Play,
  Terminal,
  FlaskRound,
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
  stateable?: boolean;
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
  items?: {
    field_type: string;
    [key: string]: any;
  };
};

/* BLOCK COMMENT: Robust choice options parser supporting arrays, objects, comma-separated strings, and nested schemas */
const parseChoiceOptions = (rawOptions: any): string[] => {
  if (!rawOptions) return [];
  if (Array.isArray(rawOptions)) {
    const result: string[] = [];
    rawOptions.forEach((opt) => {
      if (typeof opt === 'string') {
        if (opt.includes(',')) {
          opt.split(',').forEach((s) => {
            const trimmed = s.trim();
            if (trimmed && !result.includes(trimmed)) result.push(trimmed);
          });
        } else {
          const trimmed = opt.trim();
          if (trimmed && !result.includes(trimmed)) result.push(trimmed);
        }
      } else if (typeof opt === 'number' || typeof opt === 'boolean') {
        const str = String(opt);
        if (!result.includes(str)) result.push(str);
      } else if (typeof opt === 'object' && opt !== null) {
        const val = opt.key ?? opt.value ?? opt.label ?? opt.name ?? opt.id ?? '';
        const str = String(val).trim();
        if (str && !result.includes(str)) result.push(str);
      }
    });
    return result;
  }
  if (typeof rawOptions === 'object' && rawOptions !== null) {
    if (Array.isArray(rawOptions.options)) return parseChoiceOptions(rawOptions.options);
    if (Array.isArray(rawOptions.choices)) return parseChoiceOptions(rawOptions.choices);
    if (Array.isArray(rawOptions.values)) return parseChoiceOptions(rawOptions.values);
    if (Array.isArray(rawOptions.allowed_values)) return parseChoiceOptions(rawOptions.allowed_values);
    if (Array.isArray(rawOptions.allowedValues)) return parseChoiceOptions(rawOptions.allowedValues);
    if (Array.isArray(rawOptions.enum)) return parseChoiceOptions(rawOptions.enum);
    const keys = Object.keys(rawOptions);
    if (keys.length > 0) {
      return keys.map((k) => String(rawOptions[k] || k).trim()).filter(Boolean);
    }
  }
  if (typeof rawOptions === 'string' && rawOptions.trim()) {
    const trimmed = rawOptions.trim();
    if (
      (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
      (trimmed.startsWith('{') && trimmed.endsWith('}'))
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed) return parseChoiceOptions(parsed);
      } catch (e) {
        // Fall back
      }
    }
    return trimmed
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
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
      .filter(
        (item): item is PropertyEntry =>
          !!item && typeof item === 'object' && typeof item.key === 'string',
      );
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
    stateable: boolFromValue(rule.stateable ?? false),
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
    items: rule.items
      ? {
        field_type: rule.items.field_type || 'string',
        ...rule.items,
      }
      : undefined,
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
        field_type:
          rule?.type || rule?.field_type || (Array.isArray(rule?.values) ? 'array' : 'json'),
        required: rule?.required ?? rule?.mandatory ?? false,
        description: rule?.description || '',
      }),
    );
  };

  if (parsed.type === 'object' && parsed.properties && typeof parsed.properties === 'object') {
    Object.entries(parsed.properties).forEach(([fieldName, rule]) => {
      rules.push(
        normalizeContractRule({
          ...(rule as object),
          field_name: fieldName,
          required: Array.isArray(parsed.required) && parsed.required.includes(fieldName),
        }),
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

  if (rule.stateable !== undefined) cleaned.stateable = boolFromValue(rule.stateable);
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
  if (rule.items) cleaned.items = rule.items;

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
  const [searchQuery, setSearchQuery] = useState('');
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

  // Agent Node Testing Playground State
  const [testingAgent, setTestingAgent] = useState<AgentNode | null>(null);
  const [testingConfig, setTestingConfig] = useState<Record<string, any>>({});
  const [testingInputData, setTestingInputData] = useState<string>('');
  const [testingOutput, setTestingOutput] = useState<any>(null);
  const [testingLoading, setTestingLoading] = useState<boolean>(false);
  const [testingConsoleLogs, setTestingConsoleLogs] = useState<string>('');
  // Source data cache: propKey -> { options: {id, name}[], loading: bool }
  const [testingSourceData, setTestingSourceData] = useState<
    Record<string, { options: { id: any; name: string }[]; loading: boolean }>
  >({});

  useEffect(() => {
    if (testingAgent) {
      const initialConfig: Record<string, any> = {};
      const userProps = Array.isArray(testingAgent.user_properties)
        ? testingAgent.user_properties
        : [];
      const sysProps = Array.isArray(testingAgent.system_properties)
        ? testingAgent.system_properties
        : [];

      userProps.forEach((prop: any) => {
        if (prop && prop.key) {
          // If prop.value equals its own source URL, treat as unset
          const rawVal = prop.value !== undefined ? prop.value : prop.default !== undefined ? prop.default : '';
          const isSourceUrl = prop.source && typeof rawVal === 'string' && rawVal === prop.source;
          initialConfig[prop.key] = isSourceUrl ? '' : rawVal;
        }
      });
      sysProps.forEach((prop: any) => {
        if (prop && prop.key) {
          const rawVal = prop.value !== undefined ? prop.value : prop.default !== undefined ? prop.default : '';
          const isSourceUrl = prop.source && typeof rawVal === 'string' && rawVal === prop.source;
          initialConfig[prop.key] = isSourceUrl ? '' : rawVal;
        }
      });

      setTestingConfig(initialConfig);

      // Fetch source data for 'choice' or 'source' type props
      const allProps = [...userProps, ...sysProps];
      const sourceProps = allProps.filter(
        (p: any) => p && p.key && (p.source || p.type === 'source'),
      );
      if (sourceProps.length > 0) {
        const newSourceData: Record<
          string,
          { options: { id: any; name: string }[]; loading: boolean }
        > = {};
        sourceProps.forEach((p: any) => {
          newSourceData[p.key] = { options: [], loading: true };
        });
        setTestingSourceData(newSourceData);

        sourceProps.forEach(async (p: any) => {
          const effectiveSource = p.source || (typeof p.value === 'string' ? p.value : '');
          if (!effectiveSource || !effectiveSource.trim()) {
            setTestingSourceData((prev) => ({
              ...prev,
              [p.key]: { options: [], loading: false },
            }));
            return;
          }

          const isUrl = effectiveSource.startsWith('/') || effectiveSource.startsWith('http');
          if (!isUrl) {
            // Static string or JSON list in source property
            const parsed = parseChoiceOptions(effectiveSource);
            const options = parsed.map((opt) => ({ id: opt, name: opt }));
            setTestingSourceData((prev) => ({
              ...prev,
              [p.key]: { options, loading: false },
            }));
            return;
          }

          try {
            const BACKEND_URL =
              process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
            const fullUrl = effectiveSource.startsWith('http')
              ? effectiveSource
              : `${BACKEND_URL}${effectiveSource.startsWith('/') ? '' : '/'}${effectiveSource}`;

            /* ==============================================================================
               BLOCK COMMENT: DYNAMIC NODE ENUM SOURCE FETCH WITH CREDENTIALS
               ============================================================================== */
            const res = await fetch(fullUrl, {
              credentials: 'include',
              headers: getHeaders({ 'Content-Type': 'application/json' }),
            });
            if (!res.ok) throw new Error(`Failed to fetch ${effectiveSource}`);
            const json = await res.json();

            // Normalize: handle arrays or envelope objects
            const raw: any[] = Array.isArray(json)
              ? json
              : json.items ??
              json.profiles ??
              json.bases ??
              json.results ??
              json.data ??
              [];

            const options = raw.map((item: any) => {
              if (item !== null && typeof item === 'object') {
                const id =
                  item.id ??
                  item.value ??
                  item.key ??
                  item.profile_id ??
                  item.kb_id ??
                  item.name ??
                  item.label ??
                  '';
                const name =
                  item.name ??
                  item.label ??
                  item.title ??
                  item.display_name ??
                  item.profile_name ??
                  String(id);
                return { id, name: String(name || id) };
              }
              return { id: item, name: String(item) };
            });

            setTestingSourceData((prev) => ({
              ...prev,
              [p.key]: { options, loading: false },
            }));
          } catch (err) {
            console.error(`Failed to fetch source for prop ${p.key}:`, err);
            setTestingSourceData((prev) => ({
              ...prev,
              [p.key]: { options: [], loading: false },
            }));
          }
        });
      } else {
        setTestingSourceData({});
      }

      // Pre-fill input_contract template or default empty JSON
      if (testingAgent.input_contract) {
        let schema: Record<string, any> | null = null;
        try {
          schema =
            typeof testingAgent.input_contract === 'string'
              ? JSON.parse(testingAgent.input_contract)
              : (testingAgent.input_contract as Record<string, any>);
        } catch (e) {
          // ignore
        }

        if (schema && Object.keys(schema).length > 0) {
          setTestingInputData('Loading JSON sample...');
          api
            .getJsonSamples(schema)
            .then((sample) => {
              setTestingInputData(JSON.stringify(sample, null, 2));
            })
            .catch((err) => {
              console.error('Failed to load JSON sample from API', err);
              // Fallback
              setTestingInputData(JSON.stringify(schema, null, 2));
            });
        } else {
          setTestingInputData(JSON.stringify({ text: 'Sample prompt text' }, null, 2));
        }
      } else {
        setTestingInputData(JSON.stringify({ text: 'Sample prompt text' }, null, 2));
      }
      setTestingOutput(null);
      setTestingConsoleLogs('Console initialized. Ready to execute test.');
    }
  }, [testingAgent]);

  /* BLOCK COMMENT: Helper to validate JSON input string real-time */
  const getJsonValidationStatus = (inputStr: string): { isValid: boolean; message: string } => {
    const trimmed = (inputStr || '').trim();
    if (!trimmed) {
      return { isValid: true, message: 'Empty Payload' };
    }
    try {
      JSON.parse(trimmed);
      return { isValid: true, message: 'Valid JSON' };
    } catch (e: any) {
      return { isValid: false, message: e.message || 'Invalid JSON syntax' };
    }
  };

  /* BLOCK COMMENT: Synchronize property configuration change into input payload JSON and validate JSON */
  const handlePropConfigChange = (propKey: string, newValue: any) => {
    setTestingConfig((prev) => {
      const nextConfig = { ...prev, [propKey]: newValue };

      // Dynamic sync to testingInputData if it is a valid JSON object
      if (testingInputData && typeof testingInputData === 'string') {
        try {
          const parsed = JSON.parse(testingInputData);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            const matchingKey = Object.keys(parsed).find(
              (k) => k === propKey || k.toLowerCase() === propKey.toLowerCase()
            );
            if (matchingKey) {
              parsed[matchingKey] = newValue;
            } else {
              parsed[propKey] = newValue;
            }
            setTestingInputData(JSON.stringify(parsed, null, 2));
          }
        } catch (e) {
          // Do not overwrite if user is typing custom raw text or invalid JSON
        }
      }

      return nextConfig;
    });
  };

  const handleExecuteTest = async () => {
    if (!testingAgent) return;
    setTestingLoading(true);
    setTestingConsoleLogs('');
    let parsedData: any = testingInputData;
    try {
      parsedData = JSON.parse(testingInputData);
    } catch (e) {
      // Keep as string if not valid JSON
    }

    // Build comprehensive config by sweeping all defined node properties
    const userProps = Array.isArray(testingAgent.user_properties)
      ? testingAgent.user_properties
      : [];
    const sysProps = Array.isArray(testingAgent.system_properties)
      ? testingAgent.system_properties
      : [];
    const allProps = [...userProps, ...sysProps];

    const finalConfig: Record<string, any> = { ...testingConfig };

    allProps.forEach((prop: any) => {
      if (!prop || !prop.key) return;
      const currentVal = testingConfig[prop.key];

      if (currentVal !== undefined && currentVal !== null && currentVal !== '') {
        finalConfig[prop.key] = currentVal;
      } else {
        const rawVal = prop.value !== undefined ? prop.value : prop.default;
        const isSourceUrl = prop.source && typeof rawVal === 'string' && rawVal === prop.source;
        if (rawVal !== undefined && rawVal !== null && !isSourceUrl) {
          finalConfig[prop.key] = rawVal;
        }
      }
    });

    const payload = {
      node_name: testingAgent.name,
      config: finalConfig,
      data: parsedData,
    };

    setTestingConsoleLogs(
      (prev) =>
        prev +
        `\n\n>> EXECUTING [${testingAgent.name}]...\nPayload: ${JSON.stringify(payload, null, 2)}`,
    );

    try {
      const result = await api.testNode(payload);
      setTestingOutput(result);
      setTestingConsoleLogs(
        (prev) =>
          prev +
          `\n\n<< EXECUTION COMPLETED in ${result.latency_ms}ms` +
          `\nStatus: ${result.status}` +
          `\nResponse Data: ${JSON.stringify(result.data, null, 2)}` +
          (result.error_message ? `\nError Message: ${result.error_message}` : '') +
          (result.error_code ? `\nError Code: ${result.error_code}` : '') +
          (result.violations && result.violations.length > 0
            ? `\nViolations: ${JSON.stringify(result.violations, null, 2)}`
            : ''),
      );
    } catch (err: any) {
      setTestingOutput({ status: 'error', error_message: err.message });
      setTestingConsoleLogs((prev) => prev + `\n\n<< EXECUTION FAILED!\nError: ${err.message}`);
    } finally {
      setTestingLoading(false);
    }
  };

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
          : { ...cat, name: cat.group || cat.name },
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
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = agent.name?.toLowerCase().includes(q);
      const matchLabel = agent.label?.toLowerCase().includes(q);
      const matchDesc = agent.description?.toLowerCase().includes(q);
      const matchCat = agent.category?.toLowerCase().includes(q);
      const matchGroup = agent.group?.toLowerCase().includes(q);
      const matchBadge = agent.badge?.toLowerCase().includes(q);
      const matchNodeType = agent.node_type?.toLowerCase().includes(q);
      if (
        !matchName &&
        !matchLabel &&
        !matchDesc &&
        !matchCat &&
        !matchGroup &&
        !matchBadge &&
        !matchNodeType
      ) {
        return false;
      }
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

  const handleDeleteCategory = async (id: string) => {
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
          if (
            typeof editingAgent.output_contract === 'string' &&
            editingAgent.output_contract.trim() !== ''
          ) {
            finalOutputContract = JSON.parse(editingAgent.output_contract);
          } else if (
            editingAgent.output_contract &&
            typeof editingAgent.output_contract === 'object'
          ) {
            finalOutputContract = editingAgent.output_contract;
          }
        } catch (e) { }

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
          customerId || undefined,
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
      if (
        typeof finalAgent.input_contract === 'string' &&
        finalAgent.input_contract.trim() !== ''
      ) {
        finalAgent.input_contract = validateInputContract(
          contractFromValue(finalAgent.input_contract),
        );
      } else if (typeof finalAgent.input_contract === 'string') {
        finalAgent.input_contract = validateInputContract(contractFromValue({}));
      } else {
        finalAgent.input_contract = validateInputContract(
          contractFromValue(finalAgent.input_contract),
        );
      }
    } catch (e) {
      alert('Invalid JSON in Input Contract field.');
      return;
    }

    try {
      if (
        typeof finalAgent.output_contract === 'string' &&
        finalAgent.output_contract.trim() !== ''
      ) {
        finalAgent.output_contract = JSON.parse(finalAgent.output_contract);
      } else if (typeof finalAgent.output_contract === 'string') {
        finalAgent.output_contract = {};
      }
    } catch (e) {
      alert('Invalid JSON in Output Contract field.');
      return;
    }

    try {
      finalAgent.user_properties = propertyEntriesToJsonStrings(
        propertyEntriesFromValue(finalAgent.user_properties),
      );
    } catch (e) {
      alert('Invalid JSON in User Properties field.');
      return;
    }

    try {
      finalAgent.system_properties = propertyEntriesToJsonStrings(
        propertyEntriesFromValue(finalAgent.system_properties),
      );
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
          cat.label === finalAgent.category,
      );
      if (matchingCat && matchingCat.id !== undefined) {
        finalAgent.category = String(matchingCat.id);
      }
    } else if (categories.length > 0) {
      finalAgent.category = String(categories[0].id);
    }

    try {
      if (customerId) {
        const overrides: Record<string, any> = {};
        const userProps = propertyEntriesFromValue(finalAgent.user_properties);
        const sysProps = propertyEntriesFromValue(finalAgent.system_properties);
        [...userProps, ...sysProps].forEach((entry: any) => {
          if (entry.key) {
            overrides[entry.key] = entry.value !== undefined ? entry.value : entry.default;
          }
        });

        await api.configureCustomerNode(
          finalAgent.name,
          {
            properties: overrides,
            user_properties: propertyEntriesToJsonStrings(userProps),
            system_properties: propertyEntriesToJsonStrings(sysProps),
            is_enabled: finalAgent.is_enabled !== undefined ? finalAgent.is_enabled : true,
            input_contract: finalAgent.input_contract,
            output_contract: finalAgent.output_contract,
            label: finalAgent.label,
          },
          customerId,
        );
      } else {
        if (finalAgent.id) {
          await api.updateNode(finalAgent);
        } else {
          await api.createNode(finalAgent);
        }
      }
      fetchData();
      setEditingAgent(null);
    } catch (error) {
      const isUpdate = !!editingAgent.id;
      console.error(`Failed to ${isUpdate ? 'save' : 'create'} node:`, error);
      alert(`Failed to ${isUpdate ? 'save' : 'create'} node.`);
    }
  };

  const [deleteWarning, setDeleteWarning] = useState<{
    isOpen: boolean;
    nodeName: string;
    workflows: { id: string; name: string }[];
  }>({
    isOpen: false,
    nodeName: '',
    workflows: [],
  });

  const handleDeleteNode = async (nodeName: string, force: boolean = false) => {
    if (
      !force &&
      !confirm(
        `Are you sure you want to delete the node "${nodeName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }
    try {
      await api.deleteNode(nodeName, force);
      alert(`Node "${nodeName}" deleted successfully.`);
      fetchData();
    } catch (error: any) {
      console.error('Failed to delete node:', error);
      if (error.detail && error.detail.error_code === 'NODE_IN_USE') {
        setDeleteWarning({
          isOpen: true,
          nodeName,
          workflows: error.detail.workflows || [],
        });
      } else {
        alert(error.message || 'Failed to delete node.');
      }
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
                .filter(Boolean),
            )
          }
          disabled={isDisabled}
        />
      );
    }

    return (
      <input
        className={`${commonClasses} text-black`}
        value={
          typeof displayValue === 'object'
            ? JSON.stringify(displayValue)
            : String(displayValue ?? '')
        }
        placeholder="Enter value..."
        onChange={(e) => handleValChange(e.target.value)}
        disabled={isDisabled}
      />
    );
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-400 text-sm font-medium">
        Loading nodes catalog...
      </div>
    );
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
            {/* Search Bar */}
            <div className="relative flex items-center">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm w-48 sm:w-64"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

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
                  <option
                    key={`filter-cat-${cat.id ?? ''}-${cat.name ?? ''}-${idx}`}
                    value={cat.id ? String(cat.id) : cat.name}
                  >
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
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm cursor-pointer"
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
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Label
                </th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Name (ID) / Version
                </th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  JSON Definition
                </th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAgents.map((agent, idx) => {
                const agentKey = agent.id?.toString() || agent.name;
                const AgentIcon =
                  (agent.icon && IconMap[agent.icon.toLowerCase()]) || IconMap.box || IconMap.bot;

                return (
                  <tr
                    key={agent.id ? `node-${agent.id}` : `node-${agent.name}-${idx}`}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border shadow-sm"
                          style={{
                            borderColor:
                              agent.color && agent.color.length === 7
                                ? `${agent.color}40`
                                : '#e5e7eb',
                            backgroundColor:
                              agent.color && agent.color.length === 7
                                ? `${agent.color}10`
                                : '#f9fafb',
                            color: agent.color || '#6b7280',
                          }}
                        >
                          <AgentIcon className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-black">
                              {agent.label || agent.name}
                            </span>
                          </div>
                          {agent.sub_label && (
                            <span className="text-xs text-bg-primary font-medium mt-0.5">
                              {agent.sub_label}
                            </span>
                          )}
                          <p className="text-xs text-gray-900 line-clamp-2 mt-0.5">
                            {agent.description || 'No description.'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-700 font-mono">{agent.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono mt-0.5">
                          v{agent.version}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-bold uppercase ${agent.node_type.toLowerCase() === 'trigger'
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
                        className="inline-flex items-center gap-1 text-bg-primary hover:text-blue-800 font-medium text-xs whitespace-nowrap cursor-pointer"
                      >
                        <Code2 className="h-3.5 w-3.5" />
                        {jsonExpandedState[agentKey] ? 'Hide Definition' : 'Show Definition'}
                      </button>
                      <div
                        className={`w-full max-w-xs overflow-hidden rounded-lg bg-gray-950 font-mono text-emerald-400 shadow-inner transition-all duration-300 ${jsonExpandedState[agentKey]
                            ? 'max-h-64 p-3 mt-2 overflow-auto opacity-100'
                            : 'max-h-0 p-0 opacity-0'
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
                            2,
                          )}
                        </pre>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right min-w-[100px]">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={async () => {
                            try {
                              const nextVal = !(agent.allow_node_testing === true);
                              await api.configureCustomerNode(
                                agent.name,
                                { fieldname: 'properties.allow_node_testing', value: nextVal },
                                customerId || undefined,
                              );
                              fetchData();
                            } catch (err: any) {
                              alert('Failed to toggle node testing: ' + err.message);
                            }
                          }}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${agent.allow_node_testing === true
                              ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                              : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                            }`}
                          title="Toggle Isolated Node Testing (Debug Mode)"
                        >
                          <FlaskRound className="h-3 w-3" />
                          <span>{agent.allow_node_testing === true ? 'Testing ON' : 'Testing OFF'}</span>
                        </button>
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
                                    customerId || undefined,
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
                            setTestingAgent({ ...agent });
                          }}
                          disabled={agent.is_enabled === false}
                          className={`p-1 rounded transition-colors ${agent.is_enabled === false
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-purple-600 hover:bg-purple-50 cursor-pointer'
                            }`}
                          title="Test Node directly"
                        >
                          <FlaskRound className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (agent.is_enabled === false) return;
                            setEditingAgent({ ...agent });
                          }}
                          disabled={agent.is_enabled === false}
                          className={`p-1 rounded transition-colors ${agent.is_enabled === false
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-bg-primary hover:bg-blue-50 cursor-pointer'
                            }`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {((userRole === 'admin' &&
                          agent.customer_id &&
                          agent.customer_id === customerId) ||
                          userRole === 'system_admin') && (
                            <button
                              onClick={() => handleDeleteNode(agent.name)}
                              className="p-1 bg-red-900 text-red-850 hover:bg-white-900 hover:text-red-900  rounded cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredAgents.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                    No nodes found matching search filter.
                  </td>
                </tr>
              )}
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
                  {customerId
                    ? `${editingAgent.name}`
                    : editingAgent.id
                      ? 'Edit Node Registry'
                      : 'Create New Node Type'}
                </h3>
                <p className="text-xs text-gray-500 font-mono uppercase mt-0.5">
                  {editingAgent.id
                    ? `${editingAgent.name} v${editingAgent.version || '1.0.0'}`
                    : 'New Registry Entry'}
                </p>
              </div>
              <button
                onClick={() => setEditingAgent(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                    Display Label
                  </label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={editingAgent.label || ''}
                    onChange={(e) => setEditingAgent({ ...editingAgent, label: e.target.value })}
                    placeholder="e.g. My Custom Agent"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                    Node Category
                  </label>
                  <select
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
                    value={editingAgent.category || ''}
                    onChange={(e) => setEditingAgent({ ...editingAgent, category: e.target.value })}
                    disabled={userRole !== 'system_admin'}
                  >
                    {categories.map((cat, idx) => (
                      <option key={`opt-${cat.id ?? ''}-${cat.name ?? ''}-${idx}`} value={cat.id}>
                        {cat.label || cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                    Sub Label
                  </label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={editingAgent.sub_label || ''}
                    onChange={(e) =>
                      setEditingAgent({ ...editingAgent, sub_label: e.target.value })
                    }
                    disabled={userRole !== 'system_admin'}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                    Node Type
                  </label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={editingAgent.node_type || ''}
                    onChange={(e) =>
                      setEditingAgent({ ...editingAgent, node_type: e.target.value })
                    }
                    disabled={userRole !== 'system_admin'}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                    UI Group
                  </label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={editingAgent.group || ''}
                    onChange={(e) => setEditingAgent({ ...editingAgent, group: e.target.value })}
                    disabled={userRole !== 'system_admin'}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                    Icon Name (Lucide)
                  </label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={editingAgent.icon || ''}
                    onChange={(e) => setEditingAgent({ ...editingAgent, icon: e.target.value })}
                    disabled={userRole !== 'system_admin'}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                    Description
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 h-20 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingAgent.description || ''}
                    onChange={(e) =>
                      setEditingAgent({ ...editingAgent, description: e.target.value })
                    }
                    disabled={userRole !== 'system_admin'}
                  />
                </div>
              </div>

              {/* Property Registry */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div>
                    <h4 className="font-bold text-black">Property Registry</h4>
                    <p className="text-xs text-gray-500">
                      Configure User (UI-visible) and System (Internal) properties.
                    </p>
                  </div>
                  {userRole === 'system_admin' && (
                    <button
                      onClick={() => openPropModal()}
                      className="inline-flex items-center gap-1 text-xs font-bold text-bg-primary hover:text-blue-700 uppercase bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 cursor-pointer"
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
                        {userRole === 'system_admin' && (
                          <th className="px-4 py-3 text-right">Actions</th>
                        )}
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
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${row.category === 'user'
                                    ? 'bg-blue-50 text-blue-700 border-blue-100'
                                    : 'bg-gray-100 text-gray-600 border-gray-200'
                                  }`}
                              >
                                {row.category}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-black">{row.key}</td>
                            <td className="px-4 py-3 text-gray-600">
                              <div className="font-semibold text-sm">{row.label}</div>
                              {row.description && (
                                <div className="text-xs text-gray-405 italic mt-0.5">
                                  {row.description}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-[10px] font-mono text-gray-400">
                                {row.type}
                              </span>
                            </td>
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              {row.category === 'user' ? (
                                renderValueInput(row, row.value)
                              ) : (
                                <span className="text-gray-400 font-mono text-xs">
                                  {String(row.value)}
                                </span>
                              )}
                            </td>
                            {userRole === 'system_admin' && (
                              <td
                                className="px-4 py-3 text-right"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={() =>
                                    setEditingAgent((prev) => {
                                      if (!prev) return null;
                                      const userProps = propertyEntriesFromValue(
                                        prev.user_properties,
                                      );
                                      const sysProps = propertyEntriesFromValue(
                                        prev.system_properties,
                                      );
                                      const entries =
                                        row.category === 'user' ? userProps : sysProps;
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
                      <p className="text-xs text-gray-500">
                        Define the JSON body a node must receive before execution.
                      </p>
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
                        {JSON.stringify(
                          cleanInputContract(contractFromValue(editingAgent.input_contract)),
                          null,
                          2,
                        )}
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
                      <p className="text-xs text-gray-500">
                        Define the JSON body a node sends after execution.
                      </p>
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
                className="flex items-center gap-2 rounded-lg bg-primary px-8 py-2 text-sm font-bold text-white hover:bg-blue-700 shadow-md transition-all cursor-pointer"
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
          initialSchema={
            contractGenerator.type === 'input'
              ? typeof editingAgent.input_contract === 'string'
                ? safeJsonParse(editingAgent.input_contract)
                : editingAgent.input_contract
              : typeof editingAgent.output_contract === 'string'
                ? safeJsonParse(editingAgent.output_contract)
                : editingAgent.output_contract
          }
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
                <Settings className="h-5 w-5 text-bg-primary" />
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
                  className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${propModal.target === 'user'
                      ? 'bg-white text-bg-primary shadow-sm'
                      : 'text-gray-500'
                    }`}
                >
                  User Property
                </button>
                <button
                  onClick={() => setPropModal({ ...propModal, target: 'system' })}
                  className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${propModal.target === 'system'
                      ? 'bg-white text-bg-primary shadow-sm'
                      : 'text-gray-500'
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
                  <label className="text-[10px] font-bold text-gray-500 uppercase">
                    Field Type
                  </label>
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
                  <label className="text-[10px] font-bold text-gray-500 uppercase">
                    Value (In Catalog)
                  </label>
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
                    <label className="text-[10px] font-bold text-gray-500 uppercase">
                      Source URL (Internal API)
                    </label>
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
                      className="rounded text-bg-primary focus:ring-blue-500 h-4 w-4 cursor-pointer"
                    />
                    <label
                      htmlFor="prop-multiple"
                      className="text-[10px] font-bold text-gray-500 uppercase cursor-pointer select-none"
                    >
                      Allow Multiple Values Selection (List)
                    </label>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">
                  Description / Guide
                </label>
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
                className="bg-primary px-6 py-2 text-sm font-bold text-white rounded-lg shadow-md hover:bg-blue-700 transition-all cursor-pointer"
              >
                Save Property
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Test Node / Playground Modal */}
      {testingAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-black flex items-center gap-2">
                  <FlaskRound className="h-5 w-5 text-purple-600" />
                  Test Node
                </h3>
                <p className="text-xs text-gray-505 font-mono">
                  {testingAgent.label || testingAgent.name} (v{testingAgent.version})
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl">
                  <span className="text-xs font-bold text-purple-900">Isolated Node Testing</span>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={testingAgent.allow_node_testing === true}
                      onChange={async () => {
                        const nextVal = !(testingAgent.allow_node_testing === true);
                        try {
                          await api.configureCustomerNode(
                            testingAgent.name,
                            { fieldname: 'properties.allow_node_testing', value: nextVal },
                            customerId || undefined,
                          );
                          setTestingAgent({
                            ...testingAgent,
                            allow_node_testing: nextVal,
                          });
                          fetchData();
                        } catch (err: any) {
                          alert('Failed to update testing switch: ' + err.message);
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:translate-x-full peer-checked:bg-purple-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all"></div>
                  </label>
                </div>
                <button
                  onClick={() => setTestingAgent(null)}
                  className="text-gray-400 hover:text-gray-650 cursor-pointer"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Top Form Section (70%) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
                {/* Testing switch disabled warning banner */}
                {testingAgent.allow_node_testing !== true && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>Isolated node testing is currently <strong>disabled</strong> for this node. Flip the switch above to enable testing.</span>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          await api.configureCustomerNode(
                            testingAgent.name,
                            { fieldname: 'properties.allow_node_testing', value: true },
                            customerId || undefined,
                          );
                          setTestingAgent({
                            ...testingAgent,
                            allow_node_testing: true,
                          });
                          fetchData();
                        } catch (err: any) {
                          alert('Failed to enable testing: ' + err.message);
                        }
                      }}
                      className="px-2.5 py-1 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors shrink-0"
                    >
                      Enable Testing Now
                    </button>
                  </div>
                )}
                {/* Expected Input Contract Schema Details */}
                {testingAgent.input_contract && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-4">
                    <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Info className="h-4 w-4" /> Expected Input Contract Schema
                    </h4>
                    <pre className="text-[11px] text-blue-900 font-mono overflow-auto max-h-32 p-2 bg-white/70 rounded-lg border border-blue-100">
                      {JSON.stringify(testingAgent.input_contract, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  {/* Left Column: Properties / Configuration */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b pb-1">
                      Properties Configuration
                    </h4>

                    {/* User & System properties mapped to inputs */}
                    {(() => {
                      const userProps = Array.isArray(testingAgent.user_properties)
                        ? testingAgent.user_properties
                        : [];
                      const sysProps = Array.isArray(testingAgent.system_properties)
                        ? testingAgent.system_properties
                        : [];
                      const allProps = [...userProps, ...sysProps];

                      if (allProps.length === 0) {
                        return (
                          <p className="text-xs text-gray-500 italic">
                            No configuration properties defined for this node.
                          </p>
                        );
                      }

                      return allProps.map((prop: any) => {
                        if (!prop || !prop.key) return null;
                        const label = prop.label || prop.key;
                        const value =
                          testingConfig[prop.key] !== undefined ? testingConfig[prop.key] : '';

                        // --- SOURCE-driven: render select from API or source property ---
                        if (prop.source || prop.type === 'source') {
                          const srcState = testingSourceData[prop.key];
                          const opts = srcState?.options ?? [];
                          const isLoadingSrc = srcState?.loading ?? true;
                          const isMultiple = !!prop.multiple;

                          if (isMultiple) {
                            // value is array of ids
                            const selectedIds: any[] = Array.isArray(value)
                              ? value
                              : value !== '' && value !== undefined && value !== null
                                ? String(value)
                                  .split(',')
                                  .map((v: string) => v.trim())
                                  .filter(Boolean)
                                : [];

                            const toggleId = (id: any) => {
                              const idStr = String(id);
                              const already = selectedIds.map(String).includes(idStr);
                              const next = already
                                ? selectedIds.filter((x) => String(x) !== idStr)
                                : [...selectedIds, id];
                              handlePropConfigChange(prop.key, next);
                            };

                            return (
                              <div key={prop.key} className="space-y-1">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase">
                                  {label}{' '}
                                  <span className="font-mono text-gray-400 font-normal">({prop.key})</span>
                                  <span className="ml-1 text-purple-500 font-mono">multi-select</span>
                                </label>
                                {isLoadingSrc ? (
                                  <p className="text-[11px] text-gray-400 italic animate-pulse">Loading options...</p>
                                ) : opts.length === 0 ? (
                                  <p className="text-[11px] text-red-400 italic">No options available from source.</p>
                                ) : (
                                  <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 max-h-40 overflow-y-auto">
                                    {opts.map((opt) => {
                                      const checked = selectedIds.map(String).includes(String(opt.id));
                                      return (
                                        <label
                                          key={String(opt.id)}
                                          className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-purple-50 transition-colors"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggleId(opt.id)}
                                            className="accent-purple-600 h-3 w-3"
                                          />
                                          <span className="text-xs text-black">{opt.name}</span>
                                          {opt.name !== String(opt.id) && (
                                            <span className="text-[10px] text-gray-400 font-mono ml-auto">#{opt.id}</span>
                                          )}
                                        </label>
                                      );
                                    })}
                                  </div>
                                )}
                                {selectedIds.length > 0 && (
                                  <p className="text-[10px] text-purple-600 font-mono">
                                    Selected: [{selectedIds.join(', ')}]
                                  </p>
                                )}
                                {prop.description && (
                                  <p className="text-[10px] text-gray-400 italic mt-0.5">{prop.description}</p>
                                )}
                              </div>
                            );
                          } else {
                            // Single select
                            return (
                              <div key={prop.key} className="space-y-1">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase">
                                  {label}{' '}
                                  <span className="font-mono text-gray-400 font-normal">({prop.key})</span>
                                </label>
                                {isLoadingSrc ? (
                                  <p className="text-[11px] text-gray-400 italic animate-pulse">Loading options...</p>
                                ) : (
                                  <select
                                    className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-black bg-white focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                                    value={value !== '' && value !== undefined && value !== null ? String(value) : ''}
                                    onChange={(e) => handlePropConfigChange(prop.key, e.target.value)}
                                  >
                                    <option value="">— Select —</option>
                                    {opts.map((opt) => (
                                      <option key={String(opt.id)} value={String(opt.id)}>
                                        {opt.name} {opt.name !== String(opt.id) ? `(#${opt.id})` : ''}
                                      </option>
                                    ))}
                                  </select>
                                )}
                                {opts.length === 0 && !isLoadingSrc && (
                                  <p className="text-[11px] text-red-400 italic">No options available from source.</p>
                                )}
                                {prop.description && (
                                  <p className="text-[10px] text-gray-400 italic mt-0.5">{prop.description}</p>
                                )}
                              </div>
                            );
                          }
                        }

                        /* BLOCK COMMENT: Choice field resolution supporting field_type choice, values, allowed_values, options, enum */
                        const rawOpts =
                          prop.options ||
                          prop.choices ||
                          prop.values ||
                          prop.allowed_values ||
                          prop.allowedValues ||
                          prop.configured_values ||
                          prop.configuredValues ||
                          prop.enum ||
                          (prop.items ? (prop.items.options || prop.items.values || prop.items.allowed_values || prop.items) : undefined) ||
                          (Array.isArray(prop.value) ? prop.value : undefined) ||
                          (typeof prop.value === 'string' && (prop.value.includes(',') || prop.value.startsWith('[')) ? prop.value : undefined) ||
                          (Array.isArray(prop.default) ? prop.default : undefined) ||
                          (typeof prop.default === 'string' && (prop.default.includes(',') || prop.default.startsWith('[')) ? prop.default : undefined);

                        const parsedOpts = parseChoiceOptions(rawOpts);
                        const propType = String(prop.type || prop.field_type || '').toLowerCase();
                        const isChoiceType = propType === 'choice' || propType === 'select' || propType === 'dropdown' || parsedOpts.length > 0;

                        if (isChoiceType) {
                          const isMultiple = !!prop.multiple;
                          if (isMultiple) {
                            const selectedVals: string[] = Array.isArray(value)
                              ? value.map(String)
                              : value !== '' && value !== undefined && value !== null
                                ? String(value)
                                  .split(',')
                                  .map((v: string) => v.trim())
                                  .filter(Boolean)
                                : [];

                            const toggleVal = (optVal: string) => {
                              const already = selectedVals.includes(optVal);
                              const next = already
                                ? selectedVals.filter((x) => x !== optVal)
                                : [...selectedVals, optVal];
                              handlePropConfigChange(prop.key, next);
                            };

                            return (
                              <div key={prop.key} className="space-y-1">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase">
                                  {label}{' '}
                                  <span className="font-mono text-gray-400 font-normal">({prop.key})</span>
                                  <span className="ml-1 text-purple-500 font-mono">multi-select</span>
                                </label>
                                {parsedOpts.length === 0 ? (
                                  <input
                                    type="text"
                                    placeholder="Enter comma-separated values"
                                    className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-black bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={Array.isArray(value) ? value.join(', ') : value}
                                    onChange={(e) =>
                                      handlePropConfigChange(
                                        prop.key,
                                        e.target.value
                                          .split(',')
                                          .map((v) => v.trim())
                                          .filter(Boolean)
                                      )
                                    }
                                  />
                                ) : (
                                  <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 max-h-40 overflow-y-auto">
                                    {parsedOpts.map((opt) => {
                                      const checked = selectedVals.includes(opt);
                                      return (
                                        <label
                                          key={opt}
                                          className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-purple-50 transition-colors"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggleVal(opt)}
                                            className="accent-purple-600 h-3 w-3"
                                          />
                                          <span className="text-xs text-black">{opt}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                )}
                                {selectedVals.length > 0 && (
                                  <p className="text-[10px] text-purple-600 font-mono">
                                    Selected: [{selectedVals.join(', ')}]
                                  </p>
                                )}
                                {prop.description && (
                                  <p className="text-[10px] text-gray-400 italic mt-0.5">{prop.description}</p>
                                )}
                              </div>
                            );
                          } else {
                            // Single select dropdown
                            return (
                              <div key={prop.key} className="space-y-1">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase">
                                  {label}{' '}
                                  <span className="font-mono text-gray-400 font-normal">({prop.key})</span>
                                </label>
                                <select
                                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-black bg-white focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                                  value={value !== undefined && value !== null ? String(value) : ''}
                                  onChange={(e) => handlePropConfigChange(prop.key, e.target.value)}
                                >
                                  <option value="">— Select —</option>
                                  {parsedOpts.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                                {prop.description && (
                                  <p className="text-[10px] text-gray-400 italic mt-0.5">{prop.description}</p>
                                )}
                              </div>
                            );
                          }
                        }

                        return (
                          <div key={prop.key} className="space-y-1">
                            <label className="block text-[11px] font-bold text-gray-500 uppercase">
                              {label}{' '}
                              <span className="font-mono text-gray-400 font-normal">
                                ({prop.key})
                              </span>
                            </label>
                            {prop.type === 'textarea' ? (
                              <textarea
                                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-black bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                                value={value}
                                onChange={(e) => handlePropConfigChange(prop.key, e.target.value)}
                                rows={2}
                              />
                            ) : prop.type === 'boolean' ? (
                              <select
                                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-black bg-white focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                                value={value === true ? 'true' : 'false'}
                                onChange={(e) => handlePropConfigChange(prop.key, e.target.value === 'true')}
                              >
                                <option value="false">False</option>
                                <option value="true">True</option>
                              </select>
                            ) : (
                              <input
                                type={prop.type === 'password' ? 'password' : 'text'}
                                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-black bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                                value={value}
                                onChange={(e) => handlePropConfigChange(prop.key, e.target.value)}
                              />
                            )}
                            {prop.description && (
                              <p className="text-[10px] text-gray-400 italic mt-0.5">
                                {prop.description}
                              </p>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Right Column: Run-time input data payload */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-1">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Input Data Payload (Run-time `data`)
                      </h4>
                      {/* BLOCK COMMENT: Real-time JSON validation status badge */}
                      {(() => {
                        const { isValid, message } = getJsonValidationStatus(testingInputData);
                        if (!testingInputData.trim()) {
                          return (
                            <span className="text-[10px] text-gray-400 font-mono px-2 py-0.5 rounded bg-gray-100 border border-gray-200">
                              Empty Payload
                            </span>
                          );
                        }
                        return isValid ? (
                          <span className="text-[10px] text-emerald-700 font-bold font-mono px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 flex items-center gap-1">
                            ✓ Valid JSON
                          </span>
                        ) : (
                          <span className="text-[10px] text-red-700 font-bold font-mono px-2 py-0.5 rounded bg-red-50 border border-red-200 flex items-center gap-1">
                            ✕ {message}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="space-y-1 h-full flex flex-col">
                      <label className="block text-[11px] font-bold text-gray-505 uppercase">
                        Run-Time Input (JSON or Plaintext)
                      </label>
                      <textarea
                        className={`w-full flex-1 min-h-[220px] rounded-lg border p-3 text-xs font-mono text-black outline-none overflow-auto transition-colors ${!getJsonValidationStatus(testingInputData).isValid && testingInputData.trim()
                            ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-400'
                            : 'border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500'
                          }`}
                        value={testingInputData}
                        onChange={(e) => setTestingInputData(e.target.value)}
                        placeholder='e.g. { "text": "value" } or "raw string"'
                        style={{ fontFamily: "'Consolas', 'Courier New', monospace" }}
                      />
                      {!getJsonValidationStatus(testingInputData).isValid && testingInputData.trim() && (
                        <p className="text-[10px] text-red-600 font-mono italic">
                          JSON Syntax Error: {getJsonValidationStatus(testingInputData).message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom 30% Console Logs Panel */}
              <div className="h-[30%] border-t border-gray-800 bg-gray-950 flex flex-col overflow-hidden">
                <div className="bg-gray-900 px-4 py-2 border-b border-gray-800 flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1.5 font-bold font-mono">
                    <Terminal className="h-3.5 w-3.5 text-emerald-450 animate-pulse" />
                    EXECUTION CONSOLE & LOGS
                  </span>
                  <div className="flex items-center gap-4">
                    {testingOutput && (
                      <span
                        className={`font-mono font-bold ${testingOutput.status === 'success' ? 'text-green-400' : 'text-red-400'}`}
                      >
                        STATUS: {testingOutput.status?.toUpperCase()}
                      </span>
                    )}
                    {testingOutput?.latency_ms !== undefined && (
                      <span className="font-mono text-gray-400">
                        LATENCY: {testingOutput.latency_ms}ms
                      </span>
                    )}
                  </div>
                </div>
                {/* Scrollable logs view */}
                <div
                  className="flex-1 overflow-auto p-4 font-mono text-xs text-emerald-400 selection:bg-emerald-800 selection:text-white"
                  style={{ fontFamily: "'Consolas', 'Courier New', monospace" }}
                >
                  <pre className="whitespace-pre-wrap">{testingConsoleLogs}</pre>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="border-t bg-gray-50 px-6 py-3 flex justify-end gap-3">
              <button
                onClick={() => setTestingAgent(null)}
                className="rounded-lg px-5 py-1.5 text-xs font-semibold text-gray-650 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleExecuteTest}
                disabled={testingLoading || (!getJsonValidationStatus(testingInputData).isValid && testingInputData.trim().length > 0)}
                className="flex items-center gap-1.5 rounded-lg bg-purple-900 px-6 py-1.5 text-xs font-bold text-white hover:bg-purple-700 shadow-md disabled:bg-purple-300 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {testingLoading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    Run Test
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Warning Modal */}
      {deleteWarning.isOpen && (
        <div className="fixed max-w-full inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex w-full max-w-md flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-150">
            <div className="flex items-center justify-between border-b bg-red-50 px-4 py-3 text-red-750">
              <span className="flex items-center gap-1.5 font-bold text-sm">
                <Info className="h-4 w-4 text-red-650" />
                Confirm Destructive Deletion
              </span>
              <button
                onClick={() => setDeleteWarning({ isOpen: false, nodeName: '', workflows: [] })}
                className="text-red-750 hover:bg-red-100 rounded p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <p className="text-xs text-gray-700 font-sans">
                The node <strong>{deleteWarning.nodeName}</strong> is used in the following active
                workflows:
              </p>
              <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-lg p-2 bg-gray-50 space-y-1">
                {deleteWarning.workflows.map((wf) => (
                  <div
                    key={wf.id}
                    className="flex justify-between items-center text-xs text-gray-650 font-mono py-1 border-b border-gray-100 last:border-b-0"
                  >
                    <span className="font-sans font-medium text-black">{wf.name}</span>
                    <span className="text-[10px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded-full">
                      {wf.id}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-red-650 font-semibold font-sans">
                Warning: Deleting this node will force these workflows to become unrunnable. Do you
                still wish to proceed?
              </p>
            </div>
            <div className="border-t bg-gray-50 px-6 py-3 flex justify-end gap-3">
              <button
                onClick={() => setDeleteWarning({ isOpen: false, nodeName: '', workflows: [] })}
                className="rounded-lg px-4 py-1.5 text-xs font-semibold text-gray-650 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setDeleteWarning({ isOpen: false, nodeName: '', workflows: [] });
                  handleDeleteNode(deleteWarning.nodeName, true);
                }}
                className="rounded-lg bg-red-650 px-4 py-1.5 text-xs font-bold text-white hover:text-red-900 hover:bg-green-900 shadow-md transition-all cursor-pointer"
              >
                Yes, Delete Node
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
