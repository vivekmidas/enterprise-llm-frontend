const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export const api = {
  // Get all available agents from backend
  getAgents: async () => {
    const res = await fetch(`${BACKEND_URL}/agents`);
    return res.json();
  },

  // Execute workflow (called by Test button)
  executeChat: async (message: string, workflowId: string = "default") => {
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, workflow_id: workflowId }),
    });
    return res.json();
  },

  // Get workflow definition (for backend to call)
  getWorkflow: async (workflowId: string = "default") => {
    const res = await fetch(`${BACKEND_URL}/api/workflows/${workflowId}`);
    return res.json();
  },

  // Save workflow
  saveWorkflow: async (workflowId: string, nodes: any[], edges: any[]) => {
    const payload = { id: workflowId, nodes, edges, updatedAt: new Date().toISOString() };

    const res = await fetch(`${BACKEND_URL}/api/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  }
};