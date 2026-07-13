'use client';

import React, { useEffect, useState, type ComponentType } from 'react';
import Alert from '@mui/material/Alert';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckIcon } from 'lucide-react';
import { api, getHeaders } from '@/lib/api';
import { Workflow, ChevronDown, ChevronUp, Copy, Check, List, LayoutGrid } from 'lucide-react';
import { IconMap } from '@/lib/icons';
import { AgentNode, NodeCategory } from '@components/component-categoriees';
import { JsonTreeView } from '@components/JsonTreeView';
import JsonSchemaGeneratorModal from '@components/JsonSchemaGeneratorModal';
import RunVisualizerModal from '@components/RunVisualizerModal';
import { MetricCard } from '@/app/components/MetricCard';
import { Clock, Activity, AlertTriangle, BookOpen, FileText, Database } from 'lucide-react';

type PropertyTarget = 'user' | 'system';

type PropertyEntry = {
  key: string;
  label?: string;
  type?: string;
  value?: any;
  default?: any;
  multiple?: boolean;
  description?: string;
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

/** Mask sensitive values for display in the JSON preview */
const maskSecrets = (value: any): any => {
  if (Array.isArray(value)) return value.map(maskSecrets);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, fieldValue]) => {
      const normalizedKey = key.toLowerCase();
      if (['password', 'token', 'apikey', 'secret', 'key'].some((s) => normalizedKey.includes(s))) {
        return [key, fieldValue ? '••••••••' : ''];
      }
      return [key, maskSecrets(fieldValue)];
    }),
  );
};

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
  }));

const boolFromValue = (value: any) =>
  value === true || String(value).trim().toLowerCase() === 'true';

const numberOrEmpty = (value: any) => {
  if (value === '' || value === null || value === undefined) return '';
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : '';
};

const hasNumberValue = (value: number | '' | undefined) => value !== '' && value !== undefined;

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

export default function AdminPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<AgentNode[]>([]);
  const [categories, setCategories] = useState<NodeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentNode | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const nodeTypes = React.useMemo(() => {
    const types = new Set<string>();
    agents.forEach((agent) => {
      if (agent.node_type) {
        types.add(agent.node_type.toUpperCase());
      }
    });
    return Array.from(types).sort();
  }, [agents]);

  const filteredAgents = React.useMemo(() => {
    return agents.filter((agent) => {
      // Filter by Category (tabs or dropdown)
      if (filterCategory !== 'all') {
        const catObj = categories.find((c) => String(c.id) === filterCategory);
        const matchesCategory =
          String(agent.category) === filterCategory ||
          (catObj && (agent.category === catObj.name || agent.category === catObj.group));
        if (!matchesCategory) return false;
      }
      // Filter by Type (dropdown)
      if (filterType !== 'all') {
        if (agent.node_type?.toLowerCase() !== filterType.toLowerCase()) return false;
      }
      return true;
    });
  }, [agents, categories, filterCategory, filterType]);

  const [editingCategory, setEditingCategory] = useState<NodeCategory | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'nodes' | 'workflows' | 'users' | 'oauth' | 'logs' | 'customers' | 'metrics'
  >('nodes');
  const [users, setUsers] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerDomain, setNewCustomerDomain] = useState('');
  const [newCustomerIcon, setNewCustomerIcon] = useState('Building');
  const [newCustomerColor, setNewCustomerColor] = useState('#2563eb');
  const [newCustomerPluginsEnabled, setNewCustomerPluginsEnabled] = useState(false);
  const [newCustomerStoragePath, setNewCustomerStoragePath] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [newCustomerContactPerson, setNewCustomerContactPerson] = useState('');

  // Selected Customer Management
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerDetailTab, setCustomerDetailTab] = useState<'details' | 'users' | 'nodes' | 'metrics'>('details');
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerDomain, setEditCustomerDomain] = useState('');
  const [editCustomerEmail, setEditCustomerEmail] = useState('');
  const [editCustomerAddress, setEditCustomerAddress] = useState('');
  const [editCustomerContactPerson, setEditCustomerContactPerson] = useState('');
  const [editCustomerStatus, setEditCustomerStatus] = useState('active');
  const [editCustomerPluginsEnabled, setEditCustomerPluginsEnabled] = useState(false);
  const [editCustomerStoragePath, setEditCustomerStoragePath] = useState('');
  const [customerNodes, setCustomerNodes] = useState<any[]>([]);
  const [customerNodesLoading, setCustomerNodesLoading] = useState(false);
  const [customerTraces, setCustomerTraces] = useState<any[]>([]);
  const [customerMetricsSummary, setCustomerMetricsSummary] = useState<any>(null);
  const [customerTracesLoading, setCustomerTracesLoading] = useState(false);

  // Customer Node Scoping States
  const [selectedCustomerForNodes, setSelectedCustomerForNodes] = useState<any | null>(null);
  const [showNodesModal, setShowNodesModal] = useState(false);
  const [customerNodeAssignments, setCustomerNodeAssignments] = useState<Record<string, boolean>>(
    {},
  );
  const [selectedNodesForBulk, setSelectedNodesForBulk] = useState<Record<string, boolean>>({});
  const [savingNodes, setSavingNodes] = useState(false);
  const [customerNodeProperties, setCustomerNodeProperties] = useState<
    Record<string, Record<string, any>>
  >({});
  const [configuringNode, setConfiguringNode] = useState<any | null>(null);
  const [nodeSearchQuery, setNodeSearchQuery] = useState('');
  const [nodeViewMode, setNodeViewMode] = useState<'grid' | 'list'>('grid');

  const [showAddCustomerUserModal, setShowAddCustomerUserModal] = useState(false);
  const [selectedCustomerIdForUser, setSelectedCustomerIdForUser] = useState<number | null>(null);
  const [customerUserEmail, setCustomerUserEmail] = useState('');
  const [customerUserPassword, setCustomerUserPassword] = useState('');
  const [customerUserName, setCustomerUserName] = useState('');

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  const [isRegistering, setIsRegistering] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [workflowViewMode, setWorkflowViewMode] = useState<'list' | 'card'>('list');
  const [jsonExpandedState, setJsonExpandedState] = useState<Record<string, boolean>>({});
  const [editingProvider, setEditingProvider] = useState<any | null>(null);
  const [selectedCategoryType, setSelectedCategoryType] = useState<string>('string');
  const [isEditingProp, setIsEditingProp] = useState(false);
  const [contractGenerator, setContractGenerator] = useState<{
    isOpen: boolean;
    type: 'input' | 'output';
  }>({ isOpen: false, type: 'input' });

  // System Log Scoping & Filtering States
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logMode, setLogMode] = useState<'audit' | 'execution'>('audit');
  const [selectedWorkflowFilter, setSelectedWorkflowFilter] = useState('all');
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState('all');
  const [minutesFilter, setMinutesFilter] = useState(30);
  const [selectedTraceForVisualizer, setSelectedTraceForVisualizer] = useState<any | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [traceViewMode, setTraceViewMode] = useState<'tree' | 'raw'>('tree');
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  // Metrics Tab States
  const [metricsData, setMetricsData] = useState<any>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [metricsTimeRange, setMetricsTimeRange] = useState(30);
  const [metricsSelectedWorkflow, setMetricsSelectedWorkflow] = useState('all');
  const [metricsSelectedCustomer, setMetricsSelectedCustomer] = useState('all');
  const [metricsExpandedTrace, setMetricsExpandedTrace] = useState<string | null>(null);
  const [kbMetrics, setKbMetrics] = useState<any>(null);

  const handleCopyLog = (logData: any) => {
    navigator.clipboard.writeText(JSON.stringify(logData, null, 2));
    setCopiedLogId(logData.trace_id);
    setTimeout(() => setCopiedLogId(null), 2000);
  };
  // New Property Modal State
  const [propModal, setPropModal] = useState({
    isOpen: false,
    target: 'user' as 'user' | 'system',
    originalTarget: 'user' as 'user' | 'system',
    sourceIndex: -1,
    key: '',
    label: '',
    type: 'string',
    defaultValue: '',
    value: '',
    description: '',
  });

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem('token');

    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    async function initializeUser() {
      try {
        const userData = await api.getCurrentUser();

        if (userData.role !== 'admin' && userData.role !== 'system_admin') {
          router.push('/workflow-builder');
          return;
        }

        setUserRole(userData.role);
        setUserEmail(userData.email);
        setUserId(userData.id);
        setCustomerId(
          userData.customer_id !== null && userData.customer_id !== undefined
            ? String(userData.customer_id)
            : null,
        );
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Failed to authenticate in Admin Console:', err);
        api.logout();
        setIsAuthenticated(false);
        setLoading(false);
        router.push('/login');
      }
    }

    async function loadAdminData() {
      try {
        const promises: Promise<any>[] = [
          api.getNodes(),
          api.getNodesCategories(),
          api.getProviders(),
          api.getSavedAgents(),
          api.getUsers().catch(() => []),
        ];

        if (userRole === 'system_admin') {
          promises.push(api.getCustomers().catch(() => []));
        }

        const resolved = await Promise.all(promises);
        const agentsRes = resolved[0];
        const catsRes = resolved[1];
        const providersRes = resolved[2];
        const workflowsRes = resolved[3];
        const usersRes = resolved[4];
        const customersRes = resolved[5];

        setAgents((agentsRes as any).nodes || (agentsRes as any).agents || []);

        const cats = Array.isArray(catsRes) ? catsRes : catsRes.categories || [];
        const normalizedCats = cats.map((cat: any) =>
          typeof cat === 'string'
            ? { name: cat, label: cat }
            : { ...cat, name: cat.group || cat.name },
        );
        setCategories(normalizedCats);
        if (normalizedCats.length > 0) {
          setFilterCategory('all');
        }
        setProviders(providersRes || []);
        setWorkflows(workflowsRes || []);
        setUsers(usersRes || []);
        if (userRole === 'system_admin') {
          setCustomers(customersRes || []);
        }
      } catch (error) {
        console.error('Failed to load admin data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (!isAuthenticated) {
      initializeUser();
    } else {
      loadAdminData();
    }
  }, [isAuthenticated, userRole, customerId, router]);

  const fetchMetrics = async () => {
    setMetricsLoading(true);
    setMetricsError(null);
    try {
      const url = new URL('http://localhost:8000/api/observability/traces');
      url.searchParams.append('minutes', metricsTimeRange.toString());
      if (metricsSelectedWorkflow && metricsSelectedWorkflow !== 'all') {
        url.searchParams.append('workflow_id', metricsSelectedWorkflow);
      }
      if (
        userRole === 'system_admin' &&
        metricsSelectedCustomer &&
        metricsSelectedCustomer !== 'all'
      ) {
        url.searchParams.append('customer_id', metricsSelectedCustomer);
      }
      const response = await fetch(url.toString(), {
        headers: getHeaders({
          'Content-Type': 'application/json',
        }),
      });
      if (response.ok) {
        const result = await response.json();
        setMetricsData(result);
      } else {
        setMetricsError('Failed to fetch metrics data');
      }

      // Also fetch Knowledge Base metrics
      const kbUrl = new URL('http://localhost:8000/api/observability/knowledge-metrics');
      if (
        (userRole === 'system_admin' || userRole === 'admin') &&
        metricsSelectedCustomer &&
        metricsSelectedCustomer !== 'all'
      ) {
        kbUrl.searchParams.append('customer_id', metricsSelectedCustomer);
      }
      const kbRes = await fetch(kbUrl.toString(), {
        headers: getHeaders({
          'Content-Type': 'application/json',
        }),
      });
      if (kbRes.ok) {
        const kbResult = await kbRes.json();
        setKbMetrics(kbResult);
      }
    } catch (err) {
      console.error('Failed to fetch metrics', err);
      setMetricsError('Error connecting to metrics server');
    } finally {
      setMetricsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'metrics') {
      fetchMetrics();
    }
  }, [activeTab, metricsTimeRange, metricsSelectedWorkflow, metricsSelectedCustomer]);

  // Load initial tab from URL search parameters on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (
        tab &&
        ['nodes', 'workflows', 'users', 'oauth', 'logs', 'customers', 'metrics'].includes(tab)
      ) {
        setActiveTab(tab as any);
      }
    }
  }, []);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState(null, '', url.pathname + url.search);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      if (logMode === 'audit') {
        const auditLogs = await api.getAuditLogs({
          customerId:
            userRole === 'system_admin' && selectedCustomerFilter !== 'all'
              ? selectedCustomerFilter
              : undefined,
          limit: 100,
        });
        setLogs(auditLogs || []);
        setExpandedLogId(null);
        return;
      }

      const url = new URL('http://localhost:8000/api/observability/traces');
      url.searchParams.append('minutes', minutesFilter.toString());
      if (selectedWorkflowFilter && selectedWorkflowFilter !== 'all') {
        url.searchParams.append('workflow_id', selectedWorkflowFilter);
      }
      if (
        userRole === 'system_admin' &&
        selectedCustomerFilter &&
        selectedCustomerFilter !== 'all'
      ) {
        url.searchParams.append('customer_id', selectedCustomerFilter);
      }
      const response = await fetch(url.toString(), {
        headers: getHeaders({
          'Content-Type': 'application/json',
        }),
      });
      if (response.ok) {
        const result = await response.json();
        setLogs(result.traces || []);
      }
    } catch (err) {
      console.error('Failed to fetch system logs', err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab, logMode, selectedWorkflowFilter, minutesFilter, selectedCustomerFilter]);
  const handleStopTrace = async (e: React.MouseEvent, traceId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to stop this running execution?')) {
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:8000/api/observability/traces/${traceId}/stop`,
        {
          method: 'POST',

          headers: getHeaders({
            'Content-Type': 'application/json',
          }),
        },
      );
      if (response.ok) {
        alert('Stop signal sent successfully.');
        fetchLogs();
      } else {
        const errorData = await response.json();
        alert(`Failed to stop execution: ${errorData.detail || response.statusText}`);
      }
    } catch (err) {
      console.error('Failed to stop trace', err);
      alert('Error occurred while attempting to stop execution.');
    }
  };

  const handleRestartTrace = async (e: React.MouseEvent, traceId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to restart this execution with original inputs?')) {
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:8000/api/observability/traces/${traceId}/restart`,
        {
          method: 'POST',
          headers: getHeaders({
            'Content-Type': 'application/json',
          }),
        },
      );
      if (response.ok) {
        const data = await response.json();
        alert(`Execution successfully restarted! New Trace ID: ${data.new_trace_id}`);
        fetchLogs();
      } else {
        const errorData = await response.json();
        alert(`Failed to restart execution: ${errorData.detail || response.statusText}`);
      }
    } catch (err) {
      console.error('Failed to restart trace', err);
      alert('Error occurred while attempting to restart execution.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        await api.register({
          username: loginUsername,
          email: loginEmail,
          password: loginPassword,
          name: '',
          lastname: '',
        });
        <Alert icon={<CheckIcon fontSize="inherit" />} severity="success">
          'Registration successful! Please login.'
        </Alert>;

        setIsRegistering(false);
      } else {
        const data = await api.login({ email: loginEmail, password: loginPassword });
        localStorage.setItem('token', data.token);

        document.cookie = `token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

        if (data.role === 'admin' || data.role === 'system_admin') {
          setUserRole(data.role);
          setUserEmail(loginEmail);
          setCustomerId(
            data.customer_id !== null && data.customer_id !== undefined
              ? String(data.customer_id)
              : null,
          );
          setIsAuthenticated(true);
        } else {
          router.push('/workflow-builder');
        }
      }
    } catch (err) {
      <Alert icon={<CheckIcon fontSize="inherit" />} severity="success">
        'Authentication failed. Check your credentials.'
      </Alert>;
    }
  };

  const handleSaveCustomerConfig = async () => {
    if (!editingAgent) return;
    if (editingAgent.is_enabled === false) {
      alert(
        'This node is locked and cannot be configured because it has been disabled by the system administrator.',
      );
      return;
    }
    try {
      const overrides: Record<string, any> = {};
      const userProps = propertyEntriesFromValue(editingAgent.user_properties);
      const sysProps = propertyEntriesFromValue(editingAgent.system_properties);
      [...userProps, ...sysProps].forEach((entry: any) => {
        if (entry.key) {
          overrides[entry.key] = entry.value !== undefined ? entry.value : entry.default;
        }
      });

      // Validate and parse Input Contract
      const currentContract = contractFromValue(editingAgent.input_contract);
      const validatedContract = validateInputContract(currentContract);

      // Validate and parse Output Contract
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
      } catch (e) {
        <Alert icon={<CheckIcon fontSize="inherit" />} severity="success">
          Invalid JSON in Output Contract field.
        </Alert>;
        return;
      }

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

      <Alert icon={<CheckIcon fontSize="inherit" />} severity="success">
        Node configuration saved successfully!
      </Alert>;
      const agentsRes = await api.getNodes();
      setAgents((agentsRes as any).nodes || (agentsRes as any).agents || []);
      setEditingAgent(null);
    } catch (error: any) {
      console.error('Failed to save customer node config:', error);
      alert('Failed to save customer node config: ' + error.message);
    }
  };

  const handleTogglePlugins = async (customer: any) => {
    try {
      await api.updateCustomer(customer.id, {
        custom_plugins_enabled: !customer.custom_plugins_enabled,
      });
      const custs = await api.getCustomers().catch(() => []);
      setCustomers(custs || []);
    } catch (err: any) {
      alert('Failed to update custom plugins: ' + err.message);
    }
  };

  const handleUpdateStoragePath = async (customer: any) => {
    const path = prompt('Enter custom plugin storage path for ' + customer.name + ':', customer.plugin_storage_path || '');
    if (path === null) return;
    try {
      await api.updateCustomer(customer.id, {
        plugin_storage_path: path.trim() || null,
      });
      const custs = await api.getCustomers().catch(() => []);
      setCustomers(custs || []);
    } catch (err: any) {
      alert('Failed to update storage path: ' + err.message);
    }
  };

  const loadCustomerNodes = async (cid: number) => {
    setCustomerNodesLoading(true);
    try {
      const nodes = await api.getCustomerNodesAdmin(cid);
      setCustomerNodes(nodes || []);
    } catch (err: any) {
      alert('Failed to load customer nodes: ' + err.message);
    } finally {
      setCustomerNodesLoading(false);
    }
  };

  const saveCustomerNodesConfig = async () => {
    if (!selectedCustomer) return;
    try {
      const parsedNodes = customerNodes.map(node => {
        let props = node.properties;
        if (typeof props === 'string') {
          try {
            props = JSON.parse(props);
          } catch (e) {
            throw new Error(`Invalid JSON in property overrides for node ${node.label || node.node_name}`);
          }
        }
        return {
          node_name: node.node_name,
          is_enabled: node.is_enabled,
          properties: props,
          label: node.label,
        };
      });
      await api.configureCustomerNodesAdmin(selectedCustomer.id, parsedNodes);
      alert('Nodes configured successfully!');
      loadCustomerNodes(selectedCustomer.id);
    } catch (err: any) {
      alert('Failed to save nodes config: ' + err.message);
    }
  };

  const loadCustomerTraces = async (cid: number) => {
    setCustomerTracesLoading(true);
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${backendUrl}/api/observability/traces?customer_id=${cid}`, {
        headers,
      });
      const result = await res.json();
      setCustomerTraces(result.traces || []);
      setCustomerMetricsSummary(result.summary || null);
    } catch (err: any) {
      console.error('Failed to load customer traces:', err);
    } finally {
      setCustomerTracesLoading(false);
    }
  };

  const handleSaveCustomerDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      const updated = await api.updateCustomer(selectedCustomer.id, {
        name: editCustomerName,
        domain: editCustomerDomain,
        email: editCustomerEmail || null,
        address: editCustomerAddress || null,
        contact_person: editCustomerContactPerson || null,
        status: editCustomerStatus,
        custom_plugins_enabled: editCustomerPluginsEnabled,
        plugin_storage_path: editCustomerPluginsEnabled ? editCustomerStoragePath : null,
      });
      setSelectedCustomer(updated);
      setIsEditingCustomer(false);
      // Refresh customer list
      const custs = await api.getCustomers().catch(() => []);
      setCustomers(custs || []);
    } catch (err: any) {
      alert('Failed to update customer: ' + err.message);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCustomer({
        name: newCustomerName,
        domain: newCustomerDomain,
        icon: newCustomerIcon,
        color_schema: newCustomerColor,
        custom_plugins_enabled: newCustomerPluginsEnabled,
        plugin_storage_path: newCustomerPluginsEnabled ? newCustomerStoragePath : null,
        email: newCustomerEmail || null,
        address: newCustomerAddress || null,
        contact_person: newCustomerContactPerson || null,
      });
      <Alert icon={<CheckIcon fontSize="inherit" />} severity="success">
        Customer created successfully!
      </Alert>;
      setShowAddCustomerModal(false);
      setNewCustomerName('');
      setNewCustomerDomain('');
      setNewCustomerEmail('');
      setNewCustomerAddress('');
      setNewCustomerContactPerson('');
      setNewCustomerPluginsEnabled(false);
      setNewCustomerStoragePath('');
      const custs = await api.getCustomers().catch(() => []);
      setCustomers(custs || []);
    } catch (err: any) {
      alert('Failed to create customer: ' + err.message);
    }
  };

  const handleAddCustomerUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCustomerIdForUser === null) return;
    try {
      await api.createCustomerUser(selectedCustomerIdForUser, {
        name: customerUserName,
        email: customerUserEmail,
        password: customerUserPassword,
        role: 'admin',
      });
      <Alert icon={<CheckIcon fontSize="inherit" />} severity="success">
        Admin user onboarded successfully!
      </Alert>;
      setShowAddCustomerUserModal(false);
      setCustomerUserName('');
      setCustomerUserEmail('');
      setCustomerUserPassword('');
    } catch (err: any) {
      alert('Failed to add admin user: ' + err.message);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      });
      <Alert icon={<CheckIcon fontSize="inherit" />} severity="success">
        User added successfully!
      </Alert>;
      setShowAddUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      const usrs = await api.getUsers().catch(() => []);
      setUsers(usrs || []);
    } catch (err: any) {
      alert('Failed to add user: ' + err.message);
    }
  };

  const handleDeleteUser = async (targetUser: any) => {
    if (String(targetUser.id) === String(userId)) {
      alert('You cannot delete your own account.');
      return;
    }
    if (
      !confirm(`Are you sure you want to delete ${targetUser.email_id || targetUser.username}?`)
    ) {
      return;
    }

    try {
      await api.deleteUser(targetUser.id);
      const usrs = await api.getUsers().catch(() => []);
      setUsers(usrs || []);
      if (activeTab === 'logs' && logMode === 'audit') {
        await fetchLogs();
      }
    } catch (err: any) {
      alert('Failed to delete user: ' + err.message);
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    if (
      !confirm(
        'Are you sure you want to delete this customer? This will also delete all of their users.',
      )
    )
      return;
    try {
      await api.deleteCustomer(id);
      <Alert icon={<CheckIcon fontSize="inherit" />} severity="success">
        Customer deleted successfully!
      </Alert>;
      const custs = await api.getCustomers().catch(() => []);
      setCustomers(custs || []);
    } catch (err: any) {
      alert('Failed to delete customer: ' + err.message);
    }
  };

  const handleManageCustomerNodes = async (customer: any) => {
    setSelectedCustomerForNodes(customer);
    setCustomerNodeAssignments({});
    setSelectedNodesForBulk({});
    setCustomerNodeProperties({});
    setConfiguringNode(null);
    setNodeSearchQuery('');
    try {
      const res = await api.getCustomerNodesAdmin(customer.id);
      const assignments: Record<string, boolean> = {};
      const properties: Record<string, Record<string, any>> = {};
      if (res && res.configs) {
        res.configs.forEach((c: any) => {
          assignments[c.node_name] = c.is_enabled;
          properties[c.node_name] = c.properties || {};
        });
      }
      setCustomerNodeAssignments(assignments);
      setCustomerNodeProperties(properties);
      setShowNodesModal(true);
    } catch (err: any) {
      alert('Failed to load customer node configurations: ' + err.message);
    }
  };

  const handleSaveCustomerNodes = async () => {
    if (!selectedCustomerForNodes) return;
    setSavingNodes(true);
    try {
      const nodesPayload = agents.map((agent: any) => {
        const nodeName = agent.name;
        const is_enabled = !!customerNodeAssignments[nodeName];
        const properties = customerNodeProperties[nodeName] || {};
        return {
          node_name: nodeName,
          is_enabled: is_enabled,
          properties: properties,
        };
      });

      await api.configureCustomerNodesAdmin(selectedCustomerForNodes.id, nodesPayload);
      <Alert icon={<CheckIcon fontSize="inherit" />} severity="success">
        Node assignments updated successfully!
      </Alert>;
      setShowNodesModal(false);
    } catch (err: any) {
      alert('Failed to save assignments: ' + err.message);
    } finally {
      setSavingNodes(false);
    }
  };

  const handleToggleSingleAssignment = (nodeName: string) => {
    setCustomerNodeAssignments((prev) => ({
      ...prev,
      [nodeName]: !prev[nodeName],
    }));
  };

  const handleBulkToggle = (enable: boolean) => {
    const nextAssignments = { ...customerNodeAssignments };
    Object.keys(selectedNodesForBulk).forEach((nodeName) => {
      if (selectedNodesForBulk[nodeName]) {
        nextAssignments[nodeName] = enable;
      }
    });
    setCustomerNodeAssignments(nextAssignments);
    setSelectedNodesForBulk({});
  };

  const handleSelectAllForBulk = () => {
    const nextBulk: Record<string, boolean> = {};
    agents.forEach((agent: any) => {
      nextBulk[agent.name] = true;
    });
    setSelectedNodesForBulk(nextBulk);
  };

  const handleDeselectAllForBulk = () => {
    setSelectedNodesForBulk({});
  };

  const handleBulkEnableAll = () => {
    const nextAssignments: Record<string, boolean> = {};
    agents.forEach((agent: any) => {
      nextAssignments[agent.name] = true;
    });
    setCustomerNodeAssignments(nextAssignments);
  };

  const handleBulkDisableAll = () => {
    const nextAssignments: Record<string, boolean> = {};
    agents.forEach((agent: any) => {
      nextAssignments[agent.name] = false;
    });
    setCustomerNodeAssignments(nextAssignments);
  };

  const handleToggleWorkflow = async (id: string) => {
    await api.toggleWorkflowStatus(id);
    const workflowsRes = await api.getSavedAgents();
    setWorkflows(workflowsRes || []);
  };

  const handleClearWorkflowCache = async (workflowId?: string) => {
    if (workflowId) {
      if (!confirm('Are you sure you want to clear the compiled graph cache for this workflow?'))
        return;
    } else {
      if (
        !confirm(
          'Are you sure you want to clear the entire compiled graph cache? This will cause all workflows to rebuild on their next run.',
        )
      )
        return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = new URL('http://localhost:8000/workflows/cache/clear');
      if (workflowId) {
        url.searchParams.append('workflow_id', workflowId);
      }

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: getHeaders({
          'Content-Type': 'application/json',
        }),
      });

      if (response.ok) {
        alert(
          workflowId
            ? 'Workflow cache cleared successfully.'
            : 'Entire graph cache cleared successfully.',
        );
      } else {
        const errorData = await response.json();
        alert(`Failed to clear cache: ${errorData.detail || response.statusText}`);
      }
    } catch (err) {
      console.error('Failed to clear graph cache', err);
      alert('Error occurred while clearing graph cache.');
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this workflow? This will remove the workflow, its nodes, node properties, and related workflow settings.',
      )
    ) {
      return;
    }

    try {
      await api.deleteWorkflow(workflowId);
      const workflowsRes = await api.getSavedAgents();
      setWorkflows(workflowsRes || []);
    } catch (err) {
      console.error('Failed to delete workflow', err);
      alert(err instanceof Error ? err.message : 'Failed to delete workflow.');
    }
  };

  const toggleJsonExpanded = (agent: AgentNode) => {
    const agentKey = agent.id?.toString() || agent.name;
    setJsonExpandedState((prev) => ({
      ...prev,
      [agentKey]: !prev[agentKey],
    }));
  };

  if (!isMounted) {
    return null;
  }

  const handleSaveCategory = async () => {
    if (!editingCategory) return;
    try {
      if (editingCategory.id) {
        // @ts-ignore
        await api.updateCategory(editingCategory.id, editingCategory);
      } else {
        // @ts-ignore
        await api.createCategory(editingCategory);
      }
      const catsRes = await api.getNodesCategories();
      const cats = Array.isArray(catsRes) ? catsRes : catsRes.categories || [];
      const normalizedCats = cats.map((cat: any) =>
        typeof cat === 'string'
          ? { name: cat, label: cat }
          : { ...cat, name: cat.group || cat.name },
      );
      setCategories(normalizedCats);
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      // @ts-ignore
      await api.deleteCategory(id);
      const catsRes = await api.getNodesCategories();
      const cats = Array.isArray(catsRes) ? catsRes : catsRes.categories || [];
      setCategories(
        cats.map((cat: any) =>
          typeof cat === 'string'
            ? { name: cat, label: cat }
            : { ...cat, name: cat.group || cat.name },
        ),
      );
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const handleSaveProvider = async () => {
    if (!editingProvider) return;
    try {
      await api.createProvider(editingProvider);
      const providersRes = await api.getProviders();
      setProviders(providersRes || []);
      setEditingProvider(null);
    } catch (error) {
      console.error('Failed to save provider:', error);
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

  const handleSaveInputContract = async () => {
    if (!editingAgent) return;
    if (editingAgent.is_enabled === false) {
      alert(
        'This node is locked and cannot be configured because it has been disabled by the system administrator.',
      );
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
          customerId || undefined,
        );

        const agentsRes = await api.getNodes();
        setAgents((agentsRes as any).nodes || (agentsRes as any).agents || []);
        <Alert icon={<CheckIcon fontSize="inherit" />} severity="success">
          Input contract saved successfully!
        </Alert>;
        return;
      }

      if (!editingAgent.id) {
        <Alert icon={<CheckIcon fontSize="inherit" />} severity="success">
          Please create the node first before saving input contracts separately.
        </Alert>;
        return;
      }

      const updatedAgent = { ...editingAgent, input_contract: validatedContract };

      // @ts-ignore - updateNode added to api.ts
      await api.updateNode(updatedAgent);
      const agentsRes = await api.getNodes();
      setAgents((agentsRes as any).nodes || (agentsRes as any).agents || []);
      <Alert icon={<CheckIcon fontSize="inherit" />} severity="success">
        Input contract saved successfully!
      </Alert>;
    } catch (error) {
      console.error('Failed to save input contract:', error);
      <Alert icon={<CheckIcon fontSize="inherit" />} severity="success">
        Failed to save input contract. Please ensure the backend endpoint is implemented.
      </Alert>;
    }
  };

  const handleSaveNode = async () => {
    if (!editingAgent) return;

    const finalAgent = { ...editingAgent };

    // Validate and parse Input Contract
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
      <Alert icon={<CheckIcon fontSize="inherit" />} severity="success">
        Invalid JSON in Input Contract field.
      </Alert>;
      return;
    }

    // Validate and parse Output Contract
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
      <Alert icon={<CheckIcon fontSize="inherit" />} severity="success">
        Invalid JSON in Output Contract field.
      </Alert>;
      return;
    }

    // Validate and parse User Properties
    try {
      finalAgent.user_properties = propertyEntriesToJsonStrings(
        propertyEntriesFromValue(finalAgent.user_properties),
      );
    } catch (e) {
      <Alert icon={<CheckIcon fontSize="inherit" />} severity="success">
        Invalid JSON in User Properties field.
      </Alert>;
      return;
    }

    // Validate and parse System Properties
    try {
      finalAgent.system_properties = propertyEntriesToJsonStrings(
        propertyEntriesFromValue(finalAgent.system_properties),
      );
    } catch (e) {
      <Alert icon={<CheckIcon fontSize="inherit" />} severity="success">
        Invalid JSON in System Properties field.
      </Alert>;
      return;
    }

    // Enforce that category is saved as the ID from the categorydb
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
      if (finalAgent.id) {
        // @ts-ignore - updateNode added to api.ts
        await api.updateNode(finalAgent);
      } else {
        // @ts-ignore - createNode added to api.ts
        await api.createNode(finalAgent);
      }
      const agentsRes = await api.getNodes();
      setAgents((agentsRes as any).nodes || (agentsRes as any).agents || []);
      setEditingAgent(null);
    } catch (error) {
      const isUpdate = !!editingAgent.id;
      console.error(`Failed to ${isUpdate ? 'save' : 'create'} node:`, error);
      alert(
        `Failed to ${isUpdate ? 'save' : 'create'} node. Ensure the backend endpoint ${
          isUpdate ? 'PUT /nodes/:name' : 'POST /nodes'
        } is implemented.`,
      );
    }
  };

  const handleDeleteNode = async (nodeName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete the node type "${nodeName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }
    try {
      // Assuming an API endpoint for deleting nodes by name
      // This API call needs to be implemented in your backend (e.g., DELETE /nodes/:name)
      // and added to lib/api.ts
      // Example: await api.deleteNode(nodeName);
      alert(`Node type "${nodeName}" deleted successfully. (Requires backend implementation)`);
      const agentsRes = await api.getNodes();
      setAgents((agentsRes as any).nodes || (agentsRes as any).agents || []);
    } catch (error) {
      console.error('Failed to delete node:', error);
      alert(
        `Failed to delete node type "${nodeName}". Ensure the backend endpoint DELETE /nodes/:name is implemented.`,
      );
    }
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

  const updateInputContractRule = (index: number, patch: Partial<ContractRule>) => {
    updateInputContract((contract) => ({
      ...contract,
      rules: contract.rules.map((rule, ruleIndex) =>
        ruleIndex === index ? { ...rule, ...patch } : rule,
      ),
    }));
  };

  const addInputContractRule = () => {
    updateInputContract((contract) => ({
      ...contract,
      rules: [
        ...contract.rules,
        {
          field_name: 'id',
          field_type: 'string',
          required: false,
          description: '',
          min_length: '',
          max_length: '',
          minimum: '',
          maximum: '',
          allowed_values: [],
        },
      ],
    }));
  };

  const removeInputContractRule = (index: number) => {
    updateInputContract((contract) => ({
      ...contract,
      rules: contract.rules.filter((_, ruleIndex) => ruleIndex !== index),
    }));
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

  const renderCustomerPropertyInput = (entry: any, val: any, nodeName: string) => {
    const handleValChange = (v: any) => {
      setCustomerNodeProperties((prev) => ({
        ...prev,
        [nodeName]: {
          ...(prev[nodeName] || {}),
          [entry.key]: v,
        },
      }));
    };
    const commonClasses =
      'w-full bg-white border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 text-sm text-black';

    if (
      entry.type === 'password' ||
      entry.type?.toLowerCase().includes('secret') ||
      entry.type?.toLowerCase().includes('key')
    ) {
      return (
        <input
          type="password"
          className={commonClasses}
          value={String(val ?? '')}
          placeholder="••••••••"
          autoComplete="new-password"
          onChange={(e) => handleValChange(e.target.value)}
        />
      );
    }

    if (entry.type === 'boolean') {
      return (
        <select
          className={commonClasses}
          value={String(val ?? false)}
          onChange={(e) => handleValChange(e.target.value === 'true')}
        >
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      );
    }

    if (entry.type === 'number') {
      return (
        <input
          type="number"
          className={commonClasses}
          value={val ?? 0}
          onChange={(e) => handleValChange(Number(e.target.value))}
        />
      );
    }

    if (entry.type === 'textarea') {
      return (
        <textarea
          className={`${commonClasses} min-h-[60px] resize-y`}
          value={String(val ?? '')}
          placeholder="Enter content..."
          onChange={(e) => handleValChange(e.target.value)}
        />
      );
    }

    if (entry.multiple || entry.type === 'list') {
      return (
        <input
          className={commonClasses}
          value={Array.isArray(val) ? val.join(', ') : String(val ?? '')}
          placeholder="val1, val2, val3..."
          onChange={(e) =>
            handleValChange(
              e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
        />
      );
    }

    return (
      <input
        className={commonClasses}
        value={typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')}
        placeholder="Enter value..."
        onChange={(e) => handleValChange(e.target.value)}
      />
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 px-4">
        <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl border border-gray-200">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <IconMap.shield className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {isRegistering ? 'Create Account' : 'Admin Portal'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {isRegistering ? 'Join the gateway system' : 'Please sign in to manage the gateway'}
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4 rounded-md shadow-sm">
              {isRegistering && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Username</label>
                  <input
                    type="text"
                    required
                    className="relative block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    placeholder="jdoe"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  className="relative block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder="admin@gateway.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
                <input
                  type="password"
                  required
                  className="relative block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
            </div>
            <button
              type="submit"
              className="group relative flex w-full justify-center rounded-lg border border-transparent bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-lg"
            >
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <IconMap.lock className="h-5 w-5 text-blue-500 group-hover:text-blue-400" />
              </span>
              {isRegistering ? 'Register' : 'Access Console'}
            </button>
          </form>
          <div className="text-center mt-4">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm text-blue-600 hover:underline"
            >
              {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <IconMap.activity className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-gray-500">Loading system registry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto w-full space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-black">System Registry</h1>
            <p className="mt-1 text-gray-500">
              Live view of discovered nodes, categories, and their underlying properties.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-sm border border-gray-200">
              <span className="text-sm font-semibold text-black">Admin Console</span>
            </div>
          </div>
        </header>

        <div className="flex border-b border-gray-200">
          {userRole === 'system_admin' && (
            <button
              onClick={() => handleTabChange('customers')}
              className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'customers' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Customer Management
            </button>
          )}
          {(userRole === 'admin' || userRole === 'system_admin') && (
            <button
              onClick={() => handleTabChange('nodes')}
              className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'nodes' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Node Management
            </button>
          )}
          <button
            onClick={() => handleTabChange('workflows')}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'workflows' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Workflow Management
          </button>
          {(userRole === 'admin' || userRole === 'system_admin') && (
            <>
              <button
                onClick={() => handleTabChange('users')}
                className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'users' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                User Management
              </button>
              <button
                onClick={() => handleTabChange('oauth')}
                className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'oauth' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                OAuth Management
              </button>
              <button
                onClick={() => handleTabChange('logs')}
                className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'logs' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                System Logs
              </button>
              <button
                onClick={() => handleTabChange('metrics')}
                className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'metrics' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Metrics
              </button>
            </>
          )}
        </div>

        {activeTab === 'nodes' ? (
          <>
            {/* Categories Section */}
            {/* <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconMap.tag className="h-5 w-5 text-gray-400" />
                  <h2 className="text-xl font-semibold text-black">Node Categories</h2>
                </div>
                <button
                  onClick={() => {
                    setEditingCategory({
                      name: '',
                      group: '',
                      label: '',
                      description: '',
                      icon: 'box',
                      color: '#1DA1F2',
                    });
                    setIsCategoryModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] shadow-sm transition-all duration-200"
                >
                  <IconMap.plus className="h-4 w-4" /> Add Category
                </button>
              </div>
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-6">
                <div
                  onClick={() => setFilterCategory('all')}
                  className={`group cursor-pointer flex items-center justify-between rounded-xl border p-1 shadow-sm hover:shadow-md transition-all ${filterCategory === 'all' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 bg-white'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-gray-400" />
                    <div className="flex flex-col">
                      <span className="font-medium text-black">All Categories</span>
                      <span className="text-[10px] text-gray-400 font-mono">all</span>
                    </div>
                  </div>
                </div>

                {categories.map((cat, idx) => {
                  const catIdStr = cat.id ? String(cat.id) : cat.name;
                  const isActive = filterCategory === catIdStr;
                  return (
                    <div
                      key={cat.id || `cat-${cat.name}-${idx}`}
                      onClick={() => setFilterCategory(catIdStr)}
                      className={`group cursor-pointer flex items-center justify-between rounded-xl border p-1 shadow-sm hover:shadow-md transition-all ${isActive ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 bg-white'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: cat.color || '#3b82f6' }}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium text-black">{cat.label || cat.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{cat.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCategory(cat);
                            setIsCategoryModalOpen(true);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <IconMap.edit2 className="h-4 w-4" />
                        </button>
                        {cat.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCategory(cat.id!);
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <IconMap.trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section> */}

            {/* Agents/Nodes Section */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <IconMap.box className="h-5 w-5 text-gray-400" />
                  <h2 className="text-xl font-semibold text-black">Nodes</h2>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Category Dropdown Filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">Category:</span>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-black focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((cat, idx) => (
                        <option
                          key={`filter-cat-${cat.id || idx}`}
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
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-black focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
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
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] shadow-sm transition-all duration-200"
                    >
                      <IconMap.plus className="h-4 w-4" /> Add New Node
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
                      {/* <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Category
                      </th> */}
                      {/* <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Group
                      </th> */}
                      {/* <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Description
                      </th> */}
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
                        (agent.icon && IconMap[agent.icon.toLowerCase()]) ||
                        IconMap.box ||
                        IconMap.bot;

                      return (
                        <tr
                          key={agent.id ? `node-${agent.id}` : `node-${agent.name}-${idx}`}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          {/* Label / Icon */}
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
                              <div className="flex flex-col text-xs ">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-black">
                                    {agent.label || agent.name}
                                  </span>
                                  {agent.badge && (
                                    // <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700 border border-amber-100">
                                    //   {agent.node_type}
                                    // </span>
                                    <></> // Badge is now part of Type column
                                  )}
                                </div>
                                {agent.sub_label && (
                                  <span className="text-xs text-blue-600 font-medium mt-0.5">
                                    {agent.sub_label}
                                  </span>
                                )}
                                <p className="text-xs text-gray-600  line-clamp-2">
                                  {agent.description || 'No description.'}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Name (ID) / Version */}
                          <td className="px-4 py-3 ">
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-700 font-mono">{agent.name}</span>
                              <span className="text-[10px] text-gray-400 font-mono mt-0.5">
                                v{agent.version}
                              </span>
                            </div>
                          </td>

                          {/* Type */}

                          <td className="px-4 py-3">
                            {agent.node_type.toLowerCase() == 'node' && (
                              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs font-bold uppercase text-amber-700 border border-amber-100">
                                {agent.node_type}
                              </span>
                            )}
                            {agent.node_type.toLowerCase() == 'trigger' && (
                              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs font-bold uppercase text-green-700 border border-green-100">
                                {agent.node_type}
                              </span>
                            )}
                          </td>

                          {/* Category
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700 border border-blue-100 uppercase">
                              {agent.category}
                            </span>
                          </td> */}

                          {/* Group */}
                          {/* <td className="px-4 py-3">
                            <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-bold text-gray-600 border border-gray-100 uppercase">
                              {agent.group}
                            </span>
                          </td> */}

                          {/* Description */}
                          {/*  */}

                          {/* JSON Definition (Collapsible) */}
                          <td className="px-4 py-3">
                            <div>
                              <button
                                onClick={() => toggleJsonExpanded(agent)}
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-xs whitespace-nowrap"
                              >
                                {jsonExpandedState[agentKey] ? (
                                  <>
                                    <IconMap.code2 className="h-3.5 w-3.5" /> Hide Definition
                                  </>
                                ) : (
                                  <>
                                    <IconMap.code2 className="h-3.5 w-3.5" /> Show Definition
                                  </>
                                )}
                              </button>
                            </div>
                            <div
                              className={`w-full max-w-xs overflow-hidden rounded-lg bg-gray-950 font-mono text-emerald-400 shadow-inner transition-all duration-300 ${
                                jsonExpandedState[agentKey]
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

                          {/* Actions */}
                          <td className="px-4 py-3 text-right min-w-[100px]">
                            <div className="flex items-center justify-end gap-2">
                              {customerId &&
                                (agent.is_enabled === false ? (
                                  <div
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border bg-red-50 text-red-700 border-red-200 cursor-not-allowed select-none transition-all shadow-sm"
                                    title="Locked by System Administrator"
                                  >
                                    <IconMap.lock className="h-3 w-3 text-red-500" />
                                    <span>Locked</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={async () => {
                                      try {
                                        await api.configureCustomerNode(
                                          agent.name,
                                          {
                                            fieldname: 'is_enabled',
                                            value: false,
                                          },
                                          customerId || undefined,
                                        );
                                        const agentsRes = await api.getNodes();
                                        setAgents(
                                          (agentsRes as any).nodes ||
                                            (agentsRes as any).agents ||
                                            [],
                                        );
                                      } catch (err: any) {
                                        alert('Failed to toggle status: ' + err.message);
                                      }
                                    }}
                                    className="px-2.5 py-1 text-xs font-bold rounded-lg border transition-all bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
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
                                  agent.is_enabled === false
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'text-blue-600 hover:bg-blue-50'
                                }`}
                                title={
                                  agent.is_enabled === false
                                    ? 'Locked by System Administrator'
                                    : customerId
                                      ? 'Edit Customer Overrides'
                                      : 'Edit Node Type'
                                }
                              >
                                <IconMap.edit2 className="h-4 w-4" />
                              </button>
                              {!customerId && (
                                <button
                                  onClick={() => handleDeleteNode(agent.name)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title="Delete Node Type"
                                >
                                  <IconMap.trash2 className="h-4 w-4" />
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
          </>
        ) : activeTab === 'workflows' ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Workflow className="h-5 w-5 text-gray-400" />
                <h2 className="text-xl font-semibold text-black">Workflow Catalog</h2>
              </div>
              <div className="flex items-center gap-3">
                {(userRole === 'admin' || userRole === 'system_admin') && (
                  <button
                    onClick={() => handleClearWorkflowCache()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                    title="Clear all compiled workflows from memory cache"
                  >
                    <IconMap.refreshCw className="h-3.5 w-3.5" />
                    Clear Cache
                  </button>
                )}
                {/* View Mode Toggle */}
                <div className="flex items-center border border-gray-200 rounded-lg p-0.5 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => setWorkflowViewMode('list')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                      workflowViewMode === 'list'
                        ? 'bg-blue-50 text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <List className="h-3.5 w-3.5" />
                    List
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkflowViewMode('card')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                      workflowViewMode === 'card'
                        ? 'bg-blue-50 text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Card
                  </button>
                </div>
              </div>
            </div>

            {workflowViewMode === 'list' ? (
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-xs text-gray-500 uppercase font-bold">
                        Workflow Name / ID
                      </th>
                      <th className="px-4 py-3 text-xs text-gray-500 uppercase font-bold">
                        Description
                      </th>
                      <th className="px-4 py-3 text-xs text-gray-500 uppercase font-bold text-center">
                        Nodes
                      </th>
                      <th className="px-4 py-3 text-xs text-gray-500 uppercase font-bold text-center">
                        Edges
                      </th>
                      <th className="px-4 py-3 text-xs text-gray-500 uppercase font-bold">
                        Status
                      </th>
                      <th className="px-4 py-3 text-xs text-gray-500 uppercase font-bold text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {workflows.map((wf) => (
                      <tr key={wf.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-black">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100 flex-shrink-0">
                              <Workflow className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-black">{wf.name}</span>
                              <span className="text-[10px] text-gray-400 font-mono">{wf.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate">
                          {wf.description || (
                            <span className="text-gray-400 italic">No description provided.</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700 font-semibold text-center">
                          {wf.graph?.nodes?.length || 0}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700 font-semibold text-center">
                          {wf.graph?.edges?.length || 0}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border ${
                              wf.is_enabled !== false
                                ? 'bg-green-50 text-green-700 border-green-100'
                                : 'bg-red-50 text-red-700 border-red-100'
                            }`}
                          >
                            {wf.is_enabled !== false ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-right">
                          <div className="flex items-center justify-end gap-2">
                            {(userRole === 'admin' || userRole === 'system_admin') && (
                              <>
                                <button
                                  onClick={() => handleClearWorkflowCache(wf.id)}
                                  className="p-1.5 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                                  title="Clear Workflow Cache"
                                >
                                  <IconMap.refreshCw className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleToggleWorkflow(wf.id)}
                                  className={`p-1.5 rounded transition-colors ${
                                    wf.is_enabled !== false
                                      ? 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                      : 'text-gray-400 hover:text-green-500 hover:bg-green-50'
                                  }`}
                                  title={wf.is_enabled !== false ? 'Disable' : 'Enable'}
                                >
                                  <IconMap.power className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDeleteWorkflow(wf.id)}
                              className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete Workflow"
                            >
                              <IconMap.trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {workflows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-500 text-sm">
                          <div className="flex flex-col items-center">
                            <IconMap.workflow className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                            <h3 className="text-sm font-semibold text-gray-900">
                              No workflows found
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                              Get started by creating a new workflow in the builder.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {workflows.map((wf) => (
                  <div
                    key={wf.id}
                    className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                          <Workflow className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-black">{wf.name}</h3>
                          <p className="text-[10px] text-gray-400 font-mono">{wf.id}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border ${wf.is_enabled !== false ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}
                        >
                          {wf.is_enabled !== false ? 'Active' : 'Disabled'}
                        </span>
                        <div className="flex gap-1">
                          {(userRole === 'admin' || userRole === 'system_admin') && (
                            <>
                              <button
                                onClick={() => handleClearWorkflowCache(wf.id)}
                                className="p-1 rounded text-gray-400 hover:text-blue-500 transition-colors"
                                title="Clear Workflow Cache"
                              >
                                <IconMap.refreshCw className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleToggleWorkflow(wf.id)}
                                className={`p-1 rounded transition-colors ${wf.is_enabled !== false ? 'text-gray-400 hover:text-red-500' : 'text-gray-400 hover:text-green-500'}`}
                                title={wf.is_enabled !== false ? 'Disable' : 'Enable'}
                              >
                                <IconMap.power className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteWorkflow(wf.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete Workflow"
                          >
                            <IconMap.trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {wf.description || 'No description provided.'}
                      </p>
                      <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 uppercase font-bold">
                            Nodes
                          </span>
                          <span className="text-sm font-semibold text-black">
                            {wf.graph?.nodes?.length || 0}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 uppercase font-bold">
                            Edges
                          </span>
                          <span className="text-sm font-semibold text-black">
                            {wf.graph?.edges?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {workflows.length === 0 && (
                  <div className="col-span-full py-12 text-center rounded-xl border-2 border-dashed border-gray-200">
                    <IconMap.workflow className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">No workflows found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by creating a new workflow in the builder.
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>
        ) : activeTab === 'customers' ? (
          selectedCustomer ? (
            <div className="space-y-6">
              {/* Back Button and Header */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm"
                  >
                    ← Back to Customers
                  </button>
                  <div>
                    <h2 className="text-2xl font-bold text-black flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: selectedCustomer.color_schema || '#2563eb' }}
                      ></span>
                      {selectedCustomer.name}
                    </h2>
                    <span className="text-xs text-gray-500 font-mono">ID: {selectedCustomer.id} | Domain: {selectedCustomer.domain}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditCustomerName(selectedCustomer.name);
                      setEditCustomerDomain(selectedCustomer.domain || '');
                      setEditCustomerEmail(selectedCustomer.email || '');
                      setEditCustomerAddress(selectedCustomer.address || '');
                      setEditCustomerContactPerson(selectedCustomer.contact_person || '');
                      setEditCustomerStatus(selectedCustomer.status || 'active');
                      setEditCustomerPluginsEnabled(selectedCustomer.custom_plugins_enabled || false);
                      setEditCustomerStoragePath(selectedCustomer.plugin_storage_path || '');
                      setIsEditingCustomer(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm"
                  >
                  Edit
                  </button>
                  
                  {selectedCustomer.id !== 0  && (
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this customer?')) {
                          handleDeleteCustomer(selectedCustomer.id);
                          setSelectedCustomer(null);
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-755 shadow-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Sub navigation tabs */}
              <div className="flex border-b border-gray-200 gap-6">
                {[
                  { id: 'details', label: 'Details & Info' },
                  { id: 'users', label: 'Users Management' },
                  { id: 'nodes', label: 'Allowed Nodes' },
                  { id: 'metrics', label: 'Activity & Metrics' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setCustomerDetailTab(tab.id as any);
                      if (tab.id === 'nodes') {
                        loadCustomerNodes(selectedCustomer.id);
                      } else if (tab.id === 'metrics') {
                        loadCustomerTraces(selectedCustomer.id);
                      }
                    }}
                    className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
                      customerDetailTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              {customerDetailTab === 'details' && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  {isEditingCustomer ? (
                    <form onSubmit={handleSaveCustomerDetails} className="space-y-4 max-w-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Name</label>
                          <input
                            type="text"
                            required
                            value={editCustomerName}
                            onChange={e => setEditCustomerName(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-blue-600 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Domain</label>
                          <input
                            type="text"
                            required
                            value={editCustomerDomain}
                            onChange={e => setEditCustomerDomain(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-blue-600 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email</label>
                          <input
                            type="email"
                            value={editCustomerEmail}
                            onChange={e => setEditCustomerEmail(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-blue-600 focus:outline-none"
                            placeholder="billing@tenant.com"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Contact Person</label>
                          <input
                            type="text"
                            value={editCustomerContactPerson}
                            onChange={e => setEditCustomerContactPerson(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-blue-600 focus:outline-none"
                            placeholder="John Doe"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Address</label>
                        <textarea
                          rows={2}
                          value={editCustomerAddress}
                          onChange={e => setEditCustomerAddress(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-blue-600 focus:outline-none"
                          placeholder="123 Business Rd, Suite 100"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Status</label>
                          <select
                            value={editCustomerStatus}
                            onChange={e => setEditCustomerStatus(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-blue-600 focus:outline-none bg-white"
                          >
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Custom Plugins</label>
                          <div className="flex items-center gap-2 mt-2">
                            <input
                              type="checkbox"
                              id="editCustomerPluginsEnabled"
                              checked={editCustomerPluginsEnabled}
                              onChange={e => setEditCustomerPluginsEnabled(e.target.checked)}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="editCustomerPluginsEnabled" className="text-sm text-gray-600 font-medium">Enabled</label>
                          </div>
                        </div>
                      </div>
                      {editCustomerPluginsEnabled && (
                        <div>
                          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Plugin Storage Path</label>
                          <input
                            type="text"
                            value={editCustomerStoragePath}
                            onChange={e => setEditCustomerStoragePath(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-blue-600 focus:outline-none"
                            placeholder="plugins/nodes/client/1"
                          />
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <button
                          type="submit"
                          className="bg-blue-600 px-4 py-2 text-sm font-bold text-white rounded-lg hover:bg-blue-700 shadow-sm"
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingCustomer(false)}
                          className="border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <span className="block text-[10px] text-gray-400 uppercase font-bold">Domain name</span>
                          <span className="text-sm font-semibold text-black">{selectedCustomer.domain}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-gray-400 uppercase font-bold">Email address</span>
                          <span className="text-sm font-semibold text-black">{selectedCustomer.email || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-gray-400 uppercase font-bold">Contact person</span>
                          <span className="text-sm font-semibold text-black">{selectedCustomer.contact_person || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-gray-400 uppercase font-bold">Status</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase inline-block mt-1 ${selectedCustomer.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {selectedCustomer.status}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <span className="block text-[10px] text-gray-400 uppercase font-bold">Address</span>
                          <span className="text-sm font-semibold text-black block whitespace-pre-line leading-relaxed">{selectedCustomer.address || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-gray-400 uppercase font-bold">Custom Plugins</span>
                          <span className="text-sm font-semibold text-black block mt-1">{selectedCustomer.custom_plugins_enabled ? 'Enabled' : 'Disabled'}</span>
                        </div>
                        {selectedCustomer.custom_plugins_enabled && (
                          <div>
                            <span className="block text-[10px] text-gray-400 uppercase font-bold">Plugin Storage Path</span>
                            <span className="text-sm font-mono font-semibold text-black block mt-1">{selectedCustomer.plugin_storage_path || 'Default'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {customerDetailTab === 'users' && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm p-6 space-y-4">
                  <div className="flex justify-between items-center pb-2">
                    <div>
                      <h4 className="text-md font-bold text-black">Customer Users</h4>
                      <p className="text-xs text-gray-500">Manage directory users and admins associated with this tenant.</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCustomerIdForUser(selectedCustomer.id);
                        setShowAddCustomerUserModal(true);
                      }}
                      className="bg-blue-600 px-3 py-1.5 text-xs font-bold text-white rounded-lg hover:bg-blue-700 shadow-sm"
                    >
                      + Add Tenant User
                    </button>
                  </div>
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Username</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Email</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Role</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.filter(u => u.customer_id === selectedCustomer.id).map((u, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-black font-semibold">{u.name} ({u.username})</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{u.email_id}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 font-mono capitalize">{u.role}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {u.role !== 'system_admin' && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="text-red-650 hover:text-red-750 font-semibold"
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {users.filter(u => u.customer_id === selectedCustomer.id).length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-500 text-xs">
                            No users registered for this tenant.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {customerDetailTab === 'nodes' && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <div>
                      <h4 className="text-md font-bold text-black">Nodes Catalog Access</h4>
                      <p className="text-xs text-gray-500">Enable or disable specific node access and customize parameters for this tenant.</p>
                    </div>
                    <button
                      onClick={saveCustomerNodesConfig}
                      className="bg-blue-600 px-4 py-2 text-xs font-bold text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 shadow-sm"
                    >
                      💾 Save Config
                    </button>
                  </div>
                  {customerNodesLoading ? (
                    <div className="py-8 text-center text-sm text-gray-500">Loading customer nodes...</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      {customerNodes.map((n, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50/50">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="text-sm font-semibold text-black">{n.label || n.node_name}</h5>
                              <span className="text-[10px] text-gray-400 font-mono">Type: {n.node_name}</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={n.is_enabled}
                                onChange={(e) => {
                                  const updated = [...customerNodes];
                                  updated[idx] = { ...updated[idx], is_enabled: e.target.checked };
                                  setCustomerNodes(updated);
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 font-bold uppercase"></div>
                            </label>
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Custom Overrides (JSON)</label>
                            <textarea
                              rows={2}
                              value={typeof n.properties === 'string' ? n.properties : JSON.stringify(n.properties || {})}
                              onChange={(e) => {
                                const updated = [...customerNodes];
                                updated[idx] = { ...updated[idx], properties: e.target.value };
                                setCustomerNodes(updated);
                              }}
                              placeholder="{}"
                              className="w-full text-xs font-mono rounded-lg border border-gray-200 p-2 text-black focus:border-blue-600 focus:outline-none bg-white"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {customerDetailTab === 'metrics' && (
                <div className="bg-white border border-gray-250 rounded-xl p-6 shadow-sm space-y-6">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-150">
                    <div>
                      <h4 className="text-md font-bold text-black font-semibold">Observability Trace Log</h4>
                      <p className="text-xs text-gray-500">Live trace records for workflows running on {selectedCustomer.name}.</p>
                    </div>
                  </div>
                  {customerMetricsSummary && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50/30 border border-blue-100 rounded-xl p-4">
                        <span className="block text-xs font-bold text-gray-500 uppercase">Total Requests</span>
                        <span className="text-2xl font-bold text-blue-600">{customerMetricsSummary.total_requests}</span>
                      </div>
                      <div className="bg-blue-50/30 border border-blue-100 rounded-xl p-4">
                        <span className="block text-xs font-bold text-gray-500 uppercase">Avg Latency</span>
                        <span className="text-2xl font-bold text-blue-600">{customerMetricsSummary.avg_latency_ms}ms</span>
                      </div>
                      <div className="bg-blue-50/30 border border-blue-100 rounded-xl p-4">
                        <span className="block text-xs font-bold text-gray-500 uppercase">Error Rate</span>
                        <span className="text-2xl font-bold text-red-600">{customerMetricsSummary.error_rate}%</span>
                      </div>
                    </div>
                  )}
                  <div className="space-y-4">
                    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Timestamp</th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Trace ID</th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Workflow</th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 font-mono text-xs">
                          {customerTracesLoading ? (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-gray-500 text-xs">
                                Loading traces...
                              </td>
                            </tr>
                          ) : (
                            customerTraces.map((m, idx) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-600">{new Date(m.timestamp * 1000).toLocaleString()}</td>
                                <td className="px-4 py-3 text-gray-800 font-semibold">{m.trace_id}</td>
                                <td className="px-4 py-3 text-gray-800 font-semibold">{m.workflow_id}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${m.status === 'success' || m.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {m.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                          {!customerTracesLoading && customerTraces.length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-gray-500 text-xs">
                                No activity or execution traces recorded in current time range.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconMap.users className="h-5 w-5 text-gray-400" />
                  <h2 className="text-xl font-semibold text-black">Customer Management</h2>
                </div>
                <button
                  onClick={() => setShowAddCustomerModal(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition-all"
                >
                  <IconMap.plus className="h-4 w-4" /> Add Customer
                </button>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden animate-fade-in">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-xs text-gray-500 uppercase font-bold">Plugin Name</th>
                      <th className="px-4 py-3 text-xs text-gray-500 uppercase font-bold">Domain Name</th>
                      <th className="px-4 py-3 text-xs text-gray-500 uppercase font-bold">Custom Plugins</th>
                      <th className="px-4 py-3 text-xs text-gray-500 uppercase font-bold">Plugins Storage Path</th>
                      <th className="px-4 py-3 text-xs text-gray-500 uppercase font-bold">Status</th>
                      <th className="px-4 py-3 text-xs text-gray-500 uppercase font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {customers.map((c, i) => (
                      <tr
                        key={i}
                        onClick={() => {
                          setSelectedCustomer(c);
                          setCustomerDetailTab('details');
                        }}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-black font-medium flex items-center gap-3">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: c.color_schema || '#2563eb' }}
                          ></span>
                          {c.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{c.domain}</td>
                        <td className="px-4 py-3 text-sm" onClick={e => e.stopPropagation()}>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={c.custom_plugins_enabled || false}
                              onChange={() => handleTogglePlugins(c)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs">{c.plugin_storage_path || 'Default'}</span>
                            <button
                              onClick={() => handleUpdateStoragePath(c)}
                              className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                              title="Edit Storage Path"
                            >
                              ✏️
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${c.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm flex gap-3" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setSelectedCustomerIdForUser(c.id);
                              setShowAddCustomerUserModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            Add Admin User
                          </button>
                          <button
                            onClick={() => handleManageCustomerNodes(c)}
                            className="text-indigo-600 hover:text-indigo-800 font-semibold"
                          >
                            Manage Nodes
                          </button>
                          {c.id !== 0 && 
                           c.name?.toLowerCase() !== 'system' && 
                           c.name?.toLowerCase() !== 'system account' && 
                           c.name?.toLowerCase() !== 'system_account' && 
                           c.domain?.toLowerCase() !== 'system' && (
                            <button
                              onClick={() => handleDeleteCustomer(c.id)}
                              className="text-red-650 hover:text-red-750 font-semibold"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {customers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-500 text-sm">
                          No customers configured. Click "Add Customer" to configure the first tenant.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )
        ) : activeTab === 'users' ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconMap.users className="h-5 w-5 text-gray-400" />
                <h2 className="text-xl font-semibold text-black">User Management</h2>
              </div>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition-all"
              >
                <IconMap.plus className="h-4 w-4" /> Add User
              </button>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                      Username
                    </th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Role</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users?.map((u, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-black font-medium">{u.username}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{u.email_id}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.role === 'admin' || u.role === 'system_admin' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-sm font-medium ${u.status === 'active' ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u)}
                          disabled={String(u.id) === String(userId) || u.role === 'system_admin'}
                          title={
                            String(u.id) === String(userId)
                              ? 'You cannot delete your own account'
                              : u.role === 'system_admin'
                              ? 'System admin users cannot be deleted'
                              : 'Delete user'
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-100 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-gray-100 disabled:text-gray-300 disabled:hover:bg-white"
                        >
                          <IconMap.trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-8 flex justify-center gap-4">
              <div className="rounded-lg bg-gray-50 px-4 py-2 text-left border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Current Session</div>
                <div className="text-sm font-bold text-black">{loginEmail}</div>
              </div>
              <div className="rounded-lg bg-gray-50 px-4 py-2 text-left border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Account Status</div>
                <div className="text-sm font-bold text-green-600">Verified</div>
              </div>
            </div>
          </section>
        ) : activeTab === 'logs' ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconMap.activity className="h-5 w-5 text-gray-400" />
                <h2 className="text-xl font-semibold text-black">System Activity Logs</h2>
              </div>
              <div className="flex gap-3">
                <select
                  value={logMode}
                  onChange={(e) => setLogMode(e.target.value as 'audit' | 'execution')}
                  className="bg-white border border-gray-200 text-gray-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-600 transition-colors cursor-pointer"
                >
                  <option value="audit">Admin Audit</option>
                  <option value="execution">Execution Traces</option>
                </select>

                {/* Time Range Selector */}
                {logMode === 'execution' && (
                  <select
                    value={minutesFilter}
                    onChange={(e) => setMinutesFilter(Number(e.target.value))}
                    className="bg-white border border-gray-200 text-gray-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-600 transition-colors cursor-pointer"
                  >
                    <option value={5}>Last 5 Minutes</option>
                    <option value={10}>Last 10 Minutes</option>
                    <option value={30}>Last 30 Minutes</option>
                    <option value={60}>Last 1 Hour</option>
                  </select>
                )}

                {/* Workflow Selector */}
                {logMode === 'execution' && (
                  <select
                    value={selectedWorkflowFilter}
                    onChange={(e) => setSelectedWorkflowFilter(e.target.value)}
                    className="bg-white border border-gray-200 text-gray-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-600 transition-colors cursor-pointer"
                  >
                    <option value="all">All Workflows</option>
                    {workflows?.map((wf: any) => (
                      <option key={wf.id} value={wf.id}>
                        {wf.name || wf.id}
                      </option>
                    ))}
                  </select>
                )}

                {/* Customer Selector for System Admins */}
                {userRole === 'system_admin' && (
                  <select
                    value={selectedCustomerFilter}
                    onChange={(e) => setSelectedCustomerFilter(e.target.value)}
                    className="bg-white border border-gray-200 text-gray-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-600 transition-colors cursor-pointer"
                  >
                    <option value="all">All Customers</option>
                    {customers?.map((cust: any) => (
                      <option key={cust.id} value={cust.id}>
                        {cust.name || cust.domain}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  onClick={fetchLogs}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>

            {logsLoading ? (
              <div className="p-12 text-center text-gray-500 text-sm">Loading activity logs...</div>
            ) : logs.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden p-8 text-center">
                <IconMap.activity className="mx-auto h-12 w-12 text-gray-200 mb-4" />
                <p className="text-gray-500 text-sm">
                  No {logMode === 'audit' ? 'admin audit' : 'execution'} logs found.
                </p>
              </div>
            ) : logMode === 'audit' ? (
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-gray-50 text-gray-400 uppercase text-xs border-b border-gray-150">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Action</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Resource</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Actor</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Customer ID</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Timestamp</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {logs.map((log: any, index: number) => (
                      <React.Fragment key={log.id || `audit-fallback-${index}`}>
                        <tr
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() =>
                            setExpandedLogId(
                              expandedLogId === String(log.id) ? null : String(log.id),
                            )
                          }
                        >
                          <td className="px-4 py-3 text-xs">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                log.status === 'denied'
                                  ? 'bg-red-50 text-red-600 border border-red-100'
                                  : 'bg-green-50 text-green-600 border border-green-100'
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-gray-900">{log.action}</td>
                          <td className="px-4 py-3  text-xs text-gray-600">
                            {log.resource_type}
                            {log.resource_id ? ` #${log.resource_id}` : ''}
                          </td>
                          <td className="px-4 py-3  text-xs text-gray-600">
                            {log.actor_role || 'system'} #{log.actor_user_id || '-'}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-600">
                            {log.customer_id || '-'}
                          </td>
                          <td className="px-4 py-3  text-xs text-gray-500">
                            {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}
                          </td>
                          <td className="px-4 py-3  text-xs  text-right">
                            {expandedLogId === String(log.id) ? (
                              <ChevronUp className="h-4 w-4 text-gray-400 inline" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400 inline" />
                            )}
                          </td>
                        </tr>
                        {expandedLogId === String(log.id) && (
                          <tr className="bg-gray-50/50">
                            <td colSpan={7} className="px-6 py-6 border-b border-gray-150">
                              <JsonTreeView data={log.details || {}} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-gray-50 text-gray-400 uppercase text-xs border-b border-gray-150">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Workflow ID / Name</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Trace ID</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Customer ID</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">User ID</th>
                      {/* <th className="px-4 py-3 font-semibold text-gray-600">User Email</th>*/}
                      <th className="px-4 py-3 font-semibold text-gray-600">Latency</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Timestamp</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {logs.map((log: any, index: number) => (
                      <React.Fragment key={log.trace_id || `trace-fallback-${index}`}>
                        <tr
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() =>
                            setExpandedLogId(expandedLogId === log.trace_id ? null : log.trace_id)
                          }
                        >
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                log.status === 'running'
                                  ? 'bg-blue-50 text-blue-600 border border-blue-100 animate-pulse'
                                  : log.status === 'stopped'
                                    ? 'bg-gray-100 text-gray-600 border border-gray-200'
                                    : log.status === 'failure' ||
                                        log.status === 'failed' ||
                                        log.violations?.length > 0
                                      ? 'bg-red-50 text-red-600 border border-red-100'
                                      : 'bg-green-50 text-green-600 border border-green-100'
                              }`}
                            >
                              {log.status === 'running'
                                ? 'Running'
                                : log.status === 'stopped'
                                  ? 'Stopped'
                                  : log.status === 'failure' ||
                                      log.status === 'failed' ||
                                      log.violations?.length > 0
                                    ? 'Failed'
                                    : 'Completed'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900">
                            {log.workflow_name || log.workflow_id}
                          </td>
                          <td className="px-4 py-3 font-mono text-gray-500">
                            {log.trace_id?.substring(0, 8)}...
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-600">
                            {log.customer_id || '-'}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-600">
                            {log.user_id || '-'}
                          </td>
                          {/* <td className="px-4 py-3 text-gray-600">{log.user_email || log.user_id || 'system'}</td> */}
                          <td className="px-4 py-3 text-gray-950 font-semibold">
                            {log.latency_ms}ms
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {new Date(log.timestamp * 1000).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-3 justify-end w-full">
                              {/* Visualizer Graph Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTraceForVisualizer(log);
                                }}
                                className="inline-flex items-center gap-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 text-xs font-semibold transition-colors"
                              >
                                Graph
                              </button>

                              {/* Stop Execution Button */}
                              {log.status === 'running' && (
                                <button
                                  onClick={(e) => handleStopTrace(e, log.trace_id)}
                                  className="inline-flex items-center gap-1 rounded bg-red-50 hover:bg-red-100 text-red-700 px-2 py-1 text-xs font-semibold transition-colors"
                                >
                                  Stop
                                </button>
                              )}

                              {/* Restart Execution Button */}
                              {log.status !== 'running' && (
                                <button
                                  onClick={(e) => handleRestartTrace(e, log.trace_id)}
                                  className="inline-flex items-center gap-1 rounded bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 text-xs font-semibold transition-colors"
                                >
                                  Restart
                                </button>
                              )}

                              {expandedLogId === log.trace_id ? (
                                <ChevronUp className="h-4 w-4 text-gray-400 inline" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-400 inline" />
                              )}
                            </div>
                          </td>
                        </tr>
                        {expandedLogId === log.trace_id && (
                          <tr className="bg-gray-50/50 w-full">
                            <td colSpan={9} className="px-6 py-6 border-b border-gray-150 max-w-0">
                              <div className="w-full overflow-hidden">
                                {log.violations?.length > 0 && (
                                  <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-lg text-xs flex flex-col gap-2">
                                    <span className="text-red-700 font-bold uppercase tracking-wider">
                                      Violations Detected
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {log.violations.map((v: string, idx: number) => (
                                        <span
                                          key={`${v}-${idx}`}
                                          className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded text-[10px] border border-red-100"
                                        >
                                          {v}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                  {/* Tab Header Bar */}
                                  <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Trace Payload
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 ml-0">
                                      {/* Segmented Control / Tabs */}
                                      <div className="inline-flex rounded-lg bg-gray-200 p-0.5 ml-0">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setTraceViewMode('tree');
                                          }}
                                          className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                                            traceViewMode === 'tree'
                                              ? 'bg-white text-gray-900 shadow-sm'
                                              : 'text-gray-600 hover:text-gray-900'
                                          }`}
                                        >
                                          JSON Tree
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setTraceViewMode('raw');
                                          }}
                                          className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                                            traceViewMode === 'raw'
                                              ? 'bg-white text-gray-900 shadow-sm'
                                              : 'text-gray-600 hover:text-gray-900'
                                          }`}
                                        >
                                          Raw JSON
                                        </button>
                                      </div>
                                      {/* Copy Button */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCopyLog(log);
                                        }}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                                      >
                                        {copiedLogId === log.trace_id ? (
                                          <>
                                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                                            <span className="text-emerald-500 font-semibold font-sans">
                                              Copied!
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="h-3.5 w-3.5 text-gray-400" />
                                            <span className="font-sans">Copy JSON</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>

                                  {/* Tab Content */}
                                  <div className="p-4 bg-gray-950 overflow-x-auto">
                                    {traceViewMode === 'tree' ? (
                                      <JsonTreeView data={log} />
                                    ) : (
                                      <pre className="p-4 bg-gray-950 text-gray-100 rounded-lg overflow-x-auto max-h-[500px] text-[10px] font-mono leading-relaxed select-text w-full min-w-0">
                                        {JSON.stringify(log, null, 2)}
                                      </pre>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : activeTab === 'metrics' ? (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-150 pb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600 animate-pulse" />
                <h2 className="text-xl font-semibold text-black font-sans">
                  Performance Metrics & Traces
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {/* Time Range Selector */}
                <select
                  value={metricsTimeRange}
                  onChange={(e) => setMetricsTimeRange(Number(e.target.value))}
                  className="bg-white border border-gray-200 text-gray-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-600 transition-colors cursor-pointer"
                >
                  <option value={5}>Last 5 Minutes</option>
                  <option value={10}>Last 10 Minutes</option>
                  <option value={30}>Last 30 Minutes</option>
                  <option value={60}>Last 1 Hour</option>
                </select>

                {/* Workflow Selector */}
                <select
                  value={metricsSelectedWorkflow}
                  onChange={(e) => setMetricsSelectedWorkflow(e.target.value)}
                  className="bg-white border border-gray-200 text-gray-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-600 transition-colors cursor-pointer"
                >
                  <option value="all">All Workflows</option>
                  {workflows?.map((wf: any) => (
                    <option key={wf.id} value={wf.id}>
                      {wf.name || wf.id}
                    </option>
                  ))}
                </select>

                {/* Customer Selector for System Admins */}
                {userRole === 'system_admin' && (
                  <select
                    value={metricsSelectedCustomer}
                    onChange={(e) => setMetricsSelectedCustomer(e.target.value)}
                    className="bg-white border border-gray-200 text-gray-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-600 transition-colors cursor-pointer"
                  >
                    <option value="all">All Customers</option>
                    {customers?.map((cust: any) => (
                      <option key={cust.id} value={cust.id}>
                        {cust.name || cust.domain}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  onClick={fetchMetrics}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>

            {metricsLoading && !metricsData ? (
              <div className="p-12 text-center text-gray-500 text-sm">Loading metrics data...</div>
            ) : metricsError ? (
              <div className="p-12 text-center text-red-500 text-sm">{metricsError}</div>
            ) : (
              <div className="space-y-6">
                {/* Metrics Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <MetricCard
                    title="Total Requests"
                    value={metricsData?.summary?.total_requests ?? 0}
                    icon={<Activity className="h-5 w-5 text-blue-500" />}
                  />
                  <MetricCard
                    title="Avg Latency"
                    value={`${metricsData?.summary?.avg_latency_ms ?? 0}ms`}
                    icon={<Clock className="h-5 w-5 text-amber-500" />}
                  />
                  <MetricCard
                    title="Error Rate"
                    value={`${metricsData?.summary?.error_rate ?? 0}%`}
                    icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
                  />
                </div>

                {/* Knowledge Base Metrics Cards Grid */}
                {kbMetrics && (
                  <div className="space-y-4 border-t pt-6 border-slate-200">
                    <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      Knowledge Ingestion Metrics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <MetricCard
                        title="Active Knowledge Bases"
                        value={kbMetrics.total_kbs}
                        icon={<BookOpen className="h-5 w-5 text-blue-500" />}
                      />
                      <MetricCard
                        title="Total Indexed Chunks"
                        value={kbMetrics.total_chunks}
                        icon={<Database className="h-5 w-5 text-cyan-500" />}
                      />
                      <MetricCard
                        title="Ingested Documents"
                        value={`${kbMetrics.documents_by_status?.completed ?? 0} active / ${kbMetrics.total_docs} total`}
                        icon={<FileText className="h-5 w-5 text-green-500" />}
                      />
                      <MetricCard
                        title="Failed Ingestions"
                        value={kbMetrics.documents_by_status?.failed ?? 0}
                        icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
                      />
                    </div>
                  </div>
                )}

                {/* Traces Table */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                    <IconMap.database className="h-5 w-5 text-blue-600" />
                    Recent Traces
                  </h3>
                  {!metricsData?.traces || metricsData.traces.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden p-8 text-center">
                      <IconMap.activity className="mx-auto h-12 w-12 text-gray-200 mb-4" />
                      <p className="text-gray-500 text-sm">
                        No traces found for the selected filters.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-gray-50 text-gray-400 uppercase text-xs border-b border-gray-150">
                          <tr>
                            <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                            <th className="px-4 py-3 font-semibold text-gray-600">
                              Workflow ID / Name
                            </th>
                            <th className="px-4 py-3 font-semibold text-gray-600">Trace ID</th>
                            <th className="px-4 py-3 font-semibold text-gray-600">Customer ID</th>
                            <th className="px-4 py-3 font-semibold text-gray-600">Latency</th>
                            <th className="px-4 py-3 font-semibold text-gray-600">Timestamp</th>
                            <th className="px-4 py-3"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-150">
                          {metricsData.traces.map((trace: any, index: number) => (
                            <React.Fragment
                              key={trace.trace_id || `metric-trace-fallback-${index}`}
                            >
                              <tr
                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() =>
                                  setMetricsExpandedTrace(
                                    metricsExpandedTrace === trace.trace_id ? null : trace.trace_id,
                                  )
                                }
                              >
                                <td className="px-4 py-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                      trace.status === 'running'
                                        ? 'bg-blue-50 text-blue-600 border border-blue-100 animate-pulse'
                                        : trace.status === 'stopped'
                                          ? 'bg-gray-100 text-gray-600 border border-gray-200'
                                          : trace.status === 'failure' ||
                                              trace.status === 'failed' ||
                                              trace.violations?.length > 0
                                            ? 'bg-red-50 text-red-600 border border-red-100'
                                            : 'bg-green-50 text-green-600 border border-green-100'
                                    }`}
                                  >
                                    {trace.status === 'running'
                                      ? 'Running'
                                      : trace.status === 'stopped'
                                        ? 'Stopped'
                                        : trace.status === 'failure' ||
                                            trace.status === 'failed' ||
                                            trace.violations?.length > 0
                                          ? 'Failed'
                                          : 'Completed'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-semibold text-gray-900">
                                  {trace.workflow_name || trace.workflow_id}
                                </td>
                                <td className="px-4 py-3 font-mono text-gray-500 text-xs">
                                  {trace.trace_id?.substring(0, 8)}...
                                </td>
                                <td className="px-4 py-3 font-mono text-xs text-gray-600">
                                  {trace.customer_id || '-'}
                                </td>
                                <td className="px-4 py-3 text-gray-950 font-semibold">
                                  {trace.latency_ms}ms
                                </td>
                                <td className="px-4 py-3 text-gray-500">
                                  {new Date(trace.timestamp * 1000).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="inline-flex items-center gap-3 justify-end w-full">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedTraceForVisualizer(trace);
                                      }}
                                      className="inline-flex items-center gap-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 text-xs font-semibold transition-colors"
                                    >
                                      Graph
                                    </button>
                                    {trace.status === 'running' && (
                                      <button
                                        onClick={(e) => handleStopTrace(e, trace.trace_id)}
                                        className="inline-flex items-center gap-1 rounded bg-red-50 hover:bg-red-100 text-red-700 px-2 py-1 text-xs font-semibold transition-colors"
                                      >
                                        Stop
                                      </button>
                                    )}
                                    {trace.status !== 'running' && (
                                      <button
                                        onClick={(e) => handleRestartTrace(e, trace.trace_id)}
                                        className="inline-flex items-center gap-1 rounded bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 text-xs font-semibold transition-colors"
                                      >
                                        Restart
                                      </button>
                                    )}
                                    {metricsExpandedTrace === trace.trace_id ? (
                                      <ChevronUp className="h-4 w-4 text-gray-400 inline" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-gray-400 inline" />
                                    )}
                                  </div>
                                </td>
                              </tr>
                              {metricsExpandedTrace === trace.trace_id && (
                                <tr className="bg-gray-50/50 w-full">
                                  <td
                                    colSpan={7}
                                    className="px-6 py-6 border-b border-gray-150 max-w-0"
                                  >
                                    <div className="w-full overflow-hidden">
                                      {trace.violations?.length > 0 && (
                                        <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-lg text-xs flex flex-col gap-2">
                                          <span className="text-red-700 font-bold uppercase tracking-wider">
                                            Violations Detected
                                          </span>
                                          <div className="flex flex-wrap gap-1.5">
                                            {trace.violations.map((v: string, idx: number) => (
                                              <span
                                                key={`${v}-${idx}`}
                                                className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded text-[10px] border border-red-100"
                                              >
                                                {v}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                              Trace Payload
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <div className="inline-flex rounded-lg bg-gray-200 p-0.5">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setTraceViewMode('tree');
                                                }}
                                                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                                                  traceViewMode === 'tree'
                                                    ? 'bg-white text-gray-900 shadow-sm'
                                                    : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                              >
                                                JSON Tree
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setTraceViewMode('raw');
                                                }}
                                                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                                                  traceViewMode === 'raw'
                                                    ? 'bg-white text-gray-900 shadow-sm'
                                                    : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                              >
                                                Raw JSON
                                              </button>
                                            </div>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleCopyLog(trace);
                                              }}
                                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                                            >
                                              {copiedLogId === trace.trace_id ? (
                                                <>
                                                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                                                  <span className="text-emerald-500 font-semibold font-sans">
                                                    Copied!
                                                  </span>
                                                </>
                                              ) : (
                                                <>
                                                  <Copy className="h-3.5 w-3.5 text-gray-400" />
                                                  <span className="font-sans">Copy JSON</span>
                                                </>
                                              )}
                                            </button>
                                          </div>
                                        </div>
                                        <div className="p-4 bg-gray-950 overflow-x-auto">
                                          {traceViewMode === 'tree' ? (
                                            <JsonTreeView data={trace} />
                                          ) : (
                                            <pre className="p-4 bg-gray-950 text-gray-100 rounded-lg overflow-x-auto max-h-[500px] text-[10px] font-mono leading-relaxed select-text w-full min-w-0">
                                              {JSON.stringify(trace, null, 2)}
                                            </pre>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        ) : (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconMap.network className="h-5 w-5 text-gray-400" />
                <h2 className="text-xl font-semibold text-black">OAuth Configuration</h2>
              </div>
              <button
                onClick={() =>
                  setEditingProvider({
                    name: '',
                    label: '',
                    auth_url: '',
                    token_url: '',
                    callback_url: '',
                    default_scopes: '',
                    icon: 'box',
                  })
                }
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition-all"
              >
                <IconMap.plus className="h-4 w-4" /> Add Provider
              </button>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {providers?.map((provider) => (
                <div
                  key={provider.id}
                  className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4 mb-4">
                    {/* <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      {IconMap[provider.icon] ? React.createElement(IconMap[provider.icon], { className: 'h-6 w-6' }) : <Box className="h-6 w-6" />}
                    </div> */}
                    <div>
                      <h3 className="font-bold text-black">{provider.label}</h3>
                      <p className="text-xs text-gray-400 font-mono">{provider.name}</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-6">
                    <div className="text-[10px] uppercase font-bold text-gray-400">
                      Default Scopes
                    </div>
                    <div className="text-xs text-gray-600 break-all bg-gray-50 p-2 rounded">
                      {provider.default_scopes}
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingProvider(provider)}
                    className="w-full py-2 text-sm font-semibold text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Configure
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Provider Modal */}
        {editingProvider && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
                <h3 className="text-xl font-bold text-black">
                  {editingProvider.id ? 'Edit Provider' : 'New Provider'}
                </h3>
                <button
                  onClick={() => setEditingProvider(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <IconMap.X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">
                    Provider Name (ID)
                  </label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black"
                    value={editingProvider.name}
                    onChange={(e) =>
                      setEditingProvider({ ...editingProvider, name: e.target.value })
                    }
                    placeholder="gmail"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">
                    Display Label
                  </label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black"
                    value={editingProvider.label}
                    onChange={(e) =>
                      setEditingProvider({ ...editingProvider, label: e.target.value })
                    }
                    placeholder="Google Gmail"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">
                    Authorization URL
                  </label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black"
                    value={editingProvider.auth_url}
                    onChange={(e) =>
                      setEditingProvider({ ...editingProvider, auth_url: e.target.value })
                    }
                    placeholder="https://accounts.google.com/o/oauth2/v2/auth"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Token URL</label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black"
                    value={editingProvider.token_url}
                    onChange={(e) =>
                      setEditingProvider({ ...editingProvider, token_url: e.target.value })
                    }
                    placeholder="https://oauth2.googleapis.com/token"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">
                    Callback URL
                  </label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black"
                    value={editingProvider.callback_url}
                    onChange={(e) =>
                      setEditingProvider({ ...editingProvider, callback_url: e.target.value })
                    }
                    placeholder="http://localhost:8000/api/auth/callback/gmail"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">
                    Default Scopes
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm h-20 text-black"
                    value={editingProvider.default_scopes}
                    onChange={(e) =>
                      setEditingProvider({ ...editingProvider, default_scopes: e.target.value })
                    }
                    placeholder="https://www.googleapis.com/auth/gmail.readonly"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Icon Name</label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black"
                    value={editingProvider.icon}
                    onChange={(e) =>
                      setEditingProvider({ ...editingProvider, icon: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="border-t bg-gray-50 px-4 py-3 flex justify-end gap-3">
                <button
                  onClick={() => setEditingProvider(null)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProvider}
                  className="bg-blue-600 px-6 py-2 text-sm font-bold text-white rounded-lg shadow-md hover:bg-blue-700 transition-all"
                >
                  {editingProvider.id ? 'Update Provider' : 'Create Provider'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Customer Modal */}
        {showAddCustomerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
              <h3 className="text-xl font-bold text-black mb-4">Add Customer Tenant</h3>
              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-blue-600 focus:outline-none"
                    placeholder="e.g. Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Domain Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomerDomain}
                    onChange={(e) => setNewCustomerDomain(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-blue-600 focus:outline-none"
                    placeholder="e.g. acme.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Color Schema (Hex)
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomerColor}
                    onChange={(e) => setNewCustomerColor(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-blue-600 focus:outline-none"
                    placeholder="e.g. #2563eb"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newCustomerEmail}
                      onChange={(e) => setNewCustomerEmail(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-blue-600 focus:outline-none"
                      placeholder="e.g. contact@acme.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      value={newCustomerContactPerson}
                      onChange={(e) => setNewCustomerContactPerson(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-blue-600 focus:outline-none"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Address
                  </label>
                  <textarea
                    rows={2}
                    value={newCustomerAddress}
                    onChange={(e) => setNewCustomerAddress(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-blue-600 focus:outline-none"
                    placeholder="e.g. 123 Business Way, Suite A"
                  />
                </div>
                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="newCustomerPluginsEnabled"
                    checked={newCustomerPluginsEnabled}
                    onChange={(e) => setNewCustomerPluginsEnabled(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="newCustomerPluginsEnabled" className="text-xs font-bold uppercase text-gray-500 cursor-pointer">
                    Enable Custom Plugins
                  </label>
                </div>
                {newCustomerPluginsEnabled && (
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                      Plugin Storage Path
                    </label>
                    <input
                      type="text"
                      required={newCustomerPluginsEnabled}
                      value={newCustomerStoragePath}
                      onChange={(e) => setNewCustomerStoragePath(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-blue-600 focus:outline-none"
                      placeholder="e.g. plugins/nodes/client/42 or s3://my-bucket/plugins"
                    />
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddCustomerModal(false)}
                    className="px-4 py-2 text-sm font-semibold text-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 px-6 py-2 text-sm font-bold text-white rounded-lg shadow-md hover:bg-blue-700 transition-all"
                  >
                    Create Customer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Customer User Modal */}
        {showAddCustomerUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
              <h3 className="text-xl font-bold text-black mb-4">Onboard Customer Admin User</h3>
              <form onSubmit={handleAddCustomerUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Admin Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customerUserName}
                    onChange={(e) => setCustomerUserName(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-blue-600 focus:outline-none"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    value={customerUserEmail}
                    onChange={(e) => setCustomerUserEmail(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-blue-600 focus:outline-none"
                    placeholder="e.g. admin@acme.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Temporary Password
                  </label>
                  <input
                    type="password"
                    required
                    value={customerUserPassword}
                    onChange={(e) => setCustomerUserPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-blue-600 focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddCustomerUserModal(false)}
                    className="px-4 py-2 text-sm font-semibold text-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 px-6 py-2 text-sm font-bold text-white rounded-lg shadow-md hover:bg-blue-700 transition-all"
                  >
                    Onboard Admin
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Company User Modal */}
        {showAddUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
              <h3 className="text-xl font-bold text-black mb-4">Add Company User</h3>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-blue-600 focus:outline-none"
                    placeholder="e.g. Jane Smith"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-blue-600 focus:outline-none"
                    placeholder="e.g. jane@acme.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-blue-600 focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Role
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'user')}
                    className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-blue-600 focus:outline-none"
                  >
                    <option value="user">User (can build workflows)</option>
                    <option value="admin">Admin (can manage users + config nodes)</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="px-4 py-2 text-sm font-semibold text-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 px-6 py-2 text-sm font-bold text-white rounded-lg shadow-md hover:bg-blue-700 transition-all"
                  >
                    Add User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Manage Customer Nodes Modal */}
        {showNodesModal && selectedCustomerForNodes && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="flex h-[85vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
                <div>
                  <h3 className="text-lg font-bold text-black">
                    Manage Customer Nodes: {selectedCustomerForNodes.name}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Assign which nodes are active for this customer, and configure specific defaults
                    or credentials.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNodesModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <IconMap.x className="h-6 w-6" />
                </button>
              </div>

              {/* Main Content Pane */}
              <div className="flex-1 flex overflow-hidden">
                {configuringNode ? (
                  /* Designing/Configuring Single Node Sub-view */
                  <div className="flex-1 flex flex-col h-full bg-white">
                    <div className="border-b px-4 py-3 bg-gray-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                        <button
                          type="button"
                          onClick={() => setConfiguringNode(null)}
                          className="hover:text-blue-600 transition-colors"
                        >
                          Node Library
                        </button>
                        <span>&gt;</span>
                        <span className="text-black">
                          {configuringNode.label || configuringNode.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfiguringNode(null)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Back to Library
                      </button>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                      {/* Left: Input Fields */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div>
                          <h4 className="text-md font-bold text-black flex items-center gap-2">
                            {configuringNode.label || configuringNode.name} Overrides
                          </h4>
                          <p className="text-xs text-gray-500">
                            Provide credentials or server URLs that workflows for this tenant will
                            use.
                          </p>
                        </div>

                        {(() => {
                          const userProps = propertyEntriesFromValue(
                            configuringNode.user_properties,
                          );
                          const sysProps = propertyEntriesFromValue(
                            configuringNode.system_properties,
                          );
                          const allProps = [
                            ...sysProps.map((p) => ({ ...p, category: 'system' })),
                            ...userProps.map((p) => ({ ...p, category: 'user' })),
                          ];

                          if (allProps.length === 0) {
                            return (
                              <div className="py-8 text-center text-sm text-gray-500">
                                This node type has no custom properties to configure.
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-5">
                              {allProps.map((prop) => {
                                const val =
                                  customerNodeProperties[configuringNode.name]?.[prop.key] ??
                                  prop.value ??
                                  prop.default ??
                                  '';
                                return (
                                  <div key={`${prop.category}-${prop.key}`} className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                                        {prop.label || prop.key}
                                        <span className="text-[10px] text-gray-400 normal-case ml-2">
                                          ({prop.category} property)
                                        </span>
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCustomerNodeProperties((prev) => {
                                            const updated = {
                                              ...(prev[configuringNode.name] || {}),
                                            };
                                            delete updated[prop.key];
                                            return {
                                              ...prev,
                                              [configuringNode.name]: updated,
                                            };
                                          });
                                        }}
                                        className="text-[10px] font-semibold text-red-500 hover:underline"
                                      >
                                        Reset to Global Default
                                      </button>
                                    </div>
                                    {renderCustomerPropertyInput(prop, val, configuringNode.name)}
                                    {prop.description && (
                                      <p className="text-[11px] text-gray-500">
                                        {prop.description}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Right: Preview & Guide */}
                      <div className="w-80 border-l bg-gray-50 p-6 overflow-y-auto space-y-4">
                        <h4 className="text-xs font-bold text-gray-700 uppercase">
                          Configuration Summary
                        </h4>
                        <div className="bg-gray-900 rounded-lg p-4 font-mono text-[10px] text-green-400 overflow-x-auto shadow-inner">
                          <div className="text-gray-400 mb-1">// Active Override JSON</div>
                          {JSON.stringify(
                            customerNodeProperties[configuringNode.name] || {},
                            null,
                            2,
                          )}
                        </div>
                        <div className="text-xs text-gray-500 leading-relaxed bg-blue-50 border border-blue-100 rounded-lg p-3">
                          <strong className="text-blue-700">How this works:</strong>
                          <p className="mt-1">
                            Values specified here will override global node defaults only for
                            workflows running under this tenant account. Sensitive credentials are
                            encrypted at rest.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Node Assignment Grid (Multiple select, search, toggle) */
                  <div className="flex-1 flex flex-col h-full bg-white">
                    {/* Toolbar */}
                    <div className="border-b px-4 py-3 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
                      {/* Search and View Mode Switcher */}
                      <div className="flex items-center gap-3">
                        <div className="relative w-72">
                          <IconMap.search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search nodes by label or name..."
                            value={nodeSearchQuery}
                            onChange={(e) => setNodeSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 pl-9 pr-4 py-1.5 text-sm text-black focus:border-blue-600 focus:outline-none bg-white"
                          />
                        </div>

                        {/* View switcher */}
                        <div className="flex items-center border border-gray-200 rounded-lg p-0.5 bg-white shadow-sm">
                          <button
                            type="button"
                            onClick={() => setNodeViewMode('grid')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                              nodeViewMode === 'grid'
                                ? 'bg-blue-50 text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-800'
                            }`}
                          >
                            Grid
                          </button>
                          <button
                            type="button"
                            onClick={() => setNodeViewMode('list')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                              nodeViewMode === 'list'
                                ? 'bg-blue-50 text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-800'
                            }`}
                          >
                            List
                          </button>
                        </div>
                      </div>

                      {/* Bulk actions */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const nextBulk = { ...selectedNodesForBulk };
                            agents.forEach((agent: any) => {
                              const query = nodeSearchQuery.toLowerCase();
                              const matches =
                                agent.label?.toLowerCase().includes(query) ||
                                agent.name?.toLowerCase().includes(query) ||
                                agent.category?.toLowerCase().includes(query);
                              if (matches) {
                                nextBulk[agent.name] = true;
                              }
                            });
                            setSelectedNodesForBulk(nextBulk);
                          }}
                          className="px-2.5 py-1.5 text-xs font-semibold text-gray-600 bg-white border rounded hover:bg-gray-50 transition-colors"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={handleDeselectAllForBulk}
                          className="px-2.5 py-1.5 text-xs font-semibold text-gray-600 bg-white border rounded hover:bg-gray-50 transition-colors"
                        >
                          Deselect All
                        </button>
                        <span className="h-4 border-l border-gray-300 mx-1"></span>
                        <button
                          type="button"
                          onClick={() => handleBulkToggle(true)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors"
                          disabled={
                            Object.values(selectedNodesForBulk).filter(Boolean).length === 0
                          }
                        >
                          Enable Selected (
                          {Object.values(selectedNodesForBulk).filter(Boolean).length})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBulkToggle(false)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
                          disabled={
                            Object.values(selectedNodesForBulk).filter(Boolean).length === 0
                          }
                        >
                          Disable Selected (
                          {Object.values(selectedNodesForBulk).filter(Boolean).length})
                        </button>
                        <span className="h-4 border-l border-gray-300 mx-1"></span>
                        <button
                          type="button"
                          onClick={handleBulkEnableAll}
                          className="px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 transition-colors"
                        >
                          Enable All
                        </button>
                        <button
                          type="button"
                          onClick={handleBulkDisableAll}
                          className="px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors"
                        >
                          Disable All
                        </button>
                      </div>
                    </div>

                    {/* Nodes Catalog Cards Grid / List */}
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                      {(() => {
                        const filteredAgents = agents.filter((agent: any) => {
                          const query = nodeSearchQuery.toLowerCase();
                          return (
                            agent.label?.toLowerCase().includes(query) ||
                            agent.name?.toLowerCase().includes(query) ||
                            agent.category?.toLowerCase().includes(query)
                          );
                        });

                        if (filteredAgents.length === 0) {
                          return (
                            <div className="py-12 text-center text-gray-500 text-sm bg-white rounded-xl border border-dashed border-gray-200">
                              No nodes found matching "{nodeSearchQuery}".
                            </div>
                          );
                        }

                        if (nodeViewMode === 'list') {
                          return (
                            <div className="space-y-2">
                              {filteredAgents.map((agent: any) => {
                                const isEnabled = !!customerNodeAssignments[agent.name];
                                const isChecked = !!selectedNodesForBulk[agent.name];
                                const categoryText = String(agent.category || 'general');
                                const NodeIcon =
                                  IconMap[String(agent.icon || '').toLowerCase()] || IconMap.bot;

                                return (
                                  <div
                                    key={agent.name}
                                    className={`flex flex-wrap md:flex-nowrap items-center justify-between gap-4 rounded-xl border bg-white px-4 py-3 shadow-sm transition-all hover:shadow-md ${
                                      isEnabled
                                        ? 'border-blue-100 ring-1 ring-blue-50'
                                        : 'border-gray-200'
                                    }`}
                                  >
                                    {/* Left: Checkbox + Icon + Details */}
                                    <div className="flex items-center gap-4 flex-1 min-w-[280px]">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => {
                                          setSelectedNodesForBulk((prev) => ({
                                            ...prev,
                                            [agent.name]: e.target.checked,
                                          }));
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                      />
                                      <div
                                        className={`p-2 rounded-lg flex-shrink-0 ${isEnabled ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}
                                      >
                                        <NodeIcon className="h-5 w-5" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <h4 className="text-sm font-bold text-black truncate max-w-[200px]">
                                            {agent.label || agent.name}
                                          </h4>
                                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-gray-100 text-gray-600 border border-gray-200">
                                            {categoryText}
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-mono truncate">
                                          {agent.name}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                          {agent.description || 'No description provided.'}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Right: Switch toggle + Configure Button */}
                                    <div className="flex items-center gap-6">
                                      <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={isEnabled}
                                          onChange={() => handleToggleSingleAssignment(agent.name)}
                                          className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        <span className="ml-2 text-xs font-semibold text-gray-600 min-w-[50px]">
                                          {isEnabled ? 'Enabled' : 'Disabled'}
                                        </span>
                                      </label>

                                      <button
                                        type="button"
                                        onClick={() => setConfiguringNode(agent)}
                                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50/50 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100"
                                      >
                                        <IconMap.settings className="h-3.5 w-3.5" />
                                        Configure
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredAgents.map((agent: any) => {
                              const isEnabled = !!customerNodeAssignments[agent.name];
                              const isChecked = !!selectedNodesForBulk[agent.name];
                              const categoryText = String(agent.category || 'general');
                              const NodeIcon =
                                IconMap[String(agent.icon || '').toLowerCase()] || IconMap.bot;

                              return (
                                <div
                                  key={agent.name}
                                  className={`rounded-xl border bg-white p-4 space-y-4 shadow-sm transition-all hover:shadow-md ${
                                    isEnabled
                                      ? 'border-blue-100 ring-2 ring-blue-50/50'
                                      : 'border-gray-200'
                                  }`}
                                >
                                  {/* Upper layout: Checkbox + Icon + Badge */}
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => {
                                          setSelectedNodesForBulk((prev) => ({
                                            ...prev,
                                            [agent.name]: e.target.checked,
                                          }));
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                      />
                                      <div
                                        className={`p-2 rounded-lg ${isEnabled ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}
                                      >
                                        <NodeIcon className="h-5 w-5" />
                                      </div>
                                    </div>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-600 border border-gray-200">
                                      {categoryText}
                                    </span>
                                  </div>

                                  {/* Labels */}
                                  <div>
                                    <h4 className="text-sm font-bold text-black truncate">
                                      {agent.label || agent.name}
                                    </h4>
                                    <p className="text-[11px] text-gray-400 font-mono truncate">
                                      {agent.name}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 min-h-[32px]">
                                      {agent.description || 'No description provided.'}
                                    </p>
                                  </div>

                                  {/* Bottom toggles & configuration link */}
                                  <div className="border-t pt-3 flex items-center justify-between">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={isEnabled}
                                        onChange={() => handleToggleSingleAssignment(agent.name)}
                                        className="sr-only peer"
                                      />
                                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                      <span className="ml-2 text-xs font-semibold text-gray-600">
                                        {isEnabled ? 'Enabled' : 'Disabled'}
                                      </span>
                                    </label>

                                    <button
                                      type="button"
                                      onClick={() => setConfiguringNode(agent)}
                                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                      <IconMap.settings className="h-3.5 w-3.5" />
                                      Configure
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="border-t bg-gray-50 px-4 py-3 flex items-center justify-between">
                <div className="text-xs text-gray-500 font-semibold">
                  {Object.values(customerNodeAssignments).filter(Boolean).length} of {agents.length}{' '}
                  nodes assigned
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNodesModal(false)}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCustomerNodes}
                    disabled={savingNodes}
                    className="bg-blue-600 px-6 py-2 text-sm font-bold text-white rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {savingNodes ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingAgent && (
          <div className="fixed max-w-full inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="flex h-[90vh] w-full flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
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

                <div className="flex items-center gap-6 ml-auto mr-4">
                  {/* Version Control */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                      Version
                    </label>
                    <input
                      type="text"
                      className="w-24 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                      value={editingAgent.version || '1.0.0'}
                      onChange={(e) =>
                        setEditingAgent({ ...editingAgent, version: e.target.value })
                      }
                      placeholder="1.0.0"
                      disabled={!!customerId || userRole !== 'system_admin'}
                    />
                  </div>

                  {/* Enable/Disable Toggle */}
                  {customerId && (
                    <div className="flex items-center gap-3 border-l border-gray-200 pl-6">
                      <div className="text-right">
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-tight flex items-center justify-end gap-1.5">
                          {editingAgent.is_enabled === false && (
                            <IconMap.lock className="h-3.5 w-3.5 text-red-500" />
                          )}
                          Status
                        </span>
                        <p className="text-[10px] text-gray-400">
                          {editingAgent.is_enabled === false ? 'Disabled' : 'Enabled'}
                        </p>
                      </div>
                      <label
                        className={`relative inline-flex items-center ${
                          editingAgent.is_enabled === false
                            ? 'cursor-not-allowed pointer-events-none'
                            : 'cursor-pointer'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={editingAgent.is_enabled !== false}
                          onChange={(e) => {
                            if (editingAgent.is_enabled === false) return;
                            setEditingAgent({ ...editingAgent, is_enabled: e.target.checked });
                          }}
                          disabled={editingAgent.is_enabled === false}
                          className="sr-only peer"
                        />
                        <div
                          className={`w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                            editingAgent.is_enabled === false
                              ? 'bg-gray-300 opacity-60'
                              : 'peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:bg-blue-600'
                          }`}
                        ></div>
                      </label>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setEditingAgent(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <IconMap.x className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10">
                {/* Section: Metadata */}
                <div className="grid grid-cols-2 gap-6">
                  {/* {editingAgent.id && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                        Database ID (Read-only)
                      </label>
                      <input
                        className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-400 bg-gray-50 font-mono cursor-not-allowed"
                        value={editingAgent.id}
                        readOnly
                        disabled
                      />
                    </div>
                  )} */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                      Display Label
                    </label>
                    <input
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={editingAgent.label || ''}
                      onChange={(e) => setEditingAgent({ ...editingAgent, label: e.target.value })}
                      placeholder="e.g. My Custom Agent"
                    />
                  </div>
                  {/* <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                      System Name (Unique ID)
                    </label>
                    <input
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={editingAgent.name || ''}
                      onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                      placeholder="e.g. custom_llm_agent"
                      disabled={!!editingAgent.id || userRole !== 'system_admin'}
                    />
                  </div> */}

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                      Node Category
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={editingAgent.category || ''}
                      onChange={(e) =>
                        setEditingAgent({ ...editingAgent, category: e.target.value })
                      }
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
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                      Sub Label
                    </label>
                    <input
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={editingAgent.sub_label || ''}
                      onChange={(e) =>
                        setEditingAgent({ ...editingAgent, sub_label: e.target.value })
                      }
                      disabled={userRole !== 'system_admin'}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                      Node Type (e.g. trigger, tool)
                    </label>
                    <input
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={editingAgent.group || ''}
                      onChange={(e) => setEditingAgent({ ...editingAgent, group: e.target.value })}
                      disabled={userRole !== 'system_admin'}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                      Badge
                    </label>
                    <input
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={editingAgent.badge || ''}
                      onChange={(e) => setEditingAgent({ ...editingAgent, badge: e.target.value })}
                      disabled={userRole !== 'system_admin'}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                      Icon Name (Lucide)
                    </label>
                    <input
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={editingAgent.icon || ''}
                      onChange={(e) => setEditingAgent({ ...editingAgent, icon: e.target.value })}
                      disabled={userRole !== 'system_admin'}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                      Theme Color (Hex)
                    </label>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={editingAgent.color || ''}
                        onChange={(e) =>
                          setEditingAgent({ ...editingAgent, color: e.target.value })
                        }
                        disabled={userRole !== 'system_admin'}
                      />
                      <div
                        className="w-10 h-10 rounded-lg border border-gray-200 shadow-sm"
                        style={{ backgroundColor: editingAgent.color || '#3b82f6' }}
                      />
                    </div>
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

                {/* Unified Property Registry */}
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
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 uppercase bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100"
                      >
                        <IconMap.Plus className="h-4 w-4" /> Add Property
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
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${row.category === 'user' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
                                >
                                  {row.category}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-mono text-xs text-black">{row.key}</td>
                              <td className="px-4 py-3 text-gray-600">
                                <div className="font-semibold text-sm">{row.label}</div>
                                {row.description && (
                                  <div className="text-m text-gray-400 italic mt-0.5  break-words">
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
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                  >
                                    <IconMap.Trash2 className="h-4 w-4" />
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

                {/* Contract Section */}
                <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                  <div className="col-span-2 space-y-3">
                    {(() => {
                      const inputContract = contractFromValue(editingAgent.input_contract);
                      const previewContract = cleanInputContract(inputContract);

                      const showStringItemsColumn = inputContract.rules.some(
                        (rule) =>
                          [
                            'string',
                            'email',
                            'password',
                            'phone',
                            'credit_card',
                            'url',
                            'uuid',
                            'date',
                            'datetime',
                            'ip_address',
                          ].includes(rule.field_type) || rule.field_type === 'array',
                      );
                      const showNumberColumn = inputContract.rules.some((rule) =>
                        ['number', 'integer'].includes(rule.field_type),
                      );
                      const showAllowedValuesColumn = inputContract.rules.some(
                        (rule) => rule.field_type === 'array' || rule.field_type === 'enum',
                      );
                      const visibleContractColumnCount =
                        5 +
                        (showStringItemsColumn ? 1 : 0) +
                        (showNumberColumn ? 1 : 0) +
                        (showAllowedValuesColumn ? 1 : 0);

                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-bold text-black">Input Contract</h4>
                              <p className="text-xs text-gray-500">
                                Define the JSON body a node must receive before execution.
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  setContractGenerator({ isOpen: true, type: 'input' })
                                }
                                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
                              >
                                <IconMap.code2 className="h-4 w-4" /> Generate from JSON
                              </button>
                              {/* <label className="inline-flex items-center gap-4 text-xs font-semibold text-gray-600">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  checked={inputContract.additional_fields ?? true}
                                  onChange={(e) =>
                                    updateInputContract((contract) => ({
                                      ...contract,
                                      additional_fields: e.target.checked,
                                    }))
                                  }
                                />
                                Additional fields
                              </label> */}
                              {/* <button
                                onClick={addInputContractRule}
                                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 uppercase bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100"
                              >
                                <IconMap.Plus className="h-4 w-4" /> Add Rule
                              </button> */}
                            </div>
                          </div>

                          {/* <div className="overflow-x-auto rounded-xl border border-gray-200">
                            <table className="min-w-[1080px] w-full text-left text-sm">
                              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-[10px] font-bold">
                                <tr>
                                  <th className="px-3 py-3 w-[210px]">Field Name/ Path</th>
                                  <th className="px-3 py-3 w-[150px]">Type</th>
                                  <th className="px-3 py-3 w-[90px]">Required</th>
                                  {showStringItemsColumn && (
                                    <th className="px-3 py-3 w-[170px]">String / Items</th>
                                  )}
                                  {showNumberColumn && (
                                    <th className="px-3 py-3 w-[170px]">Number</th>
                                  )}
                                  {showAllowedValuesColumn && (
                                    <th className="px-3 py-3">Allowed Values</th>
                                  )}
                                  <th className="px-3 py-3 w-[170px]">Options</th>
                                  <th className="px-3 py-3 w-[44px]"></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 bg-white">
                                {inputContract.rules.length === 0 && (
                                  <tr>
                                    <td
                                      colSpan={visibleContractColumnCount}
                                      className="px-4 py-8 text-center text-sm text-gray-500"
                                    >
                                      No input rules configured.
                                    </td>
                                  </tr>
                                )}
                                {inputContract.rules.map((rule, index) => {
                                  const isStringLike = [
                                    'string',
                                    'email',
                                    'password',
                                    'phone',
                                    'credit_card',
                                    'url',
                                    'uuid',
                                    'date',
                                    'datetime',
                                    'ip_address',
                                  ].includes(rule.field_type);
                                  const isNumeric = ['number', 'integer'].includes(rule.field_type);
                                  const isArrayLike = rule.field_type === 'array';
                                  const isEnumLike = rule.field_type === 'enum';

                                  const showStringItems = isStringLike || isArrayLike;
                                  const showNumber = isNumeric;
                                  const showAllowedValues = isArrayLike || isEnumLike;

                                  return (
                                    <tr key={`input-contract-rule-${index}`}>
                                      <td className="px-3 py-3 align-top">
                                        <input
                                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                          value={rule.field_name}
                                          onChange={(e) =>
                                            updateInputContractRule(index, {
                                              field_name: e.target.value.replaceAll(' ', '_'),
                                            })
                                          }
                                          placeholder="data.user_id"
                                        />
                                        <input
                                          className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-black focus:ring-2 focus:ring-blue-500 outline-none"
                                          value={rule.description || ''}
                                          onChange={(e) =>
                                            updateInputContractRule(index, {
                                              description: e.target.value,
                                            })
                                          }
                                          placeholder="Description"
                                        />
                                      </td>
                                      <td className="px-3 py-3 align-top">
                                        <select
                                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                          value={rule.field_type}
                                          onChange={(e) => {
                                            const newType = e.target.value;
                                            updateInputContractRule(index, {
                                              field_type: newType,
                                              format: '',
                                              redact: IS_PII.includes(newType)
                                                ? true
                                                : (rule.redact ?? false),
                                            });
                                            setSelectedCategoryType(newType);
                                          }}
                                        >
                                          {CONTRACT_FIELD_TYPES.map((fieldType) => (
                                            <option key={fieldType} value={fieldType}>
                                              {fieldType}
                                            </option>
                                          ))}
                                        </select>
                                      </td>
                                      <td className="px-3 py-3 align-top">
                                        <input
                                          type="checkbox"
                                          className="mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                          checked={boolFromValue(rule.required)}
                                          onChange={(e) =>
                                            updateInputContractRule(index, {
                                              required: e.target.checked,
                                            })
                                          }
                                        />
                                      </td>
                                      {showStringItemsColumn && (
                                        <td className="px-3 py-3 align-top">
                                          {showStringItems ? (
                                            <div className="grid grid-cols-2 gap-2">
                                              <input
                                                type="number"
                                                className="w-full rounded-lg border border-gray-200 px-2 py-2 text-xs text-black focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={
                                                  isArrayLike
                                                    ? (rule.min_items ?? '')
                                                    : (rule.min_length ?? '')
                                                }
                                                onChange={(e) =>
                                                  updateInputContractRule(index, {
                                                    ...(isArrayLike
                                                      ? { min_items: numberOrEmpty(e.target.value) }
                                                      : {
                                                          min_length: numberOrEmpty(e.target.value),
                                                        }),
                                                  })
                                                }
                                                placeholder={isArrayLike ? 'Min items' : 'Min len'}
                                              />
                                              <input
                                                type="number"
                                                className="w-full rounded-lg border border-gray-200 px-2 py-2 text-xs text-black focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={
                                                  isArrayLike
                                                    ? (rule.max_items ?? '')
                                                    : (rule.max_length ?? '')
                                                }
                                                onChange={(e) =>
                                                  updateInputContractRule(index, {
                                                    ...(isArrayLike
                                                      ? { max_items: numberOrEmpty(e.target.value) }
                                                      : {
                                                          max_length: numberOrEmpty(e.target.value),
                                                        }),
                                                  })
                                                }
                                                placeholder={isArrayLike ? 'Max items' : 'Max len'}
                                              />
                                            </div>
                                          ) : (
                                            <span className="text-xs text-gray-400">-</span>
                                          )}
                                        </td>
                                      )}
                                      {showNumberColumn && (
                                        <td className="px-3 py-3 align-top">
                                          {showNumber ? (
                                            <div className="space-y-2">
                                              <div className="grid grid-cols-2 gap-2">
                                                <input
                                                  type="number"
                                                  className="w-full rounded-lg border border-gray-200 px-2 py-2 text-xs text-black focus:ring-2 focus:ring-blue-500 outline-none"
                                                  value={rule.minimum ?? ''}
                                                  onChange={(e) =>
                                                    updateInputContractRule(index, {
                                                      minimum: numberOrEmpty(e.target.value),
                                                    })
                                                  }
                                                  placeholder="Min"
                                                />
                                                <input
                                                  type="number"
                                                  className="w-full rounded-lg border border-gray-200 px-2 py-2 text-xs text-black focus:ring-2 focus:ring-blue-500 outline-none"
                                                  value={rule.maximum ?? ''}
                                                  onChange={(e) =>
                                                    updateInputContractRule(index, {
                                                      maximum: numberOrEmpty(e.target.value),
                                                    })
                                                  }
                                                  placeholder="Max"
                                                />
                                              </div>
                                              <label className="inline-flex items-center gap-2 text-[11px] text-gray-600">
                                                <input
                                                  type="checkbox"
                                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                  checked={rule.allow_negative ?? true}
                                                  onChange={(e) =>
                                                    updateInputContractRule(index, {
                                                      allow_negative: e.target.checked,
                                                    })
                                                  }
                                                />
                                                Allow negative
                                              </label>
                                            </div>
                                          ) : (
                                            <span className="text-xs text-gray-400">-</span>
                                          )}
                                        </td>
                                      )}
                                      {showAllowedValuesColumn && (
                                        <td className="px-3 py-3 align-top">
                                          {showAllowedValues ? (
                                            <input
                                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-black focus:ring-2 focus:ring-blue-500 outline-none"
                                              value={(rule.allowed_values || []).join(', ')}
                                              onChange={(e) =>
                                                updateInputContractRule(index, {
                                                  allowed_values: e.target.value
                                                    .split(',')
                                                    .map((item) => item.trim())
                                                    .filter(Boolean),
                                                })
                                              }
                                              placeholder="active, inactive"
                                            />
                                          ) : (
                                            <span className="text-xs text-gray-400">-</span>
                                          )}
                                        </td>
                                      )}
                                      <td className="px-3 py-3 align-top">
                                        {['object', 'json'].includes(rule.field_type) ? (
                                          <span className="text-xs text-gray-400">-</span>
                                        ) : (
                                          <div className="space-y-2">
                                            <label className="inline-flex items-center gap-2 text-[11px] text-gray-600 mr-7">
                                              <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                checked={rule.nullable ?? false}
                                                onChange={(e) =>
                                                  updateInputContractRule(index, {
                                                    nullable: e.target.checked,
                                                  })
                                                }
                                              />
                                              Nullable
                                            </label>
                                            <label className="inline-flex items-center gap-2 text-[11px] text-gray-600">
                                              <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                checked={
                                                  rule.redact !== undefined
                                                    ? rule.redact
                                                    : IS_PII.includes(rule.field_type)
                                                }
                                                onChange={(e) =>
                                                  updateInputContractRule(index, {
                                                    redact: e.target.checked,
                                                  })
                                                }
                                              />
                                              Redact
                                            </label>
                                          </div>
                                        )}
                                      </td>
                                      <td className="px-3 py-3 align-top">
                                        <button
                                          onClick={() => removeInputContractRule(index)}
                                          className="mt-2 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                          <IconMap.Trash2 className="h-4 w-4" />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div> */}

                          <div className="flex gap-3 items-start">
                            <details className="flex-1 rounded-xl border border-gray-200 bg-gray-50">
                              <summary className="cursor-pointer px-4 py-3 text-xs font-bold uppercase text-gray-500">
                                JSON Preview
                              </summary>
                              <pre className="max-h-64 overflow-auto border-t border-gray-200 p-4 text-xs text-gray-700">
                                {JSON.stringify(previewContract, null, 2)}
                              </pre>
                            </details>
                            {editingAgent.id && (
                              <button
                                onClick={handleSaveInputContract}
                                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 shadow-md transition-all whitespace-nowrap h-fit mt-1"
                              >
                                <IconMap.Save className="h-4 w-4" /> Save Input Contract
                              </button>
                            )}
                          </div>
                        </>
                      );
                    })()}
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
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
                      >
                        <IconMap.code2 className="h-4 w-4" /> Generate from JSON
                      </button>
                    </div>
                    <div className="flex gap-3 items-start">
                      <details className="flex-1 rounded-xl border border-gray-200 bg-gray-50">
                        <summary className="cursor-pointer px-4 py-3 text-xs font-bold uppercase text-gray-500">
                          JSON Preview
                        </summary>
                        <pre className="max-h-64 overflow-auto border-t border-gray-200 p-4 text-xs text-gray-700">
                          {JSON.stringify(editingAgent.output_contract, null, 2)}
                        </pre>
                      </details>
                      {editingAgent.id && (
                        <button
                          onClick={handleSaveInputContract}
                          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 shadow-md transition-all whitespace-nowrap h-fit mt-1"
                        >
                          <IconMap.Save className="h-4 w-4" /> Save Output Contract
                        </button>
                      )}
                    </div>
                    {/* <textarea
                      className="w-full text-xs rounded-lg border border-gray-200 px-4 py-2 h-32 text-sm font-mono text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={
                        typeof editingAgent.output_contract === 'string'
                          ? editingAgent.output_contract
                          : JSON.stringify(editingAgent.output_contract || {}, null, 2)
                      }
                      onChange={(e) =>
                        setEditingAgent({ ...editingAgent, output_contract: e.target.value })
                      }
                    /> */}
                  </div>
                </div>
              </div>

              <div className="border-t bg-gray-50 px-8 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setEditingAgent(null)}
                  className="rounded-lg px-6 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={customerId ? handleSaveCustomerConfig : handleSaveNode}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-2 text-sm font-bold text-white hover:bg-blue-700 shadow-md transition-all"
                >
                  <IconMap.Save className="h-4 w-4" />{' '}
                  {customerId
                    ? 'Save Configuration'
                    : editingAgent.id
                      ? 'Update Registry'
                      : 'Create Node Type'}
                </button>
              </div>
            </div>
          </div>
        )}

        {editingAgent && (
          <JsonSchemaGeneratorModal
            isOpen={contractGenerator.isOpen}
            onClose={() => setContractGenerator((prev) => ({ ...prev, isOpen: false }))}
            initialSchema={
              contractGenerator.type === 'input'
                ? editingAgent.input_contract
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
                  <IconMap.settings className="h-5 w-5 text-blue-600" />
                  {isEditingProp ? 'Edit Property' : 'Add Property'}
                </h3>
                <button
                  onClick={() => setPropModal({ ...propModal, isOpen: false })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <IconMap.x className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setPropModal({ ...propModal, target: 'user' })}
                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${propModal.target === 'user' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                  >
                    User Property
                  </button>
                  <button
                    onClick={() => setPropModal({ ...propModal, target: 'system' })}
                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${propModal.target === 'system' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                  >
                    System Property
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-gray-500 sentencecase">
                    Property Key (ID)
                  </label>
                  <br />
                  <label className="text-[12px] font-bold text-gray-500 sentencecase">
                    Can not contain special character or spaces
                  </label>

                  <input
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-500 outline-none font-mono"
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
                    <label className="text-[10px] font-bold text-gray-500 uppercase">
                      UI Label
                    </label>
                    <input
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-500 outline-none"
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
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-500 outline-none"
                      value={propModal.type}
                      onChange={(e) => setPropModal({ ...propModal, type: e.target.value })}
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="password">Password</option>
                      <option value="textarea">Textarea</option>
                      <option value="choice">Choice</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">
                      Value (In Catalog)
                    </label>
                    <input
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-500 outline-none"
                      value={propModal.value}
                      onChange={(e) => setPropModal({ ...propModal, value: e.target.value })}
                      placeholder="Registry value"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">
                    Description / Guide
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-m text-black focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePropFromModal}
                  className="bg-blue-600 px-6 py-2 text-sm font-bold text-white rounded-lg shadow-md hover:bg-blue-700 transition-all"
                >
                  Save Property
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Category Modal */}
        {isCategoryModalOpen && editingCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
                <h3 className="text-xl font-bold text-black">
                  {editingCategory.id ? 'Edit Category' : 'Add New Category'}
                </h3>
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <IconMap.X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    System Name (ID)
                  </label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black"
                    value={editingCategory.name || ''}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, name: e.target.value })
                    }
                    placeholder="e.g. social_media"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Group</label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black"
                    value={editingCategory.group || ''}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, group: e.target.value })
                    }
                    placeholder="e.g. core_integrations"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Display Label</label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black"
                    value={editingCategory.label || ''}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, label: e.target.value })
                    }
                    placeholder="e.g. Social Media"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                  <textarea
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 h-20"
                    value={editingCategory.description || ''}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, description: e.target.value })
                    }
                    placeholder="Purpose of this category..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Icon Name (Lucide)
                  </label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black"
                    value={editingCategory.icon || ''}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, icon: e.target.value })
                    }
                    placeholder="e.g. share"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Color</label>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm text-black"
                      value={editingCategory.color || ''}
                      onChange={(e) =>
                        setEditingCategory({ ...editingCategory, color: e.target.value })
                      }
                      placeholder="#3b82f6"
                    />
                    <div
                      className="w-10 h-10 rounded-lg border"
                      style={{ backgroundColor: editingCategory.color || '#eee' }}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t bg-gray-50 px-4 py-3 flex justify-end gap-3">
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCategory}
                  className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-700 shadow-md"
                >
                  Save Category
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Run Visualizer Modal */}
        {selectedTraceForVisualizer && (
          <RunVisualizerModal
            trace={selectedTraceForVisualizer}
            onClose={() => {
              setSelectedTraceForVisualizer(null);
              fetchLogs(); // Refresh logs to get updated status
            }}
          />
        )}
      </div>
    </div>
  );
}
