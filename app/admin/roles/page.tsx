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
} from 'lucide-react';

// BLOCK COMMENT: 3-TIER ROLES & ROUTE PERMISSION BINDING PORTAL
// Component: frontend/app/admin/roles/page.tsx
// Description: Manages 3-tier Module -> Submodule -> Permission roles and System Admin Route Permission Bindings.

interface RolesTabProps {
  userRole?: string | null;
  customerId?: string | null;
}

export default function RolesTab({ userRole, customerId }: RolesTabProps = {}) {
  const isSystemAdmin = userRole === 'system_admin';
  const [roles, setRoles] = useState<any[]>([]);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [permissionsGrouped, setPermissionsGrouped] = useState<Record<string, any>>({});
  // BLOCK COMMENT: FLAT PERMISSIONS LIST & MODAL FILTER STATES (DEFAULT LIST VIEW)
  const [permissionsFlatList, setPermissionsFlatList] = useState<any[]>([]);
  const [modalModuleFilter, setModalModuleFilter] = useState<string>('all');
  const [modalSubmoduleFilter, setModalSubmoduleFilter] = useState<string>('all');
  const [modalViewMode, setModalViewMode] = useState<'list' | 'grouped'>('list');

  const [routePermissions, setRoutePermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenantScope, setSelectedTenantScope] = useState<string>('all');

  // Modal State for Roles
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [roleCustomerId, setRoleCustomerId] = useState<string>('system');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Module & Permission Builder Modal States
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleName, setModuleName] = useState('legal');
  const [submoduleName, setSubmoduleName] = useState('case_management');
  const [permissionRows, setPermissionRows] = useState<
    Array<{ id: string; submodule: string; label: string; description: string }>
  >([
    { id: 'legal:case_management:view', submodule: 'case_management', label: 'View Legal Cases', description: 'View court judgments and briefs' },
    { id: 'legal:case_management:upload', submodule: 'case_management', label: 'Upload Case Files', description: 'Upload case briefs and court filings' },
  ]);
  const [savingModule, setSavingModule] = useState(false);

  // Route Permission Binding Portal Modal States
  const [showRouteBindingModal, setShowRouteBindingModal] = useState(false);
  const [editingRouteBinding, setEditingRouteBinding] = useState<any | null>(null);
  const [routePattern, setRoutePattern] = useState('');
  const [boundPermissionId, setBoundPermissionId] = useState('');
  const [routeModule, setRouteModule] = useState('');
  const [routeSubmodule, setRouteSubmodule] = useState('');
  const [routeLabel, setRouteLabel] = useState('');
  const [savingRouteBinding, setSavingRouteBinding] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesData, permsData, routesData, custsData] = await Promise.all([
        api.request('/roles').catch(() => []),
        api.request('/roles/permissions').catch(() => ({ grouped_by_module_and_submodule: {}, permissions: [] })),
        api.getRoutePermissions().catch(() => []),
        api.getCustomers().catch(() => []),
      ]);
      setRoles(rolesData || []);
      setCustomersList(custsData || []);
      setPermissionsGrouped(permsData.grouped_by_module_and_submodule || permsData.grouped_by_module || {});
      setPermissionsFlatList(permsData.permissions || []);
      setRoutePermissions(routesData || []);
    } catch (err) {
      console.error('Failed to load roles and route permissions', err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenRouteBindingModal = (binding?: any) => {
    if (binding) {
      setEditingRouteBinding(binding);
      setRoutePattern(binding.pattern || '');
      setBoundPermissionId(binding.permission || binding.permission_id || '');
      setRouteModule(binding.module || '');
      setRouteSubmodule(binding.submodule || '');
      setRouteLabel(binding.label || '');
    } else {
      setEditingRouteBinding(null);
      setRoutePattern('/admin/provider-presets');
      setBoundPermissionId('admin:provider_presets:view');
      setRouteModule('admin');
      setRouteSubmodule('provider_presets');
      setRouteLabel('Provider Presets');
    }
    setShowRouteBindingModal(true);
  };

  const handleSaveRouteBinding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routePattern.trim() || !boundPermissionId.trim()) {
      alert('Route pattern and bound permission ID are required');
      return;
    }
    setSavingRouteBinding(true);
    try {
      const payload = {
        pattern: routePattern.trim(),
        permission_id: boundPermissionId.trim().toLowerCase(),
        module: routeModule.trim() || undefined,
        submodule: routeSubmodule.trim() || undefined,
        label: routeLabel.trim() || undefined,
      };
      if (editingRouteBinding && editingRouteBinding.id && !editingRouteBinding.id.startsWith('default_')) {
        await api.updateRoutePermissionBinding(editingRouteBinding.id, payload);
      } else {
        await api.createRoutePermissionBinding(payload);
      }
      setShowRouteBindingModal(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to save route permission binding');
    } finally {
      setSavingRouteBinding(false);
    }
  };

  const handleDeleteRouteBinding = async (bindingId: string) => {
    if (bindingId.startsWith('default_')) {
      alert('Default baseline routes cannot be deleted.');
      return;
    }
    if (!confirm('Are you sure you want to remove this route permission binding?')) return;
    try {
      await api.deleteRoutePermissionBinding(bindingId);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete route binding');
    }
  };

  const handleAddPermissionRow = () => {
    const modPrefix = moduleName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const subPrefix = submoduleName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'submodule';
    setPermissionRows((prev) => [
      ...prev,
      { id: `${modPrefix}:${subPrefix}:new_action`, submodule: subPrefix, label: 'New Permission Scope', description: '' },
    ]);
  };

  const handleRemovePermissionRow = (index: number) => {
    setPermissionRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: string, val: string) => {
    setPermissionRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: val } : row))
    );
  };

  const handleSaveModuleAndPermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleName.trim() || permissionRows.length === 0) {
      alert('Please specify a module name and at least one permission row.');
      return;
    }
    setSavingModule(true);
    try {
      await api.createModulePermissions({
        module_name: moduleName.trim(),
        submodule_name: submoduleName.trim() || undefined,
        permissions: permissionRows.map((r) => ({
          id: r.id.trim().toLowerCase(),
          submodule: r.submodule ? r.submodule.trim().toLowerCase() : undefined,
          label: r.label.trim(),
          description: r.description.trim(),
        })),
      });
      setShowModuleModal(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to save module and permissions');
    } finally {
      setSavingModule(false);
    }
  };

  const handlePresetModuleSelect = (presetName: string) => {
    if (presetName === 'HealthCare') {
      setModuleName('healthcare');
      setSubmoduleName('patient_records');
      setPermissionRows([
        { id: 'healthcare:patient_records:view', submodule: 'patient_records', label: 'View Patient Records', description: 'View HIPAA patient medical records' },
        { id: 'healthcare:claims:process', submodule: 'claims', label: 'Process Insurance Claims', description: 'Verify and process insurance claims' },
      ]);
    } else if (presetName === 'Education') {
      setModuleName('education');
      setSubmoduleName('student_portal');
      setPermissionRows([
        { id: 'education:student_portal:view', submodule: 'student_portal', label: 'View Student Records', description: 'Access student profiles and transcripts' },
        { id: 'education:curriculum:manage', submodule: 'curriculum', label: 'Manage Courses & Curriculum', description: 'Create and update course material' },
      ]);
    } else if (presetName === 'Finance') {
      setModuleName('finance');
      setSubmoduleName('accounting');
      setPermissionRows([
        { id: 'finance:accounting:view_ledger', submodule: 'accounting', label: 'View General Ledger', description: 'Inspect audit ledger and journal entries' },
        { id: 'finance:payouts:approve', submodule: 'payouts', label: 'Approve Payouts', description: 'Authorize high-value financial transfers' },
      ]);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDescription('');
    setRoleCustomerId(isSystemAdmin ? 'system' : (customerId || 'system'));
    setSelectedPermissions(['legal:research:query', 'kb:base:view', 'admin:dashboard:view']); // Default baseline
    setErrorMessage(null);
    // BLOCK COMMENT: RESET MODAL FILTERS & DEFAULT TO LIST VIEW
    setModalModuleFilter('all');
    setModalSubmoduleFilter('all');
    setModalViewMode('list');
    setSearchQuery('');
    setShowRoleModal(true);
  };

  const handleOpenEditModal = (role: any) => {
    setEditingRole(role);
    setRoleName(role.role_name);
    setRoleDescription(role.description || '');
    setRoleCustomerId(role.customer_id ? String(role.customer_id) : 'system');
    setSelectedPermissions(role.permissions || []);
    setErrorMessage(null);
    // BLOCK COMMENT: RESET MODAL FILTERS & DEFAULT TO LIST VIEW
    setModalModuleFilter('all');
    setModalSubmoduleFilter('all');
    setModalViewMode('list');
    setSearchQuery('');
    setShowRoleModal(true);
  };


  const handleTogglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const handleToggleModuleAll = (modulePerms: any[]) => {
    const permIds = modulePerms.map((p) => p.id);
    const allSelected = permIds.every((id) => selectedPermissions.includes(id));

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !permIds.includes(id)));
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...permIds])));
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
            role_name: roleName,
            description: roleDescription,
            customer_id: selectedCid,
            permission_ids: selectedPermissions,
          }),
        });
      } else {
        await api.request('/roles', {
          method: 'POST',
          body: JSON.stringify({
            role_name: roleName,
            role_type: 'custom',
            description: roleDescription,
            customer_id: selectedCid,
            permission_ids: selectedPermissions,
          }),
        });
      }
      setShowRoleModal(false);
      fetchData();
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
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete role');
    }
  };

  // BLOCK COMMENT: DYNAMIC MODULE NAME FORMATTER (ZERO HARDCODING, 100% DB DRIVEN)
  const formatModuleName = (mod: string) => {
    if (!mod) return 'General';
    return mod
      .split(/[_-]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };


  // BLOCK COMMENT: FILTER ROLES BY TENANT SCOPE AND SEARCH QUERY
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

  return (
    <section className="space-y-6">
      {/* Light Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-lg border border-indigo-100 text-indigo-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Roles & Granular Permissions
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                3-Tier RBAC Active
              </span>
            </h2>
            <p className="text-sm text-gray-500">
              Configure 3-tier role profiles (`module:submodule:permission`), bind system routes to permission keys, and manage access policies.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenRouteBindingModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Route Bindings Portal</span>
          </button>

          <button
            onClick={() => setShowModuleModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Module & Scopes</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Custom Role</span>
          </button>
        </div>
      </div>

      {/* BLOCK COMMENT: SEARCH & TENANT SCOPE FILTER TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search roles by name, type, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:border-indigo-500 text-black placeholder-gray-400"
          />
        </div>

        {isSystemAdmin && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold uppercase text-gray-500 font-mono shrink-0">Tenant Scope:</span>
            <select
              value={selectedTenantScope}
              onChange={(e) => setSelectedTenantScope(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white font-semibold text-black focus:outline-none focus:border-indigo-500 cursor-pointer w-full sm:w-64"
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

      {/* Roles Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-gray-500 text-sm bg-white rounded-xl border border-gray-200 shadow-sm">
          Loading RBAC Roles...
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="p-12 text-center text-gray-500 text-sm bg-white rounded-xl border border-gray-200 shadow-sm">
          No roles found matching the current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRoles.map((role) => (
            <div
              key={role.id}
              className="bg-white border border-gray-200 hover:border-indigo-300 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{role.role_name}</h3>
                    <span className="text-xs text-gray-500 font-mono">type: {role.role_type}</span>
                  </div>

                  {role.is_system_preset ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      <Lock className="w-3 h-3" /> System Preset
                    </span>
                  ) : role.customer_id ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      <Building className="w-3 h-3" /> {customersList.find((c) => String(c.id) === String(role.customer_id))?.name || `Tenant ${role.customer_id}`}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <UserCheck className="w-3 h-3" /> System-wide Custom
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-600 mb-4 min-h-[32px] line-clamp-2">
                  {role.description || 'No description provided for this role profile.'}
                </p>

                {/* Permissions Badge List */}
                <div className="space-y-1.5 mb-4">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Permissions ({role.permissions?.length || 0})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {role.permissions?.map((pId: string) => (
                      <span
                        key={pId}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200"
                      >
                        {pId}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Actions Footer */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => handleOpenEditModal(role)}
                  className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Configure Permissions</span>
                </button>

                {!role.is_system_preset && (
                  <button
                    onClick={() => handleDeleteRole(role.id, role.is_system_preset)}
                    className="inline-flex items-center gap-1 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Role Builder Light Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          {/* BLOCK COMMENT: MODAL CONTAINER EXPANDED TO 85% OF SCREEN WIDTH */}
          <div className="bg-white border border-gray-200 rounded-2xl w-[85vw] max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            {/* BLOCK COMMENT: COMPACT MODAL HEADER & INLINE METADATA ROW */}
            <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between bg-gray-50/70">
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-extrabold text-gray-900">
                  {editingRole ? `Edit Role: ${editingRole.role_name}` : 'Create Custom Role'}
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                  {selectedPermissions.length} Scopes
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowRoleModal(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveRole} className="flex-1 overflow-y-auto p-5 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  {errorMessage}
                </div>
              )}

              {/* Role Metadata in a Single Inline Row */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-2xs items-center">
                <div className="md:col-span-4">
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                    Role Name *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={editingRole?.is_system_preset}
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="e.g. Senior Legal Analyst"
                    className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-black focus:border-indigo-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500 font-semibold"
                  />
                </div>

                <div className="md:col-span-5">
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    placeholder="e.g. Full legal research and document access permissions"
                    className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-black focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                    Scope / Tenant
                  </label>
                  {isSystemAdmin ? (
                    <select
                      disabled={editingRole?.is_system_preset}
                      value={roleCustomerId}
                      onChange={(e) => setRoleCustomerId(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-black font-semibold bg-white focus:border-indigo-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500 cursor-pointer"
                    >
                      <option value="system">System-wide (All Tenants)</option>
                      {customersList.map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          Tenant: {c.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-700 font-semibold truncate">
                      {customersList.find((c) => String(c.id) === String(customerId))?.name
                        ? `Tenant: ${customersList.find((c) => String(c.id) === String(customerId))?.name}`
                        : 'Current Tenant Account'}
                    </div>
                  )}
                </div>
              </div>

              {/* BLOCK COMMENT: 3-TIER PERMISSIONS SELECTOR WITH DEFAULT LIST VIEW & MODULE/SUBMODULE FILTERS */}
              <div className="space-y-3 pt-2">
                {/* FILTER TOOLBAR */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {/* Module Filter ("all" default) */}
                      <select
                        value={modalModuleFilter}
                        onChange={(e) => {
                          setModalModuleFilter(e.target.value);
                          setModalSubmoduleFilter('all');
                        }}
                        className="text-xs bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-800 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="all">All Modules</option>
                        {Array.from(new Set(permissionsFlatList.map((p) => p.module))).sort().map((m) => (
                          <option key={m} value={m}>
                            Module: {m}
                          </option>
                        ))}
                      </select>

                      {/* Submodule Filter ("all" default) */}
                      <select
                        value={modalSubmoduleFilter}
                        onChange={(e) => setModalSubmoduleFilter(e.target.value)}
                        className="text-xs bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-800 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="all">All Submodules</option>
                        {Array.from(
                          new Set(
                            permissionsFlatList
                              .filter((p) => modalModuleFilter === 'all' || p.module === modalModuleFilter)
                              .map((p) => p.submodule)
                              .filter(Boolean)
                          )
                        )
                          .sort()
                          .map((sm) => (
                            <option key={sm} value={sm}>
                              Submodule: {sm}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Search & View Mode Switcher */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <div className="relative flex-1 sm:w-44">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search scopes..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-2.5 py-1 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      {/* View Mode Toggle */}
                      <div className="flex items-center rounded-lg border border-gray-300 bg-white p-0.5 text-xs">
                        <button
                          type="button"
                          onClick={() => setModalViewMode('list')}
                          className={`px-2 py-1 rounded font-semibold transition cursor-pointer ${modalViewMode === 'list'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                          List View
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalViewMode('grouped')}
                          className={`px-2 py-1 rounded font-semibold transition cursor-pointer ${modalViewMode === 'grouped'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                          Grouped
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Batch Selection Quick Actions */}
                  {(() => {
                    const filtered = permissionsFlatList.filter((p) => {
                      const matchesSearch =
                        !searchQuery.trim() ||
                        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (p.label && p.label.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
                      const matchesMod = modalModuleFilter === 'all' || p.module === modalModuleFilter;
                      const matchesSub = modalSubmoduleFilter === 'all' || p.submodule === modalSubmoduleFilter;
                      return matchesSearch && matchesMod && matchesSub;
                    });

                    const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selectedPermissions.includes(p.id));

                    return (
                      <div className="flex items-center justify-between pt-1 text-xs border-t border-gray-200">
                        <span className="text-[11px] text-gray-500 font-medium">
                          Showing <strong className="text-gray-800">{filtered.length}</strong> of {permissionsFlatList.length} permissions
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const ids = filtered.map((p) => p.id);
                              if (allFilteredSelected) {
                                setSelectedPermissions((prev) => prev.filter((id) => !ids.includes(id)));
                              } else {
                                setSelectedPermissions((prev) => Array.from(new Set([...prev, ...ids])));
                              }
                            }}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                          >
                            {allFilteredSelected ? 'Deselect All Filtered' : 'Select All Filtered'}
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* LIST VIEW (DEFAULT) - HORIZONTAL COLUMNS ON SAME ROW */}
                {modalViewMode === 'list' && (
                  <div className="rounded-xl border border-gray-200 bg-white max-h-96 overflow-y-auto shadow-xs">
                    {/* Sticky Table Header */}
                    <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider grid grid-cols-12 gap-3 items-center sticky top-0 z-10">
                      <div className="col-span-4">Permission Scope ID</div>
                      <div className="col-span-2">Module / Submodule</div>
                      <div className="col-span-1">Layer</div>
                      <div className="col-span-5">Label & Description</div>
                    </div>

                    <div className="divide-y divide-gray-100">
                      {(() => {
                        const filtered = permissionsFlatList.filter((p) => {
                          const matchesSearch =
                            !searchQuery.trim() ||
                            p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (p.label && p.label.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
                          const matchesMod = modalModuleFilter === 'all' || p.module === modalModuleFilter;
                          const matchesSub = modalSubmoduleFilter === 'all' || p.submodule === modalSubmoduleFilter;
                          return matchesSearch && matchesMod && matchesSub;
                        });

                        if (filtered.length === 0) {
                          return (
                            <div className="p-8 text-center text-xs text-gray-400 italic">
                              No permissions found matching the selected module/submodule filters.
                            </div>
                          );
                        }

                        return filtered.map((p) => {
                          const isChecked = selectedPermissions.includes(p.id);
                          return (
                            <div
                              key={p.id}
                              onClick={() => handleTogglePermission(p.id)}
                              className={`grid grid-cols-12 gap-3 items-center px-4 py-2.5 text-xs transition cursor-pointer ${isChecked ? 'bg-indigo-50/60' : 'hover:bg-gray-50/80'
                                }`}
                            >
                              {/* Col 1: Checkbox + Permission Key */}
                              <div className="col-span-4 flex items-center gap-2.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => { }}
                                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer pointer-events-none shrink-0"
                                />
                                <code className="font-mono text-xs font-bold text-gray-900 truncate" title={p.id}>
                                  {p.id}
                                </code>
                              </div>

                              {/* Col 2: Module & Submodule Badges */}
                              <div className="col-span-2 flex items-center gap-1.5 flex-wrap">
                                <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200 text-[10px] font-bold">
                                  {p.module}
                                </span>
                                {p.submodule && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono">
                                    {p.submodule}
                                  </span>
                                )}
                              </div>

                              {/* Col 3: Target Layer */}
                              <div className="col-span-1">
                                <span
                                  className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${p.target_layer === 'both'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : p.target_layer === 'frontend'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-purple-100 text-purple-800'
                                    }`}
                                >
                                  {p.target_layer || 'both'}
                                </span>
                              </div>

                              {/* Col 4: Label & Description on Same Horizontal Row */}
                              <div className="col-span-5 flex items-center gap-2 min-w-0">
                                <span className="font-bold text-gray-800 shrink-0 text-xs">{p.label}</span>
                                {p.description && (
                                  <span className="text-[11px] text-gray-400 truncate" title={p.description}>
                                    — {p.description}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

                {/* GROUPED VIEW */}
                {modalViewMode === 'grouped' && (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {Object.entries(permissionsGrouped)

                      .filter(([moduleKey]) => modalModuleFilter === 'all' || moduleKey === modalModuleFilter)
                      .map(([moduleKey, submodulesObj]: [string, any]) => {
                        const submodules: Record<string, any[]> = Array.isArray(submodulesObj)
                          ? { general: submodulesObj }
                          : (submodulesObj || {});

                        return (
                          <div key={moduleKey} className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-3">
                            <div className="flex items-center justify-between border-b border-gray-200 pb-1.5">
                              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                                📦 {formatModuleName(moduleKey)}
                              </span>
                            </div>

                            {Object.entries(submodules)
                              .filter(([submodKey]) => modalSubmoduleFilter === 'all' || submodKey === modalSubmoduleFilter)
                              .map(([submodKey, permsList]: [string, any]) => {
                                const filteredPerms = (permsList as any[]).filter((p: any) =>
                                  !searchQuery.trim() ||
                                  p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  (p.label && p.label.toLowerCase().includes(searchQuery.toLowerCase()))
                                );

                                if (filteredPerms.length === 0) return null;

                                return (
                                  <div key={submodKey} className="pl-1 space-y-1.5">
                                    <span className="text-[10px] font-bold text-slate-600 uppercase">
                                      🔹 {submodKey}
                                    </span>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                                      {filteredPerms.map((p: any) => {
                                        const isChecked = selectedPermissions.includes(p.id);
                                        return (
                                          <label
                                            key={p.id}
                                            className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer ${isChecked
                                                ? 'bg-indigo-50/70 border-indigo-300 text-gray-900'
                                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                              }`}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={() => handleTogglePermission(p.id)}
                                              className="mt-0.5 rounded border-gray-300 text-indigo-600"
                                            />
                                            <div className="min-w-0">
                                              <div className="font-bold text-gray-900">{p.label || p.name}</div>
                                              <div className="text-[10px] font-mono text-indigo-600 truncate">{p.id}</div>
                                            </div>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>


              {/* Submit Footer */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : editingRole ? 'Save Changes' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Top-Level Module & Granular Permissions Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Module & Permission Manager</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Register or edit top-level modules (e.g., HealthCare, Education, Finance) and add granular permission scopes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModuleModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveModuleAndPermissions} className="space-y-5 overflow-y-auto pr-1 flex-1">
              {/* Quick Template Presets */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Quick Load Module Preset
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePresetModuleSelect('HealthCare')}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    🏥 HealthCare Preset
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetModuleSelect('Education')}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    🎓 Education Preset
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetModuleSelect('Finance')}
                    className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    💳 Finance Preset
                  </button>
                </div>
              </div>

              {/* Module Name Field */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Top Level Module Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="HealthCare, Education, Finance, Legal"
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-bold rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                />
              </div>

              {/* Dynamic Permissions List Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-gray-700">
                    Granular Permission Scopes <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPermissionRow}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Permission Scope</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {permissionRows.map((row, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2 relative"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                            Permission ID (e.g. health:patient:view)
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="health:patient:view"
                            value={row.id}
                            onChange={(e) => handleRowChange(idx, 'id', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs font-mono rounded-md border border-gray-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                            Permission Label / Title
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="View Patient Records"
                            value={row.label}
                            onChange={(e) => handleRowChange(idx, 'label', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-md border border-gray-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Description (optional)"
                          value={row.description}
                          onChange={(e) => handleRowChange(idx, 'description', e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs rounded-md border border-gray-300 focus:ring-2 focus:ring-emerald-500 bg-white text-gray-600"
                        />
                        {permissionRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePermissionRow(idx)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                            title="Remove permission row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Footer */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModuleModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingModule}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {savingModule ? 'Saving Module & Scopes...' : 'Save Module & Permissions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Route Permission Binding Portal Modal */}
      {showRouteBindingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-4xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-slate-800" />
                  Route Permission Binding Portal
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  System Admin UI portal to dynamically map, bind, and update route URL patterns to 3-tier permission keys.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRouteBindingModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-6 overflow-y-auto pr-1 flex-1">
              {/* Form to Create/Edit Binding */}
              <form onSubmit={handleSaveRouteBinding} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {editingRouteBinding ? 'Edit Route Permission Binding' : 'Add New Route Permission Binding'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">
                      URL Route Pattern (e.g. /admin/provider-presets) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="/admin/provider-presets"
                      value={routePattern}
                      onChange={(e) => setRoutePattern(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">
                      Required Permission Key (e.g. admin:provider_presets:view) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="admin:provider_presets:view"
                      value={boundPermissionId}
                      onChange={(e) => setBoundPermissionId(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-800 bg-white text-indigo-700 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">Module</label>
                    <input
                      type="text"
                      placeholder="admin"
                      value={routeModule}
                      onChange={(e) => setRouteModule(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">Submodule</label>
                    <input
                      type="text"
                      placeholder="provider_presets"
                      value={routeSubmodule}
                      onChange={(e) => setRouteSubmodule(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">Label</label>
                    <input
                      type="text"
                      placeholder="Provider Presets Menu"
                      value={routeLabel}
                      onChange={(e) => setRouteLabel(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  {editingRouteBinding && (
                    <button
                      type="button"
                      onClick={() => handleOpenRouteBindingModal()}
                      className="px-3 py-1 text-xs text-gray-600 hover:text-gray-900 cursor-pointer"
                    >
                      Clear Edit
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={savingRouteBinding}
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm"
                  >
                    {savingRouteBinding ? 'Saving...' : editingRouteBinding ? 'Update Binding' : 'Bind Route Pattern'}
                  </button>
                </div>
              </form>

              {/* Active Route Permission Registry Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Active Route Permission Registry ({routePermissions.length})
                </h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200 text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Route Pattern</th>
                        <th className="py-2.5 px-3">Bound Permission Key</th>
                        <th className="py-2.5 px-3">Module / Submodule</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {routePermissions.map((rp: any) => (
                        <tr key={rp.id || rp.pattern} className="hover:bg-gray-50 transition-colors">
                          <td className="py-2 px-3 font-mono text-gray-900 font-bold">{rp.pattern}</td>
                          <td className="py-2 px-3 font-mono text-indigo-700 font-bold">{rp.permission || rp.permission_id}</td>
                          <td className="py-2 px-3 text-gray-600">
                            {rp.module || '—'} / <span className="font-mono">{rp.submodule || '—'}</span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenRouteBindingModal(rp)}
                                className="p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
                                title="Edit Binding"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {!String(rp.id).startsWith('default_') && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRouteBinding(rp.id)}
                                  className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                                  title="Delete Binding"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowRouteBindingModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
              >
                Close Portal
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
