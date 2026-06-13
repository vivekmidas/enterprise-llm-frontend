const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
import { CategoryItem, AgentPayload } from '@/app/components/component-categoriees';

export const api = {
  /** Fetches all available agent definitions that can be used as components */
  getNodes: async (): Promise<{ agents: any[] }> => {
    const res = await fetch(`${BACKEND_URL}/nodes`);
    return res.json();
  },

  getNodesByName: async (name: string): Promise<any> => {
    const res = await fetch(`${BACKEND_URL}/nodes/${name}`);
    return res.json();
  },

  getNodesById: async (id: number): Promise<any> => {
    const res = await fetch(`${BACKEND_URL}/nodes/${id}`);
    return res.json();
  },

  getNodesForCategories: async (category_id: number): Promise<{ nodes: CategoryItem[] }> => {
    const res = await fetch(`${BACKEND_URL}/nodes/categories/${category_id}`);
    return res.json();
  },

  /** Retrieves defined categories to organize workflows in the UI */
  getNodesCategories: async (): Promise<string[] | { categories: string[] }> => {
    const res = await fetch(`${BACKEND_URL}/categories`);
    return res.json();
  },

  getCategory: async (category_id: number): Promise<{ category: CategoryItem }> => {
    const res = await fetch(`${BACKEND_URL}/categories/${category_id}`);
    return res.json();
  },

  /** Triggers a workflow execution by sending a message to the backend */
  executeChat: async (message: string, agentId: string = 'default') => {
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, workflow_id: agentId }),
    });
    return res.json();
  },

  /** Fetches the full graph data (nodes/edges) for a specific agent ID */
  getAgentById: async (agentId: string = 'default') => {
    const res = await fetch(`${BACKEND_URL}/workflows/${agentId}`);
    return res.json();
  },

  /** Reads persisted properties for one node instance inside a workflow */
  getAgentNodeProperties: async (agentId: string, nodeId: string) => {
    const res = await fetch(`${BACKEND_URL}/agents/${agentId}/nodes/${nodeId}/properties`);
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(properties),
    });
    if (!res.ok) throw new Error('Failed to update workflow node properties');
    return res.json();
  },

  /** Lists all saved workflows stored in the database */
  getSavedAgents: async () => {
    const res = await fetch(`${BACKEND_URL}/workflows`);
    return res.json();
  },

  // Save agent
  saveAgent: async (agent: AgentPayload) => {
    const res = await fetch(`${BACKEND_URL}/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agent),
    });
    return res.json();
  },

  /** Updates a node definition in the registry (catalog) */
  updateNode: async (node: any) => {
    const res = await fetch(`${BACKEND_URL}/nodes/${node.name}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(node),
    });
    return res.json();
  },

  /** Updates a node definition in the registry (catalog) */
  createNode: async (node: any) => {
    const res = await fetch(`${BACKEND_URL}/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(node),
    });
    return res.json();
  },

  /** Creates a new node category */
  createCategory: async (category: any) => {
    const res = await fetch(`${BACKEND_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    return res.json();
  },

  /** Updates an existing category */
  updateCategory: async (id: number, category: any) => {
    const res = await fetch(`${BACKEND_URL}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    return res.json();
  },

  /** Deletes a category */
  deleteCategory: async (id: number) => {
    const res = await fetch(`${BACKEND_URL}/categories/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  },

  // Admin Trigger Management
  getTriggerInstances: async (): Promise<any[]> => {
    const res = await fetch(`${BACKEND_URL}/admin/triggers`);
    return res.json();
  },

  activateTrigger: async (nodeName: string, agentNodeId: string, workflowConfig: any) => {
    const res = await fetch(
      `${BACKEND_URL}/admin/triggers/${nodeName}/activate?agent_node_id=${agentNodeId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      },
    );
    return res.json();
  },

  stopAllTriggers: async (nodeName: string) => {
    const res = await fetch(`${BACKEND_URL}/admin/triggers/${nodeName}/stop_all`, {
      method: 'POST',
    });
    return res.json();
  },

  updateTokensInDB: async (tokens: any) => {
    console.log('updateTokensInDB', tokens);
    const res = await fetch(`${BACKEND_URL}/webhooks/email/refresh-token`, {
      method: 'PUT',
      body: JSON.stringify(tokens),
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await res.json();
    console.log(result);
    return result;
  },

  getProviders: async () => {
    const res = await fetch(`${BACKEND_URL}/admin/auth/providers`);
    return res.json();
  },

  createProvider: async (provider: any) => {
    const res = await fetch(`${BACKEND_URL}/auth/providers`, {
      method: 'POST',
      body: JSON.stringify(provider),
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },
};
