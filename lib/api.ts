import { LoginPayload, RegisterPayload } from '@/lib/types/login';

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
import { CategoryItem, AgentPayload } from '@/app/components/component-categoriees';

/* ==============================================================================
   BLOCK COMMENT: CENTRAL API AUTH & CREDENTIALS CLIENT
   Maintains access token in memory / session and passes Authorization header
   along with credentials: 'include' for cross-port compatibility.
   ============================================================================== */
let inMemoryToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  inMemoryToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem('token', token);
      document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    } else {
      sessionStorage.removeItem('token');
      localStorage.removeItem('token');
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    }
  }
};

export const getAccessToken = (): string | null => {
  if (inMemoryToken) return inMemoryToken;
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('token') || localStorage.getItem('token');
  }
  return null;
};

export const getHeaders = (headers: Record<string, string> = {}): Record<string, string> => {
  const token = getAccessToken();
  return {
    ...headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const getToken = () => {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : null;
};

export const apiFetch = async (url: string, init: RequestInit = {}): Promise<Response> => {
  const headers = getHeaders((init.headers as Record<string, string>) || {});
  return fetch(url, {
    ...init,
    credentials: 'include',
    headers,
  });
};

export const handleResponse = async (res: Response, defaultMessage = 'Request failed') => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status === 'error') {
    let errorDetail = data.detail ?? data.details ?? data.message ?? defaultMessage;
    if (typeof errorDetail === 'object' && errorDetail !== null) {
      if (Array.isArray(errorDetail)) {
        errorDetail = errorDetail.map((d: any) => d.msg || JSON.stringify(d)).join('; ');
      } else {
        errorDetail = errorDetail.message || JSON.stringify(errorDetail);
      }
    }
    console.error(`[API Error ${res.status || ''}] ${res.url}:`, errorDetail);
    throw new Error(String(errorDetail));
  }
  return data;
};

export const api = {
  /** Authentication */

  login: async (credentials: LoginPayload) => {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(credentials),
    });
    const data = await handleResponse(res, 'Login failed');
    if (data.token) {
      setAccessToken(data.token);
    }
    return data;
  },

  getCurrentUser: async () => {
    const res = await fetch(`${BACKEND_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include',
      headers: getHeaders(),
    });
    if (res.status === 401) {
      setAccessToken(null);
    }
    return handleResponse(res, 'Failed to fetch user details');
  },

  logout: async () => {
    try {
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      }).catch(() => {});
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');

        // Clear all accessible cookies
        document.cookie.split(';').forEach((cookie) => {
          const name = cookie.split('=')[0].trim();
          if (name) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          }
        });
      }
    }
  },

  register: async (data: RegisterPayload) => {
    const res = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res, 'Registration failed');
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
    return handleResponse(res, 'Failed to load workflow node properties');
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
    return handleResponse(res, 'Failed to update workflow node properties');
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

  /* ==============================================================================
     BLOCK COMMENT: WORKFLOW INVOCATION SPEC FETCHER
     Reference: EPIC-WORKFLOW-ENDPOINT-001 / STORY-WF-INVOKE-SPEC
     Description:
       Fetches execution endpoint path (/run/workflows/{customer_id}/{workflow_id}),
       required headers, entry input_contract, and generated sample payload.
     ============================================================================== */
  getWorkflowInvocationSpec: async (workflowId: string) => {
    const res = await fetch(
      `${BACKEND_URL}/workflows/${encodeURIComponent(workflowId)}/invocation-spec`,
      {
        method: 'GET',
        headers: getHeaders(),
      },
    );
    return handleResponse(res, 'Failed to fetch workflow invocation spec');
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
    await handleResponse(res, 'Failed to delete workflow');
    return true;
  },

  // =============================================================================
  // BLOCK COMMENT: DOMAIN-AGNOSTIC WORKFLOW EXECUTION CLIENT (EPIC-ARCH-001)
  // Allows frontend plants (legal, education, admin) to execute workflows via
  // the Gateway REST API and query trace observability results.
  // =============================================================================
  executeWorkflow: async (
    workflowIdOrSlug: string,
    inputData: any,
    options?: {
      executionMode?: 'sync' | 'async';
      traceId?: string;
      metadata?: Record<string, any>;
    },
  ) => {
    const payload = {
      input_data: inputData,
      execution_mode: options?.executionMode || 'sync',
      trace_id: options?.traceId,
      metadata: options?.metadata || {},
    };
    const res = await fetch(
      `${BACKEND_URL}/workflows/${encodeURIComponent(workflowIdOrSlug)}/execute`,
      {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      },
    );
    return handleResponse(res, `Failed to execute workflow '${workflowIdOrSlug}'`);
  },

  getWorkflowTrace: async (traceId: string) => {
    const res = await fetch(`${BACKEND_URL}/workflows/traces/${encodeURIComponent(traceId)}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res, `Failed to fetch trace '${traceId}'`);
  },

  /** Updates a node definition in the registry (catalog) */
  updateNode: async (node: any) => {
    const res = await fetch(`${BACKEND_URL}/nodes/${node.name}`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(node),
    });
    return handleResponse(res, 'Failed to update node');
  },

  /** Updates a node definition in the registry (catalog) */
  createNode: async (node: any) => {
    const res = await fetch(`${BACKEND_URL}/nodes`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(node),
    });
    return handleResponse(res, 'Failed to create node');
  },

  /** Deletes a node definition from the registry */
  deleteNode: async (nodeName: string, force: boolean = false) => {
    const res = await fetch(`${BACKEND_URL}/nodes/${nodeName}?force=${force}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    await handleResponse(res, 'Failed to delete node');
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
  getUsers: async (customerId?: string) => {
    const url = new URL(`${BACKEND_URL}/admin/users`);
    if (customerId !== undefined && customerId !== null && String(customerId) !== 'all') {
      url.searchParams.append('customer_id', String(customerId));
    }
    const res = await fetch(url.toString(), {
      headers: getHeaders(),
      method: 'GET',
    });
    const data = await handleResponse(res, 'Failed to fetch users');
    return Array.isArray(data) ? data : [];
  },

  createUser: async (user: any) => {
    const res = await fetch(`${BACKEND_URL}/admin/users`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(user),
    });
    return handleResponse(res, 'Failed to create user');
  },

  updateUserRole: async (
    userId: string,
    data: { name?: string; role?: string; role_id?: string; customer_id?: string | number | null },
  ) => {
    const res = await fetch(`${BACKEND_URL}/admin/users/${userId}`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleResponse(res, 'Failed to update user role');
  },

  deleteUser: async (id: number) => {
    const res = await fetch(`${BACKEND_URL}/admin/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    await handleResponse(res, 'Failed to delete user');
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
    return handleResponse(res, 'Failed to load audit logs');
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
    return handleResponse(res, 'Failed to create provider preset');
  },

  updateProviderPreset: async (id: string, payload: any) => {
    const res = await fetch(`${BACKEND_URL}/api/admin/provider-presets/${id}`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    return handleResponse(res, 'Failed to update provider preset');
  },

  deleteProviderPreset: async (id: string) => {
    const res = await fetch(`${BACKEND_URL}/api/admin/provider-presets/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    await handleResponse(res, 'Failed to delete provider preset');
    return true;
  },

  // ==============================================================================
  // BLOCK COMMENT: TENANT API KEY CLIENT METHODS (EPIC-AUTH-001 / STORY-1.4)
  // ==============================================================================
  getApiKeys: async (customerId?: string) => {
    const url = new URL(`${BACKEND_URL}/admin/api-keys`);
    if (customerId && customerId !== 'all') {
      url.searchParams.append('customer_id', String(customerId));
    }
    const res = await fetch(url.toString(), {
      headers: getHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  createApiKey: async (payload: {
    name: string;
    customer_id?: string;
    role_id?: string;
    scopes?: string[];
    allowed_workflow_ids?: string[];
    rate_limit_rpm?: number;
    expires_at?: string | null;
  }) => {
    const res = await fetch(`${BACKEND_URL}/admin/api-keys`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    return handleResponse(res, 'Failed to create API key');
  },

  updateApiKey: async (
    id: string,
    payload: {
      name?: string;
      role_id?: string;
      is_active?: boolean;
      scopes?: string[];
      allowed_workflow_ids?: string[];
      rate_limit_rpm?: number;
    },
  ) => {
    const res = await fetch(`${BACKEND_URL}/admin/api-keys/${id}`, {
      method: 'PATCH',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    return handleResponse(res, 'Failed to update API key');
  },

  deleteApiKey: async (id: string) => {
    const res = await fetch(`${BACKEND_URL}/admin/api-keys/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.ok;
  },

  seedProviderPresets: async () => {
    const res = await fetch(`${BACKEND_URL}/api/admin/provider-presets/seed`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res, 'Failed to seed provider presets');
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

  /* ==============================================================================
     BLOCK COMMENT: TENANT ADMIN CLONE NODE API (EPIC-PROPS-CONTRACT-001 / STORY-PROPS-002)
     ============================================================================== */
  cloneCustomerNode: async (payload: {
    base_node_name: string;
    name: string;
    label: string;
    description?: string;
    properties?: Record<string, any>;
    input_contract?: any;
    output_contract?: any;
  }, customerId?: string | number) => {
    const url = customerId
      ? `${BACKEND_URL}/nodes/customer/clone?customer_id=${customerId}`
      : `${BACKEND_URL}/nodes/customer/clone`;
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: getHeaders({ 'Content-Type': 'application/json' }),
    });
    return handleResponse(res, 'Failed to clone node configuration');
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
    return handleResponse(res, 'Failed to fetch knowledge bases');
  },
  /* END BLOCK */

  /* BLOCK: Domain Schemas API */
  getDomainSchemas: async () => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/domains`, {
      headers: getHeaders(),
      method: 'GET',
    });
    return handleResponse(res, 'Failed to fetch domain schemas');
  },

  getDomainSchema: async (id: string) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/domains/${id}`, {
      headers: getHeaders(),
      method: 'GET',
    });
    return handleResponse(res, 'Failed to fetch domain schema');
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
    fields?: Array<{
      key: string;
      label: string;
      description?: string;
      type?: string;
      weight: number;
      importance: string;
      required?: boolean;
    }>;
    system_prompt?: string;
    user_prompt?: string;
  }) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/domains`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    return handleResponse(res, 'Failed to create domain schema');
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
      fields?: Array<{
        key: string;
        label: string;
        description?: string;
        type?: string;
        weight: number;
        importance: string;
        required?: boolean;
      }>;
      system_prompt?: string;
      user_prompt?: string;
    },
  ) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/domains/${id}`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    return handleResponse(res, 'Failed to update domain schema');
  },

  deleteDomainSchema: async (id: string) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/domains/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res, 'Failed to delete domain schema');
  },
  /* END BLOCK */

  createKnowledgeBase: async (payload: {
    name: string;
    description?: string;
    domain_id?: string;
    scope?: 'SYSTEM' | 'TENANT';
    is_system?: boolean;
    settings?: any;
  }) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/bases`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    return handleResponse(res, 'Failed to create knowledge base');
  },

  deleteKnowledgeBase: async (id: number | string) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/bases/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res, 'Failed to delete knowledge base');
  },

  updateKnowledgeBase: async (
    id: number | string,
    payload: {
      name?: string;
      description?: string;
      domain_id?: string;
      status?: string;
      scope?: 'SYSTEM' | 'TENANT';
      is_system?: boolean;
      settings?: any;
    },
  ) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/bases/${id}`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    return handleResponse(res, 'Failed to update knowledge base');
  },

  updateDocument: async (
    kbId: number | string,
    docId: number | string,
    payload: { name?: string; metadata?: any; tags?: any[]; status?: string },
  ) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/bases/${kbId}/documents/${docId}`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    return handleResponse(res, 'Failed to update document');
  },

  reprocessDocument: async (kbId: number | string, docId: number | string) => {
    const res = await fetch(
      `${BACKEND_URL}/api/knowledge/bases/${kbId}/documents/${docId}/reprocess`,
      {
        method: 'POST',
        headers: getHeaders(),
      },
    );
    return handleResponse(res, 'Failed to queue document for reprocessing');
  },

  getKnowledgeBaseDocuments: async (kbId: number | string) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/bases/${kbId}/documents`, {
      headers: getHeaders(),
      method: 'GET',
    });
    return handleResponse(res, 'Failed to fetch documents');
  },

  uploadDocument: async (
    kbId: string,
    file: File,
    metadata?: {
      description?: string;
      tags?: string;
      doc_type?: string;
      parser_strategy?: string;
      enable_dedup?: boolean;
    },
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata?.description) formData.append('description', metadata.description);
    if (metadata?.tags) formData.append('tags', metadata.tags);
    if (metadata?.doc_type) formData.append('doc_type', metadata.doc_type);
    if (metadata?.parser_strategy) formData.append('parser_strategy', metadata.parser_strategy);
    if (metadata?.enable_dedup !== undefined)
      formData.append('enable_dedup', String(metadata.enable_dedup));

    const res = await fetch(`${BACKEND_URL}/api/knowledge/bases/${kbId}/upload`, {
      method: 'POST',
      headers: getHeaders(), // Let browser set boundary for multipart/form-data
      body: formData,
    });
    return handleResponse(res, 'Failed to upload document');
  },

  deleteDocument: async (kbId: string, docId: string) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/bases/${kbId}/documents/${docId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res, 'Failed to delete document');
  },

  getDocumentStatus: async (kbId: string, docId: string) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/bases/${kbId}/documents/${docId}`, {
      headers: getHeaders(),
      method: 'GET',
    });
    return handleResponse(res, 'Failed to fetch document status');
  },

  getDocumentViews: async (kbId: string | number, docId: string | number) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/bases/${kbId}/documents/${docId}/views`, {
      headers: getHeaders(),
      method: 'GET',
    });
    return handleResponse(res, 'Failed to fetch document views');
  },

  updateDocumentViews: async (
    kbId: string | number,
    docId: string | number,
    payload: { normalized_text?: string; structured_json?: any },
  ) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/bases/${kbId}/documents/${docId}/views`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    return handleResponse(res, 'Failed to update document views');
  },

  retrieveKnowledge: async (payload: {
    query: string;
    knowledge_base_ids: string[];
    profile_id?: string;
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
    return handleResponse(res, 'Failed to retrieve knowledge');
  },

  generateResponse: async (payload: {
    query: string;
    context: any;
    temperature?: number;
    max_generation_tokens?: number;
    system_prompt?: string;
    profile_id?: string;
    llm_profile_id?: string;
    llm_config?: any;
    llm_config_id?: number | string;
  }) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/generate`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    return handleResponse(res, 'Failed to generate response');
  },

  getDocumentTypes: async (): Promise<string[]> => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/document-types`, {
      headers: getHeaders(),
      method: 'GET',
    });
    return handleResponse(res, 'Failed to fetch document types');
  },

  updateDocumentTypes: async (types: string[]): Promise<string[]> => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/document-types`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(types),
    });
    return handleResponse(res, 'Failed to update document types');
  },

  getCompanySettings: async (customerId?: string | number) => {
    const url = new URL(`${BACKEND_URL}/api/admin/company/settings`);
    if (customerId) {
      url.searchParams.append('customer_id', String(customerId));
    }
    const res = await fetch(url.toString(), {
      headers: getHeaders(),
    });
    return handleResponse(res, 'Failed to fetch company settings');
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
    return handleResponse(res, 'Failed to update company settings');
  },

  getLlmProfile: async (profileId: string | number) => {
    const res = await fetch(`${BACKEND_URL}/api/profiles/${profileId}`, {
      headers: getHeaders(),
    });
    return handleResponse(res, 'Failed to fetch LLM profile');
  },

  getLlmProfiles: async (customerId?: string | number) => {
    const url = new URL(`${BACKEND_URL}/api/profiles`);
    if (customerId && customerId !== 'all') {
      url.searchParams.append('customer_id', String(customerId));
    }
    const res = await fetch(url.toString(), {
      headers: getHeaders(),
    });
    if (!res.ok) {
      // Fallback to /api/llm-profiles
      const fallbackUrl = new URL(`${BACKEND_URL}/api/llm-profiles`);
      if (customerId && customerId !== 'all')
        fallbackUrl.searchParams.append('customer_id', String(customerId));
      const fbRes = await fetch(fallbackUrl.toString(), { headers: getHeaders() });
      return handleResponse(fbRes, 'Failed to fetch LLM profiles');
    }
    return res.json();
  },

  createLlmProfile: async (profile: any, customerId?: string) => {
    const url = new URL(`${BACKEND_URL}/api/profiles`);
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(profile),
    });
    return handleResponse(res, 'Failed to create LLM profile');
  },

  updateLlmProfile: async (id: string, profile: any, customerId?: string) => {
    const url = new URL(`${BACKEND_URL}/api/profiles/${id}`);
    const res = await fetch(url.toString(), {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(profile),
    });
    return handleResponse(res, 'Failed to update LLM profile');
  },

  deleteLlmProfile: async (id: string, customerId?: string) => {
    const url = new URL(`${BACKEND_URL}/api/profiles/${id}`);

    const res = await fetch(url.toString(), {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.status === 204) return true;
    await handleResponse(res, 'Failed to delete LLM profile');
    return true;
  },

  activateLlmProfile: async (id: number | string, customerId?: string | number) => {
    const url = new URL(`${BACKEND_URL}/api/profiles/${id}/set-default`);
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res, 'Failed to activate LLM profile');
  },

  runPlaygroundTest: async (payload: any) => {
    const res = await fetch(`${BACKEND_URL}/api/v1/playground/test`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    return handleResponse(res, 'Playground test execution failed');
  },

  testLlmConnection: async (payload: any) => {
    const res = await fetch(`${BACKEND_URL}/api/admin/company/settings/test-connection`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    return handleResponse(res, 'Connection test failed');
  },

  testNode: async (payload: { node_name: string; config: any; data: any; context?: any }) => {
    const res = await fetch(`${BACKEND_URL}/nodes/test-node`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    return handleResponse(res, 'Failed to execute node test');
  },

  getJsonSamples: async (schema: any) => {
    const res = await fetch(`${BACKEND_URL}/nodes/json-samples`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ schema }),
    });
    return handleResponse(res, 'Failed to generate JSON sample');
  },

  getConfiguredLLMProfiles: async () => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/configured-profiles`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  // BLOCK COMMENT: LEGAL & DOMAIN RESEARCH SEARCH API ENDPOINT
  // Routes to /api/knowledge/legal/search or /api/knowledge/search
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
    search_system_prompt?: string;
    search_user_prompt?: string;
  }) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/legal/search`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    return handleResponse(res, 'Legal search failed');
  },

  searchDomainKnowledge: async (payload: {
    query: string;
    domain?: string;
    knowledge_base_id?: string;
    filters?: Record<string, any>;
    concepts?: string[];
    approach?: string;
    weights?: Record<string, number>;
    include_summary?: boolean;
    page?: number;
    limit?: number;
    llm_profile_id?: string;
    profile_id?: string;
    search_system_prompt?: string;
    search_user_prompt?: string;
  }) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/search`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    return handleResponse(res, 'Domain search failed');
  },

  getTaxonomySuggestions: async (
    query: string,
    category?: string,
    limit: number = 12,
  ): Promise<{
    suggestions: Array<{
      id: string;
      category: string;
      canonical_name: string;
      code?: string;
      usage_count: number;
      is_auto_discovered: boolean;
    }>;
    query: string;
  }> => {
    try {
      const params = new URLSearchParams({ q: query, limit: String(limit) });
      if (category) params.append('category', category);
      const res = await fetch(
        `${BACKEND_URL}/api/knowledge/taxonomy/suggest?${params.toString()}`,
        {
          headers: getHeaders(),
        },
      );
      if (!res.ok) return { suggestions: [], query };
      return res.json();
    } catch {
      return { suggestions: [], query };
    }
  },

  synthesizeDomainResearch: async (payload: {
    instruction: string;
    domain?: string;
    knowledge_base_id?: string;
    document_ids?: string[];
    case_cnrs?: string[];
    user_notes?: string;
    raw_context?: string;
    filing_type?: string;
    llm_profile_id?: string;
    drafting_system_prompt?: string;
    drafting_user_prompt?: string;
  }) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/synthesize`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    return handleResponse(res, 'Research drafting failed');
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

  saveQuery: async (payload: {
    title: string;
    query_text?: string;
    filters_json?: any;
    is_public: boolean;
  }) => {
    const res = await fetch(`${BACKEND_URL}/api/knowledge/legal/saved-queries`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    return handleResponse(res, 'Failed to save query');
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
    return handleResponse(res, 'Failed to fetch case detail');
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
    return handleResponse(res, 'Document ingestion failed');
  },

  triggerWebhookWorkflow: async (webhookPath: string, payload: any) => {
    const cleanPath = webhookPath.startsWith('/') ? webhookPath.slice(1) : webhookPath;
    const res = await fetch(`${BACKEND_URL}/webhooks/run/${cleanPath}`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    return handleResponse(res, 'Webhook workflow execution failed');
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
    const headers = getHeaders((options.headers as any) || { 'Content-Type': 'application/json' });
    const res = await fetch(url, { ...options, headers });
    if (res.status === 204) return null;
    return handleResponse(res, 'API request failed');
  },

  /** Roles & Permissions API */
  getRoles: async (customerId?: string) => {
    const url = customerId
      ? `${BACKEND_URL}/roles?customer_id=${customerId}`
      : `${BACKEND_URL}/roles`;
    const res = await fetch(url, { method: 'GET', headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  getPermissionsRegistry: async () => {
    const res = await fetch(`${BACKEND_URL}/roles/permissions`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) return { permissions: [], grouped_by_module: {} };
    return res.json();
  },

  createRole: async (
    data: {
      role_name: string;
      role_type?: string;
      description?: string;
      permission_ids?: string[];
    },
    customerId?: string,
  ) => {
    const url = customerId
      ? `${BACKEND_URL}/roles?customer_id=${customerId}`
      : `${BACKEND_URL}/roles`;
    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleResponse(res, 'Failed to create role');
  },

  updateRole: async (
    roleId: string,
    data: { role_name?: string; description?: string; permission_ids?: string[] },
  ) => {
    const res = await fetch(`${BACKEND_URL}/roles/${roleId}`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleResponse(res, 'Failed to update role');
  },

  deleteRole: async (roleId: string) => {
    const res = await fetch(`${BACKEND_URL}/roles/${roleId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    await handleResponse(res, 'Failed to delete role');
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
    actions?: Array<{
      action: string;
      is_route_guard?: boolean;
      api_path?: string;
      http_methods?: string[];
      label: string;
      description?: string;
    }>;
  }) => {
    const res = await fetch(`${BACKEND_URL}/roles/modules/custom`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleResponse(res, 'Failed to create custom module');
  },

  deleteCustomModule: async (moduleId: string) => {
    const res = await fetch(`${BACKEND_URL}/roles/modules/${encodeURIComponent(moduleId)}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    await handleResponse(res, 'Failed to delete module');
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

  createPermission: async (data: {
    id: string;
    module: string;
    submodule?: string;
    label: string;
    description?: string;
  }) => {
    const res = await fetch(`${BACKEND_URL}/roles/permissions`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleResponse(res, 'Failed to create permission');
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
    return handleResponse(res, 'Failed to register module permissions');
  },

  createRoutePermissionBinding: async (data: {
    pattern: string;
    permission_id: string;
    module?: string;
    submodule?: string;
    label?: string;
    description?: string;
  }) => {
    const res = await fetch(`${BACKEND_URL}/roles/route-permissions`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleResponse(res, 'Failed to create route permission binding');
  },

  updateRoutePermissionBinding: async (
    id: string,
    data: {
      pattern: string;
      permission_id: string;
      module?: string;
      submodule?: string;
      label?: string;
      description?: string;
    },
  ) => {
    const res = await fetch(`${BACKEND_URL}/roles/route-permissions/${id}`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleResponse(res, 'Failed to update route permission binding');
  },

  deleteRoutePermissionBinding: async (id: string) => {
    const res = await fetch(`${BACKEND_URL}/roles/route-permissions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    await handleResponse(res, 'Failed to delete route permission binding');
    return true;
  },

  // BLOCK COMMENT: SYNC / RESEED DEFAULT ROUTE PERMISSIONS API METHOD
  syncDefaultRoutePermissions: async () => {
    const res = await fetch(`${BACKEND_URL}/roles/route-permissions/sync-defaults`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
    });
    return handleResponse(res, 'Failed to sync default route permissions');
  },

  // BLOCK COMMENT: REQUIREMENT 3 SYSTEM SQL BACKUP DUMP EXPORTER METHOD
  exportSqlBackup: async () => {
    const res = await fetch(`${BACKEND_URL}/api/admin/backup/export?download=true`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) {
      await handleResponse(res, 'Failed to generate SQL data backup');
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

  getSqlBackupsHistory: async (): Promise<
    Array<{ filename: string; filepath: string; size_bytes: number; created_at: number }>
  > => {
    const res = await fetch(`${BACKEND_URL}/api/admin/backup/history`, {
      headers: getHeaders(),
    });
    return handleResponse(res, 'Failed to fetch SQL backup history');
  },

  downloadSqlBackupFile: async (filename: string) => {
    const res = await fetch(
      `${BACKEND_URL}/api/admin/backup/download/${encodeURIComponent(filename)}`,
      {
        headers: getHeaders(),
      },
    );
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

  /* ==============================================================================
     BLOCK COMMENT: MULTILINGUAL VOICE LEGAL ASSISTANT APIS
     Epic: epic_system_tenant_common_knowledge_bases.md
     Story: STORY-SYSKB-04 (Multilingual Voice Conversational Knowledge Assistant)
     ============================================================================== */
  startAssistantSession: async (title?: string, language: string = 'en') => {
    const res = await fetch(`${BACKEND_URL}/api/chat/assistant/session`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ title: title || 'Legal Assistant Session', language }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to initialize assistant session');
    }
    return res.json();
  },

  sendAssistantMessage: async (
    sessionId: string,
    message: string,
    language?: string,
    audioUsed: boolean = false,
  ) => {
    const res = await fetch(`${BACKEND_URL}/api/chat/assistant/message`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        session_id: sessionId,
        message,
        language: language || null,
        audio_used: audioUsed,
      }),
    });
    return handleResponse(res, 'Failed to send message to assistant');
  },

  sendInactivityEvent: async (
    sessionId: string,
    eventType: 'ping' | 'bye',
    language: string = 'en',
  ) => {
    const res = await fetch(`${BACKEND_URL}/api/chat/assistant/inactivity-event`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ session_id: sessionId, event_type: eventType, language }),
    });
    return handleResponse(res, 'Failed to post inactivity event');
  },

  getAssistantHistory: async (limit: number = 10, sessionId?: string) => {
    const query = new URLSearchParams({ limit: String(limit) });
    if (sessionId) query.set('session_id', sessionId);
    const res = await fetch(`${BACKEND_URL}/api/chat/assistant/history?${query.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse(res, 'Failed to fetch assistant conversation history');
  },

  /* ==============================================================================
     BLOCK COMMENT: LEGAL INTELLIGENCE & MATTER INTAKE API (EPIC 3.3)
     Integrates with /api/v1/legal backend endpoints for matter analysis,
     provenance tracking, 1-click case conversion, and draft scaffolding.
     ============================================================================== */
  legalIntake: async (payload: {
    input_mode: string;
    raw_text?: string;
    instructions?: string;
    file_name?: string;
  }) => {
    const res = await fetch(`${BACKEND_URL}/api/v1/legal/analysis/intake`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    return handleResponse(res, 'Failed to process matter intake');
  },

  legalUploadIntake: async (formData: FormData) => {
    const headers = getHeaders();
    // Do not set Content-Type header manually for multipart FormData
    const res = await fetch(`${BACKEND_URL}/api/v1/legal/analysis/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return handleResponse(res, 'Failed to process document upload intake');
  },

  getLegalAnalysis: async (analysisId: string) => {
    const res = await fetch(`${BACKEND_URL}/api/v1/legal/analysis/${analysisId}`, {
      headers: getHeaders(),
    });
    return handleResponse(res, 'Failed to fetch analysis details');
  },

  overrideLegalFields: async (
    analysisId: string,
    overrides: Array<{ field_name: string; value: string }>,
  ) => {
    const res = await fetch(`${BACKEND_URL}/api/v1/legal/analysis/${analysisId}/fields`, {
      method: 'PATCH',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ overrides }),
    });
    return handleResponse(res, 'Failed to update field overrides');
  },

  convertAnalysisToCase: async (analysisId: string, payload: any) => {
    const res = await fetch(`${BACKEND_URL}/api/v1/legal/analysis/${analysisId}/convert-case`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    return handleResponse(res, 'Failed to convert analysis to case');
  },

  generateLegalDraftScaffold: async (
    analysisId: string,
    payload: { draft_type?: string; user_instructions?: string },
  ) => {
    const res = await fetch(`${BACKEND_URL}/api/v1/legal/analysis/${analysisId}/draft`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    return handleResponse(res, 'Failed to scaffold legal draft');
  },

  listLegalCases: async () => {
    const res = await fetch(`${BACKEND_URL}/api/v1/legal/cases`, {
      headers: getHeaders(),
    });
    return handleResponse(res, 'Failed to list tenant cases');
  },
};
