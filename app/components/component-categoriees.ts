import { api } from '../../lib/api';
import type { ComponentType } from 'react';
import type { CSSProperties } from 'react';

export interface Category {
  id: number;
  name: string; // Formerly group
  label: string; // Display name and tooltip
  icon: string;
  color: string; // Base color name (e.g. 'blue', 'emerald')
}

export type PropertyValue = string | number | boolean | string[];

/** A single property in a node's input or output data contract */
export interface ContractProperty {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  example?: string;
  required?: boolean;
}

export interface AgentPropertyDefinition {
  key: string;
  label: string;
  type: 'string' | 'boolean' | 'choice' | 'password' | 'textarea' | 'number' | 'oauth';
  placeholder?: string;
  options?: string[];
  multiple?: boolean;
  description?: string;
  required?: boolean;
}

export interface AgentDefinition {
  id: number;
  name: string;
  label?: string;
  description: string;
  version?: string;
  category: number | string; // Renamed from group
  nodeType?: 'trigger' | 'tool' | 'default';
  icon: string;
  color?: string;
  badge?: string;
  subLabel?: string;
  triggerType?: string;
  outcome?: string;
  propertySchema?: AgentPropertyDefinition[];
  properties?: Record<string, PropertyValue>;
  inputContract?: ContractProperty[];
  outputContract?: ContractProperty[];
}

export interface CategoryItem {
  group: number;
  label: string;
  icon: ComponentType<{ className?: string; style?: CSSProperties }>;
  color: string;
  description?: string;
  id: number;
}

export interface AgentSidebarProps {
  onSelectAgent?: (id: string) => void;
  onNewAgent?: () => void;
  onAllAgentsLoaded?: (agentNames: string[]) => void;
}

export interface NodeCategory {
  id?: number;
  name: string;
  group?: string;
  label?: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface AgentNode {
  id?: number | string;
  name: string;
  label: string;
  description: string;
  node_type: string;
  version: string;
  category: string;
  group: string;
  icon?: string;
  color?: string;
  badge?: string;
  sub_label?: string;
  properties: Record<string, any>;
  property_schema: any[];
}

export interface NodeData {
  label?: string;
  properties: Record<string, any>;
  [key: string]: any;
}

export interface Node {
  id: string;
  type?: string; // Make type optional to align with ReactFlow's Node definition
  data: NodeData;
  position?: { x: number; y: number };
}

export interface AgentPayload {
  id: string;
  name: string;
  description?: string;
  nodes: Node[];
  edges: unknown[];
  category?: string;
  is_enabled?: boolean;
}

export const CATEGORIES: Record<string, Category> = {
  Start: { id: 1, name: 'Start', label: 'Agent Start', icon: 'play-circle', color: 'emerald' },
  Guardrails: {
    id: 2,
    name: 'Guardrails',
    label: 'Safety Guardrails',
    icon: 'fence',
    color: 'red',
  },
  Validation: {
    id: 3,
    name: 'Validation',
    label: 'Input Validation',
    icon: 'alert-triangle',
    color: 'amber',
  },
  Context: { id: 4, name: 'Context', label: 'Context Injection', icon: 'user-cog', color: 'blue' },
  LLM: { id: 5, name: 'LLM', label: 'LLM Processing', icon: 'bot', color: 'purple' },
  Output: {
    id: 6,
    name: 'Output',
    label: 'Output Generation',
    icon: 'check-circle',
    color: 'emerald',
  },
  Trigger: { id: 7, name: 'Trigger', label: 'Event Trigger', icon: 'play-circle', color: 'blue' },
  End: { id: 8, name: 'End', label: 'Agent End', icon: 'check-circle', color: 'gray' },
  Data: { id: 9, name: 'Data', label: 'Data Operations', icon: 'database', color: 'cyan' },
  Agent: { id: 10, name: 'Agent', label: 'AI Agent', icon: 'message-square', color: 'gray' },
  Custom: { id: 11, name: 'Custom', label: 'Custom Node', icon: 'message-square', color: 'gray' },
  Clock: { id: 12, name: 'Clock', label: 'Timer/Schedule', icon: 'clock', color: 'orange' },
  Workflow: { id: 13, name: 'Workflow', label: 'Sub-workflow', icon: 'workflow', color: 'indigo' },
};

export const getCategory = (name?: number): Category => {
  return (name && CATEGORIES[name]) || CATEGORIES.Agent;
};

// retrieve node details from the backend api /nodes
export const fetchNodeDetails = async (nodeName: string): Promise<Partial<AgentDefinition>> => {
  try {
    const response = await api.getNodesByName(nodeName);

    const data = response.node;
    // Return the full data object to ensure properties like icon, category, and label are available
    return {
      ...data,
      description: data.description,
      propertySchema: data.propertySchema || data.property_schema,
      properties: data.defaultProperties || data.properties,
      label: data.label,
      category: data.category,
    };
  } catch (error) {
    console.error(error);
    return {};
  }
};

const toDisplayName = (name: string) =>
  name
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

/**
 * Returns the default output contract for a node based on its category.
 * Used when a node does not have an explicit outputContract defined.
 */
export const getDefaultOutputContract = (category: string): ContractProperty[] => {
  const base: ContractProperty[] = [
    { key: 'status', label: 'Status', type: 'string', description: 'Execution status', example: 'success' },
    { key: 'nodeName', label: 'Node Name', type: 'string', description: 'Name of the executed node' },
  ];

  const byCategory: Record<string, ContractProperty[]> = {
    Trigger: [
      { key: 'event_type', label: 'Event Type', type: 'string', description: 'The type of trigger event', example: 'email.received' },
      { key: 'payload', label: 'Payload', type: 'object', description: 'Raw event payload data' },
      { key: 'timestamp', label: 'Timestamp', type: 'string', description: 'ISO timestamp when triggered', example: '2024-01-01T00:00:00Z' },
    ],
    LLM: [
      { key: 'model_response', label: 'Model Response', type: 'string', description: 'The text generated by the AI model' },
      { key: 'tokens_used', label: 'Tokens Used', type: 'number', description: 'Total tokens consumed', example: '512' },
      { key: 'model', label: 'Model', type: 'string', description: 'Model identifier used', example: 'claude-3-5-sonnet' },
    ],
    Data: [
      { key: 'rows_affected', label: 'Rows Affected', type: 'number', description: 'Number of rows modified', example: '3' },
      { key: 'data', label: 'Data', type: 'array', description: 'Array of result records' },
      { key: 'operation', label: 'Operation', type: 'string', description: 'Database operation performed', example: 'SELECT' },
    ],
    Condition: [
      { key: 'condition_result', label: 'Condition Result', type: 'boolean', description: 'Whether the condition evaluated to true', example: 'true' },
      { key: 'branch', label: 'Branch', type: 'string', description: 'Branch taken: success or failure', example: 'success' },
    ],
    Guardrails: [
      { key: 'passed', label: 'Passed', type: 'boolean', description: 'Whether the guardrail check passed', example: 'true' },
      { key: 'violations', label: 'Violations', type: 'array', description: 'List of detected violations' },
      { key: 'risk_score', label: 'Risk Score', type: 'number', description: 'Risk score from 0 to 100', example: '12' },
    ],
    Validation: [
      { key: 'valid', label: 'Valid', type: 'boolean', description: 'Whether data passed validation', example: 'true' },
      { key: 'errors', label: 'Errors', type: 'array', description: 'List of validation error messages' },
      { key: 'validated_data', label: 'Validated Data', type: 'object', description: 'Sanitized and validated data' },
    ],
    Context: [
      { key: 'context', label: 'Context', type: 'object', description: 'Injected context data' },
      { key: 'user_id', label: 'User ID', type: 'string', description: 'Identifier of the current user', example: 'usr_abc123' },
    ],
    Output: [
      { key: 'rendered', label: 'Rendered Output', type: 'string', description: 'The final rendered output' },
      { key: 'format', label: 'Format', type: 'string', description: 'Output format', example: 'text' },
    ],
    Clock: [
      { key: 'triggered_at', label: 'Triggered At', type: 'string', description: 'ISO timestamp of the scheduled trigger' },
      { key: 'schedule', label: 'Schedule', type: 'string', description: 'Cron expression that triggered this run' },
    ],
    Workflow: [
      { key: 'sub_result', label: 'Sub-workflow Result', type: 'object', description: 'Result returned by the sub-workflow' },
      { key: 'sub_status', label: 'Sub-workflow Status', type: 'string', description: 'Completion status of the sub-workflow' },
    ],
    Agent: [
      { key: 'agent_output', label: 'Agent Output', type: 'object', description: 'Output produced by the agent' },
      { key: 'agent_status', label: 'Agent Status', type: 'string', description: 'Execution status of the agent' },
    ],
  };

  return [...base, ...(byCategory[category] ?? [{ key: 'result', label: 'Result', type: 'object', description: 'Node execution result' }])];
};

/**
 * Returns the default input contract for a node based on its category.
 * Used when a node does not have an explicit inputContract defined.
 */
export const getDefaultInputContract = (category: string): ContractProperty[] => {
  const byCategory: Record<string, ContractProperty[]> = {
    LLM: [
      { key: 'prompt', label: 'Prompt', type: 'string', description: 'The prompt to send to the AI model', required: true },
      { key: 'context', label: 'Context', type: 'object', description: 'Additional context data' },
    ],
    Data: [
      { key: 'operation', label: 'Operation', type: 'string', description: 'Type of database operation', required: true },
      { key: 'params', label: 'Parameters', type: 'object', description: 'Query parameters' },
    ],
    Guardrails: [
      { key: 'content', label: 'Content', type: 'string', description: 'Content to check against guardrails', required: true },
      { key: 'context', label: 'Context', type: 'object', description: 'Optional context for evaluation' },
    ],
    Validation: [
      { key: 'data', label: 'Data', type: 'object', description: 'The data to validate', required: true },
    ],
    Condition: [
      { key: 'payload', label: 'Payload', type: 'object', description: 'Data to evaluate the condition against', required: true },
    ],
    End: [
      { key: 'result', label: 'Result', type: 'object', description: 'Final workflow result' },
      { key: 'status', label: 'Status', type: 'string', description: 'Terminal execution status', example: 'success' },
    ],
    Output: [
      { key: 'data', label: 'Data', type: 'object', description: 'Data to format and render', required: true },
      { key: 'template', label: 'Template', type: 'string', description: 'Optional output template' },
    ],
    Context: [
      { key: 'userId', label: 'User ID', type: 'string', description: 'User to load context for' },
    ],
    Workflow: [
      { key: 'input', label: 'Input', type: 'object', description: 'Input data passed to the sub-workflow' },
    ],
    Agent: [
      { key: 'task', label: 'Task', type: 'string', description: 'Task description for the agent', required: true },
      { key: 'context', label: 'Context', type: 'object', description: 'Context data for the agent' },
    ],
  };

  return byCategory[category] ?? [];
};

/**
 * Normalizes a node by fetching its full definition from the registry based on its name.
 */
export const normalizeAgent = async (name: string): Promise<AgentDefinition> => {
  const details = await fetchNodeDetails(name);
  return {
    name,
    label: details.label || toDisplayName(name),
    description: details.description || '',
    category: details.category ?? 1,
    icon: details.icon || 'bot',
    ...details,
  } as AgentDefinition;
};
