import { EdgeLabelRenderer, EdgeLabelRendererProps,EdgeProps, EdgeText, MarkerType, type Edge, type Node } from '@xyflow/react';

import type { NodeProperties, WorkflowGraphPayload, WorkflowNodeData } from './types';

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const defaultEdgeOptions = {
  style: { strokeWidth: 2, stroke: '#94a3b8' },
  EdgeText: "hello",
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 16,
    height: 16,
    color: '#3208a6b2'
  },
};


export const initialNodes: Node<WorkflowNodeData>[] = [];

export const getWorkflowNodes = (
  workflow: WorkflowGraphPayload | null | undefined,
): Node<WorkflowNodeData>[] => {
  if (!workflow) return initialNodes;
  return workflow.nodes || workflow.nodes_structure || initialNodes;
};

export const maskSecrets = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(maskSecrets);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, fieldValue]) => {
      const normalizedKey = key.toLowerCase();
      if (
        normalizedKey.includes('password') ||
        normalizedKey.includes('apikey') ||
        normalizedKey.includes('token') ||
        normalizedKey.includes('secret') ||
        normalizedKey.includes('key')
      ) {
        return [key, fieldValue ? '••••••••' : ''];
      }

      return [key, maskSecrets(fieldValue)];
    }),
  );
};

export const toUserProperties = (node: Node<WorkflowNodeData>): NodeProperties => {
  const properties = node.data?.user_properties;
  return properties && typeof properties === 'object' && !Array.isArray(properties)
    ? (properties as NodeProperties)
    : {};
};

export const buildExecutionSequence = (nodes: Node<WorkflowNodeData>[], edges: Edge[]) => {
  const startNodes = nodes.filter(
    (node) => (node.data as any)?.node_type?.toUpperCase() === 'TRIGGER',
  );

  if (startNodes.length === 0) {
    return {
      sequence: [] as Node<WorkflowNodeData>[],
      error: 'Agent must have at least one Trigger or Start node.',
    };
  }
  if (startNodes.length > 1) {
    return {
      sequence: [] as Node<WorkflowNodeData>[],
      error: 'Agent can only have one entry point (Trigger or Start).',
    };
  }

  const byId = new Map<string, Node<WorkflowNodeData>>(nodes.map((node) => [node.id, node]));
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, number>();

  edges.forEach((edge) => {
    if (!edge.source || !edge.target) return;
    outgoing.set(edge.source, [...(outgoing.get(edge.source) || []), edge.target]);
    incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1);
  });

  if ((incoming.get(startNodes[0].id) || 0) > 0) {
    return {
      sequence: [] as Node<WorkflowNodeData>[],
      error: 'Start node cannot have incoming edges.',
    };
  }

  const visited = new Set<string>();
  const stack = [startNodes[0].id];
  const sequence: Node<WorkflowNodeData>[] = [];

  while (stack.length > 0) {
    const nodeId = stack.pop()!;
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    const node = byId.get(nodeId);
    if (node) sequence.push(node);
    const nextIds = outgoing.get(nodeId) || [];
    stack.push(...nextIds);
  }

  if (sequence.length < 2) {
    return {
      sequence: [] as Node<WorkflowNodeData>[],
      error: 'Connect Start to at least one component before executing.',
    };
  }

  const unreachable = nodes.filter((node) => !visited.has(node.id));
  if (unreachable.length > 0) {
    return {
      sequence: [] as Node<WorkflowNodeData>[],
      error: `Every node must be connected in the execution sequence. Unconnected: ${unreachable[0].data?.name || unreachable[0].id}.`,
    };
  }

  return { sequence, error: '' };
};

export const runAgentNode = async (
  node: Node<WorkflowNodeData>,
  input: Record<string, unknown>,
) => {
  const data = node.data || {};
  const properties = toUserProperties(node);
  const name = String(data.name || data.label || node.id);
  const category = String(data.category || data.group || 'Agent');
  const normalizedName = name.toLowerCase();

  await wait(350 + Math.floor(Math.random() * 250));

  if (properties.enabled === false) {
    return {
      skipped: true,
      message: `${name} is disabled`,
      previous: input,
    };
  }

  if (category === 'Start') {
    return {
      event: 'agent.started',
      payload: input,
    };
  }

  if (category === 'End') {
    return {
      event: data.outcome === 'failure' ? 'agent.failed' : 'agent.completed',
      outcome: data.outcome || 'success',
      received: input,
    };
  }

  if (category === 'Condition') {
    const hasViolations =
      input.violations && Array.isArray(input.violations) && input.violations.length > 0;
    const status = hasViolations ? 'failure' : Math.random() > 0.4 ? 'success' : 'failure';

    return {
      status,
      message: `Condition evaluated to ${status}.`,
      ...input,
    };
  }

  return {
    nodeId: node.id,
    nodeName: name,
    category,
    status: 'success',
    executionTime: new Date().toISOString(),
    configuration: maskSecrets(properties),
    input: input,
    output: {
      message: `Simulated execution of ${name} completed.`,
      data: {
        processed_at: Date.now(),
        ...(category === 'Trigger' ? { event_type: data.triggerType || normalizedName } : {}),
        ...(category === 'Data' ? { rows_affected: 2 } : {}),
        ...(category === 'LLM'
          ? { model_response: 'Simulated AI response based on provided prompt.' }
          : {}),
      },
    },
  };
};
