'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Workflow,
  Zap,
  Shield,
  Activity,
  ArrowRight,
  Blocks,
  Plug,
  Eye,
  Lock,
  Users,
  Sparkles,
  ChevronRight,
  Check,
  Globe,
  Database,
  Mail,
  MessageSquare,
  FileText,
  BarChart3,
  GitBranch,
  Play,
  CircleDot,
  Bot,
  Layers,
  Timer,
  Settings,
  Code2,
  Rocket,
  Clock,
  Star,
} from 'lucide-react';

/* ─── Animated floating node for hero background ─── */
function FloatingNode({
  icon: Icon,
  label,
  x,
  y,
  delay,
  color,
}: {
  icon: React.ElementType;
  label: string;
  x: string;
  y: string;
  delay: number;
  color: string;
}) {
  return (
    <div
      className="absolute hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm text-xs font-medium text-white/70 select-none pointer-events-none"
      style={{
        left: x,
        top: y,
        animation: `float ${3 + delay}s ease-in-out ${delay}s infinite alternate`,
      }}
    >
      <Icon className="h-3.5 w-3.5" style={{ color }} />
      {label}
    </div>
  );
}

/* ─── Animated connection line ─── */
function ConnectionLine({ from, to, delay }: { from: string; to: string; delay: number }) {
  return (
    <div
      className="absolute hidden lg:block h-px bg-gradient-to-r from-violet-500/30 to-cyan-500/30"
      style={{
        left: from,
        top: to,
        width: '120px',
        transform: 'rotate(-15deg)',
        animation: `pulse-line 2s ease-in-out ${delay}s infinite`,
      }}
    />
  );
}

/* ─── Feature Card ─── */
function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  delay: number;
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="group relative p-6 rounded-2xl border border-gray-800/60 bg-gray-900/50 backdrop-blur-sm hover:border-gray-700/80 transition-all duration-500 hover:shadow-2xl hover:shadow-violet-500/5 hover:-translate-y-1"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `all 0.6s cubic-bezier(0.22,1,0.36,1) ${delay * 100}ms`,
      }}
    >
      <div
        className="h-11 w-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
        style={{ backgroundColor: `${color}15`, border: `1px solid ${color}25` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

/* ─── Integration pill ─── */
function IntegrationPill({
  icon: Icon,
  name,
  color,
}: {
  icon: React.ElementType;
  name: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-gray-800/60 bg-gray-900/40 hover:border-gray-700 hover:bg-gray-800/60 transition-all duration-300 cursor-default group">
      <Icon className="h-4 w-4 transition-transform group-hover:scale-110" style={{ color }} />
      <span className="text-sm font-medium text-gray-300">{name}</span>
    </div>
  );
}

/* ─── Stat counter ─── */
function StatCounter({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
        {value}
      </div>
      <div className="text-sm text-gray-500 mt-1 font-medium">{label}</div>
    </div>
  );
}

/* ─── Workflow preview node ─── */
function WorkflowNode({
  icon: Icon,
  label,
  color,
  active,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all duration-300 ${active ? 'shadow-lg scale-105' : 'hover:scale-105'}`}
      style={{
        borderColor: active ? color : 'rgba(255,255,255,0.08)',
        backgroundColor: active ? `${color}12` : 'rgba(255,255,255,0.03)',
        boxShadow: active ? `0 0 24px ${color}20` : 'none',
      }}
    >
      <Icon className="h-4 w-4" style={{ color }} />
      <span className="text-gray-200">{label}</span>
    </div>
  );
}

/* ═════════════════════════════════════════════════ */
/*                    MAIN PAGE                      */
/* ═════════════════════════════════════════════════ */
export default function LandingPage() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 5);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-primary text-white font-sans overflow-x-hidden">
      {/* ── HERO ── */}
      <section className="relative px-6 pt-16 pb-28 md:pt-24 md:pb-40 overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/8 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/6 blur-[100px]" />
          <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] rounded-full bg-fuchsia-500/5 blur-[80px]" />
        </div>

        {/* Floating nodes */}
        <FloatingNode icon={Mail} label="Email Trigger" x="8%" y="20%" delay={0} color="#8b5cf6" />
        <FloatingNode icon={Clock} label="Scheduler" x="18%" y="40%" delay={0} color="#f6c55cff" />
        <FloatingNode icon={Bot} label="AI Agent" x="82%" y="15%" delay={0.5} color="#06b6d4" />
        <FloatingNode icon={Database} label="CRM Sync" x="75%" y="65%" delay={1} color="#10b981" />
        <FloatingNode icon={FileText} label="PDF Parser" x="5%" y="70%" delay={1.5} color="#f59e0b" />
        <FloatingNode icon={MessageSquare} label="Slack Notify" x="88%" y="45%" delay={0.8} color="#ec4899" />

        <div className="relative max-w-5xl mx-auto text-center z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold uppercase tracking-wider mb-8 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Built for growing businesses
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] mb-6">
            <span className="text-white">Automate </span>
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              everything.
            </span>
            <br />
            <span className="text-gray-400 text-4xl md:text-5xl lg:text-6xl font-bold">
              Own your workflows.
            </span>
          </h1>

          {/* Sub */}
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            nFlow is the open-source workflow automation platform that lets small &amp; mid-size
            enterprises connect internal systems, launch custom nodes, and orchestrate AI-powered
            processes — with full RBAC and observability built in.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="group w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white px-8 py-4 rounded-2xl text-lg font-bold transition-all duration-300 shadow-xl shadow-violet-500/20 hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Free
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/admin"
              className="group w-full sm:w-auto flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-gray-200 px-8 py-4 rounded-2xl text-lg font-bold hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm"
            >
              <Play className="h-5 w-5 text-violet-400" />
              View Live Demo
            </Link>
          </div>

          {/* Trust bar */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-8 md:gap-12">
            <StatCounter value="10K+" label="Workflows Run" />
            <div className="h-8 w-px bg-gray-800 hidden md:block" />
            <StatCounter value="500+" label="SME Teams" />
            <div className="h-8 w-px bg-gray-800 hidden md:block" />
            <StatCounter value="99.9%" label="Uptime" />
            <div className="h-8 w-px bg-gray-800 hidden md:block" />
            <StatCounter value="<200ms" label="Avg Latency" />
          </div>
        </div>
      </section>

      {/* ── WORKFLOW VISUAL PREVIEW ── */}
      <section className="px-6 py-20 md:py-28 border-t border-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
              Build workflows{' '}
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                visually
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Drag, drop, and connect nodes to automate complex business processes. No code
              required. From triggers to AI agents to database writes — it all flows together.
            </p>
          </div>

          {/* Workflow canvas mockup */}
          <div className="relative rounded-3xl border border-gray-800/60 bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm p-8 md:p-12 overflow-hidden">
            {/* Dot grid background */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            <div className="relative flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
              {/* Node chain */}
              {[
                { icon: Zap, label: 'Webhook Trigger', color: '#8b5cf6', step: 0 },
                { icon: GitBranch, label: 'Route Logic', color: '#f59e0b', step: 1 },
                { icon: Bot, label: 'AI Summarize', color: '#06b6d4', step: 2 },
                { icon: Database, label: 'Store Results', color: '#10b981', step: 3 },
                { icon: MessageSquare, label: 'Notify Team', color: '#ec4899', step: 4 },
              ].map((node, i) => (
                <React.Fragment key={node.label}>
                  <WorkflowNode
                    icon={node.icon}
                    label={node.label}
                    color={node.color}
                    active={activeStep === node.step}
                  />
                  {i < 4 && (
                    <ChevronRight
                      className={`h-4 w-4 hidden md:block transition-colors duration-300 ${activeStep === i ? 'text-violet-400' : 'text-gray-700'}`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Active execution indicator */}
            <div className="flex items-center justify-center gap-2 mt-8 text-xs text-gray-500">
              <CircleDot className="h-3 w-3 text-green-500 animate-pulse" />
              <span>Live execution preview</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE FEATURES ── */}
      <section className="px-6 py-20 md:py-28 border-t border-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
              Everything your team needs
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Purpose-built for enterprises that refuse to overpay for automation. Powerful enough
              for complex workflows, simple enough for your whole team.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              icon={Workflow}
              title="Visual Workflow Builder"
              description="Drag-and-drop interface to design multi-step automations. Connect triggers, conditions, AI agents, and actions in a clean canvas."
              color="#8b5cf6"
              delay={0}
            />
            <FeatureCard
              icon={Blocks}
              title="Custom Nodes & Plugins"
              description="Launch your own workflow nodes. Write custom logic in Python or JavaScript and plug them into any workflow instantly."
              color="#06b6d4"
              delay={1}
            />
            <FeatureCard
              icon={Plug}
              title="Internal System Integration"
              description="Connect to your CRM, ERP, databases, APIs, and legacy systems. Pre-built connectors for Salesforce, SAP, PostgreSQL, and more."
              color="#10b981"
              delay={2}
            />
            <FeatureCard
              icon={Shield}
              title="Enterprise RBAC"
              description="Fine-grained role-based access control. Define who can create, edit, execute, or view workflows at team and org level."
              color="#f59e0b"
              delay={3}
            />
            <FeatureCard
              icon={Eye}
              title="Full Observability"
              description="MELT stack built-in — Metrics, Events, Logs, Traces. Monitor execution latency, token usage, error rates, and throughput in real-time."
              color="#ec4899"
              delay={4}
            />
            <FeatureCard
              icon={Bot}
              title="AI-Native Nodes"
              description="First-class LLM nodes for summarization, classification, extraction, and generation. Route between models with intelligent fallbacks."
              color="#a855f7"
              delay={5}
            />
          </div>
        </div>
      </section>

      {/* ── RBAC & OBSERVABILITY DEEP DIVE ── */}
      <section className="px-6 py-20 md:py-28 border-t border-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* RBAC Column */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-amber-400" />
                </div>
                <h3 className="text-2xl font-bold">Role-Based Access Control</h3>
              </div>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Granular permissions that scale with your org. No workflow runs without proper
                authorization.
              </p>
              <div className="space-y-4">
                {[
                  {
                    role: 'Admin',
                    perms: 'Full access · Manage users & teams · Audit logs',
                    color: '#ef4444',
                  },
                  {
                    role: 'Builder',
                    perms: 'Create & edit workflows · Deploy to staging',
                    color: '#f59e0b',
                  },
                  {
                    role: 'Operator',
                    perms: 'Execute workflows · View logs · Monitor runs',
                    color: '#10b981',
                  },
                  {
                    role: 'Viewer',
                    perms: 'Read-only access · View dashboards',
                    color: '#6366f1',
                  },
                ].map((item) => (
                  <div
                    key={item.role}
                    className="flex items-start gap-3 p-4 rounded-xl border border-gray-800/60 bg-gray-900/30 hover:bg-gray-900/50 transition-colors duration-300"
                  >
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5"
                      style={{ backgroundColor: `${item.color}20`, color: item.color }}
                    >
                      {item.role[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">{item.role}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{item.perms}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Observability Column */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-pink-400" />
                </div>
                <h3 className="text-2xl font-bold">Deep Observability</h3>
              </div>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Full MELT support. Every workflow execution is traced, measured, and logged. Debug in
                seconds, not hours.
              </p>
              <div className="space-y-3">
                {[
                  {
                    icon: Activity,
                    metric: 'Metrics',
                    desc: 'Latency, throughput, token usage per node',
                    value: '< 200ms',
                    color: '#8b5cf6',
                  },
                  {
                    icon: Zap,
                    metric: 'Events',
                    desc: 'Trigger fires, node transitions, errors',
                    value: 'Real-time',
                    color: '#06b6d4',
                  },
                  {
                    icon: FileText,
                    metric: 'Logs',
                    desc: 'Structured logs with correlation IDs',
                    value: '30-day',
                    color: '#10b981',
                  },
                  {
                    icon: GitBranch,
                    metric: 'Traces',
                    desc: 'Distributed traces across workflow nodes',
                    value: 'End-to-end',
                    color: '#f59e0b',
                  },
                ].map((item) => (
                  <div
                    key={item.metric}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-800/60 bg-gray-900/30 hover:bg-gray-900/50 transition-colors duration-300 group"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon
                        className="h-4 w-4 transition-transform group-hover:scale-110"
                        style={{ color: item.color }}
                      />
                      <div>
                        <div className="font-semibold text-white text-sm">{item.metric}</div>
                        <div className="text-xs text-gray-500">{item.desc}</div>
                      </div>
                    </div>
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-lg"
                      style={{
                        backgroundColor: `${item.color}15`,
                        color: item.color,
                      }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS ── */}
      <section className="px-6 py-20 md:py-28 border-t border-gray-800/50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            Connects to{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              your stack
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-12">
            Pre-built connectors for the tools you already use. Or build your own in minutes.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <IntegrationPill icon={Database} name="PostgreSQL" color="#336791" />
            <IntegrationPill icon={Globe} name="REST APIs" color="#8b5cf6" />
            <IntegrationPill icon={MessageSquare} name="Slack" color="#4A154B" />
            <IntegrationPill icon={Mail} name="Email / SMTP" color="#ea4335" />
            <IntegrationPill icon={FileText} name="Google Sheets" color="#34a853" />
            <IntegrationPill icon={Database} name="MongoDB" color="#47A248" />
            <IntegrationPill icon={Layers} name="SAP" color="#0FAAFF" />
            <IntegrationPill icon={Users} name="Salesforce" color="#00A1E0" />
            <IntegrationPill icon={Code2} name="Webhooks" color="#f59e0b" />
            <IntegrationPill icon={Bot} name="OpenAI" color="#10a37f" />
            <IntegrationPill icon={Bot} name="Anthropic" color="#d97757" />
            <IntegrationPill icon={Timer} name="Cron Jobs" color="#ec4899" />
            <IntegrationPill icon={Settings} name="Custom Nodes" color="#a855f7" />
          </div>
        </div>
      </section>

      {/* ── CUSTOM NODES CTA ── */}
      <section className="px-6 py-20 md:py-28 border-t border-gray-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-3xl border border-gray-800/60 bg-gradient-to-br from-violet-950/40 to-fuchsia-950/30 p-10 md:p-16 overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-violet-500/5 blur-[100px] pointer-events-none" />

            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold uppercase tracking-wider mb-6">
                  <Code2 className="h-3.5 w-3.5" />
                  Developer-First
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
                  Launch your own nodes
                </h2>
                <p className="text-gray-400 leading-relaxed mb-6">
                  Write custom workflow nodes in Python or JavaScript. Package them as plugins, share
                  across your org, and version them independently. Your business logic, your rules.
                </p>
                <ul className="space-y-3">
                  {[
                    'Write in Python or JavaScript',
                    'Hot-reload during development',
                    'Type-safe inputs & outputs',
                    'Share across teams via plugin registry',
                    'Full test harness included',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-300">
                      <Check className="h-4 w-4 text-violet-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Code preview */}
              <div className="rounded-2xl border border-gray-800/60 bg-gray-950/80 p-6 font-mono text-sm overflow-x-auto">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-3 w-3 rounded-full bg-red-500/60" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                  <div className="h-3 w-3 rounded-full bg-green-500/60" />
                  <span className="ml-2 text-xs text-gray-600">my_node.py</span>
                </div>
                <pre className="text-gray-400 leading-relaxed">
                  <code>
                    {`from nflow import Node, Input, Output

class SentimentAnalyzer(Node):
    """Analyze customer feedback."""

    text = Input(type=str)
    score = Output(type=float)
    label = Output(type=str)

    async def execute(self):
        result = await self.llm.analyze(
            self.text,
            task="sentiment"
        )
        self.score = result.confidence
        self.label = result.sentiment`}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY SMEs CHOOSE nFlow ── */}
      <section className="px-6 py-20 md:py-28 border-t border-gray-800/50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            Why growing teams choose{' '}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              nFlow
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-14">
            Enterprise automation without the enterprise price tag.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Rocket,
                title: 'Deploy in minutes',
                desc: 'Self-host on your infra or use our cloud. Docker-ready, Kubernetes-native. No 6-month rollouts.',
                color: '#8b5cf6',
              },
              {
                icon: Users,
                title: 'Team-first design',
                desc: 'RBAC, shared workspaces, version history, and approval flows. Built for teams of 5 to 500.',
                color: '#06b6d4',
              },
              {
                icon: Star,
                title: 'Open source core',
                desc: 'MIT-licensed core. No vendor lock-in. Inspect, extend, and contribute. Your data stays yours.',
                color: '#10b981',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-8 rounded-2xl border border-gray-800/60 bg-gray-900/30 hover:bg-gray-900/50 transition-all duration-300 text-center group"
              >
                <div
                  className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-transform group-hover:scale-110"
                  style={{
                    backgroundColor: `${item.color}10`,
                    border: `1px solid ${item.color}25`,
                  }}
                >
                  <item.icon className="h-6 w-6" style={{ color: item.color }} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="px-6 py-20 md:py-28 border-t border-gray-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">
            Ready to automate?
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10">
            Join hundreds of teams shipping workflows faster with nFlow. Free to start. No credit
            card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="group w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white px-10 py-4 rounded-2xl text-lg font-bold transition-all duration-300 shadow-xl shadow-violet-500/20 hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/admin"
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-gray-400 hover:text-white text-lg font-semibold transition-colors duration-300"
            >
              Explore Console
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-6 py-12 border-t border-gray-800/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
              <Workflow className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              nFlow
            </span>
          </div>
          <div className="flex gap-8 text-sm text-gray-500 font-medium">
            <Link href="#" className="hover:text-violet-400 transition-colors duration-200">
              Documentation
            </Link>
            <Link href="#" className="hover:text-violet-400 transition-colors duration-200">
              Privacy
            </Link>
            <Link href="#" className="hover:text-violet-400 transition-colors duration-200">
              Terms
            </Link>
            <Link href="#" className="hover:text-violet-400 transition-colors duration-200">
              GitHub
            </Link>
          </div>
          <p className="text-sm text-gray-600">
            &copy; {new Date().getFullYear()} nFlow. MIT Licensed.
          </p>
        </div>
      </footer>

      {/* ── GLOBAL KEYFRAMES ── */}
      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          100% {
            transform: translateY(-12px);
          }
        }
        @keyframes pulse-line {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}
