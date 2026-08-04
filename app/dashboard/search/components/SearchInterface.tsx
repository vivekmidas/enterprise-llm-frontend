'use client';

import { useState, useEffect } from 'react';
import { useSearchStore } from '@/lib/stores/searchStore';
import FilterPanel from './FilterPanel';
import CaseList from './CaseList';
import CaseDetails from './CaseDetails';
import SearchBar from './SearchBar';

export default function SearchInterface() {
  const [isLoading, setIsLoading] = useState(false);
  const { selectedCase } = useSearchStore();

  return (
    <div className="flex h-full">
      {/* Left Pane - Filters (20%) */}
      <div className="w-1/5 border-r border-gray-200 bg-white shadow-sm overflow-y-auto">
        <FilterPanel />
      </div>

      {/* Middle Pane - Search & Case List (40%) */}
      <div className="w-2/5 border-r border-gray-200 bg-gray-50 flex flex-col">
        <div className="flex-shrink-0 bg-white shadow-sm p-4 border-b border-gray-200">
          <SearchBar />
        </div>
        <div className="flex-1 overflow-y-auto">
          <CaseList isLoading={isLoading} />
        </div>
      </div>

      {/* Right Pane - Case Details (40%) */}
      <div className="w-2/5 bg-white overflow-y-auto">
        {selectedCase ? (
          <CaseDetails caseData={selectedCase} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <p>Select a case to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
