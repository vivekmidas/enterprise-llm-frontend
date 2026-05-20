'use client';

import { useCallback, useState } from 'react';
import ReactFlow, {
    Node, addEdge, Connection, useNodesState, useEdgesState,
    Background, Controls, MiniMap,
    ConnectionLineType,
    BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';

import { api } from '@/lib/api';
import AgentSidebar from '../components/AgentSidebar';
import WorkflowToolbar from '../components/WorkflowToolbar';
import PropertiesPanel from '../components/PropertiesPanel';
import CustomNode from '../components/CustomNode';
import { AgentPropertyDefinition, PropertyValue, normalizeAgent } from '../components/component-categoriees';

const nodeTypes = { custom: CustomNode };
type ExecutionStatus = 'idle' | 'running' | 'success' | 'error';
type NodeProperties = Record<string, PropertyValue>;
type WorkflowNodeData = Record<string, PropertyValue | AgentPropertyDefinition[] | NodeProperties | ExecutionStatus | undefined>;

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

const maskSecrets = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(maskSecrets);
    if (!value || typeof value !== 'object') return value;

    return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, fieldValue]) => {
            const normalizedKey = key.toLowerCase();
            if (normalizedKey.includes('password') || normalizedKey.includes('apikey') || normalizedKey.includes('token')) {
                return [key, fieldValue ? '••••••••' : ''];
            }

            return [key, maskSecrets(fieldValue)];
        }),
    );
};

const toProperties = (node: Node): NodeProperties => {
    const properties = node.data?.properties;
    return properties && typeof properties === 'object' && !Array.isArray(properties)
        ? properties as NodeProperties
        : {};
};

const buildExecutionSequence = (nodes: Node[], edges: { source?: string | null; target?: string | null }[]) => {
    const startNodes = nodes.filter((node) => node.data?.group === 'Start');
    if (startNodes.length !== 1) {
        return { sequence: [] as Node[], error: 'Workflow must have exactly one Start node.' };
    }

    const byId = new Map<string, Node>(nodes.map((node) => [node.id, node]));
    const outgoing = new Map<string, string[]>();
    const incoming = new Map<string, number>();

    edges.forEach((edge) => {
        if (!edge.source || !edge.target) return;
        outgoing.set(edge.source, [...(outgoing.get(edge.source) || []), edge.target]);
        incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1);
    });

    if ((incoming.get(startNodes[0].id) || 0) > 0) {
        return { sequence: [] as Node[], error: 'Start node must be the beginning of the workflow.' };
    }

    const sequence: Node[] = [];
    const visited = new Set<string>();
    let current: Node | undefined = startNodes[0];

    while (current) {
        if (visited.has(current.id)) {
            return { sequence: [] as Node[], error: 'Workflow cannot contain cycles in sequential execution mode.' };
        }

        visited.add(current.id);
        sequence.push(current);

        const nextIds: string[] = outgoing.get(current.id) || [];
        if (nextIds.length > 1) {
            return { sequence: [] as Node[], error: `${current.data?.name || current.id} has multiple outgoing edges. Sequential runs support one next step.` };
        }

        current = nextIds[0] ? byId.get(nextIds[0]) : undefined;
    }

    if (sequence.length < 2) {
        return { sequence: [] as Node[], error: 'Connect Start to at least one agent before executing.' };
    }

    const unreachable = nodes.filter((node) => !visited.has(node.id));
    if (unreachable.length > 0) {
        return { sequence: [] as Node[], error: `Every node must be connected in the execution sequence. Unconnected: ${unreachable[0].data?.name || unreachable[0].id}.` };
    }

    return { sequence, error: '' };
};

const runWorkflowNode = async (node: Node, input: Record<string, unknown>) => {
    const data = node.data || {};
    const properties = toProperties(node);
    const name = String(data.name || data.label || node.id);
    const group = String(data.group || data.category || 'Agent');
    const normalizedName = name.toLowerCase();

    await wait(350 + Math.floor(Math.random() * 250));

    if (properties.enabled === false) {
        return {
            skipped: true,
            message: `${name} is disabled`,
            previous: input,
        };
    }

    if (group === 'Start') {
        return {
            event: 'workflow.started',
            payload: input,
        };
    }

    if (group === 'End') {
        return {
            event: data.outcome === 'failure' ? 'workflow.failed' : 'workflow.completed',
            outcome: data.outcome || 'success',
            received: input,
        };
    }

    if (normalizedName.includes('db') || normalizedName.includes('database')) {
        const sqlCommand = String(properties.sqlCommand || '').trim();
        if (!properties.ipAddress || !properties.port || !properties.username || !properties.dbName || !sqlCommand) {
            throw new Error('DB Agent requires IP address, port, username, database name, and SQL command.');
        }

        return {
            adapter: 'database',
            dryRun: true,
            connection: `${properties.username}@${properties.ipAddress}:${properties.port}/${properties.dbName}`,
            sqlCommand,
            rows: [
                { id: 1, source: 'simulated-db', status: 'matched' },
                { id: 2, source: 'simulated-db', status: 'matched' },
            ],
            previous: input,
        };
    }

    if (normalizedName.includes('crm')) {
        if (!properties.baseUrl || !properties.entity || !properties.lookupField) {
            throw new Error('CRM Agent requires CRM base URL, entity, and lookup field.');
        }

        return {
            adapter: 'crm',
            dryRun: true,
            entity: properties.entity,
            lookup: {
                field: properties.lookupField,
                value: properties.lookupValue || 'from previous node',
            },
            record: {
                id: 'crm_001',
                name: 'Sample Customer',
                tier: 'Enterprise',
                openCases: 2,
            },
            previous: input,
        };
    }

    if (group === 'Trigger') {
        return {
            event: `${data.triggerType || normalizedName}.received`,
            configuration: maskSecrets(properties),
            payload: input,
        };
    }

    return {
        agent: name,
        group,
        configuration: maskSecrets(properties),
        received: input,
        result: `${name} completed`,
    };
};

const initialNodes: Node[] = [
    {
        id: 'start',
        type: 'custom',
        position: { x: 150, y: 150 },
        data: {
            label: 'Start',
            name: 'Start',
            description: 'Entry point for every workflow run',
            group: 'Start',
            category: 'Start',
            icon: 'play-circle',
            propertySchema: [
                {
                    key: 'enabled',
                    label: 'Enabled',
                    type: 'boolean',
                },
            ],
            properties: {
                enabled: true,
            },
        },
    }
];

export default function WorkflowBuilder() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [workflowId, setWorkflowId] = useState('email_channel');
    const [workflowName, setWorkflowName] = useState('Email Channel');
    const [workflowVersion, setWorkflowVersion] = useState<number | null>(null);
    const [status, setStatus] = useState('');
    const [executionTrace, setExecutionTrace] = useState<WorkflowTraceStep[]>([]);
    const [isExecuting, setIsExecuting] = useState(false);

    const onConnect = useCallback((params: Connection) =>
        setEdges((eds) => {
            const source = nodes.find((node) => node.id === params.source);
            const target = nodes.find((node) => node.id === params.target);

            if (target?.data?.group === 'Start' || source?.data?.group === 'End') {
                setStatus('Start cannot have incoming edges and End cannot have outgoing edges.');
                return eds;
            }

            return addEdge(params, eds);
        }), [nodes, setEdges]);

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => setSelectedNode(node), []);
    const onPaneClick = () => setSelectedNode(null);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        const agentPayload = event.dataTransfer.getData('application/reactflow-agent');
        const agentName = event.dataTransfer.getData('application/reactflow');
        if (!agentPayload && !agentName) return;

        let agent = normalizeAgent(agentName);
        if (agentPayload) {
            try {
                agent = normalizeAgent(JSON.parse(agentPayload));
            } catch {
                agent = normalizeAgent(agentName);
            }
        }

        if (agent.group === 'Start' && nodes.some((node) => node.data?.group === 'Start')) {
            setStatus('Only one Start node is allowed.');
            return;
        }

        if (agent.group === 'Trigger' && nodes.some((node) => node.data?.group === 'Trigger')) {
            setStatus('Only one Trigger node is allowed per workflow.');
            return;
        }

        const newNode: Node = {
            id: `${agent.name}-${Date.now()}`,
            type: 'custom',
            position: { x: event.clientX - 100, y: event.clientY - 50 },
            data: {
                label: agent.name,
                name: agent.name,
                description: agent.description,
                group: agent.group,
                category: agent.group,
                icon: agent.icon,
                triggerType: agent.triggerType,
                outcome: agent.outcome,
                propertySchema: agent.propertySchema || [],
                properties: agent.defaultProperties || {},
            },
        };
        setNodes((nds) => nds.concat(newNode));
        setStatus('');
    }, [nodes, setNodes]);

    const onUpdateNode = useCallback((nodeId: string, newData: WorkflowNodeData) => {
        setNodes((nds) =>
            nds.map((node) =>
                node.id === nodeId ? { ...node, data: newData } : node
            )
        );
        setSelectedNode((node) =>
            node?.id === nodeId ? { ...node, data: newData } : node
        );
    }, [setNodes]);
    const validateWorkflow = useCallback(() => {
        const { error } = buildExecutionSequence(nodes, edges);
        return error;
    }, [edges, nodes]);

    const onValidate = useCallback(() => {
        const validationError = validateWorkflow();
        setStatus(validationError || 'Workflow is valid.');
        return !validationError;
    }, [validateWorkflow]);

    const onSave = useCallback(async () => {
        const validationError = validateWorkflow();
        if (validationError) {
            setStatus(validationError);
            return;
        }

        try {
            const savedWorkflow = await api.saveWorkflow({
                id: workflowId,
                name: workflowName,
                nodes,
                edges,
            });

            setWorkflowVersion(savedWorkflow.version);
            setStatus(`Saved ${savedWorkflow.name} v${savedWorkflow.version}.`);
        } catch {
            setStatus('Unable to save workflow.');
        }
    }, [edges, nodes, validateWorkflow, workflowId, workflowName]);

    const onSaveAs = useCallback(async () => {
        const nextName = window.prompt('Save workflow as', workflowName);
        if (!nextName?.trim()) return;

        const nextId = nextName
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '') || `workflow_${Date.now()}`;

        const validationError = validateWorkflow();
        if (validationError) {
            setStatus(validationError);
            return;
        }

        try {
            const savedWorkflow = await api.saveWorkflow({
                id: nextId,
                name: nextName.trim(),
                nodes,
                edges,
            });

            setWorkflowId(savedWorkflow.id || nextId);
            setWorkflowName(savedWorkflow.name || nextName.trim());
            setWorkflowVersion(savedWorkflow.version ?? 1);
            setStatus(`Saved new workflow ${savedWorkflow.name || nextName.trim()} v${savedWorkflow.version ?? 1}.`);
        } catch {
            setStatus('Unable to save workflow as new workflow.');
        }
    }, [edges, nodes, validateWorkflow, workflowName]);

    const onGet = useCallback(async () => {
        try {
            const data = await api.getWorkflows();
            const workflows = data.workflows || [];
            const latestWorkflow = workflows.find((workflow: { id: string }) => workflow.id === workflowId) || workflows[0];

            if (!latestWorkflow) {
                setStatus('No saved workflows found.');
                return;
            }

            setNodes(latestWorkflow.nodes || initialNodes);
            setEdges(latestWorkflow.edges || []);
            setWorkflowId(latestWorkflow.id || workflowId);
            setWorkflowName(latestWorkflow.name || latestWorkflow.id || workflowName);
            setWorkflowVersion(latestWorkflow.version);
            setSelectedNode(null);
            setStatus(`Loaded ${workflows.length} latest workflow${workflows.length === 1 ? '' : 's'}.`);
        } catch {
            setStatus('Unable to get workflows.');
        }
    }, [setEdges, setNodes, workflowId, workflowName]);

    const setNodeExecutionStatus = useCallback((nodeId: string, executionStatus: ExecutionStatus) => {
        setNodes((currentNodes) =>
            currentNodes.map((node) =>
                node.id === nodeId
                    ? { ...node, data: { ...node.data, executionStatus } }
                    : node,
            ),
        );
    }, [setNodes]);

    const onExecute = useCallback(async () => {
        const { sequence, error } = buildExecutionSequence(nodes, edges);
        if (error) {
            setStatus(error);
            return;
        }

        setIsExecuting(true);
        setExecutionTrace([]);
        setStatus(`Running ${sequence.length} steps...`);
        setNodes((currentNodes) =>
            currentNodes.map((node) => ({
                ...node,
                data: { ...node.data, executionStatus: 'idle' as ExecutionStatus },
            })),
        );

        let payload: Record<string, unknown> = {
            workflowId,
            workflowName,
            runId: `run_${Date.now()}`,
            startedBy: 'manual',
        };

        for (const node of sequence) {
            const startedAtMs = Date.now();
            const startedAt = new Date(startedAtMs).toISOString();
            const nodeName = String(node.data?.name || node.data?.label || node.id);
            const group = String(node.data?.group || node.data?.category || 'Agent');

            setNodeExecutionStatus(node.id, 'running');

            try {
                const output = await runWorkflowNode(node, payload);
                const finishedAtMs = Date.now();
                const traceStep: WorkflowTraceStep = {
                    id: `${node.id}-${startedAtMs}`,
                    nodeId: node.id,
                    nodeName,
                    group,
                    status: 'success',
                    startedAt,
                    finishedAt: new Date(finishedAtMs).toISOString(),
                    durationMs: finishedAtMs - startedAtMs,
                    input: maskSecrets(payload) as Record<string, unknown>,
                    output: maskSecrets(output) as Record<string, unknown>,
                };

                setExecutionTrace((trace) => [...trace, traceStep]);
                setNodeExecutionStatus(node.id, 'success');
                payload = output;
            } catch (nodeError) {
                const finishedAtMs = Date.now();
                const traceStep: WorkflowTraceStep = {
                    id: `${node.id}-${startedAtMs}`,
                    nodeId: node.id,
                    nodeName,
                    group,
                    status: 'error',
                    startedAt,
                    finishedAt: new Date(finishedAtMs).toISOString(),
                    durationMs: finishedAtMs - startedAtMs,
                    input: maskSecrets(payload) as Record<string, unknown>,
                    error: nodeError instanceof Error ? nodeError.message : 'Unknown execution error',
                };

                setExecutionTrace((trace) => [...trace, traceStep]);
                setNodeExecutionStatus(node.id, 'error');
                setStatus(`Execution stopped at ${nodeName}: ${traceStep.error}`);
                setIsExecuting(false);
                return;
            }
        }

        setIsExecuting(false);
        setStatus(`Execution completed. Captured ${sequence.length} trace steps.`);
    }, [edges, nodes, setNodeExecutionStatus, setNodes, workflowId, workflowName]);

    return (
        <div className="flex h-screen flex-col bg-gray-50">
            {/* Top Bar */}
            <div className="h-16 border-b bg-white flex items-center px-6 justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-semibold text-gray-900">Workflow Builder</h1>
                    <div className="text-sm text-gray-500">
                        {workflowId} • v{workflowVersion ?? 1} • Active
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
                {/* Left Sidebar */}
                <AgentSidebar />

                {/* Canvas */}
                <div className="flex-1 relative" onDragOver={onDragOver} onDrop={onDrop}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        onPaneClick={onPaneClick}
                        nodeTypes={nodeTypes}
                        defaultEdgeOptions={{
                            type: "smoothstep",
                            animated: true,
                        }}
                        connectionLineType={ConnectionLineType.Straight}
                        defaultViewport={{ x: 0, y: 0, zoom: 1 }}

                    >
                        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
                        <Controls />
                        <MiniMap />
                    </ReactFlow>

                    <div className="absolute bottom-4 left-4 right-4 max-h-64 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2">
                            <div>
                                <div className="text-sm font-semibold text-gray-900">Execution Trace</div>
                                <div className="text-xs text-gray-500">Sequential input, output, error, and duration per agent</div>
                            </div>
                            <div className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isExecuting ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                {isExecuting ? 'Running' : `${executionTrace.length} steps`}
                            </div>
                        </div>
                        <div className="max-h-48 overflow-auto p-3">
                            {executionTrace.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500">
                                    Execute the workflow to capture node-level traces.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {executionTrace.map((step, index) => (
                                        <details key={step.id} className="rounded-lg border border-gray-200 bg-white">
                                            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-2 text-sm">
                                                <div className="min-w-0">
                                                    <span className="font-semibold text-gray-900">{index + 1}. {step.nodeName}</span>
                                                    <span className="ml-2 text-xs text-gray-500">{step.group} • {step.durationMs}ms</span>
                                                </div>
                                                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${step.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                    {step.status}
                                                </span>
                                            </summary>
                                            <div className="grid gap-3 border-t border-gray-100 p-3 text-xs md:grid-cols-2">
                                                <div>
                                                    <div className="mb-1 font-semibold text-gray-600">Input</div>
                                                    <pre className="max-h-36 overflow-auto rounded-md bg-gray-950 p-3 text-gray-100">{JSON.stringify(step.input, null, 2)}</pre>
                                                </div>
                                                <div>
                                                    <div className="mb-1 font-semibold text-gray-600">{step.error ? 'Error' : 'Output'}</div>
                                                    <pre className="max-h-36 overflow-auto rounded-md bg-gray-950 p-3 text-gray-100">{step.error || JSON.stringify(step.output, null, 2)}</pre>
                                                </div>
                                            </div>
                                        </details>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel */}
                <PropertiesPanel
                    selectedNode={selectedNode}
                    onClose={() => setSelectedNode(null)}
                    onUpdateNode={onUpdateNode}
                />
            </div>
        </div>
    );
}
