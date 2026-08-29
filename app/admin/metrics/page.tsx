'use client';

import React, { useEffect, useState } from 'react';
import { api, getHeaders } from '@/lib/api';
import { IconMap } from '@/lib/icons';
import { MetricCard } from '@/app/components/MetricCard';
import { JsonTreeView } from '@components/JsonTreeView';
import RunVisualizerModal from '@components/RunVisualizerModal';
import {
  Activity,
  Clock,
  AlertTriangle,
  BookOpen,
  Database,
  FileText,
  ChevronDown,
  ChevronUp,
  Check,
  Copy,
} from 'lucide-react';

interface MetricsTabProps {
  userRole: string | null;
}

export default function MetricsTab({ userRole }: MetricsTabProps) {
  const [metricsData, setMetricsData] = useState<any>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [metricsTimeRange, setMetricsTimeRange] = useState(30);
  const [metricsSelectedWorkflow, setMetricsSelectedWorkflow] = useState('all');
  const [metricsSelectedCustomer, setMetricsSelectedCustomer] = useState('all');
  const [metricsExpandedTrace, setMetricsExpandedTrace] = useState<string | null>(null);
  const [kbMetrics, setKbMetrics] = useState<any>(null);

  const [workflows, setWorkflows] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedTraceForVisualizer, setSelectedTraceForVisualizer] = useState<any | null>(null);
  const [traceViewMode, setTraceViewMode] = useState<'tree' | 'raw'>('tree');
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  const fetchFiltersData = async () => {
    try {
      const workflowsRes = await api.getSavedAgents();
      setWorkflows(workflowsRes || []);
      if (userRole === 'system_admin') {
        const customersRes = await api.getCustomers().catch(() => []);
        setCustomers(customersRes || []);
      }
    } catch (err) {
      console.error('Failed to fetch metrics filter data', err);
    }
  };

  const fetchMetrics = async () => {
    setMetricsLoading(true);
    setMetricsError(null);
    try {
      const url = new URL('http://localhost:8000/api/observability/traces');
      url.searchParams.append('minutes', metricsTimeRange.toString());
      if (metricsSelectedWorkflow && metricsSelectedWorkflow !== 'all') {
        url.searchParams.append('workflow_id', metricsSelectedWorkflow);
      }
      if (
        userRole === 'system_admin' &&
        metricsSelectedCustomer &&
        metricsSelectedCustomer !== 'all'
      ) {
        url.searchParams.append('customer_id', metricsSelectedCustomer);
      }
      const response = await fetch(url.toString(), {
        headers: getHeaders({
          'Content-Type': 'application/json',
        }),
      });
      if (response.ok) {
        const result = await response.json();
        setMetricsData(result);
      } else {
        setMetricsError('Failed to fetch metrics data');
      }

      // Fetch Knowledge Base metrics
      const kbUrl = new URL('http://localhost:8000/api/observability/knowledge-metrics');
      if (
        (userRole === 'system_admin' || userRole === 'admin') &&
        metricsSelectedCustomer &&
        metricsSelectedCustomer !== 'all'
      ) {
        kbUrl.searchParams.append('customer_id', metricsSelectedCustomer);
      }
      const kbRes = await fetch(kbUrl.toString(), {
        headers: getHeaders({
          'Content-Type': 'application/json',
        }),
      });
      if (kbRes.ok) {
        const kbResult = await kbRes.json();
        setKbMetrics(kbResult);
      }
    } catch (err) {
      console.error('Failed to fetch metrics', err);
      setMetricsError('Error connecting to metrics server');
    } finally {
      setMetricsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiltersData();
  }, [userRole]);

  useEffect(() => {
    fetchMetrics();
  }, [metricsTimeRange, metricsSelectedWorkflow, metricsSelectedCustomer]);

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
        fetchMetrics();
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
        fetchMetrics();
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
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-150 pb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-bg-primary animate-pulse" />
          <h2 className="text-xl font-semibold text-black font-sans">
            Performance Metrics & Traces
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Time Range Selector */}
          <select
            value={metricsTimeRange}
            onChange={(e) => setMetricsTimeRange(Number(e.target.value))}
            className="bg-white border border-gray-200 text-gray-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-bg-primary transition-colors cursor-pointer"
          >
            <option value={5}>Last 5 Minutes</option>
            <option value={10}>Last 10 Minutes</option>
            <option value={30}>Last 30 Minutes</option>
            <option value={60}>Last 1 Hour</option>
          </select>

          {/* Workflow Selector */}
          <select
            value={metricsSelectedWorkflow}
            onChange={(e) => setMetricsSelectedWorkflow(e.target.value)}
            className="bg-white border border-gray-200 text-gray-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-bg-primary transition-colors cursor-pointer"
          >
            <option value="all">All Workflows</option>
            {workflows?.map((wf: any) => (
              <option key={wf.id} value={wf.id}>
                {wf.name || wf.id}
              </option>
            ))}
          </select>

          {/* Customer Selector for System Admins */}
          {userRole === 'system_admin' && (
            <select
              value={metricsSelectedCustomer}
              onChange={(e) => setMetricsSelectedCustomer(e.target.value)}
              className="bg-white border border-gray-200 text-gray-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-bg-primary transition-colors cursor-pointer"
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
            onClick={fetchMetrics}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Refresh
          </button>
        </div>
      </div>

      {metricsLoading && !metricsData ? (
        <div className="p-12 text-center text-gray-500 text-sm">Loading metrics data...</div>
      ) : metricsError ? (
        <div className="p-12 text-center text-red-500 text-sm">{metricsError}</div>
      ) : (
        <div className="space-y-6">
          {/* Metrics Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Total Requests"
              value={metricsData?.summary?.total_requests ?? 0}
              icon={<Activity className="h-5 w-5 text-blue-500" />}
            />
            <MetricCard
              title="Avg Latency"
              value={`${metricsData?.summary?.avg_latency_ms ?? 0}ms`}
              icon={<Clock className="h-5 w-5 text-amber-500" />}
            />
            <MetricCard
              title="Error Rate"
              value={`${metricsData?.summary?.error_rate ?? 0}%`}
              icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
            />
          </div>

          {/* Knowledge Base Metrics Cards Grid */}
          {kbMetrics && (
            <div className="space-y-4 border-t pt-6 border-slate-200">
              <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-bg-primary" />
                Knowledge Ingestion Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricCard
                  title="Knowledge Bases"
                  value={kbMetrics.total_kbs}
                  icon={<BookOpen className="h-5 w-5 text-blue-500" />}
                />
                <MetricCard
                  title="Total Indexed Chunks"
                  value={kbMetrics.total_chunks}
                  icon={<Database className="h-5 w-5 text-cyan-500" />}
                />
                <MetricCard
                  title="Ingested Documents"
                  value={`${kbMetrics.documents_by_status?.completed ?? 0} active / ${kbMetrics.total_docs} total`}
                  icon={<FileText className="h-5 w-5 text-green-500" />}
                />
                <MetricCard
                  title="Failed Ingestions"
                  value={kbMetrics.documents_by_status?.failed ?? 0}
                  icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
                />
              </div>
            </div>
          )}

          {/* Traces Table */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-black flex items-center gap-2">
              <IconMap.database className="h-5 w-5 text-bg-primary" />
              Recent Traces
            </h3>
            {!metricsData?.traces || metricsData.traces.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden p-8 text-center">
                <IconMap.activity className="mx-auto h-12 w-12 text-gray-200 mb-4" />
                <p className="text-gray-500 text-sm font-medium">
                  No traces found for the selected filters.
                </p>
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
                      <th className="px-4 py-3 font-semibold text-gray-600">Latency</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Timestamp</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {metricsData.traces.map((trace: any, index: number) => (
                      <React.Fragment key={trace.trace_id || `metric-trace-fallback-${index}`}>
                        <tr
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() =>
                            setMetricsExpandedTrace(
                              metricsExpandedTrace === trace.trace_id ? null : trace.trace_id,
                            )
                          }
                        >
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                trace.status === 'running'
                                  ? 'bg-blue-50 text-bg-primary border border-blue-100 animate-pulse'
                                  : trace.status === 'stopped'
                                    ? 'bg-gray-100 text-gray-600 border border-gray-200'
                                    : trace.status === 'failure' ||
                                        trace.status === 'failed' ||
                                        trace.violations?.length > 0
                                      ? 'bg-red-50 text-red-600 border border-red-100'
                                      : 'bg-green-50 text-green-600 border border-green-100'
                              }`}
                            >
                              {trace.status === 'running'
                                ? 'Running'
                                : trace.status === 'stopped'
                                  ? 'Stopped'
                                  : trace.status === 'failure' ||
                                      trace.status === 'failed' ||
                                      trace.violations?.length > 0
                                    ? 'Failed'
                                    : 'Completed'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900">
                            {trace.workflow_name || trace.workflow_id}
                          </td>
                          <td className="px-4 py-3 font-mono text-gray-500 text-xs">
                            {trace.trace_id?.substring(0, 8)}...
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-600">
                            {trace.customer_id || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-955 font-semibold">
                            {trace.latency_ms}ms
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {new Date(trace.timestamp * 1000).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-3 justify-end w-full">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTraceForVisualizer(trace);
                                }}
                                className="inline-flex items-center gap-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 text-xs font-semibold transition-colors cursor-pointer"
                              >
                                Graph
                              </button>
                              {trace.status === 'running' && (
                                <button
                                  onClick={(e) => handleStopTrace(e, trace.trace_id)}
                                  className="inline-flex items-center gap-1 rounded bg-red-50 hover:bg-red-100 text-red-700 px-2 py-1 text-xs font-semibold transition-colors cursor-pointer"
                                >
                                  Stop
                                </button>
                              )}
                              {trace.status !== 'running' && (
                                <button
                                  onClick={(e) => handleRestartTrace(e, trace.trace_id)}
                                  className="inline-flex items-center gap-1 rounded bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 text-xs font-semibold transition-colors cursor-pointer"
                                >
                                  Restart
                                </button>
                              )}
                              {metricsExpandedTrace === trace.trace_id ? (
                                <ChevronUp className="h-4 w-4 text-gray-400 inline" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-400 inline" />
                              )}
                            </div>
                          </td>
                        </tr>
                        {metricsExpandedTrace === trace.trace_id && (
                          <tr className="bg-gray-50/50 w-full">
                            <td colSpan={7} className="px-6 py-6 border-b border-gray-150 max-w-0">
                              <div className="w-full overflow-hidden">
                                {trace.violations?.length > 0 && (
                                  <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-lg text-xs flex flex-col gap-2">
                                    <span className="text-red-700 font-bold uppercase tracking-wider font-sans">
                                      Violations Detected
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {trace.violations.map((v: string, idx: number) => (
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
                                  <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Trace Payload
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="inline-flex rounded-lg bg-gray-200 p-0.5">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setTraceViewMode('tree');
                                          }}
                                          className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                            traceViewMode === 'tree'
                                              ? 'bg-white text-gray-900 shadow-sm'
                                              : 'text-gray-600 hover:text-gray-900'
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
                                            traceViewMode === 'raw'
                                              ? 'bg-white text-gray-900 shadow-sm'
                                              : 'text-gray-600 hover:text-gray-900'
                                          }`}
                                        >
                                          Raw JSON
                                        </button>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCopyLog(trace);
                                        }}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-605 hover:text-gray-900 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
                                      >
                                        {copiedLogId === trace.trace_id ? (
                                          <>
                                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                                            <span className="text-emerald-500 font-semibold font-sans">
                                              Copied!
                                            </span>
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
                                  <div className="p-4 bg-gray-955 overflow-x-auto">
                                    {traceViewMode === 'tree' ? (
                                      <JsonTreeView data={trace} />
                                    ) : (
                                      <pre className="p-4 bg-gray-950 text-gray-100 rounded-lg overflow-x-auto max-h-[500px] text-[10px] font-mono leading-relaxed select-text w-full min-w-0">
                                        {JSON.stringify(trace, null, 2)}
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
          </div>
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
