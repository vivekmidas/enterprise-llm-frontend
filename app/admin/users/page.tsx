'use client';

import React, { useEffect, useState } from 'react';
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
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usrs = await api.getUsers().catch(() => []);
      setUsers(usrs || []);
    } catch (err) {
      console.error('Failed to fetch users', err);
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

  const handleDeleteUser = async (targetUser: any) => {
    if (String(targetUser.id) === String(userId)) {
      alert('You cannot delete your own account.');
      return;
    }
    if (
      !confirm(`Are you sure you want to delete ${targetUser.email_id || targetUser.username}?`)
    ) {
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
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Role</th>
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
                      className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        u.role === 'admin' || u.role === 'system_admin'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {u.role}
                    </span>
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
                  <td className="px-4 py-3 text-right">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
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
                  className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-bg-primary focus:outline-none"
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
                  className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-bg-primary focus:outline-none"
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
                  className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-bg-primary focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'user')}
                  className="w-full rounded-lg border border-gray-200 p-2 text-sm text-black focus:border-bg-primary focus:outline-none"
                >
                  <option value="user">User (can build workflows)</option>
                  <option value="admin">Admin (can manage users + config nodes)</option>
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
                  className="px-6 py-2 text-sm font-bold rounded-lg shadow-md transition-all cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
