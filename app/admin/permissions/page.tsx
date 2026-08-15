/*
===============================================================================
BLOCK COMMENT: CANONICAL MODULE SOT & ROUTE MATRIX MANAGEMENT PORTAL
Module: frontend/app/admin/permissions/page.tsx
Description:
    100% Frontend-driven management portal for application modules, routes, and capability actions.
    - Zero code changes required: Define new modules, routes, and custom action capabilities directly in UI.
    - Interactive Action Builder allows adding/removing custom actions and toggling Route Guard (Green vs Gray).
    - Multi-tenant filter allows System Admin to configure global defaults or tenant-specific overrides.
    - Live sync and updates directly to ModuleDB and PermissionDB.
===============================================================================
*/

'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Lock,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Route,
  Layers,
  Sparkles,
  X,
  Globe,
  Database,
  Building,
  Shield,
  Eye,
  PlusCircle,
  FileEdit,
  Trash,
  ArrowRightLeft,
  Check
} from 'lucide-react';

interface ModuleAction {
  id?: string;
  action: string;
  is_route_guard: boolean;
  api_path?: string;
  http_methods?: string[];
  label: string;
  description?: string;
}

interface ModuleItem {
  id: string;
  customer_id?: string | null;
  module: string;
  submodule?: string;
  label: string;
  description?: string;
  route_patterns: string[];
  icon?: string;
  display_order?: number;
  actions: ModuleAction[];
}

interface CustomerOption {
  id: string;
  name: string;
}

const HTTP_VERBS = ['GET', 'POST', 'PUT', 'DELETE'] as const;

export default function PermissionsTab() {
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<string>('all');
  const [selectedModuleGroup, setSelectedModuleGroup] = useState<string>('all');

  // Modal State for Custom Module Creation
  const [showAddModal, setShowAddModal] = useState(false);
  const [newModId, setNewModId] = useState('');
  const [newModGroup, setNewModGroup] = useState('admin');
  const [newModSubgroup, setNewModSubgroup] = useState('');
  const [newModLabel, setNewModLabel] = useState('');
  const [newModDescription, setNewModDescription] = useState('');
  const [newModRoutes, setNewModRoutes] = useState('');
  const [newModTenant, setNewModTenant] = useState<string>('system');
  const [newModActions, setNewModActions] = useState<ModuleAction[]>([
    { action: 'view', is_route_guard: true, label: 'View / Access', api_path: '', http_methods: ['GET'] },
    { action: 'create', is_route_guard: false, label: 'Create New', api_path: '', http_methods: ['POST'] },
    { action: 'edit', is_route_guard: false, label: 'Edit / Update', api_path: '', http_methods: ['PUT'] },
    { action: 'delete', is_route_guard: false, label: 'Delete / Remove', api_path: '', http_methods: ['DELETE'] }
  ]);
  const [saving, setSaving] = useState(false);

  // Modal State for Editing Module Routes & Actions
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingModule, setEditingModule] = useState<ModuleItem | null>(null);
  const [editModLabel, setEditModLabel] = useState('');
  const [editModRoutes, setEditModRoutes] = useState('');
  const [editModDescription, setEditModDescription] = useState('');
  const [editModActions, setEditModActions] = useState<ModuleAction[]>([]);
  const [updating, setUpdating] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [modsRes, custsRes] = await Promise.all([
        api.getModules(selectedTenant === 'all' || selectedTenant === 'system' ? undefined : selectedTenant),
        api.getCustomers().catch(() => [])
      ]);
      setModules(Array.isArray(modsRes) ? modsRes : []);
      setCustomers(Array.isArray(custsRes) ? custsRes : []);
    } catch (err) {
      console.error('Failed to load modules matrix', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [selectedTenant]);

  const toggleActionMethod = (
    setter: React.Dispatch<React.SetStateAction<ModuleAction[]>>,
    idx: number,
    verb: string
  ) => {
    setter((prev) =>
      prev.map((act, i) => {
        if (i !== idx) return act;
        const curMethods = act.http_methods || [];
        const updated = curMethods.includes(verb)
          ? curMethods.filter((m) => m !== verb)
          : [...curMethods, verb];
        return { ...act, http_methods: updated };
      })
    );
  };

  const handleOpenAddModal = () => {
    setNewModId('');
    setNewModGroup('admin');
    setNewModSubgroup('');
    setNewModLabel('');
    setNewModDescription('');
    setNewModRoutes('');
    setNewModTenant(selectedTenant === 'all' ? 'system' : selectedTenant);
    setNewModActions([
      { action: 'view', is_route_guard: true, label: 'View / Access', api_path: '', http_methods: ['GET'] },
      { action: 'create', is_route_guard: false, label: 'Create New', api_path: '', http_methods: ['POST'] },
      { action: 'edit', is_route_guard: false, label: 'Edit / Update', api_path: '', http_methods: ['PUT'] },
      { action: 'delete', is_route_guard: false, label: 'Delete / Remove', api_path: '', http_methods: ['DELETE'] }
    ]);
    setShowAddModal(true);
  };

  const handleAddActionToNewMod = () => {
    setNewModActions((prev) => [
      ...prev,
      { action: 'manage', is_route_guard: false, label: 'Manage / Configure', api_path: '', http_methods: ['GET', 'POST', 'PUT', 'DELETE'] }
    ]);
  };

  const handleRemoveActionFromNewMod = (idx: number) => {
    setNewModActions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreateCustomModule = async () => {
    if (!newModId.trim() || !newModLabel.trim() || !newModRoutes.trim()) return;
    setSaving(true);
    try {
      const routesList = newModRoutes
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean);

      await api.createCustomModule({
        id: newModId.trim().toLowerCase().replace(/\s+/g, '_'),
        customer_id: newModTenant === 'system' ? undefined : newModTenant,
        module: newModGroup.trim().toLowerCase(),
        submodule: newModSubgroup.trim().toLowerCase() || undefined,
        label: newModLabel.trim(),
        description: newModDescription.trim() || undefined,
        route_patterns: routesList,
        icon: 'Layers',
        actions: newModActions.map((a) => ({
          action: a.action.trim().toLowerCase(),
          is_route_guard: a.is_route_guard,
          api_path: a.api_path ? a.api_path.trim() : undefined,
          http_methods: a.http_methods && a.http_methods.length > 0 ? a.http_methods : undefined,
          label: a.label.trim(),
          description: a.description
        }))
      });

      setShowAddModal(false);
      triggerToast(`Module "${newModLabel}" created successfully!`);
      await fetchInitialData();
    } catch (err: any) {
      console.error('Failed to create custom module', err);
      triggerToast(err.message || 'Failed to create module');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEditModal = (m: ModuleItem) => {
    setEditingModule(m);
    setEditModLabel(m.label);
    setEditModRoutes(m.route_patterns ? m.route_patterns.join(', ') : '');
    setEditModDescription(m.description || '');
    setEditModActions(
      m.actions
        ? m.actions.map((a) => ({
            ...a,
            api_path: a.api_path || '',
            http_methods: a.http_methods || []
          }))
        : [{ action: 'view', is_route_guard: true, label: `View ${m.label}`, api_path: '', http_methods: ['GET'] }]
    );
    setShowEditModal(true);
  };

  const handleAddActionToEditMod = () => {
    setEditModActions((prev) => [
      ...prev,
      { action: 'manage', is_route_guard: false, label: `Manage ${editModLabel}`, api_path: '', http_methods: ['GET', 'POST', 'PUT', 'DELETE'] }
    ]);
  };

  const handleRemoveActionFromEditMod = (idx: number) => {
    setEditModActions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveEditModule = async () => {
    if (!editingModule || !editModLabel.trim() || !editModRoutes.trim()) return;
    setUpdating(true);
    try {
      const routesList = editModRoutes
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean);

      await api.createCustomModule({
        id: editingModule.id,
        customer_id: editingModule.customer_id || undefined,
        module: editingModule.module,
        submodule: editingModule.submodule,
        label: editModLabel.trim(),
        description: editModDescription.trim() || undefined,
        route_patterns: routesList,
        icon: editingModule.icon,
        actions: editModActions.map((a) => ({
          action: a.action.trim().toLowerCase(),
          is_route_guard: a.is_route_guard,
          api_path: a.api_path ? a.api_path.trim() : undefined,
          http_methods: a.http_methods && a.http_methods.length > 0 ? a.http_methods : undefined,
          label: a.label.trim(),
          description: a.description
        }))
      });

      setShowEditModal(false);
      triggerToast(`Module "${editingModule.label}" updated successfully!`);
      await fetchInitialData();
    } catch (err: any) {
      console.error('Failed to update module', err);
      triggerToast(err.message || 'Failed to update module');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteModule = async (id: string, label: string) => {
    if (!window.confirm(`Are you sure you want to delete module "${label}"?`)) return;
    try {
      await api.deleteCustomModule(id);
      triggerToast(`Module "${label}" deleted.`);
      await fetchInitialData();
    } catch (err: any) {
      console.error('Failed to delete module', err);
      triggerToast(err.message || 'Failed to delete module');
    }
  };

  const handleSyncDefaults = async () => {
    if (!window.confirm('Sync canonical default modules and permissions to database? This will update system default routes.')) return;
    try {
      const res = await api.syncDefaultRoutePermissions();
      triggerToast(res.message || 'Modules synchronized successfully!');
      await fetchInitialData();
    } catch (err: any) {
      console.error('Failed to sync defaults', err);
      triggerToast(err.message || 'Failed to sync defaults');
    }
  };

  const filteredModules = modules.filter((m) => {
    const matchesGroup =
      selectedModuleGroup === 'all' ||
      m.module.toLowerCase() === selectedModuleGroup.toLowerCase();

    const matchesTenant =
      selectedTenant === 'all' ||
      (selectedTenant === 'system' && !m.customer_id) ||
      m.customer_id === selectedTenant;

    const matchesSearch =
      !searchQuery.trim() ||
      m.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.submodule && m.submodule.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.route_patterns && m.route_patterns.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (m.actions &&
        m.actions.some(
          (a) =>
            a.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (a.id && a.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (a.api_path && a.api_path.toLowerCase().includes(searchQuery.toLowerCase()))
        ));

    return matchesGroup && matchesTenant && matchesSearch;
  });

  const moduleGroupOptions = Array.from(new Set(modules.map((m) => m.module)));

  return (
    <div className="space-y-6">
      {/* HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
            <Route className="w-5 h-5 text-indigo-700" /> Canonical Module SOT & API Route Registry
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Dynamic UI-driven route & API verb matrix. Changes take effect across frontend proxy and backend gateway without code restarts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleSyncDefaults}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer shrink-0"
            title="Reset/sync global system default routes & permissions"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            <span>Sync Defaults</span>
          </button>

          <button
            onClick={() => {
              setNewModId('');
              setNewModGroup('admin');
              setNewModSubgroup('');
              setNewModLabel('');
              setNewModDescription('');
              setNewModRoutes('');
              setNewModTenant('system');
              setNewModActions([
                { action: 'view', is_route_guard: true, label: 'View / Access', api_path: '', http_methods: ['GET'] },
                { action: 'create', is_route_guard: false, label: 'Create New', api_path: '', http_methods: ['POST'] },
                { action: 'edit', is_route_guard: false, label: 'Edit / Update', api_path: '', http_methods: ['PUT'] },
                { action: 'delete', is_route_guard: false, label: 'Delete / Remove', api_path: '', http_methods: ['DELETE'] }
              ]);
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-xl shadow-xs transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Register Custom Module</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search modules, routes (e.g. /admin/knowledge, /api/knowledge/bases), or capability keys..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9.5 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-700"
          />
        </div>

        {/* Filter: Module Group */}
        <select
          value={selectedModuleGroup}
          onChange={(e) => setSelectedModuleGroup(e.target.value)}
          className="w-full sm:w-48 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-700"
        >
          <option value="all">All Module Groups</option>
          {moduleGroupOptions.map((grp) => (
            <option key={grp} value={grp}>
              Module: {grp}
            </option>
          ))}
        </select>

        {/* Filter: Tenant Scope */}
        <select
          value={selectedTenant}
          onChange={(e) => setSelectedTenant(e.target.value)}
          className="w-full sm:w-48 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-700"
        >
          <option value="all">All Tenant Scopes</option>
          <option value="system">Global System Defaults</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              Tenant: {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* MODULES & CAPABILITIES TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-500 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-700" />
            <span>Loading canonical modules & route matrix...</span>
          </div>
        ) : filteredModules.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs italic">
            No modules or routes matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-3.5 w-1/4">Module & Scope</th>
                  <th className="p-3.5 w-1/5">UI Route Path(s)</th>
                  <th className="p-3.5">Granular Capability Actions & Bound API Endpoints</th>
                  <th className="p-3.5 w-28">Tenant Scope</th>
                  <th className="p-3.5 text-right w-16">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredModules.map((m) => {
                  const isTenantCustom = Boolean(m.customer_id);
                  const matchedCustomer = customers.find((c) => c.id === m.customer_id);

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition">
                      {/* Module & Scope */}
                      <td className="p-3.5 align-top">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-900 text-xs">{m.label}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold text-[10px]">
                              {m.module}
                            </span>
                            {m.submodule && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                /{m.submodule}
                              </span>
                            )}
                          </div>
                          {m.description && (
                            <span className="text-[11px] text-slate-500 mt-1 max-w-xs">{m.description}</span>
                          )}
                        </div>
                      </td>

                      {/* Route Patterns */}
                      <td className="p-3.5 align-top">
                        <div className="flex flex-col gap-1">
                          {m.route_patterns && m.route_patterns.length > 0 ? (
                            m.route_patterns.map((pat) => (
                              <code
                                key={pat}
                                className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block w-fit"
                              >
                                {pat}
                              </code>
                            ))
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">No direct URL</span>
                          )}
                        </div>
                      </td>

                      {/* Granular Capability Actions */}
                      <td className="p-3.5 align-top">
                        <div className="flex flex-col gap-2">
                          {m.actions && m.actions.length > 0 ? (
                            m.actions.map((act) => (
                              <div
                                key={act.id || act.action}
                                className="flex flex-wrap items-center gap-2 p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px]"
                              >
                                <div className="flex items-center gap-1">
                                  <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] border ${
                                    act.is_route_guard
                                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                      : 'bg-indigo-50 text-indigo-900 border-indigo-200'
                                  }`}>
                                    {act.action.toUpperCase()}
                                  </span>
                                  <span className="font-semibold text-slate-900">{act.label}</span>
                                </div>

                                {act.api_path && (
                                  <div className="flex items-center gap-1.5 ml-auto">
                                    <div className="flex items-center gap-0.5">
                                      {(act.http_methods || ['GET']).map((meth) => {
                                        const mClass =
                                          meth === 'GET'
                                            ? 'bg-sky-50 text-sky-900 border-sky-300'
                                            : meth === 'POST'
                                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                            : meth === 'PUT'
                                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                                            : 'bg-rose-50 text-rose-900 border-rose-300';
                                        return (
                                          <span key={meth} className={`px-1 py-0.2 rounded text-[9px] font-extrabold border ${mClass}`}>
                                            {meth}
                                          </span>
                                        );
                                      })}
                                    </div>
                                    <code className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800">
                                      {act.api_path}
                                    </code>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">No atomic actions</span>
                          )}
                        </div>
                      </td>

                      {/* Tenant Scope */}
                      <td className="p-3.5 align-top">
                        {isTenantCustom ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                            Tenant: {matchedCustomer?.name || m.customer_id}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            Global Default
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(m)}
                            className="p-1.5 text-slate-500 hover:text-indigo-700 transition rounded-lg hover:bg-indigo-50 cursor-pointer"
                            title="Edit routes, labels, API endpoints, and capability actions"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {isTenantCustom && (
                            <button
                              onClick={() => handleDeleteModule(m.id, m.label)}
                              className="p-1.5 text-slate-400 hover:text-red-600 transition rounded-lg hover:bg-red-50 cursor-pointer"
                              title="Delete custom module override"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: ADD CUSTOM MODULE & ACTIONS BUILDER */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-300 p-6 rounded-2xl w-full max-w-5xl flex flex-col gap-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-700" /> Register Custom Module, Routes & Capabilities
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Module ID</label>
                  <input
                    type="text"
                    value={newModId}
                    onChange={(e) => setNewModId(e.target.value)}
                    placeholder="e.g. billing_invoices"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Group Scope</label>
                  <input
                    type="text"
                    value={newModGroup}
                    onChange={(e) => setNewModGroup(e.target.value)}
                    placeholder="e.g. admin, billing, legal"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tenant Target</label>
                  <select
                    value={newModTenant}
                    onChange={(e) => setNewModTenant(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold"
                  >
                    <option value="system">Global System (All Tenants)</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        Tenant: {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Display Label</label>
                <input
                  type="text"
                  value={newModLabel}
                  onChange={(e) => setNewModLabel(e.target.value)}
                  placeholder="e.g. Billing & Invoices"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Route Patterns (comma-separated URL paths)</label>
                <input
                  type="text"
                  value={newModRoutes}
                  onChange={(e) => setNewModRoutes(e.target.value)}
                  placeholder="e.g. /billing, /billing/**"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  value={newModDescription}
                  onChange={(e) => setNewModDescription(e.target.value)}
                  placeholder="Explain what this module provides..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              {/* ACTION BUILDER */}
              <div className="border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-extrabold text-slate-900 block">Capability Actions, API Paths & Route Guards</span>
                    <span className="text-[10px] text-slate-500">Configure Action Key, Label, API Endpoint, HTTP Verbs, and Guard Checkbox in one tier</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddActionToNewMod}
                    className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Action
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {newModActions.map((act, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <input
                        type="text"
                        value={act.action}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewModActions((prev) => prev.map((a, i) => (i === idx ? { ...a, action: val } : a)));
                        }}
                        placeholder="action (e.g. view)"
                        className="w-24 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900"
                      />
                      <input
                        type="text"
                        value={act.label}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewModActions((prev) => prev.map((a, i) => (i === idx ? { ...a, label: val } : a)));
                        }}
                        placeholder="Capability Label"
                        className="w-48 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-900"
                      />
                      <input
                        type="text"
                        value={act.api_path || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewModActions((prev) => prev.map((a, i) => (i === idx ? { ...a, api_path: val } : a)));
                        }}
                        placeholder="/api/endpoint/path"
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900"
                      />
                      <div className="flex items-center gap-1 shrink-0 bg-white p-1 rounded-lg border border-slate-200">
                        {HTTP_VERBS.map((verb) => {
                          const active = (act.http_methods || []).includes(verb);
                          const activeClass =
                            verb === 'GET'
                              ? 'bg-sky-100 text-sky-900 border-sky-300 font-extrabold'
                              : verb === 'POST'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold'
                              : verb === 'PUT'
                              ? 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold'
                              : 'bg-rose-100 text-rose-900 border-rose-300 font-extrabold';
                          const inactiveClass = 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100';

                          return (
                            <button
                              key={verb}
                              type="button"
                              onClick={() => toggleActionMethod(setNewModActions, idx, verb)}
                              className={`px-1.5 py-0.5 rounded text-[10px] border transition cursor-pointer ${
                                active ? activeClass : inactiveClass
                              }`}
                              title={`Toggle ${verb}`}
                            >
                              {verb}
                            </button>
                          );
                        })}
                      </div>
                      <label className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1.5 rounded-lg border cursor-pointer shrink-0 ${
                        act.is_route_guard ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-white text-slate-500 border-slate-200'
                      }`}>
                        <input
                          type="checkbox"
                          checked={act.is_route_guard}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setNewModActions((prev) => prev.map((a, i) => (i === idx ? { ...a, is_route_guard: checked } : a)));
                          }}
                          className="w-3.5 h-3.5 accent-emerald-700 cursor-pointer"
                        />
                        <span>Guard</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveActionFromNewMod(idx)}
                        className="text-slate-400 hover:text-red-600 p-1.5 cursor-pointer shrink-0 rounded-lg hover:bg-red-50"
                        title="Delete action"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-2 text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustomModule}
                disabled={saving || !newModId.trim() || !newModLabel.trim() || !newModRoutes.trim()}
                className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs cursor-pointer"
              >
                {saving ? 'Creating...' : 'Register Module'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT MODULE ROUTES & ACTIONS */}
      {showEditModal && editingModule && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-300 p-6 rounded-2xl w-full max-w-5xl flex flex-col gap-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Edit2 className="w-4 h-4 text-indigo-700" /> Edit Module, Routes & Capabilities
                </h3>
                <p className="text-[11px] font-mono text-indigo-800 font-bold mt-0.5">{editingModule.id}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Display Label</label>
                <input
                  type="text"
                  value={editModLabel}
                  onChange={(e) => setEditModLabel(e.target.value)}
                  placeholder="e.g. Knowledge Bases"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Route Patterns (comma-separated URL paths)</label>
                <input
                  type="text"
                  value={editModRoutes}
                  onChange={(e) => setEditModRoutes(e.target.value)}
                  placeholder="e.g. /admin/knowledge, /knowledge"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  value={editModDescription}
                  onChange={(e) => setEditModDescription(e.target.value)}
                  placeholder="Explain what this module provides..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              {/* ACTION BUILDER */}
              <div className="border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-extrabold text-slate-900 block">Capability Actions, API Paths & Route Guards</span>
                    <span className="text-[10px] text-slate-500">Configure Action Key, Label, API Endpoint, HTTP Verbs, and Guard Checkbox in one tier</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddActionToEditMod}
                    className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Action
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {editModActions.map((act, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <input
                        type="text"
                        value={act.action}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditModActions((prev) => prev.map((a, i) => (i === idx ? { ...a, action: val } : a)));
                        }}
                        placeholder="action"
                        className="w-24 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900"
                      />
                      <input
                        type="text"
                        value={act.label}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditModActions((prev) => prev.map((a, i) => (i === idx ? { ...a, label: val } : a)));
                        }}
                        placeholder="Label"
                        className="w-48 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-900"
                      />
                      <input
                        type="text"
                        value={act.api_path || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditModActions((prev) => prev.map((a, i) => (i === idx ? { ...a, api_path: val } : a)));
                        }}
                        placeholder="/api/endpoint/path"
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900"
                      />
                      <div className="flex items-center gap-1 shrink-0 bg-white p-1 rounded-lg border border-slate-200">
                        {HTTP_VERBS.map((verb) => {
                          const active = (act.http_methods || []).includes(verb);
                          const activeClass =
                            verb === 'GET'
                              ? 'bg-sky-100 text-sky-900 border-sky-300 font-extrabold'
                              : verb === 'POST'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold'
                              : verb === 'PUT'
                              ? 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold'
                              : 'bg-rose-100 text-rose-900 border-rose-300 font-extrabold';
                          const inactiveClass = 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100';

                          return (
                            <button
                              key={verb}
                              type="button"
                              onClick={() => toggleActionMethod(setEditModActions, idx, verb)}
                              className={`px-1.5 py-0.5 rounded text-[10px] border transition cursor-pointer ${
                                active ? activeClass : inactiveClass
                              }`}
                              title={`Toggle ${verb}`}
                            >
                              {verb}
                            </button>
                          );
                        })}
                      </div>
                      <label className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1.5 rounded-lg border cursor-pointer shrink-0 ${
                        act.is_route_guard ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-white text-slate-500 border-slate-200'
                      }`}>
                        <input
                          type="checkbox"
                          checked={act.is_route_guard}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setEditModActions((prev) => prev.map((a, i) => (i === idx ? { ...a, is_route_guard: checked } : a)));
                          }}
                          className="w-3.5 h-3.5 accent-emerald-700 cursor-pointer"
                        />
                        <span>Guard</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveActionFromEditMod(idx)}
                        className="text-slate-400 hover:text-red-600 p-1.5 cursor-pointer shrink-0 rounded-lg hover:bg-red-50"
                        title="Delete action"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-3.5 py-2 text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditModule}
                disabled={updating || !editModLabel.trim() || !editModRoutes.trim()}
                className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs cursor-pointer"
              >
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
