'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Scale,
  Zap,
  GitBranch,
  Database,
  Bot,
  Clock,
  Shield,
  ArrowRight,
  Play,
  CheckCircle,
  Layers,
  Tag,
} from 'lucide-react';
import { DEMO_FLOWS, type DemoFlowMeta } from '@/lib/demo-flows';
import { api } from '@/lib/api';

// ─────────────────────────────────────────────
// Industry icon resolver
// ─────────────────────────────────────────────
const IndustryIcon = ({ icon }: { icon: string }) => {
  const map: Record<string, React.ReactNode> = {
    '👥': <Users className="h-6 w-6" />,
    '⚖️': <Scale className="h-6 w-6" />,
  };
  return <>{map[icon] ?? <Zap className="h-6 w-6" />}</>;
};

// ─────────────────────────────────────────────
// Node type badge icons
// ─────────────────────────────────────────────
const tagIconMap: Record<string, React.ReactNode> = {
  LLM: <Bot className="h-3 w-3" />,
  Branching: <GitBranch className="h-3 w-3" />,
  CRM: <Database className="h-3 w-3" />,
  Calendar: <Clock className="h-3 w-3" />,
  Audit: <Shield className="h-3 w-3" />,
  Compliance: <Shield className="h-3 w-3" />,
  DEI: <CheckCircle className="h-3 w-3" />,
  Email: <Zap className="h-3 w-3" />,
  'Risk Scoring': <Layers className="h-3 w-3" />,
};

// ─────────────────────────────────────────────
// DemoCard
// ─────────────────────────────────────────────
function DemoCard({ flow, onLoad }: { flow: DemoFlowMeta; onLoad: (flow: DemoFlowMeta) => void }) {
  const [loading, setLoading] = useState(false);

  const handleLoad = async () => {
    setLoading(true);
    await onLoad(flow);
    setLoading(false);
  };

  return (
    <div
      className="group relative flex flex-col rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      style={{ borderTop: `4px solid ${flow.industryColor}` }}
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-xl text-white shadow-sm"
            style={{ backgroundColor: flow.industryColor }}
          >
            <IndustryIcon icon={flow.industryIcon} />
          </div>
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
            style={{ backgroundColor: `${flow.industryColor}15`, color: flow.industryColor }}
          >
            {flow.industry}
          </span>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">{flow.name}</h3>
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{flow.description}</p>
      </div>

      {/* Stats row */}
      <div className="px-6 pb-4 flex items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <Layers className="h-3.5 w-3.5" />
          <strong className="text-gray-700">{flow.nodeCount}</strong> nodes
        </span>
        <span className="flex items-center gap-1">
          <Zap className="h-3.5 w-3.5" />
          <strong className="text-gray-700">{flow.integrations.length}</strong> integrations
        </span>
      </div>

      {/* Tags */}
      <div className="px-6 pb-5 flex flex-wrap gap-2">
        {flow.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-50 text-gray-600 border border-gray-100"
          >
            {tagIconMap[tag] ?? <Tag className="h-3 w-3" />}
            {tag}
          </span>
        ))}
      </div>

      {/* Integrations */}
      <div className="px-6 pb-5">
        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-medium">
          Integrations
        </p>
        <div className="flex flex-wrap gap-1.5">
          {flow.integrations.map((int) => (
            <span
              key={int}
              className="text-xs px-2 py-0.5 rounded-md bg-gray-50 text-gray-500 border border-gray-100"
            >
              {int}
            </span>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="mt-auto p-6 pt-0">
        <button
          onClick={handleLoad}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait shadow-sm"
          style={{ backgroundColor: flow.industryColor }}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving & Loading…
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Load Demo
              <ArrowRight className="h-4 w-4 ml-auto" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
export default function DemoFlowsPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const handleLoadDemo = async (flow: DemoFlowMeta) => {
    setError(null);
    try {
      // Attempt to save to backend — if it already exists (409/duplicate), swallow and continue
      try {
        await api.saveAgent({
          id: flow.payload.id,
          name: flow.payload.name,
          description: flow.payload.description,
          is_enabled: flow.payload.is_enabled,
          user_id: '0', // will be overridden server-side by auth context
          nodes: flow.payload.nodes as any,
          edges: flow.payload.edges as any,
          category: flow.payload.category,
        });
      } catch {
        // workflow might already exist — fine, proceed to builder
      }

      setSuccessId(flow.id);
      // Navigate to workflow builder with the demo preloaded
      router.push(`/workflow-builder?demo=${flow.id}`);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load demo. Please try again.');
    }
  };

  return (
    <main id="main-content" className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-white border-b border-gray-100 px-6 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-primary bg-violet-50 px-4 py-1.5 rounded-full mb-6">
            <Zap className="h-3.5 w-3.5" />
            Live Demo Flows
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            See nFlow in Action
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            Pre-built, production-ready workflows for real industries. Click{' '}
            <strong className="text-gray-700">Load Demo</strong> to open a flow in the builder —
            inspect every node, run it, and save it as your own.
          </p>
        </div>
      </section>

      {/* Error banner */}
      {error && (
        <div className="max-w-5xl mx-auto mt-6 px-6">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
            <Shield className="h-4 w-4 flex-shrink-0" />
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Success banner */}
      {successId && (
        <div className="max-w-5xl mx-auto mt-6 px-6">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            Demo flow saved and loading in workflow builder…
          </div>
        </div>
      )}

      {/* Flow grid */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {DEMO_FLOWS.map((flow) => (
            <DemoCard key={flow.id} flow={flow} onLoad={handleLoadDemo} />
          ))}
        </div>

        {/* "More coming soon" placeholder */}
        <div className="mt-10 rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
          <p className="text-sm font-medium text-gray-400">
            More industry flows coming — Healthcare, Finance, Manufacturing & more
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-t border-gray-100 px-6 py-14">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            How Demo Flows Work
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Pick a Flow',
                desc: 'Choose an industry use case. Each flow is a complete, production-grade workflow built from reusable nodes.',
                color: '#8b5cf6',
              },
              {
                step: '02',
                title: 'Load & Inspect',
                desc: 'The workflow is saved to your account and opened in the visual builder. Inspect every node, edge, and property.',
                color: '#6366f1',
              },
              {
                step: '03',
                title: 'Customize & Run',
                desc: 'Swap in your own integrations, adjust LLM prompts, add RBAC rules, then execute and monitor in real-time.',
                color: '#3b82f6',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-4 shadow-sm"
                  style={{ backgroundColor: item.color }}
                >
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
