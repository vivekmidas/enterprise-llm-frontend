// Case-related types for the enterprise case management system

export type CaseStatus = 'open' | 'closed' | 'pending' | 'archived';

export interface Case {
  id: string;
  title: string;
  description: string;
  judge: string;
  court: string;
  location: string;
  article: string; // e.g., "Sec_122(1A)"
  status: CaseStatus;
  full_text_content: string;
  embeddings?: number[]; // For semantic search
  relevance_score?: number; // For search results
  created_at: string;
  updated_at: string;
  created_by: string;
  last_modified_by: string;
  tags?: string[];
}

export interface CaseFilter {
  judges?: string[];
  courts?: string[];
  locations?: string[];
  articles?: string[];
  status?: CaseStatus[];
  dateRange?: {
    from?: Date;
    to?: Date;
  };
}

export interface SearchQuery {
  text: string;
  mode: 'traditional' | 'semantic' | 'both';
  filters?: CaseFilter;
}

export interface SearchResult {
  cases: Case[];
  total: number;
  page: number;
  limit: number;
  query_id: string; // Reference to saved query audit log
}

export interface SavedQuery {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  query_text?: string;
  filters?: CaseFilter;
  search_mode?: 'traditional' | 'semantic' | 'both';
  is_public: boolean;
  tags?: string[];
  result_count?: number;
  created_at: string;
  updated_at: string;
  last_run_at?: string;
  tenant_id: string;
}

export interface CaseEdit {
  field: keyof Case;
  old_value: any;
  new_value: any;
}

export type AuditAction = 'SEARCH' | 'VIEW' | 'EDIT' | 'EXPORT' | 'PRINT' | 'SAVE_QUERY' | 'DELETE_QUERY';

export interface AuditLog {
  id: string;
  user_id: string;
  action: AuditAction;
  resource_type: 'case' | 'query' | 'search';
  resource_id?: string;
  query_id?: string;
  case_id?: string;
  details?: {
    filters?: CaseFilter;
    query_text?: string;
    export_format?: 'pdf' | 'csv' | 'json';
    case_changes?: CaseEdit[];
    result_count?: number;
    search_mode?: string;
  };
  timestamp: string;
  tenant_id: string;
  ip_address?: string;
  user_agent?: string;
}

export type UserRole = 'admin' | 'paralegal' | 'viewer';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  tenant_id: string;
  created_at: string;
  last_login?: string;
}

export interface CaseImportJob {
  id: string;
  status: 'pending' | 'processing' | 'extracted' | 'review' | 'published' | 'failed';
  file_name: string;
  total_cases: number;
  processed_cases: number;
  extracted_data?: Partial<Case>[];
  error_message?: string;
  created_at: string;
  updated_at: string;
}
