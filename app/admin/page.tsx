'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { api } from '@/lib/api';
import {
  Shield,
  User,
  Tag,
  Box,
  Info,
  Code2,
  Edit2,
  Save,
  Plus,
  Trash2,
  X,
  Activity,
  Bot,
  Brain,
  BrainCircuit,
  Database,
  Workflow,
  Clock,
  Fence,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  PlayCircle,
  MessageSquare,
  XCircle,
  Cloud,
  KeyRound,
  Mail,
  Megaphone,
  Network,
  UserCog,
} from 'lucide-react';

interface NodeCategory {
  id?: number;
  name: string;
  group?: string;
  label?: string;
  description?: string;
  icon?: string;
  color?: string;
}

interface AgentNode {
  id?: number | string;
  name: string;
  label: string;
  description: string;
  node_type: string;
  version: string;
  category: string;
  group: string;
  icon?: string;
  color?: string;
  badge?: string;
  sub_label?: string;
  properties: Record<string, any>;
  property_schema: any[];
}

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  shield: Shield,
  'alert-triangle': AlertTriangle,
  'user-cog': UserCog,
  'check-circle': CheckCircle,
  'play-circle': PlayCircle,
  'message-square': MessageSquare,
  'x-circle': XCircle,
  database: Database,
  workflow: Workflow,
  clock: Clock,
  fence: Fence,
  'alert-circle': AlertCircle,
  bot: Bot,
  user: User,
  info: Info,
  code: Code2,
  brain: Brain,
  'brain-circuit': BrainCircuit,
  cloud: Cloud,
  key: KeyRound,
  mail: Mail,
  megaphone: Megaphone,
  network: Network,
};

export default function AdminPage() {
  const [agents, setAgents] = useState<AgentNode[]>([]);
  const [categories, setCategories] = useState<NodeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAgent, setEditingAgent] = useState<AgentNode | null>(null);
  const [editingCategory, setEditingCategory] = useState<NodeCategory | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const [agentsRes, catsRes] = await Promise.all([
          api.getAgents(),
          api.getWorkflowCategories(),
        ]);

        // The backend returns { "nodes": [...] } for /nodes and { "categories": [...] } for /nodes/categories
        setAgents((agentsRes as any).nodes || (agentsRes as any).agents || []);

        const cats = Array.isArray(catsRes) ? catsRes : catsRes.categories || [];
        const normalizedCats = cats.map((cat: any) =>
          typeof cat === 'string' ? { name: cat } : cat,
        );
        setCategories(normalizedCats);
      } catch (error) {
        console.error('Failed to load admin data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

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
      const catsRes = await api.getWorkflowCategories();
      const cats = Array.isArray(catsRes) ? catsRes : catsRes.categories || [];
      const normalizedCats = cats.map((cat: any) =>
        typeof cat === 'string' ? { name: cat } : cat,
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
      const catsRes = await api.getWorkflowCategories();
      const cats = Array.isArray(catsRes) ? catsRes : catsRes.categories || [];
      setCategories(cats.map((cat: any) => (typeof cat === 'string' ? { name: cat } : cat)));
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const handleSaveNode = async () => {
    if (!editingAgent) return;
    try {
      if (editingAgent.id) {
        // @ts-ignore - updateNode added to api.ts
        await api.updateNode(editingAgent);
      } else {
        // @ts-ignore - createNode added to api.ts
        await api.createNode(editingAgent);
      }
      const agentsRes = await api.getAgents();
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

  const updateProperty = (key: string, value: any) => {
    setEditingAgent((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        properties: { ...prev.properties, [key]: value },
      };
    });
  };

  const updateSchema = (index: number, field: string, value: any) => {
    setEditingAgent((prev) => {
      if (!prev) return null;
      const newSchema = [...(prev.property_schema || [])];
      const oldKey = newSchema[index].key;
      newSchema[index] = { ...newSchema[index], [field]: value };

      let nextProperties = { ...prev.properties };
      // If we are renaming the 'key', migrate the value in the properties object
      if (field === 'key' && oldKey !== value) {
        nextProperties[value] = nextProperties[oldKey];
        delete nextProperties[oldKey];
      }

      return { ...prev, property_schema: newSchema, properties: nextProperties };
    });
  };

  const removeSchemaField = (index: number) => {
    setEditingAgent((prev) => {
      if (!prev) return null;
      const keyToRemove = prev.property_schema[index]?.key;
      const nextProperties = { ...prev.properties };
      if (keyToRemove) {
        delete nextProperties[keyToRemove];
      }
      const newSchema = prev.property_schema.filter((_, i) => i !== index);
      return { ...prev, property_schema: newSchema, properties: nextProperties };
    });
  };

  const addSchemaField = () => {
    setEditingAgent((prev) => {
      if (!prev) return null;
      const key = `property_${Date.now()}`;
      const newField = { key, label: 'New Property', type: 'string' };
      return {
        ...prev,
        properties: { ...prev.properties, [key]: '' },
        property_schema: [...(prev.property_schema || []), newField],
      };
    });
  };

  const renderValueInput = (field: any, value: any) => {
    const handleValChange = (v: any) => updateProperty(field.key, v);
    const commonClasses =
      'w-full bg-white border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 text-sm text-gray-900';

    if (field.type === 'boolean') {
      return (
        <select
          className={commonClasses}
          value={String(value ?? false)}
          onChange={(e) => handleValChange(e.target.value === 'true')}
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
          className={commonClasses}
          value={value ?? 0}
          onChange={(e) => handleValChange(Number(e.target.value))}
        />
      );
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          className={`${commonClasses} min-h-[60px] resize-y`}
          value={String(value ?? '')}
          placeholder="Multiline content..."
          onChange={(e) => handleValChange(e.target.value)}
        />
      );
    }

    if (field.multiple || field.type === 'list') {
      return (
        <input
          className={commonClasses}
          value={Array.isArray(value) ? value.join(', ') : String(value ?? '')}
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
        value={typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')}
        placeholder="Enter value..."
        onChange={(e) => handleValChange(e.target.value)}
      />
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <Activity className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-gray-500">Loading system registry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Registry</h1>
            <p className="mt-1 text-gray-500">
              Live view of discovered nodes, categories, and their underlying properties.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-sm border border-gray-200">
            <Shield className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-semibold text-gray-700">Admin Console</span>
          </div>
        </header>

        {/* Categories Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-800">Node Categories</h2>
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
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" /> Add Category
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: cat.color || '#3b82f6' }}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-700">{cat.label || cat.name}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{cat.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingCategory(cat);
                      setIsCategoryModalOpen(true);
                    }}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  {cat.id && (
                    <button
                      onClick={() => handleDeleteCategory(cat.id!)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Agents/Nodes Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Box className="h-5 w-5 text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-800">Available Nodes & Registry</h2>
            </div>
            <button
              onClick={() =>
                setEditingAgent({
                  name: '',
                  label: '',
                  description: '',
                  node_type: 'default',
                  version: '1.0.0',
                  category: '',
                  group: '',
                  icon: 'bot',
                  color: '#5E0CEC',
                  badge: 'Node',
                  sub_label: '',
                  properties: {},
                  property_schema: [],
                })
              }
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" /> Add Node Type
            </button>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Node Details
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Classification
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    JSON Definition
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {agents.map((agent) => {
                  const AgentIcon = (agent.icon && iconMap[agent.icon.toLowerCase()]) || Box;
                  return (
                    <tr key={agent.name} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border shadow-sm"
                            style={{
                              borderColor: agent.color ? `${agent.color}40` : '#e5e7eb',
                              backgroundColor: agent.color ? `${agent.color}10` : '#f9fafb',
                              color: agent.color || '#6b7280',
                            }}
                          >
                            <AgentIcon className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900">
                                {agent.label || agent.name}
                              </span>
                              {agent.badge && (
                                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700 border border-amber-100">
                                  {agent.node_type}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 font-mono mt-0.5">
                              {agent.name} v{agent.version} {agent.icon && `• icon: ${agent.icon}`}
                            </span>
                            {agent.sub_label && (
                              <span className="text-xs text-blue-600 font-medium mt-0.5">
                                {agent.sub_label}
                              </span>
                            )}
                            <p className="mt-2 text-sm text-gray-600 max-w-xs line-clamp-2">
                              {agent.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-wrap gap-2 pt-1">
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700 border border-blue-100 uppercase">
                            {agent.category}
                          </span>
                          <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-bold text-gray-600 border border-gray-100 uppercase">
                            {agent.group}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-h-48 w-full overflow-auto rounded-lg bg-gray-950 p-4 text-[11px] font-mono text-emerald-400 shadow-inner">
                          <pre>
                            {JSON.stringify(
                              {
                                properties: agent.properties,
                                property_schema: agent.property_schema,
                              },
                              null,
                              2,
                            )}
                          </pre>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setEditingAgent({ ...agent })}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          <Edit2 className="h-4 w-4" /> Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Edit Modal */}
        {editingAgent && (
          <div className="fixed max-w-full inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="flex h-[90vh] w-full flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between border-b bg-gray-50 px-6 py-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {editingAgent.id ? 'Edit Node Registry' : 'Create New Node Type'}
                  </h3>
                  <p className="text-xs text-gray-500 font-mono uppercase">
                    {editingAgent.id
                      ? `${editingAgent.name} v${editingAgent.version}`
                      : 'New Registry Entry'}
                  </p>
                </div>
                <button
                  onClick={() => setEditingAgent(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10">
                {/* Section: Metadata */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                      Display Label
                    </label>
                    <input
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editingAgent.label || ''}
                      onChange={(e) => setEditingAgent({ ...editingAgent, label: e.target.value })}
                      placeholder="e.g. My Custom Agent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                      System Name (Unique ID)
                    </label>
                    <input
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editingAgent.name || ''}
                      onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                      placeholder="e.g. custom_llm_agent"
                      disabled={!!editingAgent.id}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                      Version
                    </label>
                    <input
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editingAgent.version || '1.0.0'}
                      onChange={(e) => setEditingAgent({ ...editingAgent, version: e.target.value })}
                      placeholder="1.0.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                      Node Category
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editingAgent.category || ''}
                      onChange={(e) =>
                        setEditingAgent({ ...editingAgent, category: e.target.value })
                      }
                    >
                      {categories.map((cat, index) => (
                        <option key={cat.id || cat.name || `opt-${index}`} value={cat.name}>
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
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editingAgent.sub_label || ''}
                      onChange={(e) =>
                        setEditingAgent({ ...editingAgent, sub_label: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                      Node Type (e.g. trigger, tool)
                    </label>
                    <input
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editingAgent.node_type || ''}
                      onChange={(e) =>
                        setEditingAgent({ ...editingAgent, node_type: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                      UI Group
                    </label>
                    <input
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editingAgent.group || ''}
                      onChange={(e) => setEditingAgent({ ...editingAgent, group: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                      Badge
                    </label>
                    <input
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editingAgent.badge || ''}
                      onChange={(e) => setEditingAgent({ ...editingAgent, badge: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                      Icon Name (Lucide)
                    </label>
                    <input
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editingAgent.icon || ''}
                      onChange={(e) => setEditingAgent({ ...editingAgent, icon: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                      Theme Color (Hex)
                    </label>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={editingAgent.color || ''}
                        onChange={(e) =>
                          setEditingAgent({ ...editingAgent, color: e.target.value })
                        }
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
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 h-20 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editingAgent.description || ''}
                      onChange={(e) =>
                        setEditingAgent({ ...editingAgent, description: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Unified Properties Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <div>
                      <h4 className="font-bold text-gray-800">Properties & Registry Values</h4>
                      <p className="text-xs text-gray-500">
                        Define the schema and set the global default values for this node type.
                      </p>
                    </div>
                    <button
                      onClick={addSchemaField}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 uppercase"
                    >
                      <Plus className="h-4 w-4" /> Add Property
                    </button>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-[10px] font-bold">
                        <tr>
                          <th className="px-4 py-3">Property Name (Key)</th>
                          <th className="px-4 py-3">UI Label</th>
                          <th className="px-4 py-3">Type / Meta</th>
                          <th className="px-4 py-3">Default Value</th>
                          <th className="px-4 py-3">Registry (Active)</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {(editingAgent.property_schema || []).map((field, idx) => (
                          <tr key={field.key || idx} className="group hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <input
                                className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 font-mono text-xs text-gray-900"
                                value={field.key}
                                onChange={(e) => updateSchema(idx, 'key', e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 text-gray-900"
                                value={field.label}
                                onChange={(e) => updateSchema(idx, 'label', e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                <select
                                  className="bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 text-xs text-gray-900 border border-gray-100"
                                  value={field.type}
                                  onChange={(e) => updateSchema(idx, 'type', e.target.value)}
                                >
                                  <option value="string">String</option>
                                  <option value="boolean">Boolean</option>
                                  <option value="number">Number</option>
                                  <option value="choice">Choice</option>
                                  <option value="textarea">Textarea</option>
                                  <option value="password">Password</option>
                                </select>
                                <label className="flex items-center gap-1 text-[10px] text-gray-500">
                                  <input
                                    type="checkbox"
                                    checked={field.multiple || false}
                                    onChange={(e) =>
                                      updateSchema(idx, 'multiple', e.target.checked)
                                    }
                                  />{' '}
                                  Multi
                                </label>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 text-xs text-gray-400 italic"
                                value={String(field.default ?? '')}
                                placeholder="Hardcoded..."
                                onChange={(e) => updateSchema(idx, 'default', e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3">
                              {renderValueInput(field, editingAgent.properties[field.key])}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => removeSchemaField(idx)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                  onClick={handleSaveNode}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-2 text-sm font-bold text-white hover:bg-blue-700 shadow-md transition-all"
                >
                  <Save className="h-4 w-4" /> {editingAgent.id ? 'Update Registry' : 'Create Node Type'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Category Modal */}
        {isCategoryModalOpen && editingCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between border-b bg-gray-50 px-6 py-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingCategory.id ? 'Edit Category' : 'Add New Category'}
                </h3>
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    System Name (ID)
                  </label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900"
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
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900"
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
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900"
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
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900"
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
                      className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900"
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

              <div className="border-t bg-gray-50 px-6 py-4 flex justify-end gap-3">
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
      </div>
    </div>
  );
}
