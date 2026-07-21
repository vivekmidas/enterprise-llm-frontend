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
    const token = getToken();

    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) throw new Error('Login failed');
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
    if (!res.ok) throw new Error('Registration failed');
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

  getNodesForCategories: async (category_id: number): Promise<{ nodes: CategoryItem[] }> => {
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

  getCategory: async (category_id: number): Promise<{ category: CategoryItem }> => {
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
  getSavedAgents: async () => {
    const res = await fetch(`${BACKEND_URL}/workflows`, {
      headers: getHeaders(),
      method: 'GET',
    });
    return res.json();
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
  updateCategory: async (id: number, category: any) => {
    const res = await fetch(`${BACKEND_URL}/categories/${id}`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(category),
    });
    return res.json();
  },

  /** Deletes a category */
  deleteCategory: async (id: number) => {
    const res = await fetch(`${BACKEND_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: getHeaders({
        'Content-Type': 'application/json',
      }),
    });
    return res.ok;
  },

  /** User Management */
  getUsers: async () => {
    const res = await fetch(`${BACKEND_URL}/admin/users`, {
      headers: getHeaders(),
      method: 'GET',
    });
    return res.json();
  },

  createUser: async (user: any) => {
    const res = await fetch(`${BACKEND_URL}/admin/users`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(user),
    });
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

  updateCustomer: async (id: number, customer: any) => {
    const res = await fetch(`${BACKEND_URL}/admin/customers/${id}`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(customer),
    });
    return res.json();
  },

  deleteCustomer: async (id: number) => {
    const res = await fetch(`${BACKEND_URL}/admin/customers/${id}`, {
      method: 'DELETE',
      headers: getHeaders({
        'Content-Type': 'application/json',
      }),
    });
    return res.ok;
  },

  createCustomerUser: async (customerId: number, user: any) => {
    const res = await fetch(`${BACKEND_URL}/admin/customers/${customerId}/users`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(user),
    });
    return res.json();
  },

  getCustomerNodesAdmin: async (customerId: number) => {
    const res = await fetch(`${BACKEND_URL}/admin/customers/${customerId}/nodes`, {
      headers: getHeaders(),
      method: 'GET',
    });
    return res.json();
  },

  configureCustomerNodesAdmin: async (customerId: number, nodes: any[]) => {
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

  getKnowledgeBases: async () => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/bases`, {
      headers: getHeaders(),
      method: 'GET',
    });
    if (!res.ok) throw new Error('Failed to fetch knowledge bases');
    return res.json();
  },

  createKnowledgeBase: async (payload: { name: string; description?: string; settings?: any }) => {
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
    payload: { name?: string; description?: string; status?: string; settings?: any },
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

  getKnowledgeBaseDocuments: async (kbId: number | string) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/bases/${kbId}/documents`, {
      headers: getHeaders(),
      method: 'GET',
    });
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },

  uploadDocument: async (
    kbId: number | string,
    file: File,
    metadata?: { description?: string; tags?: string; doc_type?: string },
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata?.description) formData.append('description', metadata.description);
    if (metadata?.tags) formData.append('tags', metadata.tags);
    if (metadata?.doc_type) formData.append('doc_type', metadata.doc_type);

    const res = await fetch(`${BACKEND_URL}/api/knowledge/bases/${kbId}/documents`, {
      method: 'POST',
      headers: getHeaders(), // Let browser set boundary for multipart/form-data
      body: formData,
    });
    if (!res.ok) {
      let msg = 'Failed to upload document';
      try {
        const errData = await res.json();
        msg = errData.detail || msg;
      } catch {}
      throw new Error(msg);
    }
    return res.json();
  },

  deleteDocument: async (kbId: number | string, docId: number | string) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/bases/${kbId}/documents/${docId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete document');
    return res.json();
  },

  getDocumentStatus: async (kbId: number | string, docId: number | string) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/bases/${kbId}/documents/${docId}`, {
      headers: getHeaders(),
      method: 'GET',
    });
    if (!res.ok) throw new Error('Failed to fetch document status');
    return res.json();
  },

  retrieveKnowledge: async (payload: {
    query: string;
    knowledge_base_ids: number[];
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

  createLlmProfile: async (profile: any, customerId?: string | number) => {
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

  updateLlmProfile: async (id: number | string, profile: any, customerId?: string | number) => {
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

  deleteLlmProfile: async (id: number | string, customerId?: string | number) => {
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
};
