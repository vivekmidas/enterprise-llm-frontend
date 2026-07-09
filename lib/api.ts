import { LoginPayload, RegisterPayload } from '@/lib/types/login';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
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
    const headers = getHeaders({
      'Content-Type': 'application/json',
    });
    console.log(headers);
    const res = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: getHeaders({
        'Content-Type': 'application/json',
      }),
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
      headers: getHeaders({
        'Content-Type': 'application/json',
      }),
    });
    return res.json();
  },

  getNodesByName: async (name: string): Promise<any> => {
    const res = await fetch(`${BACKEND_URL}/nodes/${name}`, {
      headers: getHeaders({
        'Content-Type': 'application/json',
      }),
    });
    return res.json();
  },

  getNodesById: async (id: number): Promise<any> => {
    const res = await fetch(`${BACKEND_URL}/nodes/${id}`, {
      headers: getHeaders({
        'Content-Type': 'application/json',
      }),
    });
    return res.json();
  },

  getNodesForCategories: async (category_id: number): Promise<{ nodes: CategoryItem[] }> => {
    const res = await fetch(`${BACKEND_URL}/nodes/categories/${category_id}`, {
      headers: getHeaders({
        'Content-Type': 'application/json',
      }),
    });
    return res.json();
  },

  /** Retrieves defined categories to organize workflows in the UI */
  getNodesCategories: async (): Promise<string[] | { categories: string[] }> => {
    const res = await fetch(`${BACKEND_URL}/categories`, {
      headers: getHeaders({
        'Content-Type': 'application/json',
      }),
    });
    return res.json();
  },

  getCategory: async (category_id: number): Promise<{ category: CategoryItem }> => {
    const res = await fetch(`${BACKEND_URL}/categories/${category_id}`, {
      headers: getHeaders({
        'Content-Type': 'application/json',
      }),
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
      headers: getHeaders({
        'Content-Type': 'application/json',
      }),
    });
    return res.json();
  },

  /** Reads persisted properties for one node instance inside a workflow */
  getAgentNodeProperties: async (agentId: string, nodeId: string) => {
    const res = await fetch(`${BACKEND_URL}/workflows/${agentId}/nodes/${nodeId}/properties`, {
      headers: getHeaders({
        'Content-Type': 'application/json',
      }),
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
      headers: getHeaders({
        'Content-Type': 'application/json',
      }),
    });
    return res.json();
  },

  getAgentsByUser: async (userId: string) => {
    const res = await fetch(`${BACKEND_URL}/agents/user/${userId}`, {
      headers: getHeaders({
        'Content-Type': 'application/json',
      }),
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
      method: 'GET'
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
      headers: getHeaders({
        'Content-Type': 'application/json',
      }),
    });
    if (!res.ok) throw new Error('Failed to load audit logs');
    return res.json();
  },

  getCustomers: async () => {
    const res = await fetch(`${BACKEND_URL}/admin/customers`, {
      headers: getHeaders({
        'Content-Type': 'application/json',
      }),
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
      headers: getHeaders({
        'Content-Type': 'application/json',
      }),
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
      headers: getHeaders({
        'Content-Type': 'application/json',
      }),
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
      headers: getHeaders({
        'Content-Type': 'application/json',
      }),
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
};
