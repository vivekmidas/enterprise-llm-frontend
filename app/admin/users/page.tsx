'use client';

import React, { useEffect, useState } from 'react';
import { Edit2 } from 'lucide-react';
import { api } from '@/lib/api';
import { IconMap } from '@/lib/icons';

interface UsersTabProps {
  userId: string | null;
  loginEmail: string;
}

export default function UsersTab({ userId, loginEmail }: UsersTabProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add User Form States
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<string>('tenant_user');

  // Edit User Role Modal States
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editUserRole, setEditUserRole] = useState<string>('tenant_user');
  const [updating, setUpdating] = useState(false);

  const [rolesList, setRolesList] = useState<any[]>([]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [usrs, rls] = await Promise.all([
        api.getUsers().catch(() => []),
        api.getRoles().catch(() => [])
      ]);
      setUsers(usrs || []);
      setRolesList(rls || []);
    } catch (err) {
      console.error('Failed to fetch users or roles', err);
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
      await api.createUser({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
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
    setEditUserRole(user.role || 'tenant_user');
    setShowEditUserModal(true);
  };

  const handleSaveUserRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setUpdating(true);
    try {
      await api.updateUserRole(editingUser.id, {
        role: editUserRole,
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

  return (
    <section className="space-y-4">
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

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading users...</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Username</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">RBAC Role</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users?.map((u, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-black font-medium">{u.username}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.email_id}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-bold ${u.role === 'admin' || u.role === 'system_admin' || u.role === 'tenant_admin'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-sm font-medium ${u.status === 'active' ? 'text-green-600' : 'text-red-600'
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
              ))}
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
            <h3 className="text-xl font-bold text-black mb-4">Add Company User</h3>
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
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1 font-mono">
                  Assigned RBAC Role Profile
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-indigo-500 focus:outline-none"
                >
                  {rolesList.length > 0 ? (
                    rolesList.map((r) => (
                      <option key={r.id} value={r.role_type}>
                        {r.role_name} ({r.role_type}) — {r.permissions?.length || 0} permissions
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="tenant_user">Standard User (tenant_user)</option>
                      <option value="para_legal">Paralegal (para_legal)</option>
                      <option value="legal_analyst">Legal Analyst (legal_analyst)</option>
                      <option value="tenant_admin">Tenant Admin (tenant_admin)</option>
                    </>
                  )}
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
              Update RBAC role profile for <span className="font-semibold text-gray-800">{editingUser.email_id}</span>
            </p>

            <form onSubmit={handleSaveUserRole} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1 font-mono">
                  Assigned RBAC Role Profile
                </label>
                <select
                  value={editUserRole}
                  onChange={(e) => setEditUserRole(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-sm text-black focus:border-indigo-500 focus:outline-none"
                >
                  {rolesList.length > 0 ? (
                    rolesList.map((r) => (
                      <option key={r.id} value={r.role_type}>
                        {r.role_name} ({r.role_type}) — {r.permissions?.length || 0} permissions
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="tenant_user">Standard User (tenant_user)</option>
                      <option value="para_legal">Paralegal (para_legal)</option>
                      <option value="legal_analyst">Legal Analyst (legal_analyst)</option>
                      <option value="tenant_admin">Tenant Admin (tenant_admin)</option>
                      <option value="system_admin">System Admin (system_admin)</option>
                    </>
                  )}
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
