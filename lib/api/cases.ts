import apiClient, { handleApiError } from './client';
import {
  Case,
  SearchQuery,
  SearchResult,
  SavedQuery,
  CaseFilter,
  AuditLog,
} from '@/lib/types/case';

/**
 * Search cases with filters and optional AI semantic search
 */
export async function searchCases(
  query: SearchQuery,
  page: number = 1,
  limit: number = 10
): Promise<SearchResult> {
  try {
    const response = await apiClient.post<SearchResult>('/api/cases/search', {
      query: query.text,
      mode: query.mode,
      filters: query.filters,
      pagination: { page, limit },
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Get a single case by ID
 */
export async function getCaseById(caseId: string): Promise<Case> {
  try {
    const response = await apiClient.get<Case>(`/api/cases/${caseId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Update a case (admin only)
 */
export async function updateCase(caseId: string, updates: Partial<Case>): Promise<Case> {
  try {
    const response = await apiClient.put<Case>(`/api/cases/${caseId}`, updates);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Get filter options (judges, courts, locations, articles)
 */
export async function getFilterOptions(): Promise<{
  judges: string[];
  courts: string[];
  locations: string[];
  articles: string[];
}> {
  try {
    const response = await apiClient.get('/api/cases/filters/options');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Get saved queries for current user
 */
export async function getSavedQueries(isPublic?: boolean): Promise<SavedQuery[]> {
  try {
    const params = isPublic !== undefined ? { isPublic } : {};
    const response = await apiClient.get<SavedQuery[]>('/api/queries', { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Save a query
 */
export async function saveQuery(query: Omit<SavedQuery, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'tenant_id'>): Promise<SavedQuery> {
  try {
    const response = await apiClient.post<SavedQuery>('/api/queries', query);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Delete a saved query
 */
export async function deleteQuery(queryId: string): Promise<void> {
  try {
    await apiClient.delete(`/api/queries/${queryId}`);
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Get audit logs (filtered by action, case, query, etc.)
 */
export async function getAuditLogs(filters?: {
  action?: string;
  caseId?: string;
  queryId?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}): Promise<AuditLog[]> {
  try {
    const response = await apiClient.get<AuditLog[]>('/api/audit/logs', { params: filters });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Export cases to PDF/CSV/JSON
 */
export async function exportCases(
  caseIds: string[],
  format: 'pdf' | 'csv' | 'json',
  queryContext?: SearchQuery
): Promise<Blob> {
  try {
    const response = await apiClient.post(
      '/api/cases/export',
      {
        case_ids: caseIds,
        format,
        query_context: queryContext,
      },
      {
        responseType: 'blob',
      }
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Get all cases (admin view)
 */
export async function getAllCases(
  page: number = 1,
  limit: number = 50,
  filter?: Partial<CaseFilter>
): Promise<SearchResult> {
  try {
    const response = await apiClient.get<SearchResult>('/api/cases', {
      params: {
        page,
        limit,
        ...filter,
      },
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Bulk import cases
 */
export async function importCases(file: File): Promise<{ job_id: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<{ job_id: string }>('/api/cases/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Get import job status
 */
export async function getImportJobStatus(jobId: string) {
  try {
    const response = await apiClient.get(`/api/cases/import/${jobId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}
