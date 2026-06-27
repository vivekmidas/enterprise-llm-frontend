'use client';

import { useEffect, useState } from 'react';
import type { DragEvent, ComponentType, CSSProperties } from 'react';
import { Plus, FileText, Loader2 } from 'lucide-react';

import { api } from '@/lib/api';
import {
  CATEGORIES,
  getCategory,
  normalizeAgent,
  AgentSidebarProps,
  CategoryItem,
} from './component-categoriees';

import { IconMap } from '@/lib/icons';
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

        const activeAgents = fetchedAgents.filter((n: any) => n.is_enabled !== false);

        // Separate global components from category-specific ones
        setTriggers(activeAgents.filter(isTrigger));
        setLogic(activeAgents.filter(isLogic));
        setCategoryNodes(
          activeAgents.filter(
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
            icon: IconMap[cat.icon?.toLowerCase()] || IconMap.settings,
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

      const activeNodes = fetchedNodes.filter((n: any) => n.is_enabled !== false);

      // Filter out triggers/logic so they don't appear in the Actions section twice
      setCategoryNodes(activeNodes.filter((n: any) => !isTrigger(n) && !isLogic(n)));
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

  const renderCompactNodeItem = (node: any) => {
    const category = getCategory(node.id);
    const Icon =
      IconMap[node.icon?.toLowerCase()] || IconMap[category.icon?.toLowerCase()] || IconMap.bot;
    const themeColor = node.category_color || category.color || '#3b82f6';

    return (
      <div
        key={node.id || node.name}
        draggable
        onDragStart={(event) => onDragStart(event, node)}
        onDragEnd={onDragEnd}
        className="cursor-grab rounded-lg border border-slate-150 bg-white p-2 shadow-sm transition-all hover:border-slate-305 hover:shadow-md hover:scale-[1.01] active:cursor-grabbing active:scale-[0.98] flex items-center gap-1.5 text-[10px] font-semibold text-slate-650 min-w-0"
        title={node.label || node.name}
        style={{ borderLeft: `2.5px solid ${themeColor}` }}
      >
        <Icon className="h-3.5 w-3.5 text-slate-500 shrink-0" />
        <span className="truncate shrink text-[12px]">{node.label || node.name}</span>
      </div>
    );
  };

  const renderNodeItem = (node: any) => {
    const category = getCategory(node.id);
    const Icon =
      IconMap[node.icon?.toLowerCase()] || IconMap[category.icon?.toLowerCase()] || IconMap.bot;
    const themeColor = node.category_color || category.color || '#3b82f6';

    return (
      <div
        key={node.id || node.name}
        draggable
        onDragStart={(event) => onDragStart(event, node)}
        onDragEnd={onDragEnd}
        className="cursor-grab rounded-lg border border-slate-150 bg-white p-2.5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md hover:translate-y-[-1px] active:cursor-grabbing active:scale-[0.98]"
        title={node.label || node.name}
        style={{ borderLeft: `3px solid ${themeColor}` }}
      >
        <div className="flex items-start gap-2.5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white shadow-sm"
            style={{ backgroundColor: themeColor }}
          >
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold leading-tight text-slate-700 truncate">
              {node.label || node.name}
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="inline-block px-1 py-0.5 rounded text-[8px] font-bold text-slate-500 bg-slate-100 border border-slate-150 uppercase tracking-wide">
                {node.node_type || 'node'}
              </span>
              {node.version && (
                <span className="text-[8px] text-slate-400 font-mono">v{node.version}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-[300px] shrink-0 flex flex-col h-full border-r border-slate-100 bg-white overflow-hidden">
      {/* Main scrolling content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">
        {/* Saved Workflows Section */}
        {savedAgents.length > 0 && (
          <div>
            <h4 className="mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Saved Workflows
            </h4>
            <div className="space-y-2 bg-slate-50/50 p-1.5 rounded-xl border border-slate-100 max-h-40 overflow-y-auto custom-scrollbar">
              {savedAgents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => onSelectAgent?.(agent.id)}
                  className="flex w-full font-bold items-center justify-between text-left p-0.5 rounded-lg transition-all hover:bg-white hover:text-indigo-600 hover:shadow-sm border border-transparent hover:border-slate-100 cursor-pointer group"
                >
                  <div className="flex items-center gap-1 min-w-0">
                    <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0 group-hover:text-indigo-500 transition-colors" />
                    <span className="text-xs font-medium text-slate-650 truncate">{agent.name || agent.id}</span>
                  </div>
                  <span className="text-[8px] bg-slate-200/75 text-slate-500 px-1 py-0.5 rounded uppercase font-bold shrink-0">
                    {agent.category || 'default'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Triggers & Flow Logic Group */}
        <div>
          <h4 className="mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Core Nodes
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {triggerNodes.map(renderCompactNodeItem)}
            {logicNodes.map(renderCompactNodeItem)}
          </div>
        </div>

        {/* Actions Library */}
        <div className="border-t border-slate-100 pt-4">
          <h4 className="mb-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Action Registry
          </h4>

          {/* Search bar */}
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-slate-450 focus-within:border-indigo-400 focus-within:bg-white focus-within:shadow-sm transition-all">
            <IconMap.search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search actions..."
              className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <div className="flex gap-3">
            {/* Category selection selector */}
            <div className="flex w-7 shrink-0 flex-col items-center gap-2">
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
                    className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all hover:scale-[1.05] cursor-pointer ${
                      isActive
                        ? 'border-indigo-400 bg-indigo-50 shadow-sm ring-1 ring-indigo-300'
                        : 'border-slate-200 bg-white hover:border-slate-350 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" style={{ color: category.color }} />
                  </button>
                );
              })}
            </div>

            {/* Selected category node items */}
            <div className="min-w-0 flex-1 border-l border-slate-100 pl-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-700 truncate">
                  {selectedCategory?.label || ''}
                </span>
              </div>

              {loading ? (
                <div className="flex items-center gap-2 text-slate-450 text-[10px]">
                  <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />
                  <span>Loading nodes...</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {actionNodes.length > 0 ? (
                    actionNodes.map(renderNodeItem)
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">
                      No matching actions found.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
