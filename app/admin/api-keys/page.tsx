'use client';

/**
 * ===============================================================================
 * BLOCK COMMENT: TENANT ADMIN API KEY MANAGEMENT UI
 * Component: frontend/app/admin/api-keys/page.tsx
 * Epic: EPIC-AUTH-001 / Story 1.5
 * Design Principles:
 *   1. Minimalist, clean visual hierarchy.
 *   2. Responsive flex/grid layouts with ZERO absolute positioning.
 *   3. Clear one-time credential reveal modal with copy-to-clipboard functionality.
 *   4. Granular scope and rate-limit controls.
 * ===============================================================================
 */

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  Power,
  Shield,
  ShieldAlert,
  Search,
  RefreshCw,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  Building2,
} from 'lucide-react';

interface APIKeyItem {
  id: string;
  customer_id: string;
  customer_name?: string | null;
  customer_domain?: string | null;
  user_id: string;
  role_id?: string | null;
  role_name?: string | null;
  role_type?: string | null;
  name: string;
  key_prefix: string;
  scopes?: string[];
  allowed_workflow_ids?: string[] | null;
  rate_limit_rpm: number;
  is_active: boolean;
  created_at: string;
  expires_at?: string | null;
  last_used_at?: string | null;
}

interface CustomerOption {
  id: string;
  name: string;
  domain?: string | null;
}

interface RoleOption {
  id: string;
  role_name: string;
  role_type: string;
  description?: string | null;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<APIKeyItem[]>([]);
  const [customersList, setCustomersList] = useState<CustomerOption[]>([]);
  const [rolesList, setRolesList] = useState<RoleOption[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>('all');
  const [selectedTenantForNewKey, setSelectedTenantForNewKey] = useState<string>('');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [rateLimit, setRateLimit] = useState(60);
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // One-time reveal modal state
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const targetCid = selectedTenantFilter !== 'all' ? selectedTenantFilter : undefined;
      const data = await api.getApiKeys(targetCid);
      setKeys(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch API keys:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRolesForTenant = async (tenantId?: string) => {
    setLoadingRoles(true);
    try {
      const roles = await api.getRoles(tenantId || undefined);
      const safeRoles = Array.isArray(roles) ? roles : [];
      setRolesList(safeRoles);
      if (safeRoles.length > 0) {
        setSelectedRoleId(safeRoles[0].id);
      } else {
        setSelectedRoleId('');
      }
    } catch (err) {
      console.error('Failed to fetch tenant roles:', err);
    } finally {
      setLoadingRoles(false);
    }
  };

  const loadInitialContext = async () => {
    try {
      const [custs, user] = await Promise.all([
        api.getCustomers().catch(() => []),
        api.getCurrentUser().catch(() => null),
      ]);
      const safeCusts = Array.isArray(custs) ? custs : [];
      setCustomersList(safeCusts);
      setCurrentUser(user);

      let targetTenant = '';
      if (user?.customer_id) {
        targetTenant = String(user.customer_id);
        setSelectedTenantForNewKey(targetTenant);
        if (user.role !== 'system_admin' && user.role_type !== 'system_admin') {
          setSelectedTenantFilter(targetTenant);
        }
      } else if (safeCusts.length > 0) {
        targetTenant = safeCusts[0].id;
        setSelectedTenantForNewKey(targetTenant);
      }
      if (targetTenant) {
        fetchRolesForTenant(targetTenant);
      }
    } catch (err) {
      console.error('Failed to load customers or current user context:', err);
    }
  };

  useEffect(() => {
    loadInitialContext();
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [selectedTenantFilter]);

  useEffect(() => {
    if (selectedTenantForNewKey) {
      fetchRolesForTenant(selectedTenantForNewKey);
    }
  }, [selectedTenantForNewKey]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setCreating(true);
    setErrorMsg(null);
    try {
      const created = await api.createApiKey({
        name: newKeyName.trim(),
        customer_id: selectedTenantForNewKey || undefined,
        role_id: selectedRoleId || undefined,
        rate_limit_rpm: Number(rateLimit) || 60,
      });

      setShowCreateModal(false);
      setNewKeyName('');
      setRateLimit(60);

      // Trigger one-time reveal modal
      if (created.plaintext_key) {
        setRevealedKey(created.plaintext_key);
      }
      await fetchKeys();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to generate API key');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (keyItem: APIKeyItem) => {
    try {
      await api.updateApiKey(keyItem.id, { is_active: !keyItem.is_active });
      await fetchKeys();
    } catch (err: any) {
      alert(err?.message || 'Failed to update key status');
    }
  };

  const handleDeleteKey = async (keyItem: APIKeyItem) => {
    if (
      !confirm(
        `Are you sure you want to permanently revoke API key "${keyItem.name}"? This cannot be undone.`,
      )
    ) {
      return;
    }
    try {
      await api.deleteApiKey(keyItem.id);
      await fetchKeys();
    } catch (err: any) {
      alert(err?.message || 'Failed to revoke API key');
    }
  };

  const handleCopyRevealedKey = async () => {
    if (!revealedKey) return;
    await navigator.clipboard.writeText(revealedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredKeys = keys.filter(
    (k) =>
      k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.key_prefix.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (k.customer_name && k.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (k.customer_id && k.customer_id.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <div className="min-h-screen bg-slate-50/60 p-6 sm:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Key className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">API Keys</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Manage headless service credentials and external client application tokens for workflow
            automation.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg(null);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Generate API Key</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl">
          {/* Relative flex search input (no absolute positioning) */}
          <div className="flex items-center flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all shadow-sm">
            <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
            <input
              type="text"
              placeholder="Search by name, prefix, or tenant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none"
            />
          </div>

          {/* Tenant Filter Dropdown */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedTenantFilter}
              onChange={(e) => setSelectedTenantFilter(e.target.value)}
              className="text-xs font-medium bg-transparent text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Tenants</option>
              {customersList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.domain ? `(${c.domain})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={fetchKeys}
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="mt-5 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Name</th>
                <th className="px-6 py-3.5">Tenant</th>
                <th className="px-6 py-3.5">Key Prefix</th>
                <th className="px-6 py-3.5">Assigned Role</th>
                <th className="px-6 py-3.5">Rate Limit</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Last Used</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-sm">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading API keys...
                  </td>
                </tr>
              ) : filteredKeys.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-sm">
                    <Key className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No API keys found. Generate one to enable external API integrations.
                  </td>
                </tr>
              ) : (
                filteredKeys.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md text-xs font-medium text-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{item.customer_name || item.customer_id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">
                      <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200">
                        {item.key_prefix}••••••••
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-100/80 rounded-md text-xs font-semibold text-indigo-700">
                        <Shield className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{item.role_name || item.role_type || 'Service Account'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                      {item.rate_limit_rpm} rpm
                    </td>
                    <td className="px-6 py-4">
                      {item.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {item.last_used_at
                        ? new Date(item.last_used_at).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleActive(item)}
                          title={item.is_active ? 'Disable key' : 'Activate key'}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            item.is_active
                              ? 'text-slate-500 hover:text-amber-600 border-slate-200 hover:bg-amber-50'
                              : 'text-slate-400 hover:text-emerald-600 border-slate-200 hover:bg-emerald-50'
                          }`}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteKey(item)}
                          title="Revoke key"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Key className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Generate New API Key</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateKey} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Associated Tenant / Customer <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <select
                    required
                    value={selectedTenantForNewKey}
                    onChange={(e) => setSelectedTenantForNewKey(e.target.value)}
                    className="w-full text-sm bg-transparent focus:outline-none text-slate-800 cursor-pointer"
                  >
                    {customersList.length === 0 ? (
                      <option value="">No tenants found</option>
                    ) : (
                      customersList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.domain ? `(${c.domain})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  The generated secret token will be strictly bound to this tenant.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Key Name / Description <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CRM Sync Bot, Legal Client Plant"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Assigned Role <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500">
                  <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                  <select
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    disabled={loadingRoles}
                    className="w-full text-sm bg-transparent focus:outline-none text-slate-800 cursor-pointer"
                  >
                    {rolesList.length === 0 ? (
                      <option value="">No roles available (default service account)</option>
                    ) : (
                      rolesList.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.role_name} ({r.role_type})
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Authorization is role-based. Permissions and accessible endpoints are derived from
                  this role.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Rate Limit (RPM)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={rateLimit}
                  onChange={(e) => setRateLimit(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {creating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Generate Key</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* One-Time Key Reveal Modal */}
      {revealedKey && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 text-emerald-600">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <h2 className="text-base font-bold text-slate-900">API Key Successfully Generated</h2>
            </div>

            <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-bold">Important Security Notice:</span>
                <p className="mt-0.5 text-amber-700 leading-relaxed">
                  Copy and store this secret key in a secure location now. For your security, it
                  will never be displayed again.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Secret Token
              </label>
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="flex-1 font-mono text-xs text-slate-800 break-all select-all">
                  {revealedKey}
                </span>
                <button
                  onClick={handleCopyRevealedKey}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setRevealedKey(null)}
                className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
              >
                I have saved this key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
