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
  Server,
  Cloud,
  Split,
  Terminal,
  Cpu,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  Radio,
  RotateCcw,
  Calendar,
  Key,
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
      className="absolute hidden 2xl:flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur-sm text-xs font-medium text-slate-700 select-none pointer-events-none z-0"
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

/* ─── Stat counter ─── */
function StatCounter({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-extrabold text-violet-700">{value}</div>
      <div className="text-sm text-slate-500 mt-1 font-medium">{label}</div>
    </div>
  );
}

/* ─── Workflow preview node ─── */
function WorkflowPreviewNode({
  icon: Icon,
  label,
  subtitle,
  color,
  active,
}: {
  icon: React.ElementType;
  label: string;
  subtitle?: string;
  color: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-medium transition-all duration-300 ${
        active
          ? 'shadow-lg scale-105 border-violet-400 bg-violet-50/70'
          : 'border-slate-200 bg-white/95 hover:border-slate-300 shadow-sm'
      }`}
      style={{
        boxShadow: active ? `0 10px 25px -5px ${color}30` : undefined,
      }}
    >
      <div
        className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15`, color }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-left">
        <div className="text-slate-900 font-semibold text-xs md:text-sm">{label}</div>
        {subtitle && <div className="text-[11px] text-slate-500 font-normal">{subtitle}</div>}
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════ */
/*                    MAIN PAGE                      */
/* ═════════════════════════════════════════════════ */
export default function LandingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [activeCategory, setActiveCategory] = useState<'all' | 'data' | 'apps' | 'ai' | 'triggers'>('all');

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 5);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans overflow-x-hidden selection:bg-violet-100 selection:text-violet-900">
      {/* ── HERO ── */}
      <section className="relative px-6 pt-16 pb-24 md:pt-24 md:pb-36 overflow-hidden bg-gradient-to-b from-violet-50/70 via-white to-white">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[650px] h-[650px] rounded-full bg-violet-300/25 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] rounded-full bg-cyan-300/20 blur-[100px]" />
          <div className="absolute top-[30%] right-[15%] w-[350px] h-[350px] rounded-full bg-fuchsia-300/15 blur-[90px]" />
        </div>

        {/* Floating nodes */}
        <FloatingNode icon={Calendar} label="CRON Scheduler" x="7%" y="18%" delay={0} color="#8b5cf6" />
        <FloatingNode icon={Zap} label="Webhook Trigger" x="14%" y="42%" delay={0.4} color="#f59e0b" />
        <FloatingNode icon={Database} label="PostgreSQL & Vector" x="6%" y="68%" delay={1.2} color="#10b981" />
        <FloatingNode icon={Bot} label="Autonomous Agent" x="84%" y="16%" delay={0.6} color="#06b6d4" />
        <FloatingNode icon={MessageSquare} label="Slack & Teams Node" x="78%" y="48%" delay={1} color="#ec4899" />
        <FloatingNode icon={Code2} label="Custom Python Node" x="85%" y="74%" delay={1.6} color="#6366f1" />

        <div className="relative max-w-5xl mx-auto text-center z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100/80 border border-violet-200 text-violet-800 text-xs font-semibold uppercase tracking-wider mb-8 backdrop-blur-sm shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-violet-600" />
            Enterprise Agent Platform
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] mb-6">
            <span className="text-slate-900">Automate </span>
            <span className="text-purple-900">Everything.</span>
            <br />
            <span className="text-slate-600 text-3xl md:text-5xl lg:text-6xl font-bold">
              Build &amp; Host Custom AI Agents
            </span>
          </h1>

          {/* Sub */}
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            The complete Enterprise Agent Platform to build, trigger, and govern autonomous AI agents across your systems.
            Connect out-of-the-box enterprise tools, define custom nodes, and execute with full RBAC and observability.
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
              className="group w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-8 py-4 rounded-2xl text-lg font-bold hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-sm"
            >
              <Play className="h-5 w-5 text-violet-500" />
              View Live Demo
            </Link>
          </div>

          {/* Trust bar */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-8 md:gap-12">
            <StatCounter value="100K+" label="Agent Executions" />
            <div className="h-8 w-px bg-slate-200 hidden md:block" />
            <StatCounter value="50+" label="Out-of-Box Nodes" />
            <div className="h-8 w-px bg-slate-200 hidden md:block" />
            <StatCounter value="99.95%" label="Uptime SLA" />
            <div className="h-8 w-px bg-slate-200 hidden md:block" />
            <StatCounter value="100%" label="Self-Host or Cloud" />
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE CANVAS PREVIEW (Triggers, Conditions, Custom Nodes, OOTB) ── */}
      <section className="px-6 py-20 md:py-28 border-t border-slate-100 bg-slate-50/70">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 border border-violet-200 text-violet-700 text-xs font-semibold uppercase tracking-wider mb-3">
              <Workflow className="h-3.5 w-3.5" />
              Live Agent Execution Architecture
            </div>
            <h2 className="text-3xl md:text-5xl text-slate-900 font-extrabold tracking-tight mb-4">
              Trigger, branch, and orchestrate <span className="text-violet-700">visually</span>
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              From incoming webhooks or scheduled cron triggers to intelligent conditional branching,
              pre-built enterprise connectors, and custom Python nodes.
            </p>
          </div>

          {/* Canvas Card */}
          <div className="relative rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 p-6 md:p-10 overflow-hidden">
            {/* Dot grid */}
            <div
              className="absolute inset-0 opacity-[0.035]"
              style={{
                backgroundImage: 'radial-gradient(circle, #475569 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Top Bar Mockup */}
            <div className="relative flex flex-wrap items-center justify-between pb-6 mb-8 border-b border-slate-100 gap-4">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-rose-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <span className="text-xs font-semibold text-slate-600 pl-2">
                  Customer Support AI Agent · v2.4 (Active)
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                  <CircleDot className="h-3 w-3 text-emerald-500 animate-pulse" />
                  Live Running
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                  RBAC: Builder+
                </span>
              </div>
            </div>

            {/* Nodes Layout */}
            <div className="relative flex flex-col lg:flex-row items-center justify-center gap-3 lg:gap-5 py-4">
              {/* 1. Multiple Triggers */}
              <WorkflowPreviewNode
                icon={Zap}
                label="Trigger Source"
                subtitle="Webhook / REST API"
                color="#8b5cf6"
                active={activeStep === 0}
              />

              <ChevronRight
                className={`h-5 w-5 hidden lg:block transition-colors duration-300 ${
                  activeStep === 0 ? 'text-violet-600' : 'text-slate-300'
                }`}
              />

              {/* 2. Conditional Execution */}
              <WorkflowPreviewNode
                icon={Split}
                label="Conditional Router"
                subtitle="If SLA < 1h OR High Tier"
                color="#f59e0b"
                active={activeStep === 1}
              />

              <ChevronRight
                className={`h-5 w-5 hidden lg:block transition-colors duration-300 ${
                  activeStep === 1 ? 'text-violet-600' : 'text-slate-300'
                }`}
              />

              {/* 3. Out of Box System */}
              <WorkflowPreviewNode
                icon={Database}
                label="OOTB System"
                subtitle="PostgreSQL + Vector Query"
                color="#10b981"
                active={activeStep === 2}
              />

              <ChevronRight
                className={`h-5 w-5 hidden lg:block transition-colors duration-300 ${
                  activeStep === 2 ? 'text-violet-600' : 'text-slate-300'
                }`}
              />

              {/* 4. AI Agent Node */}
              <WorkflowPreviewNode
                icon={Bot}
                label="Reasoning Agent"
                subtitle="Claude / GPT / Gemini"
                color="#06b6d4"
                active={activeStep === 3}
              />

              <ChevronRight
                className={`h-5 w-5 hidden lg:block transition-colors duration-300 ${
                  activeStep === 3 ? 'text-violet-600' : 'text-slate-300'
                }`}
              />

              {/* 5. Custom Node & Dispatch */}
              <WorkflowPreviewNode
                icon={Code2}
                label="Custom Node"
                subtitle="Slack + CRM Sync"
                color="#ec4899"
                active={activeStep === 4}
              />
            </div>

            {/* Step Explanation Banner */}
            <div className="mt-8 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs md:text-sm text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-violet-700">Step {activeStep + 1} of 5:</span>
                <span>
                  {activeStep === 0 && 'Webhook event received with payload verification and rate limiting.'}
                  {activeStep === 1 && 'Dynamic conditional logic evaluates user tier and routes execution path.'}
                  {activeStep === 2 && 'Out-of-the-box DB connector runs vector search for relevant customer history.'}
                  {activeStep === 3 && 'AI Agent processes context with tool calling and strict response guardrails.'}
                  {activeStep === 4 && 'Custom Python node executes enterprise CRM update and notifies Slack channel.'}
                </span>
              </div>
              <div className="text-slate-600 font-mono text-[11px] shrink-0">Latency: 184ms · Token Cost: $0.0018</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 1: DEPLOYMENT FLEXIBILITY (HOSTED VS SHARED) ── */}
      <section className="px-6 py-20 md:py-28 border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 border border-violet-200 text-violet-700 text-xs font-semibold uppercase tracking-wider mb-3">
              <Server className="h-3.5 w-3.5" />
              Deployment Flexibility
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
              Your Infrastructure, or Our Managed Cloud
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Run Enterprise Agent Platform on your own private infrastructure for strict compliance,
              or spin up on our scalable shared cloud instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Self-Hosted / On-Prem */}
            <div className="p-8 md:p-10 rounded-3xl border-2 border-violet-200 bg-gradient-to-b from-violet-50/50 to-white shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="h-12 w-12 rounded-2xl bg-violet-600/10 border border-violet-600/20 flex items-center justify-center text-violet-600">
                  <Server className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-violet-100 text-violet-800">
                  Private &amp; Air-Gapped
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Self-Hosted Dedicated Platform</h3>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Deploy inside your own AWS/GCP/Azure VPC or on-premise hardware. Zero data leaves your perimeter.
              </p>
              <ul className="space-y-3.5 text-sm text-slate-700">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-violet-600 shrink-0" />
                  <span><strong>100% Data Sovereignty:</strong> Prompts, credentials &amp; logs remain within your VPC.</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-violet-600 shrink-0" />
                  <span><strong>Docker &amp; Kubernetes Native:</strong> Helm charts, Docker Compose, air-gapped readiness.</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-violet-600 shrink-0" />
                  <span><strong>Internal Network Access:</strong> Direct query access to internal databases, SAP, and legacy APIs.</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-violet-600 shrink-0" />
                  <span><strong>Bring Your Own LLM:</strong> Route through local Ollama, vLLM, or dedicated Azure OpenAI endpoints.</span>
                </li>
              </ul>
            </div>

            {/* Managed Shared Cloud */}
            <div className="p-8 md:p-10 rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="h-12 w-12 rounded-2xl bg-cyan-600/10 border border-cyan-600/20 flex items-center justify-center text-cyan-600">
                  <Cloud className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-cyan-100 text-cyan-800">
                  Instant Setup
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Shared Multi-Tenant Cloud</h3>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Instant provisioning with zero infrastructure maintenance. Built for fast-moving teams and production workloads.
              </p>
              <ul className="space-y-3.5 text-sm text-slate-700">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-cyan-600 shrink-0" />
                  <span><strong>Zero Ops Overhead:</strong> Managed upgrades, automatic backups, and 99.95% uptime SLA.</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-cyan-600 shrink-0" />
                  <span><strong>Isolated Multi-Tenancy:</strong> Strict tenant boundaries, KMS-backed encrypted secrets.</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-cyan-600 shrink-0" />
                  <span><strong>Elastic Auto-Scaling:</strong> From 10 to 1,000,000 executions per day without throttling.</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-cyan-600 shrink-0" />
                  <span><strong>Global Low-Latency Edge:</strong> Execute webhooks and triggers close to your users worldwide.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: MULTIPLE TRIGGERS ── */}
      <section className="px-6 py-20 md:py-28 border-t border-slate-100 bg-slate-50/70">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-xs font-semibold uppercase tracking-wider mb-3">
              <Zap className="h-3.5 w-3.5" />
              Any Event. Any Schedule.
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
              Multiple Triggers to Wake Up Your Agents
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Never poll manually. Run agents on clockwork schedules, incoming webhooks, stream messages,
              or human-in-the-loop decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Trigger 1: Scheduler / CRON */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="h-10 w-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center mb-4">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">CRON Scheduler</h3>
              <p className="text-xs text-slate-500 mb-4 font-mono">cron: &quot;0 8 * * 1-5&quot;</p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Run daily executive digests, nightly database reconciliations, and periodic synchronization routines automatically.
              </p>
            </div>

            {/* Trigger 2: Webhooks & REST */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="h-10 w-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center mb-4">
                <Globe className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">REST API &amp; Webhooks</h3>
              <p className="text-xs text-slate-500 mb-4 font-mono">POST /api/v1/agents/invoke</p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Trigger agents directly from microservices, Stripe, GitHub, or Shopify. Supports synchronous &amp; async execution.
              </p>
            </div>

            {/* Trigger 3: Event Streams & Queues */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <Radio className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Event Streams &amp; Queues</h3>
              <p className="text-xs text-slate-500 mb-4 font-mono">Kafka · SQS · RabbitMQ</p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Consume high-volume message streams. Process customer events, change-data-capture logs, or IoT telemetry in real-time.
              </p>
            </div>

            {/* Trigger 4: Inbound Communications */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="h-10 w-10 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center mb-4">
                <Mail className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Inbound Email &amp; Chat</h3>
              <p className="text-xs text-slate-500 mb-4 font-mono">IMAP · Slack · MS Teams</p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Activate agents upon incoming customer emails, PDF attachments, Slack slash commands, or support tickets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: CONDITIONAL EXECUTION & SMART ROUTING ── */}
      <section className="px-6 py-20 md:py-28 border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 border border-violet-200 text-violet-700 text-xs font-semibold uppercase tracking-wider mb-4">
                <Split className="h-3.5 w-3.5" />
                Intelligent Control Flow
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">
                Conditional Execution, Branching &amp; Loops
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed mb-8">
                Autonomous agents are not linear pipelines. Power dynamic decision-making with conditional branches,
                iterative loops, and resilient fallback paths.
              </p>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                    <Split className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">Multi-Condition Branching</h4>
                    <p className="text-sm text-slate-600 mt-0.5">
                      Route workflows dynamically based on JSON payloads, intent sentiment, customer tier, or confidence scores.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center shrink-0">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">LLM Semantic Intent Routing</h4>
                    <p className="text-sm text-slate-600 mt-0.5">
                      Let an LLM classify incoming requests and route execution to specialized sub-agents with strict output schemas.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <RotateCcw className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">Automatic Fallbacks &amp; Retries</h4>
                    <p className="text-sm text-slate-600 mt-0.5">
                      Never fail on API errors. Auto-failover from OpenAI to Anthropic or self-hosted models when rate-limited.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Logic Diagram Mockup */}
            <div className="rounded-3xl border border-slate-200 bg-slate-900 text-white p-6 md:p-8 shadow-xl">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
                <span className="text-xs font-mono text-slate-400">Router Node :: Execution Plan</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                  Evaluated: True
                </span>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="text-violet-400 font-bold mb-1">IF condition_match:</div>
                  <div className="text-slate-300">
                    payload.priority == &quot;critical&quot; &amp;&amp; agent.confidence &gt;= 0.85
                  </div>
                  <div className="mt-2 text-emerald-400 flex items-center gap-1.5 text-[11px]">
                    <Check className="h-3.5 w-3.5" /> Branch taken: Execute Autonomous Resolution Sub-Agent
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 opacity-60">
                  <div className="text-amber-400 font-bold mb-1">ELSE IF human_required:</div>
                  <div className="text-slate-400">Route to Human-in-the-Loop Slack Approval Gate</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 opacity-60">
                  <div className="text-rose-400 font-bold mb-1">ON_FAILURE (Rate Limit / Timeout):</div>
                  <div className="text-slate-400">Switch provider to Azure OpenAI Backup · Retry with backoff</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: OUT-OF-THE-BOX NODES FOR COMMON SYSTEMS ── */}
      <section className="px-6 py-20 md:py-28 border-t border-slate-100 bg-slate-50/70">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-3">
              <Plug className="h-3.5 w-3.5" />
              50+ Pre-Built Integrations
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
              Out-of-the-Box Nodes for Common Systems
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Connect to your databases, vector stores, enterprise apps, and LLMs without writing glue code.
            </p>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
              {(
                [
                  { id: 'all', label: 'All Systems' },
                  { id: 'data', label: 'Databases & Vector' },
                  { id: 'apps', label: 'Enterprise Apps' },
                  { id: 'ai', label: 'AI Models' },
                  { id: 'triggers', label: 'Triggers & Ops' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    activeCategory === tab.id
                      ? 'bg-violet-700 text-white shadow-md shadow-violet-700/20'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Nodes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { icon: Database, name: 'PostgreSQL', cat: 'data', color: '#336791' },
              { icon: Database, name: 'MongoDB', cat: 'data', color: '#47A248' },
              { icon: Database, name: 'Redis', cat: 'data', color: '#DC382D' },
              { icon: Database, name: 'Qdrant Vector', cat: 'data', color: '#ff4d4f' },
              { icon: Database, name: 'Pinecone', cat: 'data', color: '#000000' },
              { icon: Database, name: 'Snowflake', cat: 'data', color: '#29B5E8' },
              { icon: MessageSquare, name: 'Slack', cat: 'apps', color: '#4A154B' },
              { icon: Users, name: 'Salesforce', cat: 'apps', color: '#00A1E0' },
              { icon: Layers, name: 'SAP ERP', cat: 'apps', color: '#0FAAFF' },
              { icon: Mail, name: 'Email / SMTP', cat: 'apps', color: '#EA4335' },
              { icon: FileText, name: 'Google Workspace', cat: 'apps', color: '#34A853' },
              { icon: Users, name: 'HubSpot', cat: 'apps', color: '#FF7A59' },
              { icon: Bot, name: 'OpenAI (GPT-4o)', cat: 'ai', color: '#10A37F' },
              { icon: Bot, name: 'Anthropic Claude', cat: 'ai', color: '#D97757' },
              { icon: Bot, name: 'Google Gemini', cat: 'ai', color: '#4285F4' },
              { icon: Cpu, name: 'Ollama / Local', cat: 'ai', color: '#F59E0B' },
              { icon: Bot, name: 'vLLM Endpoints', cat: 'ai', color: '#8B5CF6' },
              { icon: FileText, name: 'PDF Document OCR', cat: 'ai', color: '#EC4899' },
              { icon: Calendar, name: 'CRON Scheduler', cat: 'triggers', color: '#8B5CF6' },
              { icon: Globe, name: 'REST / Webhooks', cat: 'triggers', color: '#06B6D4' },
              { icon: Radio, name: 'Kafka Streams', cat: 'triggers', color: '#231F20' },
              { icon: Key, name: 'Secret Vault', cat: 'triggers', color: '#F59E0B' },
              { icon: ShieldCheck, name: 'RBAC Policy Gate', cat: 'triggers', color: '#10B981' },
              { icon: Code2, name: 'Custom SDK Node', cat: 'triggers', color: '#6366F1' },
            ]
              .filter((item) => activeCategory === 'all' || item.cat === activeCategory)
              .map((node) => (
                <div
                  key={node.name}
                  className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-violet-300 hover:shadow-md transition-all duration-300 flex flex-col items-center text-center group"
                >
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${node.color}15`, color: node.color }}
                  >
                    <node.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">{node.name}</span>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: DEFINE YOUR OWN NODES (DEV SDK) ── */}
      <section className="px-6 py-20 md:py-28 border-t border-slate-100 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 to-fuchsia-50/70 p-8 md:p-14 overflow-hidden shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-800 text-xs font-semibold uppercase tracking-wider mb-6">
                  <Code2 className="h-3.5 w-3.5" />
                  Developer Node SDK
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
                  Define your own custom nodes
                </h2>
                <p className="text-slate-600 leading-relaxed mb-6">
                  Write custom agent logic in Python or TypeScript. Package them with Pydantic type safety,
                  hot-reload during development, and share across teams via your private node registry.
                </p>
                <ul className="space-y-3">
                  {[
                    'Type-safe inputs, outputs & parameter schemas',
                    'Hot-reload during local agent development',
                    'Direct access to DB connections, LLM clients, and vector search',
                    'Private organizational registry with semantic versioning',
                    'Full automated test harness included',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
                      <Check className="h-4 w-4 text-violet-600 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Code preview */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 font-mono text-xs overflow-x-auto text-slate-300 shadow-2xl">
                <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                    <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                    <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 text-xs text-slate-400">custom_agent_node.py</span>
                  </div>
                  <span className="text-[10px] text-violet-400 font-bold">PYTHON SDK</span>
                </div>
                <pre className="leading-relaxed">
                  <code>{`from eap import AgentNode, Field, Context

class CustomerSupportResolver(AgentNode):
    """Custom Node with Vector Store + CRM action."""
    
    ticket_id: str = Field(description="Unique ticket ID")
    urgency_score: float = Field(default=0.0)
    
    async def run(self, ctx: Context):
        # 1. Vector similarity search on internal docs
        kb_chunks = await ctx.vector_db.search(
            collection="knowledge_base",
            query=ctx.input.text,
            top_k=3
        )
        
        # 2. Invoke designated agent model
        resolution = await ctx.agent.execute(
            system="Resolve enterprise support ticket",
            context=kb_chunks
        )
        
        return {
            "resolved": True,
            "response": resolution.text,
            "latency_ms": ctx.elapsed_ms
        }`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 6: ENTERPRISE RBAC & OBSERVABILITY ── */}
      <section className="px-6 py-20 md:py-28 border-t border-slate-100 bg-slate-50/70">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* RBAC Column */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-amber-500" />
                </div>
                <h3 className="text-2xl font-bold">Enterprise RBAC &amp; Governance</h3>
              </div>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Granular permissions that scale with your organization. Control who can build agents,
                execute workflows, approve high-risk actions, and view execution telemetry.
              </p>
              <div className="space-y-3.5">
                {[
                  {
                    role: 'Admin',
                    perms: 'Org management · API key rotation · Audit trail · SSO / SAML',
                    color: '#ef4444',
                  },
                  {
                    role: 'Agent Builder',
                    perms: 'Create agents · Define custom nodes · Deploy to staging/prod',
                    color: '#f59e0b',
                  },
                  {
                    role: 'Operator',
                    perms: 'Trigger executions · Review approval gates · Monitor runs',
                    color: '#10b981',
                  },
                  {
                    role: 'Auditor & Viewer',
                    perms: 'Read-only access · Cost & token analytics · Compliance logs',
                    color: '#6366f1',
                  },
                ].map((item) => (
                  <div
                    key={item.role}
                    className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-colors duration-300"
                  >
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5"
                      style={{ backgroundColor: `${item.color}20`, color: item.color }}
                    >
                      {item.role[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{item.role}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.perms}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Observability Column */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-pink-500" />
                </div>
                <h3 className="text-2xl font-bold">Full Telemetry &amp; MELT Observability</h3>
              </div>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Complete observability out-of-the-box. Every agent execution, node transition, and tool call
                is traced, measured for token spend, and logged.
              </p>
              <div className="space-y-3.5">
                {[
                  {
                    icon: Activity,
                    metric: 'Metrics & Cost',
                    desc: 'Real-time token usage, cost attribution, and node latency',
                    value: '$0.0012 avg',
                    color: '#8b5cf6',
                  },
                  {
                    icon: Zap,
                    metric: 'Events & State',
                    desc: 'Trigger fires, conditional evaluations, tool call transitions',
                    value: 'Real-time',
                    color: '#06b6d4',
                  },
                  {
                    icon: FileText,
                    metric: 'Structured Logs',
                    desc: 'Correlation IDs for end-to-end debugging across microservices',
                    value: 'Immutable',
                    color: '#10b981',
                  },
                  {
                    icon: GitBranch,
                    metric: 'Distributed Tracing',
                    desc: 'OpenTelemetry-compliant waterfall spans for every node execution',
                    value: 'End-to-End',
                    color: '#f59e0b',
                  },
                ].map((item) => (
                  <div
                    key={item.metric}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-colors duration-300 group"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon
                        className="h-4 w-4 transition-transform group-hover:scale-110"
                        style={{ color: item.color }}
                      />
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">{item.metric}</div>
                        <div className="text-xs text-slate-500">{item.desc}</div>
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

      {/* ── FINAL CTA ── */}
      <section className="px-6 py-20 md:py-28 border-t border-slate-100 bg-gradient-to-b from-white to-violet-50/70">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">
            Ready to deploy your enterprise agents?
          </h2>
          <p className="text-slate-600 text-lg max-w-xl mx-auto mb-10">
            Start free on our shared cloud, or talk to our team for a private, dedicated on-premise installation.
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
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-slate-600 hover:text-slate-900 text-lg font-semibold transition-colors duration-300"
            >
              Explore Console
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-6 py-12 border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
              <Workflow className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-violet-700">Enterprise Agent Platform</span>
          </div>
          <div className="flex gap-8 text-sm text-slate-500 font-medium">
            <Link href="#" className="hover:text-violet-600 transition-colors duration-200">
              Documentation
            </Link>
            <Link href="#" className="hover:text-violet-600 transition-colors duration-200">
              Privacy
            </Link>
            <Link href="#" className="hover:text-violet-600 transition-colors duration-200">
              Terms
            </Link>
            <Link href="#" className="hover:text-violet-600 transition-colors duration-200">
              GitHub
            </Link>
          </div>
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Enterprise Agent Platform. All rights reserved.
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
      `}</style>
    </div>
  );
}
