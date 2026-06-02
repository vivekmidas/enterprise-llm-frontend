export interface Category {
  name: string;   // Formerly group
  label: string;  // Display name and tooltip
  icon: string;
  color: string;  // Base color name (e.g. 'blue', 'emerald')
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
  name: string;
  label?: string;
  description: string;
  category: string; // Renamed from group
  icon: string;
  color?: string;
  badge?: string;
  subLabel?: string;
  triggerType?: string;
  outcome?: string;
  propertySchema?: AgentPropertyDefinition[];
  defaultProperties?: Record<string, PropertyValue>;
}

type NodeInput = Partial<AgentDefinition> & {
  group?: string; // Support legacy naming from nodes
  icon?: string;
  label?: string;
  color?: string;
  badge?: string;
  sub_label?: string;
};

export const CATEGORIES: Record<string, Category> = {
  Start: { name: 'Start', label: 'Workflow Start', icon: 'play-circle', color: 'emerald' },
  Guardrails: { name: 'Guardrails', label: 'Safety Guardrails', icon: 'fence', color: 'red' },
  Validation: { name: 'Validation', label: 'Input Validation', icon: 'alert-triangle', color: 'amber' },
  Context: { name: 'Context', label: 'Context Injection', icon: 'user-cog', color: 'blue' },
  LLM: { name: 'LLM', label: 'LLM Processing', icon: 'bot', color: 'purple' },
  Output: { name: 'Output', label: 'Output Generation', icon: 'check-circle', color: 'emerald' },
  Trigger: { name: 'Trigger', label: 'Event Trigger', icon: 'play-circle', color: 'blue' },
  End: { name: 'End', label: 'Workflow End', icon: 'check-circle', color: 'gray' },
  Data: { name: 'Data', label: 'Data Operations', icon: 'database', color: 'cyan' },
  Agent: { name: 'Agent', label: 'AI Agent', icon: 'message-square', color: 'gray' },
  Custom: { name: 'Custom', label: 'Custom Node', icon: 'message-square', color: 'gray' },
  Clock: { name: 'Clock', label: 'Timer/Schedule', icon: 'clock', color: 'orange' },
  Workflow: { name: 'Workflow', label: 'Sub-workflow', icon: 'workflow', color: 'indigo' },
};

export const getCategory = (name?: string): Category => {
  return (name && CATEGORIES[name]) || CATEGORIES.Agent;
};

export const inferAgentCategory = (name: string): string => {
  const normalizedName = name.toLowerCase();

  if (normalizedName.includes('guard')) return 'Guardrails';
  if (normalizedName === 'start') return 'Start';
  if (
    normalizedName.includes('email') ||
    normalizedName.includes('sms') ||
    normalizedName.includes('schedule') ||
    normalizedName.includes('webhook') ||
    normalizedName.includes('smtp')
  )
    return 'Trigger';
  if (
    normalizedName.includes('success') ||
    normalizedName.includes('failure') ||
    normalizedName.includes('end')
  )
    return 'End';
  if (
    normalizedName.includes('db') ||
    normalizedName.includes('database') ||
    normalizedName.includes('crm')
  )
    return 'Data';
  if (normalizedName.includes('validator') || normalizedName.includes('validation'))
    return 'Validation';
  if (normalizedName.includes('context')) return 'Context';
  if (normalizedName.includes('llm') || normalizedName.includes('model')) return 'LLM';
  if (normalizedName.includes('output')) return 'Output';
  if (normalizedName.includes('trigger') || normalizedName.includes('start')) return 'Trigger';

  return 'Agent';
};

const toDisplayName = (name: string) =>
  name
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getAgentPropertyDefinition = (
  _name: string,
  _category: string,
  _triggerType?: string,
): Pick<AgentDefinition, 'propertySchema' | 'defaultProperties'> => {
  // Delinked: Agent definitions should carry their own properties.
  // Providing a generic minimal schema as fallback.
  return {
    propertySchema: [
      {
        key: 'enabled',
        label: 'Enabled',
        type: 'boolean',
      },
    ],
    defaultProperties: {
      enabled: true,
    },
  };
};

export const normalizeAgent = (agent: string | NodeInput): AgentDefinition => {
  if (typeof agent === 'string') {
    const categoryName = inferAgentCategory(agent);
    const category = getCategory(categoryName);
    const propertyDefinition = getAgentPropertyDefinition(agent, categoryName);

    return {
      name: agent,
      description: `${toDisplayName(agent)} agent`,
      category: categoryName,
      icon: category.icon,
      ...propertyDefinition,
    };
  }

  const name = agent.name || 'Untitled Agent';
  const categoryName = agent.category || agent.group || inferAgentCategory(name);
  const category = getCategory(categoryName);
  const propertyDefinition = getAgentPropertyDefinition(name, categoryName, agent.triggerType);

  return {
    name,
    label: agent.label || toDisplayName(name),
    description: agent.description || `${toDisplayName(name)} agent`,
    category: categoryName,
    icon: agent.icon || category.icon,
    color: agent.color,
    badge: agent.badge,
    subLabel: agent.subLabel || agent.sub_label,
    triggerType: agent.triggerType,
    outcome: agent.outcome,
    propertySchema: agent.propertySchema || propertyDefinition.propertySchema,
    defaultProperties: agent.defaultProperties || propertyDefinition.defaultProperties,
  };
};
