'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Activity,
  Shield,
  Play,
  Square,
  RotateCcw,
  ExternalLink,
  Clock,
  Zap,
  Globe,
  FlaskRound,
} from 'lucide-react';
import Link from 'next/link';

export default function TriggerInstancesPage() {
  const [triggers, setTriggers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const data = await api.getTriggerInstances();
      setTriggers(data);
    } catch (error) {
      console.error('Failed to load trigger instances:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleDeactivate = async (nodeName: string, agentNodeId: string) => {
    const actionKey = `${nodeName}-${agentNodeId}-deactivate`;
    setActionLoading(actionKey);
    try {
      await api.deactivateTrigger(nodeName, agentNodeId);
      await loadData();
    } catch (error) {
      console.error('Deactivation failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivate = async (nodeName: string, agentNodeId: string, workflowId: string) => {
    const actionKey = `${nodeName}-${agentNodeId}-activate`;
    setActionLoading(actionKey);
    try {
      const workflowConfig = await api.getAgentById(workflowId);
      if (!workflowConfig) throw new Error('Workflow config not found');
      await api.activateTrigger(nodeName, agentNodeId, workflowConfig);
      await loadData();
    } catch (error) {
      console.error('Activation failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStopAll = async (nodeName: string) => {
    if (!confirm(`Are you sure you want to stop all instances of ${nodeName}?`)) return;
    setActionLoading(`${nodeName}-stopall`);
    try {
      await api.stopAllTriggers(nodeName);
      await loadData();
    } catch (error) {
      console.error('Stop all failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && triggers.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Activity className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href="/admin" className="hover:text-blue-600 transition-colors">
                Admin Console
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">Running Instances</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Active Triggers</h1>
            <p className="mt-1 text-gray-500">
              Monitor and manage live workflow listeners like Webhooks and Schedulers.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/oauth/gmail"
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50 transition-all"
            >
              <Zap className="h-4 w-4 text-blue-600" /> Connect Google
            </Link>
            <button
              onClick={loadData}
              className="p-2 text-gray-500 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all"
            >
              <RotateCcw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-sm border border-gray-200">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">Admin Console</span>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          {triggers.map((trigger) => (
            <div
              key={trigger.name}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm text-blue-600">
                    {trigger.name.includes('webhook') ? (
                      <Globe className="h-5 w-5" />
                    ) : trigger.name.includes('scheduler') ? (
                      <Clock className="h-5 w-5" />
                    ) : (
                      <Zap className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{trigger.name}</h2>
                    <p className="text-xs text-gray-500">{trigger.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleStopAll(trigger.name)}
                  disabled={
                    trigger.active_instances.length === 0 ||
                    actionLoading === `${trigger.name}-stopall`
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-50 transition-all"
                >
                  <Square className="h-4 w-4 fill-current" /> Stop All Instances
                </button>
              </div>
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-6 py-3">Agent Node ID</th>
                    <th className="px-6 py-3">Workflow</th>
                    <th className="px-6 py-3">Type / Details</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {trigger.active_instances.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-sm text-gray-400 italic"
                      >
                        No active instances running.
                      </td>
                    </tr>
                  ) : (
                    trigger.active_instances.map((instance: any) => (
                      <tr
                        key={instance.agent_node_id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <code className="text-[11px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                            {instance.agent_node_id}
                          </code>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {instance.workflow_id}
                            </span>
                            <Link
                              href={`/workflow-builder?id=${instance.workflow_id}`}
                              target="_blank"
                              className="text-gray-400 hover:text-blue-600"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {instance.type === 'webhook' ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-semibold text-gray-700">
                                POST {instance.path}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono">
                                {instance.host}:{instance.port}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-600">Scheduler Background Task</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${instance.status === 'running' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${instance.status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}
                            />
                            {instance.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {instance.status === 'running' ? (
                              <button
                                onClick={() =>
                                  handleDeactivate(trigger.name, instance.agent_node_id)
                                }
                                disabled={!!actionLoading}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              >
                                {actionLoading ===
                                `${trigger.name}-${instance.agent_node_id}-deactivate` ? (
                                  <Activity className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Square className="h-4 w-4 fill-current" />
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  handleActivate(
                                    trigger.name,
                                    instance.agent_node_id,
                                    instance.workflow_id,
                                  )
                                }
                                disabled={!!actionLoading}
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                              >
                                {actionLoading ===
                                `${trigger.name}-${instance.agent_node_id}-activate` ? (
                                  <Activity className="h-4 w-4 animate-spin" />
                                ) : (
                                  <FlaskRound className="h-4 w-4 fill-current" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={async () => {
                                await handleDeactivate(trigger.name, instance.agent_node_id);
                                await handleActivate(
                                  trigger.name,
                                  instance.agent_node_id,
                                  instance.workflow_id,
                                );
                              }}
                              disabled={!!actionLoading}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
