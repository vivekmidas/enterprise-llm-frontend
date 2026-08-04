'use client';

import { useEffect, useState } from 'react';
import { useSearchStore } from '@/lib/stores/searchStore';
import { getSavedQueries, deleteQuery } from '@/lib/api/cases';
import { SavedQuery } from '@/lib/types/case';
import { ChevronDown, Trash2, Play, Share2 } from 'lucide-react';

export default function SavedQueriesPanel() {
  const {
    savedQueries,
    setSavedQueries,
    removeSavedQuery,
    setSearchText,
    setFilters,
    setSearchMode,
  } = useSearchStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPublicOnly, setShowPublicOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadSavedQueries = async () => {
      setIsLoading(true);
      try {
        const queries = await getSavedQueries();
        setSavedQueries(queries);
      } catch (error) {
        console.error('[v0] Failed to load saved queries:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedQueries();
  }, [setSavedQueries]);

  const handleDeleteQuery = async (queryId: string) => {
    try {
      await deleteQuery(queryId);
      removeSavedQuery(queryId);
    } catch (error) {
      console.error('[v0] Failed to delete query:', error);
    }
  };

  const handleLoadQuery = (query: SavedQuery) => {
    if (query.query_text) {
      setSearchText(query.query_text);
    }
    if (query.filters) {
      setFilters(query.filters);
    }
    if (query.search_mode) {
      setSearchMode(query.search_mode);
    }
  };

  const filteredQueries = showPublicOnly
    ? savedQueries.filter((q) => q.is_public)
    : savedQueries;

  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-2">
          <ChevronDown
            size={18}
            className={`transition transform ${isExpanded ? '' : '-rotate-90'}`}
          />
          <span className="font-medium text-sm">Saved Searches</span>
          {filteredQueries.length > 0 && (
            <span className="bg-blue-100 text-blue-700 text-xs rounded-full px-2 py-1">
              {filteredQueries.length}
            </span>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
          {/* Filter Toggle */}
          <div className="mb-3 flex gap-2">
            <button
              onClick={() => setShowPublicOnly(!showPublicOnly)}
              className={`text-xs px-2 py-1 rounded border transition ${
                showPublicOnly
                  ? 'bg-blue-100 text-blue-700 border-blue-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
            >
              <Share2 size={12} className="inline mr-1" />
              Public Only
            </button>
          </div>

          {/* Queries List */}
          {isLoading ? (
            <p className="text-xs text-gray-500 py-2">Loading...</p>
          ) : filteredQueries.length === 0 ? (
            <p className="text-xs text-gray-500 py-2">
              {showPublicOnly ? 'No public queries yet' : 'No saved searches yet'}
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredQueries.map((query) => (
                <div
                  key={query.id}
                  className="bg-white border border-gray-200 rounded p-2 hover:shadow-sm transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-medium text-gray-900 truncate">
                        {query.name}
                      </h4>
                      {query.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                          {query.description}
                        </p>
                      )}
                      <div className="flex gap-1 mt-1">
                        {query.is_public && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                            Public
                          </span>
                        )}
                        {query.result_count !== undefined && (
                          <span className="text-xs text-gray-600">
                            {query.result_count} results
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleLoadQuery(query)}
                      className="text-blue-600 hover:text-blue-700 flex-shrink-0"
                      title="Run this query"
                    >
                      <Play size={14} fill="currentColor" />
                    </button>
                  </div>
                  <button
                    onClick={() => handleDeleteQuery(query.id)}
                    className="text-red-400 hover:text-red-600 mt-2 transition text-xs"
                    title="Delete this query"
                  >
                    <Trash2 size={12} className="inline" /> Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
