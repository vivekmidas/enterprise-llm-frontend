'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { IconMap } from '@/lib/icons';

export default function OAuthTab() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProvider, setEditingProvider] = useState<any | null>(null);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const providersRes = await api.getProviders();
      setProviders(providersRes || []);
    } catch (err) {
      console.error('Failed to fetch providers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleSaveProvider = async () => {
    if (!editingProvider) return;
    try {
      await api.createProvider(editingProvider);
      fetchProviders();
      setEditingProvider(null);
    } catch (error) {
      console.error('Failed to save provider:', error);
      alert('Failed to save provider configuration.');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400 text-sm">Loading OAuth providers...</div>;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconMap.network className="h-5 w-5 text-gray-400" />
          <h2 className="text-xl font-semibold text-black">OAuth Configuration</h2>
        </div>
        <button
          onClick={() =>
            setEditingProvider({
              name: '',
              label: '',
              auth_url: '',
              token_url: '',
              callback_url: '',
              default_scopes: '',
              icon: 'box',
            })
          }
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition-all cursor-pointer"
        >
          <IconMap.plus className="h-4 w-4" /> Add Provider
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {providers?.map((provider) => (
          <div
            key={provider.id}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4 mb-4">
              <div>
                <h3 className="font-bold text-black">{provider.label}</h3>
                <p className="text-xs text-gray-400 font-mono">{provider.name}</p>
              </div>
            </div>
            <div className="space-y-2 mb-6">
              <div className="text-[10px] uppercase font-bold text-gray-400">Default Scopes</div>
              <div className="text-xs text-gray-600 break-all bg-gray-50 p-2 rounded">
                {provider.default_scopes}
              </div>
            </div>
            <button
              onClick={() => setEditingProvider(provider)}
              className="w-full py-2 text-sm font-semibold text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
            >
              Configure
            </button>
          </div>
        ))}
      </div>

      {/* Provider Modal */}
      {editingProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
              <h3 className="text-xl font-bold text-black">
                {editingProvider.id ? 'Edit Provider' : 'New Provider'}
              </h3>
              <button
                onClick={() => setEditingProvider(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <IconMap.X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">
                  Provider Name (ID)
                </label>
                <input
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black bg-white"
                  value={editingProvider.name}
                  onChange={(e) => setEditingProvider({ ...editingProvider, name: e.target.value })}
                  placeholder="gmail"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">
                  Display Label
                </label>
                <input
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black bg-white"
                  value={editingProvider.label}
                  onChange={(e) =>
                    setEditingProvider({ ...editingProvider, label: e.target.value })
                  }
                  placeholder="Google Gmail"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">
                  Authorization URL
                </label>
                <input
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black bg-white"
                  value={editingProvider.auth_url}
                  onChange={(e) =>
                    setEditingProvider({ ...editingProvider, auth_url: e.target.value })
                  }
                  placeholder="https://accounts.google.com/o/oauth2/v2/auth"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Token URL</label>
                <input
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black bg-white"
                  value={editingProvider.token_url}
                  onChange={(e) =>
                    setEditingProvider({ ...editingProvider, token_url: e.target.value })
                  }
                  placeholder="https://oauth2.googleapis.com/token"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">
                  Callback URL
                </label>
                <input
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black bg-white"
                  value={editingProvider.callback_url}
                  onChange={(e) =>
                    setEditingProvider({ ...editingProvider, callback_url: e.target.value })
                  }
                  placeholder="http://localhost:8000/api/auth/callback/gmail"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">
                  Default Scopes
                </label>
                <textarea
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm h-20 text-black bg-white"
                  value={editingProvider.default_scopes}
                  onChange={(e) =>
                    setEditingProvider({ ...editingProvider, default_scopes: e.target.value })
                  }
                  placeholder="https://www.googleapis.com/auth/gmail.readonly"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Icon Name</label>
                <input
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black bg-white"
                  value={editingProvider.icon}
                  onChange={(e) => setEditingProvider({ ...editingProvider, icon: e.target.value })}
                />
              </div>
            </div>
            <div className="border-t bg-gray-50 px-4 py-3 flex justify-end gap-3">
              <button
                onClick={() => setEditingProvider(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProvider}
                className="bg-blue-600 px-6 py-2 text-sm font-bold text-white rounded-lg shadow-md hover:bg-blue-700 transition-all cursor-pointer"
              >
                {editingProvider.id ? 'Update Provider' : 'Create Provider'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
