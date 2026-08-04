'use client';

import { useEffect, useState } from 'react';
import { useSearchStore } from '@/lib/stores/searchStore';
import { searchCases } from '@/lib/api/cases';
import { Case } from '@/lib/types/case';
import { AlertCircle, Loader } from 'lucide-react';
import CaseCard from './CaseCard';

interface CaseListProps {
  isLoading?: boolean;
}

export default function CaseList({ isLoading: externalLoading = false }: CaseListProps) {
  const {
    searchText,
    filters,
    searchMode,
    currentPage,
    itemsPerPage,
    setLoading,
    setError,
    selectedCase,
    setSelectedCase,
  } = useSearchStore();

  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setErrorLocal] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const performSearch = async () => {
      if (!searchText.trim()) {
        setCases([]);
        return;
      }

      setIsLoading(true);
      setErrorLocal(null);
      setError(null);

      try {
        const result = await searchCases(
          {
            text: searchText,
            mode: searchMode,
            filters: Object.keys(filters).length > 0 ? filters : undefined,
          },
          currentPage,
          itemsPerPage
        );

        setCases(result.cases);
        setTotal(result.total);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to search cases';
        setErrorLocal(errorMessage);
        setError(errorMessage);
        setCases([]);
      } finally {
        setIsLoading(false);
        setLoading(false);
      }
    };

    performSearch();
  }, [searchText, filters, searchMode, currentPage, itemsPerPage, setLoading, setError]);

  if (isLoading || externalLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 flex items-start gap-3 bg-red-50 border-b border-red-200">
        <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-sm font-medium text-red-900">Search Error</p>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!searchText.trim()) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="text-sm">Enter a search query or use filters to find cases</p>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="text-sm">No cases found matching your search criteria</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      <div className="px-4 py-3 bg-white border-b border-gray-200 sticky top-0">
        <p className="text-sm font-medium text-gray-700">
          Results: {total} {total === 1 ? 'case' : 'cases'} found
        </p>
      </div>

      <div className="space-y-2 p-2">
        {cases.map((caseData) => (
          <div
            key={caseData.id}
            onClick={() => setSelectedCase(caseData)}
            className={`cursor-pointer transition rounded-lg ${
              selectedCase?.id === caseData.id
                ? 'bg-blue-50 border-2 border-blue-500 shadow-sm'
                : 'hover:bg-gray-100 border border-transparent'
            }`}
          >
            <CaseCard caseData={caseData} />
          </div>
        ))}
      </div>

      {/* Pagination Info */}
      <div className="px-4 py-3 bg-white border-t border-gray-200 sticky bottom-0 text-xs text-gray-600">
        Page {currentPage} • {itemsPerPage} items per page
      </div>
    </div>
  );
}
