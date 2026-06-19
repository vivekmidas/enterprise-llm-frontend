import type { Node } from '@xyflow/react';

import type { NodeDefinition, PropertyValue } from '../components/component-categoriees';

export type ExecutionStatus = 'idle' | 'running' | 'success' | 'error';
export type NodeProperties = Record<string, PropertyValue>;

export interface WorkflowNodeData extends Partial<NodeDefinition>, Record<string, unknown> {
  user_properties: NodeProperties;
  executionStatus?: ExecutionStatus;
  variant?: string;
  model?: string;
  subIcon?: string;
}

export interface WorkflowTraceStep {
  id: string;
  nodeId: string;
  nodeName: string;
  group: string;
  status: 'success' | 'error';
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
}

export type WorkflowGraphPayload = {
  nodes?: Node<WorkflowNodeData>[];
  nodes_structure?: Node<WorkflowNodeData>[];
  edges?: unknown[];
};
