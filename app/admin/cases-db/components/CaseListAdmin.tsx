'use client';

import { useEffect, useState } from 'react';
import { getAllCases, updateCase } from '@/lib/api/cases';
import { Case } from '@/lib/types/case';
import { AlertCircle, Loader, Edit2, Save, X } from 'lucide-react';
import { Badge } from '@/app/components/Badge';

export default function CaseListAdmin() {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Case>>({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadCases();
  }, [page]);

  const loadCases = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getAllCases(page, 10);
      setCases(result.cases);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cases');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (caseData: Case) => {
    setEditingId(caseData.id);
    setEditData(caseData);
  };

  const handleSave = async () => {
    if (!editingId) return;

    try {
      await updateCase(editingId, editData);
      setCases(
        cases.map((c) => (c.id === editingId ? { ...c, ...editData } : c))
      );
      setEditingId(null);
      setEditData({});
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update case');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex items-start gap-4 bg-red-50 h-full">
        <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-lg font-medium text-red-900">Failed to Load Cases</p>
          <p className="text-red-700 mt-2">{error}</p>
          <button
            onClick={loadCases}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Cases ({total})</h2>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm">
              + Add Case
            </button>
          </div>
        </div>
      </div>

      {/* Cases Table */}
      <div className="flex-1 overflow-y-auto">
        {cases.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg">No cases found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {cases.map((caseData) => (
              <div key={caseData.id} className="bg-white hover:bg-gray-50 transition">
                {editingId === caseData.id ? (
                  <div className="p-6 space-y-4 border-l-4 border-blue-500">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={editData.title || ''}
                          onChange={(e) =>
                            setEditData({ ...editData, title: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          value={editData.status || ''}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              status: e.target.value as any,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="open">Open</option>
                          <option value="closed">Closed</option>
                          <option value="pending">Pending</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Judge
                        </label>
                        <input
                          type="text"
                          value={editData.judge || ''}
                          onChange={(e) =>
                            setEditData({ ...editData, judge: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Court
                        </label>
                        <input
                          type="text"
                          value={editData.court || ''}
                          onChange={(e) =>
                            setEditData({ ...editData, court: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location
                        </label>
                        <input
                          type="text"
                          value={editData.location || ''}
                          onChange={(e) =>
                            setEditData({ ...editData, location: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Article
                        </label>
                        <input
                          type="text"
                          value={editData.article || ''}
                          onChange={(e) =>
                            setEditData({ ...editData, article: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                      >
                        <Save size={16} />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition font-medium"
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{caseData.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{caseData.description}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {caseData.judge && (
                          <Badge className="bg-blue-50 text-blue-700 border border-blue-200">
                            {caseData.judge}
                          </Badge>
                        )}
                        {caseData.court && (
                          <Badge className="bg-purple-50 text-purple-700 border border-purple-200">
                            {caseData.court}
                          </Badge>
                        )}
                        {caseData.location && (
                          <Badge className="bg-orange-50 text-orange-700 border border-orange-200">
                            {caseData.location}
                          </Badge>
                        )}
                        <Badge className="bg-gray-100 text-gray-800">
                          {caseData.status}
                        </Badge>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEdit(caseData)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium text-sm flex-shrink-0 ml-4"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Page {page} • Showing {cases.length} of {total} cases
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(page + 1)}
            disabled={cases.length < 10}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
