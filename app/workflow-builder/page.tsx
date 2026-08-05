'use client';

import { useCallback, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getDemoFlowById } from '@/lib/demo-flows';
import {
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  useReactFlow,
  ReactFlowProvider,
  addEdge,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import { api } from '@/lib/api';
import {
  getRequiredPermissionForPath,
  hasPermissionScope,
  getDefaultRedirectForPermissions,
} from '@/lib/config/route_permissions';
import AgentSidebar from '../components/AgentSidebar';
import PropertiesPanel from '../components/PropertiesPanel';
import { normalizeAgent } from '../components/component-categoriees';
import FieldMappingController from './components/FieldMappingController';
import WorkflowCanvas from './components/WorkflowCanvas';
import WorkflowHeader from './components/WorkflowHeader';
import type { ExecutionStatus, NodeProperties, WorkflowNodeData, WorkflowTraceStep } from './types';
import {
  buildExecutionSequence,
  defaultEdgeOptions,
  getWorkflowNodes,
  initialNodes,
  maskSecrets,
  runAgentNode,
} from './workflow-helpers';

function AgentBuilderContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<WorkflowNodeData>>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<Node<WorkflowNodeData> | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
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
  const [userRole, setUserRole] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [workflowOwnerId, setWorkflowOwnerId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const { screenToFlowPosition, getNodes, fitView } = useReactFlow();
  const [description, setAgentDescription] = useState('');
  const searchParams = useSearchParams();

  const onCenter = useCallback(() => {
    fitView({ duration: 300 });
  }, [fitView]);

  const [isMapperOpen, setIsMapperOpen] = useState(false);
  const [prevNodeContract, setPrevNodeContract] = useState<any>(null);
  const [nextNodeContract, setNextNodeContract] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      api
        .getCurrentUser()
        .then((userData) => {
          setUserId(userData.id);
          setUserRole(userData.role || '');
          setUserEmail(userData.email || '');

          const perms = userData.permissions || [];
          const requiredPerm = getRequiredPermissionForPath('/workflow-builder') || 'workflow:view';
          const hasAccess = hasPermissionScope(perms, requiredPerm);

          if (!hasAccess) {
            const fallback = getDefaultRedirectForPermissions(perms, userData.role);
            window.location.href = fallback;
            return;
          }
        })
        .catch((err) => {
          console.error('Failed to fetch user in workflow builder:', err);
          api.logout();
          window.location.href = '/login';
        });
    }

    // ── Demo mode: load pre-built flow from ?demo=<id> ──
    const demoId = searchParams?.get('demo');
    if (demoId) {
      const demo = getDemoFlowById(demoId);
      if (demo) {
        setNodes(demo.payload.nodes as any);
        setEdges(demo.payload.edges as any);
        setAgentId(demo.payload.id);
        setAgentName(demo.payload.name);
        setAgentDescription(demo.payload.description);
        setAgentCategory(demo.payload.category);
        setIsDemoMode(true);
        setStatus(`Demo loaded: ${demo.name}`);
        setTimeout(() => fitView({ duration: 500, padding: 0.15 }), 300);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync all existing nodes on the canvas if the list of available agents refreshes
  useEffect(() => {}, [availableAgentNames, setNodes, isMounted]);

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

  const onNodesChangeWrapper = useCallback(
    (changes: any) => {
      onNodesChange(changes);
      const hasModifyingChange = changes.some(
        (c: any) => c.type === 'position' || c.type === 'remove' || c.type === 'add',
      );
      if (hasModifyingChange) {
        setIsDirty(true);
      }
    },
    [onNodesChange],
  );

  const onEdgesChangeWrapper = useCallback(
    (changes: any) => {
      onEdgesChange(changes);
      const hasModifyingChange = changes.some((c: any) => c.type === 'remove' || c.type === 'add');
      if (hasModifyingChange) {
        setIsDirty(true);
      }
    },
    [onEdgesChange],
  );

  const onDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedNode(null);
      setIsDirty(true);
      setStatus('Node deleted.');
    },
    [setNodes, setEdges],
  );

  /** Validates connections to prevent cycles and enforce port logic */
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) => {
        if (params.source === params.target) {
          setStatus('Self-connections are not allowed to prevent loops.');
          return eds;
        }

        const currentNodes = getNodes();
        const source = currentNodes.find((node) => node.id === params.source);
        const target = currentNodes.find((node) => node.id === params.target);
        const isTargetTrigger =
          (target?.data as any)?.properties?.node_type === 'trigger' ||
          (target?.data as any)?.nodeType === 'trigger' ||
          ((target?.data as any)?.category || (target?.data as any)?.group) === 'Trigger';

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

        setIsDirty(true);
        let initialCondition = params.sourceHandle || 'success';
        if (initialCondition === 'source-right' || initialCondition === 'source-bottom') {
          initialCondition = 'default';
        }
        const edgeParams = {
          ...params,
          ...defaultEdgeOptions,
          condition: initialCondition,
          data: {
            condition: initialCondition,
          },
        };
        return addEdge(edgeParams, eds);
      }),
    [getNodes, setEdges],
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<WorkflowNodeData>) => {
    setSelectedNode(node);
  }, []);

  const onEdgeClick = useCallback((edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
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

        setNodes((nds) =>
          nds.map((n: Node<WorkflowNodeData>) => {
            if (n.id === selectedNode.id) {
              const updatedNode = {
                ...n,
                data: {
                  ...n.data,
                  properties: { ...(n.data.properties || {}), ...fetchedProperties },
                  property_schema:
                    response.property_schema ||
                    response.propertySchema ||
                    n.data.property_schema ||
                    [],
                  propertySchema:
                    response.property_schema ||
                    response.propertySchema ||
                    n.data.propertySchema ||
                    [],
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

    // Fetch neighbor contracts for mapping
    if (selectedNode) {
      const incomingEdge = edges.find((e) => e.target === selectedNode.id);
      const isTransform =
        selectedNode.data?.name === 'transform_node' ||
        String(selectedNode.data?.node_type || '').toUpperCase() === 'TRANSFORM';

      if (isTransform) {
        const outgoingEdge = edges.find((e) => e.source === selectedNode.id);
        if (incomingEdge) {
          api
            .getAgentNodeProperties(agentId, incomingEdge.source)
            .then((res) => setPrevNodeContract(res?.output_contract || {}));
        }
        if (outgoingEdge) {
          api
            .getAgentNodeProperties(agentId, outgoingEdge.target)
            .then((res) => setNextNodeContract(res?.input_contract || {}));
        }
      } else if (incomingEdge) {
        // Direct mapping: source is the incoming node's output, target is selected node's input
        api
          .getAgentNodeProperties(agentId, incomingEdge.source)
          .then((res) => setPrevNodeContract(res?.output_contract || {}));
        api
          .getAgentNodeProperties(agentId, selectedNode.id)
          .then((res) => setNextNodeContract(res?.input_contract || {}));
      }
    }
  }, [selectedNode?.id, agentId, setNodes, edges]);

  const onPaneClick = useCallback(() => setSelectedNode(null), []);
  // Clear selections for both nodes and edges when clicking on the pane
  const onPaneClickWrapper = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

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
                user_properties: fullAgent.user_properties || {},
                system_properties: fullAgent.system_properties || {},
                executionStatus: 'idle' as ExecutionStatus,
                variant: fullAgent.category?.toString().toLowerCase(),
                subIcon: fullAgent.icon,
                model: ((fullAgent as any).properties?.model as string) || '',
              },
            };

            setNodes((nds) => nds.concat(newNode));
            setIsDirty(true);
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
  const onNodeDragStop = useCallback((event: any, node: Node<WorkflowNodeData>) => {
    setStatus(
      `Moved ${node.data?.name || node.id} to [${Math.round(node.position.x)}, ${Math.round(node.position.y)}]`,
    );
  }, []);

  /** Updates node data when edited in the PropertiesPanel */
  const onUpdateNode = useCallback(
    (nodeId: string, newData: any) => {
      setNodes((nds) =>
        nds.map((node) => (node.id === nodeId ? { ...node, data: newData } : node)),
      );
      setSelectedNode((node) => (node?.id === nodeId ? { ...node, data: newData } : node));
      setIsDirty(true);
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
        const triggerNode = nodes.find(
          (n) => String(n.data?.node_type || '').toUpperCase() === 'TRIGGER',
        );
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
      setWorkflowOwnerId(userId);
    }

    try {
      const savedAgent = await api.saveAgent({
        id: currentId,
        name: currentName,
        description: currentDescription,
        nodes: nodes as any,
        edges,
        user_id: userId,
        category: agentCategory,
        is_enabled: isAgentEnabled,
      });

      setAgentVersion(savedAgent.version);
      setStatus(`Saved ${savedAgent.name} v${savedAgent.version}.`);
      setIsDirty(false);
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
        description: 'description',
        nodes: nodes as any,
        edges,
        user_id: userId,
        category: agentCategory,
        is_enabled: isAgentEnabled,
      });

      setAgentId(savedAgent.id || nextId);
      setAgentName(savedAgent.name || nextName.trim());
      setAgentVersion(savedAgent.version ?? 1);
      setWorkflowOwnerId(userId);
      setIsDirty(false);
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

      setNodes(getWorkflowNodes(latestWorkflow));
      setEdges(latestWorkflow.edges || []);
      setAgentId(latestWorkflow.id || agentId);
      setAgentName(latestWorkflow.name || latestWorkflow.id || agentName);
      setAgentCategory(latestWorkflow.category || 'default');
      setIsAgentEnabled(latestWorkflow.is_enabled ?? true);
      setWorkflowOwnerId(latestWorkflow.user_id || null);
      setAgentVersion(latestWorkflow.version);
      setSelectedNode(null);
      setIsDirty(false);
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

        setNodes(getWorkflowNodes(data));
        setEdges(data.edges || []);
        setAgentId(data.id || id);
        setAgentName(data.name || data.id || id);
        setAgentCategory(data.category || 'default');
        setIsAgentEnabled(data.is_enabled ?? true);
        setWorkflowOwnerId(data.user_id || null);
        setAgentVersion(data.version);
        setSelectedNode(null);
        setExecutionTrace([]);
        setIsDirty(false);
        setAgentDescription(data.description);
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
    setWorkflowOwnerId(userId);
    setAgentVersion(null);
    setSelectedNode(null);
    setExecutionTrace([]);
    setIsDirty(false);
    setStatus('Started new agent.');
  }, [nodes.length, setNodes, setEdges, userId]);

  const onDelete = useCallback(async () => {
    if (!agentId) return;

    const confirmDelete = window.confirm(
      'Are you sure you want to delete this workflow? This action is permanent and all associated data will be lost.',
    );

    if (!confirmDelete) return;

    try {
      const success = await api.deleteWorkflow(agentId);
      if (success) {
        setStatus('Workflow deleted successfully.');
        handleNewAgent();
      } else {
        setStatus('Failed to delete workflow.');
      }
    } catch (err: any) {
      setStatus(`Error deleting workflow: ${err.message}`);
    }
  }, [agentId, handleNewAgent, setStatus]);

  const setNodeExecutionStatus = useCallback(
    (nodeId: string, executionStatus: ExecutionStatus, output?: any) => {
      setNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  executionStatus,
                  output: executionStatus === 'error' ? undefined : output?.output || output,
                  error:
                    executionStatus === 'error'
                      ? typeof output === 'string'
                        ? output
                        : output?.message || 'Execution failed'
                      : undefined,
                },
              }
            : node,
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
    const startNode = nodes.find(
      (n) => String(n.data?.node_type || '').toUpperCase() === 'TRIGGER',
    );

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
        data: {
          ...node.data,
          executionStatus: 'idle' as ExecutionStatus,
          output: undefined,
          error: undefined,
        },
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
        setNodeExecutionStatus(activeNode.id, 'success', output);
        stepCount++;
        payload = output;

        if (category === 'End') break;

        // Branching logic: traverse based on output status and expressions
        const outgoingEdges = edges.filter((e) => e.source === activeNode.id);
        let matchedEdge = undefined;

        if (output && output.status === 'failure') {
          // Failure path check:
          // Look for any edge that is failure-specific
          matchedEdge = outgoingEdges.find((e) => {
            const cond = (
              e.data?.condition ||
              (e as any).condition ||
              e.sourceHandle ||
              ''
            ).toLowerCase();
            return cond === 'failure' || cond === 'has_violations';
          });
          // If no failure path is defined, the execution stops gracefully.
        } else {
          // Success / Custom Path check:
          // 1. First, check expression edges
          for (const edge of outgoingEdges) {
            const expr = edge.data?.expression || (edge as any).expression;
            if (expr) {
              try {
                // Safely evaluate simple JS expression with 'output' context
                const keys = Object.keys(output || {});
                const vals = Object.values(output || {});
                const evalFn = new Function(
                  'output',
                  ...keys,
                  `try { return !!(${expr}); } catch(e) { return false; }`,
                );
                if (evalFn(output, ...vals)) {
                  matchedEdge = edge;
                  break;
                }
              } catch (e) {
                console.error('Failed to evaluate expression during simulation:', expr, e);
              }
            }
          }

          // 2. If no expression matched, check custom conditions and success conditions
          if (!matchedEdge) {
            const conditionResult = (output as any)?.condition_result || 'success';
            matchedEdge = outgoingEdges.find((e) => {
              let cond = (
                e.data?.condition ||
                (e as any).condition ||
                e.sourceHandle ||
                ''
              ).toLowerCase();
              if (cond === 'source-right' || cond === 'source-bottom') {
                cond = 'success';
              }
              return cond === String(conditionResult).toLowerCase();
            });
          }

          // 3. Fallback to unconditional success edges (empty condition or success)
          if (!matchedEdge) {
            matchedEdge = outgoingEdges.find((e) => {
              let cond = (
                e.data?.condition ||
                (e as any).condition ||
                e.sourceHandle ||
                ''
              ).toLowerCase();
              if (cond === 'source-right' || cond === 'source-bottom') {
                cond = 'success';
              }
              return cond === 'success' || cond === '' || cond === 'default';
            });
          }

          // 4. Fallback to the first outgoing edge if still no match
          if (!matchedEdge && outgoingEdges.length > 0) {
            matchedEdge = outgoingEdges[0];
          }
        }

        currentNode = matchedEdge ? nodes.find((n) => n.id === matchedEdge.target) : undefined;
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
        setNodeExecutionStatus(activeNode.id, 'error', traceStep.error);
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
    <div className="flex h-[calc(100vh-64px)] flex-col bg-background text-foreground overflow-hidden">
      <WorkflowHeader
        agentId={agentId}
        agentDescription={description}
        agentName={agentName}
        agentVersion={agentVersion}
        isAgentEnabled={isAgentEnabled}
        isDirty={isDirty}
        isEditingName={isEditingName}
        isExecuting={isExecuting}
        status={status}
        canDelete={Boolean(
          agentId &&
          (userRole === 'admin' || userRole === 'system_admin' || userId === workflowOwnerId),
        )}
        onAgentNameChange={setAgentName}
        onAgentEnabledChange={setIsAgentEnabled}
        onEditingNameChange={setIsEditingName}
        onDirtyChange={setIsDirty}
        onDelete={onDelete}
        onValidate={onValidate}
        onSave={onSave}
        onSaveAs={onSaveAs}
        onGet={onGet}
        onExecute={onExecute}
        onCenter={onCenter}
        onNewAgent={handleNewAgent}
      />

      {/* Demo mode banner */}
      {isDemoMode && (
        <div className="flex items-center gap-3 px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Demo Mode — inspect every node, customize properties, then click Save to make it yours.
          </span>
          <button
            onClick={() => setIsDemoMode(false)}
            className="ml-auto text-amber-500 hover:text-amber-700 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <AgentSidebar
          onSelectAgent={loadAgent}
          onNewAgent={handleNewAgent}
          onAllAgentsLoaded={setAvailableAgentNames}
        />

        <WorkflowCanvas
          nodes={nodes}
          edges={edges}
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          executionTrace={executionTrace}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onNodesChange={onNodesChangeWrapper}
          onEdgesChange={onEdgesChangeWrapper}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClickWrapper}
          onNodeDragStop={onNodeDragStop}
          onOpenMapper={() => setIsMapperOpen(true)}
          onClearTrace={() => setExecutionTrace([])}
        />

        <PropertiesPanel
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onClose={() => {
            setSelectedNode(null);
            setSelectedEdge(null);
          }}
          onUpdateNode={onUpdateNode}
          onUpdateEdge={(edgeId, newEdge) => {
            setEdges((eds) =>
              eds.map((e) =>
                e.id === edgeId
                  ? {
                      ...e,
                      ...newEdge,
                      data: {
                        ...(e.data || {}),
                        ...newEdge,
                      },
                    }
                  : e,
              ),
            );
            setSelectedEdge((e) =>
              e && e.id === edgeId
                ? {
                    ...e,
                    ...newEdge,
                    data: {
                      ...(e.data || {}),
                      ...newEdge,
                    },
                  }
                : e,
            );
            setIsDirty(true);
          }}
          onSaveInstanceProperties={onSaveInstanceProperties}
          onSave={onSave}
          workflowId={agentId}
          onDeleteNode={onDeleteNode}
          onOpenMapper={() => setIsMapperOpen(true)}
          hasPredecessor={selectedNode ? edges.some((e) => e.target === selectedNode.id) : false}
          userRole={userRole}
        />

        <FieldMappingController
          isOpen={isMapperOpen}
          nodes={nodes}
          edges={edges}
          selectedNode={selectedNode}
          onClose={() => setIsMapperOpen(false)}
          sourceContract={prevNodeContract}
          targetContract={nextNodeContract}
          onUpdateNode={onUpdateNode}
          onSaveInstanceProperties={onSaveInstanceProperties}
          userRole={userRole}
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
