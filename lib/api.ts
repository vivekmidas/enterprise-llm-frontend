const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export interface WorkflowPayload {
  id: string;
  name: string;
  nodes: unknown[];
  edges: unknown[];
}

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

  // Get the latest version of one workflow
  getWorkflow: async (workflowId: string = "default") => {
    const res = await fetch(`${BACKEND_URL}/workflow/${workflowId}`);
    return res.json();
  },

  // Get the latest version of every workflow
  getWorkflows: async () => {
    const res = await fetch(`${BACKEND_URL}/workflow`);
    return res.json();
  },

  // Save workflow
  saveWorkflow: async (workflow: WorkflowPayload) => {
    const res = await fetch(`${BACKEND_URL}/workflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflow),
    });
    return res.json();
  }
};
