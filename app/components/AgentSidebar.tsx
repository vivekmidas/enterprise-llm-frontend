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
  Fence,
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
import { AgentDefinition, CATEGORIES, getCategory, normalizeAgent } from './component-categoriees';

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
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
  fence: Fence,
  'alert-circle': AlertCircle,
  bot: Bot,
  brain: Brain,
  'brain-circuit': BrainCircuit,
  cloud: Cloud,
  key: KeyRound,
  mail: Mail,
  megaphone: Megaphone,
  network: Network,
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

interface CategoryItem {
  group: number;
  label: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  description?: string;
  id:number;
}

interface AgentSidebarProps {
  onSelectAgent?: (id: string) => void;
  onAllAgentsLoaded?: (agentNames: string[]) => void;
}

export default function AgentSidebar({ onSelectAgent, onAllAgentsLoaded }: AgentSidebarProps) {
  const [agents, setAgents] = useState<AgentDefinition[]>([]);
  const [savedAgents, setSavedAgents] = useState<any[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [activeGroup, setActiveGroup] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getAgents(),
      api.getSavedAgents().catch(() => ({ workflows: [] })),
      api.getWorkflowCategories().catch(() => ({ categories: [] })),
    ] as const) // Use 'as const' for tuple type inference
      .then(([agentData, agentListData, categoryData]) => {
        const fetchedAgents = Array.isArray(agentData) ? agentData : agentData.agents || [];
        setAgents(fetchedAgents);
        const agentsArray = Array.isArray(agentListData)
          ? agentListData
          : agentListData.workflows || [];
        setSavedAgents(agentsArray);

        const fetchedCats = Array.isArray(categoryData)
          ? categoryData
          : categoryData.categories || [];
        const mappedCategories: CategoryItem[] = fetchedCats.map((cat: any) => {
          const id = typeof cat === 'object' ? Number(cat.id || 1) : 1;
          const label = typeof cat === 'object' ? (cat.label || cat.name || 'default') : String(cat);

          return {
            group: id,
            label,
            icon: iconMap[cat.icon?.toLowerCase()] || Settings,
            color: `text-black`,
            id
          };
        });
        setCategories(mappedCategories);

        if (mappedCategories.length > 0 && !mappedCategories.some((c) => c.id === activeGroup)) {
          setActiveGroup(mappedCategories[0].id);
        }
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

  /**
   * Handles category selection and refreshes the node registry to ensure 
   * the latest component definitions are retrieved from the backend.
   */
  const handleCategoryClick = async (category_id: number) => {
    setActiveGroup(category_id);
    try {
      const agentData = await api.getNodesForCategories(category_id);
      const fetchedAgents = Array.isArray(agentData) ? agentData : agentData.nodes || [];
      setAgents(fetchedAgents);
    } catch (error) {
      console.error('Failed to refresh latest nodes from registry:', error);
    }
  };

  const allComponents = agents;
  const visibleComponents = allComponents
    .filter(
      (agent) =>
        Number(agent.category) === activeGroup || activeGroup === 1,
    )
    .filter((agent) => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;

      return `${agent.name} ${agent.description} ${agent.name}`.toLowerCase().includes(query);
    });

  const onDragStart = (event: DragEvent<HTMLDivElement>, agent: AgentDefinition) => {
    event.dataTransfer.setData('application/reactflow-agent', JSON.stringify(agent));
    event.dataTransfer.setData('application/reactflow', agent.name);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-[320px] shrink-0 overflow-auto border-r border-sky-200 bg-white px-5 py-6">
      <button className="mb-7 flex w-full items-center gap-2 rounded-lg bg-blue-50 px-5 py-1 text-left text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100">
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

      <h2 className="mb-5 text-sm font-semibold text-slate-800 uppercase tracking-wider">
        Components
      </h2>

      <div className="mb-6 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-1 text-gray-400 shadow-sm">
        <Search className="h-5 w-5 shrink-0" />
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search components..."
          className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
      </div>

      <div className="flex gap-2">
        <div className="flex w-8 shrink-0 flex-col items-center gap-2">
          {categories.map((category) => {
            const isActive = activeGroup === category.id;
            const Icon = category.icon;
            

            return (
              <button
                key={category.group}
                type="button"
                title={category.label}
                aria-label={category.label}
                onClick={() => handleCategoryClick(category.id)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border bg-white transition-all hover:border-blue-300 hover:bg-blue-50 ${
                  isActive
                    ? 'border-blue-400 bg-blue-50 shadow-sm ring-1 ring-blue-300'
                    : 'border-gray-200'
                }`}
              >
                <Icon className={`h-5 w-10 text-black color-black`} />
              </button>
            );
          })}
        </div>

        <div className="min-w-0 flex-1 border-l border-stone-200 pl-4">
        <h3 className="mb-5 text-lg font-semibold text-slate-800">
          {activeGroup === 1 ? 'All Components' : categories.find(c => c.id === activeGroup)?.label || activeGroup}
        </h3>

          {loading ? (
            <p className="text-gray-500">Loading components...</p>
          ) : visibleComponents.length === 0 ? (
            <p className="text-sm text-gray-500">No components found.</p>
          ) : (
            <div className="space-y-1">
              {visibleComponents.map((agent) => {
                const category = getCategory(agent.category);
                const Icon =
                  componentIconMap[agent.icon] ||
                  iconMap[agent.icon] ||
                  iconMap[category.icon] ||
                  Bot;

                return (
                  <div
                      key={`${agent.category}-${agent.name}`}
                    draggable
                    onDragStart={(event) => onDragStart(event, agent)}
                    className="cursor-grab rounded-lg border border-gray-200 bg-white p-2 shadow-sm transition-all hover:border-blue-300 hover:shadow-md active:cursor-grabbing"
                    title={agent.label}
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
                        {/* <div className="text-sm mt-1 leading-snug text-gray-500">
                          {agent.description}
                        </div> */}
                        {agent.version && (
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
