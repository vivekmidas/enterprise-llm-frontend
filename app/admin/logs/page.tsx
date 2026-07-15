'use client';

import React, { useEffect, useState } from 'react';
import { api, getHeaders } from '@/lib/api';
import { IconMap } from '@/lib/icons';
import { JsonTreeView } from '@components/JsonTreeView';
import RunVisualizerModal from '@components/RunVisualizerModal';
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface LogsTabProps {
  userRole: string | null;
}

export default function LogsTab({ userRole }: LogsTabProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logMode, setLogMode] = useState<'audit' | 'execution'>('audit');
  const [selectedWorkflowFilter, setSelectedWorkflowFilter] = useState('all');
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState('all');
  const [minutesFilter, setMinutesFilter] = useState(30);
  const [selectedTraceForVisualizer, setSelectedTraceForVisualizer] = useState<any | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [traceViewMode, setTraceViewMode] = useState<'tree' | 'raw'>('tree');
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  const [workflows, setWorkflows] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  const fetchFiltersData = async () => {
    try {
      const workflowsRes = await api.getSavedAgents();
      setWorkflows(workflowsRes || []);
      if (userRole === 'system_admin') {
        const customersRes = await api.getCustomers().catch(() => []);
        setCustomers(customersRes || []);
      }
    } catch (err) {
      console.error('Failed to fetch logs filter data', err);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      if (logMode === 'audit') {
        const auditLogs = await api.getAuditLogs({
          customerId:
            userRole === 'system_admin' && selectedCustomerFilter !== 'all'
              ? selectedCustomerFilter
              : undefined,
          limit: 100,
        });
        setLogs(auditLogs || []);
        setExpandedLogId(null);
        return;
      }

      const url = new URL('http://localhost:8000/api/observability/traces');
      url.searchParams.append('minutes', minutesFilter.toString());
      if (selectedWorkflowFilter && selectedWorkflowFilter !== 'all') {
        url.searchParams.append('workflow_id', selectedWorkflowFilter);
      }
      if (userRole === 'system_admin' && selectedCustomerFilter && selectedCustomerFilter !== 'all') {
        url.searchParams.append('customer_id', selectedCustomerFilter);
      }
      const response = await fetch(url.toString(), {
        headers: getHeaders({
          'Content-Type': 'application/json',
        }),
      });
      if (response.ok) {
        const result = await response.json();
        setLogs(result || []);
      } else {
        setLogs([]);
      }
      setExpandedLogId(null);
    } catch (error) {
      console.error('Failed to fetch logs', error);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiltersData();
  }, [userRole]);

  useEffect(() => {
    fetchLogs();
  }, [logMode, minutesFilter, selectedWorkflowFilter, selectedCustomerFilter]);

  const handleCopyLog = (logData: any) => {
    navigator.clipboard.writeText(JSON.stringify(logData, null, 2));
    setCopiedLogId(logData.trace_id || logData.id);
    setTimeout(() => setCopiedLogId(null), 2000);
  };

  const handleStopTrace = async (e: React.MouseEvent, traceId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to stop this running execution?')) {
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:8000/api/observability/traces/${traceId}/stop`,
        {
          method: 'POST',
          headers: getHeaders({
            'Content-Type': 'application/json',
          }),
        },
      );
      if (response.ok) {
        alert('Stop signal sent successfully.');
        fetchLogs();
      } else {
        const errorData = await response.json();
        alert(`Failed to stop execution: ${errorData.detail || response.statusText}`);
      }
    } catch (err) {
      console.error('Failed to stop trace', err);
      alert('Error occurred while attempting to stop execution.');
    }
  };

  const handleRestartTrace = async (e: React.MouseEvent, traceId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to restart this execution with original inputs?')) {
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:8000/api/observability/traces/${traceId}/restart`,
        {
          method: 'POST',
          headers: getHeaders({
            'Content-Type': 'application/json',
          }),
        },
      );
      if (response.ok) {
        const data = await response.json();
        alert(`Execution successfully restarted! New Trace ID: ${data.new_trace_id}`);
        fetchLogs();
      } else {
        const errorData = await response.json();
        alert(`Failed to restart execution: ${errorData.detail || response.statusText}`);
      }
    } catch (err) {
      console.error('Failed to restart trace', err);
      alert('Error occurred while attempting to restart execution.');
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconMap.activity className="h-5 w-5 text-gray-400" />
          <h2 className="text-xl font-semibold text-black">System Activity Logs</h2>
        </div>
        <div className="flex gap-3">
          <select
            value={logMode}
            onChange={(e) => setLogMode(e.target.value as 'audit' | 'execution')}
            className="bg-white border border-gray-200 text-gray-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-600 transition-colors cursor-pointer"
          >
            <option value="audit">Admin Audit</option>
            <option value="execution">Execution Traces</option>
          </select>

          {/* Time Range Selector */}
          {logMode === 'execution' && (
            <select
              value={minutesFilter}
              onChange={(e) => setMinutesFilter(Number(e.target.value))}
              className="bg-white border border-gray-200 text-gray-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-600 transition-colors cursor-pointer"
            >
              <option value={5}>Last 5 Minutes</option>
              <option value={10}>Last 10 Minutes</option>
              <option value={30}>Last 30 Minutes</option>
              <option value={60}>Last 1 Hour</option>
            </select>
          )}

          {/* Workflow Selector */}
          {logMode === 'execution' && (
            <select
              value={selectedWorkflowFilter}
              onChange={(e) => setSelectedWorkflowFilter(e.target.value)}
              className="bg-white border border-gray-200 text-gray-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-600 transition-colors cursor-pointer"
            >
              <option value="all">All Workflows</option>
              {workflows?.map((wf: any) => (
                <option key={wf.id} value={wf.id}>
                  {wf.name || wf.id}
                </option>
              ))}
            </select>
          )}

          {/* Customer Selector for System Admins */}
          {userRole === 'system_admin' && (
            <select
              value={selectedCustomerFilter}
              onChange={(e) => setSelectedCustomerFilter(e.target.value)}
              className="bg-white border border-gray-200 text-gray-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-600 transition-colors cursor-pointer"
            >
              <option value="all">All Customers</option>
              {customers?.map((cust: any) => (
                <option key={cust.id} value={cust.id}>
                  {cust.name || cust.domain}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={fetchLogs}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Refresh
          </button>
        </div>
      </div>

      {logsLoading ? (
        <div className="p-12 text-center text-gray-500 text-sm">Loading activity logs...</div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden p-8 text-center">
          <IconMap.activity className="mx-auto h-12 w-12 text-gray-200 mb-4" />
          <p className="text-gray-500 text-sm font-medium">
            No {logMode === 'audit' ? 'admin audit' : 'execution'} logs found.
          </p>
        </div>
      ) : logMode === 'audit' ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-gray-50 text-gray-400 uppercase text-xs border-b border-gray-150">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Action</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Resource</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Actor</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Customer ID</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Timestamp</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150">
              {logs.map((log: any, index: number) => (
                <React.Fragment key={log.id || `audit-fallback-${index}`}>
                  <tr
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setExpandedLogId(expandedLogId === String(log.id) ? null : String(log.id))}
                  >
                    <td className="px-4 py-3 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          log.status === 'denied'
                            ? 'bg-red-50 text-red-600 border border-red-100'
                            : 'bg-green-50 text-green-600 border border-green-100'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-900">{log.action}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {log.resource_type}
                      {log.resource_id ? ` #${log.resource_id}` : ''}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {log.actor_role || 'system'} #{log.actor_user_id || '-'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{log.customer_id || '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-right">
                      {expandedLogId === String(log.id) ? (
                        <ChevronUp className="h-4 w-4 text-gray-400 inline" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400 inline" />
                      )}
                    </td>
                  </tr>
                  {expandedLogId === String(log.id) && (
                    <tr className="bg-gray-50/50">
                      <td colSpan={7} className="px-6 py-6 border-b border-gray-150">
                        <JsonTreeView data={log.details || {}} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-gray-50 text-gray-400 uppercase text-xs border-b border-gray-150">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Workflow ID / Name</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Trace ID</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Customer ID</th>
                <th className="px-4 py-3 font-semibold text-gray-600">User ID</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Latency</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Timestamp</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150">
              {logs.map((log: any, index: number) => (
                <React.Fragment key={log.trace_id || `trace-fallback-${index}`}>
                  <tr
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setExpandedLogId(expandedLogId === log.trace_id ? null : log.trace_id)}
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          log.status === 'running'
                            ? 'bg-blue-50 text-blue-600 border border-blue-100 animate-pulse'
                            : log.status === 'stopped'
                              ? 'bg-gray-100 text-gray-600 border border-gray-200'
                              : log.status === 'failure' || log.status === 'failed' || log.violations?.length > 0
                                ? 'bg-red-50 text-red-600 border border-red-100'
                                : 'bg-green-50 text-green-600 border border-green-100'
                        }`}
                      >
                        {log.status === 'running'
                          ? 'Running'
                          : log.status === 'stopped'
                            ? 'Stopped'
                            : log.status === 'failure' || log.status === 'failed' || log.violations?.length > 0
                              ? 'Failed'
                              : 'Completed'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{log.workflow_name || log.workflow_id}</td>
                    <td className="px-4 py-3 font-mono text-gray-500">{log.trace_id?.substring(0, 8)}...</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{log.customer_id || '-'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{log.user_id || '-'}</td>
                    <td className="px-4 py-3 text-gray-955 font-semibold">{log.latency_ms}ms</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(log.timestamp * 1000).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-3 justify-end w-full">
                        {/* Visualizer Graph Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTraceForVisualizer(log);
                          }}
                          className="inline-flex items-center gap-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Graph
                        </button>

                        {/* Stop Execution Button */}
                        {log.status === 'running' && (
                          <button
                            onClick={(e) => handleStopTrace(e, log.trace_id)}
                            className="inline-flex items-center gap-1 rounded bg-red-50 hover:bg-red-100 text-red-700 px-2 py-1 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Stop
                          </button>
                        )}

                        {/* Restart Execution Button */}
                        {log.status !== 'running' && (
                          <button
                            onClick={(e) => handleRestartTrace(e, log.trace_id)}
                            className="inline-flex items-center gap-1 rounded bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Restart
                          </button>
                        )}

                        {expandedLogId === log.trace_id ? (
                          <ChevronUp className="h-4 w-4 text-gray-400 inline" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400 inline" />
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedLogId === log.trace_id && (
                    <tr className="bg-gray-50/50 w-full">
                      <td colSpan={9} className="px-6 py-6 border-b border-gray-150 max-w-0">
                        <div className="w-full overflow-hidden">
                          {log.violations?.length > 0 && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-lg text-xs flex flex-col gap-2">
                              <span className="text-red-700 font-bold uppercase tracking-wider font-sans">Violations Detected</span>
                              <div className="flex flex-wrap gap-1.5">
                                {log.violations.map((v: string, idx: number) => (
                                  <span
                                    key={`${v}-${idx}`}
                                    className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded text-[10px] border border-red-100"
                                  >
                                    {v}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            {/* Tab Header Bar */}
                            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Trace Payload</span>
                              </div>
                              <div className="flex items-center gap-3 ml-0">
                                {/* Segmented Control / Tabs */}
                                <div className="inline-flex rounded-lg bg-gray-200 p-0.5 ml-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTraceViewMode('tree');
                                    }}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                      traceViewMode === 'tree' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                  >
                                    JSON Tree
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTraceViewMode('raw');
                                    }}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                      traceViewMode === 'raw' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                  >
                                    Raw JSON
                                  </button>
                                </div>
                                {/* Copy Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyLog(log);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-650 hover:text-gray-900 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                  {copiedLogId === log.trace_id ? (
                                    <>
                                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                                      <span className="text-emerald-505 font-semibold font-sans">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3.5 w-3.5 text-gray-450" />
                                      <span className="font-sans">Copy JSON</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Tab Content */}
                            <div className="p-4 bg-gray-950 overflow-x-auto">
                              {traceViewMode === 'tree' ? (
                                <JsonTreeView data={log} />
                              ) : (
                                <pre className="p-4 bg-gray-950 text-gray-100 rounded-lg overflow-x-auto max-h-[500px] text-[10px] font-mono leading-relaxed select-text w-full min-w-0">
                                  {JSON.stringify(log, null, 2)}
                                </pre>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Visualizer Modal */}
      {selectedTraceForVisualizer && (
        <RunVisualizerModal
          trace={selectedTraceForVisualizer}
          onClose={() => setSelectedTraceForVisualizer(null)}
        />
      )}
    </section>
  );
}
