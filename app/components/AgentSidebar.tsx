'use client';

import { useEffect, useState } from 'react';
import type { DragEvent, ComponentType, CSSProperties } from 'react';
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
import {
  CATEGORIES,
  getCategory,
  normalizeAgent,
  AgentSidebarProps,
  CategoryItem,
} from './component-categoriees';

const iconMap: Record<string, ComponentType<{ className?: string; style?: CSSProperties }>> = {
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

const componentIconMap: Record<
  string,
  ComponentType<{ className?: string; style?: CSSProperties }>
> = {
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

export default function AgentSidebar({
  onSelectAgent,
  onNewAgent,
  onAllAgentsLoaded,
}: AgentSidebarProps) {
  const [categoryNodes, setCategoryNodes] = useState<any[]>([]);
  const [triggers, setTriggers] = useState<any[]>([]);
  const [logic, setLogic] = useState<any[]>([]);
  const [savedAgents, setSavedAgents] = useState<any[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [activeGroup, setActiveGroup] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [selectedCategoryNodes, setSelectedCategoryNodes] = useState<CategoryItem[]>([]);

  const isTrigger = (n: any) => n.node_type?.toUpperCase() === 'TRIGGER';

  const isLogic = (n: any) =>
    n.node_type?.toUpperCase() === 'CONDITION' ||
    n.node_type?.toUpperCase() === 'LOGIC' ||
    n.name?.toLowerCase().includes('condition') ||
    n.category?.toLowerCase().includes('condition');

  useEffect(() => {
    Promise.all([
      api.getNodes(),
      api.getSavedAgents().catch(() => ({ workflows: [] })),
      api.getNodesCategories().catch(() => ({ categories: [] })),
      api.getCategory(activeGroup),
    ] as const) // Use 'as const' for tuple type inference
      .then(([nodesData, agentListData, categoryData, nodesForCategories]) => {
        const fetchedAgents = Array.isArray(nodesData)
          ? nodesData
          : (nodesData as any).nodes || (nodesData as any).agents || [];

        // Separate global components from category-specific ones
        setTriggers(fetchedAgents.filter(isTrigger));
        setLogic(fetchedAgents.filter(isLogic));
        setCategoryNodes(
          fetchedAgents.filter(
            (n: any) => Number(n.category) === activeGroup && !isTrigger(n) && !isLogic(n),
          ),
        );

        const agentsArray = Array.isArray(agentListData)
          ? agentListData
          : (agentListData as any).workflows || [];
        setSavedAgents(agentsArray);

        const fetchedCats = Array.isArray(categoryData)
          ? categoryData
          : categoryData.categories || [];
        const mappedCategories: CategoryItem[] = fetchedCats.map((cat: any, index: number) => {
          const id = typeof cat === 'object' ? Number(cat.id || index + 1) : index + 1;
          const label = typeof cat === 'object' ? cat.label || cat.name || 'default' : String(cat);

          return {
            group: id,
            label,
            icon: iconMap[cat.icon?.toLowerCase()] || Settings,
            color: typeof cat === 'object' ? cat.color || 'black' : 'black',
            id,
          };
        });

        setSelectedCategory(selectedCategory);
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
      // Combine all nodes for the search/lookup registry
      const allAgentNames = [...triggers, ...logic, ...categoryNodes].map((node) => node.name);
      onAllAgentsLoaded(Array.from(new Set(allAgentNames)));
    }
  }, [loading, triggers, logic, categoryNodes, onAllAgentsLoaded]);

  /**
   * Handles category selection and refreshes the node registry to ensure
   * the latest component definitions are retrieved from the backend.
   */
  const handleCategoryClick = async (category_id: number) => {
    setActiveGroup(category_id);
    try {
      const nodesData = await api.getNodesForCategories(category_id);
      const fetchedNodes = Array.isArray(nodesData)
        ? nodesData
        : (nodesData as any).nodes || (nodesData as any).agents || [];

      // Filter out triggers/logic so they don't appear in the Actions section twice
      setCategoryNodes(fetchedNodes.filter((n: any) => !isTrigger(n) && !isLogic(n)));
      const fetchedCategory = await api.getCategory(category_id);
      setSelectedCategory(fetchedCategory.category);
    } catch (error) {
      console.error('Failed to refresh latest nodes from registry:', error);
    }
  };

  const searchFilter = (node: any) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return `${node.label || ''} ${node.name || ''} ${node.description || ''}`
      .toLowerCase()
      .includes(query);
  };

  // Filter nodes into specialized sections
  const triggerNodes = triggers.filter(searchFilter);
  const logicNodes = logic.filter(searchFilter);

  const actionNodes = categoryNodes.filter(
    (n) => Number(n.category) === activeGroup && searchFilter(n),
  );

  const onDragStart = (event: DragEvent<HTMLDivElement>, agent: any) => {
    event.dataTransfer.setData('application/reactflow-agent', JSON.stringify(agent));
    event.dataTransfer.effectAllowed = 'move';
    // Add a visual indicator to the element being dragged
    (event.target as HTMLElement).style.opacity = '0.5';
  };

  const onDragEnd = (event: DragEvent<HTMLDivElement>) => {
    // Reset visual indicator when drag stops
    (event.target as HTMLElement).style.opacity = '1';
  };

  const renderNodeItem = (node: any) => {
    const category = getCategory(node.id);
    const Icon = componentIconMap[node.icon] || iconMap[node.icon] || iconMap[category.icon] || Bot;

    return (
      <div
        key={node.id || node.name}
        draggable
        onDragStart={(event) => onDragStart(event, node)}
        onDragEnd={onDragEnd}
        className="cursor-grab rounded-lg border border-gray-200 bg-white p-2 shadow-sm transition-all hover:border-blue-300 hover:shadow-md active:cursor-grabbing"
        title={node.label || node.name}
        style={node.color ? { borderLeft: `3px solid ${node.color}` } : {}}
      >
        <div className="flex items-start gap-2">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-white"
            style={node.color ? { backgroundColor: node.color } : {}}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold leading-tight text-slate-800 truncate">
              {node.label || node.name}
            </div>
            {node.node_type && (
              <div className="mt-1 flex items-center gap-1">
                <div className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                  {node.node_type}
                </div>
                {node.version && (
                  <span className="text-[9px] text-gray-400 font-mono">v{node.version}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-[320px] shrink-0 overflow-auto border-r border-sky-200 bg-white px-5 py-6">
      <button
        onClick={onNewAgent}
        className="mb-7 flex w-full items-center gap-2 rounded-lg bg-blue-50 px-5 py-1 text-left text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100"
      >
        <Plus className="h-6 w-6" />
        <span>New Agent</span>
      </button>

      <div className="space-y-3 px-4 text-sm text-black">
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

      <h2 className="mb-5 text-sm font-semibold text-black uppercase tracking-wider">Triggers</h2>
      {/* Trigger Section */}
      <div className="flex gap-2">
        <div className="flex w-8 shrink-0 flex-col items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-400 bg-blue-50 shadow-sm ring-1 ring-blue-300">
            <Zap className="h-5 w-5 text-blue-600" />
          </div>
        </div>

        <div className="min-w-0 flex-1 border-l border-stone-200 pl-4">
          {/* <h3 className="mb-5 text-lg font-semibold text-slate-800">
           
          </h3> */}

          <div className="space-y-6">
            {triggerNodes.length > 0 && (
              <div>
                <h4 className="mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Entry Points
                </h4>
                <div className="space-y-2">{triggerNodes.map(renderNodeItem)}</div>
              </div>
            )}

            {/* Logic/Condition Section */}
            {logicNodes.length > 0 && (
              <div>
                <h4 className="mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Flow Logic
                </h4>
                <div className="space-y-2">{logicNodes.map(renderNodeItem)}</div>
              </div>
            )}
          </div>
        </div>
      </div>
      <h2 className="mb-5 text-sm font-semibold text-black uppercase tracking-wider">Nodes</h2>

      <div className="mb-6 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-1 text-gray-400 shadow-sm">
        <Search className="h-5 w-5 shrink-0" />
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search components..."
          className="w-full bg-transparent text-sm text-black placeholder:text-gray-400 focus:outline-none"
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
                  isActive ? 'border-blue-400 bg-blue-50 shadow-sm ring-1 ring-blue-300' : ''
                }`}
              >
                <Icon className="h-5 w-5" style={{ color: category.color }} />
              </button>
            );
          })}
        </div>

        <div className="min-w-0 flex-1 border-l border-stone-200 pl-4">
          <h3 className="mb-5 text-lg font-semibold text-black">{selectedCategory?.label || ''}</h3>

          {loading ? (
            <p className="text-gray-500">Loading components...</p>
          ) : (
            <div className="space-y-6">
              {/* Actions Section (Filtered by Category) */}
              <div>
                <h4 className="mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {selectedCategory?.label || 'Actions'}
                </h4>
                <div className="space-y-2">
                  {actionNodes.length > 0 ? (
                    actionNodes.map(renderNodeItem)
                  ) : (
                    <p className="text-xs text-gray-400 italic">
                      No actions available in this category.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
