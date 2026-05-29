import { Clock } from 'lucide-react';

export type ComponentCategory =
  | 'Start'
  | 'Guardrails'
  | 'Validation'
  | 'Context'
  | 'LLM'
  | 'Output'
  | 'Trigger'
  | 'End'
  | 'Data'
  | 'Agent'
  | 'Workflow'
  | 'Clock'
  | 'Custom';

export type AgentIcon =
  | 'shield'
  | 'alert-triangle'
  | 'user-cog'
  | 'bot'
  | 'alert-circle'
  | 'clock'
  | 'check-circle'
  | 'play-circle'
  | 'message-square'
  | 'x-circle'
  | 'database'
  | 'workflow';

export interface ComponentCategoryStyle {
  borderColor: string;
  textColor: string;
  bgColor: string;
  icon: AgentIcon;
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
  group: string;
  icon: AgentIcon;
  color?: string;
  badge?: string;
  subLabel?: string;
  triggerType?: string;
  outcome?: string;
  propertySchema?: AgentPropertyDefinition[];
  defaultProperties?: Record<string, PropertyValue>;
}

type NodeInput = Partial<AgentDefinition> & {
  category?: string;
  icon?: string;
  label?: string;
  color?: string;
  badge?: string;
  sub_label?: string; // Support snake_case from backend
};

export const componentCategories: Record<ComponentCategory, ComponentCategoryStyle> = {
  Start: {
    borderColor: 'border-emerald-600',
    textColor: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    icon: 'play-circle',
  },
  Guardrails: {
    borderColor: 'border-red-500',
    textColor: 'text-red-600',
    bgColor: 'bg-red-50',
    icon: 'shield',
  },
  Validation: {
    borderColor: 'border-amber-500',
    textColor: 'text-amber-600',
    bgColor: 'bg-amber-50',
    icon: 'alert-triangle',
  },
  Context: {
    borderColor: 'border-blue-500',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    icon: 'user-cog',
  },
  LLM: {
    borderColor: 'border-purple-600',
    textColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
    icon: 'bot',
  },
  Output: {
    borderColor: 'border-emerald-500',
    textColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    icon: 'check-circle',
  },
  Trigger: {
    borderColor: 'border-blue-500',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    icon: 'play-circle',
  },
  End: {
    borderColor: 'border-gray-500',
    textColor: 'text-gray-700',
    bgColor: 'bg-gray-50',
    icon: 'check-circle',
  },
  Data: {
    borderColor: 'border-cyan-500',
    textColor: 'text-cyan-700',
    bgColor: 'bg-cyan-50',
    icon: 'database',
  },
  Agent: {
    borderColor: 'border-gray-300',
    textColor: 'text-gray-600',
    bgColor: 'bg-gray-50',
    icon: 'message-square',
  },
  Custom: {
    borderColor: 'border-gray-300',
    textColor: 'text-gray-600',
    bgColor: 'bg-gray-50',
    icon: 'message-square',
  },
  Clock: {
    borderColor: 'border-orange-500',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-50',
    icon: 'clock',
  },
  Workflow: {
    borderColor: 'border-indigo-500',
    textColor: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    icon: 'workflow',
  },
};

export const getComponentCategory = (group?: string): ComponentCategory => {
  if (group && group in componentCategories) {
    return group as ComponentCategory;
  }

  return 'Agent';
};

const isAgentIcon = (icon?: string): icon is AgentIcon =>
  Boolean(icon) &&
  [
    'shield',
    'alert-triangle',
    'user-cog',
    'bot',
    'check-circle',
    'play-circle',
    'message-square',
    'x-circle',
    'database',
    'workflow',
  ].includes(icon as AgentIcon);

export const inferAgentGroup = (name: string): ComponentCategory => {
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
  name: string,
  group: string,
  triggerType?: string,
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
    const group = inferAgentGroup(agent);
    const category = componentCategories[group];
    const propertyDefinition = getAgentPropertyDefinition(agent, group);

    return {
      name: agent,
      description: `${toDisplayName(agent)} agent`,
      group,
      icon: category.icon,
      ...propertyDefinition,
    };
  }

  const name = agent.name || 'Untitled Agent';
  const group = agent.group || agent.category || inferAgentGroup(name);
  const category = componentCategories[getComponentCategory(group)];
  const propertyDefinition = getAgentPropertyDefinition(name, group, agent.triggerType);

  return {
    name,
    label: agent.label || toDisplayName(name),
    description: agent.description || `${toDisplayName(name)} agent`,
    group,
    icon: isAgentIcon(agent.icon) ? agent.icon : category.icon,
    color: agent.color,
    badge: agent.badge,
    subLabel: agent.subLabel || agent.sub_label,
    triggerType: agent.triggerType,
    outcome: agent.outcome,
    propertySchema: agent.propertySchema || propertyDefinition.propertySchema,
    defaultProperties: agent.defaultProperties || propertyDefinition.defaultProperties,
  };
};
