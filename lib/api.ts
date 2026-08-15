import { LoginPayload, RegisterPayload } from '@/lib/types/login';

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
import { CategoryItem, AgentPayload } from '@/app/components/component-categoriees';

export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem('token');
};

export const getHeaders = (headers: Record<string, string> = {}): Record<string, string> => {
  const token = getAccessToken();

  return {
    ...headers,
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const getToken = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  return token ? { Authorization: `Bearer ${token}` } : null;
};

export const api = {
  /** Authentication */

  login: async (credentials: LoginPayload) => {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Login failed');
    }
    return res.json();
  },

  getCurrentUser: async () => {
    const headers = getHeaders();
    console.log(headers);
    const res = await fetch(`${BACKEND_URL}/auth/me`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch user details');
    return res.json();
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');

      // Clear all local cookies
      document.cookie.split(';').forEach((cookie) => {
        const name = cookie.split('=')[0].trim();
        if (name) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      });
    }
  },

  register: async (data: RegisterPayload) => {
    const res = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Registration failed');
    }
    return res.json();
  },

  /** Fetches all available agent definitions that can be used as components */
  getNodes: async (): Promise<{ agents: any[] }> => {
    const res = await fetch(`${BACKEND_URL}/nodes`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return res.json();
  },

  getNodesByName: async (name: string): Promise<any> => {
    const res = await fetch(`${BACKEND_URL}/nodes/${name}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return res.json();
  },

  getNodesById: async (id: number): Promise<any> => {
    const res = await fetch(`${BACKEND_URL}/nodes/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return res.json();
  },

  getNodesForCategories: async (category_id: string): Promise<{ nodes: CategoryItem[] }> => {
    const res = await fetch(`${BACKEND_URL}/nodes/categories/${category_id}`, {
      headers: getHeaders(),
      method: 'GET',
    });
    return res.json();
  },

  /** Retrieves defined categories to organize workflows in the UI */
  getNodesCategories: async (): Promise<string[] | { categories: string[] }> => {
    const res = await fetch(`${BACKEND_URL}/categories`, {
      headers: getHeaders(),
      method: 'GET',
    });
    return res.json();
  },

  getCategory: async (category_id: string): Promise<{ category: CategoryItem }> => {
    const res = await fetch(`${BACKEND_URL}/categories/${category_id}`, {
      headers: getHeaders(),
      method: 'GET',
    });
    return res.json();
  },

  /** Triggers a workflow execution by sending a message to the backend */
  executeChat: async (message: string, agentId: string = 'default') => {
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ message, workflow_id: agentId }),
    });
    return res.json();
  },

  /** Fetches the full graph data (nodes/edges) for a specific agent ID */
  getAgentById: async (agentId: string = 'default') => {
    const res = await fetch(`${BACKEND_URL}/workflows/${agentId}`, {
      headers: getHeaders(),
      method: 'GET',
    });
    return res.json();
  },

  /** Reads persisted properties for one node instance inside a workflow */
  getAgentNodeProperties: async (agentId: string, nodeId: string) => {
    const res = await fetch(`${BACKEND_URL}/workflows/${agentId}/nodes/${nodeId}/properties`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load workflow node properties');
    return res.json();
  },

  /** Writes persisted properties for one node instance inside a workflow */
  updateAgentNodeProperties: async (
    agentId: string,
    nodeId: string,
    properties: Record<string, any>,
  ) => {
    const res = await fetch(`${BACKEND_URL}/workflows/${agentId}/nodes/${nodeId}/properties`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(properties),
    });
    if (!res.ok) throw new Error('Failed to update workflow node properties');
    return res.json();
  },

  /** Lists all saved workflows stored in the database */
  getSavedAgents: async (customerId?: string | number) => {
    const url = new URL(`${BACKEND_URL}/workflows`);
    if (customerId !== undefined && customerId !== null && String(customerId) !== 'all') {
      url.searchParams.append('customer_id', String(customerId));
    }
    const res = await fetch(url.toString(), {
      headers: getHeaders(),
      method: 'GET',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  getAgentsByUser: async (userId: string) => {
    const res = await fetch(`${BACKEND_URL}/agents/user/${userId}`, {
      headers: getHeaders(),
      method: 'GET',
    });
    return res.json();
  },

  // Save agent
  saveAgent: async (agent: AgentPayload) => {
    const res = await fetch(`${BACKEND_URL}/workflows`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(agent),
    });
    return res.json();
  },

  /** Toggles the is_enabled status of a workflow */
  toggleWorkflowStatus: async (workflowId: string) => {
    const res = await fetch(`${BACKEND_URL}/workflows/${workflowId}/toggle`, {
      method: 'PATCH',
      headers: getHeaders({
        'Content-Type': 'application/json',
      }),
    });
    return res.json();
  },

  /** Deletes a workflow */
  deleteWorkflow: async (workflowId: string) => {
    const res = await fetch(`${BACKEND_URL}/workflows/${workflowId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      let message = 'Failed to delete workflow';
      try {
        const data = await res.json();
        message = data.detail || message;
      } catch {
        message = res.statusText || message;
      }
      throw new Error(message);
    }
    return true;
  },

  /** Updates a node definition in the registry (catalog) */
  updateNode: async (node: any) => {
    const res = await fetch(`${BACKEND_URL}/nodes/${node.name}`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(node),
    });
    return res.json();
  },

  /** Updates a node definition in the registry (catalog) */
  createNode: async (node: any) => {
    const res = await fetch(`${BACKEND_URL}/nodes`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(node),
    });
    return res.json();
  },

  /** Deletes a node definition from the registry */
  deleteNode: async (nodeName: string, force: boolean = false) => {
    const res = await fetch(`${BACKEND_URL}/nodes/${nodeName}?force=${force}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      let detail: any = 'Failed to delete node';
      try {
        const data = await res.json();
        detail = data.detail || detail;
      } catch {
        detail = res.statusText || detail;
      }
      if (typeof detail === 'object') {
        const err = new Error(detail.message || 'Failed to delete node');
        (err as any).detail = detail;
        throw err;
      }
      throw new Error(detail);
    }
    return true;
  },

  /** Creates a new node category */
  createCategory: async (category: any) => {
    const res = await fetch(`${BACKEND_URL}/categories`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(category),
    });
    return res.json();
  },

  /** Updates an existing category */
  updateCategory: async (id: string, category: any) => {
    const res = await fetch(`${BACKEND_URL}/categories/${id}`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(category),
    });
    return res.json();
  },

  /** Deletes a category */
  deleteCategory: async (id: string) => {
    const res = await fetch(`${BACKEND_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: getHeaders({
        'Content-Type': 'application/json',
      }),
    });
    return res.ok;
  },

  /** User Management */
  getUsers: async (customerId?: string | number) => {
    const url = new URL(`${BACKEND_URL}/admin/users`);
    if (customerId !== undefined && customerId !== null && String(customerId) !== 'all') {
      url.searchParams.append('customer_id', String(customerId));
    }
    const res = await fetch(url.toString(), {
      headers: getHeaders(),
      method: 'GET',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch users');
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  createUser: async (user: any) => {
    const res = await fetch(`${BACKEND_URL}/admin/users`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(user),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create user');
    }
    return res.json();
  },

  updateUserRole: async (userId: string, data: { name?: string; role?: string; role_id?: string; customer_id?: string | number | null }) => {
    const res = await fetch(`${BACKEND_URL}/admin/users/${userId}`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update user role');
    }
    return res.json();
  },

  deleteUser: async (id: number) => {
    const res = await fetch(`${BACKEND_URL}/admin/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      let message = 'Failed to delete user';
      try {
        const data = await res.json();
        message = data.detail || message;
      } catch {
        message = res.statusText || message;
      }
      throw new Error(message);
    }
    return true;
  },

  getAuditLogs: async (params: { customerId?: string; action?: string; limit?: number } = {}) => {
    const url = new URL(`${BACKEND_URL}/admin/audit-logs/`);
    url.searchParams.append('limit', String(params.limit || 100));
    if (params.customerId && params.customerId !== 'all') {
      url.searchParams.append('customer_id', params.customerId);
    }
    if (params.action) {
      url.searchParams.append('action', params.action);
    }
    const res = await fetch(url.toString(), {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load audit logs');
    return res.json();
  },

  getCustomers: async () => {
    const res = await fetch(`${BACKEND_URL}/admin/customers`, {
      headers: getHeaders(),
      method: 'GET',
    });
    return res.json();
  },

  createCustomer: async (customer: any) => {
    const res = await fetch(`${BACKEND_URL}/admin/customers`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(customer),
    });
    return res.json();
  },

  updateCustomer: async (id: string, customer: any) => {
    const res = await fetch(`${BACKEND_URL}/admin/customers/${id}`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(customer),
    });
    return res.json();
  },

  deleteCustomer: async (id: string) => {
    const res = await fetch(`${BACKEND_URL}/admin/customers/${id}`, {
      method: 'DELETE',
      headers: getHeaders({
        'Content-Type': 'application/json',
      }),
    });
    return res.ok;
  },

  createCustomerUser: async (customerId: string, user: any) => {
    const res = await fetch(`${BACKEND_URL}/admin/customers/${customerId}/users`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(user),
    });
    return res.json();
  },

  getCustomerNodesAdmin: async (customerId: string) => {
    const res = await fetch(`${BACKEND_URL}/admin/customers/${customerId}/nodes`, {
      headers: getHeaders(),
      method: 'GET',
    });
    return res.json();
  },

  configureCustomerNodesAdmin: async (customerId: string, nodes: any[]) => {
    const res = await fetch(`${BACKEND_URL}/admin/customers/${customerId}/nodes`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ nodes }),
    });
    return res.json();
  },

  // Admin Trigger Management
  getTriggerInstances: async (): Promise<any[]> => {
    const res = await fetch(`${BACKEND_URL}/admin/triggers`, {
      headers: getHeaders(),
      method: 'GET',
    });
    return res.json();
  },

  activateTrigger: async (nodeName: string, agentNodeId: string, workflowConfig: any) => {
    const res = await fetch(
      `${BACKEND_URL}/admin/triggers/${nodeName}/activate?agent_node_id=${agentNodeId}`,
      {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(workflowConfig),
      },
    );
    return res.json();
  },

  deactivateTrigger: async (nodeName: string, agentNodeId: string) => {
    const res = await fetch(
      `${BACKEND_URL}/admin/triggers/${nodeName}/deactivate?agent_node_id=${agentNodeId}`,
      {
        method: 'POST',
        headers: getHeaders({
          'Content-Type': 'application/json',
        }),
      },
    );
    return res.json();
  },

  stopAllTriggers: async (nodeName: string) => {
    const res = await fetch(`${BACKEND_URL}/admin/triggers/${nodeName}/stop_all`, {
      method: 'POST',
      headers: getHeaders({
        'Content-Type': 'application/json',
      }),
    });
    return res.json();
  },

  updateTokensInDB: async (tokens: any) => {
    console.log('updateTokensInDB', tokens);
    const res = await fetch(`${BACKEND_URL}/webhooks/email/refresh-token`, {
      method: 'PUT',
      body: JSON.stringify(tokens),
      headers: getHeaders({ 'Content-Type': 'application/json' }),
    });
    const result = await res.json();
    console.log(result);
    return result;
  },

  setCredentials: async (tokens: any) => {
    console.log('Get Credentials', tokens);
    const res = await fetch(`${BACKEND_URL}/webhooks/email/refresh-token`, {
      method: 'PUT',
      body: JSON.stringify(tokens),
      headers: getHeaders({ 'Content-Type': 'application/json' }),
    });
    const result = await res.json();
    console.log(result);
    return result;
  },

  getProviders: async () => {
    const res = await fetch(`${BACKEND_URL}/admin/oauth/providers`, {
      headers: getHeaders(),
      method: 'GET',
    });
    return res.json();
  },

  createProvider: async (provider: any) => {
    const res = await fetch(`${BACKEND_URL}/admin/oauth/providers`, {
      method: 'POST',
      body: JSON.stringify(provider),
      headers: getHeaders({ 'Content-Type': 'application/json' }),
    });
    return res.json();
  },

  // Provider Presets API
  getProviderPresets: async () => {
    const res = await fetch(`${BACKEND_URL}/api/provider-presets`, {
      headers: getHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  getAdminProviderPresets: async () => {
    const res = await fetch(`${BACKEND_URL}/api/admin/provider-presets`, {
      headers: getHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  createProviderPreset: async (payload: any) => {
    const res = await fetch(`${BACKEND_URL}/api/admin/provider-presets`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create provider preset');
    }
    return res.json();
  },

  updateProviderPreset: async (id: string, payload: any) => {
    const res = await fetch(`${BACKEND_URL}/api/admin/provider-presets/${id}`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to update provider preset');
    }
    return res.json();
  },

  deleteProviderPreset: async (id: string) => {
    const res = await fetch(`${BACKEND_URL}/api/admin/provider-presets/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to delete provider preset');
    }
    return true;
  },

  seedProviderPresets: async () => {
    const res = await fetch(`${BACKEND_URL}/api/admin/provider-presets/seed`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to seed provider presets');
    }
    return res.json();
  },

  getCustomerNodeConfigs: async (customerId?: string | number) => {
    const url = customerId
      ? `${BACKEND_URL}/nodes/customer/config?customer_id=${customerId}`
      : `${BACKEND_URL}/nodes/customer/config`;
    const res = await fetch(url, {
      headers: getHeaders({
        'Content-Type': 'application/json',
      }),
    });
    return res.json();
  },

  configureCustomerNode: async (nodeName: string, config: any, customerId?: string | number) => {
    const url = customerId
      ? `${BACKEND_URL}/nodes/customer/config/${nodeName}?customer_id=${customerId}`
      : `${BACKEND_URL}/nodes/customer/config/${nodeName}`;
    const res = await fetch(url, {
      method: 'PUT',
      body: JSON.stringify(config),
      headers: getHeaders({ 'Content-Type': 'application/json' }),
    });
    return res.json();
  },

  /* BLOCK: Allow customer_id filter for knowledge bases */
  getKnowledgeBases: async (customerId?: string | number) => {
    const url = new URL(`${BACKEND_URL}/api/knowledge/bases`);
    if (customerId && customerId !== 'all') {
      url.searchParams.append('customer_id', String(customerId));
    }
    const res = await fetch(url.toString(), {
      headers: getHeaders(),
      method: 'GET',
    });
    if (!res.ok) throw new Error('Failed to fetch knowledge bases');
    return res.json();
  },
  /* END BLOCK */

  /* BLOCK: Domain Schemas API */
  getDomainSchemas: async () => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/domains`, {
      headers: getHeaders(),
      method: 'GET',
    });
    if (!res.ok) throw new Error('Failed to fetch domain schemas');
    return res.json();
  },

  getDomainSchema: async (id: string) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/domains/${id}`, {
      headers: getHeaders(),
      method: 'GET',
    });
    if (!res.ok) throw new Error('Failed to fetch domain schema');
    return res.json();
  },

  createDomainSchema: async (payload: {
    name: string;
    domain_key: string;
    description?: string;
    scope?: string;
    default_path?: string;
    icon?: string;
    theme_color?: string;
    status?: string;
    config?: any;
    fields?: Array<{ key: string; label: string; description?: string; type?: string; weight: number; importance: string; required?: boolean }>;
    system_prompt?: string;
    user_prompt?: string;
  }) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/domains`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create domain schema');
    return res.json();
  },

  updateDomainSchema: async (
    id: string,
    payload: {
      name?: string;
      domain_key?: string;
      description?: string;
      default_path?: string;
      icon?: string;
      theme_color?: string;
      status?: string;
      config?: any;
      fields?: Array<{ key: string; label: string; description?: string; type?: string; weight: number; importance: string; required?: boolean }>;
      system_prompt?: string;
      user_prompt?: string;
    },
  ) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/domains/${id}`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update domain schema');
    return res.json();
  },

  deleteDomainSchema: async (id: string) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/domains/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete domain schema');
    return res.json();
  },
  /* END BLOCK */

  createKnowledgeBase: async (payload: { name: string; description?: string; domain_id?: string; settings?: any }) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/bases`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create knowledge base');
    return res.json();
  },

  deleteKnowledgeBase: async (id: number | string) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/bases/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete knowledge base');
    return res.json();
  },

  updateKnowledgeBase: async (
    id: number | string,
    payload: { name?: string; description?: string; domain_id?: string; status?: string; settings?: any },
  ) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/bases/${id}`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update knowledge base');
    return res.json();
  },

  updateDocument: async (
    kbId: number | string,
    docId: number | string,
    payload: { name?: string; metadata?: any; status?: string },
  ) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/bases/${kbId}/documents/${docId}`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update document');
    return res.json();
  },

  reprocessDocument: async (kbId: number | string, docId: number | string) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/bases/${kbId}/documents/${docId}/reprocess`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to queue document for reprocessing');
    return res.json();
  },

  getKnowledgeBaseDocuments: async (kbId: number | string) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/bases/${kbId}/documents`, {
      headers: getHeaders(),
      method: 'GET',
    });
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },

  uploadDocument: async (
    kbId: string,
    file: File,
    metadata?: { description?: string; tags?: string; doc_type?: string },
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata?.description) formData.append('description', metadata.description);
    if (metadata?.tags) formData.append('tags', metadata.tags);
    if (metadata?.doc_type) formData.append('doc_type', metadata.doc_type);

    const res = await fetch(`${BACKEND_URL}/api/knowledge/bases/${kbId}/upload`, {
      method: 'POST',
      headers: getHeaders(), // Let browser set boundary for multipart/form-data
      body: formData,
    });
    if (!res.ok) {
      let msg = 'Failed to upload document';
      try {
        const errData = await res.json();
        msg = errData.detail || msg;
      } catch { }
      throw new Error(msg);
    }
    return res.json();
  },

  deleteDocument: async (kbId: string, docId: string) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/bases/${kbId}/documents/${docId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete document');
    return res.json();
  },

  getDocumentStatus: async (kbId: string, docId: string) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/bases/${kbId}/documents/${docId}`, {
      headers: getHeaders(),
      method: 'GET',
    });
    if (!res.ok) throw new Error('Failed to fetch document status');
    return res.json();
  },

  retrieveKnowledge: async (payload: {
    query: string;
    knowledge_base_ids: string[];
    top_k?: number;
    min_score?: number;
    enable_reranking?: boolean;
    rerank_model?: string;
    rerank_limit?: number;
    approach?: string;
    enable_rrf?: boolean;
    metadata?: Record<string, any>;
  }) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/retrieve`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to retrieve knowledge');
    return res.json();
  },

  generateResponse: async (payload: {
    query: string;
    context: any;
    temperature?: number;
    max_generation_tokens?: number;
    llm_config?: any;
    llm_config_id?: number | string;
  }) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/generate`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to generate response');
    return res.json();
  },

  getDocumentTypes: async (): Promise<string[]> => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/document-types`, {
      headers: getHeaders(),
      method: 'GET',
    });
    if (!res.ok) throw new Error('Failed to fetch document types');
    return res.json();
  },

  updateDocumentTypes: async (types: string[]): Promise<string[]> => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/document-types`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(types),
    });
    if (!res.ok) throw new Error('Failed to update document types');
    return res.json();
  },

  getCompanySettings: async (customerId?: string | number) => {
    const url = new URL(`${BACKEND_URL}/api/admin/company/settings`);
    if (customerId) {
      url.searchParams.append('customer_id', String(customerId));
    }
    const res = await fetch(url.toString(), {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch company settings');
    return res.json();
  },

  updateCompanySettings: async (settings: any, customerId?: string | number) => {
    const url = new URL(`${BACKEND_URL}/api/admin/company/settings`);
    if (customerId) {
      url.searchParams.append('customer_id', String(customerId));
    }
    const res = await fetch(url.toString(), {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update company settings');
    return res.json();
  },

  getLlmProfile: async (profileId: string | number) => {
    const res = await fetch(`${BACKEND_URL}/api/llm-profiles/${profileId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch LLM profile');
    return res.json();
  },

  getLlmProfiles: async (customerId?: string | number) => {
    const url = new URL(`${BACKEND_URL}/api/llm-profiles`);
    if (customerId) {
      url.searchParams.append('customer_id', String(customerId));
    }
    const res = await fetch(url.toString(), {
      headers: getHeaders(),
    });
    if (!res.ok) {
      // Fallback to admin route
      const fallbackUrl = new URL(`${BACKEND_URL}/api/admin/company/llm-profiles`);
      if (customerId) fallbackUrl.searchParams.append('customer_id', String(customerId));
      const fbRes = await fetch(fallbackUrl.toString(), { headers: getHeaders() });
      if (!fbRes.ok) throw new Error('Failed to fetch LLM profiles');
      return fbRes.json();
    }
    return res.json();
  },

  createLlmProfile: async (profile: any, customerId?: string) => {
    const url = new URL(`${BACKEND_URL}/api/llm-profiles`);
    if (customerId) {
      url.searchParams.append('customer_id', String(customerId));
    }
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(profile),
    });
    if (!res.ok) throw new Error('Failed to create LLM profile');
    return res.json();
  },

  updateLlmProfile: async (id: string, profile: any, customerId?: string) => {
    const url = new URL(`${BACKEND_URL}/api/llm-profiles/${id}`);
    if (customerId) {
      url.searchParams.append('customer_id', String(customerId));
    }
    const res = await fetch(url.toString(), {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(profile),
    });
    if (!res.ok) throw new Error('Failed to update LLM profile');
    return res.json();
  },

  deleteLlmProfile: async (id: string, customerId?: string) => {
    const url = new URL(`${BACKEND_URL}/api/llm-profiles/${id}/${customerId}`);

    const res = await fetch(url.toString(), {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete LLM profile');
    return res.json();
  },

  activateLlmProfile: async (id: number | string, customerId?: string | number) => {
    const url = new URL(`${BACKEND_URL}/api/llm-profiles/${id}/set-default`);
    if (customerId) {
      url.searchParams.append('customer_id', String(customerId));
    }
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to activate LLM profile');
    return res.json();
  },

  runPlaygroundTest: async (payload: any) => {
    const res = await fetch(`${BACKEND_URL}/api/v1/playground/test`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail || 'Playground test execution failed');
    }
    return res.json();
  },

  testLlmConnection: async (payload: any) => {
    const res = await fetch(`${BACKEND_URL}/api/admin/company/settings/test-connection`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail || 'Connection test failed');
    }
    return res.json();
  },

  testNode: async (payload: { node_name: string; config: any; data: any; context?: any }) => {
    const res = await fetch(`${BACKEND_URL}/nodes/test-node`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail || 'Failed to execute node test');
    }
    return res.json();
  },

  getJsonSamples: async (schema: any) => {
    const res = await fetch(`${BACKEND_URL}/nodes/json-samples`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ schema }),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail || 'Failed to generate JSON sample');
    }
    return res.json();
  },

  getConfiguredLLMProfiles: async () => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/configured-profiles`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  // BLOCK COMMENT: LEGAL RESEARCH SEARCH API ENDPOINT
  // Routes to /api/knowledge/legal/search mounted under knowledge router
  searchLegalCases: async (payload: {
    query: string;
    court_code?: string;
    courts?: string[];
    judge?: string;
    statute?: string;
    statutes?: string[];
    disposition?: string;
    outcome_tags?: string[];
    year_min?: number;
    year_max?: number;
    limit?: number;
  }) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/legal/search`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Legal search failed');
    return res.json();
  },

  getLegalFilterOptions: async () => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/legal/filter-options`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) return null;
    return res.json();
  },


  getSavedQueries: async () => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/legal/saved-queries`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) return { private_queries: [], public_queries: [] };
    return res.json();
  },

  saveQuery: async (payload: { title: string; query_text?: string; filters_json?: any; is_public: boolean }) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/legal/saved-queries`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to save query');
    return res.json();
  },

  getLegalAuditLogs: async () => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/legal/audit-logs`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  getCaseDetail: async (cnr: string) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/legal/case/${cnr}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch case detail');
    return res.json();
  },

  ingestLegalDocument: async (payload: {
    title?: string;
    case_id?: string;
    document_text?: string;
    corpus_type?: string;
    metadata?: any;
  }) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/legal/ingest`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Document ingestion failed');
    return res.json();
  },

  triggerWebhookWorkflow: async (webhookPath: string, payload: any) => {
    const cleanPath = webhookPath.startsWith('/') ? webhookPath.slice(1) : webhookPath;
    const res = await fetch(`${BACKEND_URL}/webhooks/run/${cleanPath}`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      let detail = 'Webhook workflow execution failed';
      try {
        const data = await res.json();
        detail = data.detail || detail;
      } catch {}
      throw new Error(detail);
    }
    return res.json();
  },

  getCasePrecedents: async (caseId: string) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/legal/cases/${caseId}/precedents`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  /** Generic API request wrapper */
  request: async (path: string, options: RequestInit = {}) => {
    const url = path.startsWith('/') ? `${BACKEND_URL}${path}` : `${BACKEND_URL}/${path}`;
    const headers = getHeaders(options.headers as any || { 'Content-Type': 'application/json' });
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      let msg = 'API request failed';
      try {
        const data = await res.json();
        msg = data.detail || msg;
      } catch {
        msg = res.statusText || msg;
      }
      throw new Error(msg);
    }
    if (res.status === 204) return null;
    return res.json();
  },

  /** Roles & Permissions API */
  getRoles: async (customerId?: string) => {
    const url = customerId ? `${BACKEND_URL}/roles?customer_id=${customerId}` : `${BACKEND_URL}/roles`;
    const res = await fetch(url, { method: 'GET', headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  getPermissionsRegistry: async () => {
    const res = await fetch(`${BACKEND_URL}/roles/permissions`, { method: 'GET', headers: getHeaders() });
    if (!res.ok) return { permissions: [], grouped_by_module: {} };
    return res.json();
  },

  createRole: async (data: { role_name: string; role_type?: string; description?: string; permission_ids?: string[] }, customerId?: string) => {
    const url = customerId ? `${BACKEND_URL}/roles?customer_id=${customerId}` : `${BACKEND_URL}/roles`;
    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create role');
    }
    return res.json();
  },

  updateRole: async (roleId: string, data: { role_name?: string; description?: string; permission_ids?: string[] }) => {
    const res = await fetch(`${BACKEND_URL}/roles/${roleId}`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update role');
    }
    return res.json();
  },

  deleteRole: async (roleId: string) => {
    const res = await fetch(`${BACKEND_URL}/roles/${roleId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to delete role');
    }
    return true;
  },

  // BLOCK COMMENT: CANONICAL MODULE SOT API CLIENT METHODS
  getModules: async (customerId?: string) => {
    const url = customerId
      ? `${BACKEND_URL}/roles/modules?customer_id=${encodeURIComponent(customerId)}`
      : `${BACKEND_URL}/roles/modules`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  createCustomModule: async (data: {
    id: string;
    customer_id?: string;
    module: string;
    submodule?: string;
    label: string;
    description?: string;
    route_patterns: string[];
    icon?: string;
    display_order?: number;
    actions?: Array<{ action: string; is_route_guard?: boolean; label: string; description?: string }>;
  }) => {
    const res = await fetch(`${BACKEND_URL}/roles/modules/custom`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create custom module');
    }
    return res.json();
  },

  deleteCustomModule: async (moduleId: string) => {
    const res = await fetch(`${BACKEND_URL}/roles/modules/${encodeURIComponent(moduleId)}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to delete module');
    }
    return true;
  },

  getRoutePermissions: async (customerId?: string) => {
    const url = customerId
      ? `${BACKEND_URL}/roles/route-permissions?customer_id=${encodeURIComponent(customerId)}`
      : `${BACKEND_URL}/roles/route-permissions`;
    const res = await fetch(url, {
      headers: getHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  createPermission: async (data: { id: string; module: string; submodule?: string; label: string; description?: string }) => {
    const res = await fetch(`${BACKEND_URL}/roles/permissions`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create permission');
    }
    return res.json();
  },

  createModulePermissions: async (data: {
    module_name: string;
    submodule_name?: string;
    permissions: Array<{ id: string; submodule?: string; label: string; description?: string }>;
  }) => {
    const res = await fetch(`${BACKEND_URL}/roles/modules`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to register module permissions');
    }
    return res.json();
  },

  createRoutePermissionBinding: async (data: { pattern: string; permission_id: string; module?: string; submodule?: string; label?: string; description?: string }) => {
    const res = await fetch(`${BACKEND_URL}/roles/route-permissions`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create route permission binding');
    }
    return res.json();
  },

  updateRoutePermissionBinding: async (id: string, data: { pattern: string; permission_id: string; module?: string; submodule?: string; label?: string; description?: string }) => {
    const res = await fetch(`${BACKEND_URL}/roles/route-permissions/${id}`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update route permission binding');
    }
    return res.json();
  },

  deleteRoutePermissionBinding: async (id: string) => {
    const res = await fetch(`${BACKEND_URL}/roles/route-permissions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to delete route permission binding');
    }
    return true;
  },

  // BLOCK COMMENT: SYNC / RESEED DEFAULT ROUTE PERMISSIONS API METHOD
  syncDefaultRoutePermissions: async () => {
    const res = await fetch(`${BACKEND_URL}/roles/route-permissions/sync-defaults`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to sync default route permissions');
    }
    return res.json();
  },

  // BLOCK COMMENT: REQUIREMENT 3 SYSTEM SQL BACKUP DUMP EXPORTER METHOD
  exportSqlBackup: async () => {
    const res = await fetch(`${BACKEND_URL}/api/admin/backup/export?download=true`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to generate SQL data backup');
    }
    
    // Extract filename from header or generate default matching ekb_data_dd_mm_yyyy_sss.sql format
    const contentDisposition = res.headers.get('Content-Disposition');
    let filename = 'ekb_data_dump.sql';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }
    
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    return filename;
  },

  getSqlBackupsHistory: async (): Promise<Array<{ filename: string; filepath: string; size_bytes: number; created_at: number }>> => {
    const res = await fetch(`${BACKEND_URL}/api/admin/backup/history`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch SQL backup history');
    }
    return res.json();
  },

  downloadSqlBackupFile: async (filename: string) => {
    const res = await fetch(`${BACKEND_URL}/api/admin/backup/download/${encodeURIComponent(filename)}`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to download SQL backup file');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    return filename;
  },
};


