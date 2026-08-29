/*
===============================================================================
BLOCK COMMENT: USER MANAGEMENT TAB WITH TENANT FILTERING
Module: frontend/app/admin/users/page.tsx
Description:
    User Management tab with tenant/customer filter ("All" default).
    - Lists all users across tenants.
    - Tenant filter dropdown populated dynamically from the Customer table.
    - Filter by username, email, role, and tenant.
===============================================================================
*/

'use client';

import React, { useEffect, useState } from 'react';
import { Edit2, Search, Building2, UserPlus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { IconMap } from '@/lib/icons';

interface UsersTabProps {
  userId: string | null;
  loginEmail: string;
  customerId?: string | null;
  userRole?: string | null;
}

export default function UsersTab({ userId, loginEmail, customerId, userRole }: UsersTabProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [rolesList, setRolesList] = useState<any[]>([]);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State (Default: customerId if given, else 'all')
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>(
    customerId !== undefined && customerId !== null ? String(customerId) : 'all',
  );

  // Add User Form States
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRoleId, setNewUserRoleId] = useState<string>('');
  const [newUserCustomerId, setNewUserCustomerId] = useState<string>(
    customerId !== undefined && customerId !== null ? String(customerId) : '',
  );

  // Edit User Role Modal States
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editUserRoleId, setEditUserRoleId] = useState<string>('');
  const [editUserCustomerId, setEditUserCustomerId] = useState<string>(
    customerId !== undefined && customerId !== null ? String(customerId) : 'system',
  );
  const [updating, setUpdating] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const targetCid =
        customerId !== undefined && customerId !== null
          ? customerId
          : selectedTenantFilter !== 'all'
            ? selectedTenantFilter
            : undefined;

      const [usrs, rls, custs] = await Promise.all([
        api.getUsers(targetCid).catch(() => []),
        api.getRoles(targetCid ? String(targetCid) : undefined).catch(() => []),
        api.getCustomers().catch(() => []),
      ]);
      const safeUsers = Array.isArray(usrs) ? usrs : [];
      const safeRoles = Array.isArray(rls) ? rls : [];
      const safeCusts = Array.isArray(custs) ? custs : [];

      setUsers(safeUsers);
      setRolesList(safeRoles);
      setCustomersList(safeCusts);
      if (safeRoles.length > 0 && !newUserRoleId) {
        setNewUserRoleId(String(safeRoles[0].id));
      }
      if (safeCusts.length > 0 && !newUserCustomerId) {
        setNewUserCustomerId(customerId ? String(customerId) : String(safeCusts[0].id));
      }
    } catch (err) {
      console.error('Failed to fetch users, roles, or customers', err);
      setUsers([]);
      setRolesList([]);
      setCustomersList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedRole = rolesList.find((r) => String(r.id) === String(newUserRoleId));
      await api.createUser({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: selectedRole ? selectedRole.role_type : newUserRoleId || 'tenant_user',
        role_id: selectedRole ? selectedRole.id : newUserRoleId || undefined,
        customer_id: newUserCustomerId ? String(newUserCustomerId) : undefined,
      });
      setShowAddUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      fetchUsers();
    } catch (err: any) {
      alert('Failed to add user: ' + err.message);
    }
  };

  const handleOpenEditUserModal = (user: any) => {
    setEditingUser(user);
    const matchedRole = rolesList.find(
      (r) =>
        String(r.id) === String(user.role_id) ||
        r.role_type === user.role ||
        r.role_name === user.role,
    );
    setEditUserRoleId(
      matchedRole ? String(matchedRole.id) : user.role_id || user.role || 'tenant_user',
    );
    setEditUserCustomerId(user.customer_id ? String(user.customer_id) : 'system');
    setShowEditUserModal(true);
  };

  const handleSaveUserRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setUpdating(true);
    try {
      const selectedRole = rolesList.find((r) => String(r.id) === String(editUserRoleId));
      await api.updateUserRole(editingUser.id, {
        role: selectedRole ? selectedRole.role_type : editUserRoleId,
        role_id: selectedRole ? selectedRole.id : editUserRoleId,
        customer_id: editUserCustomerId === 'system' ? null : editUserCustomerId,
      });
      setShowEditUserModal(false);
      fetchUsers();
    } catch (err: any) {
      alert('Failed to update user role: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async (targetUser: any) => {
    if (String(targetUser.id) === String(userId)) {
      alert('You cannot delete your own account.');
      return;
    }

    if (!confirm(`Are you sure you want to delete user "${targetUser.username}"?`)) {
      return;
    }

    try {
      await api.deleteUser(targetUser.id);
      fetchUsers();
    } catch (err: any) {
      alert('Failed to delete user: ' + err.message);
    }
  };

  // Filtered Users List
  const userList = Array.isArray(users) ? users : [];
  const filteredUsers = userList.filter((u) => {
    if (!u) return false;
    const matchesSearch =
      !searchQuery.trim() ||
      (u.username && String(u.username).toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email_id && String(u.email_id).toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.name && String(u.name).toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.role && String(u.role).toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTenant =
      selectedTenantFilter === 'all' || String(u.customer_id) === String(selectedTenantFilter);

    return matchesSearch && matchesTenant;
  });

  return (
    <section className="space-y-4">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconMap.users className="h-5 w-5 text-gray-400" />
          <h2 className="text-xl font-semibold text-black">User Management</h2>
        </div>
        <button
          onClick={() => setShowAddUserModal(true)}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold shadow-sm transition-all cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <IconMap.plus className="h-4 w-4" /> Add User
        </button>
      </div>

      {/* FILTER & TENANT SELECTION BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name, username, or email..."
            className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-black focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* TENANT FILTER (DEFAULT: ALL) */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-gray-400" /> Tenant:
          </span>
          <select
            value={selectedTenantFilter}
            onChange={(e) => setSelectedTenantFilter(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-800 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer w-full sm:w-56"
          >
            <option value="all">All Tenants ({users.length} Users)</option>
            {customersList.map((c) => {
              const userCount = users.filter((u) => String(u.customer_id) === String(c.id)).length;
              return (
                <option key={c.id} value={String(c.id)}>
                  {c.name} ({userCount})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm italic">
            No users found matching current filter.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Username</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                  Tenant / Customer
                </th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">RBAC Role</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((u, i) => {
                const tenantObj = customersList.find((c) => String(c.id) === String(u.customer_id));
                return (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-black font-medium">{u.username}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.email_id}</td>
                    <td className="px-4 py-3">
                      {tenantObj ? (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
                          {tenantObj.name}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 font-mono italic">System-wide</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const roleObj = rolesList.find(
                          (r) =>
                            String(r.id) === String(u.role_id) ||
                            r.role_type === u.role ||
                            r.role_name === u.role,
                        );
                        const isSuperOrAdmin =
                          u.role === 'admin' ||
                          u.role === 'system_admin' ||
                          u.role === 'tenant_admin' ||
                          (roleObj &&
                            (roleObj.role_type === 'system_admin' ||
                              roleObj.role_type === 'tenant_admin'));
                        return (
                          <span
                            className={`px-2.5 py-1 rounded text-xs font-bold ${
                              isSuperOrAdmin
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {roleObj ? roleObj.role_name : u.role}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm font-medium ${
                          u.status === 'active' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditUserModal(u)}
                        title="Edit User Role"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-indigo-200 text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u)}
                        disabled={String(u.id) === String(userId) || u.role === 'system_admin'}
                        title={
                          String(u.id) === String(userId)
                            ? 'You cannot delete your own account'
                            : u.role === 'system_admin'
                              ? 'System admin users cannot be deleted'
                              : 'Delete user'
                        }
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-100 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-gray-100 disabled:text-gray-300 disabled:hover:bg-white cursor-pointer"
                      >
                        <IconMap.trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
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

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
            <h3 className="text-xl font-bold text-black mb-4">Add User</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. Jane Smith"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. jane@acme.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-indigo-500 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>

              {/* Customer / Tenant Assignment */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1 font-mono">
                  Customer Tenant Organization
                </label>
                <select
                  value={newUserCustomerId}
                  onChange={(e) => setNewUserCustomerId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">None (System Wide)</option>
                  {customersList.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name} (ID: {c.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1 font-mono">
                  Assigned RBAC Role Profile
                </label>
                <select
                  value={newUserRoleId}
                  onChange={(e) => setNewUserRoleId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-indigo-500 focus:outline-none font-semibold"
                >
                  {(() => {
                    const filteredRoles = rolesList.filter(
                      (r) =>
                        r.is_system_preset ||
                        !r.customer_id ||
                        String(r.customer_id) === String(newUserCustomerId),
                    );
                    return filteredRoles.length > 0 ? (
                      filteredRoles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.role_name} ({r.role_type}){' '}
                          {r.customer_id ? '— [Tenant Custom]' : '— [System]'}
                        </option>
                      ))
                    ) : (
                      <option value="tenant_user">Standard User (tenant_user)</option>
                    );
                  })()}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-sm font-bold rounded-lg shadow-md transition-all cursor-pointer bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Role Modal */}
      {showEditUserModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-gray-100">
            <h3 className="text-lg font-bold text-black mb-1">Edit User Role</h3>
            <p className="text-xs text-gray-500 mb-4">
              Update RBAC role profile for{' '}
              <span className="font-semibold text-gray-800">{editingUser.email_id}</span>
            </p>

            <form onSubmit={handleSaveUserRole} className="space-y-4">
              {/* BLOCK COMMENT: ASSIGNED CUSTOMER / TENANT SELECTOR */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1 font-mono">
                  Assigned Customer / Tenant
                </label>
                <select
                  value={editUserCustomerId}
                  onChange={(e) => setEditUserCustomerId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-sm text-black focus:border-indigo-500 focus:outline-none bg-white cursor-pointer"
                >
                  <option value="system">System-wide (No Tenant)</option>
                  {customersList.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      Tenant: {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1 font-mono">
                  Assigned RBAC Role Profile
                </label>
                <select
                  value={editUserRoleId}
                  onChange={(e) => setEditUserRoleId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-sm text-black focus:border-indigo-500 focus:outline-none font-semibold"
                >
                  {(() => {
                    const filteredRoles = rolesList.filter(
                      (r) =>
                        r.is_system_preset ||
                        !r.customer_id ||
                        (editUserCustomerId !== 'system' &&
                          String(r.customer_id) === String(editUserCustomerId)),
                    );
                    return filteredRoles.length > 0 ? (
                      filteredRoles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.role_name} ({r.role_type}){' '}
                          {r.customer_id ? '— [Tenant Custom]' : '— [System]'}
                        </option>
                      ))
                    ) : (
                      <option value="tenant_user">Standard User (tenant_user)</option>
                    );
                  })()}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Update Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
