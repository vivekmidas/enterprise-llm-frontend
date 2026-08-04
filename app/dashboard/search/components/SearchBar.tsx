'use client';

import { useState } from 'react';
import { useSearchStore } from '@/lib/stores/searchStore';
import { Search, Settings2 } from 'lucide-react';

export default function SearchBar() {
  const { searchText, searchMode, setSearchText, setSearchMode, addRecentSearch } = useSearchStore();
  const [showModeMenu, setShowModeMenu] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchText.trim()) {
      addRecentSearch(searchText);
      // Trigger search will be handled by parent or custom hook
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex gap-2 items-center">
      <div className="flex-1 relative">
        <input
          type="text"
          placeholder="Find me cases related to..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
        <Search size={18} className="absolute left-3 top-3 text-gray-400" />
      </div>

      {/* Search Mode Toggle */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowModeMenu(!showModeMenu)}
          className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition flex items-center gap-1 text-sm font-medium text-gray-700"
        >
          <Settings2 size={16} />
          {searchMode === 'both' ? 'All' : searchMode === 'traditional' ? 'Filter' : 'AI'}
        </button>

        {showModeMenu && (
          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            <button
              type="button"
              onClick={() => {
                setSearchMode('traditional');
                setShowModeMenu(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm ${
                searchMode === 'traditional'
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              } transition`}
            >
              Traditional Filter Search
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchMode('semantic');
                setShowModeMenu(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm ${
                searchMode === 'semantic'
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              } transition border-t border-gray-100`}
            >
              AI Semantic Search
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchMode('both');
                setShowModeMenu(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm ${
                searchMode === 'both'
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              } transition border-t border-gray-100`}
            >
              Both (Recommended)
            </button>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
      >
        Search
      </button>
    </form>
  );
}
