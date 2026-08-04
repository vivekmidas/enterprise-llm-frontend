'use client';

import { useState, useEffect } from 'react';
import { useSearchStore } from '@/lib/stores/searchStore';
import { getFilterOptions } from '@/lib/api/cases';
import { ChevronDown, X } from 'lucide-react';
import SavedQueriesPanel from './SavedQueriesPanel';

export default function FilterPanel() {
  const { filters, updateFilter, clearFilters } = useSearchStore();
  const [filterOptions, setFilterOptions] = useState({
    judges: [],
    courts: [],
    locations: [],
    articles: [],
  });
  const [expandedSection, setExpandedSection] = useState<string | null>('judges');
  const [searchInputs, setSearchInputs] = useState({
    judges: '',
    courts: '',
    locations: '',
    articles: '',
  });

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const options = await getFilterOptions();
        setFilterOptions(options);
      } catch (error) {
        console.error('[v0] Failed to load filter options:', error);
      }
    };

    loadFilterOptions();
  }, []);

  const handleToggleFilterOption = (section: string, value: string) => {
    const current = (filters[section as keyof typeof filters] as string[]) || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFilter(section as any, updated);
  };

  const handleToggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const getFilteredOptions = (section: string, search: string) => {
    const options = filterOptions[section as keyof typeof filterOptions] || [];
    return options.filter((opt) =>
      opt.toLowerCase().includes(search.toLowerCase())
    );
  };

  const FilterSection = ({ title, section }: { title: string; section: string }) => {
    const isExpanded = expandedSection === section;
    const selectedCount = ((filters[section as keyof typeof filters] as string[]) || []).length;
    const search = searchInputs[section as keyof typeof searchInputs];

    return (
      <div className="border-b border-gray-200">
        <button
          onClick={() => handleToggleSection(section)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-2">
            <ChevronDown
              size={18}
              className={`transition transform ${isExpanded ? '' : '-rotate-90'}`}
            />
            <span className="font-medium text-sm">{title}</span>
            {selectedCount > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs rounded-full px-2 py-1">
                {selectedCount}
              </span>
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
            <input
              type="text"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={search}
              onChange={(e) =>
                setSearchInputs({ ...searchInputs, [section]: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            />
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {getFilteredOptions(section, search).map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition"
                >
                  <input
                    type="checkbox"
                    checked={
                      ((filters[section as keyof typeof filters] as string[]) || []).includes(
                        option
                      )
                    }
                    onChange={() => handleToggleFilterOption(section, option)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <h2 className="font-bold text-lg text-gray-900">Filters</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <SavedQueriesPanel />
        <FilterSection title="Judge" section="judges" />
        <FilterSection title="Court" section="courts" />
        <FilterSection title="Location" section="locations" />
        <FilterSection title="Article/Section" section="articles" />

        {/* Status Filter */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => handleToggleSection('status')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-2">
              <ChevronDown
                size={18}
                className={`transition transform ${expandedSection === 'status' ? '' : '-rotate-90'}`}
              />
              <span className="font-medium text-sm">Status</span>
              {((filters.status as string[]) || []).length > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs rounded-full px-2 py-1">
                  {(filters.status as string[]).length}
                </span>
              )}
            </div>
          </button>

          {expandedSection === 'status' && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 space-y-2">
              {['open', 'closed', 'pending', 'archived'].map((status) => (
                <label
                  key={status}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition"
                >
                  <input
                    type="checkbox"
                    checked={
                      ((filters.status as string[]) || []).includes(status)
                    }
                    onChange={() => handleToggleFilterOption('status', status)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 capitalize">{status}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex-shrink-0 p-4 gap-2 flex border-t border-gray-200">
        <button
          onClick={clearFilters}
          className="flex-1 px-3 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 transition"
        >
          Clear All
        </button>
      </div>
    </div>
  );
}
