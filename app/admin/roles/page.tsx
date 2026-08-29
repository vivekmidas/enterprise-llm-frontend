/*
===============================================================================
BLOCK COMMENT: CANONICAL SOT ROLES & CAPABILITY MATRIX PORTAL
Component: frontend/app/admin/roles/page.tsx
Description:
    Role & Access Control Management powered by canonical Module SOT.
    - Role creation & editing uses a clean Route & Action Matrix (View, Create, Edit, Delete).
    - Selecting write actions automatically enforces route guard view permissions.
    - Supports multi-tenant scoping (System-wide vs. Customer Tenant specific roles).
===============================================================================
*/

'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Search,
  CheckCircle2,
  UserCheck,
  Building,
  Eye,
  Check,
  X,
  Layers,
  Route,
  Sparkles,
  RefreshCw,
  CornerDownRight,
} from 'lucide-react';

interface RolesTabProps {
  userRole?: string | null;
  customerId?: string | null;
}

interface ModuleAction {
  id: string;
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

export default function RolesTab({ userRole, customerId }: RolesTabProps = {}) {
  const isSystemAdmin = userRole === 'system_admin';
  const [roles, setRoles] = useState<any[]>([]);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [modulesList, setModulesList] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenantScope, setSelectedTenantScope] = useState<string>('all');

  // Modal State for Role Creation & Editing
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [roleCustomerId, setRoleCustomerId] = useState<string>('system');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedMethodsByPerm, setSelectedMethodsByPerm] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [matrixSearch, setMatrixSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesData, custsData, modsData] = await Promise.all([
        api.request('/roles').catch(() => []),
        api.getCustomers().catch(() => []),
        api.getModules().catch(() => []),
      ]);
      setRoles(rolesData || []);
      setCustomersList(custsData || []);
      setModulesList(modsData || []);
    } catch (err) {
      console.error('Failed to load roles and modules', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDescription('');
    setRoleCustomerId(isSystemAdmin ? 'system' : customerId || 'system');
    setSelectedPermissions([]);
    setSelectedMethodsByPerm({});
    setErrorMessage(null);
    setMatrixSearch('');
    setShowRoleModal(true);
  };

  const handleOpenEditModal = (role: any) => {
    setEditingRole(role);
    setRoleName(role.role_name);
    setRoleDescription(role.description || '');
    setRoleCustomerId(role.customer_id ? String(role.customer_id) : 'system');
    setSelectedPermissions(role.permissions || []);
    setSelectedMethodsByPerm(role.methods_by_permission || {});
    setErrorMessage(null);
    setMatrixSearch('');
    setShowRoleModal(true);
  };

  // Toggle all methods for an action
  const handleToggleAction = (act: ModuleAction, modActions: ModuleAction[]) => {
    const actionPermId = act.id;
    const availableMethods =
      act.http_methods && act.http_methods.length > 0 ? act.http_methods : ['GET'];

    setSelectedPermissions((prev) => {
      const isCurrentlySelected = prev.includes(actionPermId);
      if (isCurrentlySelected) {
        setSelectedMethodsByPerm((prevMap) => {
          const copy = { ...prevMap };
          delete copy[actionPermId];
          return copy;
        });
        return prev.filter((id) => id !== actionPermId);
      } else {
        const viewAction = modActions.find((a) => a.is_route_guard || a.action === 'view');
        setSelectedMethodsByPerm((prevMap) => ({
          ...prevMap,
          [actionPermId]: [...availableMethods],
        }));
        if (viewAction && viewAction.id !== actionPermId && !prev.includes(viewAction.id)) {
          return [...prev, actionPermId, viewAction.id];
        }
        return [...prev, actionPermId];
      }
    });
  };

  // Toggle specific individual HTTP method for an action
  const handleToggleSpecificMethod = (
    act: ModuleAction,
    method: string,
    modActions: ModuleAction[],
  ) => {
    const actionPermId = act.id;
    const availableMethods =
      act.http_methods && act.http_methods.length > 0 ? act.http_methods : [method];

    setSelectedPermissions((prev) => {
      const isCurrentlySelected = prev.includes(actionPermId);
      const viewAction = modActions.find((a) => a.is_route_guard || a.action === 'view');
      const next = isCurrentlySelected ? [...prev] : [...prev, actionPermId];
      if (viewAction && viewAction.id !== actionPermId && !next.includes(viewAction.id)) {
        next.push(viewAction.id);
      }
      return next;
    });

    setSelectedMethodsByPerm((prevMap) => {
      const currentMethods =
        prevMap[actionPermId] !== undefined ? prevMap[actionPermId] : [...availableMethods];
      const hasMeth = currentMethods.includes(method);
      const updatedMethods = hasMeth
        ? currentMethods.filter((m) => m !== method)
        : [...currentMethods, method];

      if (updatedMethods.length === 0) {
        // If all methods unselected, unselect permission
        setSelectedPermissions((p) => p.filter((id) => id !== actionPermId));
        const copy = { ...prevMap };
        delete copy[actionPermId];
        return copy;
      }

      return {
        ...prevMap,
        [actionPermId]: updatedMethods,
      };
    });
  };

  // Toggle all actions for a module row
  const handleToggleModuleRow = (mod: ModuleItem) => {
    const actionIds = mod.actions.map((a) => a.id);
    const allSelected = actionIds.every((id) => selectedPermissions.includes(id));

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !actionIds.includes(id)));
      setSelectedMethodsByPerm((prevMap) => {
        const copy = { ...prevMap };
        actionIds.forEach((id) => delete copy[id]);
        return copy;
      });
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...actionIds])));
      setSelectedMethodsByPerm((prevMap) => {
        const copy = { ...prevMap };
        mod.actions.forEach((a) => {
          copy[a.id] = a.http_methods && a.http_methods.length > 0 ? [...a.http_methods] : ['GET'];
        });
        return copy;
      });
    }
  };

  // Select all or deselect all across entire system
  const handleSelectAllMatrix = () => {
    const allIds = modulesList.flatMap((m) => m.actions.map((a) => a.id));
    const allSelected = allIds.length > 0 && allIds.every((id) => selectedPermissions.includes(id));
    if (allSelected) {
      setSelectedPermissions([]);
      setSelectedMethodsByPerm({});
    } else {
      setSelectedPermissions(allIds);
      const methodsMap: Record<string, string[]> = {};
      modulesList.forEach((m) => {
        m.actions.forEach((a) => {
          methodsMap[a.id] =
            a.http_methods && a.http_methods.length > 0 ? [...a.http_methods] : ['GET'];
        });
      });
      setSelectedMethodsByPerm(methodsMap);
    }
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      setErrorMessage('Role name is required');
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    try {
      const selectedCid = roleCustomerId === 'system' ? null : roleCustomerId;
      if (editingRole) {
        await api.request(`/roles/${editingRole.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            role_name: roleName.trim(),
            description: roleDescription.trim(),
            customer_id: selectedCid,
            permission_ids: selectedPermissions,
            methods_by_permission: selectedMethodsByPerm,
          }),
        });
      } else {
        await api.request('/roles', {
          method: 'POST',
          body: JSON.stringify({
            role_name: roleName.trim(),
            role_type: 'custom',
            description: roleDescription.trim(),
            customer_id: selectedCid,
            permission_ids: selectedPermissions,
            methods_by_permission: selectedMethodsByPerm,
          }),
        });
      }
      setShowRoleModal(false);
      await fetchData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (roleId: string, isPreset: boolean) => {
    if (isPreset) return;
    if (!confirm('Are you sure you want to delete this custom role?')) return;

    try {
      await api.request(`/roles/${roleId}`, { method: 'DELETE' });
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete role');
    }
  };

  // Filter roles list
  const filteredRoles = roles.filter((role) => {
    if (selectedTenantScope === 'system') {
      if (!role.is_system_preset && role.customer_id) return false;
    } else if (selectedTenantScope !== 'all') {
      if (String(role.customer_id) !== selectedTenantScope) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (role.role_name || '').toLowerCase().includes(q);
      const matchType = (role.role_type || '').toLowerCase().includes(q);
      const matchDesc = (role.description || '').toLowerCase().includes(q);
      if (!matchName && !matchType && !matchDesc) return false;
    }
    return true;
  });

  // Filtered matrix modules inside modal
  const filteredMatrixModules = modulesList.filter((m) => {
    if (!matrixSearch.trim()) return true;
    const q = matrixSearch.toLowerCase();
    return (
      m.label.toLowerCase().includes(q) ||
      m.module.toLowerCase().includes(q) ||
      (m.route_patterns && m.route_patterns.some((r) => r.toLowerCase().includes(q))) ||
      (m.actions && m.actions.some((a) => a.id.toLowerCase().includes(q)))
    );
  });

  return (
    <section className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-700">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              Roles & Granular Permissions Matrix
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold uppercase">
                Canonical RBAC SOT
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure tenant and system-wide roles with route-linked atomic capability
              permissions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchData}
            className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
            title="Refresh roles"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-700' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Role</span>
          </button>
        </div>
      </div>

      {/* SEARCH & TENANT FILTER TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search roles by name, type, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-700 text-slate-900 placeholder-slate-400 bg-slate-50"
          />
        </div>

        {isSystemAdmin && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold uppercase text-slate-500 font-mono shrink-0">
              Tenant Scope:
            </span>
            <select
              value={selectedTenantScope}
              onChange={(e) => setSelectedTenantScope(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:border-indigo-700 cursor-pointer w-full sm:w-64"
            >
              <option value="all">All Roles (System + All Tenants)</option>
              <option value="system">System Presets & System-wide Only</option>
              {customersList.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  Tenant: {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ROLES CARDS GRID */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 text-xs bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-700" />
          <span>Loading RBAC roles...</span>
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="p-16 text-center text-slate-400 text-xs italic bg-white rounded-2xl border border-slate-200 shadow-xs">
          No roles found matching the current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRoles.map((role) => {
            const isWildcard =
              role.permissions?.includes('*:*:*') || role.permissions?.includes('admin:*:*');
            const matchedTenant = customersList.find(
              (c) => String(c.id) === String(role.customer_id),
            );

            return (
              <div
                key={role.id}
                className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">{role.role_name}</h3>
                      <span className="text-[11px] text-slate-500 font-mono">
                        type: {role.role_type}
                      </span>
                    </div>

                    {role.is_system_preset ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        <Lock className="w-2.5 h-2.5" /> System Preset
                      </span>
                    ) : role.customer_id ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                        <Building className="w-2.5 h-2.5" />{' '}
                        {matchedTenant?.name || `Tenant ${role.customer_id}`}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <UserCheck className="w-2.5 h-2.5" /> System-wide Custom
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 mb-4 min-h-[32px] line-clamp-2">
                    {role.description || 'No description provided for this role profile.'}
                  </p>

                  {/* Permissions Summary Badges */}
                  <div className="space-y-1.5 mb-4">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span>Assigned Capabilities ({role.permissions?.length || 0})</span>
                      {isWildcard && (
                        <span className="text-[10px] text-amber-600 font-extrabold">
                          Full Access Wildcard
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                      {role.permissions?.map((pId: string) => (
                        <span
                          key={pId}
                          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200"
                        >
                          {pId}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <span className="text-[11px] text-slate-400">
                    Updated{' '}
                    {role.updated_at ? new Date(role.updated_at).toLocaleDateString() : 'N/A'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(role)}
                      className="p-1.5 text-slate-600 hover:text-indigo-700 rounded-lg hover:bg-indigo-50 transition cursor-pointer"
                      title="Edit role capabilities"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!role.is_system_preset && (
                      <button
                        onClick={() => handleDeleteRole(role.id, role.is_system_preset)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                        title="Delete custom role"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ROLE CREATION & EDITING WITH ROUTE & CAPABILITY CHECKBOX MATRIX     */}
      {/* ========================================================================= */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-700" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  {editingRole
                    ? `Edit Role: ${editingRole.role_name}`
                    : 'Create Custom Role & Capability Matrix'}
                </h3>
              </div>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveRole} className="flex-1 overflow-y-auto p-6 space-y-5">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
                  {errorMessage}
                </div>
              )}

              {/* Role Metadata Row */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="md:col-span-4">
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                    Role Name *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={editingRole?.is_system_preset}
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="e.g. Knowledge Manager"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 font-bold focus:border-indigo-700 focus:outline-none disabled:bg-slate-100"
                  />
                </div>

                <div className="md:col-span-5">
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    placeholder="e.g. Manages tenant knowledge bases and documents"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-700 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                    Tenant Scope
                  </label>
                  {isSystemAdmin ? (
                    <select
                      disabled={editingRole?.is_system_preset}
                      value={roleCustomerId}
                      onChange={(e) => setRoleCustomerId(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 font-bold focus:border-indigo-700 focus:outline-none cursor-pointer"
                    >
                      <option value="system">Global System-wide (All Tenants)</option>
                      {customersList.map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          Tenant: {c.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-xs text-slate-700 font-bold truncate">
                      {customersList.find((c) => String(c.id) === String(customerId))?.name
                        ? `Tenant: ${customersList.find((c) => String(c.id) === String(customerId))?.name}`
                        : 'Current Tenant'}
                    </div>
                  )}
                </div>
              </div>

              {/* ROUTE & CAPABILITY CHECKBOX MATRIX */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Route className="w-4 h-4 text-indigo-700" />
                    <span className="text-xs font-extrabold text-slate-900">
                      Module & Route Permissions Matrix
                    </span>
                    <span className="text-[11px] text-slate-500 font-semibold">
                      ({selectedPermissions.length} actions selected)
                    </span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-56">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search matrix routes..."
                        value={matrixSearch}
                        onChange={(e) => setMatrixSearch(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-indigo-700"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSelectAllMatrix}
                      className="text-xs font-bold text-indigo-700 hover:text-indigo-900 transition cursor-pointer shrink-0"
                    >
                      Toggle All
                    </button>
                  </div>
                </div>

                {/* SIMPLIFIED SINGLE-TIER ACTION & SUBPATH MATRIX */}
                <div className="space-y-3">
                  {filteredMatrixModules.map((m) => {
                    const allModSelected =
                      m.actions.length > 0 &&
                      m.actions.every((a) => selectedPermissions.includes(a.id));

                    return (
                      <div
                        key={m.id}
                        className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-xs"
                      >
                        {/* Module Group Bar */}
                        <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50 border-b border-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-xs">{m.label}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                              {m.module}
                              {m.submodule ? `/${m.submodule}` : ''}
                            </span>
                            {m.route_patterns && m.route_patterns.length > 0 && (
                              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                                ({m.route_patterns.join(', ')})
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleModuleRow(m)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border transition cursor-pointer ${
                              allModSelected
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            {allModSelected ? 'Deselect Module' : 'Select All in Module'}
                          </button>
                        </div>

                        {/* Uniform Single-Tier Action Rows */}
                        <div className="divide-y divide-slate-100">
                          {m.actions && m.actions.length > 0 ? (
                            m.actions.map((act) => {
                              const isPermSelected = selectedPermissions.includes(act.id);
                              const availableMethods =
                                act.http_methods && act.http_methods.length > 0
                                  ? act.http_methods
                                  : ['GET'];
                              const currentActiveMethods = isPermSelected
                                ? selectedMethodsByPerm[act.id] !== undefined
                                  ? selectedMethodsByPerm[act.id]
                                  : availableMethods
                                : [];

                              const effectivePath =
                                act.api_path || (m.route_patterns && m.route_patterns[0]) || '-';

                              return (
                                <div
                                  key={act.id}
                                  onClick={() => handleToggleAction(act, m.actions)}
                                  className={`flex items-center justify-between p-2.5 px-3.5 hover:bg-slate-50/80 transition cursor-pointer ${
                                    isPermSelected ? 'bg-indigo-50/20' : ''
                                  }`}
                                >
                                  {/* Action Label & Key */}
                                  <div className="flex items-center gap-2.5 w-1/3 min-w-[200px]">
                                    <input
                                      type="checkbox"
                                      checked={isPermSelected}
                                      onChange={() => {}} // Handled by container onClick
                                      className="w-4 h-4 rounded text-indigo-700 accent-indigo-700 cursor-pointer shrink-0"
                                    />
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span
                                          className={`text-xs font-bold ${
                                            isPermSelected
                                              ? 'text-indigo-950 font-extrabold'
                                              : 'text-slate-900'
                                          }`}
                                        >
                                          {act.label}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-mono">
                                          ({act.action})
                                        </span>
                                      </div>
                                      {act.is_route_guard && (
                                        <span className="text-[9px] text-emerald-700 font-semibold flex items-center gap-0.5 mt-0.5">
                                          <Eye className="w-2.5 h-2.5" /> UI Route Access Guard
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* API Path / Route Pattern */}
                                  <div className="flex-1 px-3">
                                    <code className="text-[10px] font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block max-w-full truncate">
                                      {effectivePath}
                                    </code>
                                  </div>

                                  {/* Allowed HTTP Methods (Clickable Granular Toggles) */}
                                  <div className="w-48 flex items-center gap-1.5 shrink-0">
                                    {availableMethods.map((meth) => {
                                      const isMethodActive = currentActiveMethods.includes(meth);
                                      const mClass = !isMethodActive
                                        ? 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                                        : meth === 'GET'
                                          ? 'bg-sky-50 text-sky-900 border-sky-300 shadow-xs'
                                          : meth === 'POST'
                                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-xs'
                                            : meth === 'PUT'
                                              ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-xs'
                                              : 'bg-rose-50 text-rose-900 border-rose-300 shadow-xs';

                                      return (
                                        <button
                                          type="button"
                                          key={meth}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleSpecificMethod(act, meth, m.actions);
                                          }}
                                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold border transition cursor-pointer ${mClass}`}
                                          title={`Click to toggle ${meth} for this role`}
                                        >
                                          {meth}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* Access Status Badge */}
                                  <div className="w-28 text-right shrink-0">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                        isPermSelected && currentActiveMethods.length > 0
                                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-xs'
                                          : 'bg-slate-100 text-slate-400 border-slate-200'
                                      }`}
                                    >
                                      {isPermSelected && currentActiveMethods.length > 0
                                        ? currentActiveMethods.length === availableMethods.length
                                          ? 'Allowed'
                                          : currentActiveMethods.join(',')
                                        : 'Disabled'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="p-3 text-slate-400 text-xs italic">
                              No actions registered
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving Role...' : editingRole ? 'Save Changes' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
