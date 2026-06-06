const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export interface AgentPayload {
  id: string;
  name: string;
  description?: string;
  nodes: unknown[];
  edges: unknown[];
  category?: string;
  is_enabled?: boolean;
}

export const api = {
  /** Fetches all available agent definitions that can be used as components */
  getAgents: async (): Promise<{ agents: any[] }> => {
    const res = await fetch(`${BACKEND_URL}/nodes`);
    return res.json();
  },

  getAgentByName: async (name: string): Promise<any> => {
    const res = await fetch(`${BACKEND_URL}/nodes/${name}`);
    return res.json();
  },

  getNodesById: async (id: number): Promise<any> => {
    const res = await fetch(`${BACKEND_URL}/nodes/${id}`);
    return res.json();
  },

  getNodesForCategories: async (category_id: number): Promise<{ nodes: string[] }> => {
    const res = await fetch(`${BACKEND_URL}/nodes/categories/${category_id}`);
    return res.json();
  },

  /** Retrieves defined categories to organize workflows in the UI */
  getWorkflowCategories: async (): Promise<string[] | { categories: string[] }> => {
    const res = await fetch(`${BACKEND_URL}/categories`);
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

    /** Fetches the full graph data (nodes/edges) for a specific agent ID */
  getWorkflowById: async (agentId: string = 'default') => {
    const res = await fetch(`${BACKEND_URL}/workflows/${agentId}`);
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
};
