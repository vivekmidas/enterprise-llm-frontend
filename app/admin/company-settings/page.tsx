'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  HelpCircle, 
  FlaskRound, 
  Pencil, 
  Save, 
  X, 
  Trash2,
  Settings2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Tooltip } from '@/app/components/Tooltip';

export interface CompanySettingsTabProps {
  userRole?: string | null;
  customerId?: number | null;
}

export default function CompanySettingsTab({ userRole, customerId }: CompanySettingsTabProps = {}) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(customerId || null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({
    llm_provider: 'vllm',
    llm_model: 'qwen:0.5b',
    llm_base_url: 'http://localhost:8001/v1',
    llm_api_key: 'EMPTY',
    temperature: 0.7,
    embedding_provider: 'ollama',
    embedding_model: 'nomic-embed-text',
    vector_dimension: 768,
    top_k: 5,
    min_score: 0.65,
    enable_reranking: true,
    rerank_provider: 'ollama',
    rerank_model: 'qwen3.5:0.8b',
    rerank_candidate_limit: 5,
    approach: 'hybrid',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'success' | 'error' | null;
    message: string;
  }>({ status: null, message: '' });

  const [saveResult, setSaveResult] = useState<{
    status: 'success' | 'error' | null;
    message: string;
  }>({ status: null, message: '' });

  const [testSteps, setTestSteps] = useState<any[]>([]);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});

  const toggleStepExpand = (stepNum: number) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepNum]: !prev[stepNum]
    }));
  };

  // Config presets management
  const [savedConfigs, setSavedConfigs] = useState<any[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string>('default');
  const [activeConfigId, setActiveConfigId] = useState<string | null>(null);

  // Inline name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');

  // Save dialog modal states
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDesc, setNewProfileDesc] = useState('');
  const [saveActionType, setSaveActionType] = useState<'update' | 'new' | 'default'>('update');

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

  // Load configs & default settings
  const loadSettingsAndConfigs = async () => {
    if (userRole === 'system_admin' && !selectedCustomerId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [companySettings, configs] = await Promise.all([
        api.getCompanySettings(selectedCustomerId || undefined),
        api.getRetrievalConfigs()
      ]);

      setSavedConfigs(configs || []);
      
      const activeId = companySettings.active_config_id ? String(companySettings.active_config_id) : null;
      setActiveConfigId(activeId);

      // If active profile is set, select it by default, otherwise default settings
      if (activeId && configs.some((c: any) => String(c.id) === activeId)) {
        setSelectedConfigId(activeId);
        const activeCfg = configs.find((c: any) => String(c.id) === activeId);
        setSettings((prev: any) => ({
          ...prev,
          ...companySettings,
          ...activeCfg.settings,
        }));
      } else {
        setSelectedConfigId('default');
        setSettings((prev: any) => ({
          ...prev,
          ...companySettings,
        }));
      }
    } catch (err) {
      console.error('Failed to load company settings & presets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsAndConfigs();
  }, [selectedCustomerId, userRole]);

  // Switch configuration preset
  const handleConfigChange = (configId: string) => {
    setSelectedConfigId(configId);
    if (configId === 'default') {
      // Reload base company settings
      api.getCompanySettings(selectedCustomerId || undefined).then((companySettings) => {
        setSettings((prev: any) => ({
          ...prev,
          ...companySettings,
        }));
      });
    } else {
      const selectedCfg = savedConfigs.find((c) => String(c.id) === configId);
      if (selectedCfg && selectedCfg.settings) {
        setSettings((prev: any) => ({
          ...prev,
          ...selectedCfg.settings,
        }));
      }
    }
  };

  // Set selected config profile as active for the tenant
  const handleSetActiveProfile = async () => {
    if (selectedConfigId === 'default') return;
    setSaving(true);
    try {
      await api.updateCompanySettings({
        active_config_id: Number(selectedConfigId)
      }, selectedCustomerId || undefined);
      
      setActiveConfigId(selectedConfigId);
      setSaveResult({ status: 'success', message: 'Set as active profile successfully!' });
      setTimeout(() => setSaveResult({ status: null, message: '' }), 4000);
    } catch (err: any) {
      console.error(err);
      setSaveResult({ status: 'error', message: err.message || 'Failed to update active profile.' });
    } finally {
      setSaving(false);
    }
  };

  // Inline rename config profile
  const handleRenameConfig = async () => {
    if (selectedConfigId === 'default' || !editNameValue.trim()) return;
    try {
      await api.updateRetrievalConfig(Number(selectedConfigId), {
        name: editNameValue.trim()
      });
      setIsEditingName(false);
      // Reload configs list
      const configs = await api.getRetrievalConfigs();
      setSavedConfigs(configs || []);
    } catch (err: any) {
      alert(err.message || 'Failed to rename configuration profile.');
    }
  };

  // Delete profile
  const handleDeleteConfig = async () => {
    if (selectedConfigId === 'default') return;
    if (!confirm('Are you sure you want to delete this configuration profile?')) return;
    setSaving(true);
    try {
      await api.deleteRetrievalConfig(Number(selectedConfigId));
      
      // If it was the active config, reset company setting
      if (activeConfigId === selectedConfigId) {
        await api.updateCompanySettings({
          active_config_id: null
        }, selectedCustomerId || undefined);
        setActiveConfigId(null);
      }

      setSelectedConfigId('default');
      await loadSettingsAndConfigs();
      setSaveResult({ status: 'success', message: 'Profile deleted successfully.' });
      setTimeout(() => setSaveResult({ status: null, message: '' }), 4000);
    } catch (err: any) {
      console.error(err);
      setSaveResult({ status: 'error', message: err.message || 'Failed to delete profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let val: any = value;
    if (type === 'checkbox') {
      val = (e.target as HTMLInputElement).checked;
    } else if (
      name === 'top_k' ||
      name === 'vector_dimension' ||
      name === 'rerank_candidate_limit'
    ) {
      val = value ? Number(value) : undefined;
    } else if (name === 'min_score' || name === 'temperature') {
      val = value ? parseFloat(value) : undefined;
    }

    setSettings((prev: any) => ({
      ...prev,
      [name]: val,
    }));
  };

  // Submit main form: opens selection dialog modal
  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedConfigId !== 'default') {
      setSaveActionType('update');
    } else {
      setSaveActionType('new');
    }
    setShowSaveDialog(true);
  };

  // Commit save action from dialog choices
  const handleExecuteSave = async () => {
    setSaving(true);
    setSaveResult({ status: null, message: '' });
    setShowSaveDialog(false);

    try {
      if (saveActionType === 'update' && selectedConfigId !== 'default') {
        // Save current configurations settings payload
        await api.updateRetrievalConfig(Number(selectedConfigId), {
          settings: {
            llm_provider: settings.llm_provider,
            llm_model: settings.llm_model,
            llm_base_url: settings.llm_base_url,
            llm_api_key: settings.llm_api_key,
            temperature: settings.temperature !== undefined ? settings.temperature : 0.7,
            embedding_provider: settings.embedding_provider,
            embedding_model: settings.embedding_model,
            vector_dimension: settings.vector_dimension,
            approach: settings.approach,
            top_k: settings.top_k,
            min_score: settings.min_score,
            enable_reranking: settings.enable_reranking,
            rerank_provider: settings.rerank_provider,
            rerank_model: settings.rerank_model,
            rerank_candidate_limit: settings.rerank_candidate_limit,
          }
        });
        setSaveResult({ status: 'success', message: 'Profile updated successfully!' });
      } 
      else if (saveActionType === 'new') {
        if (!newProfileName.trim()) {
          throw new Error('Profile name is required');
        }
        const newCfg = await api.createRetrievalConfig({
          name: newProfileName.trim(),
          description: newProfileDesc.trim() || undefined,
          settings: {
            llm_provider: settings.llm_provider,
            llm_model: settings.llm_model,
            llm_base_url: settings.llm_base_url,
            llm_api_key: settings.llm_api_key,
            temperature: settings.temperature !== undefined ? settings.temperature : 0.7,
            embedding_provider: settings.embedding_provider,
            embedding_model: settings.embedding_model,
            vector_dimension: settings.vector_dimension,
            approach: settings.approach,
            top_k: settings.top_k,
            min_score: settings.min_score,
            enable_reranking: settings.enable_reranking,
            rerank_provider: settings.rerank_provider,
            rerank_model: settings.rerank_model,
            rerank_candidate_limit: settings.rerank_candidate_limit,
          }
        });

        // Set as active company settings too
        await api.updateCompanySettings({
          active_config_id: newCfg.id
        }, selectedCustomerId || undefined);

        setNewProfileName('');
        setNewProfileDesc('');
        await loadSettingsAndConfigs();
        setSelectedConfigId(String(newCfg.id));
        setSaveResult({ status: 'success', message: 'New profile created and set as default active config!' });
      } 
      else if (saveActionType === 'default') {
        // Direct save to Company Settings fallback defaults
        await api.updateCompanySettings(settings, selectedCustomerId || undefined);
        setSaveResult({ status: 'success', message: 'Company settings saved successfully!' });
      }
      setTimeout(() => setSaveResult({ status: null, message: '' }), 4000);
    } catch (err: any) {
      console.error(err);
      setSaveResult({ status: 'error', message: err.message || 'Failed to execute settings save.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult({ status: null, message: '' });
    setExpandedSteps({});

    // Set 11 steps to 'pending' initially
    const initialSteps = [
      { step: 1, name: 'Configuration Parsing', status: 'pending', message: 'Pending...' },
      { step: 2, name: 'Network Reachability Check', status: 'pending', message: 'Pending...' },
      { step: 3, name: 'Credential Validation', status: 'pending', message: 'Pending...' },
      { step: 4, name: 'API Client Initialization', status: 'pending', message: 'Pending...' },
      { step: 5, name: 'Provider Model Availability Check', status: 'pending', message: 'Pending...' },
      { step: 6, name: 'Model Verification', status: 'pending', message: 'Pending...' },
      { step: 7, name: 'Prompt Preparation', status: 'pending', message: 'Pending...' },
      { step: 8, name: 'Endpoint Connection', status: 'pending', message: 'Pending...' },
      { step: 9, name: 'Request Dispatch', status: 'pending', message: 'Pending...' },
      { step: 10, name: 'Response Processing', status: 'pending', message: 'Pending...' },
      { step: 11, name: 'Content Validation', status: 'pending', message: 'Pending...' },
    ];
    setTestSteps(initialSteps);

    try {
      const res = await api.testLlmConnection({
        customer_id: selectedCustomerId || undefined,
        tenant_id: selectedCustomerId || undefined,
      });

      const finalSteps = res.steps || [];

      // Animate the progression through the steps
      for (let i = 0; i < finalSteps.length; i++) {
        setTestSteps((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, status: 'loading', message: 'Executing...' } : s,
          ),
        );

        await new Promise((resolve) => setTimeout(resolve, 250));

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
        setTestResult({
          status: 'success',
          message: res.message,
        });
      } else {
        setTestResult({
          status: 'error',
          message: res.message || 'Connection test failed.',
        });
      }
    } catch (err: any) {
      setTestResult({ status: 'error', message: err.message || 'Connection test failed.' });
      setTestSteps((prev) =>
        prev.map((s) =>
          s.status === 'pending' || s.status === 'loading'
            ? { ...s, status: 'error', message: 'Failed to complete connection execution' }
            : s,
        ),
      );
    } finally {
      setTestingConnection(false);
    }
  };

  const getActiveConfigName = () => {
    if (selectedConfigId === 'default') return 'Base Company Settings';
    const cfg = savedConfigs.find((c) => String(c.id) === selectedConfigId);
    return cfg ? cfg.name : 'Unknown Configuration Profile';
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 text-sm">Loading configurations...</div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header controls */}
      <div className="border-b border-gray-250 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                className="text-lg font-bold text-black border border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:border-blue-500 bg-white"
                autoFocus
              />
              <button
                type="button"
                onClick={handleRenameConfig}
                className="p-1 hover:bg-gray-150 rounded text-green-600"
              >
                <CheckCircle className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setIsEditingName(false)}
                className="p-1 hover:bg-gray-150 rounded text-red-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <h2 className="text-xl font-extrabold text-black flex items-center gap-2 group">
              {getActiveConfigName()}
              {selectedConfigId !== 'default' && (
                <button
                  type="button"
                  onClick={() => {
                    setEditNameValue(getActiveConfigName());
                    setIsEditingName(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600 rounded cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              {activeConfigId === selectedConfigId && (
                <span className="text-[10px] font-extrabold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Active Defaults
                </span>
              )}
            </h2>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Manage configuration profiles and global default fallbacks for model execution.
          </p>
        </div>

        {/* Profile Preset Selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-gray-500 uppercase">Profile Preset:</span>
          <select
            value={selectedConfigId}
            onChange={(e) => handleConfigChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs bg-white text-black font-semibold focus:outline-none focus:border-blue-500 cursor-pointer min-w-[200px]"
          >
            <option value="default">Base Fallback Defaults</option>
            {savedConfigs.map((cfg) => (
              <option key={cfg.id} value={String(cfg.id)}>
                {cfg.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setNewProfileName('New Configuration Profile');
              setNewProfileDesc('');
              setSaveActionType('new');
              setShowSaveDialog(true);
            }}
            className="px-3 py-1.5 bg-blue-650 hover:bg-blue-700 text-white font-extrabold rounded-lg text-xs transition-colors cursor-pointer"
          >
            + Create New Profile
          </button>

          {selectedConfigId !== 'default' && (
            <>
              {activeConfigId !== selectedConfigId && (
                <button
                  type="button"
                  onClick={handleSetActiveProfile}
                  className="px-3 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Set as Active default
                </button>
              )}
              <button
                type="button"
                onClick={handleDeleteConfig}
                className="p-2 border border-red-200 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"
                title="Delete preset profile"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {userRole === 'system_admin' && (
        <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-xs flex items-center gap-4">
          <span className="text-xs font-bold text-gray-700 uppercase">Selected Tenant:</span>
          <select
            value={selectedCustomerId || ''}
            onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : null)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500 cursor-pointer min-w-[240px]"
          >
            <option value="">Select a company...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.domain})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Form Settings */}
        <form
          onSubmit={handleSaveClick}
          className="col-span-2 space-y-6 bg-white border border-gray-200 p-6 rounded-xl shadow-xs"
        >
          {/* LLM Gateway Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-1.5 border-gray-100 flex items-center justify-between">
              <span>External LLM Configuration</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <label className="text-xs font-semibold text-gray-900">LLM Provider</label>
                  <Tooltip
                    content="Choose the LLM API provider. vLLM uses an OpenAI-compatible interface; Ollama is for local inference; OpenAI API is cloud-hosted."
                    position="top"
                    className="whitespace-normal max-w-xs text-left font-normal"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help transition-colors" />
                  </Tooltip>
                </div>
                <select
                  name="llm_provider"
                  value={settings.llm_provider || ''}
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
                    content="The identifier of the LLM to use (e.g. meta-llama/Llama-3.1-8B-Instruct, llama3, gpt-4o)."
                    position="top"
                    className="whitespace-normal max-w-xs text-left font-normal"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help transition-colors" />
                  </Tooltip>
                </div>
                <input
                  type="text"
                  name="llm_model"
                  placeholder="e.g. meta-llama/Llama-3.1-8B-Instruct (vLLM) or llama3 (Ollama) or gpt-4o (OpenAI)"
                  value={settings.llm_model || ''}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1 col-span-2">
                <div className="flex items-center gap-1">
                  <label className="text-xs font-semibold text-gray-900">Base URL</label>
                  <Tooltip
                    content="API endpoint URL for LLM requests (e.g., http://localhost:8001/v1 or https://api.openai.com/v1)."
                    position="top"
                    className="whitespace-normal max-w-xs text-left font-normal"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help transition-colors" />
                  </Tooltip>
                </div>
                <input
                  type="text"
                  name="llm_base_url"
                  placeholder="e.g. http://localhost:8001/v1 (vLLM) or http://localhost:11434 (Ollama) or https://api.openai.com/v1"
                  value={settings.llm_base_url || ''}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1 col-span-2">
                <div className="flex items-center gap-1">
                  <label className="text-xs font-semibold text-gray-900">API Key / Token</label>
                  <Tooltip
                    content="Authentication token for the API. Enter EMPTY if no key is needed for your endpoint (common in local setups like vLLM or Ollama)."
                    position="top"
                    className="whitespace-normal max-w-xs text-left font-normal"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help transition-colors" />
                  </Tooltip>
                </div>
                <input
                  type="password"
                  name="llm_api_key"
                  placeholder="Provide API key/token, or enter EMPTY if none required"
                  value={settings.llm_api_key || ''}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <label className="text-xs font-semibold text-gray-900">Temperature</label>
                  <Tooltip
                    content="Controls randomness of completion output. Closer to 0 is analytical and deterministic, closer to 1 is creative."
                    position="top"
                    className="whitespace-normal max-w-xs text-left font-normal"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help transition-colors" />
                  </Tooltip>
                </div>
                <input
                  type="number"
                  name="temperature"
                  min="0.0"
                  max="1.0"
                  step="0.1"
                  placeholder="e.g. 0.7"
                  value={settings.temperature !== undefined ? settings.temperature : 0.7}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Embeddings Section */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-1.5 border-gray-100 flex items-center justify-between">
              <span>Embedding Model Configuration</span>
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <label className="text-xs font-semibold text-gray-900">Provider</label>
                  <Tooltip
                    content="Provider of vector embedding model. Ollama is standard for self-hosted setup; OpenAI is cloud-based."
                    position="top"
                    className="whitespace-normal max-w-xs text-left font-normal"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-655 cursor-help transition-colors" />
                  </Tooltip>
                </div>
                <select
                  name="embedding_provider"
                  value={settings.embedding_provider || ''}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500 cursor-pointer font-sans"
                >
                  <option value="ollama">Ollama</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <label className="text-xs font-semibold text-gray-900">Embedding Model</label>
                  <Tooltip
                    content="Model name used to generate document/query embeddings (e.g. nomic-embed-text for Ollama, text-embedding-3-small for OpenAI)."
                    position="top"
                    className="whitespace-normal max-w-xs text-left font-normal"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help transition-colors" />
                  </Tooltip>
                </div>
                <input
                  type="text"
                  name="embedding_model"
                  placeholder="e.g. nomic-embed-text or text-embedding-3-small"
                  value={settings.embedding_model || ''}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <label className="text-xs font-semibold text-gray-900">Vector Dimension</label>
                  <Tooltip
                    content="Length of the generated embedding vector. Must match model specifications (e.g., 768 for nomic-embed-text, 1536 for OpenAI's text-embedding-3-small)."
                    position="top"
                    className="whitespace-normal max-w-xs text-left font-normal"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help transition-colors" />
                  </Tooltip>
                </div>
                <input
                  type="number"
                  name="vector_dimension"
                  placeholder="e.g. 768 or 1536"
                  value={settings.vector_dimension || ''}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* RAG Default Settings */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-1.5 border-gray-100">
              Search & RAG Pipeline Settings
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <label className="text-xs font-semibold text-gray-900">Retrieval Approach</label>
                  <Tooltip
                    content="Method used to query documents. Hybrid fuses semantic vector search and keyword match (BM25) using Reciprocal Rank Fusion (RRF) for best recall."
                    position="top"
                    className="whitespace-normal max-w-xs text-left font-normal"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help transition-colors" />
                  </Tooltip>
                </div>
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
                <div className="flex items-center gap-1">
                  <label className="text-xs font-semibold text-gray-900">
                    Default Top K Chunks
                  </label>
                  <Tooltip
                    content="Maximum number of document chunks retrieved and passed to the LLM context window (between 1 and 50)."
                    position="top"
                    className="whitespace-normal max-w-xs text-left font-normal"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help transition-colors" />
                  </Tooltip>
                </div>
                <input
                  type="number"
                  name="top_k"
                  min={1}
                  max={50}
                  placeholder="e.g. 5"
                  value={settings.top_k || ''}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <label className="text-xs font-semibold text-gray-900">
                    Min Similarity Score
                  </label>
                  <Tooltip
                    content="Minimum semantic similarity score (0.0 to 1.0) required to retrieve a chunk. Higher values prevent unrelated text chunks from loading."
                    position="top"
                    className="whitespace-normal max-w-xs text-left font-normal"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help transition-colors" />
                  </Tooltip>
                </div>
                <input
                  type="number"
                  name="min_score"
                  step="0.05"
                  min="0.0"
                  max="1.0"
                  placeholder="e.g. 0.65"
                  value={settings.min_score || ''}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Reranker Toggles */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-150 space-y-4">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase select-none cursor-pointer">
                  <input
                    type="checkbox"
                    name="enable_reranking"
                    checked={!!settings.enable_reranking}
                    onChange={handleChange}
                    className="rounded border-gray-350 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  Enable Context Reranking
                </label>
                <Tooltip
                  content="Re-rank the retrieved chunks using a cross-encoder model to put the most relevant context at the beginning of the prompt."
                  position="top"
                  className="whitespace-normal max-w-xs text-left font-normal normal-case"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help transition-colors" />
                </Tooltip>
              </div>

              {settings.enable_reranking && (
                <div className="grid grid-cols-3 gap-4 pt-1 animate-fade-in">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <label className="text-xs font-semibold text-gray-700">
                        Reranker Provider
                      </label>
                      <Tooltip
                        content="Provider supplying the reranking/cross-encoder model."
                        position="top"
                        className="whitespace-normal max-w-xs text-left font-normal"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help transition-colors" />
                      </Tooltip>
                    </div>
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
                    <div className="flex items-center gap-1">
                      <label className="text-xs font-semibold text-gray-700">Reranker Model</label>
                      <Tooltip
                        content="Cross-encoder model name used for reranking (e.g., qwen3.5:0.8b)."
                        position="top"
                        className="whitespace-normal max-w-xs text-left font-normal"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help transition-colors" />
                      </Tooltip>
                    </div>
                    <input
                      type="text"
                      name="rerank_model"
                      placeholder="e.g. qwen3.5:0.8b"
                      value={settings.rerank_model || 'qwen3.5:0.8b'}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <label className="text-xs font-semibold text-gray-700">
                        Rerank Candidates Limit
                      </label>
                      <Tooltip
                        content="Number of candidate chunks to fetch initially before reranking down to Top K (e.g. fetch 15, rerank, keep top 5)."
                        position="top"
                        className="whitespace-normal max-w-xs text-left font-normal"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help transition-colors" />
                      </Tooltip>
                    </div>
                    <input
                      type="number"
                      name="rerank_candidate_limit"
                      min={1}
                      max={100}
                      placeholder="e.g. 15"
                      value={settings.rerank_candidate_limit || ''}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between border-t pt-4 border-gray-100">
            {saveResult.status && (
              <div
                className={`text-xs font-semibold px-3 py-1 rounded-lg ${
                  saveResult.status === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {saveResult.message}
              </div>
            )}
            <div className="flex gap-2 ml-auto">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg text-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                💾 Save Configuration Settings
              </button>
            </div>
          </div>
        </form>

        {/* Validation & Sidebar */}
        <div className="space-y-6 col-span-1">
          
          {/* Connection Test Card */}
          <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <FlaskRound className="w-4 h-4 text-blue-600" />
              Gateway Connection Diagnostic
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Test endpoint reachability and execute a live prompt completion check.
            </p>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConnection || !settings.llm_base_url}
              className="w-full py-2.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 font-semibold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              {testingConnection && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Test settings connection
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

            {/* Diagnostic collapsible execution steps */}
            {testSteps.length > 0 && (
              <div className="border-t pt-4 border-gray-100 space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <span>
                    Diagnostic Execution ({testSteps.filter((s) => s.status === 'success').length}
                    /11)
                  </span>
                  {testingConnection && (
                    <span className="text-blue-500 animate-pulse">Running...</span>
                  )}
                </div>
                <div className="space-y-2">
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
                              <span className="w-1.5 h-0.5 bg-gray-300 rounded-sm"></span>
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
                        className={`flex flex-col p-2.5 rounded-lg border transition-all duration-250 select-none cursor-pointer ${
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
                        <div className="flex gap-2.5 items-start justify-between">
                          <div className="flex gap-2.5 items-start min-w-0">
                            <div className="mt-0.5">{getStepIcon(step.status)}</div>
                            <span className="text-xs font-semibold truncate">
                              {step.step}. {step.name}
                            </span>
                          </div>
                          <div className="text-gray-400 shrink-0">
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </div>
                        </div>

                        {/* Collapsible content block */}
                        {isExpanded && (
                          <div className="mt-2 text-[10px] leading-normal font-mono select-text bg-slate-900 text-slate-100 border border-slate-950 p-2.5 rounded-md overflow-x-auto whitespace-pre-wrap break-all">
                            {step.message || 'No detailed log output returned for this step.'}
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

      {/* Save Settings Choice Modal Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">
                Save Configuration Choice
              </h3>
              <button
                type="button"
                onClick={() => setShowSaveDialog(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <p className="text-xs text-gray-500 leading-normal">
                How do you want to persist the current parameter configuration changes? Choose an option:
              </p>

              <div className="space-y-3">
                {selectedConfigId !== 'default' && (
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="saveAction"
                      value="update"
                      checked={saveActionType === 'update'}
                      onChange={() => setSaveActionType('update')}
                      className="mt-1 cursor-pointer w-4 h-4 text-blue-600"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-gray-800">Update Current Profile Preset</span>
                      <p className="text-[10px] text-gray-400 leading-normal">
                        Save changes directly to "{getActiveConfigName()}". Any tenant scoped to this profile gets these updates.
                      </p>
                    </div>
                  </label>
                )}

                <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="saveAction"
                    value="new"
                    checked={saveActionType === 'new'}
                    onChange={() => setSaveActionType('new')}
                    className="mt-1 cursor-pointer w-4 h-4 text-blue-600"
                  />
                  <div className="space-y-0.5 flex-1">
                    <span className="text-xs font-bold text-gray-800">Save as New Profile Preset</span>
                    <p className="text-[10px] text-gray-400 leading-normal mb-2">
                      Create a separate config file, preserving the previous configuration settings.
                    </p>

                    {saveActionType === 'new' && (
                      <div className="space-y-2 pt-1.5 border-t border-gray-100 animate-fade-in">
                        <input
                          type="text"
                          required
                          placeholder="Preset Profile Name (e.g. GPT-4o Hybrid)"
                          value={newProfileName}
                          onChange={(e) => setNewProfileName(e.target.value)}
                          className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Optional Description..."
                          value={newProfileDesc}
                          onChange={(e) => setNewProfileDesc(e.target.value)}
                          className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    )}
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="saveAction"
                    value="default"
                    checked={saveActionType === 'default'}
                    onChange={() => setSaveActionType('default')}
                    className="mt-1 cursor-pointer w-4 h-4 text-blue-600"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-gray-800">Save as Company Fallback Defaults</span>
                    <p className="text-[10px] text-gray-400 leading-normal">
                      Update the tenant's base settings. Used as standard default parameters if no preset profile is active.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-1 py-2 bg-gray-150 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteSave}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Execute Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
