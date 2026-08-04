'use client';

import { create } from 'zustand';
import { CaseFilter, Case, SavedQuery } from '@/lib/types/case';

interface SearchState {
  // Filter state
  filters: CaseFilter;
  searchText: string;
  searchMode: 'traditional' | 'semantic' | 'both';
  
  // Results state
  selectedCase: Case | null;
  isLoading: boolean;
  error: string | null;
  
  // Pagination
  currentPage: number;
  itemsPerPage: number;
  
  // History and saved queries
  recentSearches: Array<{ query: string; timestamp: Date }>;
  savedQueries: SavedQuery[];
  
  // Actions
  setFilters: (filters: CaseFilter) => void;
  updateFilter: (key: keyof CaseFilter, value: any) => void;
  clearFilters: () => void;
  
  setSearchText: (text: string) => void;
  setSearchMode: (mode: 'traditional' | 'semantic' | 'both') => void;
  
  setSelectedCase: (caseData: Case | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  
  setSavedQueries: (queries: SavedQuery[]) => void;
  addSavedQuery: (query: SavedQuery) => void;
  removeSavedQuery: (queryId: string) => void;
  
  // Reset search state
  resetSearch: () => void;
}

const initialState = {
  filters: {},
  searchText: '',
  searchMode: 'both' as const,
  selectedCase: null,
  isLoading: false,
  error: null,
  currentPage: 1,
  itemsPerPage: 10,
  recentSearches: [],
  savedQueries: [],
};

export const useSearchStore = create<SearchState>((set) => ({
  ...initialState,
  
  setFilters: (filters) => set({ filters, currentPage: 1 }),
  updateFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
      currentPage: 1,
    })),
  clearFilters: () => set({ filters: {}, currentPage: 1 }),
  
  setSearchText: (text) => set({ searchText: text, currentPage: 1 }),
  setSearchMode: (mode) => set({ searchMode: mode, currentPage: 1 }),
  
  setSelectedCase: (caseData) => set({ selectedCase: caseData }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  setCurrentPage: (page) => set({ currentPage: page }),
  setItemsPerPage: (items) => set({ itemsPerPage: items }),
  
  addRecentSearch: (query) =>
    set((state) => ({
      recentSearches: [
        { query, timestamp: new Date() },
        ...state.recentSearches.slice(0, 9), // Keep last 10
      ],
    })),
  clearRecentSearches: () => set({ recentSearches: [] }),
  
  setSavedQueries: (queries) => set({ savedQueries: queries }),
  addSavedQuery: (query) =>
    set((state) => ({
      savedQueries: [query, ...state.savedQueries],
    })),
  removeSavedQuery: (queryId) =>
    set((state) => ({
      savedQueries: state.savedQueries.filter((q) => q.id !== queryId),
    })),
  
  resetSearch: () => set(initialState),
}));
