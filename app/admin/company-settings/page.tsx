'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  FlaskRound,
  Trash2,
  ChevronDown,
  ChevronUp,
  Plus,
  HelpCircle,
  Sparkles,
  Check,
  Building2,
} from 'lucide-react';
import { Tooltip } from '@/app/components/Tooltip';

export interface CompanySettingsTabProps {
  userRole?: string | null;
  customerId?: string;
}

export default function CompanySettingsTab({ userRole, customerId }: CompanySettingsTabProps = {}) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customerId || '');
  const [customers, setCustomers] = useState<any[]>([]);

  // Configurations list & active state
  const [savedConfigs, setSavedConfigs] = useState<any[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const [activeConfigId, setActiveConfigId] = useState<string | null>(null);

  // Form State
  const [configName, setConfigName] = useState<string>('');
  const [configDesc, setConfigDesc] = useState<string>('');
  const [settings, setSettings] = useState<any>({
    llm_provider: 'vllm',
    llm_model: 'qwen:0.5b',
    llm_base_url: 'http://localhost:8001/v1',
    llm_api_key: '',
    temperature: 0.7,
    max_tokens: 1024,
    embedding_provider: 'ollama',
    embedding_model: 'nomic-embed-text',
    vector_dimension: 768,
    approach: 'hybrid',
    top_k: 5,
    min_score: 0.65,
    enable_reranking: true,
    rerank_provider: 'ollama',
    rerank_model: 'qwen3.5:0.8b',
    rerank_candidate_limit: 15,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{
    status: 'success' | 'error' | null;
    message: string;
  }>({ status: null, message: '' });

  // Diagnostic Test States
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'success' | 'error' | null;
    message: string;
  }>({ status: null, message: '' });
  const [testSteps, setTestSteps] = useState<any[]>([]);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});

  // Temp File Storage (tenant-level staging config)
  const defaultTempFileConfig = {
    storage_type: 'local' as 'local' | 's3' | 'network_path',
    local_dir: '/tmp/nflow',
    max_file_size_mb: 50,
    retention_minutes: 60,
    s3_bucket: '',
    s3_region: '',
    network_path: '',
  };
  const [tempFileConfig, setTempFileConfig] =
    useState<typeof defaultTempFileConfig>(defaultTempFileConfig);
  const [tempFileSaving, setTempFileSaving] = useState(false);
  const [tempFileSaveResult, setTempFileSaveResult] = useState<{
    status: 'success' | 'error' | null;
    message: string;
  }>({ status: null, message: '' });
  const [tempFileSectionOpen, setTempFileSectionOpen] = useState(false);

  useEffect(() => {
    if (customerId) {
      setSelectedCustomerId(customerId);
    }
  }, [customerId]);

  useEffect(() => {
    if (userRole === 'system_admin') {
      async function fetchCustomers() {
        try {
          const list = await api.getCustomers();
          setCustomers(list || []);
          if (list && list.length > 0 && !selectedCustomerId) {
            setSelectedCustomerId(list[0].id);
          }
        } catch (err) {
          console.error('Failed to fetch customers list', err);
        }
      }
      fetchCustomers();
    }
  }, [userRole]);

  // Flatten nested API settings → flat form state
  const flattenSettings = (s: any): any => {
    const llm = s?.llm_config || {};
    const ret = s?.retrieval_config || {};
    const rerank = s?.rerank_config || {};
    return {
      llm_provider: llm.provider ?? 'vllm',
      llm_model: llm.model ?? '',
      llm_base_url: llm.base_url ?? '',
      llm_api_key: llm.api_key ?? '',
      temperature: llm.temperature ?? 0.7,
      max_tokens: llm.max_tokens ?? 1024,
      embedding_provider: s?.embedding_provider ?? 'ollama',
      embedding_model: s?.embedding_model ?? 'nomic-embed-text',
      vector_dimension: s?.vector_dimension ?? 768,
      approach: ret.approach ?? 'hybrid',
      top_k: ret.top_k ?? 5,
      min_score: ret.min_score ?? 0.65,
      enable_reranking: rerank.enable_reranking ?? false,
      rerank_provider: rerank.provider ?? 'ollama',
      rerank_model: rerank.model ?? 'qwen3.5:0.8b',
      rerank_candidate_limit: rerank.candidate_limit ?? 15,
    };
  };

  // Collapse flat form state → nested API payload
  const buildSettingsPayload = (flat: any) => ({
    llm_config: {
      provider: flat.llm_provider,
      base_url: flat.llm_base_url || null,
      api_key: flat.llm_api_key || null,
      model: flat.llm_model,
      temperature: flat.temperature !== '' ? flat.temperature : 0.7,
      max_tokens: flat.max_tokens !== '' ? flat.max_tokens : 1024,
    },
    retrieval_config: {
      approach: flat.approach,
      top_k: flat.top_k !== '' ? flat.top_k : 5,
      min_score: flat.min_score !== '' ? flat.min_score : 0.0,
    },
    rerank_config: {
      enable_reranking: flat.enable_reranking,
      provider: flat.rerank_provider,
      model: flat.rerank_model,
      candidate_limit: flat.rerank_candidate_limit !== '' ? flat.rerank_candidate_limit : 15,
    },
    embedding_provider: flat.embedding_provider,
    embedding_model: flat.embedding_model,
    vector_dimension: flat.vector_dimension !== '' ? flat.vector_dimension : 768,
  });

  // Load profiles & company settings
  const loadData = async () => {
    setLoading(true);
    try {
      const [companySettings, configs] = await Promise.all([
        api.getCompanySettings(selectedCustomerId || undefined),
        api.getLlmProfiles(selectedCustomerId || undefined),
      ]);

      const configList = configs || [];
      setSavedConfigs(configList);

      // Load temp file config from company settings blob
      const tfc = companySettings?.settings?.temp_file_config;
      if (tfc) setTempFileConfig({ ...defaultTempFileConfig, ...tfc });

      const activeId =
        companySettings.active_config_id || companySettings.active_profile_id
          ? String(companySettings.active_config_id || companySettings.active_profile_id)
          : null;
      setActiveConfigId(activeId);

      // If active config exists in list, select it; else pick first or start new
      if (activeId && configList.some((c: any) => String(c.id) === activeId)) {
        const activeCfg = configList.find((c: any) => String(c.id) === activeId);
        setSelectedConfigId(activeId);
        setConfigName(activeCfg.name || '');
        setConfigDesc(activeCfg.description || '');
        setSettings(flattenSettings(activeCfg.settings));
      } else if (configList.length > 0) {
        const first = configList[0];
        setSelectedConfigId(String(first.id));
        setConfigName(first.name || '');
        setConfigDesc(first.description || '');
        setSettings(flattenSettings(first.settings));
      } else {
        // Start fresh
        handleStartNewConfig();
      }
    } catch (err) {
      console.error('Failed to load settings and llm profiles', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCustomerId, userRole]);

  const handleConfigSelect = async (configId: string) => {
    if (configId === 'new') {
      handleStartNewConfig();
      return;
    }

    setSelectedConfigId(configId);
    try {
      const cfg = await api.getLlmProfile(configId);
      setConfigName(cfg.name || '');
      setConfigDesc(cfg.description || '');
      setSettings(flattenSettings(cfg.settings || {}));
    } catch (err) {
      console.error('Failed to fetch LLM profile', err);
    }
  };

  const handleStartNewConfig = () => {
    setSelectedConfigId('new');
    setConfigName(`New LLM Configuration #${savedConfigs.length + 1}`);
    setConfigDesc('');
    setSettings({
      llm_provider: 'vllm',
      llm_model: 'qwen:0.5b',
      llm_base_url: 'http://localhost:8001/v1',
      llm_api_key: '',
      temperature: 0.7,
      max_tokens: 1024,
      embedding_provider: 'ollama',
      embedding_model: 'nomic-embed-text',
      vector_dimension: 768,
      approach: 'hybrid',
      top_k: 5,
      min_score: 0.65,
      enable_reranking: true,
      rerank_provider: 'ollama',
      rerank_model: 'qwen3.5:0.8b',
      rerank_candidate_limit: 15,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let val: any = value;
    if (type === 'checkbox') {
      val = (e.target as HTMLInputElement).checked;
    } else if (
      name === 'top_k' ||
      name === 'vector_dimension' ||
      name === 'rerank_candidate_limit' ||
      name === 'max_tokens'
    ) {
      val = value !== '' ? Number(value) : '';
    } else if (name === 'min_score' || name === 'temperature') {
      val = value !== '' ? parseFloat(value) : '';
    }

    setSettings((prev: any) => ({
      ...prev,
      [name]: val,
    }));
  };

  const handleDirectSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configName.trim()) {
      alert('Configuration Name is required.');
      return;
    }

    setSaving(true);
    setSaveResult({ status: null, message: '' });

    const nestedSettings = buildSettingsPayload(settings);

    try {
      if (selectedConfigId === 'new') {
        // Create new LLMProfile
        const created = await api.createLlmProfile(
          {
            name: configName.trim(),
            description: configDesc.trim() || undefined,
            settings: nestedSettings,
          },
          selectedCustomerId || undefined,
        );

        // Set as active default
        await api.activateLlmProfile(created.id, selectedCustomerId || undefined);

        setActiveConfigId(String(created.id));
        const updatedList = await api.getLlmProfiles(selectedCustomerId || undefined);
        setSavedConfigs(updatedList || []);
        setSelectedConfigId(String(created.id));

        setSaveResult({
          status: 'success',
          message: 'New configuration created and set as active default!',
        });
      } else {
        // Update existing LLMProfile
        await api.updateLlmProfile(
          selectedConfigId,
          {
            name: configName.trim(),
            description: configDesc.trim() || undefined,
            settings: nestedSettings,
          },
          selectedCustomerId || undefined,
        );

        const updatedList = await api.getLlmProfiles(selectedCustomerId || undefined);
        setSavedConfigs(updatedList || []);

        setSaveResult({
          status: 'success',
          message: 'Configuration updated successfully!',
        });
      }
      setTimeout(() => setSaveResult({ status: null, message: '' }), 4000);
    } catch (err: any) {
      console.error('Failed to save configuration', err);
      setSaveResult({
        status: 'error',
        message: err.message || 'Failed to save configuration.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSetActiveDefault = async () => {
    if (!selectedConfigId || selectedConfigId === 'new') return;
    setSaving(true);
    try {
      await api.activateLlmProfile(selectedConfigId, selectedCustomerId || undefined);
      setActiveConfigId(selectedConfigId);
      setSaveResult({
        status: 'success',
        message: 'Set as active company default successfully!',
      });
      setTimeout(() => setSaveResult({ status: null, message: '' }), 4000);
    } catch (err: any) {
      console.error(err);
      setSaveResult({
        status: 'error',
        message: err.message || 'Failed to set active default.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfig = async () => {
    if (!selectedConfigId || selectedConfigId === 'new') return;
    if (!confirm('Are you sure you want to delete this LLM & Retrieval configuration?')) return;

    setSaving(true);
    try {
      await api.deleteLlmProfile(selectedConfigId, selectedCustomerId || undefined);

      if (activeConfigId === selectedConfigId) {
        setActiveConfigId(null);
      }

      await loadData();
      setSaveResult({ status: 'success', message: 'Configuration deleted.' });
      setTimeout(() => setSaveResult({ status: null, message: '' }), 4000);
    } catch (err: any) {
      console.error(err);
      setSaveResult({ status: 'error', message: err.message || 'Failed to delete configuration.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult({ status: null, message: '' });
    setExpandedSteps({});

    const initialSteps = [
      { step: 1, name: 'Configuration Parsing', status: 'pending', message: 'Pending...' },
      { step: 2, name: 'Network Reachability Check', status: 'pending', message: 'Pending...' },
      { step: 3, name: 'Credential Validation', status: 'pending', message: 'Pending...' },
      { step: 4, name: 'API Client Initialization', status: 'pending', message: 'Pending...' },
      {
        step: 5,
        name: 'Provider Model Availability Check',
        status: 'pending',
        message: 'Pending...',
      },
      { step: 6, name: 'Model Verification', status: 'pending', message: 'Pending...' },
      { step: 7, name: 'Prompt Preparation', status: 'pending', message: 'Pending...' },
      { step: 8, name: 'Endpoint Connection', status: 'pending', message: 'Pending...' },
      { step: 9, name: 'Request Dispatch', status: 'pending', message: 'Pending...' },
      { step: 10, name: 'Response Processing', status: 'pending', message: 'Pending...' },
      { step: 11, name: 'Content Validation', status: 'pending', message: 'Pending...' },
    ];
    setTestSteps(initialSteps);

    const testPayload: any = {
      customer_id: selectedCustomerId || undefined,
      tenant_id: selectedCustomerId || undefined,
      config_id: selectedConfigId !== 'new' ? selectedConfigId : undefined,
      llm_provider: settings.llm_provider,
      llm_model: settings.llm_model,
      llm_base_url: settings.llm_base_url,
      llm_api_key: settings.llm_api_key,
    };

    try {
      const res = await api.testLlmConnection(testPayload);
      const finalSteps = res.steps || [];

      for (let i = 0; i < finalSteps.length; i++) {
        setTestSteps((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, status: 'loading', message: 'Executing...' } : s,
          ),
        );
        await new Promise((resolve) => setTimeout(resolve, 200));
        setTestSteps((prev) => prev.map((s, idx) => (idx === i ? finalSteps[i] : s)));

        if (finalSteps[i].status === 'error') {
          setTestSteps((prev) =>
            prev.map((s, idx) =>
              idx > i ? { ...s, status: 'skipped', message: 'Skipped due to previous error' } : s,
            ),
          );
          break;
        }
      }

      if (res.status === 'success') {
        setTestResult({ status: 'success', message: res.message });
      } else {
        setTestResult({ status: 'error', message: res.message || 'Connection test failed.' });
      }
    } catch (err: any) {
      setTestResult({ status: 'error', message: err.message || 'Connection test failed.' });
      setTestSteps((prev) =>
        prev.map((s) =>
          s.status === 'pending' || s.status === 'loading'
            ? { ...s, status: 'error', message: 'Failed connection execution' }
            : s,
        ),
      );
    } finally {
      setTestingConnection(false);
    }
  };

  const toggleStepExpand = (stepNum: number) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepNum]: !prev[stepNum],
    }));
  };

  const handleSaveTempFileConfig = async () => {
    if (!selectedCustomerId && userRole !== 'system_admin') return;
    setTempFileSaving(true);
    setTempFileSaveResult({ status: null, message: '' });
    try {
      await api.updateCustomer(selectedCustomerId!, {
        settings: { temp_file_config: tempFileConfig },
      });
      setTempFileSaveResult({ status: 'success', message: 'Temp file settings saved.' });
      setTimeout(() => setTempFileSaveResult({ status: null, message: '' }), 4000);
    } catch (err: any) {
      setTempFileSaveResult({ status: 'error', message: err.message || 'Save failed.' });
    } finally {
      setTempFileSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 text-sm">Loading configurations...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Header controls */}
      <div className="border-b border-gray-200 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-black">LLM & RAG Configuration</h2>
            {selectedConfigId !== 'new' && activeConfigId === selectedConfigId && (
              <span className="text-[10px] font-extrabold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Check className="w-3 h-3 text-green-600" />
                Active Default
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Configure LLM engines, vector embedding models, and search pipeline settings for your
            tenant.
          </p>
        </div>

        {/* Configuration Selector Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs font-bold text-gray-500 uppercase">Configuration:</span>
          <select
            value={selectedConfigId}
            onChange={(e) => handleConfigSelect(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black font-semibold focus:outline-none focus:border-blue-500 cursor-pointer min-w-[220px]"
          >
            {selectedConfigId === 'new' && (
              <option value="new">Creating New Configuration...</option>
            )}
            {savedConfigs.map((cfg) => (
              <option key={cfg.id} value={String(cfg.id)}>
                {cfg.name} {String(cfg.id) === activeConfigId ? '★ (Active Default)' : ''}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleStartNewConfig}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Config
          </button>

          {selectedConfigId !== 'new' && (
            <>
              {activeConfigId !== selectedConfigId && (
                <button
                  type="button"
                  onClick={handleSetActiveDefault}
                  className="px-3 py-2 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Set as Active Default
                </button>
              )}
              <button
                type="button"
                onClick={handleDeleteConfig}
                className="p-2 border border-red-200 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"
                title="Delete configuration"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {userRole === 'system_admin' && (
        <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-xs flex items-center gap-3">
          <Building2 className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-bold text-gray-700 uppercase">Target Tenant:</span>
          <select
            value={selectedCustomerId || ''}
            onChange={(e) => setSelectedCustomerId(e.target.value ? e.target.value : '')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500 cursor-pointer min-w-[240px]"
          >
            <option value="">Select a company tenant...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.domain || 'no domain'})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Main Settings Form (Left 2 columns) */}
        <form
          onSubmit={handleDirectSave}
          className="col-span-2 space-y-6 bg-white border border-gray-200 p-6 rounded-xl shadow-xs"
        >
          {/* Section 1: Configuration Metadata */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-1.5 border-gray-100 flex items-center gap-1.5">
              <span>1. Configuration Overview</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2 md:col-span-1">
                <label className="text-xs font-semibold text-gray-900">Configuration Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Production GPT-4o Hybrid"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="space-y-1 col-span-2 md:col-span-1">
                <label className="text-xs font-semibold text-gray-900">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Primary cloud RAG pipeline with cross-encoder reranking"
                  value={configDesc}
                  onChange={(e) => setConfigDesc(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: LLM Gateway Engine */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-1.5 border-gray-100">
              2. LLM Engine Configuration
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <label className="text-xs font-semibold text-gray-900">LLM Provider</label>
                  <Tooltip
                    content="API provider format. vLLM uses OpenAI-compatible protocol; Ollama is local; OpenAI & Gemini are cloud."
                    position="top"
                    className="whitespace-normal max-w-xs text-left font-normal"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                  </Tooltip>
                </div>
                <select
                  name="llm_provider"
                  value={settings.llm_provider || 'vllm'}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500 cursor-pointer font-sans"
                >
                  <option value="vllm">vLLM (OpenAI API Compatible)</option>
                  <option value="ollama">Ollama</option>
                  <option value="openai">OpenAI API</option>
                  <option value="gemini">Google Gemini</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <label className="text-xs font-semibold text-gray-900">Model Name</label>
                  <Tooltip
                    content="Model identifier (e.g. meta-llama/Llama-3.1-8B-Instruct, qwen:0.5b, gpt-4o-mini)."
                    position="top"
                    className="whitespace-normal max-w-xs text-left font-normal"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                  </Tooltip>
                </div>
                <input
                  type="text"
                  name="llm_model"
                  placeholder="e.g. gpt-4o-mini or qwen:0.5b"
                  value={settings.llm_model || ''}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="space-y-1 col-span-2">
                <div className="flex items-center gap-1">
                  <label className="text-xs font-semibold text-gray-900">Base URL</label>
                  <Tooltip
                    content="API endpoint URL (e.g., http://localhost:8001/v1, http://localhost:11434, or https://api.openai.com/v1)."
                    position="top"
                    className="whitespace-normal max-w-xs text-left font-normal"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                  </Tooltip>
                </div>
                <input
                  type="text"
                  name="llm_base_url"
                  placeholder="e.g. http://localhost:8001/v1 or https://api.openai.com/v1"
                  value={settings.llm_base_url || ''}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="space-y-1 col-span-2">
                <div className="flex items-center gap-1">
                  <label className="text-xs font-semibold text-gray-900">API Key / Token</label>
                  <Tooltip
                    content="API authentication key. Enter EMPTY if no token is required."
                    position="top"
                    className="whitespace-normal max-w-xs text-left font-normal"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                  </Tooltip>
                </div>
                <input
                  type="password"
                  name="llm_api_key"
                  placeholder="Provide API key or enter EMPTY"
                  value={settings.llm_api_key || ''}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <label className="text-xs font-semibold text-gray-900">Temperature</label>
                  <Tooltip
                    content="Randomness (0.0 = analytical, 1.0 = creative)."
                    position="top"
                    className="whitespace-normal max-w-xs text-left font-normal"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                  </Tooltip>
                </div>
                <input
                  type="number"
                  name="temperature"
                  min="0.0"
                  max="1.0"
                  step="0.1"
                  placeholder="0.7"
                  value={settings.temperature !== undefined ? settings.temperature : 0.7}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <label className="text-xs font-semibold text-gray-900">
                    Max Generation Tokens
                  </label>
                  <Tooltip
                    content="Maximum token length for output responses."
                    position="top"
                    className="whitespace-normal max-w-xs text-left font-normal"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                  </Tooltip>
                </div>
                <input
                  type="number"
                  name="max_tokens"
                  min={64}
                  max={8192}
                  placeholder="1024"
                  value={settings.max_tokens || 1024}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Embeddings */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-1.5 border-gray-100">
              3. Embedding Model
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-900">Provider</label>
                <select
                  name="embedding_provider"
                  value={settings.embedding_provider || 'ollama'}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500 cursor-pointer font-sans"
                >
                  <option value="ollama">Ollama</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-900">Embedding Model</label>
                <input
                  type="text"
                  name="embedding_model"
                  placeholder="e.g. nomic-embed-text or text-embedding-3-small"
                  value={settings.embedding_model || ''}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-900">Vector Dimension</label>
                <input
                  type="number"
                  name="vector_dimension"
                  placeholder="768 or 1536"
                  value={settings.vector_dimension || 768}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Search & RAG Pipeline */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-1.5 border-gray-100">
              4. Search & RAG Pipeline
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-900">Search Approach</label>
                <select
                  name="approach"
                  value={settings.approach || 'hybrid'}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500 cursor-pointer font-sans"
                >
                  <option value="hybrid">Hybrid Search (Vector + Keyword RRF)</option>
                  <option value="vector">Vector Only (Semantic collection)</option>
                  <option value="keyword">Keyword Only (MySQL BM25)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-900">Top K Chunks</label>
                <input
                  type="number"
                  name="top_k"
                  min={1}
                  max={50}
                  placeholder="5"
                  value={settings.top_k || 5}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-900">Min Similarity Score</label>
                <input
                  type="number"
                  name="min_score"
                  step="0.05"
                  min="0.0"
                  max="1.0"
                  placeholder="0.65"
                  value={settings.min_score !== undefined ? settings.min_score : 0.65}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Reranker Sub-card */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase select-none cursor-pointer">
                <input
                  type="checkbox"
                  name="enable_reranking"
                  checked={!!settings.enable_reranking}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-bg-primary focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                Enable Cross-Encoder Reranking
              </label>

              {settings.enable_reranking && (
                <div className="grid grid-cols-3 gap-4 pt-1 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">Reranker Provider</label>
                    <select
                      name="rerank_provider"
                      value={settings.rerank_provider || 'ollama'}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs bg-white text-black focus:outline-none focus:border-blue-500 cursor-pointer font-sans"
                    >
                      <option value="ollama">Ollama</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">Reranker Model</label>
                    <input
                      type="text"
                      name="rerank_model"
                      placeholder="e.g. qwen3.5:0.8b"
                      value={settings.rerank_model || 'qwen3.5:0.8b'}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs bg-white text-black focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">Candidates Limit</label>
                    <input
                      type="number"
                      name="rerank_candidate_limit"
                      min={1}
                      max={100}
                      placeholder="15"
                      value={settings.rerank_candidate_limit || 15}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between border-t pt-4 border-gray-100">
            {saveResult.status && (
              <div
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
                  saveResult.status === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {saveResult.status === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                )}
                <span>{saveResult.message}</span>
              </div>
            )}

            <div className="flex gap-2 ml-auto">
              <button
                type="submit"
                disabled={saving}
                className="bg-primary hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Save Configuration
              </button>
            </div>
          </div>
        </form>

        {/* Right Sidebar: Diagnostic Panel */}
        <div className="space-y-6 col-span-1">
          <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <FlaskRound className="w-4 h-4 text-bg-primary" />
              Gateway Diagnostic
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Test endpoint connectivity and verify prompt completion against current settings.
            </p>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="w-full py-2.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 font-semibold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              {testingConnection && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Test Connection
            </button>

            {testResult.status && (
              <div
                className={`p-3 rounded-lg border text-xs leading-relaxed flex items-start gap-2 ${
                  testResult.status === 'success'
                    ? 'bg-green-50/50 border-green-200 text-green-800'
                    : 'bg-red-50/50 border-red-200 text-red-800'
                }`}
              >
                {testResult.status === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Diagnostic execution steps */}
            {testSteps.length > 0 && (
              <div className="border-t pt-4 border-gray-100 space-y-2 max-h-[450px] overflow-y-auto pr-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <span>
                    Execution Steps ({testSteps.filter((s) => s.status === 'success').length}/11)
                  </span>
                  {testingConnection && (
                    <span className="text-blue-500 animate-pulse">Running...</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  {testSteps.map((step) => {
                    const isExpanded = !!expandedSteps[step.step];
                    const getStepIcon = (status: string) => {
                      switch (status) {
                        case 'success':
                          return <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />;
                        case 'error':
                          return <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />;
                        case 'loading':
                          return (
                            <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0" />
                          );
                        case 'skipped':
                          return (
                            <div className="w-3.5 h-3.5 rounded-full border border-gray-300 flex items-center justify-center shrink-0">
                              <span className="w-1.5 h-0.5 bg-gray-300 rounded-sm" />
                            </div>
                          );
                        case 'pending':
                        default:
                          return (
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 shrink-0" />
                          );
                      }
                    };

                    return (
                      <div
                        key={step.step}
                        className={`flex flex-col p-2.5 rounded-lg border transition-all duration-200 select-none cursor-pointer ${
                          step.status === 'success'
                            ? 'bg-green-50/30 border-green-100 hover:bg-green-50/60 text-green-900'
                            : step.status === 'error'
                              ? 'bg-red-50/30 border-red-100 hover:bg-red-50/60 text-red-900'
                              : step.status === 'loading'
                                ? 'bg-blue-50/30 border-blue-100 text-blue-900 font-semibold'
                                : 'bg-gray-50/50 border-gray-100 text-gray-400'
                        }`}
                        onClick={() => toggleStepExpand(step.step)}
                      >
                        <div className="flex gap-2 items-start justify-between">
                          <div className="flex gap-2 items-start min-w-0">
                            <div className="mt-0.5">{getStepIcon(step.status)}</div>
                            <span className="text-xs font-medium truncate">
                              {step.step}. {step.name}
                            </span>
                          </div>
                          <div className="text-gray-400 shrink-0">
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-2 text-[10px] leading-normal font-mono select-text bg-slate-900 text-slate-100 border border-slate-950 p-2 rounded-md overflow-x-auto whitespace-pre-wrap break-all">
                            {step.message || 'No output log.'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Temp File Storage ── */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {/* Collapsible header */}
        <button
          type="button"
          onClick={() => setTempFileSectionOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-bold text-gray-700">Temp / In-Transit File Storage</span>
            <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Preview
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-[10px] text-gray-400">
              Configure where transient files are staged during workflow execution.
            </span>
            {tempFileSectionOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>

        {tempFileSectionOpen && (
          <div className="p-5 space-y-5 border-t border-gray-200">
            {/* Storage type selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                Storage Type
              </label>
              <div className="flex gap-3">
                {(['local', 's3', 'network_path'] as const).map((t) => {
                  const labels: Record<string, string> = {
                    local: 'Local Disk',
                    s3: 'S3 Bucket',
                    network_path: 'Network Path',
                  };
                  const isAvailable = t === 'local';
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() =>
                        isAvailable && setTempFileConfig((c) => ({ ...c, storage_type: t }))
                      }
                      className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all
                        ${
                          tempFileConfig.storage_type === t
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : isAvailable
                              ? 'border-gray-300 bg-white text-gray-600 hover:border-gray-400 cursor-pointer'
                              : 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
                        }`}
                    >
                      {labels[t]}
                      {!isAvailable && (
                        <span className="ml-1 text-[8px] text-gray-300">(soon)</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-400">
                S3 and network paths are planned for a future release.
              </p>
            </div>

            {/* Local dir */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                Local Temp Directory
              </label>
              <input
                type="text"
                value={tempFileConfig.local_dir}
                disabled={tempFileConfig.storage_type !== 'local'}
                onChange={(e) => setTempFileConfig((c) => ({ ...c, local_dir: e.target.value }))}
                placeholder="/tmp/nflow"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono bg-white text-black focus:outline-none focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
              />
              <p className="text-[10px] text-gray-400">
                Absolute path on the server where transient files are written.
              </p>
            </div>

            {/* Max file size + retention — two columns */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Max File Size (MB)
                </label>
                <input
                  type="number"
                  min={1}
                  max={2048}
                  value={tempFileConfig.max_file_size_mb}
                  onChange={(e) =>
                    setTempFileConfig((c) => ({ ...c, max_file_size_mb: Number(e.target.value) }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-black focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Retention (minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  value={tempFileConfig.retention_minutes}
                  onChange={(e) =>
                    setTempFileConfig((c) => ({ ...c, retention_minutes: Number(e.target.value) }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-black focus:outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-gray-400">
                  Auto-purge temp files after this window.
                </p>
              </div>
            </div>

            {/* S3 fields — greyed out */}
            <div className="grid grid-cols-2 gap-4 opacity-40 pointer-events-none">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  S3 Bucket
                </label>
                <input
                  type="text"
                  disabled
                  value={tempFileConfig.s3_bucket}
                  placeholder="my-company-bucket"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono bg-gray-50 text-gray-400 cursor-not-allowed"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  S3 Region
                </label>
                <input
                  type="text"
                  disabled
                  value={tempFileConfig.s3_region}
                  placeholder="ap-south-1"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono bg-gray-50 text-gray-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="opacity-40 pointer-events-none space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                Network / UNC Path
              </label>
              <input
                type="text"
                disabled
                value={tempFileConfig.network_path}
                placeholder="\\\\server\\share\\nflow-temp"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono bg-gray-50 text-gray-400 cursor-not-allowed"
              />
              <p className="text-[10px] text-gray-400">
                SMB/UNC network share — planned for future release.
              </p>
            </div>

            {/* Save bar */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div>
                {tempFileSaveResult.status && (
                  <span
                    className={`text-xs font-semibold ${
                      tempFileSaveResult.status === 'success' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {tempFileSaveResult.status === 'success' ? '✓ ' : '✗ '}
                    {tempFileSaveResult.message}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleSaveTempFileConfig}
                disabled={tempFileSaving}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {tempFileSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" /> Save Temp File Settings
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
