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
  | 'Custom';

export type AgentIcon =
  | 'shield'
  | 'alert-triangle'
  | 'user-cog'
  | 'bot'
  | 'check-circle'
  | 'play-circle'
  | 'message-square'
  | 'x-circle'
  | 'database';

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
  description: string;
  group: string;
  icon: AgentIcon;
  triggerType?: string;
  outcome?: string;
  propertySchema?: AgentPropertyDefinition[];
  defaultProperties?: Record<string, PropertyValue>;
}

type AgentInput = Partial<AgentDefinition> & {
  category?: string;
  icon?: string;
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
};

export const getComponentCategory = (group?: string): ComponentCategory => {
  if (group && group in componentCategories) {
    return group as ComponentCategory;
  }

  return 'Agent';
};

const isAgentIcon = (icon?: string): icon is AgentIcon =>
  Boolean(icon) &&
  ['shield', 'alert-triangle', 'user-cog', 'bot', 'check-circle', 'play-circle', 'message-square', 'x-circle', 'database'].includes(
    icon as AgentIcon,
  );

export const inferAgentGroup = (name: string): ComponentCategory => {
  const normalizedName = name.toLowerCase();

  if (normalizedName.includes('guard')) return 'Guardrails';
  if (normalizedName === 'start') return 'Start';
  if (normalizedName.includes('email') || normalizedName.includes('sms') || normalizedName.includes('schedule') || normalizedName.includes('webhook')) return 'Trigger';
  if (normalizedName.includes('success') || normalizedName.includes('failure') || normalizedName.includes('end')) return 'End';
  if (normalizedName.includes('db') || normalizedName.includes('database') || normalizedName.includes('crm')) return 'Data';
  if (normalizedName.includes('validator') || normalizedName.includes('validation')) return 'Validation';
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
  const normalizedName = name.toLowerCase();
  const normalizedTrigger = triggerType?.toLowerCase();

  if (normalizedName.includes('schedule') || normalizedTrigger === 'schedule') {
    return {
      propertySchema: [
        {
          key: 'timePeriod',
          label: 'Time Period',
          type: 'choice',
          options: ['Every 5 minutes', 'Hourly', 'Daily', 'Weekly', 'Monthly'],
        },
        {
          key: 'actionClass',
          label: 'Action Class',
          type: 'string',
          placeholder: 'com.enterprise.workflow.actions.ScheduleAction',
        },
        {
          key: 'enabled',
          label: 'Enabled',
          type: 'boolean',
        },
      ],
      defaultProperties: {
        timePeriod: 'Hourly',
        actionClass: '',
        enabled: true,
      },
    };
  }

  if (normalizedName.includes('sms') || normalizedTrigger === 'sms') {
    return {
      propertySchema: [
        {
          key: 'incomingNumber',
          label: 'Incoming Number',
          type: 'string',
          placeholder: '+15551234567',
        },
        {
          key: 'provider',
          label: 'Provider',
          type: 'choice',
          options: ['Twilio', 'Vonage', 'Custom Gateway'],
        },
        {
          key: 'acceptedKeywords',
          label: 'Accepted Keywords',
          type: 'choice',
          options: ['START', 'HELP', 'STOP', 'SUPPORT'],
          multiple: true,
        },
        {
          key: 'autoReply',
          label: 'Auto Reply',
          type: 'boolean',
        },
      ],
      defaultProperties: {
        incomingNumber: '',
        provider: 'Twilio',
        acceptedKeywords: ['START'],
        autoReply: true,
      },
    };
  }

  if (normalizedName.includes('email') || normalizedTrigger === 'email') {
    return {
      propertySchema: [
        {
          key: 'inboxAddress',
          label: 'Inbox Address',
          type: 'string',
          placeholder: 'support@example.com',
        },
        {
          key: 'includeAttachments',
          label: 'Include Attachments',
          type: 'boolean',
        },
      ],
      defaultProperties: {
        inboxAddress: '',
        includeAttachments: true,
      },
    };
  }

  if (group === 'LLM') {
    return {
      propertySchema: [
        {
          key: 'model',
          label: 'Model',
          type: 'choice',
          options: ['gpt-4.1', 'gpt-4.1-mini', 'custom'],
        },
        {
          key: 'systemPrompt',
          label: 'System Prompt',
          type: 'string',
          placeholder: 'Instructions for the model',
        },
        {
          key: 'streamResponse',
          label: 'Stream Response',
          type: 'boolean',
        },
      ],
      defaultProperties: {
        model: 'gpt-4.1-mini',
        systemPrompt: '',
        streamResponse: true,
      },
    };
  }

  if (group === 'Data' || normalizedName.includes('db') || normalizedName.includes('database')) {
    if (normalizedName.includes('crm')) {
      return {
        propertySchema: [
          {
            key: 'baseUrl',
            label: 'CRM Base URL',
            type: 'string',
            placeholder: 'https://crm.example.com',
          },
          {
            key: 'apiKey',
            label: 'API Key',
            type: 'password',
            placeholder: 'Paste token',
          },
          {
            key: 'entity',
            label: 'Entity',
            type: 'choice',
            options: ['Contact', 'Account', 'Lead', 'Opportunity', 'Case'],
          },
          {
            key: 'lookupField',
            label: 'Lookup Field',
            type: 'string',
            placeholder: 'email',
          },
          {
            key: 'lookupValue',
            label: 'Lookup Value',
            type: 'string',
            placeholder: '{{input.email}}',
          },
        ],
        defaultProperties: {
          baseUrl: '',
          apiKey: '',
          entity: 'Contact',
          lookupField: 'email',
          lookupValue: '',
        },
      };
    }

    return {
      propertySchema: [
        {
          key: 'ipAddress',
          label: 'IP Address',
          type: 'string',
          placeholder: '10.0.0.12',
        },
        {
          key: 'port',
          label: 'Port',
          type: 'number',
          placeholder: '5432',
        },
        {
          key: 'username',
          label: 'Username',
          type: 'string',
          placeholder: 'readonly_user',
        },
        {
          key: 'password',
          label: 'Password',
          type: 'password',
          placeholder: 'Password',
        },
        {
          key: 'dbName',
          label: 'Database Name',
          type: 'string',
          placeholder: 'customers',
        },
        {
          key: 'sqlCommand',
          label: 'SQL Command',
          type: 'textarea',
          placeholder: 'select * from customers limit 10',
        },
      ],
      defaultProperties: {
        ipAddress: '',
        port: 5432,
        username: '',
        password: '',
        dbName: '',
        sqlCommand: '',
      },
    };
  }

  return {
    propertySchema: [
      {
        key: 'actionClass',
        label: 'Action Class',
        type: 'string',
        placeholder: 'com.enterprise.workflow.actions.CustomAction',
      },
      {
        key: 'enabled',
        label: 'Enabled',
        type: 'boolean',
      },
    ],
    defaultProperties: {
      actionClass: '',
      enabled: true,
    },
  };
};

export const normalizeAgent = (agent: string | AgentInput): AgentDefinition => {
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
    description: agent.description || `${toDisplayName(name)} agent`,
    group,
    icon: isAgentIcon(agent.icon) ? agent.icon : category.icon,
    triggerType: agent.triggerType,
    outcome: agent.outcome,
    propertySchema: agent.propertySchema || propertyDefinition.propertySchema,
    defaultProperties: agent.defaultProperties || propertyDefinition.defaultProperties,
  };
};
