/*
===============================================================================
BLOCK COMMENT: SYSTEM ADMIN PERMISSIONS CATALOG & MANAGEMENT TAB (WITH EDIT PROVISION)
Module: frontend/app/admin/permissions/page.tsx
Description:
    System-wide 3-Tier Permissions Management portal for system_admin.
    - Displays all active permissions grouped by Module -> Submodule -> Action.
    - Live search, filtering by target layer (frontend, backend, both) and module.
    - Provision to Edit existing permission metadata (Label, Description, Target Layer, Submodule).
    - Interactive "Add Permission" modal for dynamic registration without code changes.
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
  Filter,
  RefreshCw,
  Shield,
  Layers,
  Sparkles,
  X
} from 'lucide-react';

interface PermissionItem {
  id: string;
  module: string;
  submodule?: string;
  target_layer?: string;
  label: string;
  description?: string;
}

export default function PermissionsTab() {
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedLayer, setSelectedLayer] = useState<string>('all');

  // Modal State for Adding New Permission
  const [showAddModal, setShowAddModal] = useState(false);
  const [newModule, setNewModule] = useState('admin');
  const [newSubmodule, setNewSubmodule] = useState('permissions');
  const [newAction, setNewAction] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newLayer, setNewLayer] = useState<'frontend' | 'backend' | 'both'>('both');
  const [saving, setSaving] = useState(false);

  // Modal State for Editing Permission
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState<PermissionItem | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLayer, setEditLayer] = useState<'frontend' | 'backend' | 'both'>('both');
  const [editSubmodule, setEditSubmodule] = useState('');
  const [updating, setUpdating] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const res = await api.request('/roles/permissions');
      setPermissions(res.permissions || []);
    } catch (err) {
      console.error('Failed to load permissions catalog', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreatePermission = async () => {
    if (!newAction.trim() || !newLabel.trim()) return;
    setSaving(true);
    try {
      const permId = `${newModule.toLowerCase().trim()}:${newSubmodule.toLowerCase().trim()}:${newAction.toLowerCase().trim()}`;
      await api.request('/roles/permissions', {
        method: 'POST',
        body: JSON.stringify({
          id: permId,
          module: newModule.toLowerCase().trim(),
          submodule: newSubmodule.toLowerCase().trim(),
          label: newLabel.trim(),
          description: newDescription.trim(),
          target_layer: newLayer
        })
      });
      setShowAddModal(false);
      setNewAction('');
      setNewLabel('');
      setNewDescription('');
      triggerToast(`Permission "${permId}" registered successfully!`);
      await fetchPermissions();
    } catch (err: any) {
      console.error('Failed to create permission', err);
      triggerToast(err.message || 'Failed to create permission');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEditModal = (p: PermissionItem) => {
    setEditingPermission(p);
    setEditLabel(p.label);
    setEditDescription(p.description || '');
    setEditLayer((p.target_layer as any) || 'both');
    setEditSubmodule(p.submodule || '');
    setShowEditModal(true);
  };

  const handleSaveEditPermission = async () => {
    if (!editingPermission || !editLabel.trim()) return;
    setUpdating(true);
    try {
      await api.request(`/roles/permissions/${encodeURIComponent(editingPermission.id)}`, {
        method: 'PUT',
        body: JSON.stringify({
          label: editLabel.trim(),
          description: editDescription.trim(),
          target_layer: editLayer,
          submodule: editSubmodule.trim() || undefined
        })
      });
      setShowEditModal(false);
      triggerToast(`Permission "${editingPermission.id}" updated successfully!`);
      await fetchPermissions();
    } catch (err: any) {
      console.error('Failed to update permission', err);
      triggerToast(err.message || 'Failed to update permission');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePermission = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete permission "${id}"?`)) return;
    try {
      await api.request(`/roles/permissions/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      triggerToast(`Permission "${id}" deleted.`);
      await fetchPermissions();
    } catch (err) {
      console.error('Failed to delete permission', err);
    }
  };

  // Distinct Modules for Filter
  const distinctModules = Array.from(new Set(permissions.map((p) => p.module))).sort();

  // Filtered List
  const filteredPermissions = permissions.filter((p) => {
    const matchesSearch =
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesModule = selectedModule === 'all' || p.module === selectedModule;
    const matchesLayer = selectedLayer === 'all' || p.target_layer === selectedLayer;

    return matchesSearch && matchesModule && matchesLayer;
  });

  return (
    <div className="space-y-6">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-violet-700" /> System-Wide Permissions Registry
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit, edit, and configure 3-tier <code className="font-mono text-violet-700 font-bold">module:submodule:action</code> authorization scopes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchPermissions}
            className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
            title="Refresh permissions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-violet-700' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-violet-700 hover:bg-violet-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Register Permission
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search permissions by key (e.g. admin:permissions:view) or label..."
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-slate-900 focus:outline-none focus:border-violet-700"
          />
        </div>

        {/* Module Filter */}
        <select
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 font-semibold focus:outline-none focus:border-violet-700"
        >
          <option value="all">All Modules ({permissions.length})</option>
          {distinctModules.map((m) => (
            <option key={m} value={m}>
              Module: {m}
            </option>
          ))}
        </select>

        {/* Layer Filter */}
        <select
          value={selectedLayer}
          onChange={(e) => setSelectedLayer(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 font-semibold focus:outline-none focus:border-violet-700"
        >
          <option value="all">All Layers</option>
          <option value="both">Both (Full Scope)</option>
          <option value="frontend">Frontend Only</option>
          <option value="backend">Backend Only</option>
        </select>
      </div>

      {/* PERMISSIONS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-500 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-violet-700" />
            <span>Loading system permissions catalog...</span>
          </div>
        ) : filteredPermissions.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs italic">
            No permissions matching your filters.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="p-3.5">Permission Scope ID</th>
                <th className="p-3.5">Module / Submodule</th>
                <th className="p-3.5">Target Layer</th>
                <th className="p-3.5">Label & Description</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPermissions.map((p) => {
                const isWildcard = p.id.includes('*');
                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <Lock className={`w-3.5 h-3.5 ${isWildcard ? 'text-amber-600' : 'text-violet-700'}`} />
                        <code className={`font-mono text-xs font-bold ${
                          isWildcard ? 'text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200' : 'text-slate-900'
                        }`}>
                          {p.id}
                        </code>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-violet-50 text-violet-800 border border-violet-200 text-[10px] font-bold">
                          {p.module}
                        </span>
                        {p.submodule && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono">
                            {p.submodule}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.target_layer === 'both'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.target_layer === 'frontend'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {p.target_layer || 'both'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-col">
                        <strong className="text-slate-900">{p.label}</strong>
                        {p.description && <span className="text-[11px] text-slate-500">{p.description}</span>}
                      </div>
                    </td>
                    <td className="p-3.5 text-right flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(p)}
                        className="p-1.5 text-slate-500 hover:text-violet-700 transition rounded-lg hover:bg-violet-50 cursor-pointer"
                        title="Edit permission"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {!isWildcard && (
                        <button
                          onClick={() => handleDeletePermission(p.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition rounded-lg hover:bg-red-50 cursor-pointer"
                          title="Delete permission"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL: EDIT PERMISSION */}
      {showEditModal && editingPermission && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-300 p-6 rounded-2xl w-full max-w-md flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Edit2 className="w-4 h-4 text-violet-700" /> Edit Permission Scope
                </h3>
                <p className="text-[11px] font-mono text-violet-800 font-bold mt-0.5">{editingPermission.id}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Permission Label</label>
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  placeholder="e.g. View Users"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Submodule</label>
                <input
                  type="text"
                  value={editSubmodule}
                  onChange={(e) => setEditSubmodule(e.target.value)}
                  placeholder="e.g. user_management"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Explain what this permission authorizes..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Layer</label>
                <select
                  value={editLayer}
                  onChange={(e: any) => setEditLayer(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold"
                >
                  <option value="both">Both (Frontend & Backend)</option>
                  <option value="frontend">Frontend Route Only</option>
                  <option value="backend">Backend Endpoint Only</option>
                </select>
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
                onClick={handleSaveEditPermission}
                disabled={updating || !editLabel.trim()}
                className="px-4 py-2 bg-violet-700 hover:bg-violet-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs cursor-pointer"
              >
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER NEW PERMISSION */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-300 p-6 rounded-2xl w-full max-w-md flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-violet-700" /> Register System Permission
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Module</label>
                  <input
                    type="text"
                    value={newModule}
                    onChange={(e) => setNewModule(e.target.value)}
                    placeholder="e.g. admin"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Submodule</label>
                  <input
                    type="text"
                    value={newSubmodule}
                    onChange={(e) => setNewSubmodule(e.target.value)}
                    placeholder="e.g. permissions"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Action / Scope</label>
                <input
                  type="text"
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  placeholder="e.g. manage"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold"
                />
                <span className="text-[10px] text-violet-800 font-mono mt-1 block">
                  Resulting Key: {newModule || 'module'}:{newSubmodule || 'submodule'}:{newAction || 'action'}
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Label</label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. Manage Permissions"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g. System-wide permissions catalog management"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Layer</label>
                <select
                  value={newLayer}
                  onChange={(e: any) => setNewLayer(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold"
                >
                  <option value="both">Both (Frontend & Backend)</option>
                  <option value="frontend">Frontend Route Only</option>
                  <option value="backend">Backend Endpoint Only</option>
                </select>
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
                onClick={handleCreatePermission}
                disabled={saving || !newAction.trim() || !newLabel.trim()}
                className="px-4 py-2 bg-violet-700 hover:bg-violet-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs cursor-pointer"
              >
                {saving ? 'Registering...' : 'Register'}
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
