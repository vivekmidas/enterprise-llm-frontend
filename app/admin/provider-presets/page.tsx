'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Server,
  Layers,
  Sparkles,
  CheckCircle2,
  XCircle,
  Cpu,
  Database,
  Search,
  Sliders,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';

export interface EmbeddingModelItem {
  model: string;
  dimension: number;
}

export interface ProviderPreset {
  id: string;
  provider_key: string;
  name: string;
  display_name?: string;
  description?: string;
  base_url: string;
  chat_models: string[];
  default_chat_model?: string;
  search_endpoint?: string;
  embedding_models: EmbeddingModelItem[];
  default_embedding_model?: string;
  default_embedding_dimension?: number;
  embedding_endpoint?: string;
  rerank_models: string[];
  default_rerank_model?: string;
  rerank_endpoint?: string;
  default_temperature: number;
  default_max_tokens: number;
  api_key_header?: string;
  capability_configs?: Record<string, any>;
  is_active: boolean;
}

const EMPTY_PRESET: Omit<ProviderPreset, 'id'> = {
  provider_key: '',
  name: '',
  description: '',
  base_url: 'http://localhost:11434',
  chat_models: ['llama3.2'],
  default_chat_model: 'llama3.2',
  search_endpoint: '/api/chat',
  embedding_models: [{ model: 'nomic-embed-text', dimension: 768 }],
  default_embedding_model: 'nomic-embed-text',
  default_embedding_dimension: 768,
  embedding_endpoint: '/api/embeddings',
  rerank_models: ['qwen3:0.6b'],
  default_rerank_model: 'qwen3:0.6b',
  rerank_endpoint: '/api/chat',
  default_temperature: 0.7,
  default_max_tokens: 1024,
  api_key_header: 'Authorization',
  capability_configs: {},
  is_active: true,
};

export default function ProviderPresetsAdminTab({ userRole }: { userRole?: string | null }) {
  const isSystemAdmin = userRole === 'system_admin';
  const [presets, setPresets] = useState<ProviderPreset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [seeding, setSeeding] = useState<boolean>(false);
  const [editingPreset, setEditingPreset] = useState<Partial<ProviderPreset> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form helper strings for textareas
  const [chatModelsInput, setChatModelsInput] = useState<string>('');
  const [embeddingModelsInput, setEmbeddingModelsInput] = useState<string>('');
  const [rerankModelsInput, setRerankModelsInput] = useState<string>('');

  const fetchPresets = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminProviderPresets();
      setPresets(data || []);
    } catch (err: any) {
      console.error('Failed to fetch provider presets:', err);
      showNotification('error', err.message || 'Failed to load provider presets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresets();
  }, []);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenCreateModal = () => {
    setEditingPreset({ ...EMPTY_PRESET });
    setChatModelsInput(EMPTY_PRESET.chat_models.join('\n'));
    setEmbeddingModelsInput(
      EMPTY_PRESET.embedding_models.map((e) => `${e.model}:${e.dimension}`).join('\n')
    );
    setRerankModelsInput(EMPTY_PRESET.rerank_models.join('\n'));
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (preset: ProviderPreset) => {
    setEditingPreset({ ...preset });
    setChatModelsInput((preset.chat_models || []).join('\n'));
    setEmbeddingModelsInput(
      (preset.embedding_models || []).map((e) => `${e.model}:${e.dimension}`).join('\n')
    );
    setRerankModelsInput((preset.rerank_models || []).join('\n'));
    setIsModalOpen(true);
  };

  const handleSavePreset = async () => {
    if (!editingPreset?.name || !editingPreset?.provider_key || !editingPreset?.base_url) {
      showNotification('error', 'Provider Key, Display Name, and Base URL are required.');
      return;
    }

    setSaving(true);
    try {
      // Parse multi-line strings into lists
      const chatModels = chatModelsInput
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const embeddingModels: EmbeddingModelItem[] = embeddingModelsInput
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((line) => {
          const parts = line.split(':');
          const model = parts[0].trim();
          const dimension = parts[1] ? parseInt(parts[1].trim(), 10) || 768 : 768;
          return { model, dimension };
        });

      const rerankModels = rerankModelsInput
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        ...editingPreset,
        chat_models: chatModels,
        default_chat_model: editingPreset.default_chat_model || chatModels[0] || '',
        embedding_models: embeddingModels,
        default_embedding_model: editingPreset.default_embedding_model || embeddingModels[0]?.model || '',
        default_embedding_dimension: embeddingModels[0]?.dimension || editingPreset.default_embedding_dimension || 768,
        rerank_models: rerankModels,
        default_rerank_model: editingPreset.default_rerank_model || rerankModels[0] || '',
      };

      if (editingPreset.id) {
        await api.updateProviderPreset(editingPreset.id, payload);
        showNotification('success', `Provider preset "${payload.name}" updated successfully.`);
      } else {
        await api.createProviderPreset(payload);
        showNotification('success', `Provider preset "${payload.name}" created successfully.`);
      }

      setIsModalOpen(false);
      fetchPresets();
    } catch (err: any) {
      console.error('Failed to save provider preset:', err);
      showNotification('error', err.message || 'Failed to save provider preset.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePreset = async (preset: ProviderPreset) => {
    if (!confirm(`Are you sure you want to delete the provider preset "${preset.name}"?`)) return;
    try {
      await api.deleteProviderPreset(preset.id);
      showNotification('success', `Preset "${preset.name}" deleted.`);
      fetchPresets();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to delete preset.');
    }
  };

  const handleSeedPresets = async () => {
    if (!confirm('Re-seed standard default presets for Ollama, vLLM, OpenAI, Grok, Azure, Anthropic, Gemini?')) return;
    setSeeding(true);
    try {
      const res = await api.seedProviderPresets();
      showNotification('success', res.message || 'Standard provider presets re-seeded successfully.');
      fetchPresets();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to seed provider presets.');
    } finally {
      setSeeding(false);
    }
  };

  const filteredPresets = presets.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.provider_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 space-x-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Server className="h-6 w-6 text-bg-primary" />
            <h1 className="text-xl font-bold text-gray-900">Provider Presets & Sample Configs</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            System Admin repository of standard LLM, Embedding, and Search model presets (Ollama, vLLM, OpenAI, Grok, Gemini, etc.).
            Node & Profile properties will pre-fill from these presets without breaking existing workflows when updated.
          </p>
        </div>
        {isSystemAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSeedPresets}
              disabled={seeding}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 transition cursor-pointer"
              title="Restore standard default provider templates"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${seeding ? 'animate-spin' : ''}`} />
              {seeding ? 'Seeding...' : 'Seed Standard Defaults'}
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-blue-700 rounded-lg shadow-sm transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Provider Preset
            </button>
          </div>
        )}
      </div>

      {!isSystemAdmin && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-medium">
          <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <span>Read-Only View: System Admin permission is required to create, edit, or re-seed provider presets.</span>
        </div>
      )}

      {/* Alert Notification */}
      {notification && (
        <div
          className={`flex items-center gap-3 p-4 rounded-lg text-xs font-medium border ${notification.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Filter providers by name or key..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 text-bg-primary animate-spin" />
        </div>
      ) : filteredPresets.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-gray-200">
          <Server className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-700">No Provider Presets Found</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
            Click "Seed Standard Defaults" to automatically populate Ollama, vLLM, OpenAI, Grok, Azure, Anthropic, and Gemini standard configs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPresets.map((preset) => (
            <div
              key={preset.id}
              className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between ${preset.is_active ? 'border-gray-200' : 'border-gray-200 bg-gray-50 opacity-75'
                }`}
            >
              <div>
                {/* Card Top */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-blue-50 text-blue-700 rounded border border-blue-100">
                      {preset.provider_key}
                    </span>
                    <h3 className="text-base font-bold text-gray-900 mt-1">{preset.name}</h3>
                  </div>
                  {isSystemAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(preset)}
                        className="p-1.5 text-gray-500 hover:text-bg-primary hover:bg-blue-50 rounded-md transition"
                        title="Edit preset"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePreset(preset)}
                        className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                        title="Delete preset"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                  {preset.description || 'No description provided.'}
                </p>

                {/* Properties Overview */}
                <div className="space-y-2.5 text-xs text-gray-700">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Server className="h-3.5 w-3.5 text-gray-400" /> Base URL
                    </span>
                    <span className="font-mono text-[11px] text-gray-900 truncate max-w-[180px]">
                      {preset.base_url}
                    </span>
                  </div>

                  <div className="flex items-start justify-between border-b border-gray-100 pb-1.5">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Cpu className="h-3.5 w-3.5 text-indigo-500" /> Chat Models
                    </span>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">{preset.chat_models?.length || 0} available</span>
                      <p className="text-[10px] text-gray-500 font-mono">Default: {preset.default_chat_model || 'None'}</p>
                    </div>
                  </div>

                  <div className="flex items-start justify-between border-b border-gray-100 pb-1.5">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Database className="h-3.5 w-3.5 text-emerald-500" /> Embed Models
                    </span>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">{preset.embedding_models?.length || 0} available</span>
                      <p className="text-[10px] text-gray-500 font-mono">
                        {preset.default_embedding_model ? `${preset.default_embedding_model} (${preset.default_embedding_dimension}d)` : 'None'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start justify-between pb-1">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Search className="h-3.5 w-3.5 text-amber-500" /> Search / Rerank
                    </span>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">{preset.rerank_models?.length || 0} available</span>
                      <p className="text-[10px] text-gray-500 font-mono">Default: {preset.default_rerank_model || 'None'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                <span>Temp: {preset.default_temperature} | MaxTokens: {preset.default_max_tokens}</span>
                <span className={`flex items-center gap-1 font-medium ${preset.is_active ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {preset.is_active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {preset.is_active ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Create Modal */}
      {isModalOpen && editingPreset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-200 w-full max-w-4xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Sliders className="h-4 w-4 text-bg-primary" />
                {editingPreset.id ? `Edit Provider Preset: ${editingPreset.display_name || editingPreset.name}` : 'Create Provider Preset'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xs font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Provider Key *</label>
                  <input
                    type="text"
                    placeholder="e.g. ollama, vllm, grok, openai"
                    value={editingPreset.provider_key || ''}
                    onChange={(e) => setEditingPreset({ ...editingPreset, provider_key: e.target.value.toLowerCase().trim() })}
                    className="w-full p-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md font-mono focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Unique identifier key used by profile forms.</p>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Display Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Grok / xAI API"
                    value={editingPreset.display_name || editingPreset.name || ''}
                    onChange={(e) => setEditingPreset({ ...editingPreset, display_name: e.target.value, name: editingPreset.name || e.target.value })}
                    className="w-full p-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Base Endpoint URL *</label>
                <input
                  type="text"
                  placeholder="http://localhost:11434 or https://api.x.ai/v1"
                  value={editingPreset.base_url || ''}
                  onChange={(e) => setEditingPreset({ ...editingPreset, base_url: e.target.value })}
                  className="w-full p-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md font-mono focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Brief summary of provider endpoint"
                  value={editingPreset.description || ''}
                  onChange={(e) => setEditingPreset({ ...editingPreset, description: e.target.value })}
                  className="w-full p-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Chat Models (One per line)</label>
                  <textarea
                    rows={4}
                    placeholder="llama3.2&#10;qwen2.5-coder&#10;mistral"
                    value={chatModelsInput}
                    onChange={(e) => setChatModelsInput(e.target.value)}
                    className="w-full p-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md font-mono text-[11px]"
                  />
                  <input
                    type="text"
                    placeholder="Default Chat Model"
                    value={editingPreset.default_chat_model || ''}
                    onChange={(e) => setEditingPreset({ ...editingPreset, default_chat_model: e.target.value })}
                    className="w-full mt-2 p-1.5 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded text-[11px] font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Chat Endpoint Path (e.g. /chat/completions)"
                    value={editingPreset.search_endpoint || ''}
                    onChange={(e) => setEditingPreset({ ...editingPreset, search_endpoint: e.target.value })}
                    className="w-full mt-1.5 p-1.5 border border-gray-300 rounded text-[11px] font-mono text-blue-700 bg-blue-50/80 placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Embed Models (model:dimension)</label>
                  <textarea
                    rows={4}
                    placeholder="nomic-embed-text:768&#10;bge-m3:1024&#10;text-embedding-3-small:1536"
                    value={embeddingModelsInput}
                    onChange={(e) => setEmbeddingModelsInput(e.target.value)}
                    className="w-full p-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md font-mono text-[11px]"
                  />
                  <input
                    type="text"
                    placeholder="Default Embedding Model"
                    value={editingPreset.default_embedding_model || ''}
                    onChange={(e) => setEditingPreset({ ...editingPreset, default_embedding_model: e.target.value })}
                    className="w-full mt-2 p-1.5 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded text-[11px] font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Embed Endpoint Path (e.g. /embeddings)"
                    value={editingPreset.embedding_endpoint || ''}
                    onChange={(e) => setEditingPreset({ ...editingPreset, embedding_endpoint: e.target.value })}
                    className="w-full mt-1.5 p-1.5 border border-gray-300 rounded text-[11px] font-mono text-emerald-700 bg-emerald-50/80 placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Search / Rerank Models</label>
                  <textarea
                    rows={4}
                    placeholder="qwen3:0.6b&#10;bge-reranker-large"
                    value={rerankModelsInput}
                    onChange={(e) => setRerankModelsInput(e.target.value)}
                    className="w-full p-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md font-mono text-[11px]"
                  />
                  <input
                    type="text"
                    placeholder="Default Rerank Model"
                    value={editingPreset.default_rerank_model || ''}
                    onChange={(e) => setEditingPreset({ ...editingPreset, default_rerank_model: e.target.value })}
                    className="w-full mt-2 p-1.5 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded text-[11px] font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Rerank Endpoint Path (e.g. /rerank)"
                    value={editingPreset.rerank_endpoint || ''}
                    onChange={(e) => setEditingPreset({ ...editingPreset, rerank_endpoint: e.target.value })}
                    className="w-full mt-1.5 p-1.5 border border-gray-300 rounded text-[11px] font-mono text-amber-700 bg-amber-50/80 placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Default Temp</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingPreset.default_temperature ?? 0.7}
                    onChange={(e) => setEditingPreset({ ...editingPreset, default_temperature: parseFloat(e.target.value) })}
                    className="w-full p-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Max Tokens</label>
                  <input
                    type="number"
                    value={editingPreset.default_max_tokens ?? 1024}
                    onChange={(e) => setEditingPreset({ ...editingPreset, default_max_tokens: parseInt(e.target.value, 10) })}
                    className="w-full p-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">API Key Header</label>
                  <input
                    type="text"
                    placeholder="Authorization or api-key"
                    value={editingPreset.api_key_header || ''}
                    onChange={(e) => setEditingPreset({ ...editingPreset, api_key_header: e.target.value })}
                    className="w-full p-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editingPreset.is_active ?? true}
                  onChange={(e) => setEditingPreset({ ...editingPreset, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-bg-primary focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="font-semibold text-gray-700">
                  Active (available to users in provider selection)
                </label>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePreset}
                disabled={saving}
                className="px-4 py-2 bg-primary hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 shadow-sm transition"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editingPreset.id ? 'Update Preset' : 'Create Preset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
