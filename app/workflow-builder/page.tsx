'use client';

import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
    Node, Edge, addEdge, Connection, useNodesState, useEdgesState,
    Background, Controls, MiniMap
} from 'reactflow';
import 'reactflow/dist/style.css';

import AgentSidebar from '@/components/AgentSidebar';
import WorkflowToolbar from '@/components/WorkflowToolbar';
import PropertiesPanel from '@/components/PropertiesPanel';
import CustomNode from '@/components/CustomNode';

const nodeTypes = { custom: CustomNode };

const initialNodes: Node[] = [
    {
        id: 'start',
        type: 'custom',
        position: { x: 150, y: 150 },
        data: { label: 'Start', category: 'Trigger' },
    }
];

export default function WorkflowBuilder() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    const onConnect = useCallback((params: Connection) =>
        setEdges((eds) => addEdge(params, eds)), [setEdges]);

    const onNodeClick = useCallback((_: any, node: Node) => setSelectedNode(node), []);
    const onPaneClick = () => setSelectedNode(null);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        const agentName = event.dataTransfer.getData('application/reactflow');
        if (!agentName) return;

        const newNode: Node = {
            id: `${agentName}-${Date.now()}`,
            type: 'custom',
            position: { x: event.clientX - 100, y: event.clientY - 50 },
            data: { label: agentName, category: getCategory(agentName) },
        };
        setNodes((nds) => nds.concat(newNode));
    }, [setNodes]);

    const onUpdateNode = useCallback((nodeId: string, newData: any) => {
        setNodes((nds) =>
            nds.map((node) =>
                node.id === nodeId ? { ...node, data: newData } : node
            )
        );
    }, [setNodes]);
    const getCategory = (name: string) => {
        if (name.includes('guard')) return 'Guardrails';
        if (name.includes('validator')) return 'Validation';
        if (name.includes('llm')) return 'LLM';
        return 'Agent';
    };

    return (
        <div className="flex h-screen flex-col bg-gray-50">
            {/* Top Bar */}
            <div className="h-16 border-b bg-white flex items-center px-6 justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-semibold text-gray-900">Workflow Builder</h1>
                    <div className="text-sm text-gray-500">email_channel • v1 • Active</div>
                </div>

                <WorkflowToolbar
                    onSave={() => alert("Workflow Saved Successfully")}
                    onExecute={() => alert("Workflow Execution Started")}
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
                        fitView
                    >
                        <Background />
                        <Controls />
                        <MiniMap />
                    </ReactFlow>
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