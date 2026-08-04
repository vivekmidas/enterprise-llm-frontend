'use client';

import { useState } from 'react';
import { useSearchStore } from '@/lib/stores/searchStore';
import { saveQuery } from '@/lib/api/cases';
import { X, Loader } from 'lucide-react';

interface SaveQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SaveQueryModal({ isOpen, onClose }: SaveQueryModalProps) {
  const { searchText, filters, searchMode, addSavedQuery } = useSearchStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Query name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const savedQuery = await saveQuery({
        name: name.trim(),
        description: description.trim() || undefined,
        query_text: searchText,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        search_mode: searchMode,
        is_public: isPublic,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t),
      });

      addSavedQuery(savedQuery);
      setName('');
      setDescription('');
      setTags('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save query');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Save This Search</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Query Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Query Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Contract Disputes 2024"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of this search query"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Comma-separated tags (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Privacy */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded"
            />
            <div>
              <label htmlFor="isPublic" className="text-sm font-medium text-gray-700 cursor-pointer">
                Make this query public
              </label>
              <p className="text-xs text-gray-600 mt-0.5">
                Public queries are visible to all users in your tenant
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <p className="font-medium text-blue-900 mb-1">Query Details:</p>
            <p className="text-blue-800">Search: {searchText || '(filters only)'}</p>
            <p className="text-blue-800">Mode: {searchMode}</p>
            <p className="text-blue-800">
              Filters: {Object.keys(filters).length > 0 ? 'Yes' : 'None'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading && <Loader size={16} className="animate-spin" />}
              Save Query
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
