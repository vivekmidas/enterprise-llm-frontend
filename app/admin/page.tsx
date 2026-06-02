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
    UserCog
} from 'lucide-react';

interface NodeCategory {
    id?: number;
    name: string;
    label?: string;
    icon?: string;
    color?: string;
}

interface AgentNode {
    name: string;
    label: string;
    description: string;
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

    useEffect(() => {
        async function loadAdminData() {
            try {
                const [agentsRes, catsRes] = await Promise.all([
                    api.getAgents(),
                    api.getWorkflowCategories()
                ]);

                // The backend returns { "nodes": [...] } for /nodes and { "categories": [...] } for /nodes/categories
                setAgents(agentsRes.nodes || agentsRes.agents || []);

                const cats = Array.isArray(catsRes) ? catsRes : (catsRes.categories || []);
                const normalizedCats = cats.map((cat: any) => 
                    typeof cat === 'string' ? { name: cat } : cat
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

    const handleSaveNode = async () => {
        if (!editingAgent) return;
        try {
            // @ts-ignore - updateNode added to api.ts
            await api.updateNode(editingAgent);
            const agentsRes = await api.getAgents();
            setAgents(agentsRes.nodes || agentsRes.agents || []);
            setEditingAgent(null);
        } catch (error) {
            console.error('Failed to save node:', error);
            alert('Failed to save node changes. Ensure the backend endpoint PUT /nodes/:name is implemented.');
        }
    };

    const updateProperty = (key: string, value: any) => {
        if (!editingAgent) return;
        setEditingAgent({
            ...editingAgent,
            properties: { ...editingAgent.properties, [key]: value }
        });
    };

    const removeProperty = (key: string) => {
        if (!editingAgent) return;
        const newProps = { ...editingAgent.properties };
        delete newProps[key];
        setEditingAgent({ ...editingAgent, properties: newProps });
    };

    const addProperty = () => {
        const key = window.prompt('Enter new property key:');
        if (key && editingAgent) {
            updateProperty(key, '');
        }
    };

    const updateSchema = (index: number, field: string, value: any) => {
        if (!editingAgent) return;
        const newSchema = [...(editingAgent.property_schema || [])];
        newSchema[index] = { ...newSchema[index], [field]: value };
        setEditingAgent({ ...editingAgent, property_schema: newSchema });
    };

    const removeSchemaField = (index: number) => {
        if (!editingAgent) return;
        const newSchema = editingAgent.property_schema.filter((_, i) => i !== index);
        setEditingAgent({ ...editingAgent, property_schema: newSchema });
    };

    const addSchemaField = () => {
        if (!editingAgent) return;
        const newField = { key: 'new_field', label: 'New Field', type: 'string' };
        setEditingAgent({
            ...editingAgent,
            property_schema: [...(editingAgent.property_schema || []), newField]
        });
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
                        <p className="mt-1 text-gray-500">Live view of discovered nodes, categories, and their underlying properties.</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-sm border border-gray-200">
                        <Shield className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-semibold text-gray-700">Admin Console</span>
                    </div>
                </header>

                {/* Categories Section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Tag className="h-5 w-5 text-gray-400" />
                        <h2 className="text-xl font-semibold text-gray-800">Node Categories</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {categories.map((cat) => (
                            <div key={cat.name} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="h-3 w-3 rounded-full"
                                        style={{ backgroundColor: cat.color || '#3b82f6' }}
                                    />
                                    <span className="font-medium text-gray-700">{cat.label || cat.name}</span>
                                </div>
                                {cat.icon && <span className="text-[10px] text-gray-400 font-mono bg-gray-50 px-1.5 py-0.5 rounded border">{cat.icon}</span>}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Agents/Nodes Section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Box className="h-5 w-5 text-gray-400" />
                        <h2 className="text-xl font-semibold text-gray-800">Available Nodes & Agents</h2>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Node Details</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Classification</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">JSON Definition</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
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
                                                        color: agent.color || '#6b7280'
                                                    }}
                                                >
                                                    <AgentIcon className="h-5 w-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-gray-900">{agent.label || agent.name}</span>
                                                        {agent.badge && (
                                                            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700 border border-amber-100">
                                                                {agent.badge}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 font-mono mt-0.5">{agent.name} v{agent.version} {agent.icon && `• icon: ${agent.icon}`}</span>
                                                    {agent.sub_label && <span className="text-xs text-blue-600 font-medium mt-0.5">{agent.sub_label}</span>}
                                                    <p className="mt-2 text-sm text-gray-600 max-w-xs line-clamp-2">{agent.description}</p>
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
                                                <pre>{JSON.stringify({ properties: agent.properties, property_schema: agent.property_schema }, null, 2)}</pre>
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
                                )})}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Edit Modal */}
                {editingAgent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                        <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
                            <div className="flex items-center justify-between border-b bg-gray-50 px-6 py-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Edit Node Registry</h3>
                                    <p className="text-xs text-gray-500 font-mono uppercase">{editingAgent.name} v{editingAgent.version}</p>
                                </div>
                                <button onClick={() => setEditingAgent(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-10">
                                {/* Section: Metadata */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Display Label</label>
                                        <input 
                                            className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={editingAgent.label || ''}
                                            onChange={(e) => setEditingAgent({ ...editingAgent, label: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Node Category</label>
                                        <select 
                                            className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={editingAgent.category || ''}
                                            onChange={(e) => setEditingAgent({ ...editingAgent, category: e.target.value })}
                                        >
                                            {categories.map(cat => (
                                                <option key={cat.name} value={cat.name}>{cat.label || cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Sub Label</label>
                                        <input 
                                            className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={editingAgent.sub_label || ''}
                                            onChange={(e) => setEditingAgent({ ...editingAgent, sub_label: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">UI Group</label>
                                        <input 
                                            className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={editingAgent.group || ''}
                                            onChange={(e) => setEditingAgent({ ...editingAgent, group: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Badge</label>
                                        <input 
                                            className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={editingAgent.badge || ''}
                                            onChange={(e) => setEditingAgent({ ...editingAgent, badge: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Icon Name (Lucide)</label>
                                        <input 
                                            className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={editingAgent.icon || ''}
                                            onChange={(e) => setEditingAgent({ ...editingAgent, icon: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Theme Color (Hex)</label>
                                        <div className="flex gap-2">
                                            <input 
                                                className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={editingAgent.color || ''}
                                                onChange={(e) => setEditingAgent({ ...editingAgent, color: e.target.value })}
                                            />
                                            <div 
                                                className="w-10 h-10 rounded-lg border border-gray-200 shadow-sm" 
                                                style={{ backgroundColor: editingAgent.color || '#3b82f6' }}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Description</label>
                                        <textarea 
                                            className="w-full rounded-lg border border-gray-200 px-4 py-2 h-20 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={editingAgent.description || ''}
                                            onChange={(e) => setEditingAgent({ ...editingAgent, description: e.target.value })}
                                        />
                                    </div>
                                </div>
        {/* Section: Property Schema (UI Meta) */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                        <h4 className="font-bold text-gray-800">Dynamic Property Schema</h4>
                                        <button 
                                            onClick={addSchemaField}
                                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 uppercase"
                                        >
                                            <Plus className="h-4 w-4" /> Add Field
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {(editingAgent.property_schema || []).map((field, idx) => (
                                            <div key={idx} className="grid grid-cols-4 gap-4 rounded-xl bg-gray-50 p-4 border border-gray-200 relative group">
                                                <input placeholder="Key" className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-900 bg-white" value={field.key} onChange={(e) => updateSchema(idx, 'key', e.target.value)} />
                                                <input placeholder="Label" className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-900 bg-white" value={field.label} onChange={(e) => updateSchema(idx, 'label', e.target.value)} />
                                                <select className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-900 bg-white" value={field.type} onChange={(e) => updateSchema(idx, 'type', e.target.value)}>
                                                    <option value="string">String</option>
                                                    <option value="boolean">Boolean</option>
                                                    <option value="number">Number</option>
                                                    <option value="choice">Choice</option>
                                                    <option value="textarea">Textarea</option>
                                                    <option value="password">Password</option>
                                                </select>
                                                <button onClick={() => removeSchemaField(idx)} className="absolute -right-2 -top-2 bg-white rounded-full p-1 border border-red-100 text-red-400 hover:text-red-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Section: Properties (Value Table) */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                        <h4 className="font-bold text-gray-800">Static Properties</h4>
                                        <button 
                                            onClick={addProperty}
                                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 uppercase"
                                        >
                                            <Plus className="h-4 w-4" /> Add Property
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {Object.entries(editingAgent.properties || {}).map(([key, val]) => (
                                            <div key={key} className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                                <span className="w-40 text-xs font-mono font-bold text-gray-500 truncate px-2">{key}</span>
                                                <input 
                                                    className="flex-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-900 bg-white"
                                                    value={typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                                    onChange={(e) => updateProperty(key, e.target.value)}
                                                />
                                                <button onClick={() => removeProperty(key)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                        
                            </div>

                            <div className="border-t bg-gray-50 px-8 py-4 flex justify-end gap-3">
                                <button onClick={() => setEditingAgent(null)} className="rounded-lg px-6 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
                                    Cancel
                                </button>
                                <button onClick={handleSaveNode} className="flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-2 text-sm font-bold text-white hover:bg-blue-700 shadow-md transition-all">
                                    <Save className="h-4 w-4" /> Update Registry
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
