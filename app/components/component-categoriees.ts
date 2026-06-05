import { api } from '../../lib/api';

export interface Category {
  id: number;
  name: string; // Formerly group
  label: string; // Display name and tooltip
  icon: string;
  color: string; // Base color name (e.g. 'blue', 'emerald')
}

export type PropertyValue = string | number | boolean | string[];

export interface AgentPropertyDefinition {
  key: string;
  label: string;
  type: 'string' | 'boolean' | 'choice' | 'password' | 'textarea' | 'number';
  placeholder?: string;
  options?: string[];
  multiple?: boolean;
}

export interface AgentDefinition {
  id: number;
  name: string;
  label?: string;
  description: string;
  category: number | string; // Renamed from group
  icon: string;
  color?: string;
  badge?: string;
  subLabel?: string;
  triggerType?: string;
  outcome?: string;
  propertySchema?: AgentPropertyDefinition[];
  defaultProperties?: Record<string, PropertyValue>;
}

export const CATEGORIES: Record<string, Category> = {
  Start: { id: 1, name: 'Start', label: 'Workflow Start', icon: 'play-circle', color: 'emerald' },
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
  End: { id: 8, name: 'End', label: 'Workflow End', icon: 'check-circle', color: 'gray' },
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
    const response = await api.getAgentByName(nodeName);

    const data = response.node;
    // Return the full data object to ensure properties like icon, category, and label are available
    return {
      ...data,
      description: data.description,
      propertySchema: data.propertySchema || data.property_schema,
      defaultProperties: data.defaultProperties || data.properties,
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
