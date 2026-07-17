'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { RefreshCw, CheckCircle, AlertTriangle, Play, HelpCircle, FlaskRound } from 'lucide-react';
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

  useEffect(() => {
    async function loadSettings() {
      if (userRole === 'system_admin' && !selectedCustomerId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const companySettings = await api.getCompanySettings(selectedCustomerId || undefined);
        setSettings((prev: any) => ({
          ...prev,
          ...companySettings,
        }));
      } catch (err) {
        console.error('Failed to load company settings', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [selectedCustomerId, userRole]);

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
    } else if (name === 'min_score') {
      val = value ? parseFloat(value) : undefined;
    }

    setSettings((prev: any) => ({
      ...prev,
      [name]: val,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveResult({ status: null, message: '' });
    try {
      await api.updateCompanySettings(settings, selectedCustomerId || undefined);
      setSaveResult({ status: 'success', message: 'Settings saved successfully!' });
      setTimeout(() => setSaveResult({ status: null, message: '' }), 4000);
    } catch (err: any) {
      console.error(err);
      setSaveResult({ status: 'error', message: err.message || 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult({ status: null, message: '' });

    // Set 11 steps to 'pending' initially
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

    try {
      const res = await api.testLlmConnection({
        customer_id: selectedCustomerId || undefined,
        tenant_id: selectedCustomerId || undefined,
      });

      const finalSteps = res.steps || [];

      // Animate the progression through the steps
      for (let i = 0; i < finalSteps.length; i++) {
        // Set current step to active/loading
        setTestSteps((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, status: 'loading', message: 'Executing...' } : s,
          ),
        );

        // Wait 250ms for visual feedback
        await new Promise((resolve) => setTimeout(resolve, 250));

        // Set the actual result of the step
        setTestSteps((prev) => prev.map((s, idx) => (idx === i ? finalSteps[i] : s)));

        // If this step failed, stop progressing the animation
        if (finalSteps[i].status === 'error') {
          // Mark all remaining steps as skipped
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

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 text-sm">Loading company configurations...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-bold text-black">Company LLM & Search Settings</h2>
        <p className="text-xs text-gray-500">
          Configure tenant-specific configurations for models, external gateway URLs, search
          defaults, and retrieval flows.
        </p>
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
          onSubmit={handleSave}
          className="col-span-2 space-y-6 bg-white border border-gray-200 p-6 rounded-xl shadow-xs"
        >
          {/* LLM Gateway Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-1.5 border-gray-100 flex items-center justify-between">
              <span>External LLM Configuration</span>
              <span className="text-[10px] text-gray-400 normal-case font-normal italic">
                Leave empty to use global default
              </span>
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500 cursor-pointer"
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
            </div>
          </div>

          {/* Embeddings Section */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-1.5 border-gray-100 flex items-center justify-between">
              <span>Embedding Model Configuration</span>
              <span className="text-[10px] text-gray-400 normal-case font-normal italic">
                Applies to new document mappings
              </span>
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
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help transition-colors" />
                  </Tooltip>
                </div>
                <select
                  name="embedding_provider"
                  value={settings.embedding_provider || ''}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500 cursor-pointer"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500 cursor-pointer"
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
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
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
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs bg-white text-black focus:outline-none focus:border-blue-500 cursor-pointer"
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
                className={`text-sm font-semibold px-3 py-1 rounded-lg ${
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
                💾 Save Configuration
              </button>
            </div>
          </div>
        </form>

        {/* Validation & Sidebar */}
        <div className="space-y-6">
          {/* Connection Test Card */}
          <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <FlaskRound className="w-4 h-4 text-blue-600" />
              Gateway Test Connection
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Test end-to-end connectivity using settings to run a text generation diagnostic
              message.
            </p>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConnection || !settings.llm_base_url}
              className="w-full py-2.5 bg-green-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              {testingConnection && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Test Settings
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

            {testSteps.length > 0 && (
              <div className="border-t pt-4 border-gray-100 space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
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
                        className={`flex gap-2.5 items-start p-2 rounded-lg border transition-all duration-200 ${
                          step.status === 'success'
                            ? 'bg-green-50/30 border-green-100 text-green-900'
                            : step.status === 'error'
                              ? 'bg-red-50/30 border-red-100 text-red-900'
                              : step.status === 'loading'
                                ? 'bg-blue-50/30 border-blue-100 text-blue-900 font-semibold'
                                : 'bg-gray-50/50 border-gray-100 text-gray-500'
                        }`}
                      >
                        <div className="mt-0.5">{getStepIcon(step.status)}</div>
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="text-xs font-semibold flex items-center gap-1.5">
                            <span>
                              {step.step}. {step.name}
                            </span>
                          </div>
                          <div
                            className={`text-[10px] truncate ${
                              step.status === 'success'
                                ? 'text-green-700/80'
                                : step.status === 'error'
                                  ? 'text-red-700/90 font-mono break-all whitespace-pre-wrap'
                                  : 'text-gray-400'
                            }`}
                          >
                            {step.message}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Placeholders System Default Card */}
          <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-gray-400" />
              System Fallbacks
            </h4>
            <div className="space-y-2 text-xs text-gray-655 leading-relaxed">
              <div className="flex justify-between border-b pb-1 border-gray-100">
                <span className="text-gray-400">Embedding:</span>
                <span className="font-semibold text-black">nomic-embed-text (768d)</span>
              </div>
              <div className="flex justify-between border-b pb-1 border-gray-100">
                <span className="text-gray-400">LLM Provider:</span>
                <span className="font-semibold text-black">Ollama (qwen:0.5b)</span>
              </div>
              <div className="flex justify-between border-b pb-1 border-gray-100">
                <span className="text-gray-400">Reranker:</span>
                <span className="font-semibold text-black">Ollama (qwen3.5:0.8b)</span>
              </div>
              <div className="flex justify-between border-b pb-1 border-gray-100">
                <span className="text-gray-400">RAG Approach:</span>
                <span className="font-semibold text-black">Hybrid Search</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 leading-normal italic">
              These properties will be used by default if your tenant configurations are left empty.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
