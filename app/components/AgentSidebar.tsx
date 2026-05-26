'use client';

import { useEffect, useState } from 'react';
import { DragEvent } from 'react';
import type { ComponentType } from 'react';
import {
    AlertTriangle,
    Bot,
    Brain,
    BrainCircuit,
    CheckCircle,
    Clock,
    Database,
    KeyRound,
    Mail,
    Megaphone,
    MessageCircle,
    MessageSquare,
    Network,
    PhoneCall,
    PlayCircle,
    Plus,
    Search,
    Send,
    Settings,
    Shield,
    UserCog,
    Workflow,
    XCircle,
    Zap,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
    AgentDefinition,
    AgentIcon,
    componentCategories,
    getComponentCategory,
    normalizeAgent,
} from './component-categoriees';

const iconMap: Record<AgentIcon, ComponentType<{ className?: string }>> = {
    shield: Shield,
    'alert-triangle': AlertTriangle,
    'user-cog': UserCog,
    bot: Bot,
    'check-circle': CheckCircle,
    'play-circle': PlayCircle,
    'message-square': MessageSquare,
    'x-circle': XCircle,
    database: Database,
};

const componentIconMap: Record<string, ComponentType<{ className?: string }>> = {
    WhatsApp: MessageCircle,
    Email: Mail,
    Tweet: Send,
    SMS: MessageSquare,
    'SMTP Agent': Mail,
    API: Network,
    Call: PhoneCall,
    Schedule: Clock,
    'Scheduler Agent': Clock,
};

const categoryRail: Array<{
    group: string;
    label: string;
    icon: ComponentType<{ className?: string }>;
    color: string;
}> = [
        { group: 'Trigger', label: 'Trigger', icon: Zap, color: 'text-blue-500' },
        { group: 'LLM', label: 'LLM', icon: Brain, color: 'text-orange-500' },
        { group: 'Guardrails', label: 'Guardrails', icon: KeyRound, color: 'text-red-500' },
        { group: 'Output', label: 'Output', icon: Megaphone, color: 'text-purple-500' },
        { group: 'Context', label: 'Context', icon: Send, color: 'text-green-500' },
        { group: 'Custom', label: 'Custom', icon: Settings, color: 'text-slate-500' },
        { group: 'Agent', label: 'Agent', icon: Workflow, color: 'text-teal-500' },
        { group: 'Validation', label: 'Validation', icon: BrainCircuit, color: 'text-yellow-500' },
        { group: 'End', label: 'End', icon: CheckCircle, color: 'text-gray-400' },
        { group: 'Data', label: 'Data', icon: Database, color: 'text-blue-400' },
    ];

const workflowNodes: AgentDefinition[] = [
    {
        name: 'WhatsApp',
        description: 'Customer initiates WhatsApp chat',
        group: 'Trigger',
        icon: 'message-square',
        triggerType: 'whatsapp',
        propertySchema: [
            { key: 'phoneNumber', label: 'Phone Number', type: 'string', placeholder: '+1...' },
            { key: 'apiKey', label: 'WhatsApp API Key', type: 'password' }
        ],
        defaultProperties: { phoneNumber: '', apiKey: '' }
    },
    {
        name: 'Email',
        description: 'Customer sends an email',
        group: 'Trigger',
        icon: 'message-square',
        triggerType: 'email',
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
    },
    {
        name: 'SMTP Agent',
        description: 'Polls and reads emails from server',
        group: 'Trigger',
        icon: 'message-square',
        triggerType: 'smtp',
        propertySchema: [
            {
                key: 'host',
                label: 'Host',
                type: 'string',
                placeholder: 'smtp.gmail.com',
            },
            {
                key: 'port',
                label: 'Port',
                type: 'number',
                placeholder: '587',
            },
            {
                key: 'secure',
                label: 'Use TLS/SSL',
                type: 'boolean',
            },
            {
                key: 'username',
                label: 'Username',
                type: 'string',
                placeholder: 'service-account@company.com',
            },
            {
                key: 'password',
                label: 'Password',
                type: 'password',
                placeholder: 'App Password or Secret',
            },
            {
                key: 'interval',
                label: 'Polling Interval (mins)',
                type: 'number',
                placeholder: '5',
            },
        ],
        defaultProperties: {
            host: '',
            port: 587,
            secure: true,
            username: '',
            password: '',
            interval: 1,
        },
    },
    {
        name: 'Tweet',
        description: 'Customer mentions on Twitter',
        group: 'Trigger',
        icon: 'message-square',
        triggerType: 'tweet',
        propertySchema: [
            { key: 'hashtag', label: 'Hashtag to Monitor', type: 'string', placeholder: '#support' },
            { key: 'bearerToken', label: 'Twitter Bearer Token', type: 'password' }
        ],
        defaultProperties: { hashtag: '', bearerToken: '' }
    },
    {
        name: 'SMS',
        description: 'Customer sends SMS',
        group: 'Trigger',
        icon: 'message-square',
        triggerType: 'sms',
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
    },
    {
        name: 'API',
        description: 'API Call Received',
        group: 'Trigger',
        icon: 'bot',
        triggerType: 'api',
        propertySchema: [
            { key: 'endpoint', label: 'Webhook Endpoint', type: 'string', placeholder: '/api/v1/webhook' },
            { key: 'authMethod', label: 'Auth Method', type: 'choice', options: ['None', 'API Key', 'Bearer Token'] }
        ],
        defaultProperties: { endpoint: '', authMethod: 'None' }
    },
    {
        name: 'Call',
        description: 'Call Received',
        group: 'Trigger',
        icon: 'message-square',
        triggerType: 'call',
        propertySchema: [
            { key: 'forwardNumber', label: 'Forward To', type: 'string', placeholder: '+1...' },
            { key: 'recordingEnabled', label: 'Enable Recording', type: 'boolean' }
        ],
        defaultProperties: { forwardNumber: '', recordingEnabled: false }
    },
    {
        name: 'Schedule',
        description: 'Timer based trigger',
        group: 'Trigger',
        icon: 'play-circle',
        triggerType: 'schedule',
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
    },
    {
        name: 'generic_llm_agent',
        description: 'Generic LLM call via IP/Port',
        group: 'LLM',
        icon: 'bot',
        propertySchema: [
            {
                key: 'ip',
                label: 'IP Address',
                type: 'string',
                placeholder: '127.0.0.1',
            },
            {
                key: 'port',
                label: 'Port',
                type: 'number',
                placeholder: '8000',
            },
            {
                key: 'model',
                label: 'Model Name',
                type: 'string',
                placeholder: 'llama-3',
            },
            {
                key: 'systemPrompt',
                label: 'System Prompt',
                type: 'textarea',
                placeholder: 'Instructions for the model',
            },
            {
                key: 'temperature',
                label: 'Temperature',
                type: 'number',
                placeholder: '0.7',
            },
        ],
        defaultProperties: {
            ip: '127.0.0.1',
            port: 8000,
            model: 'llama-3',
            systemPrompt: 'You are a helpful assistant.',
            temperature: 0.7,
        },
    },
    {
        name: 'LLM Agent',
        description: 'Large Language Model processing',
        group: 'LLM',
        icon: 'bot',
        propertySchema: [
            {
                key: 'model',
                label: 'Model',
                type: 'choice',
                options: ['gpt-4.1', 'gpt-4.1-mini', 'claude-3-opus', 'custom'],
            },
            {
                key: 'systemPrompt',
                label: 'System Prompt',
                type: 'textarea',
                placeholder: 'Instructions for the model',
            },
            {
                key: 'temperature',
                label: 'Temperature',
                type: 'number',
                placeholder: '0.7',
            },
            {
                key: 'streamResponse',
                label: 'Stream Response',
                type: 'boolean',
            },
        ],
        defaultProperties: {
            model: 'gpt-4.1-mini',
            systemPrompt: 'You are a helpful assistant.',
            temperature: 0.7,
            streamResponse: true,
        },
    },
    {
        name: 'DB Agent',
        description: 'Connects to a database and runs a SQL command',
        group: 'Data',
        icon: 'database',
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
    },
    {
        name: 'Scheduler Agent',
        description: 'Runs a command or triggers an agent recurringly in the background',
        group: 'Custom',
        icon: 'play-circle',
        propertySchema: [
            { key: 'interval', label: 'Interval', type: 'number', placeholder: '60' },
            { key: 'unit', label: 'Unit', type: 'choice', options: ['seconds', 'minutes'] },
            { key: 'command', label: 'Shell Command', type: 'string', placeholder: 'echo "Task running"' },
            { key: 'targetAgent', label: 'Target Agent Name', type: 'string', placeholder: 'profanity_guard' }
        ],
        defaultProperties: {
            interval: 60,
            unit: 'seconds',
            command: '',
            targetAgent: ''
        }
    },
    {
        name: 'CRM Agent',
        description: 'Fetches customer context from CRM',
        group: 'Data',
        icon: 'user-cog',
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
    },
    {
        name: 'Success End',
        description: 'Completes the workflow successfully',
        group: 'End',
        icon: 'check-circle',
        outcome: 'success',
    },
    {
        name: 'Failure End',
        description: 'Completes the workflow with failure',
        group: 'End',
        icon: 'x-circle',
        outcome: 'failure',
    },
];

interface AgentSidebarProps {
    onSelectWorkflow?: (id: string) => void;
    onAllAgentsLoaded?: (agentNames: string[]) => void;
}

export default function AgentSidebar({ onSelectWorkflow, onAllAgentsLoaded }: AgentSidebarProps) {
    const [agents, setAgents] = useState<AgentDefinition[]>([]);
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [activeGroup, setActiveGroup] = useState('Trigger');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([api.getAgents(), api.getWorkflows().catch(() => ({ workflows: [] }))])
            .then(([agentData, workflowData]) => {
                setAgents((agentData.agents || []).map(normalizeAgent));
                const workflowsArray = Array.isArray(workflowData) ? workflowData : (workflowData.workflows || []);
                setWorkflows(workflowsArray);
            })
            .catch(() => undefined)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!loading && onAllAgentsLoaded) {
            const allAgentNames = [...workflowNodes, ...agents].map(agent => agent.name);
            onAllAgentsLoaded(Array.from(new Set(allAgentNames)));
        }
    }, [loading, agents, onAllAgentsLoaded]);

    const allComponents = [...workflowNodes, ...agents];
    const visibleComponents = allComponents
        .filter((agent) => agent.group === activeGroup || (activeGroup === 'Agent' && getComponentCategory(agent.group) === 'Agent'))
        .filter((agent) => {
            const query = searchQuery.trim().toLowerCase();
            if (!query) return true;

            return `${agent.name} ${agent.description} ${agent.group}`.toLowerCase().includes(query);
        });

    const onDragStart = (event: DragEvent<HTMLDivElement>, agent: AgentDefinition) => {
        event.dataTransfer.setData('application/reactflow-agent', JSON.stringify(agent));
        event.dataTransfer.setData('application/reactflow', agent.name);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="w-[320px] shrink-0 overflow-auto border-r border-sky-200 bg-white px-5 py-6">
            <button className="mb-7 flex w-full items-center gap-2 rounded-lg bg-blue-50 px-5 py-1 text-left text-m font-medium text-blue-600 transition-colors hover:bg-blue-100">
                <Plus className="h-6 w-6" />
                <span>New Workflow</span>
            </button>

            <div className="space-y-3 px-4 text-sm text-gray-900">
                {workflows.map((workflow) => (
                    <button
                        key={workflow.id}
                        onClick={() => onSelectWorkflow?.(workflow.id)}
                        className="flex w-full items-center justify-between text-left transition-colors hover:text-blue-600"
                    >
                        <span>{workflow.name || workflow.id}</span>
                        <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-400 uppercase font-bold">
                            {workflow.category || 'default'}
                        </span>
                    </button>
                ))}
            </div>

            <div className="my-2 border-t-2 border-stone-200" />

            <h2 className="mb-5 text-m font-semibold text-slate-800">Components</h2>

            <div className="mb-6 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-1 text-gray-400 shadow-sm">
                <Search className="h-5 w-5 shrink-0" />
                <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search components..."
                    className="w-full bg-transparent text-m text-gray-900 placeholder:text-gray-400 focus:outline-none"
                />
            </div>

            <div className="flex gap-2">
                <div className="flex w-8 shrink-0 flex-col items-center gap-2">
                    {categoryRail.map(({ group, label, icon: Icon, color }) => {
                        const isActive = activeGroup === group;

                        return (
                            <button
                                key={group}
                                type="button"
                                title={label}
                                aria-label={label}
                                onClick={() => setActiveGroup(group)}
                                className={`flex h-8 w-8 items-center justify-center rounded-lg border bg-white transition-all hover:border-blue-300 hover:bg-blue-50 ${isActive ? 'border-blue-400 bg-blue-50 shadow-sm ring-1 ring-blue-300' : 'border-gray-200'
                                    }`}
                            >
                                <Icon className={`h-5 w-5 ${color}`} />
                            </button>
                        );
                    })}
                </div>

                <div className="min-w-0 flex-1 border-l border-stone-200 pl-4">
                    <h3 className="mb-5 text-l font-semibold text-slate-800">{activeGroup}</h3>

                    {loading ? (
                        <p className="text-gray-500">Loading components...</p>
                    ) : visibleComponents.length === 0 ? (
                        <p className="text-sm text-gray-500">No components found.</p>
                    ) : (
                        <div className="space-y-1">
                            {visibleComponents.map((agent) => {
                                const category = componentCategories[getComponentCategory(agent.group)];
                                const Icon = componentIconMap[agent.name] || iconMap[agent.icon] || iconMap[category.icon];

                                return (
                                    <div
                                        key={`${agent.group}-${agent.name}`}
                                        draggable
                                        onDragStart={(event) => onDragStart(event, agent)}
                                        className="cursor-grab rounded-lg border border-gray-200 bg-white p-2 shadow-sm transition-all hover:border-blue-300 hover:shadow-md active:cursor-grabbing"
                                    >
                                        <div className="flex items-start gap-2">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-white">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-semibold leading-tight text-slate-800">{agent.name}</div>
                                                <div className="text-sm mt-1  leading-snug text-gray-500">{agent.description}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
