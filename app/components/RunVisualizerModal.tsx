'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CustomNode } from './reactflow/CustomNode';
import { JsonTreeView } from './JsonTreeView';
import { api } from '@/lib/api';
import { X, Play, Square, RefreshCw, Clock, Activity, AlertCircle } from 'lucide-react';

const nodeTypes = {
  custom: CustomNode,
  trigger: CustomNode, // Map trigger/custom to CustomNode
};

interface RunVisualizerModalProps {
  trace: any;
  onClose: () => void;
}

export default function RunVisualizerModal({
  trace: initialTrace,
  onClose,
}: RunVisualizerModalProps) {
  const [trace, setTrace] = useState<any>(initialTrace);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStopping, setIsStopping] = useState(false);

  // Fetch full trace details
  const fetchTraceDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/observability/traces/${initialTrace.trace_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setTrace(data);
        return data;
      }
    } catch (err) {
      console.error('Failed to poll trace details', err);
    }
    return null;
  }, [initialTrace.trace_id]);

  // Load workflow structure and merge with trace logs
  const loadVisualizerData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch workflow definition
      const workflowId = initialTrace.workflow_id;
      const workflowData = await api.getAgentById(workflowId);
      if (!workflowData) {
        throw new Error('Workflow definition not found');
      }

      // 2. Fetch current trace details
      const traceDetails = await fetchTraceDetails();
      const currentTrace = traceDetails || initialTrace;

      // 3. Map execution statuses onto nodes
      const rawNodes = workflowData.nodes || workflowData.nodes_structure || [];
      const mappedNodes = rawNodes.map((n: any) => {
        // Find execution logs for this node
        const nodeHistory = currentTrace.node_history?.[n.id];
        let status: 'idle' | 'running' | 'success' | 'error' = 'idle';
        let output = undefined;
        let error = undefined;
        if (nodeHistory) {
          if (nodeHistory.status === 'running') {
            status = 'running';
          } else if (nodeHistory.status === 'success') {
            status = 'success';
            output = nodeHistory.output_data;
          } else if (nodeHistory.status === 'failure' || nodeHistory.status === 'exception') {
            status = 'error';
            error = nodeHistory.error;
          }
        }

        return {
          id: n.id,
          type: 'custom', // Use CustomNode layout
          position: n.position || { x: 0, y: 0 },
          data: {
            ...n.data,
            label: n.data?.label || n.data?.name || n.id,
            node_type: n.type || n.data?.node_type || 'agent',
            executionStatus: status,
            output,
            error,
            readOnly: true,
          },
        };
      });

      setNodes(mappedNodes);
      setEdges(workflowData.edges || []);
    } catch (err: any) {
      console.error('Failed to load visualizer', err);
      setError(err.message || 'Failed to initialize execution visualizer');
    } finally {
      setLoading(false);
    }
  }, [initialTrace, fetchTraceDetails, setNodes, setEdges]);

  useEffect(() => {
    loadVisualizerData();
  }, [loadVisualizerData]);

  // Auto-polling for active/running tasks
  useEffect(() => {
    if (trace.status !== 'running') return;

    const interval = setInterval(async () => {
      const updatedTrace = await fetchTraceDetails();
      if (updatedTrace) {
        // Re-map execution status of nodes
        setNodes((prevNodes) =>
          prevNodes.map((n) => {
            const nodeHistory = updatedTrace.node_history?.[n.id];
            let status: 'idle' | 'running' | 'success' | 'error' = 'idle';
            let output = undefined;
            let error = undefined;
            if (nodeHistory) {
              if (nodeHistory.status === 'running') {
                status = 'running';
              } else if (nodeHistory.status === 'success') {
                status = 'success';
                output = nodeHistory.output_data;
              } else if (nodeHistory.status === 'failure' || nodeHistory.status === 'exception') {
                status = 'error';
                error = nodeHistory.error;
              }
            }
            return {
              ...n,
              data: {
                ...n.data,
                executionStatus: status,
                output,
                error,
                readOnly: true,
              },
            };
          }),
        );

        // If the workflow is no longer running, clear interval
        if (updatedTrace.status !== 'running') {
          clearInterval(interval);
        }
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [trace.status, fetchTraceDetails, setNodes]);

  // Handle Stop execution action
  const handleStopExecution = async () => {
    if (!confirm('Are you sure you want to stop this running workflow?')) return;
    setIsStopping(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/observability/traces/${trace.trace_id}/stop`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.ok) {
        alert('Stop signal sent.');
        await fetchTraceDetails();
      } else {
        const errData = await response.json();
        alert(`Failed to stop: ${errData.detail}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error occurred while attempting to stop.');
    } finally {
      setIsStopping(false);
    }
  };

  // Node click selection for inspection drawer
  const onNodeClick = (_: any, node: Node) => {
    const nodeHistory = trace.node_history?.[node.id];
    const nodePayloads = trace.context?.nodes?.[node.id]?.data || {};
    setSelectedNode({
      id: node.id,
      label: node.data.label,
      node_type: node.data.node_type,
      status: nodeHistory?.status || 'idle',
      latency_ms: nodeHistory?.latency_ms || 0,
      input: nodeHistory?.input_data || nodePayloads.input_data || null,
      output: nodeHistory?.output_data || nodePayloads.output_data || null,
      error: nodeHistory?.error || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/70 backdrop-blur-sm p-6">
      <div className="relative flex flex-col w-full h-full max-w-6xl bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-150 px-6 py-4 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-blue-50 text-bg-primary`}>
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Observability Visualizer: {trace.workflow_name || trace.workflow_id}
              </h2>
              <p className="text-xs text-gray-500 font-mono">Trace ID: {trace.trace_id}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Indicator */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                trace.status === 'running'
                  ? 'bg-blue-50 text-bg-primary border-blue-200 animate-pulse'
                  : trace.status === 'stopped'
                    ? 'bg-gray-100 text-gray-600 border-gray-300'
                    : trace.status === 'failure' || trace.status === 'failed'
                      ? 'bg-rose-50 text-rose-600 border-rose-200'
                      : 'bg-emerald-50 text-emerald-600 border-emerald-200'
              }`}
            >
              {trace.status}
            </span>

            {/* Action buttons */}
            {trace.status === 'running' && (
              <button
                onClick={handleStopExecution}
                disabled={isStopping}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 transition-colors disabled:opacity-50"
              >
                <Square className="h-3.5 w-3.5 fill-red-700" />
                Stop Run
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Area */}
        <div className="flex flex-1 relative overflow-hidden bg-gray-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center w-full h-full gap-3">
              <RefreshCw className="h-8 w-8 text-bg-primary animate-spin" />
              <span className="text-sm font-semibold text-gray-500">
                Loading execution graph...
              </span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center w-full h-full gap-3 p-6 text-center">
              <AlertCircle className="h-12 w-12 text-rose-500" />
              <h3 className="text-lg font-bold text-gray-900">Visualizer Error</h3>
              <p className="text-sm text-gray-500 max-w-md">{error}</p>
            </div>
          ) : (
            <div className="flex w-full h-full relative">
              {/* ReactFlow Canvas */}
              <div className="flex-1 h-full relative">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  nodeTypes={nodeTypes}
                  onNodeClick={onNodeClick}
                  nodesDraggable={false}
                  nodesConnectable={false}
                  edgesFocusable={false}
                  elementsSelectable={true}
                  fitView
                  minZoom={0.2}
                  maxZoom={1.5}
                >
                  <Background color="#cbd5e1" gap={16} size={1} />
                  <Controls className="!bg-white !border-gray-200 !shadow-md" />
                </ReactFlow>
              </div>

              {/* Node Inspector side Drawer */}
              {selectedNode && (
                <div className="w-96 border-l border-gray-200 bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
                  <div className="flex items-center justify-between border-b border-gray-150 px-4 py-3 bg-gray-50">
                    <div>
                      <h3 className="text-sm font-bold text-gray-950 truncate max-w-[200px]">
                        {selectedNode.label}
                      </h3>
                      <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                        {selectedNode.node_type}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Node Metadata block */}
                    <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-150 text-xs">
                      <div>
                        <span className="text-gray-500 font-medium block">Status</span>
                        <span
                          className={`font-bold uppercase ${
                            selectedNode.status === 'success'
                              ? 'text-emerald-600'
                              : selectedNode.status === 'running'
                                ? 'text-bg-primary animate-pulse'
                                : selectedNode.status === 'exception' ||
                                    selectedNode.status === 'failure'
                                  ? 'text-rose-600'
                                  : 'text-gray-500'
                          }`}
                        >
                          {selectedNode.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium block">Latency</span>
                        <span className="font-bold text-gray-800 inline-flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          {selectedNode.latency_ms > 0 ? `${selectedNode.latency_ms}ms` : '-'}
                        </span>
                      </div>
                    </div>

                    {/* Error display */}
                    {selectedNode.error && (
                      <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-xs">
                        <span className="text-rose-700 font-bold uppercase tracking-wider block mb-1">
                          Error Details
                        </span>
                        <p className="text-rose-600 font-mono font-medium whitespace-pre-wrap">
                          {selectedNode.error}
                        </p>
                      </div>
                    )}

                    {/* Input Payload */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Node Input
                      </h4>
                      {selectedNode.input ? (
                        <JsonTreeView data={selectedNode.input} />
                      ) : (
                        <div className="text-center text-xs text-gray-400 py-3 bg-gray-50 border border-dashed border-gray-200 rounded-lg">
                          No input payload captured
                        </div>
                      )}
                    </div>

                    {/* Output Payload */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Node Output
                      </h4>
                      {selectedNode.output ? (
                        <JsonTreeView data={selectedNode.output} />
                      ) : (
                        <div className="text-center text-xs text-gray-400 py-3 bg-gray-50 border border-dashed border-gray-200 rounded-lg">
                          No output payload captured
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
