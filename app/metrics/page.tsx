'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Zap, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function MetricsDashboard() {
  const { data: rawMetrics, isLoading, error } = useQuery({
    queryKey: ['prometheus-metrics'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8000/metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.text();
    },
    refetchInterval: 5000,
  });

  const [parsedMetrics, setParsedMetrics] = useState<any>({});

  useEffect(() => {
    if (rawMetrics) {
      const metrics: any = {};
      const lines = rawMetrics.split('\n');
      lines.forEach(line => {
        if (line.startsWith('#') || !line.trim()) return;
        const match = line.match(/(\w+)(?:\{[^}]*\})?\s+([\d.]+)/);
        if (match) {
          metrics[match[1]] = parseFloat(match[2]);
        }
      });
      setParsedMetrics(metrics);
    }
  }, [rawMetrics]);

  const kpiData = [
    { title: 'Total Requests', value: parsedMetrics.llm_requests_total || 0, icon: Activity },
    { title: 'LLM Calls', value: parsedMetrics.llm_calls_total || 0, icon: Zap },
    { title: 'Avg Latency', value: `${parsedMetrics.avg_latency_ms || 0}ms`, icon: Clock },
  ];

  if (isLoading) return <div className="p-6">Loading metrics...</div>;
  if (error) return <div className="p-6 text-red-500">Error loading metrics</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Observability Dashboard</h1>
        <div className="flex items-center gap-2 text-sm text-emerald-600">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Live (refreshing every 5s)
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpiData.map((item, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <item.icon className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold tracking-tight">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-sm text-muted-foreground">
        Note: Connect backend on port 8000. shadcn/ui Card component assumed - run npx shadcn@latest add card if missing.
      </div>
    </div>
  );
}
