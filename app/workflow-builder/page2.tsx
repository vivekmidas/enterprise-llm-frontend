'use client';

import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionLineType,
  Handle,
  Position,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';

import 'reactflow/dist/style.css';

import {
  ArrowBigUp,
  Globe,
  Settings,
  Play,
  Save,
  Trash2,
  MessageCircle,
  Phone,
  Mail,
  MessageSquare,
  Twitter,
  Bot,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Loader,
  AlertCircle,
  Zap,
  Plus,
  X,
  PhoneCall,
  Brain,
  Rainbow,
  Icon,
  Database,
  Network,
  EyeIcon,
  Send,
  User,
  ChevronsUpDown,
  ArrowLeft,
} from 'lucide-react';
import { Search } from 'lucide-react';

// Custom Node Components
const StartNode = memo(({ data, selected }) => {
  return (
    <div
      className={`px-4 py-3 shadow-md rounded-full bg-white border-2 ${selected ? 'border-blue-500' : 'border-gray-400'}`}
    >
      <div className="flex items-center">
        <div className="flex items-center justify-center w-8 h-8 bg-gray-700 rounded-full mr-3">
          <Play className="w-4 h-4 text-white" />
        </div>
        <div className="text-sm font-medium text-gray-900">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-gray-700" />
    </div>
  );
});

// Node Types

const initialNodes = [
  {
    id: 'start-node',
    type: 'start',
    position: { x: 10, y: 10 },
    data: { label: 'Start' },
    deletable: false,
    draggable: true,
  },
];

// Main Workflow Designer Component
const WorkflowCanvas = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [executionResults, setExecutionResults] = useState(null);
  const [showEmptyStatePanel, setShowEmptyStatePanel] = useState(false);
  const reactFlowInstance = useReactFlow();

  const [workflows, setWorkflows] = useState([]);
  const [currentWorkflow, setCurrentWorkflow] = useState(null);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');

  const [openWorkflowSelector, setOpenWorkflowSelector] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [componentSearchTerm, setComponentSearchTerm] = useState('');
  const [isResizing, setIsResizing] = useState(false);

  const sidebarRef = React.useRef<HTMLDivElement>(null);

  // Group components by their 'type' property for the new panel structure

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/admin/workflows', { method: 'GET' }); // This path is correct
      if (!response.ok) throw new Error('Failed to fetch workflows');
      const responseData = await response.json();
      setWorkflows(responseData.data || []);
    } catch (error) {
      console.error(error);
      alert('Could not load workflows.');
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  useEffect(() => {
    if (!selectedType && componentTypes.length > 0) {
      setSelectedType(componentTypes[0]);
    }
  }, [componentTypes, selectedType]);

  const searchedComponents = useMemo(() => {
    if (!componentSearchTerm) {
      return [];
    }
    const lowercasedTerm = componentSearchTerm.toLowerCase();
    const allComponents = Object.values(componentsByType).flatMap((typeInfo) =>
      typeInfo.options.map((component) => ({
        ...component,
        color: typeInfo.color,
      })),
    );
    return allComponents.filter(
      (component) =>
        component.label.toLowerCase().includes(lowercasedTerm) ||
        (component.description && component.description.toLowerCase().includes(lowercasedTerm)),
    );
  }, [componentSearchTerm, componentsByType]);

  const nodeTypes = useMemo(
    () => ({
      start: StartNode,
      trigger: TriggerNode,
      aiAgent: AIAgentNode,
      communication: CommunicationNode,
      condition: ConditionNode,
      outcome: OutcomeNode,
      system: SystemNode,
      prompt: PromptNode,
      auth: AuthenticateNode,
      thirdparty: ExternalSystemNode,
      database: DatabaseNode,
    }),
    [],
  );

  const selectedNode = useMemo(() => nodes.find((node) => node.selected), [nodes]);

  // Available components

  const allComponents = useMemo(
    () =>
      Object.values(componentCategories).flatMap((category) =>
        category.options.map((option) => ({ ...option, color: category.color })),
      ),
    [componentCategories],
  );

  const loadWorkflow = useCallback(
    (workflow) => {
      setCurrentWorkflow(workflow);
      setWorkflowName(workflow.name);

      // Re-hydrate nodes with their icon components and preserve all option values
      const hydratedNodes = (workflow.nodes || []).map((node) => {
        if (node.type === 'start') return node; // Start node doesn't need re-hydration

        const componentInfo = allComponents.find((c) => c.label === node.data.label);
        // Preserve all node data including option values (serviceType, apiEndpoint, enableRetry, etc.)
        return {
          ...node,
          data: {
            ...node.data, // Preserves all existing data including option values from DB
            icon: componentInfo?.icon, // Add icon for display
          },
        };
      });

      // Log loaded option values for debugging
      hydratedNodes.forEach((node: any) => {
        const nodeData = node.data as any;
        if (nodeData?.serviceType || nodeData?.apiEndpoint || nodeData?.enableRetry !== undefined) {
          console.log(`Loaded node ${node.id} options:`, {
            serviceType: nodeData.serviceType,
            apiEndpoint: nodeData.apiEndpoint,
            enableRetry: nodeData.enableRetry,
          });
        }
      });

      setNodes(hydratedNodes.length > 0 ? hydratedNodes : initialNodes);
      setEdges(workflow.edges || []);
      setShowEmptyStatePanel(false);
    },
    [allComponents, setNodes, setEdges],
  );

  const handleTypeSelect = (type) => {
    setSelectedType(type);
  };

  const [expandedCategories, setExpandedCategories] = useState(
    Object.keys(componentCategories).reduce((acc, cat) => ({ ...acc, [cat]: true }), {}),
  );

  // React Flow callbacks
  const onConnect = useCallback(
    (params) => {
      const edge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 },
        markerEnd: {
          type: 'arrowclosed',
          color: '#6366f1',
        },
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges],
  );

  // onNodesChange handles pane clicks to deselect nodes, so this is for any other custom logic.
  const onPaneClick = useCallback(() => {}, []);

  // Drag and Drop handlers
  const onDragStart = (event, nodeData) => {
    // Transfer both type and label as a JSON string for unique identification
    event.dataTransfer.setData(
      'application/reactflow',
      JSON.stringify({ label: nodeData.label, type: nodeData.type }),
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  const createNode = useCallback(
    (nodeData, position) => {
      const newNode = {
        id: `${nodeData.type}-${Date.now()}`,
        type: nodeData.type, // Use the type from nodeData
        position,
        data: { ...nodeData },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes],
  );

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const transferDataString = event.dataTransfer.getData('application/reactflow');
      if (!transferDataString) return;

      let transferData;
      try {
        transferData = JSON.parse(transferDataString);
      } catch (e) {
        console.error('Failed to parse dropped data:', e);
        return;
      }

      // Find the full node data from the label
      const allNodeData = Object.values(componentCategories).flatMap((category) =>
        category.options.map((option) => ({ ...option, color: category.color })),
      );
      // Find the node data by matching both label and type
      const nodeData = allNodeData.find(
        (c) => c.label === transferData.label && c.type === transferData.type,
      );

      if (!nodeData) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      createNode(nodeData, position);
    },
    [reactFlowInstance, createNode],
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Node operations
  const deleteNode = useCallback(() => {
    if (selectedNode && selectedNode.id !== 'start-node') {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id),
      );
    }
  }, [selectedNode, setNodes, setEdges]);

  const updateNodeData = useCallback(
    (nodeId, newData) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node,
        ),
      );
    },
    [setNodes],
  );

  const closePropertiesPanel = useCallback(() => {
    setNodes((nds) => nds.map((n) => (n.selected ? { ...n, selected: false } : n)));
  }, [setNodes]);

  // --- WORKFLOW EXECUTION ---

  // Simulates the execution of a single node.
  const executeNode = async (node, input) => {
    console.log(`Executing ${node.data.label} with input:`, input);
    await new Promise((resolve) => setTimeout(resolve, 700)); // Simulate async work

    // Mock different behaviors based on node type
    switch (node.type) {
      case 'trigger':
        return { ok: true, status: 200, data: { message: 'Workflow started by trigger' } };
      case 'aiAgent':
        // Simulate an API call
        if (Math.random() > 0.2) {
          // 80% success
          return {
            ok: true,
            status: 200,
            data: { ...input.data, sentiment: 'positive', intent: 'purchase' },
          };
        } else {
          return { ok: false, status: 500, data: { error: 'AI agent failed' } };
        }
      case 'condition':
        // The condition node itself doesn't change the data, it just directs flow.
        // The traversal logic will handle which path to take.
        return { ...input, ok: true, status: 200 };
      case 'communication':
        return {
          ok: true,
          status: 200,
          data: { ...input.data, messageSent: true, channel: node.data.channel },
        };
      case 'outcome':
        return { ...input, ok: true, status: 200 };
      default:
        return { ...input, ok: true, status: 200 };
    }
  };

  const setNodeExecutionState = (nodeId, executionResult) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, executionResult } } : n)),
    );
  };

  // Workflow operations
  const saveWorkflow = async (isSaveAs = false) => {
    setIsSaving(true);
    let finalWorkflowName = workflowName;
    let workflowId = currentWorkflow?._id;

    try {
      // 1. Prompt for name if it's a new/untitled workflow or "Save As"
      if (
        isSaveAs ||
        (!workflowId && (workflowName === 'Untitled Workflow' || !workflowName.trim()))
      ) {
        const promptMessage = isSaveAs
          ? 'Enter a new name for the workflow:'
          : 'Please enter a name for your workflow:';
        const defaultName = isSaveAs ? `${workflowName} - Copy` : workflowName;
        const newName = prompt(promptMessage, defaultName);
        if (!newName || !newName.trim()) {
          alert('Workflow name cannot be empty. Save cancelled.');
          setIsSaving(false);
          return;
        }
        finalWorkflowName = newName.trim();
      }

      // 2. Validate workflow structure before saving
      const startNode = nodes.find((n) => n.type === 'start');
      const firstEdge = edges.find((e) => e.source === startNode.id);
      const firstNode = firstEdge ? nodes.find((n) => n.id === firstEdge.target) : null;

      if (!firstNode || firstNode.type !== 'trigger') {
        throw new Error('The "Start" node must be connected to a single "Trigger" node.');
      }

      const triggerNodes = nodes.filter((n) => n.type === 'trigger');
      if (triggerNodes.length > 1) {
        throw new Error('A workflow can only have one "Trigger" node.');
      }

      const triggerType = firstNode.data.subtype;

      const slug =
        isSaveAs || !workflowId
          ? `${triggerType}-${createId().slice(0, 8)}`
          : currentWorkflow?.slug;

      const workflowData = {
        _id: isSaveAs ? undefined : workflowId,
        name: finalWorkflowName,
        description: 'A new workflow created from the designer.', // Placeholder
        nodes: nodes, // The `nodes` state already contains all data, including custom options.
        edges,
        trigger: {
          type: triggerType,
          nodeId: firstNode.id,
        },
        slug: slug,
      };

      console.log('Saving workflow:', workflowData);

      const response = await fetch('/api/admin/workflows', {
        // This path is correct
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save workflow.');
      }

      const responseData = await response.json();
      // Refresh the list and update the current workflow state
      fetchWorkflows();
      setWorkflowName(finalWorkflowName);
      setCurrentWorkflow({
        ...workflowData,
        _id: responseData.data._id,
        name: finalWorkflowName,
        slug: slug,
      });
      alert('Workflow saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert(`Failed to save workflow: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const executeWorkflow = async () => {
    // Reset previous execution states
    setNodes((nds) =>
      nds.map((n) => {
        const { executionResult, ...restData } = n.data;
        return { ...n, data: restData };
      }),
    );
    setIsExecuting(true);
    setExecutionResults(null);

    try {
      const startNode = nodes.find((node) => node.type === 'start');
      const firstEdge = edges.find((edge) => edge.source === startNode.id);
      if (!firstEdge) {
        throw new Error('Start node is not connected to anything.');
      }

      let currentNode = nodes.find((node) => node.id === firstEdge.target);
      let currentInput = { ok: true, status: 200, data: { initial: 'payload' } };
      const executionPath = [];

      while (currentNode) {
        executionPath.push(currentNode.id);
        setNodeExecutionState(currentNode.id, { status: 'running' });

        const output = await executeNode(currentNode, currentInput);
        currentInput = output; // The output of one node is the input for the next

        if (!output.ok) {
          setNodeExecutionState(currentNode.id, { status: 'failed', result: output.data });
          throw new Error(`Workflow failed at node: ${currentNode.data.label}`);
        }

        setNodeExecutionState(currentNode.id, { status: 'success', result: output.data });

        // Find the next node
        let nextEdge;
        if (currentNode.type === 'condition') {
          // Simple mock logic: check if data has 'sentiment' to decide path
          const conditionSuccess = currentInput.data.sentiment === 'positive';
          const sourceHandle = conditionSuccess
            ? currentNode.data.conditions[0]?.id || 'fallback'
            : 'fallback';
          nextEdge = edges.find(
            (edge) => edge.source === currentNode.id && edge.sourceHandle === sourceHandle,
          );
        } else {
          nextEdge = edges.find((edge) => edge.source === currentNode.id);
        }

        if (nextEdge) {
          currentNode = nodes.find((node) => node.id === nextEdge.target);
        } else {
          currentNode = null; // End of path
        }
      }

      setExecutionResults({ success: true, finalData: currentInput.data, path: executionPath });
      alert('Workflow executed successfully!');
    } catch (error) {
      console.error('Execution error:', error);
      alert(error.message || 'Failed to execute workflow.');
      setExecutionResults({ success: false, error: error.message });
    } finally {
      setIsExecuting(false);
    }
  };

  const validateWorkflow = () => {
    const errors = [];

    const triggerNodes = nodes.filter((n) => n.type === 'trigger');
    if (triggerNodes.length === 0) {
      errors.push('Workflow must have at least one trigger node connected to Start.');
    }

    const outcomeNodes = nodes.filter((n) => n.type === 'outcome');
    if (outcomeNodes.length === 0) {
      errors.push('Workflow must have at least one outcome node.');
    }

    if (errors.length > 0) {
      alert('Validation Errors:\n' + errors.join('\n'));
      return false;
    }

    alert('Workflow is valid!');
    return true;
  };

  // const loadSampleWorkflow = () => {
  //   const sampleNodes = [
  //     { id: 'start-node', type: 'start', position: { x: 50, y: 150 }, data: { label: 'Start' }, deletable: false, draggable: false },
  //     { id: 'trigger-1', type: 'trigger', position: { x: 250, y: 150 }, data: { label: 'Customer Chat Started', description: 'New customer initiates chat' }, icon: CircleHelp },
  //     { id: 'ai-1', type: 'aiAgent', position: { x: 500, y: 50 }, data: { label: 'Sentiment Analysis', agentId: 'sentiment-analyzer', description: 'Analyze customer sentiment' } },
  //     { id: 'condition-1', type: 'condition', position: { x: 750, y: 150 }, data: { label: 'Check Sentiment', conditions: [{ id: 'cond-positive', label: 'Positive', value: 'sentiment === "positive"' }] } },
  //     { id: 'comm-positive', type: 'communication', position: { x: 1000, y: 50 }, data: { label: 'Send Positive Reply', channel: 'whatsapp', template: 'Glad to hear you are happy!' } },
  //     { id: 'comm-fallback', type: 'communication', position: { x: 1000, y: 250 }, data: { label: 'Send Neutral Reply', channel: 'email', template: 'How can we assist you further?' } },
  //     { id: 'outcome-1', type: 'outcome', position: { x: 1250, y: 150 }, data: { label: 'End Interaction', outcome: 'success' } }
  //   ];

  //   const sampleEdges = [
  //     { id: 'e-start-trigger', source: 'start-node', target: 'trigger-1', type: 'smoothstep', animated: true },
  //     { id: 'e-trigger-ai', source: 'trigger-1', target: 'ai-1', type: 'smoothstep', animated: true },
  //     { id: 'e-ai-cond', source: 'ai-1', target: 'condition-1', type: 'smoothstep', animated: true },
  //     { id: 'e-cond-pos', source: 'condition-1', sourceHandle: 'cond-positive', target: 'comm-positive', type: 'smoothstep', animated: true },
  //     { id: 'e-cond-fall', source: 'condition-1', sourceHandle: 'fallback', target: 'comm-fallback', type: 'smoothstep', animated: true },
  //     { id: 'e-pos-outcome', source: 'comm-positive', target: 'outcome-1', type: 'smoothstep', animated: true },
  //     { id: 'e-fall-outcome', source: 'comm-fallback', target: 'outcome-1', type: 'smoothstep', animated: true },
  //   ];

  //   setNodes(sampleNodes);
  //   setEdges(sampleEdges);
  // };

  const createNewWorkflow = () => {
    setCurrentWorkflow(null);
    setWorkflowName('Untitled Workflow');
    setNodes(initialNodes);
    setEdges([]);
    setShowEmptyStatePanel(true);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${showSidebar ? 'w-80' : 'w-12'} bg-white border-r border-gray-300 transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className={`font-bold text-lg ${showSidebar ? 'block' : 'hidden'}`}>
              Workflow Components
            </h2>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              {showSidebar ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {showSidebar && (
          <div ref={sidebarRef} className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
            <div>
              <h3 className="font-medium text-gray-700 mb-2 px-2">Workflows</h3>
              <div className="space-y-1">
                <button
                  onClick={createNewWorkflow}
                  className="w-full flex items-center p-2 text-sm text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                >
                  <Plus size={16} className="mr-2" />
                  New Workflow
                </button>

                {/* Display latest 5 workflows */}
                {workflows &&
                  workflows.length > 0 &&
                  workflows.slice(0, 5).map((wf) => (
                    <button
                      key={wf._id}
                      onClick={() => loadWorkflow(wf)}
                      className={`w-full text-left p-2 text-sm rounded-md hover:bg-gray-100 ${currentWorkflow?._id === wf._id ? 'bg-gray-200 font-semibold' : ''}`}
                    >
                      {wf.name}
                    </button>
                  ))}

                {/* Dropdown for other workflows */}
                {workflows.length > 5 && (
                  <Popover open={openWorkflowSelector} onOpenChange={setOpenWorkflowSelector}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openWorkflowSelector}
                        className="w-full justify-between text-muted-foreground"
                      >
                        View all workflows...
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search workflow..." />
                        <CommandList>
                          <CommandEmpty>No workflow found.</CommandEmpty>
                          <CommandGroup>
                            {workflows.map((wf) => (
                              <CommandItem
                                key={wf._id}
                                value={wf.name}
                                onSelect={() => {
                                  loadWorkflow(wf);
                                  setOpenWorkflowSelector(false);
                                }}
                              >
                                {wf.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}

                {/* Fallback for when there are no workflows */}
                {workflows.length === 0 && (
                  <p className="p-2 text-sm text-gray-500">No saved workflows.</p>
                )}

                {/* Old list rendering - replaced by the logic above */}
                {/* {workflows.map((wf) => (
                  <button
                    key={wf._id}
                    onClick={() => loadWorkflow(wf)}
                    className={`w-full text-left p-2 text-sm rounded-md hover:bg-gray-100 ${currentWorkflow?._id === wf._id ? "bg-gray-200 font-semibold" : ""}`}
                  >
                    {wf.name}
                    {wf.isActive && ( // This is not used in the new implementation, can be added back if needed
                      <span className="ml-2 text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </button>
                ))} */}
              </div>
            </div>

            {/* Components Section with Side-by-Side Panels */}
            <div className="flex-1 flex flex-col overflow-hidden border-t pt-4">
              <div className="px-1 mb-3">
                <h3 className="font-semibold text-gray-800 px-1">Components</h3>
                <div className="relative mt-2">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search components..."
                    value={componentSearchTerm}
                    onChange={(e) => setComponentSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>
              <div className="flex-1 flex flex-row overflow-hidden relative">
                {componentSearchTerm ? (
                  // Search Results View
                  <div className="w-full overflow-y-auto space-y-2 pr-1">
                    {searchedComponents.length > 0 ? (
                      searchedComponents.map((component, index) => {
                        const Icon = component.icon;
                        return (
                          <div
                            key={`${component.subtype}-${index}`}
                            draggable
                            onDragStart={(event) => onDragStart(event, { ...component })}
                            className="flex items-start p-2.5 bg-white rounded-lg border border-gray-200 cursor-move hover:bg-gray-50/80 transition-colors"
                          >
                            <div
                              className="p-1.5 rounded-md text-white mr-2.5 mt-0.5"
                              style={{ backgroundColor: component.color }}
                            >
                              <Icon className="w-4 h-4 flex-shrink-0" />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-sm leading-tight text-gray-800">
                                {component.label}
                              </div>
                              {component.description && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {component.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center text-sm text-gray-500 py-4">
                        No components found.
                      </div>
                    )}
                  </div>
                ) : (
                  // Default Two-Panel View
                  <>
                    {/* Panel 1: Component Types */}
                    <div className="w-16 flex-shrink-0 overflow-y-auto space-y-2 border-r pr-2">
                      {componentTypes.map((type) => {
                        const typeInfo = componentsByType[type];
                        const TypeIcon = typeInfo.icon || Zap; // Fallback icon
                        return (
                          <TooltipProvider key={type} delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleTypeSelect(type)}
                                  className={cn(
                                    'w-12 h-12 flex items-center justify-center rounded-lg border cursor-pointer transition-colors',
                                    selectedType === type
                                      ? 'bg-blue-50 border-blue-400 shadow-sm'
                                      : 'bg-white hover:bg-gray-50 border-gray-200',
                                  )}
                                >
                                  <TypeIcon
                                    className="w-5 h-5 flex-shrink-0"
                                    style={{ color: typeInfo.color }}
                                  />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p className="capitalize">
                                  {type.replace(/([A-Z])/g, ' $1').trim()}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>

                    {/* Panel 2: Components of Selected Type - Appears on click */}
                    {selectedType ? (
                      <div className="flex-1 overflow-y-auto space-y-2 pl-4">
                        <h4 className="font-semibold text-gray-800 px-1 capitalize mb-2">
                          {selectedType.replace(/([A-Z])/g, ' $1').trim()}
                        </h4>
                        {componentsByType[selectedType].options.map((component, index) => {
                          const Icon = component.icon;
                          const color = componentsByType[selectedType].color;
                          return (
                            <div
                              key={`${component.subtype}-${index}`}
                              draggable
                              onDragStart={(event) =>
                                onDragStart(event, { ...component, color: color })
                              }
                              className="flex items-start p-2.5 bg-white rounded-lg border border-gray-200 cursor-move hover:bg-gray-50/80 transition-colors"
                            >
                              <div
                                className="p-1.5 rounded-md text-white mr-2.5 mt-0.5"
                                style={{ backgroundColor: color }}
                              >
                                <Icon className="w-4 h-4 flex-shrink-0" />
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-sm leading-tight text-gray-800">
                                  {component.label}
                                </div>
                                {component.description && (
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {component.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
                        <p className="text-center">Select a category to see components.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-300 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard" passHref>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="">Back</span>
                </Button>
              </Link>
              <div>
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="text-xl font-bold text-gray-800 bg-transparent border-none focus:ring-0 p-0"
                />
                {currentWorkflow && (
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <span>
                      Slug:{' '}
                      <code className="bg-gray-200 text-gray-700 px-1 rounded">
                        {currentWorkflow.slug}
                      </code>
                    </span>
                    <span>Version: {currentWorkflow.version || 1}</span>
                    <span>Status: {currentWorkflow.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={validateWorkflow}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700"
              >
                <AlertCircle size={16} />
                Validate
              </button>
              <button
                onClick={() => saveWorkflow(true)}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSaving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                Save As...
              </button>
              <button
                onClick={() => saveWorkflow(false)}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                {isSaving ? 'Saving...' : currentWorkflow?._id ? 'Save' : 'Save New'}
              </button>
              <button
                onClick={executeWorkflow}
                disabled={isExecuting}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50"
              >
                {isExecuting ? <Loader size={16} className="animate-spin" /> : <Play size={16} />}
                {isExecuting ? 'Executing...' : 'Execute'}
              </button>
            </div>
          </div>
        </div>

        {/* React Flow Canvas */}
        <div className="flex-1 flex">
          <div className="flex-1">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onPaneClick={onPaneClick}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              connectionLineType={ConnectionLineType.Straight}
              defaultEdgeOptions={{
                type: 'smoothstep',
                animated: true,
              }}
              defaultViewport={{ x: 0, y: 0, zoom: 1 }}
              className="bg-gray-50"
            >
              <Controls />
              <MiniMap />
              <Background variant="dots" gap={20} size={1} />

              {/* Empty State Panel */}
              {nodes.length <= 1 && showEmptyStatePanel && (
                <Panel position="top-center" className="mt-20">
                  <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
                    <Bot size={48} className="mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2 text-gray-900">
                      Build Your AI Workflow
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Drag components from the sidebar or load a sample to get started.
                    </p>

                    <div className="flex justify-center gap-4">
                      <button
                        onClick={() => setShowEmptyStatePanel(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => alert('Sample workflow loading not implemented yet.')}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Load Sample Workflow
                      </button>
                    </div>
                  </div>
                </Panel>
              )}
            </ReactFlow>
          </div>

          {/* Properties Panel */}
          {selectedNode && (
            <div className="w-80 bg-white border-l border-gray-300">
              <NodePropertiesPanel
                node={selectedNode}
                onUpdate={(data) => updateNodeData(selectedNode.id, data)}
                onDelete={deleteNode}
                onClose={closePropertiesPanel}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Node Properties Panel Component
const NodePropertiesPanel = ({ node, onUpdate, onDelete, onClose }) => {
  // Use an effect to sync formData when the selected node changes
  const [formData, setFormData] = useState(node.data);

  useEffect(() => {
    setFormData(node.data);
  }, [node.id, node.data]);

  const handleInputChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onUpdate(newData);
  };

  const handleConditionChange = (index, field, value) => {
    const newConditions = [...(formData.conditions || [])];
    newConditions[index] = { ...newConditions[index], [field]: value };
    handleInputChange('conditions', newConditions);
  };

  const addCondition = () => {
    const newCondition = {
      id: `cond-${Date.now()}`,
      label: 'New Case',
      value: '',
    };
    const newConditions = [...(formData.conditions || []), newCondition];
    handleInputChange('conditions', newConditions);
  };

  const removeCondition = (index) => {
    const newConditions = [...(formData.conditions || [])];
    newConditions.splice(index, 1);
    handleInputChange('conditions', newConditions);
  };

  const renderOptionField = (optionField: any) => {
    const fieldValue =
      formData[optionField.name] || (optionField.optionType === 'boolean' ? false : '');

    switch (optionField.optionType) {
      case 'text':
        return (
          <div key={optionField.name} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {optionField.name.charAt(0).toUpperCase() +
                optionField.name
                  .slice(1)
                  .replace(/([A-Z])/g, ' $1')
                  .trim()}
            </label>
            {optionField.description && (
              <p className="text-xs text-gray-500 mb-1">{optionField.description}</p>
            )}
            <input
              type="text"
              value={fieldValue as string}
              onChange={(e) => handleInputChange(optionField.name, e.target.value)}
              placeholder={`Enter ${optionField.name}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );

      case 'boolean':
        return (
          <div key={optionField.name} className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {optionField.name.charAt(0).toUpperCase() +
                    optionField.name
                      .slice(1)
                      .replace(/([A-Z])/g, ' $1')
                      .trim()}
                </label>
                {optionField.description && (
                  <p className="text-xs text-gray-500">{optionField.description}</p>
                )}
              </div>
              <Switch
                checked={fieldValue as boolean}
                onCheckedChange={(checked) => handleInputChange(optionField.name, checked)}
              />
            </div>
          </div>
        );

      case 'option':
        return (
          <div key={optionField.name} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {optionField.name.charAt(0).toUpperCase() +
                optionField.name
                  .slice(1)
                  .replace(/([A-Z])/g, ' $1')
                  .trim()}
            </label>
            {optionField.description && (
              <p className="text-xs text-gray-500 mb-2">{optionField.description}</p>
            )}
            <RadioGroup
              value={fieldValue as string}
              onValueChange={(value) => handleInputChange(optionField.name, value)}
            >
              <div className="space-y-2">
                {optionField.options?.map((opt: string) => (
                  <div key={opt} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt} id={`${optionField.name}-${opt}`} />
                    <Label
                      htmlFor={`${optionField.name}-${opt}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {opt}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        );
      default:
        return null;
    }
  };

  const renderNodeSpecificFields = () => {
    if (node.type === 'condition') {
      return (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Cases</h4>
          <div className="space-y-3">
            {(formData.conditions || []).map((cond, index) => (
              <div key={cond.id} className="p-3 bg-gray-50 rounded-lg border">
                <div className="flex justify-between items-center mb-2 gap-2">
                  <input
                    type="text"
                    value={cond.label}
                    onChange={(e) => handleConditionChange(index, 'label', e.target.value)}
                    placeholder="Case Label"
                    className="flex-grow px-2 py-1 text-sm font-medium border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeCondition(index)}
                    className="p-1 text-red-500 hover:bg-red-100 rounded flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
                <textarea
                  value={cond.value}
                  onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
                  placeholder="e.g., sentiment > 0.5"
                  spellCheck={false}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  rows={2}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addCondition}
            className="mt-3 flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <Plus size={16} className="mr-1" />
            Add Case
          </button>
          <div className="mt-4 p-3 bg-gray-100 rounded-lg border border-dashed">
            <p className="text-sm font-medium text-gray-800">Fallback</p>
            <p className="text-xs text-gray-600">
              This path is taken if none of the above cases are met.
            </p>
          </div>
        </div>
      );
    }

    const componentDefinition = Object.values(componentCategories)
      .flatMap((category) => category.options)
      .find(
        (comp: any) =>
          comp.type === node.type &&
          (comp.label === formData.label || comp.subtype === formData.subtype),
      ) as any;

    const nodeOptions = (componentDefinition?.options as any[]) || [];

    return (
      <>
        {Object.keys(formData).includes('template') && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Message Template</label>
            <textarea
              value={formData.template || ''}
              onChange={(e) => handleInputChange('template', e.g.target.value)}
              placeholder="Message template with variables like {customerName}..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        )}

        {nodeOptions.length > 0 && (
          <div className="mb-4 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Configuration Options</h4>
            {nodeOptions.map(renderOptionField)}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="p-4 h-full overflow-y-auto bg-white">
      <div className="border-b border-gray-200 pb-4 mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Node Properties</h3>
          <div className="flex items-center gap-1">
            {node.id !== 'start-node' && (
              <button
                type="button"
                onClick={onDelete}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
                aria-label="Delete node"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded"
              aria-label="Close properties panel"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          {node.type.toUpperCase()} • {node.id}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Label</label>
          <input
            type="text"
            value={formData.label || ''}
            onChange={(e) => handleInputChange('label', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {renderNodeSpecificFields()}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe what this node does..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        {formData.executionResult && (
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Execution Result</h4>
            <div
              className={`text-sm ${
                formData.executionResult.status === 'success'
                  ? 'text-green-700'
                  : formData.executionResult.status === 'failed'
                    ? 'text-red-700'
                    : 'text-blue-700'
              }`}
            >
              <div className="font-medium capitalize">
                {formData.executionResult.status === 'success' && '✓ Success'}
                {formData.executionResult.status === 'failed' && '✗ Failed'}
                {formData.executionResult.status === 'running' && (
                  <Loader size={14} className="inline-block animate-spin mr-2" />
                )}
                {formData.executionResult.status}
              </div>
              {formData.executionResult.result && (
                <pre className="text-xs mt-1 bg-gray-100 p-2 rounded overflow-x-auto">
                  {JSON.stringify(formData.executionResult.result, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const WorkflowDesigner = () => {
  return (
    <ReactFlowProvider>
      <WorkflowCanvas />
    </ReactFlowProvider>
  );
};

export default WorkflowDesigner;
