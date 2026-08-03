import { api } from '../../lib/api';
import type { ComponentType } from 'react';
import type { CSSProperties } from 'react';

export interface Category {
  id: string;
  name: string; // Formerly group
  label: string; // Display name and tooltip
  icon: string;
  color: string; // Base color name (e.g. 'blue', 'emerald')
}

export type PropertyValue = string | number | boolean | string[];

export interface NodePropertyDefinition {
  key: string;
  label: string;
  type:
    | 'string'
    | 'boolean'
    | 'choice'
    | 'password'
    | 'textarea'
    | 'number'
    | 'oauth'
    | 'source'
    | 'path';
  placeholder?: string;
  options?: string[];
  multiple?: boolean;
  default?: PropertyValue;
  description?: string;
  source?: string;
  /** For type='path' — passed to HTML file input accept attribute e.g. ".pdf,.docx,application/pdf" */
  accept?: string;
}

export interface NodeDefinition {
  id: string;
  name: string;
  label?: string;
  description: string;
  version?: string;
  category:  string; // Renamed from group
  nodeType?: 'trigger' | 'tool' | 'default';
  icon: string;
  color?: string;
  badge?: string;
  subLabel?: string;
  triggerType?: string;
  outcome?: string;
  propertySchema?: NodePropertyDefinition[];
  input_contract?: Record<string, any>;
  output_contract?: Record<string, any>;
  user_properties?: Record<string, PropertyValue>;
  system_properties?: Record<string, PropertyValue>;
}

export interface CategoryItem {
  group: string;
  label: string;
  icon: ComponentType<{ className?: string; style?: CSSProperties }>;
  color: string;
  description?: string;
  id: string;
}

export interface NodeSidebarProps {
  onSelectAgent?: (id: string) => void;
  onNewAgent?: () => void;
  onAllAgentsLoaded?: (agentNames: string[]) => void;
}

export type AgentSidebarProps = NodeSidebarProps;

export interface NodeCategory {
  id?: string;
  name: string;
  group?: string;
  label?: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface AgentNode {
  id?: string;
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
  user_properties: any[];
  system_properties: any[];
  input_contract: Record<string, any> | string;
  output_contract: Record<string, any> | string;
  is_enabled?: boolean;
  allow_node_testing?: boolean;
  customer_id?: number | null;
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
  user_id: string;
  category?: string;
  is_enabled?: boolean;
}

export const CATEGORIES: Record<string, Category> = {
  Start: { id: "1", name: 'Start', label: 'Agent Start', icon: 'play-circle', color: 'emerald' },
  Guardrails: {
    id: "2",
    name: 'Guardrails',
    label: 'Safety Guardrails',
    icon: 'fence',
    color: 'red',
  },
  Validation: {
    id: "3",
    name: 'Validation',
    label: 'Input Validation',
    icon: 'alert-triangle',
    color: 'amber',
  },
  Context: { id: "4", name: 'Context', label: 'Context Injection', icon: 'user-cog', color: 'blue' },
  LLM: { id: "5", name: 'LLM', label: 'LLM Processing', icon: 'bot', color: 'purple' },
  Output: {
    id: "6",
    name: 'Output',
    label: 'Output Generation',
    icon: 'check-circle',
    color: 'emerald',
  },
  Trigger: { id:"7", name: 'Trigger', label: 'Event Trigger', icon: 'play-circle', color: 'blue' },
  End: { id: "8", name: 'End', label: 'Agent End', icon: 'check-circle', color: 'gray' },
  Data: { id: "9", name: 'Data', label: 'Data Operations', icon: 'database', color: 'cyan' },
  Agent: { id: "10", name: 'Agent', label: 'AI Agent', icon: 'message-square', color: 'gray' },
  Custom: { id: "11", name: 'Custom', label: 'Custom Node', icon: 'message-square', color: 'gray' },
  Clock: { id: "12", name: 'Clock', label: 'Timer/Schedule', icon: 'clock', color: 'orange' },
  Workflow: { id: "13", name: 'Workflow', label: 'Sub-workflow', icon: 'workflow', color: 'indigo' },
  VectorDB: { id: "14", name: 'VectorDB', label: 'Vector DB', icon: 'blocks', color: 'emerald' },
};

export const getCategory = (name?: number): Category => {
  return (name && CATEGORIES[name]) || CATEGORIES.Agent;
};

// retrieve node details from the backend api /nodes
export const fetchNodeDetails = async (nodeName: string): Promise<Partial<NodeDefinition>> => {
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
 * Normalizes a node by fetching its full definition from the registry based on its name.
 */
export const normalizeAgent = async (name: string): Promise<NodeDefinition> => {
  const details = await fetchNodeDetails(name);
  return {
    name,
    label: details.label || toDisplayName(name),
    description: details.description || '',
    category: details.category ?? 1,
    icon: details.icon || 'bot',
    ...details,
  } as NodeDefinition;
};
