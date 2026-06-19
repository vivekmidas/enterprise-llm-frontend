import { LoginPayload, RegisterPayload } from '@/lib/types/login';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
import { CategoryItem, AgentPayload } from '@/app/components/component-categoriees';

const getHeaders = (headers: Record<string, string> = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return {
    ...headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  /** Authentication */
  login: async (credentials: LoginPayload) => {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_email');
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
    const res = await fetch(`${BACKEND_URL}/nodes`, { headers: getHeaders() });
    return res.json();
  },

  getNodesByName: async (name: string): Promise<any> => {
    const res = await fetch(`${BACKEND_URL}/nodes/${name}`, { headers: getHeaders() });
    return res.json();
  },

  getNodesById: async (id: number): Promise<any> => {
    const res = await fetch(`${BACKEND_URL}/nodes/${id}`, { headers: getHeaders() });
    return res.json();
  },

  getNodesForCategories: async (category_id: number): Promise<{ nodes: CategoryItem[] }> => {
    const res = await fetch(`${BACKEND_URL}/nodes/categories/${category_id}`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  /** Retrieves defined categories to organize workflows in the UI */
  getNodesCategories: async (): Promise<string[] | { categories: string[] }> => {
    const res = await fetch(`${BACKEND_URL}/categories`, { headers: getHeaders() });
    return res.json();
  },

  getCategory: async (category_id: number): Promise<{ category: CategoryItem }> => {
    const res = await fetch(`${BACKEND_URL}/categories/${category_id}`, {
      headers: getHeaders(),
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
    const res = await fetch(`${BACKEND_URL}/workflows/${agentId}`, { headers: getHeaders() });
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
    const res = await fetch(`${BACKEND_URL}/agent/${agentId}/nodes/${nodeId}/properties`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(properties),
    });
    if (!res.ok) throw new Error('Failed to update workflow node properties');
    return res.json();
  },

  /** Lists all saved workflows stored in the database */
  getSavedAgents: async () => {
    const res = await fetch(`${BACKEND_URL}/workflows`, { headers: getHeaders() });
    return res.json();
  },

  getAgentsByUser: async (userId: string) => {
    const res = await fetch(`${BACKEND_URL}/agents/user/${userId}`, { headers: getHeaders() });
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
      headers: getHeaders(),
    });
    return res.json();
  },

  /** Deletes a workflow */
  deleteWorkflow: async (workflowId: string, user: { id: string; role: string; email: string }) => {
    const res = await fetch(`${BACKEND_URL}/workflows/${workflowId}`, {
      method: 'DELETE',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(user),
    });
    return res.ok;
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
      headers: getHeaders(),
    });
    return res.ok;
  },

  /** User Management */
  getUsers: async () => {
    const res = await fetch(`${BACKEND_URL}/admin/users`, { headers: getHeaders() });
    return res.json();
  },

  // Admin Trigger Management
  getTriggerInstances: async (): Promise<any[]> => {
    const res = await fetch(`${BACKEND_URL}/admin/triggers`, { headers: getHeaders() });
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
        headers: getHeaders(),
      },
    );
    return res.json();
  },

  stopAllTriggers: async (nodeName: string) => {
    const res = await fetch(`${BACKEND_URL}/admin/triggers/${nodeName}/stop_all`, {
      method: 'POST',
      headers: getHeaders(),
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
    const res = await fetch(`${BACKEND_URL}/admin/oauth/providers`, { headers: getHeaders() });
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
};
