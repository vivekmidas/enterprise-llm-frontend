const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export interface AgentPayload {
  id: string;
  name: string;
  nodes: unknown[];
  edges: unknown[];
  category?: string;
}

export const api = {
  // Get all available agents from backend
  getAgents: async () => {
    const res = await fetch(`${BACKEND_URL}/agents`);
    return res.json();
  },

  // Get workflow categories
  getWorkflowCategories: async () => {
    const res = await fetch(`${BACKEND_URL}/workflow/categories`);
    return res.json();
  },

  // Execute agent (called by Test button)
  executeChat: async (message: string, agentId: string = "default") => {
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, workflow_id: agentId }),
    });
    return res.json();
  },

  // Get the latest version of one agent
  getAgentById: async (agentId: string = "default") => {
    const res = await fetch(`${BACKEND_URL}/workflow/${agentId}`);
    return res.json();
  },

  // Get the latest version of every agent
  getSavedAgents: async () => {
    const res = await fetch(`${BACKEND_URL}/workflow`);
    return res.json();
  },

  // Save agent
  saveAgent: async (agent: AgentPayload) => {
    const res = await fetch(`${BACKEND_URL}/workflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agent),
    });
    return res.json();
  }
};
