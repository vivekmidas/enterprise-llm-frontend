'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { toSentenceCase, toIdCase } from '@/lib/utils';
import {
  Globe,
  Scale,
  Briefcase,
  Shield,
  FileText,
  Building,
  GraduationCap,
  HeartPulse,
  Cpu,
  Layers,
  Search,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Code,
  Sparkles,
  HelpCircle,
  X,
  ChevronRight,
  Eye,
} from 'lucide-react';
import Alert from '@mui/material/Alert';

interface DomainField {
  key: string;
  label: string;
  type?: string;
  description?: string;
  weight: number;
  importance: string;
  required?: boolean;
}

interface DomainSchemaItem {
  id: string;
  name: string;
  domain_key: string;
  description?: string;
  scope: string; // 'SYSTEM' | 'TENANT'
  customer_id?: string | null;
  schema_json?: {
    fields?: DomainField[];
    default_path?: string;
    icon?: string;
    theme_color?: string;
    status?: string;
    config?: any;
    [key: string]: any;
  };
  system_prompt?: string;
  user_prompt?: string;
  created_at?: string;
  updated_at?: string;
}

const AVAILABLE_ICONS: Record<string, any> = {
  Globe,
  Scale,
  Briefcase,
  Shield,
  FileText,
  Building,
  GraduationCap,
  HeartPulse,
  Cpu,
  Layers,
};

const THEME_PALETTES = [
  { label: 'Indigo', value: '#4f46e5' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Emerald', value: '#059669' },
  { label: 'Amber', value: '#d97706' },
  { label: 'Rose', value: '#e11d48' },
  { label: 'Purple', value: '#7c3aed' },
  { label: 'Cyan', value: '#0891b2' },
  { label: 'Slate', value: '#475569' },
];

/* BLOCK COMMENT: CANONICAL DEFAULT PROMPTS (SINGLE SOURCE OF TRUTH) */
const DEFAULT_SYSTEM_PROMPT = `You are an expert domain knowledge extractor.
Extract structured field values accurately from the provided document content based on the target schema.
Maintain precise names, dates, identifiers, amounts, and citations.
If you find additional relevant domain knowledge that is not covered by the target schema, output it under the 'extra_fields' key.
Return valid JSON only.`;

const DEFAULT_USER_PROMPT = `Document Filename: {filename}

Target Schema Fields:
{fields_summary}

Target JSON Structure:
{fields_json_schema}

Document Content:
{content}

Extract all matching schema fields and any unmapped extra domain knowledge in valid JSON format matching:
{
  "extracted_fields": { ... },
  "extra_fields": { ... }
}`;

interface DomainsTabProps {
  userRole?: string | null;
  customerId?: number | null;
}

export default function DomainsTab({ userRole, customerId }: DomainsTabProps) {
  const isSystemAdmin = userRole === 'system_admin' || !customerId;

  const [domains, setDomains] = useState<DomainSchemaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'SYSTEM' | 'TENANT'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DISABLED'>('ALL');

  // Modal / Drawer state for Editing Domain Config
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [activeConfigTab, setActiveConfigTab] = useState<'general' | 'schema' | 'prompts' | 'advanced'>('general');
  const [editingDomain, setEditingDomain] = useState<DomainSchemaItem | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formDomainKey, setFormDomainKey] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDefaultPath, setFormDefaultPath] = useState('');
  const [formScope, setFormScope] = useState<'SYSTEM' | 'TENANT'>('SYSTEM');
  const [formStatus, setFormStatus] = useState('active');
  const [formIcon, setFormIcon] = useState('Globe');
  const [formThemeColor, setFormThemeColor] = useState('#4f46e5');
  const [formFields, setFormFields] = useState<DomainField[]>([]);
  const [formSystemPrompt, setFormSystemPrompt] = useState('');
  const [formUserPrompt, setFormUserPrompt] = useState('');
  const [formConfigJson, setFormConfigJson] = useState('{}');

  // Add Domain Modal
  const [showAddModal, setShowAddModal] = useState(false);

  // Operations state
  const [saving, setSaving] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchDomains = async () => {
    setLoading(true);
    try {
      const data = await api.getDomainSchemas();
      setDomains(data || []);
    } catch (err: any) {
      console.error('Failed to load domain schemas:', err);
      setAlertMessage({ type: 'error', text: 'Failed to load domain schemas.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const openEditModal = (domain: DomainSchemaItem) => {
    setEditingDomain(domain);
    setFormName(domain.name || '');
    setFormDomainKey(domain.domain_key || '');
    setFormDescription(domain.description || '');

    const schemaData = domain.schema_json || {};
    const defaultPath = schemaData.default_path || (domain.domain_key === 'legal' ? '/legal' : domain.domain_key === 'general' ? '/admin/knowledge' : `/${domain.domain_key}`);
    setFormDefaultPath(defaultPath);
    setFormScope(domain.scope === 'SYSTEM' ? 'SYSTEM' : 'TENANT');
    setFormStatus(schemaData.status || 'active');
    setFormIcon(schemaData.icon || 'Globe');
    setFormThemeColor(schemaData.theme_color || '#4f46e5');
    setFormFields(schemaData.fields || []);
    setFormSystemPrompt(domain.system_prompt || DEFAULT_SYSTEM_PROMPT);
    setFormUserPrompt(domain.user_prompt || DEFAULT_USER_PROMPT);

    const customConfig = schemaData.config || {};
    setFormConfigJson(JSON.stringify(customConfig, null, 2));

    setActiveConfigTab('general');
    setShowConfigModal(true);
  };

  const openAddModal = () => {
    setEditingDomain(null);
    setFormName('');
    setFormDomainKey('');
    setFormDescription('');
    setFormDefaultPath('/custom-domain');
    setFormScope(isSystemAdmin ? 'SYSTEM' : 'TENANT');
    setFormStatus('active');
    setFormIcon('Globe');
    setFormThemeColor('#4f46e5');
    setFormFields([
      { key: 'title', label: 'Title', type: 'string', weight: 1.5, importance: 'high', required: false, description: 'Document title' },
      { key: 'summary', label: 'Summary', type: 'string', weight: 2.0, importance: 'high', required: false, description: 'Content summary' },
    ]);
    setFormSystemPrompt(DEFAULT_SYSTEM_PROMPT);
    setFormUserPrompt(DEFAULT_USER_PROMPT);
    setFormConfigJson('{\n  "capabilities": ["vector_search", "metadata_extraction"],\n  "search_reranking": true\n}');

    setActiveConfigTab('general');
    setShowAddModal(true);
  };

  const handleAddField = () => {
    setFormFields([
      ...formFields,
      {
        key: `field_${formFields.length + 1}`,
        label: `Field ${formFields.length + 1}`,
        type: 'string',
        weight: 1.0,
        importance: 'medium',
        required: false,
        description: '',
      },
    ]);
  };

  const handleUpdateField = (index: number, key: keyof DomainField, value: any) => {
    const updated = [...formFields];
    let sanitizedVal = value;
    if (key === 'label' && typeof value === 'string') {
      sanitizedVal = toSentenceCase(value);
      if (!updated[index].key || updated[index].key.startsWith('field_')) {
        updated[index].key = toIdCase(value);
      }
    } else if (key === 'key' && typeof value === 'string') {
      sanitizedVal = toIdCase(value);
    }
    updated[index] = { ...updated[index], [key]: sanitizedVal };
    setFormFields(updated);
  };

  const handleRemoveField = (index: number) => {
    setFormFields(formFields.filter((_, idx) => idx !== index));
  };

  const handleSaveDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setAlertMessage(null);

    let parsedConfig = {};
    try {
      parsedConfig = formConfigJson.trim() ? JSON.parse(formConfigJson) : {};
    } catch (jsonErr) {
      setAlertMessage({ type: 'error', text: 'Advanced Config JSON is invalid. Please check syntax.' });
      setSaving(false);
      return;
    }

    const payload = {
      name: formName.trim(),
      domain_key: formDomainKey.toLowerCase().trim().replace(/\s+/g, '_'),
      description: formDescription.trim(),
      scope: formScope,
      default_path: formDefaultPath.trim() || `/${formDomainKey.toLowerCase().trim().replace(/\s+/g, '_')}`,
      icon: formIcon,
      theme_color: formThemeColor,
      status: formStatus,
      config: parsedConfig,
      fields: formFields.map((f) => ({
        key: f.key.toLowerCase().trim().replace(/\s+/g, '_'),
        label: f.label.trim(),
        type: f.type || 'string',
        weight: Number(f.weight) || 1.0,
        importance: f.importance || 'medium',
        required: Boolean(f.required),
        description: f.description || '',
      })),
      system_prompt: formSystemPrompt.trim(),
      user_prompt: formUserPrompt.trim(),
    };

    try {
      if (editingDomain) {
        await api.updateDomainSchema(editingDomain.id, payload);
        setAlertMessage({ type: 'success', text: `Domain "${payload.name}" updated successfully.` });
        setShowConfigModal(false);
      } else {
        await api.createDomainSchema(payload);
        setAlertMessage({ type: 'success', text: `New Domain "${payload.name}" created successfully.` });
        setShowAddModal(false);
      }
      await fetchDomains();
    } catch (err: any) {
      console.error('Failed to save domain schema:', err);
      setAlertMessage({ type: 'error', text: err.message || 'Failed to save domain schema.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDomain = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete domain schema "${name}"? This action cannot be undone.`)) {
      return;
    }
    setSaving(true);
    setAlertMessage(null);
    try {
      await api.deleteDomainSchema(id);
      setAlertMessage({ type: 'success', text: `Domain "${name}" deleted successfully.` });
      await fetchDomains();
    } catch (err: any) {
      console.error('Failed to delete domain schema:', err);
      setAlertMessage({ type: 'error', text: err.message || 'Failed to delete domain schema.' });
    } finally {
      setSaving(false);
    }
  };

  const filteredDomains = useMemo(() => {
    return domains.filter((d) => {
      if (scopeFilter !== 'ALL' && d.scope !== scopeFilter) return false;
      const status = d.schema_json?.status || 'active';
      if (statusFilter === 'ACTIVE' && status !== 'active') return false;
      if (statusFilter === 'DISABLED' && status === 'active') return false;

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const defaultPath = d.schema_json?.default_path || '';
      return (
        d.name.toLowerCase().includes(q) ||
        d.domain_key.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q)) ||
        defaultPath.toLowerCase().includes(q)
      );
    });
  }, [domains, scopeFilter, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Domain Registry & Routing Config</h2>
              <p className="text-xs text-gray-500 font-medium">
                Manage configured vertical domains, default landing routes, AI extraction schemas, and capabilities
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchDomains}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all border border-gray-200 cursor-pointer"
            title="Refresh domains"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {(isSystemAdmin || userRole === 'admin') && (
            <button
              type="button"
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Domain</span>
            </button>
          )}
        </div>
      </div>

      {alertMessage && (
        <Alert severity={alertMessage.type} onClose={() => setAlertMessage(null)} className="shadow-xs rounded-xl">
          {alertMessage.text}
        </Alert>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-200">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search domain name, key, or default path (e.g. /legal)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Scope filter */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-gray-200">
            <span className="text-[10px] font-bold text-gray-500 uppercase px-2">Scope:</span>
            {(['ALL', 'SYSTEM', 'TENANT'] as const).map((sc) => (
              <button
                key={sc}
                type="button"
                onClick={() => setScopeFilter(sc)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${scopeFilter === sc
                  ? 'bg-white text-indigo-600 shadow-xs border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                {sc}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-gray-200">
            <span className="text-[10px] font-bold text-gray-500 uppercase px-2">Status:</span>
            {(['ALL', 'ACTIVE', 'DISABLED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${statusFilter === st
                  ? 'bg-white text-indigo-600 shadow-xs border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Domains Grid */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-7 h-7 animate-spin text-indigo-600" />
          <p className="text-xs text-gray-500 font-semibold">Loading configured domains...</p>
        </div>
      ) : filteredDomains.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 flex flex-col items-center justify-center gap-2">
          <Globe className="w-8 h-8 text-gray-400 mb-1" />
          <h3 className="text-sm font-bold text-gray-800">No domains found</h3>
          <p className="text-xs text-gray-500 max-w-sm">
            {searchQuery
              ? `No domains matching "${searchQuery}". Try clearing search filters.`
              : 'No domain schemas configured in the registry.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDomains.map((domain) => {
            const schemaData = domain.schema_json || {};
            const defaultPath =
              schemaData.default_path ||
              (domain.domain_key === 'legal' ? '/legal' : domain.domain_key === 'general' ? '/admin/knowledge' : `/${domain.domain_key}`);
            const themeColor = schemaData.theme_color || '#4f46e5';
            const iconName = schemaData.icon || 'Globe';
            const IconComponent = AVAILABLE_ICONS[iconName] || Globe;
            const fieldsCount = schemaData.fields?.length || 0;
            const status = schemaData.status || 'active';
            const isSystem = domain.scope === 'SYSTEM';

            return (
              <div
                key={domain.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3.5">
                  {/* Top Bar with Icon, Scope, and Status */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                        style={{ backgroundColor: themeColor }}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {domain.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-medium">
                            {domain.domain_key}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${isSystem ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                      >
                        {domain.scope}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${status === 'active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-600 line-clamp-2 min-h-8">
                    {domain.description || 'No description provided for this domain schema.'}
                  </p>

                  {/* Default Routing Path Card */}
                  <div className="p-2.5 bg-slate-50 border border-gray-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      <span>Default Path</span>
                      <span className="text-indigo-600 flex items-center gap-1">
                        <Sliders className="w-3 h-3" />
                        {fieldsCount} Schema Fields
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-mono text-xs font-bold text-gray-800 truncate bg-white px-2.5 py-1 rounded-lg border border-gray-200 flex-1">
                        {defaultPath}
                      </div>
                      <a
                        href={defaultPath}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 border border-gray-200 hover:border-indigo-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                        title={`Open default route: ${defaultPath}`}
                      >
                        <span>Launch</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-gray-400 font-mono">
                    ID: {domain.id.substring(0, 8)}...
                  </div>

                  <div className="flex items-center gap-1.5">
                    {(isSystemAdmin || !isSystem) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteDomain(domain.id, domain.name)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        title="Delete domain schema"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => openEditModal(domain)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Config</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Domain Config Modal / Drawer (Full 4-Tab Config Editor) */}
      {(showConfigModal || showAddModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-gray-200 flex flex-col max-h-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs"
                  style={{ backgroundColor: formThemeColor }}
                >
                  {React.createElement(AVAILABLE_ICONS[formIcon] || Globe, { className: 'w-5 h-5' })}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {editingDomain ? `Configure Domain: ${editingDomain.name}` : 'Register New Domain'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {editingDomain
                      ? `Customize routing paths, field schemas, and extraction prompts for domain ${editingDomain.domain_key}`
                      : 'Create a new vertical domain with custom routing, extraction schemas, and prompts'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowConfigModal(false);
                  setShowAddModal(false);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs inside Modal */}
            <div className="flex items-center border-b border-gray-200 px-6 bg-white gap-2">
              <button
                type="button"
                onClick={() => setActiveConfigTab('general')}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${activeConfigTab === 'general'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>1. General & Routing</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveConfigTab('schema')}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${activeConfigTab === 'schema'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>2. Extraction Schema Fields ({formFields.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveConfigTab('prompts')}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${activeConfigTab === 'prompts'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>3. AI Extraction Prompts</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveConfigTab('advanced')}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${activeConfigTab === 'advanced'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>4. Capabilities & JSON Config</span>
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveDomain} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* TAB 1: GENERAL & ROUTING */}
              {activeConfigTab === 'general' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-gray-700">Domain Name *</label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => {
                          const val = toSentenceCase(e.target.value);
                          setFormName(val);
                          if (!editingDomain) {
                            setFormDomainKey(toIdCase(e.target.value));
                          }
                        }}
                        onBlur={() => setFormName(toSentenceCase(formName))}
                        placeholder="e.g. Legal AI Platform"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-gray-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-gray-700">Domain Key / Slug (ID) *</label>
                      <input
                        type="text"
                        required
                        disabled={Boolean(editingDomain) && formScope === 'SYSTEM' && !isSystemAdmin}
                        value={formDomainKey}
                        onChange={(e) => setFormDomainKey(toIdCase(e.target.value))}
                        onBlur={() => setFormDomainKey(toIdCase(formDomainKey))}
                        placeholder="e.g. legal_ai_platform"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono bg-white text-gray-900 focus:outline-none focus:border-indigo-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  {/* Default Path / Routing Configuration */}
                  <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-xs font-bold text-indigo-950">Default Routing Path *</label>
                        <p className="text-[11px] text-indigo-800/80">
                          Destination path for users assigned to this domain or navigation links
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setFormDefaultPath('/legal')}
                          className="px-2 py-0.5 bg-white text-indigo-700 border border-indigo-200 rounded text-[10px] font-bold hover:bg-indigo-100 transition-all cursor-pointer"
                        >
                          /legal
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormDefaultPath('/admin/knowledge')}
                          className="px-2 py-0.5 bg-white text-indigo-700 border border-indigo-200 rounded text-[10px] font-bold hover:bg-indigo-100 transition-all cursor-pointer"
                        >
                          /admin/knowledge
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormDefaultPath(`/${formDomainKey || 'custom'}`)}
                          className="px-2 py-0.5 bg-white text-indigo-700 border border-indigo-200 rounded text-[10px] font-bold hover:bg-indigo-100 transition-all cursor-pointer"
                        >
                          /{formDomainKey || 'slug'}
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      required
                      value={formDefaultPath}
                      onChange={(e) => setFormDefaultPath(e.target.value)}
                      placeholder="/legal or /education"
                      className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-xs font-mono bg-white text-gray-900 focus:outline-none focus:border-indigo-500 shadow-xs"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-700">Description</label>
                    <textarea
                      rows={2}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Brief overview of the domain scope and purpose..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-gray-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Theme Color, Icon, Scope & Status */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-700">Theme Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formThemeColor}
                          onChange={(e) => setFormThemeColor(e.target.value)}
                          className="w-8 h-8 rounded-lg border border-gray-300 cursor-pointer p-0.5 bg-white"
                        />
                        <div className="flex flex-wrap gap-1 flex-1">
                          {THEME_PALETTES.map((p) => (
                            <button
                              key={p.value}
                              type="button"
                              onClick={() => setFormThemeColor(p.value)}
                              className={`w-5 h-5 rounded-md transition-transform cursor-pointer ${formThemeColor === p.value ? 'ring-2 ring-indigo-500 scale-110' : 'opacity-80 hover:opacity-100'
                                }`}
                              style={{ backgroundColor: p.value }}
                              title={p.label}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-700">Icon Identifier</label>
                      <select
                        value={formIcon}
                        onChange={(e) => setFormIcon(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-gray-900 focus:outline-none focus:border-indigo-500"
                      >
                        {Object.keys(AVAILABLE_ICONS).map((icon) => (
                          <option key={icon} value={icon}>
                            {icon}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-700">Scope Level</label>
                      <select
                        disabled={!isSystemAdmin}
                        value={formScope}
                        onChange={(e) => setFormScope(e.target.value as 'SYSTEM' | 'TENANT')}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-gray-900 focus:outline-none focus:border-indigo-500 disabled:bg-gray-100"
                      >
                        <option value="SYSTEM">SYSTEM (Global All Tenants)</option>
                        <option value="TENANT">TENANT (Current Tenant Only)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-700">Status</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-gray-900 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="active">Active</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: EXTRACTION SCHEMA FIELDS */}
              {activeConfigTab === 'schema' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-gray-200">
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">Dynamic Extraction Fields ({formFields.length})</h4>
                      <p className="text-[11px] text-gray-500">
                        Fields that the AI pipeline will extract and structure from uploaded documents
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddField}
                      className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Field</span>
                    </button>
                  </div>

                  {formFields.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-dashed border-gray-300 rounded-xl">
                      <p className="text-xs text-gray-500 mb-2">No schema fields configured.</p>
                      <button
                        type="button"
                        onClick={handleAddField}
                        className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
                      >
                        + Add your first extraction field
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                      {formFields.map((field, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-3 rounded-xl border border-gray-200 space-y-2.5 shadow-2xs"
                        >
                          <div className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-3">
                              <label className="block text-[10px] font-bold text-gray-500 uppercase">Field Key *</label>
                              <input
                                type="text"
                                required
                                value={field.key}
                                onChange={(e) =>
                                  handleUpdateField(idx, 'key', e.target.value.toLowerCase().replace(/\s+/g, '_'))
                                }
                                placeholder="e.g. policy_number"
                                className="w-full border border-gray-300 rounded px-2.5 py-1 font-mono text-xs bg-white text-gray-900"
                              />
                            </div>

                            <div className="col-span-3">
                              <label className="block text-[10px] font-bold text-gray-500 uppercase">Display Label *</label>
                              <input
                                type="text"
                                required
                                value={field.label}
                                onChange={(e) => handleUpdateField(idx, 'label', e.target.value)}
                                placeholder="e.g. Policy Number"
                                className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs bg-white text-gray-900"
                              />
                            </div>

                            <div className="col-span-2">
                              <label className="block text-[10px] font-bold text-gray-500 uppercase">Type</label>
                              <select
                                value={field.type || 'string'}
                                onChange={(e) => handleUpdateField(idx, 'type', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-900"
                              >
                                <option value="string">String</option>
                                <option value="number">Number</option>
                                <option value="date">Date</option>
                                <option value="array">Array</option>
                                <option value="object">Object</option>
                              </select>
                            </div>

                            <div className="col-span-2">
                              <label className="block text-[10px] font-bold text-gray-500 uppercase">Importance</label>
                              <select
                                value={field.importance || 'medium'}
                                onChange={(e) => handleUpdateField(idx, 'importance', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-900"
                              >
                                <option value="low">Low (1.0x)</option>
                                <option value="medium">Medium (1.5x)</option>
                                <option value="high">High (2.0x)</option>
                                <option value="critical">Critical (3.0x)</option>
                              </select>
                            </div>

                            <div className="col-span-2 flex items-center justify-end gap-2 pt-4">
                              <label className="flex items-center gap-1 text-[11px] text-gray-600 font-semibold cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(field.required)}
                                  onChange={(e) => handleUpdateField(idx, 'required', e.target.checked)}
                                  className="rounded text-indigo-600"
                                />
                                <span>Req.</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => handleRemoveField(idx)}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                                title="Remove field"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div>
                            <input
                              type="text"
                              value={field.description || ''}
                              onChange={(e) => handleUpdateField(idx, 'description', e.target.value)}
                              placeholder="Extraction directive for AI (e.g. Extract exact policy identifier code or null)..."
                              className="w-full border border-gray-200 rounded px-2.5 py-1 text-[11px] bg-slate-50 text-gray-700"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: AI PROMPTS */}
              {activeConfigTab === 'prompts' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Customize system & user prompts for domain-specific LLM extraction and structured parsing.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setFormSystemPrompt(DEFAULT_SYSTEM_PROMPT);
                        setFormUserPrompt(DEFAULT_USER_PROMPT);
                      }}
                      className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
                    >
                      Reset to Default Templates
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700">System Prompt</label>
                    <textarea
                      rows={16}
                      value={formSystemPrompt}
                      onChange={(e) => setFormSystemPrompt(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-3 text-xs font-mono bg-slate-900 text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-gray-700">User Prompt Template</label>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono flex-wrap">
                        <span>Variables:</span>
                        <span className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">{'{filename}'}</span>
                        <span className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">{'{fields_summary}'}</span>
                        <span className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">{'{fields_json_schema}'}</span>
                        <span className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">{'{content}'}</span>
                      </div>
                    </div>
                    <textarea
                      rows={16}
                      value={formUserPrompt}
                      onChange={(e) => setFormUserPrompt(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-3 text-xs font-mono bg-slate-900 text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: ADVANCED CAPABILITIES JSON */}
              {activeConfigTab === 'advanced' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">Advanced Capabilities & Feature Settings</h4>
                      <p className="text-[11px] text-gray-500">
                        Dynamic JSON defining workflows, search schemas, and custom domain configurations
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          const parsed = JSON.parse(formConfigJson);
                          setFormConfigJson(JSON.stringify(parsed, null, 2));
                        } catch (e) {
                          alert('Invalid JSON');
                        }
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded text-xs font-bold transition-all cursor-pointer"
                    >
                      Format JSON
                    </button>
                  </div>

                  <textarea
                    rows={10}
                    value={formConfigJson}
                    onChange={(e) => setFormConfigJson(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-xs font-mono bg-slate-950 text-emerald-400 focus:outline-none focus:border-indigo-500"
                    placeholder="{\n  &quot;capabilities&quot;: [&quot;vector_search&quot;]\n}"
                  />
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfigModal(false);
                    setShowAddModal(false);
                  }}
                  className="px-4 py-2 bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingDomain ? 'Save Domain Config' : 'Create Domain'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
