'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/card';
import {
  Activity,
  Zap,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Database,
} from 'lucide-react';
import { useState } from 'react';
import { api, getHeaders } from '@/lib/api';

const TIME_RANGES = [
  { label: '5m', value: 5 },
  { label: '10m', value: 10 },
  { label: '30m', value: 30 },
  { label: '1h', value: 60 },
];

export default function MetricsDashboard() {
  const [timeRange, setTimeRange] = useState(30);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('all');
  const [expandedTrace, setExpandedTrace] = useState<string | null>(null);

  // Fetch all saved workflows for the dropdown selector
  const { data: workflows } = useQuery({
    queryKey: ['saved-workflows-list'],
    queryFn: async () => {
      try {
        return await api.getSavedAgents();
      } catch (err) {
        console.error('Failed to load workflows', err);
        return [];
      }
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['observability-metrics', timeRange, selectedWorkflow],
    queryFn: async () => {
      const url = new URL('http://localhost:8000/api/observability/traces');
      url.searchParams.append('minutes', timeRange.toString());
      if (selectedWorkflow && selectedWorkflow !== 'all') {
        url.searchParams.append('workflow_id', selectedWorkflow);
      }

      const response = await fetch(url.toString(), {
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json();
    },
    refetchInterval: 10000,
  });

  const kpiData = [
    {
      title: 'Total Requests',
      value: data?.summary?.total_requests || 0,
      icon: Activity,
      color: 'text-blue-500',
    },
    {
      title: 'Avg Latency',
      value: `${data?.summary?.avg_latency_ms || 0}ms`,
      icon: Clock,
      color: 'text-amber-500',
    },
    {
      title: 'Error Rate',
      value: `${data?.summary?.error_rate || 0}%`,
      icon: AlertTriangle,
      color: 'text-red-500',
    },
  ];

  if (isLoading) return <div className="p-6">Loading metrics...</div>;
  if (error) return <div className="p-6 text-red-500">Error loading metrics</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Observability Hub</h1>
          <p className="text-gray-400 mt-1">Real-time performance and trace analysis</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
            {TIME_RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  timeRange === range.value
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          <select
            value={selectedWorkflow}
            onChange={(e) => setSelectedWorkflow(e.target.value)}
            className="bg-gray-900 border border-gray-800 text-gray-100 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-600 transition-colors"
          >
            <option value="all">All Workflows</option>
            {workflows?.map((wf: any) => (
              <option key={wf.id} value={wf.id}>
                {wf.name || wf.id}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpiData.map((item, i) => (
          <Card key={i} className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">{item.title}</CardTitle>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold tracking-tight">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-400" />
          Recent Traces
        </h2>
        <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-800/50 text-gray-400 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Workflow ID</th>
                <th className="px-6 py-4 font-semibold">Trace ID</th>
                <th className="px-6 py-4 font-semibold">Latency</th>
                <th className="px-6 py-4 font-semibold">Time</th>
                <th className="px-6 py-4 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {data.traces.map((trace: any) => (
                <>
                  <tr
                    key={trace.trace_id}
                    className="hover:bg-gray-800/30 cursor-pointer transition-colors"
                    onClick={() =>
                      setExpandedTrace(expandedTrace === trace.trace_id ? null : trace.trace_id)
                    }
                  >
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          trace.violations?.length > 0
                            ? 'bg-red-900/40 text-red-400'
                            : 'bg-emerald-900/40 text-emerald-400'
                        }`}
                      >
                        {trace.violations?.length > 0 ? 'Flagged' : 'Healthy'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-200">{trace.workflow_id}</td>
                    <td className="px-6 py-4 font-mono text-gray-400">
                      {trace.trace_id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-gray-300">{trace.latency_ms}ms</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(trace.timestamp * 1000).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {expandedTrace === trace.trace_id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </td>
                  </tr>
                  {expandedTrace === trace.trace_id && (
                    <tr className="bg-gray-950/50">
                      <td colSpan={6} className="px-6 py-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-gray-500 uppercase">
                              Agents Executed
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {trace.agents_executed?.map((agent: string) => (
                                <span
                                  key={agent}
                                  className="bg-gray-800 border border-gray-700 px-2 py-1 rounded text-xs"
                                >
                                  {agent}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-gray-500 uppercase">
                              Trace Data (Raw)
                            </h4>
                            <pre className="p-4 bg-black rounded-lg border border-gray-800 overflow-auto max-h-60 text-[10px] font-mono leading-relaxed">
                              {JSON.stringify(trace, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
