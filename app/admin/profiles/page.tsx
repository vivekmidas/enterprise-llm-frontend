'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { api, BACKEND_URL, getHeaders } from '@/lib/api';
import {
  Brain,
  ChevronDown,
  ChevronRight,
  Database,
  Filter,
  Loader2,
  MessageSquare,
  Plus,
  Save,
  Search,
  Settings2,
  Star,
  Trash2,
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
  approach: 'hybrid' | 'vector' | 'keyword';
  top_k: number;
  min_score: number;
  max_context_tokens: number;
  enable_rrf: boolean;
}

interface RerankSection {
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
    approach: 'hybrid',
    top_k: 10,
    min_score: 0.65,
    max_context_tokens: 6000,
    enable_rrf: true,
  },
  reranking: {
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
  <div className="flex items-center gap-3 mb-5">
    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
      {icon}
    </div>
    <div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
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
  <div className="space-y-1">
    <label className="block text-xs font-medium text-gray-700">{label}</label>
    {children}
    {hint && <p className="text-xs text-gray-400">{hint}</p>}
  </div>
);

const TextInput = ({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
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
    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>
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
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
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
      className="w-full accent-blue-600"
    />
    <div className="flex justify-between text-xs text-gray-400">
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
}: {
  data: EmbeddingSection;
  onChange: (d: EmbeddingSection) => void;
}) => (
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
          onChange={(v) => onChange({ ...data, provider: v })}
          options={[
            { label: 'Ollama', value: 'ollama' },
            { label: 'OpenAI', value: 'openai' },
            { label: 'Azure', value: 'azure' },
          ]}
        />
      </Field>
      <Field label="Model">
        <TextInput
          value={data.model}
          onChange={(v) => onChange({ ...data, model: v })}
          placeholder="nomic-embed-text"
        />
      </Field>
    </div>
    <Field label="Endpoint URL" hint="Full URL to the embedding API">
      <TextInput
        value={data.url}
        onChange={(v) => onChange({ ...data, url: v })}
        placeholder="http://localhost:11434/api/embeddings"
      />
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

const SearchEditor = ({
  data,
  onChange,
}: {
  data: SearchSection;
  onChange: (d: SearchSection) => void;
}) => (
  <div className="space-y-4">
    <SectionHeader
      icon={<Search className="h-4 w-4" />}
      title="Search"
      subtitle="Retrieval strategy and candidate selection parameters"
    />
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

const RerankEditor = ({
  data,
  onChange,
}: {
  data: RerankSection;
  onChange: (d: RerankSection) => void;
}) => (
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
      <Field label="Reranker Endpoint URL" hint="Chat-completion endpoint used as relevance judge">
        <TextInput
          value={data.url}
          onChange={(v) => onChange({ ...data, url: v })}
          placeholder="http://localhost:11434/api/chat"
        />
      </Field>
      <Field label="Reranker Model">
        <TextInput
          value={data.model}
          onChange={(v) => onChange({ ...data, model: v })}
          placeholder="qwen3:0.6b"
        />
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

const GenerationEditor = ({
  data,
  onChange,
}: {
  data: GenerationSection;
  onChange: (d: GenerationSection) => void;
}) => (
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
          onChange={(v) => onChange({ ...data, provider: v })}
          options={[
            { label: 'Ollama', value: 'ollama' },
            { label: 'OpenAI', value: 'openai' },
            { label: 'Azure', value: 'azure' },
            { label: 'vLLM', value: 'vllm' },
          ]}
        />
      </Field>
      <Field label="Model">
        <TextInput
          value={data.model}
          onChange={(v) => onChange({ ...data, model: v })}
          placeholder="llama3.2"
        />
      </Field>
    </div>
    <Field label="Endpoint URL">
      <TextInput
        value={data.url}
        onChange={(v) => onChange({ ...data, url: v })}
        placeholder="http://localhost:11434/api/chat"
      />
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
        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition resize-none"
      />
    </Field>
    <Field label="API Key" hint="Required for OpenAI / Azure providers">
      <TextInput
        value={data.api_key || ''}
        onChange={(v) => onChange({ ...data, api_key: v || undefined })}
        placeholder="sk-..."
        type="password"
      />
    </Field>
  </div>
);

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

  useEffect(() => {
    setSettings(normalizeSettings(profile.settings));
  }, [profile.id]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 2500);
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

  return (
    <div className="flex flex-col h-full">
      {/* Profile header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-900">{profile.name}</h2>
          {profile.is_default && (
            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
              <Star className="h-3 w-3" />
              Default
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!profile.is_default && (
            <button
              onClick={setDefault}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition"
            >
              <Star className="h-3.5 w-3.5" />
              Set Default
            </button>
          )}
          <button
            onClick={deleteProfile}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-md border border-red-100 px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-100 pb-0">
        {SECTION_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition border-b-2 -mb-px ${
              activeSection === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Section editor */}
      <div className="flex-1 overflow-y-auto">
        {activeSection === 'embedding' && (
          <EmbeddingEditor
            data={settings.embedding}
            onChange={(d) => setSettings({ ...settings, embedding: d })}
          />
        )}
        {activeSection === 'search' && (
          <SearchEditor
            data={settings.search}
            onChange={(d) => setSettings({ ...settings, search: d })}
          />
        )}
        {activeSection === 'reranking' && (
          <RerankEditor
            data={settings.reranking}
            onChange={(d) => setSettings({ ...settings, reranking: d })}
          />
        )}
        {activeSection === 'generation' && (
          <GenerationEditor
            data={settings.generation}
            onChange={(d) => setSettings({ ...settings, generation: d })}
          />
        )}
      </div>

      {/* Footer */}
      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div className="text-xs">
          {error && <span className="text-red-500">{error}</span>}
          {success && <span className="text-green-600">✓ {success}</span>}
        </div>
        <button
          onClick={() => saveSection(activeSection)}
          disabled={!!savingSection}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition"
        >
          {savingSection === activeSection ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Save {activeSection}
        </button>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">New LLM Profile</h3>
        <div className="space-y-3">
          <Field label="Profile Name">
            <TextInput
              value={name}
              onChange={setName}
              placeholder="e.g. Production RAG"
            />
          </Field>
          <Field label="Description">
            <TextInput
              value={description}
              onChange={setDescription}
              placeholder="Optional description"
            />
          </Field>
          <Toggle
            checked={isDefault}
            onChange={setIsDefault}
            label="Set as tenant default"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md border border-gray-200 px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={create}
            disabled={saving || !name.trim()}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Create Profile
          </button>
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
    <div className="flex h-[calc(100vh-120px)] gap-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Sidebar — profile list */}
      <div className="w-64 flex-shrink-0 border-r border-gray-100 flex flex-col">
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-semibold text-gray-900">LLM Profiles</span>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <p className="px-4 py-3 text-xs text-red-500">{error}</p>
          ) : profiles.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Settings2 className="mx-auto h-8 w-8 text-gray-300 mb-2" />
              <p className="text-xs text-gray-400">No profiles yet</p>
            </div>
          ) : (
            profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-left transition ${
                  selectedId === p.id
                    ? 'bg-blue-50 border-r-2 border-blue-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-gray-900 truncate">{p.name}</span>
                    {p.is_default && <Star className="h-3 w-3 text-amber-500 flex-shrink-0" />}
                  </div>
                  {p.description && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{p.description}</p>
                  )}
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main — profile editor */}
      <div className="flex-1 overflow-hidden p-6">
        {selectedProfile ? (
          <ProfileEditor
            key={selectedProfile.id}
            profile={selectedProfile}
            onSaved={handleSaved}
            onDeleted={handleDeleted}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Zap className="mx-auto h-12 w-12 text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">Select a profile to configure</p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 flex items-center gap-2 mx-auto rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                Create first profile
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateProfileModal onCreated={handleCreated} onCancel={() => setShowCreate(false)} />
      )}
    </div>
  );
}
