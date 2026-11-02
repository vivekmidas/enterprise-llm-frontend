'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { api, getHeaders } from '@/lib/api';
import { IconMap } from '@/lib/icons';
import {
  Workflow,
  List,
  LayoutGrid,
  Download,
  Upload,
  FileUp,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
} from 'lucide-react';

interface WorkflowsTabProps {
  userRole: string | null;
  customerId?: string | number | null;
}

function downloadJsonFile(data: any, defaultFilename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = defaultFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function WorkflowsTab({ userRole, customerId }: WorkflowsTabProps) {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [workflowViewMode, setWorkflowViewMode] = useState<'list' | 'card'>('list');

  // Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const targetCid =
        customerId !== undefined &&
        customerId !== null &&
        customerId !== 'all' &&
        !Number.isNaN(customerId) &&
        String(customerId) !== 'NaN' &&
        String(customerId) !== 'undefined' &&
        String(customerId) !== 'null'
          ? String(customerId)
          : undefined;
      const workflowsRes = await api.getSavedAgents(targetCid);
      setWorkflows(workflowsRes || []);
    } catch (err) {
      console.error('Failed to fetch workflows', err);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

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

  const handleExportSingle = async (wfId: string, wfName: string) => {
    try {
      const data = await api.exportWorkflow(wfId);
      const safeName = (wfName || wfId || 'workflow').toLowerCase().replace(/[^a-z0-9]+/g, '_');
      downloadJsonFile(data, `${safeName}_backup.json`);
    } catch (err: any) {
      console.error('Failed to export workflow', err);
      alert(err?.message || 'Failed to export workflow');
    }
  };

  const handleExportAll = async () => {
    try {
      const data = await api.exportWorkflows();
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      downloadJsonFile(data, `workflows_backup_${ts}.json`);
    } catch (err: any) {
      console.error('Failed to export all workflows', err);
      alert(err?.message || 'Failed to export workflows');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportError(null);
    setImportResult(null);

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      setImportPreview(json);
    } catch {
      setImportError('Invalid JSON file format. Please upload a valid JSON backup.');
      setImportPreview(null);
    }
  };

  const handleExecuteImport = async () => {
    if (!importPreview) return;
    setImporting(true);
    setImportError(null);
    try {
      const res = await api.importWorkflows(importPreview);
      setImportResult(res);
      await fetchWorkflows();
    } catch (err: any) {
      console.error('Failed to import workflows', err);
      setImportError(err?.message || 'Failed to import workflows');
    } finally {
      setImporting(false);
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

          {/* Export All */}
          <button
            onClick={handleExportAll}
            disabled={workflows.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export all workflows as a single backup JSON file"
          >
            <Download className="h-3.5 w-3.5 text-gray-500" />
            Export All
          </button>

          {/* Import Workflows */}
          <button
            onClick={() => {
              setImportFile(null);
              setImportPreview(null);
              setImportError(null);
              setImportResult(null);
              setIsImportModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 transition-colors shadow-sm cursor-pointer"
            title="Import / restore workflows from a backup JSON file"
          >
            <Upload className="h-3.5 w-3.5 text-purple-600" />
            Import Workflows
          </button>
          {/* View Mode Toggle */}
          <div className="flex items-center border border-border rounded-lg p-0.5 shadow-sm bg-background">
            <button
              type="button"
              onClick={() => setWorkflowViewMode('list')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                workflowViewMode === 'list'
                  ? 'bg-accent text-foreground border border-ring'
                  : 'text-muted-foreground hover:text-foreground'
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
                  ? 'bg-accent text-foreground border border-ring'
                  : 'text-muted-foreground hover:text-foreground'
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
                        onClick={() => handleExportSingle(wf.id, wf.name)}
                        className="p-1.5 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="Export Workflow Backup JSON"
                      >
                        <Download className="h-4 w-4" />
                      </button>
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
                      onClick={() => handleExportSingle(wf.id, wf.name)}
                      className="p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                      title="Export Workflow Backup JSON"
                    >
                      <Download className="h-4 w-4" />
                    </button>
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

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-600 border border-purple-100">
                  <FileUp className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Import Workflows</h3>
                  <p className="text-xs text-gray-500">Restore workflows from a JSON backup file</p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content / Upload Section */}
            {!importResult ? (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-purple-400 rounded-xl p-6 text-center cursor-pointer bg-gray-50/50 hover:bg-purple-50/20 transition-all"
                >
                  <Upload className="h-8 w-8 text-purple-500 mb-2" />
                  <p className="text-sm font-semibold text-gray-700">
                    {importFile ? importFile.name : 'Click to select JSON backup file'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Accepts .json single or multi-workflow export bundles</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                {importError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{importError}</span>
                  </div>
                )}

                {importPreview && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700">Backup Preview</span>
                      <span className="text-[10px] font-mono bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                        {Array.isArray(importPreview.workflows)
                          ? `${importPreview.workflows.length} workflow(s)`
                          : '1 workflow'}
                      </span>
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1 text-xs text-gray-600 divide-y divide-gray-100">
                      {Array.isArray(importPreview.workflows) ? (
                        importPreview.workflows.map((w: any, idx: number) => (
                          <div key={idx} className="pt-1 flex items-center justify-between">
                            <span className="font-medium text-gray-800">{w.name || 'Untitled'}</span>
                            <span className="text-[10px] text-gray-400">{w.nodes?.length || 0} nodes</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-800">{importPreview.name || 'Untitled'}</span>
                          <span className="text-[10px] text-gray-400">{importPreview.nodes?.length || 0} nodes</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Safe copy notice */}
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-blue-600 mt-0.5" />
                  <p>
                    <strong>Duplicate Safe:</strong> Existing workflows will never be overwritten. Workflows with matching names will automatically be created as copies. Node permissions are enforced.
                  </p>
                </div>
              </div>
            ) : (
              /* Success / Result View */
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-800">
                      Import Complete: {importResult.imported_count} workflow(s) imported
                    </h4>
                    {importResult.failed_count > 0 && (
                      <p className="text-xs text-red-600">{importResult.failed_count} workflow(s) failed.</p>
                    )}
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-xl p-2 bg-gray-50 text-xs">
                  {importResult.workflows?.map((w: any, idx: number) => (
                    <div key={idx} className="py-2 px-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-800">{w.name}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            w.is_runnable ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {w.is_runnable ? 'Ready' : 'Unrunnable (Node Missing)'}
                        </span>
                      </div>
                      {w.warnings && w.warnings.length > 0 && (
                        <ul className="text-[10px] text-amber-700 list-disc list-inside">
                          {w.warnings.map((warn: string, widx: number) => (
                            <li key={widx}>{warn}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                {importResult ? 'Close' : 'Cancel'}
              </button>

              {!importResult && (
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={!importPreview || importing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 rounded-lg shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5" />
                      Confirm Import
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
