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

export default function RolesTab() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissionsGrouped, setPermissionsGrouped] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Module & Permission Builder Modal States
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleName, setModuleName] = useState('HealthCare');
  const [permissionRows, setPermissionRows] = useState<
    Array<{ id: string; label: string; description: string }>
  >([
    { id: 'health:admin:*', label: 'Healthcare Admin Full Access', description: 'Full access to healthcare domain' },
    { id: 'health:patient:view', label: 'View Patient Records', description: 'View HIPAA patient medical records' },
    { id: 'health:claims:process', label: 'Process Insurance Claims', description: 'Verify and process insurance claims' },
  ]);
  const [savingModule, setSavingModule] = useState(false);

  const handleAddPermissionRow = () => {
    const modPrefix = moduleName.toLowerCase().replace(/[^a-z0-9]/g, '');
    setPermissionRows((prev) => [
      ...prev,
      { id: `${modPrefix}:resource:action`, label: 'New Permission Scope', description: '' },
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
        permissions: permissionRows.map((r) => ({
          id: r.id.trim().toLowerCase(),
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
      setModuleName('HealthCare');
      setPermissionRows([
        { id: 'health:admin:*', label: 'Healthcare Admin Full Access', description: 'Full access to healthcare domain' },
        { id: 'health:patient:view', label: 'View Patient Records', description: 'View HIPAA patient medical records' },
        { id: 'health:claims:process', label: 'Process Insurance Claims', description: 'Verify and process insurance claims' },
      ]);
    } else if (presetName === 'Education') {
      setModuleName('Education');
      setPermissionRows([
        { id: 'edu:admin:*', label: 'Education Admin Full Access', description: 'Full access to education portal' },
        { id: 'edu:student:view', label: 'View Student Records', description: 'Access student profiles and transcripts' },
        { id: 'edu:course:manage', label: 'Manage Courses & Curriculum', description: 'Create and update course material' },
      ]);
    } else if (presetName === 'Finance') {
      setModuleName('Finance');
      setPermissionRows([
        { id: 'fin:admin:*', label: 'Finance Admin Full Access', description: 'Full access to financial records' },
        { id: 'fin:ledger:view', label: 'View General Ledger', description: 'Inspect audit ledger and journal entries' },
        { id: 'fin:payout:approve', label: 'Approve Payouts', description: 'Authorize high-value financial transfers' },
      ]);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesData, permsData] = await Promise.all([
        api.request('/roles').catch(() => []),
        api.request('/roles/permissions').catch(() => ({ grouped_by_module: {}, permissions: [] }))
      ]);
      setRoles(rolesData || []);
      setPermissionsGrouped(permsData.grouped_by_module || {});
    } catch (err) {
      console.error('Failed to load roles and permissions', err);
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
    setSelectedPermissions(['legal:research:query', 'kb:base:view', 'node:view']); // Default baseline
    setErrorMessage(null);
    setShowRoleModal(true);
  };

  const handleOpenEditModal = (role: any) => {
    setEditingRole(role);
    setRoleName(role.role_name);
    setRoleDescription(role.description || '');
    setSelectedPermissions(role.permissions || []);
    setErrorMessage(null);
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
      if (editingRole) {
        await api.request(`/roles/${editingRole.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            role_name: roleName,
            description: roleDescription,
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

  const formatModuleName = (mod: string) => {
    const key = (mod || '').toLowerCase();
    switch (key) {
      case 'legal':
        return 'Legal & Court Domain';
      case 'knowledge':
      case 'kb':
        return 'Knowledge Base & Retrieval';
      case 'workflows':
      case 'workflow':
        return 'Workflows & Execution';
      case 'nodes':
      case 'node':
        return 'Agent Node Governance';
      case 'tenant':
      case 'admin':
        return 'Administration & Security';
      case 'healthcare':
        return 'Healthcare & Clinical Domain';
      case 'finance':
        return 'Finance & Accounting Domain';
      default:
        return key.charAt(0).toUpperCase() + key.slice(1) + ' Domain';
    }
  };

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
                RBAC Active
              </span>
            </h2>
            <p className="text-sm text-gray-500">
              Configure role profiles, register domain permission scopes (e.g. Healthcare, Finance), and manage access policies.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModuleModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Module & Permissions</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Role</span>
          </button>
        </div>
      </div>

      {/* Roles Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-gray-500 text-sm bg-white rounded-xl border border-gray-200 shadow-sm">
          Loading RBAC Roles...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map((role) => (
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
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <UserCheck className="w-3 h-3" /> Custom Role
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
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingRole ? `Edit Role: ${editingRole.role_name}` : 'Create Custom Role'}
                </h3>
                <p className="text-xs text-gray-500">
                  Select permission scopes to define access capabilities for this role profile.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                  {selectedPermissions.length} Scopes Selected
                </span>
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveRole} className="flex-1 overflow-y-auto p-6 space-y-6">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  {errorMessage}
                </div>
              )}

              {/* Role Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Role Name *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={editingRole?.is_system_preset}
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="e.g. Senior Legal Analyst"
                    className="w-full rounded-lg border border-gray-200 p-2.5 text-sm text-black focus:border-indigo-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    placeholder="e.g. Full legal research and document access"
                    className="w-full rounded-lg border border-gray-200 p-2.5 text-sm text-black focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Permissions Checklist Matrix */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Permissions Checklist Matrix
                  </h4>
                  <div className="relative w-48">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Filter permissions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 py-1 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {Object.entries(permissionsGrouped).map(([moduleKey, modulePerms]) => {
                  const filteredPerms = modulePerms.filter(
                    (p) =>
                      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
                  );

                  if (filteredPerms.length === 0) return null;

                  const allModuleSelected = filteredPerms.every((p) =>
                    selectedPermissions.includes(p.id)
                  );

                  return (
                    <div
                      key={moduleKey}
                      className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-700">
                          {formatModuleName(moduleKey)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleToggleModuleAll(filteredPerms)}
                          className="text-[11px] text-gray-500 hover:text-indigo-600 font-semibold transition-colors cursor-pointer"
                        >
                          {allModuleSelected ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {filteredPerms.map((p) => {
                          const isChecked = selectedPermissions.includes(p.id);
                          return (
                            <label
                              key={p.id}
                              className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                                isChecked
                                  ? 'bg-indigo-50/70 border-indigo-300 text-gray-900'
                                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePermission(p.id)}
                                className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <div>
                                <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                                  <span>{p.name}</span>
                                  <span className="text-[10px] font-mono text-gray-500 px-1.5 py-0.2 bg-gray-100 rounded border border-gray-200">
                                    {p.id}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-500 leading-snug mt-0.5">
                                  {p.description}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
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
    </section>
  );
}
