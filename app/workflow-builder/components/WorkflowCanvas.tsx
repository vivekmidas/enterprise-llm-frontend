'use client';

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
} from '@xyflow/react';
import { ArrowRightLeft } from 'lucide-react';

import { CustomNode } from '../../components/reactflow/CustomNode';
import type { WorkflowNodeData, WorkflowTraceStep } from '../types';
import { defaultEdgeOptions } from '../workflow-helpers';
import ExecutionTracePanel from './ExecutionTracePanel';
import { CustomLabelEdge } from './CustomEdge';

const nodeTypes = { custom: CustomNode };
const edgeTypes = {
  custom: CustomLabelEdge,
  default: CustomLabelEdge,
};

type WorkflowCanvasProps = {
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  selectedNode: Node<WorkflowNodeData> | null;
  selectedEdge?: Edge | null;
  executionTrace: WorkflowTraceStep[];
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (params: Connection) => void;
  onNodeClick: (event: React.MouseEvent, node: Node<WorkflowNodeData>) => void;
  onEdgeClick?: (edge: Edge) => void;
  onPaneClick: () => void;
  onNodeDragStop: (event: any, node: Node<WorkflowNodeData>) => void;
  onOpenMapper: () => void;
  onClearTrace: () => void;
};

export default function WorkflowCanvas({
  nodes,
  edges,
  selectedNode,
  executionTrace,
  onDragOver,
  onDrop,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onEdgeClick,
  onPaneClick,
  onNodeDragStop,
  onOpenMapper,
  onClearTrace,
}: WorkflowCanvasProps) {
  const isMappingAvailable = selectedNode
    ? edges.some((edge) => edge.target === selectedNode.id)
    : false;

  return (
    <div
      className="flex-1 h-full relative bg-primary overflow-hidden"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={(connection) => connection.source !== connection.target}
        onEdgeClick={(_, edge) => onEdgeClick && onEdgeClick(edge)}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes as NodeTypes}
        edgeTypes={edgeTypes}
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

      <ExecutionTracePanel trace={executionTrace} onClear={onClearTrace} />
    </div>
  );
}
