'use client';

import { useEffect, useState } from 'react';
import { DragEvent } from 'react';
import type { ComponentType } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Bot,
  Brain,
  BrainCircuit,
  CheckCircle,
  Clock,
  Cloud,
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
  'check-circle': CheckCircle,
  'play-circle': PlayCircle,
  'message-square': MessageSquare,
  'x-circle': XCircle,
  database: Database,
  workflow: Workflow,
  clock: Clock,
  'alert-circle': AlertCircle,
  bot: Bot,
};

const componentIconMap: Record<string, ComponentType<{ className?: string }>> = {
  WhatsApp: MessageCircle,
  Email: Mail,
  Tweet: Send,
  Clock: Clock,
  Workflow: Workflow,
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
    // { group: 'Agent', label: 'Agent', icon: Workflow, color: 'text-teal-500' },
    { group: 'Condition', label: 'Condition', icon: Workflow, color: 'text-indigo-500' },
    { group: 'Validation', label: 'Validation', icon: BrainCircuit, color: 'text-yellow-500' },
    { group: 'End', label: 'End', icon: CheckCircle, color: 'text-gray-400' },
    { group: 'Data', label: 'Data', icon: Database, color: 'text-blue-400' },
    // { group: 'Agent', label: 'Agent', icon: MessageSquare, color: 'text-gray-500' },
    { group: 'External', label: 'External', icon: Cloud, color: 'text-indigo-500' },
  ];

interface AgentSidebarProps {
  onSelectAgent?: (id: string) => void;
  onAllAgentsLoaded?: (agentNames: string[]) => void;
}

export default function AgentSidebar({ onSelectAgent, onAllAgentsLoaded }: AgentSidebarProps) {
  const [agents, setAgents] = useState<AgentDefinition[]>([]);
  const [savedAgents, setSavedAgents] = useState<any[]>([]);
  const [activeGroup, setActiveGroup] = useState('Trigger');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getAgents(),
      api.getSavedAgents().catch(() => ({ workflows: [] })),
    ] as const) // Use 'as const' for tuple type inference
      .then(([agentData, agentListData]) => {
        const fetchedAgents = Array.isArray(agentData) ? agentData : (agentData.agents || []);
        setAgents(fetchedAgents.map(normalizeAgent));
        const agentsArray = Array.isArray(agentListData)
          ? agentListData
          : agentListData.workflows || [];
        setSavedAgents(agentsArray);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && onAllAgentsLoaded) {
      const allAgentNames = agents.map((agent) => agent.name);
      onAllAgentsLoaded(Array.from(new Set(allAgentNames)));
    }
  }, [loading, agents, onAllAgentsLoaded]);

  const allComponents = agents;
  const visibleComponents = allComponents
    .filter(
      (agent) =>
        agent.group === activeGroup ||
        (activeGroup === 'Agent' && getComponentCategory(agent.group) === 'Agent'),
    )
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
        <span>New Agent</span>
      </button>

      <div className="space-y-3 px-4 text-sm text-gray-900">
        {savedAgents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => onSelectAgent?.(agent.id)}
            className="flex w-full items-center justify-between text-left transition-colors hover:text-blue-600"
          >
            <span>{agent.name || agent.id}</span>
            <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-400 uppercase font-bold">
              {agent.category || 'default'}
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
                className={`flex h-8 w-8 items-center justify-center rounded-lg border bg-white transition-all hover:border-blue-300 hover:bg-blue-50 ${isActive
                  ? 'border-blue-400 bg-blue-50 shadow-sm ring-1 ring-blue-300'
                  : 'border-gray-200'
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
                const Icon =
                  componentIconMap[agent.name] || iconMap[agent.icon] || iconMap[category.icon];

                return (
                  <div
                    key={`${agent.group}-${agent.name}`}
                    draggable
                    onDragStart={(event) => onDragStart(event, agent)}
                    className="cursor-grab rounded-lg border border-gray-200 bg-white p-2 shadow-sm transition-all hover:border-blue-300 hover:shadow-md active:cursor-grabbing"
                    style={agent.color ? { borderLeft: `3px solid ${agent.color}` } : {}}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-white"
                        style={agent.color ? { backgroundColor: agent.color } : {}}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold leading-tight text-slate-800">
                          {agent.label || agent.name}
                        </div>
                        <div className="text-sm mt-1  leading-snug text-gray-500">
                          {agent.description}
                        </div>
                        {agent.badge && (
                          <div className="mt-1 inline-block px-1.5 py-0.5 rounded bg-gray-100 text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                            {agent.badge}
                          </div>
                        )}
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
