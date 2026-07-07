import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface FilterOption {
  id: string;
  label: string;
}

interface SearchFilterBarProps {
  placeholder?: string;
  filters?: FilterOption[];
  onSearch: (query: string) => void;
  onFilter?: (filterId: string) => void;
  selectedFilter?: string;
}

export function SearchFilterBar({
  placeholder = 'Search...',
  filters = [],
  onSearch,
  onFilter,
  selectedFilter,
}: SearchFilterBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="space-y-3">
      <div className={`relative transition-all duration-200 ${isFocused ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}>
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSearch(e.target.value);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-200 bg-white text-sm transition-all duration-200 focus:outline-none"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {filters.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => onFilter?.(filter.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedFilter === filter.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
