'use client';

import React, { useEffect, useState, type ComponentType } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { api } from '@/lib/api';
import {
  Shield,
  User,
  Tag,
  Box,
  Power,
  Info,
  Code2,
  Zap,
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
  Users,
  Lock,
  LogOut,
} from 'lucide-react';

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
  zap: Zap,
  brain: Brain,
  'brain-circuit': BrainCircuit,
  cloud: Cloud,
  key: KeyRound,
  mail: Mail,
  megaphone: Megaphone,
  network: Network,
  users: Users,
};
import { AgentNode, NodeCategory } from '@components/component-categoriees';

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

export default function AdminPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<AgentNode[]>([]);
  const [categories, setCategories] = useState<NodeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentNode | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<NodeCategory | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'nodes' | 'workflows' | 'users' | 'oauth' | 'logs'>('nodes');
  const [users, setUsers] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [jsonExpandedState, setJsonExpandedState] = useState<Record<string, boolean>>({});
  const [editingProvider, setEditingProvider] = useState<any | null>(null);

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem('admin_token');
    const role = localStorage.getItem('user_role');
    if (token) {
      if (role !== 'admin') {
        router.push('/workflow-builder');
        return;
      }
      setIsAuthenticated(true);
      setUserRole(role);
      setUserEmail(localStorage.getItem('user_email'));
    }

    async function loadAdminData() {
      try {
        const [agentsRes, catsRes, providersRes, workflowsRes, usersRes] = await Promise.all([
          api.getNodes(),
          api.getNodesCategories(),
          api.getProviders(),
          api.getSavedAgents(),
          api.getUsers().catch(() => []),
        ]);

        // The backend returns { "nodes": [...] } for /nodes and { "categories": [...] } for /nodes/categories
        setAgents((agentsRes as any).nodes || (agentsRes as any).agents || []);

        const cats = Array.isArray(catsRes) ? catsRes : catsRes.categories || [];
        const normalizedCats = cats.map((cat: any) =>
          typeof cat === 'string' ? { name: cat } : cat,
        );
        setCategories(normalizedCats);
        if (normalizedCats.length > 0) {
          setActiveCategory(normalizedCats[0].name);
        }
        setProviders(providersRes || []);
        setWorkflows(workflowsRes || []);
        setUsers(usersRes || []);
      } catch (error) {
        console.error('Failed to load admin data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      loadAdminData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        await api.register({
          username: loginUsername, 
          email: loginEmail, 
          password: loginPassword,
          name: "",
          lastname:""
        });
        alert('Registration successful! Please login.');
        setIsRegistering(false);
      } else {
        const data = await api.login({ email: loginEmail, password: loginPassword });
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('user_role', data.role);
        localStorage.setItem('user_email', loginEmail);

        // Set the cookie for the middleware
        document.cookie = `admin_token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

        if (data.role === 'admin') {
          setUserRole(data.role);
          setUserEmail(loginEmail);
          setIsAuthenticated(true);
        } else {
          router.push('/workflow-builder');
        }
      }
    } catch (err) {
      alert('Authentication failed. Check your credentials.');
    }
  };

  const handleToggleWorkflow = async (id: string) => {
    await api.toggleWorkflowStatus(id);
    const workflowsRes = await api.getSavedAgents();
    setWorkflows(workflowsRes || []);
  };

  const handleDeleteWorkflow = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    await api.deleteWorkflow(id);
    const workflowsRes = await api.getSavedAgents();
    setWorkflows(workflowsRes || []);
  };

  const toggleJsonExpanded = (agentId: string) => {
    setJsonExpandedState((prev) => ({
      ...prev,
      [agentId]: !prev[agentId],
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
      const catsRes = await api.getNodesCategories();
      const cats = Array.isArray(catsRes) ? catsRes : catsRes.categories || [];
      setCategories(cats.map((cat: any) => (typeof cat === 'string' ? { name: cat } : cat)));
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

  const handleSaveNode = async () => {
    if (!editingAgent) return;
    
    const finalAgent = { ...editingAgent };

    // Validate and parse Input Contract
    try {
      if (typeof finalAgent.input_contract === 'string' && finalAgent.input_contract.trim() !== '') {
        finalAgent.input_contract = JSON.parse(finalAgent.input_contract);
      } else if (typeof finalAgent.input_contract === 'string') {
        finalAgent.input_contract = {};
      }
    } catch (e) {
      alert('Invalid JSON in Input Contract field.');
      return;
    }

    // Validate and parse Output Contract
    try {
      if (typeof finalAgent.output_contract === 'string' && finalAgent.output_contract.trim() !== '') {
        finalAgent.output_contract = JSON.parse(finalAgent.output_contract);
      } else if (typeof finalAgent.output_contract === 'string') {
        finalAgent.output_contract = {};
      }
    } catch (e) {
      alert('Invalid JSON in Output Contract field.');
      return;
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
    if (!confirm(`Are you sure you want to delete the node type "${nodeName}"? This action cannot be undone.`)) {
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
      alert(`Failed to delete node type "${nodeName}". Ensure the backend endpoint DELETE /nodes/:name is implemented.`);
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
      'w-full bg-white border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 text-sm text-black';

    if (field.type === 'password') {
      return (
        <input
          type="password"
          className={`${commonClasses} text-black`}
          value={String(value ?? '')}
          placeholder="••••••••"
          autoComplete="new-password"
          onChange={(e) => handleValChange(e.target.value)}
        />
      );
    }

    if (field.type === 'boolean') {
      return (
        <select
          className={`${commonClasses} text-black`}
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
          className={`${commonClasses} text-black`}
          value={value ?? 0}
          onChange={(e) => handleValChange(Number(e.target.value))}
        />
      );
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          className={`${commonClasses} text-black min-h-[60px] resize-y`}
          value={String(value ?? '')}
          placeholder="Multiline content..."
          onChange={(e) => handleValChange(e.target.value)}
        />
      );
    }

    if (field.multiple || field.type === 'list') {
      return (
        <input
          className={`${commonClasses} text-black`}
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
        className={`${commonClasses} text-black`}
        value={typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')}
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
              <Shield className="h-8 w-8 text-blue-600" />
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
                <Lock className="h-5 w-5 text-blue-500 group-hover:text-blue-400" />
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
          <Activity className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-gray-500">Loading system registry...</p>
        </div>
      </div>
    );
  }

  const filteredAgents = activeCategory
    ? agents.filter((a) => a.category === activeCategory)
    : agents;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black">System Registry</h1>
            <p className="mt-1 text-gray-500">
              Live view of discovered nodes, categories, and their underlying properties.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-sm border border-gray-200">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-semibold text-black">Admin Console</span>
            </div>
          </div>
        </header>

        <div className="flex border-b border-gray-200">
          {userRole === 'admin' && (
            <button
              onClick={() => setActiveTab('nodes')}
              className={`px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'nodes' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Node Management
            </button>
          )}
          <button
            onClick={() => setActiveTab('workflows')}
            className={`px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'workflows' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Workflow Management
          </button>
          {userRole === 'admin' && (
            <>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'users' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                User Management
              </button>
              <button
                onClick={() => setActiveTab('oauth')}
                className={`px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'oauth' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                OAuth Management
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'logs' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                System Logs
              </button>
            </>
          )}
        </div>

        {activeTab === 'nodes' ? (
          <>
            {/* Categories Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-gray-400" />
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
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition-all"
                >
                  <Plus className="h-4 w-4" /> Add Category
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {categories.map((cat, idx) => (
                  <div
                    key={cat.id || `cat-${cat.name}-${idx}`}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`group cursor-pointer flex items-center justify-between rounded-xl border p-4 shadow-sm hover:shadow-md transition-all ${activeCategory === cat.name ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 bg-white'}`}
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
                  <h2 className="text-xl font-semibold text-black">
                    Nodes
                    {/* {categories.find((c) => c.name === activeCategory)?.label ||
                      activeCategory ||
                      'Category'} */}
                  </h2>
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
                      input_contract: {},
                      output_contract: {},
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition-all"
                >
                  <Plus className="h-4 w-4" /> Add New Node
                </button>
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
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Description
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
                      const AgentIcon = (agent.icon && iconMap[agent.icon.toLowerCase()]) || Box; // Fallback to Box icon
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
                                  borderColor: agent.color ? `${agent.color}40` : '#e5e7eb',
                                  backgroundColor: agent.color ? `${agent.color}10` : '#f9fafb',
                                  color: agent.color || '#6b7280',
                                }}
                              >
                                <AgentIcon className="h-4 w-4" />
                              </div>
                              <div className="flex flex-col">
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
                              </div>
                            </div>
                          </td>

                          {/* Name (ID) / Version */}
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-700 font-mono">{agent.name}</span>
                              <span className="text-[10px] text-gray-400 font-mono mt-0.5">
                                v{agent.version}
                              </span>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="px-4 py-3">
                            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700 border border-amber-100">
                              {agent.node_type}
                            </span>
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
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-600 max-w-[200px] line-clamp-2">
                              {agent.description || 'No description.'}
                            </p>
                            {/* Original Classification badges, now moved to their own columns */}
                            {/* <div className="flex flex-wrap gap-2 pt-1">
                              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700 border border-blue-100 uppercase">
                                {agent.category}
                              </span>
                              <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-bold text-gray-600 border border-gray-100 uppercase">
                                {agent.group}
                              </span>
                            </div> */}
                          </td>

                          {/* JSON Definition (Collapsible) */}
                          <td className="px-4 py-3">
                            <div>
                              <button
                                onClick={() => toggleJsonExpanded( agent.name)}
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-xs whitespace-nowrap"
                              >
                                {jsonExpandedState[agent.id || agent.name] ? (
                                  <>
                                    <Code2 className="h-3.5 w-3.5" /> Hide Definition
                                  </>
                                ) : (
                                  <>
                                    <Code2 className="h-3.5 w-3.5" /> Show Definition
                                  </>
                                )}
                              </button>
                            </div>
                            <div
                              className={`w-full max-w-xs overflow-hidden rounded-lg bg-gray-950 font-mono text-emerald-400 shadow-inner transition-all duration-300 ${
                                jsonExpandedState[agent.id || agent.name]
                                  ? 'max-h-64 p-3 mt-2 overflow-auto opacity-100'
                                  : 'max-h-0 p-0 opacity-0'
                              }`}
                            >
                              <pre className="text-[10px]">
                                {JSON.stringify(
                                  {
                                    properties: maskSecrets(agent.properties),
                                    property_schema: maskSecrets(agent.property_schema),
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
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setEditingAgent({ ...agent })}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Edit Node Type"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDeleteNode(agent.name)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete Node Type">
                                <Trash2 className="h-4 w-4" />
                              </button>
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
            </div>
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
                        {userRole === 'admin' && (
                          <button
                            onClick={() => handleToggleWorkflow(wf.id)}
                            className={`p-1 rounded transition-colors ${wf.is_enabled !== false ? 'text-gray-400 hover:text-red-500' : 'text-gray-400 hover:text-green-500'}`}
                            title={wf.is_enabled !== false ? 'Disable' : 'Enable'}
                          >
                            <Power className="h-4 w-4" />
                          </button>
                        )}
                        {userRole !== 'admin' && (
                          <button
                            onClick={() => handleDeleteWorkflow(wf.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {wf.description || 'No description provided.'}
                    </p>
                    <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase font-bold">Nodes</span>
                        <span className="text-sm font-semibold text-black">
                          {wf.graph?.nodes?.length || 0}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase font-bold">Edges</span>
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
                  <Workflow className="mx-auto h-12 w-12 text-gray-300" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No workflows found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating a new workflow in the builder.
                  </p>
                </div>
              )}
            </div>
          </section>
        ) : activeTab === 'users' ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-400" />
                <h2 className="text-xl font-semibold text-black">User Management</h2>
              </div>
              <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition-all opacity-50 cursor-not-allowed">
                <Plus className="h-4 w-4" /> Add User
              </button>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Username</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((u, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-black font-medium">{u.username}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{u.email_id}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${u.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                          {u.status}
                        </span>
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
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-gray-400" />
              <h2 className="text-xl font-semibold text-black">System Activity Logs</h2>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden p-8 text-center">
              <Activity className="mx-auto h-12 w-12 text-gray-200 mb-4" />
              <p className="text-gray-500 text-sm">Real-time system logs will appear here after the next gateway restart.</p>
            </div>
          </section>
        ) : (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Network className="h-5 w-5 text-gray-400" />
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
                <Plus className="h-4 w-4" /> Add Provider
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
                      {iconMap[provider.icon] ? React.createElement(iconMap[provider.icon], { className: 'h-6 w-6' }) : <Box className="h-6 w-6" />}
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
              <div className="flex items-center justify-between border-b bg-gray-50 px-6 py-4">
                <h3 className="text-xl font-bold text-black">
                  {editingProvider.id ? 'Edit Provider' : 'New Provider'}
                </h3>
                <button
                  onClick={() => setEditingProvider(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
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
              <div className="border-t bg-gray-50 px-6 py-4 flex justify-end gap-3">
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

        {/* Edit Modal */}
        {editingAgent && (
          <div className="fixed max-w-full inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="flex h-[90vh] w-full flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between border-b bg-gray-50 px-6 py-4">
                <div>
                  <h3 className="text-xl font-bold text-black">
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
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editingAgent.version || '1.0.0'}
                      onChange={(e) =>
                        setEditingAgent({ ...editingAgent, version: e.target.value })
                      }
                      placeholder="1.0.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                      Node Category
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editingAgent.category || ''}
                      onChange={(e) =>
                        setEditingAgent({ ...editingAgent, category: e.target.value })
                      }
                    >
                      {categories.map((cat, idx) => (
                        <option key={`opt-${cat.id || cat.name || idx}`} value={cat.name}>
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
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editingAgent.group || ''}
                      onChange={(e) => setEditingAgent({ ...editingAgent, group: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                      Badge
                    </label>
                    <input
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editingAgent.badge || ''}
                      onChange={(e) => setEditingAgent({ ...editingAgent, badge: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                      Icon Name (Lucide)
                    </label>
                    <input
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 h-20 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editingAgent.description || ''}
                      onChange={(e) =>
                        setEditingAgent({ ...editingAgent, description: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                      Input Contract (JSON)
                    </label>
                    <textarea
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 h-32 text-sm font-mono text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={typeof editingAgent.input_contract === 'string' ? editingAgent.input_contract : JSON.stringify(editingAgent.input_contract || {}, null, 2)}
                      onChange={(e) => setEditingAgent({ ...editingAgent, input_contract: e.target.value })}
                      placeholder='{ "properties": { "message": "string" } }'
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                      Output Contract (JSON)
                    </label>
                    <textarea
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 h-32 text-sm font-mono text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={typeof editingAgent.output_contract === 'string' ? editingAgent.output_contract : JSON.stringify(editingAgent.output_contract || {}, null, 2)}
                      onChange={(e) => setEditingAgent({ ...editingAgent, output_contract: e.target.value })}
                      placeholder='{ "properties": { "result": "string" } }'
                    />
                  </div>
                </div>

                {/* Unified Properties Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <div>
                      <h4 className="font-bold text-black">Properties & Registry Values</h4>
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
                          <tr
                            key={field.key || idx}
                            className="group hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <input
                                className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 font-mono text-xs text-black"
                                value={field.key}
                                onChange={(e) => updateSchema(idx, 'key', e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 text-black"
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
                                  <option value="oauth">oAuth</option>
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
                                className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 text-xs text-gray-700 italic"
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
                  <Save className="h-4 w-4" />{' '}
                  {editingAgent.id ? 'Update Registry' : 'Create Node Type'}
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
                <h3 className="text-xl font-bold text-black">
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
