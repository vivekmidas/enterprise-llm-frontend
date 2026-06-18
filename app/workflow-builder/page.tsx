'use client';

import { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  useReactFlow,
  BackgroundVariant,
  ReactFlowProvider,
  addEdge,
} from '@xyflow/react';


import '@xyflow/react/dist/style.css';

import { X, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import AgentSidebar from '../components/AgentSidebar';
import WorkflowToolbar from '../components/WorkflowToolbar';
import PropertiesPanel from '../components/PropertiesPanel';
import { CustomNode } from '@components/reactflow/CustomNode';
import FieldMapperModal from '../components/FieldMapperModal';
import { ArrowRightLeft } from 'lucide-react';

import {
  AgentPropertyDefinition,
  PropertyValue,
  AgentDefinition,
  normalizeAgent,
} from '../components/component-categoriees';

const nodeTypes = { custom: CustomNode };

type ExecutionStatus = 'idle' | 'running' | 'success' | 'error';
type NodeProperties = Record<string, PropertyValue>;

/**
 * Data structure for the custom node, extending AgentDefinition
 * with runtime fields expected by CustomNode and the builder logic.
 */
interface WorkflowNodeData extends Partial<AgentDefinition> {
  executionStatus?: ExecutionStatus;
  variant?: string;
  model?: string;
  subIcon?: string;
  [key: string]: any;
}

interface WorkflowTraceStep {
  id: string;
  nodeId: string;
  nodeName: string;
  group: string;
  status: 'success' | 'error';
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Recursively redacts sensitive values (passwords, tokens, keys)
 * from metadata objects before they are displayed in the UI Trace logs.
 */
const maskSecrets = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(maskSecrets);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, fieldValue]) => {
      const normalizedKey = key.toLowerCase();
      if (
        normalizedKey.includes('password') ||
        normalizedKey.includes('apikey') ||
        normalizedKey.includes('token') ||
        normalizedKey.includes('secret') ||
        normalizedKey.includes('key')
      ) {
        return [key, fieldValue ? '••••••••' : ''];
      }

      return [key, maskSecrets(fieldValue)];
    }),
  );
};

/** Extracts the 'properties' object from a ReactFlow node's data */
const toProperties = (node: Node<WorkflowNodeData>): NodeProperties => {
  const properties = node.data?.properties;
  return properties && typeof properties === 'object' && !Array.isArray(properties)
    ? (properties as NodeProperties)
    : {};
};

/**
 * Logic to determine the order of execution.
 * Performs a graph traversal starting from the 'Start' node and
 * checks for disconnected components or invalid graph structures.
 */
const buildExecutionSequence = (nodes: Node<WorkflowNodeData>[], edges: Edge[]) => {
  // Find nodes that are either explicit "Start" nodes or "Trigger" nodes
  const startNodes = nodes.filter((node) => node.data?.node_type?.toUpperCase() === 'TRIGGER');

  if (startNodes.length === 0) {
    return {
      sequence: [] as Node<WorkflowNodeData>[],
      error: 'Agent must have at least one Trigger or Start node.',
    };
  }
  if (startNodes.length > 1) {
    return {
      sequence: [] as Node<WorkflowNodeData>[],
      error: 'Agent can only have one entry point (Trigger or Start).',
    };
  }

  const byId = new Map<string, Node<WorkflowNodeData>>(nodes.map((node) => [node.id, node]));
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, number>();

  edges.forEach((edge) => {
    if (!edge.source || !edge.target) return;
    outgoing.set(edge.source, [...(outgoing.get(edge.source) || []), edge.target]);
    incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1);
  });

  if ((incoming.get(startNodes[0].id) || 0) > 0) {
    return {
      sequence: [] as Node<WorkflowNodeData>[],
      error: 'Start node cannot have incoming edges.',
    };
  }

  const visited = new Set<string>();
  const stack = [startNodes[0].id];
  const sequence: Node<WorkflowNodeData>[] = [];

  while (stack.length > 0) {
    const nodeId = stack.pop()!;
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    const node = byId.get(nodeId);
    if (node) sequence.push(node);
    const nextIds = outgoing.get(nodeId) || [];
    stack.push(...nextIds);
  }

  if (sequence.length < 2) {
    return {
      sequence: [] as Node<WorkflowNodeData>[],
      error: 'Connect Start to at least one component before executing.',
    };
  }

  const unreachable = nodes.filter((node) => !visited.has(node.id));
  if (unreachable.length > 0) {
    return {
      sequence: [] as Node<WorkflowNodeData>[],
      error: `Every node must be connected in the execution sequence. Unconnected: ${unreachable[0].data?.name || unreachable[0].id}.`,
    };
  }

  return { sequence, error: '' };
};

/**
 * Simulates the execution of a single agent node.
 * Handles specific behavior for Start, End, and Condition nodes.
 */
const runAgentNode = async (node: Node<WorkflowNodeData>, input: Record<string, unknown>) => {
  const data = node.data || {};
  const properties = toProperties(node);
  const name = String(data.name || data.label || node.id);
  const category = String(data.category || data.group || 'Agent');
  const normalizedName = name.toLowerCase();

  await wait(350 + Math.floor(Math.random() * 250));

  if (properties.enabled === false) {
    return {
      skipped: true,
      message: `${name} is disabled`,
      previous: input,
    };
  }

  if (category === 'Start') {
    return {
      event: 'agent.started',
      payload: input,
    };
  }

  if (category === 'End') {
    return {
      event: data.outcome === 'failure' ? 'agent.failed' : 'agent.completed',
      outcome: data.outcome || 'success',
      received: input,
    };
  }

  if (category === 'Condition') {
    // Simulate: evaluate based on presence of violations in the current payload
    const hasViolations =
      input.violations && Array.isArray(input.violations) && input.violations.length > 0;
    const status = hasViolations ? 'failure' : Math.random() > 0.4 ? 'success' : 'failure';

    return {
      status,
      message: `Condition evaluated to ${status}.`,
      ...input,
    };
  }

  // Generic simulation logic for all other agents (DB, CRM, SMTP, LLM, etc.)
  // This delinks the builder execution from hardcoded agent-specific properties.
  return {
    nodeId: node.id,
    nodeName: name,
    category,
    status: 'success',
    executionTime: new Date().toISOString(),
    configuration: maskSecrets(properties),
    input: input,
    output: {
      message: `Simulated execution of ${name} completed.`,
      data: {
        processed_at: Date.now(),
        ...(category === 'Trigger' ? { event_type: data.triggerType || normalizedName } : {}),
        ...(category === 'Data' ? { rows_affected: 2 } : {}),
        ...(category === 'LLM'
          ? { model_response: 'Simulated AI response based on provided prompt.' }
          : {}),
      },
    },
  };
};

/**
 * Dynamically updates the 'targetAgent' dropdown options within a node's schema.
 * Used specifically by the Scheduler Agent to let users pick from available workflows.
 */
const updateSchedulerAgentSchema = (
  node: Node<WorkflowNodeData>,
  agentNames: string[],
): Node<WorkflowNodeData> => {
  if (node.data?.name !== 'Scheduler Agent') return node;

  const currentSchema = (node.data.propertySchema || []) as AgentPropertyDefinition[];
  const targetProp = currentSchema.find((p) => p.key === 'targetAgent');
  const sortedAgentNames = [...new Set(['', ...agentNames])].sort();

  // Only update if options are different to avoid unnecessary state updates
  if (
    targetProp?.type === 'choice' &&
    JSON.stringify(targetProp.options) === JSON.stringify(sortedAgentNames)
  ) {
    return node;
  }

  const updatedPropertySchema = currentSchema.map((prop: AgentPropertyDefinition) => {
    if (prop.key === 'targetAgent') {
      return {
        ...prop,
        type: 'choice' as const,
        options: sortedAgentNames,
        multiple: false,
      };
    }
    return prop;
  });
  return { ...node, data: { ...node.data, propertySchema: updatedPropertySchema } };
};

const defaultEdgeOptions = {
  style: { strokeWidth: 2, stroke: '#94a3b8' },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: '#94a3b8',
  },
};

const initialNodes: Node<WorkflowNodeData>[] = [];

type WorkflowGraphPayload = {
  nodes?: Node<WorkflowNodeData>[];
  nodes_structure?: Node<WorkflowNodeData>[];
  edges?: any[];
};

const getWorkflowNodes = (
  workflow: WorkflowGraphPayload | null | undefined,
): Node<WorkflowNodeData>[] => {
  if (!workflow) return initialNodes;
  return workflow.nodes || workflow.nodes_structure || initialNodes;
};

function AgentBuilderContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<WorkflowNodeData>>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<Node<WorkflowNodeData> | null>(null);
  const [agentId, setAgentId] = useState('');
  const [isAgentEnabled, setIsAgentEnabled] = useState(true);
  const [agentName, setAgentName] = useState('Email Channel');
  const [agentCategory, setAgentCategory] = useState('default');
  const [availableCategories, setAvailableCategories] = useState<any[]>(['default']);
  const [agentVersion, setAgentVersion] = useState<number | null>(null);
  const [status, setStatus] = useState('');
  const [executionTrace, setExecutionTrace] = useState<WorkflowTraceStep[]>([]);
  const [availableAgentNames, setAvailableAgentNames] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [userId, setUserId] = useState<string>('1');
  const { screenToFlowPosition, getNodes, fitView } = useReactFlow();

  const [isMapperOpen, setIsMapperOpen] = useState(false);
  const [prevNodeContract, setPrevNodeContract] = useState<any>(null);
  const [nextNodeContract, setNextNodeContract] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
    const storedUserId = localStorage.getItem('user_id');
    if (storedUserId) setUserId(storedUserId);
  }, []);

  // Sync all existing nodes on the canvas if the list of available agents refreshes
  useEffect(() => {
    if (isMounted && availableAgentNames.length > 0) {
      setNodes((nds) => nds.map((node) => updateSchedulerAgentSchema(node, availableAgentNames)));
    }
  }, [availableAgentNames, setNodes, isMounted]);

  useEffect(() => {
    api
      .getNodesCategories()
      .then((data) => {
        const cats = Array.isArray(data) ? data : data.categories || [];
        if (cats.length > 0) {
          setAvailableCategories([...cats]);
        }
      })
      .catch(() => console.error('Failed to load categories'));
  }, []);

  /** Validates connections to prevent cycles and enforce port logic */
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) => {
        const currentNodes = getNodes();
        const source = currentNodes.find((node) => node.id === params.source);
        const target = currentNodes.find((node) => node.id === params.target);
        const isTargetTrigger =
          target?.data?.properties?.node_type === 'trigger' ||
          target?.data?.nodeType === 'trigger' ||
          (target?.data?.category || target?.data?.group) === 'Trigger';

        const isCondition = (source?.data?.category || source?.data?.group) === 'Condition';

        if (
          (target?.data?.category || target?.data?.group) === 'Start' ||
          isTargetTrigger ||
          (source?.data?.category || source?.data?.group) === 'End'
        ) {
          setStatus(
            'Entry points (Start/Trigger) cannot have incoming edges and End nodes cannot have outgoing edges.',
          );
          return eds;
        }

        // Enforce output connection limits
        const existingSourceEdges = eds.filter((e) => e.source === params.source);

        if (isCondition) {
          // Ensure success/failure branches are unique
          const alreadyConnectedBranch = existingSourceEdges.find(
            (e) => e.sourceHandle === params.sourceHandle,
          );
          if (alreadyConnectedBranch) {
            setStatus(
              `The '${params.sourceHandle}' branch of this Condition is already connected.`,
            );
            return eds;
          }
        }

        return addEdge({ ...params, ...defaultEdgeOptions }, eds);
      }),
    [getNodes, setEdges],
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<WorkflowNodeData>) => {
    setSelectedNode(node);
  }, []);

  // Fetch node properties automatically whenever a node is selected
  useEffect(() => {
    if (!selectedNode || !agentId) return;

    const fetchNodeData = async () => {
      try {
        const response = await api.getAgentNodeProperties(agentId, selectedNode.id);
        if (!response) return;

        // Handle cases where response might be the property bag directly or wrapped in an object
        const fetchedProperties = response.properties || response;
        const fetchedSchema = response.property_schema || response.propertySchema;

        setNodes((nds) =>
          nds.map((n: Node<WorkflowNodeData>) => {
            if (n.id === selectedNode.id) {
              const updatedNode = {
                ...n,
                data: {
                  ...n.data,
                  properties: { ...(n.data.properties || {}), ...fetchedProperties },
                  // Ensure we preserve or update the schema required for rendering
                  propertySchema:
                    fetchedSchema || n.data.propertySchema || n.data.property_schema || [],
                },
              };
              // Sync the selectedNode state with the newly fetched data
              setSelectedNode(updatedNode);
              return updatedNode;
            }
            return n;
          }),
        );
      } catch (err) {
        console.error('Failed to sync node properties:', err);
      }
    };

    fetchNodeData();

    // Fetch neighbor contracts for Transform Node mapping
    if (selectedNode?.data?.name === 'transform_node') {
      const incomingEdge = edges.find((e) => e.target === selectedNode.id);
      const outgoingEdge = edges.find((e) => e.source === selectedNode.id);

      if (incomingEdge) {
        api.getAgentNodeProperties(agentId, incomingEdge.source)
           .then(res => setPrevNodeContract(res?.output_contract || {}));
      }
      if (outgoingEdge) {
        api.getAgentNodeProperties(agentId, outgoingEdge.target)
           .then(res => setNextNodeContract(res?.input_contract || {}));
      }
    }
  }, [selectedNode?.id, agentId, setNodes]);

  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  /** React Flow DND: Allow the drop by preventing default browser behavior */
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDragStart = (event: React.DragEvent, agent: any) => {
    event.dataTransfer.setData('application/reactflow-agent', JSON.stringify(agent));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';

      const agentDataStr = event.dataTransfer.getData('application/reactflow-agent');
      if (!agentDataStr) {
        setStatus('No agent data found in drop.');
        return;
      }

      try {
        const agentData = JSON.parse(agentDataStr);
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        // Better centering (adjust based on your CustomNode size)
        const nodePosition = { x: position.x - 80, y: position.y - 40 };

        normalizeAgent(agentData.name)
          .then((fullAgent) => {
            const newNode: Node<WorkflowNodeData> = {
              id: `${fullAgent.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`,
              type: 'custom',
              position: nodePosition,
              data: {
                ...fullAgent,
                properties: fullAgent.properties || {},
                propertySchema: fullAgent.propertySchema || [],
                executionStatus: 'idle' as ExecutionStatus,
                variant: fullAgent.category?.toString().toLowerCase(),
                subIcon: fullAgent.icon,
                model: (fullAgent.properties?.model as string) || '',
              },
            };

            setNodes((nds) => nds.concat(newNode));
            setStatus(`✅ Added ${fullAgent.label || fullAgent.name}`);
          })
          .catch((err) => {
            console.error('normalizeAgent failed:', err);
            setStatus(`Failed to load agent details: ${err.message}`);
          });
      } catch (err) {
        console.error('Drop parsing error:', err);
        setStatus('Invalid drag data');
      }
    },
    [setNodes, screenToFlowPosition, setStatus],
  );

  /** React Flow equivalent of 'ondragstop' for nodes already on the canvas */
  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node<WorkflowNodeData>) => {
    setStatus(
      `Moved ${node.data?.name || node.id} to [${Math.round(node.position.x)}, ${Math.round(node.position.y)}]`,
    );
  }, []);

  /** Updates node data when edited in the PropertiesPanel */
  const onUpdateNode = useCallback(
    (nodeId: string, newData: WorkflowNodeData) => {
      setNodes((nds) =>
        nds.map((node) => (node.id === nodeId ? { ...node, data: newData } : node)),
      );
      setSelectedNode((node) => (node?.id === nodeId ? { ...node, data: newData } : node));
    },
    [setNodes],
  );

  /** Explicitly saves instance properties to the backend */
  const onSaveInstanceProperties = useCallback(
    async (nodeId: string, properties: NodeProperties) => {
      if (!agentId) {
        setStatus('❌ Save the workflow first before saving node properties.');
        return;
      }
      try {
        await api.updateAgentNodeProperties(agentId, nodeId, properties);
        setStatus('✅ Node instance properties saved.');
      } catch (error) {
        setStatus('❌ Unable to save node instance properties.');
        throw error;
      }
    },
    [agentId],
  );

  const validateAgent = useCallback(() => {
    const { error } = buildExecutionSequence(nodes, edges);
    return error;
  }, [edges, nodes]);

  const onValidate = useCallback(() => {
    const validationError = validateAgent();
    setStatus(validationError || 'Agent is valid.');
    return !validationError;
  }, [validateAgent]);

  /** Saves the current graph to the backend API */
  const onSave = useCallback(async () => {
    const validationError = validateAgent();
    if (validationError) {
      setStatus(validationError);
      return;
    }

    let currentId = agentId;
    let currentName = agentName;
    let currentDescription = '';

    // If it's a new agent, prompt for details or autogenerate
    if (!currentId) {
      const promptedName = window.prompt(
        'Enter a name for this new agent (leave blank for autogenerated name):',
        agentName === 'Email Channel' ? '' : agentName,
      );

      if (promptedName === null) return; // Cancelled

      if (promptedName.trim()) {
        currentName = promptedName.trim();
        const promptedDesc = window.prompt('Enter agent description:', '');
        if (promptedDesc !== null) currentDescription = promptedDesc.trim();
      } else {
        // Autogenerate name: trigger_type + random number
        const triggerNode = nodes.find((n) => n.data?.node_type?.toUpperCase() === 'TRIGGER');
        const triggerType = triggerNode?.data?.name || 'agent';
        currentName = `${triggerType}_${Math.floor(Math.random() * 10000)}`;
        currentDescription = `Autogenerated workflow starting with ${triggerType}`;
      }

      currentId =
        currentName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '') || `workflow_${Date.now()}`;

      setAgentId(currentId);
      setAgentName(currentName);
    }

    try {
      const savedAgent = await api.saveAgent({
        id: currentId,
        name: currentName,
        description: currentDescription,
        nodes,
        edges,
        user_id: userId,
        category: agentCategory,
        is_enabled: isAgentEnabled,
      });

      setAgentVersion(savedAgent.version);
      setStatus(`Saved ${savedAgent.name} v${savedAgent.version}.`);
    } catch {
      setStatus('Unable to save agent.');
    }
  }, [edges, nodes, validateAgent, agentId, agentName, agentCategory, isAgentEnabled, userId]);

  const onSaveAs = useCallback(async () => {
    const nextName = window.prompt('Save agent as', agentName);
    if (!nextName?.trim()) return;

    const nextId =
      nextName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || `workflow_${Date.now()}`;

    const validationError = validateAgent();
    if (validationError) {
      setStatus(validationError);
      return;
    }

    try {
      const savedAgent = await api.saveAgent({
        id: nextId,
        name: nextName.trim(),
        nodes,
        edges,
        category: agentCategory,
        is_enabled: isAgentEnabled,
      });

      setAgentId(savedAgent.id || nextId);
      setAgentName(savedAgent.name || nextName.trim());
      setAgentVersion(savedAgent.version ?? 1);
      setStatus(
        `Saved new agent ${savedAgent.name || nextName.trim()} v${savedAgent.version ?? 1}.`,
      );
    } catch {
      setStatus('Unable to save agent as new agent.');
    }
  }, [edges, nodes, validateAgent, agentName, agentCategory, isAgentEnabled]);

  const onGet = useCallback(async () => {
    try {
      const data = await api.getSavedAgents();
      const workflows = Array.isArray(data) ? data : data.workflows || [];
      const latestWorkflow =
        workflows.find((workflow: { id: string }) => workflow.id === agentId) || workflows[0];

      if (!latestWorkflow) {
        setStatus('No saved agents found.');
        return;
      }

      setNodes(
        getWorkflowNodes(latestWorkflow).map((node: Node<WorkflowNodeData>) =>
          updateSchedulerAgentSchema(node, availableAgentNames),
        ),
      );
      setEdges(latestWorkflow.edges || []);
      setAgentId(latestWorkflow.id || agentId);
      setAgentName(latestWorkflow.name || latestWorkflow.id || agentName);
      setAgentCategory(latestWorkflow.category || 'default');
      setIsAgentEnabled(latestWorkflow.is_enabled ?? true);
      setAgentVersion(latestWorkflow.version);
      setSelectedNode(null);
      setStatus(`Loaded ${workflows.length} latest agent${workflows.length === 1 ? '' : 's'}.`);
    } catch {
      setStatus('Unable to get agents or update scheduler agent schema.');
    }
  }, [setEdges, setNodes, agentId, agentName, availableAgentNames, setIsAgentEnabled]);

  const loadAgent = useCallback(
    async (id: string) => {
      try {
        setStatus(`Loading ${id}...`);
        const data = await api.getAgentById(id);

        if (!data) {
          setStatus(`Agent ${id} not found.`);
          return;
        }

        setNodes(
          getWorkflowNodes(data).map((node: Node<WorkflowNodeData>) =>
            updateSchedulerAgentSchema(node, availableAgentNames),
          ),
        );
        setEdges(data.edges || []);
        setAgentId(data.id || id);
        setAgentName(data.name || data.id || id);
        setAgentCategory(data.category || 'default');
        setIsAgentEnabled(data.is_enabled ?? true);
        setAgentVersion(data.version);
        setSelectedNode(null);
        setExecutionTrace([]);
        setStatus(`Loaded ${data.name || id}.`);
      } catch (e) {
        setStatus(`Unable to load agent ${id}.`);
      }
    },
    [setEdges, setNodes, availableAgentNames],
  );

  const handleNewAgent = useCallback(() => {
    if (nodes.length > 0 && !window.confirm('Clear current board and start a new agent?')) {
      return;
    }
    setNodes([]);
    setEdges([]);
    setAgentId('');
    setAgentName('New Agent');
    setAgentCategory('default');
    setIsAgentEnabled(true);
    setAgentVersion(null);
    setSelectedNode(null);
    setExecutionTrace([]);
    setStatus('Started new agent.');
  }, [nodes.length, setNodes, setEdges]);

  const setNodeExecutionStatus = useCallback(
    (nodeId: string, executionStatus: ExecutionStatus) => {
      setNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, executionStatus } } : node,
        ),
      );
    },
    [setNodes],
  );

  /**
   * The main execution loop. Traverses the graph node by node,
   * calling runAgentNode for each and updating the execution trace.
   */
  const onExecute = useCallback(async () => {
    // Look for Trigger nodes first, then fallback to Start node
    const startNode = nodes.find((n) => n.data?.node_type?.toUpperCase() === 'TRIGGER');

    if (!startNode) {
      setStatus('Agent must have a Trigger or Start node.');
      return;
    }

    setIsExecuting(true);
    setExecutionTrace([]);
    setStatus(`Executing agent...`);
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        data: { ...node.data, executionStatus: 'idle' as ExecutionStatus },
      })),
    );

    let payload: Record<string, unknown> = {
      agentId,
      agentName,
      runId: `run_${Date.now()}`,
      startedBy: 'manual',
    };

    let currentNode: Node<WorkflowNodeData> | undefined = startNode;
    const visited = new Set<string>();
    let stepCount = 0;

    while (currentNode) {
      const activeNode: Node<WorkflowNodeData> = currentNode;

      if (
        visited.has(activeNode.id) &&
        (activeNode.data?.category || activeNode.data?.group) !== 'Condition'
      ) {
        setStatus('Infinite loop detected.');
        break;
      }
      visited.add(activeNode.id);

      const startedAtMs = Date.now();
      const startedAt = new Date(startedAtMs).toISOString();
      const nodeName = String(activeNode.data?.name || activeNode.data?.label || activeNode.id);
      const category = String(activeNode.data?.category || activeNode.data?.group || 'Agent');

      setNodeExecutionStatus(activeNode.id, 'running');

      try {
        const output = await runAgentNode(activeNode, payload);
        const finishedAtMs = Date.now();
        const traceStep: WorkflowTraceStep = {
          id: `${activeNode.id}-${startedAtMs}`,
          nodeId: activeNode.id,
          nodeName,
          group: category,
          status: 'success',
          startedAt,
          finishedAt: new Date(finishedAtMs).toISOString(),
          durationMs: finishedAtMs - startedAtMs,
          input: maskSecrets(payload) as Record<string, unknown>,
          output: maskSecrets(output) as Record<string, unknown>,
        };

        setExecutionTrace((trace) => [...trace, traceStep]);
        setNodeExecutionStatus(activeNode.id, 'success');
        stepCount++;
        payload = output;

        if (category === 'End') break;

        // Branching logic: traverse based on output status if it's a condition
        const outgoingEdges = edges.filter((e) => e.source === activeNode.id);
        if (category === 'Condition') {
          const resultStatus = output.status === 'failure' ? 'failure' : 'success';
          const edge = outgoingEdges.find((e) => e.sourceHandle === resultStatus);
          currentNode = edge ? nodes.find((n) => n.id === edge.target) : undefined;
        } else {
          currentNode = outgoingEdges[0]
            ? nodes.find((n) => n.id === outgoingEdges[0].target)
            : undefined;
        }
      } catch (nodeError) {
        const finishedAtMs = Date.now();
        const traceStep: WorkflowTraceStep = {
          id: `${activeNode.id}-${startedAtMs}`,
          nodeId: activeNode.id,
          nodeName,
          group: category,
          status: 'error',
          startedAt,
          finishedAt: new Date(finishedAtMs).toISOString(),
          durationMs: finishedAtMs - startedAtMs,
          input: maskSecrets(payload) as Record<string, unknown>,
          error: nodeError instanceof Error ? nodeError.message : 'Unknown execution error',
        };

        setExecutionTrace((trace) => [...trace, traceStep]);
        setNodeExecutionStatus(activeNode.id, 'error');
        setStatus(`Execution stopped at ${nodeName}: ${traceStep.error}`);
        setIsExecuting(false);
        return;
      }
    }

    setIsExecuting(false);
    setStatus(`Execution completed. Captured ${stepCount} trace steps.`);
  }, [edges, nodes, setNodeExecutionStatus, setNodes, agentId, agentName]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50 text-black">
      {/* Top Bar */}
      <div className="h-16 border-b bg-white flex items-center px-6 justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-black">AI Agent Builder</h1>
          <div className="text-sm text-gray-500 flex items-center gap-2">
            {agentId} • v{agentVersion ?? 1} •
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isAgentEnabled}
                onChange={(e) => setIsAgentEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
              <span className="ms-2 text-sm font-medium text-gray-600">
                {isAgentEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>
        </div>

        <WorkflowToolbar
          onValidate={onValidate}
          onSave={onSave}
          onSaveAs={onSaveAs}
          onGet={onGet}
          onExecute={onExecute}
          isExecuting={isExecuting}
          status={status}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Pass onAllAgentsLoaded callback */}
        <AgentSidebar
          onSelectAgent={loadAgent}
          onNewAgent={handleNewAgent}
          onAllAgentsLoaded={setAvailableAgentNames}
        />

        {/* Main Canvas */}

        {/* Canvas Container */}

        <div
          className="flex-1 relative bg-gray-50 overflow-hidden"
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onNodeDragStop={onNodeDragStop}
            nodeTypes={nodeTypes}
            nodesDraggable={true}
            nodesConnectable={true}
            elementsSelectable={true}
            selectNodesOnDrag={false}
            panOnDrag={true}
            panOnScroll={true}
            zoomOnScroll={true}
            zoomOnDoubleClick={true}
            minZoom={0.1}
            maxZoom={2.0}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            fitViewOptions={{ maxZoom: 1, padding: 0.2 }}
          >
            <Background variant={BackgroundVariant.Dots} gap={10} size={1} />
            <Controls />
            <MiniMap />
          </ReactFlow>

          {/* Contextual Mapping Trigger */}
          {(selectedNode?.data?.name === 'transform_node' || selectedNode?.data?.node_type?.toUpperCase() === 'TRANSFORM') && (
            <div className="absolute top-4 right-84 z-10 animate-in fade-in slide-in-from-right-4 duration-300">
              <button
                onClick={() => setIsMapperOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xl  transition-all transform hover:scale-105 active:scale-95 border border-blue-400"
              >
                <ArrowRightLeft size={12} />
                Configure Data Mapping
              </button>
            </div>
          )}

          {/* Trace Panel - Fixed z-index & pointer events */}
          {executionTrace.length > 0 && (
            <div className="absolute bottom-4 left-4 right-4 z-20 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl pointer-events-auto flex flex-col">
              <div className="flex items-center justify-between p-3 border-b bg-gray-50 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-blue-500" />
                  <h3 className="font-semibold text-sm text-gray-700">Agent Execution Trace</h3>
                  <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full text-gray-600">
                    {executionTrace.length} steps
                  </span>
                </div>
                <button
                  onClick={() => setExecutionTrace([])}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-2 space-y-1">
                {executionTrace.map((step) => (
                  <div
                    key={step.id}
                    className="group p-2 hover:bg-gray-50 rounded border border-transparent hover:border-gray-100 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {step.status === 'success' ? (
                          <CheckCircle size={14} className="text-green-500" />
                        ) : (
                          <AlertCircle size={14} className="text-red-500" />
                        )}
                        <span className="font-bold text-xs text-black">{step.nodeName}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-medium">
                          {step.group}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-400">
                        {step.durationMs}ms
                      </span>
                    </div>
                    {step.error && (
                      <p className="mt-1 text-[11px] text-red-600 bg-red-50 p-1 rounded border border-red-100">
                        {step.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <PropertiesPanel
          selectedNode={selectedNode}
          onClose={() => setSelectedNode(null)}
          onUpdateNode={onUpdateNode}
          onSaveInstanceProperties={onSaveInstanceProperties}
          onSave={onSave}
          workflowId={agentId}
        />

        {/* Global Field Mapper Modal */}
        <FieldMapperModal
          isOpen={isMapperOpen}
          onClose={() => setIsMapperOpen(false)}
          sourceNodeName={nodes.find(n => n.id === edges.find(e => e.target === selectedNode?.id)?.source)?.data?.name}
          targetNodeName={nodes.find(n => n.id === edges.find(e => e.source === selectedNode?.id)?.target)?.data?.name}
          sourceContract={prevNodeContract}
          targetContract={nextNodeContract}
          currentMapping={(() => {
            try {
              const val = selectedNode?.data?.properties?.mapping_template;
              return typeof val === 'string' ? JSON.parse(val) : val || {};
            } catch { return {}; }
          })()}
          onSaveMapping={async (newMap) => {
            const mappingStr = JSON.stringify(newMap, null, 2);
            const updatedProperties = {
              ...((selectedNode!.data.properties as any) || {}),
              mapping_template: mappingStr
            };

            // 1. Update local React Flow state for immediate UI feedback
            onUpdateNode(selectedNode!.id, {
              ...selectedNode!.data,
              properties: updatedProperties
            });

            // 2. Persist the updated properties to the SQLite database
            await onSaveInstanceProperties(selectedNode!.id, updatedProperties);
            
            setIsMapperOpen(false);
          }}
        />
      </div>
    </div>
  );
}

export default function AgentBuilder() {
  return (
    <ReactFlowProvider>
      <AgentBuilderContent />
    </ReactFlowProvider>
  );
}
