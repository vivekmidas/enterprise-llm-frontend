'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { api, BACKEND_URL, getHeaders } from '@/lib/api';
import {
  AlertTriangle,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Database,
  Filter,
  FlaskRound,
  Loader2,
  Lock,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings2,
  Star,
  Trash2,
  X,
  Zap,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmbeddingSection {
  provider: string;
  url: string;
  model: string;
  dimension: number;
  api_key?: string;
}

interface SearchSection {
  provider: string;
  model: string;
  approach: 'hybrid' | 'vector' | 'keyword';
  top_k: number;
  min_score: number;
  max_context_tokens: number;
  enable_rrf: boolean;
}

interface RerankSection {
  provider: string;
  enabled: boolean;
  url: string;
  model: string;
  candidate_limit: number;
  min_score?: number | null;
}

interface GenerationSection {
  provider: string;
  url: string;
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt?: string | null;
  api_key?: string;
}

interface ProfileSettings {
  embedding: EmbeddingSection;
  search: SearchSection;
  reranking: RerankSection;
  generation: GenerationSection;
}

interface LLMProfile {
  id: number;
  name: string;
  description?: string;
  is_default: boolean;
  settings: ProfileSettings;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: ProfileSettings = {
  embedding: {
    provider: 'ollama',
    url: 'http://localhost:11434/api/embeddings',
    model: 'nomic-embed-text',
    dimension: 768,
  },
  search: {
    provider: 'ollama',
    model: 'qwen3:0.6b',
    approach: 'hybrid',
    top_k: 10,
    min_score: 0.65,
    max_context_tokens: 6000,
    enable_rrf: true,
  },
  reranking: {
    provider: 'ollama',
    enabled: false,
    url: 'http://localhost:11434/api/chat',
    model: 'qwen3:0.6b',
    candidate_limit: 20,
  },
  generation: {
    provider: 'ollama',
    url: 'http://localhost:11434/api/chat',
    model: 'llama3.2',
    temperature: 0.7,
    max_tokens: 1024,
  },
};

/** Deep-merge profile settings with defaults so missing sections don't crash editors. */
const normalizeSettings = (raw: any): ProfileSettings => ({
  embedding: { ...DEFAULT_SETTINGS.embedding, ...(raw?.embedding ?? {}) },
  search: { ...DEFAULT_SETTINGS.search, ...(raw?.search ?? {}) },
  reranking: { ...DEFAULT_SETTINGS.reranking, ...(raw?.reranking ?? {}) },
  generation: { ...DEFAULT_SETTINGS.generation, ...(raw?.generation ?? {}) },
});

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const SectionHeader = ({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
      {icon}
    </div>
    <div>
      <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">{title}</h3>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  </div>
);

const Field = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-gray-700">{label}</label>
    {children}
    {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
  </div>
);

const TextInput = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  readOnly = false,
}: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  readOnly?: boolean;
}) => (
  <input
    type={type}
    value={value}
    disabled={disabled}
    readOnly={readOnly}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none transition-colors ${
      disabled || readOnly
        ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed border-gray-200'
        : 'bg-white focus:border-blue-500'
    }`}
  />
);

const Select = ({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-gray-900 focus:outline-none focus:border-blue-500 cursor-pointer transition-colors"
  >
    {options.map((o) => (
      <option key={o.value} value={o.value} className="bg-white text-gray-800 font-normal text-xs">
        {o.label}
      </option>
    ))}
  </select>
);

const Toggle = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) => (
  <div className="flex items-center gap-2">
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-1'
        }`}
      />
    </button>
    <span className="text-xs text-gray-700">{label}</span>
  </div>
);

const SliderField = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  hint?: string;
}) => (
  <Field label={`${label}: ${value}`} hint={hint}>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full accent-blue-600 cursor-pointer"
    />
    <div className="flex justify-between text-[10px] text-gray-400 font-medium">
      <span>{min}</span>
      <span>{max}</span>
    </div>
  </Field>
);

// ---------------------------------------------------------------------------
// Section editors
// ---------------------------------------------------------------------------

const EmbeddingEditor = ({
  data,
  onChange,
  presets = [],
}: {
  data: EmbeddingSection;
  onChange: (d: EmbeddingSection) => void;
  presets?: any[];
}) => {
  const currentPreset = presets.find((p) => p.provider_key === data.provider);
  const providerOptions =
    presets.length > 0
      ? presets.map((p) => ({ label: p.name, value: p.provider_key }))
      : [
          { label: 'Ollama', value: 'ollama' },
          { label: 'OpenAI', value: 'openai' },
          { label: 'Azure', value: 'azure' },
          { label: 'vLLM', value: 'vllm' },
          { label: 'Grok / xAI', value: 'grok' },
          { label: 'Anthropic', value: 'anthropic' },
        ];

  const handleProviderChange = (newProvider: string) => {
    const preset = presets.find((p) => p.provider_key === newProvider);
    if (preset) {
      const defaultEmbed = preset.embedding_models?.[0];
      const modelName = preset.default_embedding_model || defaultEmbed?.model || data.model;
      const dim = defaultEmbed?.dimension || preset.default_embedding_dimension || data.dimension;
      const url =
        newProvider === 'ollama'
          ? `${preset.base_url.replace(/\/$/, '')}/api/embeddings`
          : preset.base_url;
      onChange({
        ...data,
        provider: newProvider,
        url: url,
        model: modelName,
        dimension: dim,
      });
    } else {
      onChange({ ...data, provider: newProvider });
    }
  };

  const handleModelChange = (newModel: string) => {
    const embedItem = currentPreset?.embedding_models?.find((m: any) => m.model === newModel);
    onChange({
      ...data,
      model: newModel,
      dimension: embedItem ? embedItem.dimension : data.dimension,
    });
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<Database className="h-4 w-4" />}
        title="Embedding"
        subtitle="Controls text-to-vector conversion during ingestion and retrieval"
      />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Provider">
          <Select
            value={data.provider}
            onChange={handleProviderChange}
            options={providerOptions}
          />
        </Field>
        <Field label="Model">
          {currentPreset?.embedding_models && currentPreset.embedding_models.length > 0 ? (
            <Select
              value={data.model}
              onChange={handleModelChange}
              options={currentPreset.embedding_models.map((m: any) => ({
                label: `${m.model} (${m.dimension}d)`,
                value: m.model,
              }))}
            />
          ) : (
            <TextInput
              value={data.model}
              onChange={(v) => onChange({ ...data, model: v })}
              placeholder="nomic-embed-text"
            />
          )}
        </Field>
      </div>
      {/* BLOCK COMMENT: READ-ONLY PROVIDER BASE URL */}
      <Field
        label="Endpoint URL"
        hint="Configured by System Admin (Provider Preset Base URL)"
      >
        <div className="relative flex items-center">
          <TextInput
            value={
              currentPreset
                ? `${currentPreset.base_url.replace(/\/$/, '')}${currentPreset.embedding_endpoint || '/api/embeddings'}`
                : data.url
            }
            onChange={(v) => onChange({ ...data, url: v })}
            placeholder="http://localhost:11434/api/embeddings"
            readOnly
          />
          <div className="absolute right-2.5 flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-200/80 px-2 py-0.5 rounded">
            <Lock className="w-3 h-3 text-gray-500" />
            <span>Read-only</span>
          </div>
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Vector Dimension">
          <TextInput
            type="number"
            value={data.dimension}
            onChange={(v) => onChange({ ...data, dimension: parseInt(v) || 768 })}
            placeholder="768"
          />
        </Field>
        <Field label="API Key" hint="Leave blank for local models">
          <TextInput
            value={data.api_key || ''}
            onChange={(v) => onChange({ ...data, api_key: v || undefined })}
            placeholder="sk-..."
            type="password"
          />
        </Field>
      </div>
    </div>
  );
};

const SearchEditor = ({
  data,
  onChange,
  presets = [],
}: {
  data: SearchSection;
  onChange: (d: SearchSection) => void;
  presets?: any[];
}) => {
  const currentPreset = presets.find((p) => p.provider_key === data.provider);
  const providerOptions =
    presets.length > 0
      ? presets.map((p) => ({ label: p.name, value: p.provider_key }))
      : [
          { label: 'Ollama', value: 'ollama' },
          { label: 'OpenAI', value: 'openai' },
          { label: 'Azure', value: 'azure' },
          { label: 'vLLM', value: 'vllm' },
          { label: 'Grok / xAI', value: 'grok' },
          { label: 'Anthropic', value: 'anthropic' },
        ];

  const handleProviderChange = (newProvider: string) => {
    const preset = presets.find((p) => p.provider_key === newProvider);
    if (preset) {
      const modelName = preset.default_rerank_model || preset.rerank_models?.[0] || data.model;
      onChange({
        ...data,
        provider: newProvider,
        model: modelName,
      });
    } else {
      onChange({ ...data, provider: newProvider });
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<Search className="h-4 w-4" />}
        title="Search"
        subtitle="Retrieval strategy and candidate selection parameters"
      />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Provider">
          <Select
            value={data.provider || 'ollama'}
            onChange={handleProviderChange}
            options={providerOptions}
          />
        </Field>
        <Field label="Model">
          {currentPreset?.rerank_models && currentPreset.rerank_models.length > 0 ? (
            <Select
              value={data.model || ''}
              onChange={(v) => onChange({ ...data, model: v })}
              options={currentPreset.rerank_models.map((m: string) => ({
                label: m,
                value: m,
              }))}
            />
          ) : (
            <TextInput
              value={data.model || ''}
              onChange={(v) => onChange({ ...data, model: v })}
              placeholder="qwen3:0.6b"
            />
          )}
        </Field>
      </div>
      <Field label="Search Approach" hint="Hybrid combines vector + keyword (BM25) with RRF fusion">
        <Select
          value={data.approach}
          onChange={(v) => onChange({ ...data, approach: v as SearchSection['approach'] })}
          options={[
            { label: 'Hybrid (Vector + Keyword)', value: 'hybrid' },
            { label: 'Vector only (semantic)', value: 'vector' },
            { label: 'Keyword only (BM25)', value: 'keyword' },
          ]}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Top K Chunks" hint="Candidates returned after retrieval">
          <TextInput
            type="number"
            value={data.top_k}
            onChange={(v) => onChange({ ...data, top_k: parseInt(v) || 10 })}
            placeholder="10"
          />
        </Field>
        <Field label="Max Context Tokens">
          <TextInput
            type="number"
            value={data.max_context_tokens}
            onChange={(v) => onChange({ ...data, max_context_tokens: parseInt(v) || 6000 })}
            placeholder="6000"
          />
        </Field>
      </div>
      <SliderField
        label="Min Score Threshold"
        value={data.min_score}
        min={0}
        max={1}
        step={0.05}
        onChange={(v) => onChange({ ...data, min_score: v })}
        hint="Chunks below this score are discarded"
      />
      <Toggle
        checked={data.enable_rrf}
        onChange={(v) => onChange({ ...data, enable_rrf: v })}
        label="Enable Reciprocal Rank Fusion (RRF) for result merging"
      />
    </div>
  );
};

const RerankEditor = ({
  data,
  onChange,
  presets = [],
}: {
  data: RerankSection;
  onChange: (d: RerankSection) => void;
  presets?: any[];
}) => {
  const currentPreset =
    presets.find((p) => p.provider_key === data.provider) ||
    presets.find((p) => p.rerank_models?.includes(data.model)) ||
    presets[0];

  const providerOptions =
    presets.length > 0
      ? presets.map((p) => ({ label: p.name, value: p.provider_key }))
      : [
          { label: 'Ollama', value: 'ollama' },
          { label: 'OpenAI', value: 'openai' },
          { label: 'Azure', value: 'azure' },
          { label: 'vLLM', value: 'vllm' },
          { label: 'Grok / xAI', value: 'grok' },
          { label: 'Anthropic', value: 'anthropic' },
        ];

  const handleProviderChange = (newProvider: string) => {
    const preset = presets.find((p) => p.provider_key === newProvider);
    if (preset) {
      const modelName = preset.default_rerank_model || preset.rerank_models?.[0] || data.model;
      const url =
        newProvider === 'ollama'
          ? `${preset.base_url.replace(/\/$/, '')}/api/chat`
          : preset.base_url;
      onChange({
        ...data,
        provider: newProvider,
        url: url,
        model: modelName,
      });
    } else {
      onChange({ ...data, provider: newProvider });
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<Filter className="h-4 w-4" />}
        title="Reranking"
        subtitle="LLM-based relevance reordering of retrieved candidates"
      />
      <Toggle
        checked={data.enabled}
        onChange={(v) => onChange({ ...data, enabled: v })}
        label="Enable reranking"
      />
      <div
        className={`space-y-4 transition-opacity ${data.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Provider">
            <Select
              value={data.provider || 'ollama'}
              onChange={handleProviderChange}
              options={providerOptions}
            />
          </Field>
          <Field label="Reranker Model">
            {currentPreset?.rerank_models && currentPreset.rerank_models.length > 0 ? (
              <Select
                value={data.model}
                onChange={(v) => onChange({ ...data, model: v })}
                options={currentPreset.rerank_models.map((m: string) => ({ label: m, value: m }))}
              />
            ) : (
              <TextInput
                value={data.model}
                onChange={(v) => onChange({ ...data, model: v })}
                placeholder="qwen3:0.6b"
              />
            )}
          </Field>
        </div>
        {/* BLOCK COMMENT: READ-ONLY PROVIDER BASE URL */}
        <Field label="Reranker Endpoint URL" hint="Configured by System Admin (Provider Preset Base URL)">
          <div className="relative flex items-center">
            <TextInput
              value={
                currentPreset
                  ? `${currentPreset.base_url.replace(/\/$/, '')}${currentPreset.rerank_endpoint || '/api/chat'}`
                  : data.url
              }
              onChange={(v) => onChange({ ...data, url: v })}
              placeholder="http://localhost:11434/api/chat"
              readOnly
            />
            <div className="absolute right-2.5 flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-200/80 px-2 py-0.5 rounded">
              <Lock className="w-3 h-3 text-gray-500" />
              <span>Read-only</span>
            </div>
          </div>
        </Field>
        <Field label="Candidate Limit" hint="How many chunks to pass to the reranker">
          <TextInput
            type="number"
            value={data.candidate_limit}
            onChange={(v) => onChange({ ...data, candidate_limit: parseInt(v) || 20 })}
            placeholder="20"
          />
        </Field>
      </div>
    </div>
  );
};

const GenerationEditor = ({
  data,
  onChange,
  presets = [],
}: {
  data: GenerationSection;
  onChange: (d: GenerationSection) => void;
  presets?: any[];
}) => {
  const currentPreset = presets.find((p) => p.provider_key === data.provider);
  const providerOptions =
    presets.length > 0
      ? presets.map((p) => ({ label: p.name, value: p.provider_key }))
      : [
          { label: 'Ollama', value: 'ollama' },
          { label: 'OpenAI', value: 'openai' },
          { label: 'Azure', value: 'azure' },
          { label: 'vLLM', value: 'vllm' },
          { label: 'Grok / xAI', value: 'grok' },
          { label: 'Anthropic', value: 'anthropic' },
        ];

  const handleProviderChange = (newProvider: string) => {
    const preset = presets.find((p) => p.provider_key === newProvider);
    if (preset) {
      const modelName = preset.default_chat_model || preset.chat_models?.[0] || data.model;
      const url =
        newProvider === 'ollama'
          ? `${preset.base_url.replace(/\/$/, '')}/api/chat`
          : preset.base_url;
      onChange({
        ...data,
        provider: newProvider,
        url: url,
        model: modelName,
        temperature: preset.default_temperature ?? data.temperature,
        max_tokens: preset.default_max_tokens ?? data.max_tokens,
      });
    } else {
      onChange({ ...data, provider: newProvider });
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<MessageSquare className="h-4 w-4" />}
        title="Generation"
        subtitle="LLM used to synthesize the final answer from retrieved context"
      />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Provider">
          <Select
            value={data.provider}
            onChange={handleProviderChange}
            options={providerOptions}
          />
        </Field>
        <Field label="Model">
          {currentPreset?.chat_models && currentPreset.chat_models.length > 0 ? (
            <Select
              value={data.model}
              onChange={(v) => onChange({ ...data, model: v })}
              options={currentPreset.chat_models.map((m: string) => ({ label: m, value: m }))}
            />
          ) : (
            <TextInput
              value={data.model}
              onChange={(v) => onChange({ ...data, model: v })}
              placeholder="llama3.2"
            />
          )}
        </Field>
      </div>
      {/* BLOCK COMMENT: READ-ONLY PROVIDER BASE URL */}
      <Field label="Endpoint URL" hint="Configured by System Admin (Provider Preset Base URL)">
        <div className="relative flex items-center">
          <TextInput
            value={
              currentPreset
                ? `${currentPreset.base_url.replace(/\/$/, '')}${currentPreset.search_endpoint || '/api/chat'}`
                : data.url
            }
            onChange={(v) => onChange({ ...data, url: v })}
            placeholder="http://localhost:11434/api/chat"
            readOnly
          />
          <div className="absolute right-2.5 flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-200/80 px-2 py-0.5 rounded">
            <Lock className="w-3 h-3 text-gray-500" />
            <span>Read-only</span>
          </div>
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <SliderField
          label="Temperature"
          value={data.temperature}
          min={0}
          max={2}
          step={0.1}
          onChange={(v) => onChange({ ...data, temperature: v })}
          hint="Higher = more creative"
        />
        <Field label="Max Tokens">
          <TextInput
            type="number"
            value={data.max_tokens}
            onChange={(v) => onChange({ ...data, max_tokens: parseInt(v) || 1024 })}
            placeholder="1024"
          />
        </Field>
      </div>
      <Field label="System Prompt" hint="Overrides the global system prompt for this profile">
        <textarea
          value={data.system_prompt || ''}
          onChange={(e) => onChange({ ...data, system_prompt: e.target.value || null })}
          placeholder="You are a helpful enterprise assistant..."
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-gray-900 focus:outline-none focus:border-blue-500 transition-colors resize-none"
        />
      </Field>
      <Field label="API Key" hint="Required for OpenAI / Azure / Grok / Anthropic providers">
        <TextInput
          value={data.api_key || ''}
          onChange={(v) => onChange({ ...data, api_key: v || undefined })}
          placeholder="sk-..."
          type="password"
        />
      </Field>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Profile editor panel
// ---------------------------------------------------------------------------

type SectionTab = 'embedding' | 'search' | 'reranking' | 'generation';

const SECTION_TABS: { key: SectionTab; label: string; icon: React.ReactNode }[] = [
  { key: 'embedding', label: 'Embedding', icon: <Database className="h-3.5 w-3.5" /> },
  { key: 'search', label: 'Search', icon: <Search className="h-3.5 w-3.5" /> },
  { key: 'reranking', label: 'Reranking', icon: <Filter className="h-3.5 w-3.5" /> },
  { key: 'generation', label: 'Generation', icon: <MessageSquare className="h-3.5 w-3.5" /> },
];

const ProfileEditor = ({
  profile,
  onSaved,
  onDeleted,
}: {
  profile: LLMProfile;
  onSaved: (p: LLMProfile) => void;
  onDeleted: (id: number) => void;
}) => {
  const [activeSection, setActiveSection] = useState<SectionTab>('embedding');
  const [settings, setSettings] = useState<ProfileSettings>(
    normalizeSettings(profile.settings),
  );
  const [saving, setSaving] = useState(false);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dynamic Provider Presets state
  const [providerPresets, setProviderPresets] = useState<any[]>([]);

  useEffect(() => {
    async function loadPresets() {
      try {
        const presets = await api.getProviderPresets();
        setProviderPresets(presets || []);
      } catch (err) {
        console.error('Failed to load provider presets in ProfileEditor:', err);
      }
    }
    loadPresets();
  }, []);

  // Profile Name/Desc inline editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [profileName, setProfileName] = useState(profile.name);
  const [profileDesc, setProfileDesc] = useState(profile.description || '');
  const [savingName, setSavingName] = useState(false);

  // Gateway Diagnostic Test states
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'success' | 'error' | null;
    message: string;
  }>({ status: null, message: '' });
  const [testSteps, setTestSteps] = useState<any[]>([]);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setSettings(normalizeSettings(profile.settings));
    setProfileName(profile.name);
    setProfileDesc(profile.description || '');
    setIsEditingName(false);
    setTestResult({ status: null, message: '' });
    setTestSteps([]);
    setExpandedSteps({});
  }, [profile.id, profile.name, profile.description]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 2500);
  };

  const saveProfileName = async () => {
    if (!profileName.trim()) return;
    setSavingName(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/profiles/${profile.id}`, {
        method: 'PUT',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          name: profileName.trim(),
          description: profileDesc.trim() || undefined,
        }),
      });
      if (!res.ok) {
        let msg = 'Failed to update profile name';
        try {
          const text = await res.text();
          const data = JSON.parse(text);
          msg = data.detail || data.message || msg;
        } catch {
          msg = `${res.status} ${res.statusText}`;
        }
        throw new Error(msg);
      }
      const updated: LLMProfile = await res.json();
      onSaved(updated);
      setIsEditingName(false);
      showSuccess('Profile updated');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingName(false);
    }
  };

  const saveSection = async (section: SectionTab) => {
    setSavingSection(section);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/profiles/${profile.id}/${section}`, {
        method: 'PATCH',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(settings[section]),
      });
      if (!res.ok) {
        let msg = 'Failed to save section';
        try {
          const text = await res.text();
          const data = JSON.parse(text);
          msg = data.detail || data.message || msg;
        } catch {
          msg = `${res.status} ${res.statusText}`;
        }
        throw new Error(msg);
      }
      const updated: LLMProfile = await res.json();
      onSaved(updated);
      showSuccess(`${section} saved`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingSection(null);
    }
  };

  const setDefault = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/profiles/${profile.id}/set-default`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (!res.ok) {
        let msg = 'Failed to set default profile';
        try {
          const text = await res.text();
          const data = JSON.parse(text);
          msg = data.detail || data.message || msg;
        } catch {
          msg = `${res.status} ${res.statusText}`;
        }
        throw new Error(msg);
      }
      const updated: LLMProfile = await res.json();
      onSaved(updated);
      showSuccess('Set as tenant default');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteProfile = async () => {
    if (!confirm(`Delete profile "${profile.name}"?`)) return;
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/profiles/${profile.id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!res.ok && res.status !== 204) {
        let msg = 'Failed to delete profile';
        try {
          const text = await res.text();
          const data = JSON.parse(text);
          msg = data.detail || data.message || msg;
        } catch {
          msg = `${res.status} ${res.statusText}`;
        }
        throw new Error(msg);
      }
      onDeleted(profile.id);
    } catch (e: any) {
      setError(e.message);
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
      { step: 5, name: 'Provider Model Availability Check', status: 'pending', message: 'Pending...' },
      { step: 6, name: 'Model Verification', status: 'pending', message: 'Pending...' },
      { step: 7, name: 'Prompt Preparation', status: 'pending', message: 'Pending...' },
      { step: 8, name: 'Endpoint Connection', status: 'pending', message: 'Pending...' },
      { step: 9, name: 'Request Dispatch', status: 'pending', message: 'Pending...' },
      { step: 10, name: 'Response Processing', status: 'pending', message: 'Pending...' },
      { step: 11, name: 'Content Validation', status: 'pending', message: 'Pending...' },
    ];
    setTestSteps(initialSteps);

    const testPayload: any = {
      config_id: profile.id,
      llm_profile_id: profile.id,
      llm_provider: settings.generation.provider,
      llm_model: settings.generation.model,
      llm_base_url: settings.generation.url,
      llm_api_key: settings.generation.api_key || '',
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

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Header Row */}
      <div className="p-4 border-b border-gray-200 bg-gray-50/30 flex items-center justify-between shrink-0">
        {isEditingName ? (
          <div className="flex items-center gap-2 flex-1 max-w-lg">
            <div className="flex flex-col gap-1.5 flex-1">
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Profile Name"
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-800 bg-white focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <input
                type="text"
                value={profileDesc}
                onChange={(e) => setProfileDesc(e.target.value)}
                placeholder="Optional description"
                className="border border-gray-300 rounded-lg px-3 py-1 text-xs text-gray-600 bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={saveProfileName}
              disabled={savingName || !profileName.trim()}
              className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
              title="Save name"
            >
              {savingName ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => {
                setIsEditingName(false);
                setProfileName(profile.name);
                setProfileDesc(profile.description || '');
              }}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition cursor-pointer"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-gray-800">{profile.name}</h3>
              <button
                onClick={() => setIsEditingName(true)}
                className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                title="Edit Profile Name"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              {profile.is_default && (
                <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                  Default
                </span>
              )}
            </div>
            {profile.description && (
              <p className="text-xs text-gray-500 mt-0.5">{profile.description}</p>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          {!profile.is_default && (
            <button
              onClick={setDefault}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <Star className="w-3.5 h-3.5" />
              Set Default
            </button>
          )}
          <button
            onClick={deleteProfile}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Profile
          </button>
        </div>
      </div>

      {/* Main Content Grid: Left Editor + Right Diagnostic Panel */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Column: Section tabs, editor, save button */}
        <div className="flex-1 flex flex-col min-w-0 p-4 overflow-hidden border-r border-gray-200">
          {/* Section tabs */}
          <div className="flex gap-1.5 mb-4 border-b border-gray-200 pb-3 shrink-0">
            {SECTION_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  activeSection === tab.key
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Section editor */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {activeSection === 'embedding' && (
              <EmbeddingEditor
                data={settings.embedding}
                onChange={(d) => setSettings({ ...settings, embedding: d })}
                presets={providerPresets}
              />
            )}
            {activeSection === 'search' && (
              <SearchEditor
                data={settings.search}
                onChange={(d) => setSettings({ ...settings, search: d })}
                presets={providerPresets}
              />
            )}
            {activeSection === 'reranking' && (
              <RerankEditor
                data={settings.reranking}
                onChange={(d) => setSettings({ ...settings, reranking: d })}
                presets={providerPresets}
              />
            )}
            {activeSection === 'generation' && (
              <GenerationEditor
                data={settings.generation}
                onChange={(d) => setSettings({ ...settings, generation: d })}
                presets={providerPresets}
              />
            )}
          </div>

          {/* Footer with Save Button - ALWAYS VISIBLE */}
          <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between shrink-0 bg-white">
            <div className="text-xs font-semibold">
              {error && <span className="text-red-600">{error}</span>}
              {success && <span className="text-green-600">✓ {success}</span>}
            </div>
            <button
              onClick={() => saveSection(activeSection)}
              disabled={!!savingSection}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-sm transition-colors cursor-pointer disabled:opacity-60"
            >
              {savingSection === activeSection ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save {SECTION_TABS.find((t) => t.key === activeSection)?.label} Settings
            </button>
          </div>
        </div>

        {/* Right Column: Diagnostic Panel */}
        <div className="w-[340px] shrink-0 p-4 overflow-y-auto bg-slate-50/20">
          <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <FlaskRound className="w-4 h-4 text-blue-600" />
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
              <div className="border-t pt-3 border-gray-100 space-y-2 max-h-[420px] overflow-y-auto pr-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <span>
                    Execution Steps ({testSteps.filter((s) => s.status === 'success').length}/11)
                  </span>
                  {testingConnection && <span className="text-blue-500 animate-pulse">Running...</span>}
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
                          return <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0" />;
                        case 'skipped':
                          return (
                            <div className="w-3.5 h-3.5 rounded-full border border-gray-300 flex items-center justify-center shrink-0">
                              <span className="w-1.5 h-0.5 bg-gray-300 rounded-sm" />
                            </div>
                          );
                        case 'pending':
                        default:
                          return <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 shrink-0" />;
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
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
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
    </div>
  );
};

// ---------------------------------------------------------------------------
// Create profile modal
// ---------------------------------------------------------------------------

const CreateProfileModal = ({
  onCreated,
  onCancel,
}: {
  onCreated: (p: LLMProfile) => void;
  onCancel: () => void;
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/profiles`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          is_default: isDefault,
          settings: DEFAULT_SETTINGS,
        }),
      });
      if (!res.ok) {
        let msg = 'Failed to create profile';
        try {
          const text = await res.text();
          const data = JSON.parse(text);
          msg = data.detail || data.message || msg;
        } catch {
          msg = `${res.status} ${res.statusText}`;
        }
        throw new Error(msg);
      }
      onCreated(await res.json());
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-155">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-255 flex items-center justify-between">
          <h3 className="font-bold text-gray-850 text-sm uppercase tracking-wider">
            Create LLM Profile
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 font-bold text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-655">Profile Name</label>
            <TextInput value={name} onChange={setName} placeholder="e.g. Production RAG" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-655">Description</label>
            <TextInput
              value={description}
              onChange={setDescription}
              placeholder="Optional description"
            />
          </div>
          <Toggle checked={isDefault} onChange={setIsDefault} label="Set as tenant default" />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 bg-gray-150 hover:bg-gray-200 text-gray-755 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={create}
              disabled={saving || !name.trim()}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Create Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<LLMProfile[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProfile = profiles.find((p) => p.id === selectedId) ?? null;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/profiles`, {
        headers: getHeaders(),
      });
      if (!res.ok) {
        let msg = 'Failed to fetch profiles';
        try {
          const text = await res.text();
          const data = JSON.parse(text);
          msg = data.detail || data.message || msg;
        } catch {
          msg = `${res.status} ${res.statusText}`;
        }
        throw new Error(msg);
      }
      const data: LLMProfile[] = await res.json();
      // Normalize settings for each profile to handle legacy flat format
      const normalized = data.map((p) => ({
        ...p,
        settings: normalizeSettings(p.settings),
      }));
      setProfiles(normalized);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data.find((p) => p.is_default)?.id ?? data[0].id);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaved = (updated: LLMProfile) => {
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === updated.id
          ? updated
          : updated.is_default
          ? { ...p, is_default: false }
          : p,
      ),
    );
  };

  const handleDeleted = (id: number) => {
    const remaining = profiles.filter((p) => p.id !== id);
    setProfiles(remaining);
    setSelectedId(remaining[0]?.id ?? null);
  };

  const handleCreated = (p: LLMProfile) => {
    setProfiles((prev) => [p, ...prev]);
    setSelectedId(p.id);
    setShowCreate(false);
  };

  return (
    <div className="flex bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-[750px] font-sans text-gray-800">
      {/* Left Profile Sidebar */}
      <div className="w-1/4 border-r border-gray-200 flex flex-col h-full bg-slate-50/20">
        <div className="p-4 border-b border-gray-250 bg-gray-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            LLM Profiles
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreate(true)}
              className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
              title="Create LLM Profile"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {loading ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
              Loading...
            </div>
          ) : error ? (
            <div className="p-4 text-xs text-red-500">{error}</div>
          ) : profiles.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              <Settings2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              No profiles found.
            </div>
          ) : (
            profiles.map((p) => {
              const isSelected = selectedId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`p-4 flex items-start justify-between cursor-pointer transition-all hover:bg-slate-50/80 ${
                    isSelected ? 'bg-blue-50/40 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="space-y-1.5 pr-2 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4
                        className={`font-bold text-sm ${
                          isSelected ? 'text-blue-700' : 'text-slate-800'
                        }`}
                      >
                        {p.name}
                      </h4>
                      {p.is_default && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                          Default
                        </span>
                      )}
                    </div>
                    {p.description && (
                      <p className="text-xs text-gray-555 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main LLM Profile Area */}
      {selectedProfile ? (
        <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
          <ProfileEditor
            key={selectedProfile.id}
            profile={selectedProfile}
            onSaved={handleSaved}
            onDeleted={handleDeleted}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/10">
          <Zap className="w-12 h-12 text-gray-300 mb-3" />
          <h3 className="font-semibold text-gray-700 text-sm mb-1">No LLM Profile Selected</h3>
          <p className="text-xs text-gray-400 text-center max-w-sm">
            Select or create an LLM profile on the left to configure embedding, search, reranking, and generation settings.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-sm transition-colors cursor-pointer"
          >
            Create LLM Profile
          </button>
        </div>
      )}

      {showCreate && (
        <CreateProfileModal onCreated={handleCreated} onCancel={() => setShowCreate(false)} />
      )}
    </div>
  );
}
