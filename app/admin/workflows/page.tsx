'use client';

import React, { useEffect, useState } from 'react';
import { api, getHeaders } from '@/lib/api';
import { IconMap } from '@/lib/icons';
import { Workflow, List, LayoutGrid } from 'lucide-react';

interface WorkflowsTabProps {
  userRole: string | null;
}

export default function WorkflowsTab({ userRole }: WorkflowsTabProps) {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [workflowViewMode, setWorkflowViewMode] = useState<'list' | 'card'>('list');

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const workflowsRes = await api.getSavedAgents();
      setWorkflows(workflowsRes || []);
    } catch (err) {
      console.error('Failed to fetch workflows', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleToggleWorkflow = async (id: string) => {
    try {
      await api.toggleWorkflowStatus(id);
      fetchWorkflows();
    } catch (err) {
      console.error('Failed to toggle workflow status', err);
    }
  };

  const handleClearWorkflowCache = async (workflowId?: string) => {
    if (workflowId) {
      if (!confirm('Are you sure you want to clear the compiled graph cache for this workflow?'))
        return;
    } else {
      if (
        !confirm(
          'Are you sure you want to clear the entire compiled graph cache? This will cause all workflows to rebuild on their next run.',
        )
      )
        return;
    }

    try {
      const url = new URL('http://localhost:8000/workflows/cache/clear');
      if (workflowId) {
        url.searchParams.append('workflow_id', workflowId);
      }

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: getHeaders({
          'Content-Type': 'application/json',
        }),
      });

      if (response.ok) {
        alert(
          workflowId
            ? 'Workflow cache cleared successfully.'
            : 'Entire graph cache cleared successfully.',
        );
      } else {
        const errorData = await response.json();
        alert(`Failed to clear cache: ${errorData.detail || response.statusText}`);
      }
    } catch (err) {
      console.error('Failed to clear graph cache', err);
      alert('Error occurred while clearing graph cache.');
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this workflow? This will remove the workflow, its nodes, node properties, and related workflow settings.',
      )
    ) {
      return;
    }

    try {
      await api.deleteWorkflow(workflowId);
      fetchWorkflows();
    } catch (err) {
      console.error('Failed to delete workflow', err);
      alert(err instanceof Error ? err.message : 'Failed to delete workflow.');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400 text-sm">Loading workflows...</div>;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Workflow className="h-5 w-5 text-gray-400" />
          <h2 className="text-xl font-semibold text-black">Workflow Catalog</h2>
        </div>
        <div className="flex items-center gap-3">
          {(userRole === 'admin' || userRole === 'system_admin') && (
            <button
              onClick={() => handleClearWorkflowCache()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
              title="Clear all compiled workflows from memory cache"
            >
              <IconMap.refreshCw className="h-3.5 w-3.5" />
              Clear Cache
            </button>
          )}
          {/* View Mode Toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg p-0.5 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setWorkflowViewMode('list')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                workflowViewMode === 'list'
                  ? 'bg-blue-50 text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              List
            </button>
            <button
              type="button"
              onClick={() => setWorkflowViewMode('card')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                workflowViewMode === 'card'
                  ? 'bg-blue-50 text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Card
            </button>
          </div>
        </div>
      </div>

      {workflowViewMode === 'list' ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-xs text-gray-500 uppercase font-bold">
                  Workflow Name / ID
                </th>
                <th className="px-4 py-3 text-xs text-gray-500 uppercase font-bold">Description</th>
                <th className="px-4 py-3 text-xs text-gray-500 uppercase font-bold text-center">
                  Nodes
                </th>
                <th className="px-4 py-3 text-xs text-gray-500 uppercase font-bold text-center">
                  Edges
                </th>
                <th className="px-4 py-3 text-xs text-gray-500 uppercase font-bold">Status</th>
                <th className="px-4 py-3 text-xs text-gray-500 uppercase font-bold text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {workflows.map((wf) => (
                <tr key={wf.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-black">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100 flex-shrink-0">
                        <Workflow className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-black">{wf.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{wf.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate">
                    {wf.description || (
                      <span className="text-gray-400 italic">No description provided.</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 font-semibold text-center">
                    {wf.graph?.nodes?.length || 0}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 font-semibold text-center">
                    {wf.graph?.edges?.length || 0}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border ${
                        wf.is_enabled !== false
                          ? 'bg-green-50 text-green-700 border-green-100'
                          : 'bg-red-50 text-red-700 border-red-100'
                      }`}
                    >
                      {wf.is_enabled !== false ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-right">
                    <div className="flex items-center justify-end gap-2">
                      {(userRole === 'admin' || userRole === 'system_admin') && (
                        <>
                          <button
                            onClick={() => handleClearWorkflowCache(wf.id)}
                            className="p-1.5 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Clear Workflow Cache"
                          >
                            <IconMap.refreshCw className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleWorkflow(wf.id)}
                            className={`p-1.5 rounded transition-colors cursor-pointer ${
                              wf.is_enabled !== false
                                ? 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                : 'text-gray-400 hover:text-green-500 hover:bg-green-50'
                            }`}
                            title={wf.is_enabled !== false ? 'Disable' : 'Enable'}
                          >
                            <IconMap.power className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteWorkflow(wf.id)}
                        className="p-1.5 rounded text-gray-400 hover:text-red-650 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Workflow"
                      >
                        <IconMap.trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {workflows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500 text-sm">
                    <div className="flex flex-col items-center">
                      <IconMap.workflow className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                      <h3 className="text-sm font-semibold text-gray-900">No workflows found</h3>
                      <p className="mt-1 text-sm text-gray-500 font-medium">
                        Get started by creating a new workflow in the builder.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workflows.map((wf) => (
            <div
              key={wf.id}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                    <Workflow className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-black">{wf.name}</h3>
                    <p className="text-[10px] text-gray-400 font-mono">{wf.id}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border ${
                      wf.is_enabled !== false
                        ? 'bg-green-50 text-green-700 border-green-100'
                        : 'bg-red-50 text-red-700 border-red-100'
                    }`}
                  >
                    {wf.is_enabled !== false ? 'Active' : 'Disabled'}
                  </span>
                  <div className="flex gap-1">
                    {(userRole === 'admin' || userRole === 'system_admin') && (
                      <>
                        <button
                          onClick={() => handleClearWorkflowCache(wf.id)}
                          className="p-1 rounded text-gray-400 hover:text-blue-500 transition-colors cursor-pointer"
                          title="Clear Workflow Cache"
                        >
                          <IconMap.refreshCw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleWorkflow(wf.id)}
                          className={`p-1 rounded transition-colors cursor-pointer ${
                            wf.is_enabled !== false
                              ? 'text-gray-400 hover:text-red-500'
                              : 'text-gray-400 hover:text-green-500'
                          }`}
                          title={wf.is_enabled !== false ? 'Disable' : 'Enable'}
                        >
                          <IconMap.power className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDeleteWorkflow(wf.id)}
                      className="p-1 text-gray-400 hover:text-red-650 transition-colors cursor-pointer"
                      title="Delete Workflow"
                    >
                      <IconMap.trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {wf.description || 'No description provided.'}
                </p>
                <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Nodes</span>
                    <span className="text-sm font-semibold text-black">
                      {wf.graph?.nodes?.length || 0}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Edges</span>
                    <span className="text-sm font-semibold text-black">
                      {wf.graph?.edges?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {workflows.length === 0 && (
            <div className="col-span-full py-12 text-center rounded-xl border-2 border-dashed border-gray-200">
              <IconMap.workflow className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No workflows found</h3>
              <p className="mt-1 text-sm text-gray-500 font-medium">
                Get started by creating a new workflow in the builder.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
