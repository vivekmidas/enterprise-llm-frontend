/*
===============================================================================
BLOCK COMMENT: LEGAL AI PLATFORM - MULTI-TENANT ROLE-BASED WORKSPACE
Module: frontend/app/legal/page.tsx
Description:
    Multi-tenant role-partitioned Legal AI interface for Tenant Admins and Paralegals.
    - Tenant Admin: Configure LLM Profiles, manage Knowledge Bases, upload corpus documents to test ingestion, and execute interactive retrieval test benches.
    - Paralegal: Create and manage case workspaces, upload matter documents linked to cases, execute precedent search, and manage saved briefs.
    - Workflow Integration: Ingestion and search dispatch to tenant-configured workflows (/webhooks/run/legal/ingest, /webhooks/run/legal/search) or standard pipelines.
===============================================================================
*/

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  FileSearch,
  FileText,
  FolderKanban,
  HelpCircle,
  Library,
  Menu,
  Plus,
  RefreshCw,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  Sliders,
  Sparkles,
  Upload,
  UserCheck,
  Users,
  X,
  Zap,
  Database,
  Cpu,
  Layers
} from 'lucide-react';
import { api } from '@/lib/api';
import LegalResearchHub from './LegalResearchHub';

type Role = 'Admin' | 'Paralegal';
type AdminView = 'Overview' | 'Profiles' | 'Knowledge Bases' | 'Corpus & Retrieval Tests' | 'Cases' | 'Legal Search' | 'Audit Logs';
type ParalegalView = 'Overview' | 'Cases' | 'Legal Search' | 'Saved Briefs';
type View = AdminView | ParalegalView;

interface LLMProfile {
  id: string;
  name: string;
  provider: string;
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  system_prompt: string;
  is_active: boolean;
}

const DEFAULT_PROFILES: LLMProfile[] = [
  {
    id: 'prof-legal-gpt4o',
    name: 'GPT-4o Legal Precision',
    provider: 'OpenAI',
    model: 'gpt-4o',
    temperature: 0.1,
    max_tokens: 4096,
    top_p: 0.95,
    system_prompt: 'You are an expert Indian Legal Assistant. Analyze facts, extract ratio decidendi, and map IPC/CrPC sections to BNS/BNSS with precise statutory citations.',
    is_active: true,
  },
  {
    id: 'prof-legal-claude',
    name: 'Claude 3.5 Sonnet Analysis',
    provider: 'Anthropic',
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.2,
    max_tokens: 8192,
    top_p: 0.9,
    system_prompt: 'You are a senior appellate advocate assisting in drafting writ petitions and precedent syntheses with zero hallucinations.',
    is_active: false,
  },
  {
    id: 'prof-legal-gemini',
    name: 'Gemini 1.5 Pro Deep Context',
    provider: 'Google',
    model: 'gemini-1.5-pro',
    temperature: 0.15,
    max_tokens: 8192,
    top_p: 0.95,
    system_prompt: 'Process full case binders and cross-reference multiple court orders for tax and commercial dispute analysis.',
    is_active: false,
  },
];

const DEFAULT_KNOWLEDGE_BASES = [
  {
    id: 'kb-supreme-court',
    name: 'Supreme Court of India (2010–2026)',
    type: 'Vector + Knowledge Graph',
    documents: 1420,
    status: 'Synced',
    last_updated: 'Today, 02:15 AM',
  },
  {
    id: 'kb-delhi-hc',
    name: 'Delhi High Court Tax & Commercial Bench',
    type: 'Hybrid Semantic Index',
    documents: 846,
    status: 'Synced',
    last_updated: 'Yesterday',
  },
  {
    id: 'kb-firm-precedents',
    name: 'Firm Internal Precedents & Opinions',
    type: 'Tenant Private Corpus',
    documents: 580,
    status: 'Synced',
    last_updated: '2 days ago',
  },
];

const initialCases = [
  { id: 'case-1', title: 'State v. Mehra', type: 'Bail application', court: 'High Court of Delhi', files: ['Matter_Chronology.docx', 'Bail_Petition_Draft.pdf'], updated: 'Today, 10:30 AM' },
  { id: 'case-2', title: 'Arora Industries v. DCIT', type: 'Tax appeal (Sec 148A)', court: 'High Court of Delhi', files: ['Assessment_Order.pdf', 'Show_Cause_Reply.docx'], updated: 'Yesterday' },
  { id: 'case-3', title: 'Khan v. Union of India', type: 'Writ petition (Art 226)', court: 'Supreme Court of India', files: ['SLP_Synopsis.docx', 'Annexure_P1.pdf'], updated: '3 days ago' },
  { id: 'case-4', title: 'Rao matter', type: 'Commercial dispute', court: 'Bombay High Court', files: ['Arbitration_Notice.pdf'], updated: '5 days ago' },
];

export default function LegalPlatformPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [role, setRole] = useState<Role>('Paralegal');
  const [view, setView] = useState<View>('Overview');
  const [mobile, setMobile] = useState(false);
  const [notice, setNotice] = useState('');

  // Initial Auth Check
  useEffect(() => {
    async function loadUser() {
      try {
        const user = await api.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          const normalizedRole = (user.role || '').toLowerCase();
          if (
            normalizedRole === 'admin' ||
            normalizedRole === 'tenant_admin' ||
            normalizedRole === 'system_admin'
          ) {
            setRole('Admin');
          } else {
            setRole('Paralegal');
          }
        }
      } catch (err) {
        console.error('Failed to load current user for legal portal:', err);
      }
    }
    loadUser();
  }, []);

  const show = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3000);
  };

  const switchRole = (next: Role) => {
    setRole(next);
    setView('Overview');
    show(`${next} perspective activated`);
  };

  const adminNav: AdminView[] = [
    'Overview',
    'Profiles',
    'Knowledge Bases',
    'Corpus & Retrieval Tests',
    'Cases',
    'Legal Search',
    'Audit Logs'
  ];
  const paraNav: ParalegalView[] = ['Overview', 'Cases', 'Legal Search', 'Saved Briefs'];

  const navItems = role === 'Admin' ? adminNav : paraNav;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex font-sans overflow-x-hidden">
      {/* MOBILE OVERLAY */}
      {mobile && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs"
          onClick={() => setMobile(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`w-64 bg-white border-r border-slate-200 flex flex-col p-4 shrink-0 transition-transform duration-200 z-50 ${
          mobile ? 'fixed inset-y-0 left-0 shadow-2xl translate-x-0' : 'hidden md:flex'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <Link href="/legal" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-700 flex items-center justify-center text-white font-bold shadow-xs">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <strong className="block text-xs font-extrabold text-slate-900 leading-tight">
                Legal AI Platform
              </strong>
              <span className="block text-[10px] text-slate-500 font-medium">
                {currentUser?.customer_id ? `Tenant: ${currentUser.customer_id}` : 'Enterprise Gateway'}
              </span>
            </div>
          </Link>
          <button
            className="md:hidden p-1 text-slate-400 hover:text-slate-700"
            onClick={() => setMobile(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role Switcher */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 my-3">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Active Role
            </p>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-800 font-bold">
              {currentUser?.role || role}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {(['Admin', 'Paralegal'] as Role[]).map((item) => (
              <button
                key={item}
                onClick={() => switchRole(item)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  role === item
                    ? 'bg-violet-700 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  {item === 'Admin' ? <ShieldCheck className="w-3.5 h-3.5" /> : <FileSearch className="w-3.5 h-3.5" />}
                  <span>{item === 'Admin' ? 'Tenant Admin' : 'Paralegal'}</span>
                </div>
                {role === item && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 py-1 overflow-y-auto">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 px-2 mb-1">
            {role === 'Admin' ? 'Tenant Admin Workspace' : 'Paralegal Workspace'}
          </p>
          {navItems.map((item) => (
            <button
              key={item}
              onClick={() => {
                setView(item);
                setMobile(false);
              }}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                view === item
                  ? 'bg-violet-50 text-violet-800 border border-violet-200 shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {item === 'Overview' ? (
                <Activity className="w-4 h-4 text-violet-700" />
              ) : item === 'Profiles' ? (
                <Cpu className="w-4 h-4 text-violet-700" />
              ) : item === 'Knowledge Bases' ? (
                <Database className="w-4 h-4 text-violet-700" />
              ) : item === 'Corpus & Retrieval Tests' ? (
                <Upload className="w-4 h-4 text-violet-700" />
              ) : item === 'Cases' ? (
                <FolderKanban className="w-4 h-4 text-violet-700" />
              ) : item === 'Legal Search' ? (
                <Library className="w-4 h-4 text-violet-700" />
              ) : item === 'Audit Logs' ? (
                <ShieldCheck className="w-4 h-4 text-violet-700" />
              ) : (
                <BarChart3 className="w-4 h-4 text-violet-700" />
              )}
              <span>{item}</span>
              {item === 'Corpus & Retrieval Tests' && (
                <span className="ml-auto text-[9px] px-1.5 py-0.5 bg-violet-100 text-violet-800 rounded font-bold">
                  Admin
                </span>
              )}
            </button>
          ))}

          {/* Quick Admin Consoles Link */}
          {role === 'Admin' && (
            <div className="pt-3 mt-2 border-t border-slate-100 flex flex-col gap-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 px-2 mb-1">
                Admin Consoles
              </p>
              <Link
                href="/admin?tab=profiles"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                <Cpu className="w-3.5 h-3.5 text-slate-500" />
                <span>LLM Profiles</span>
                <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
              </Link>
              <Link
                href="/admin?tab=knowledge"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                <Database className="w-3.5 h-3.5 text-slate-500" />
                <span>Knowledge Bases</span>
                <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
              </Link>
            </div>
          )}
        </nav>

        {/* User Info */}
        <div className="pt-3 mt-auto border-t border-slate-100 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-800 font-bold flex items-center justify-center text-xs">
            {currentUser?.username ? currentUser.username.slice(0, 2).toUpperCase() : 'AM'}
          </div>
          <div className="flex-1 truncate">
            <strong className="block text-xs font-bold text-slate-900 truncate">
              {currentUser?.username || currentUser?.email || 'Authenticated User'}
            </strong>
            <span className="block text-[10px] text-slate-500">
              {role === 'Admin' ? 'Tenant Administrator' : 'Paralegal Staff'}
            </span>
          </div>
        </div>
      </aside>

      {/* WORKSPACE CONTENT AREA */}
      <section className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Topbar */}
        <header className="h-14 border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
              onClick={() => setMobile(true)}
              aria-label="Open navigation"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link href="/legal" className="hover:text-slate-900 font-medium">
                Legal AI Platform
              </Link>
              <ArrowRight className="w-3 h-3" />
              <strong className="text-slate-900 font-bold">{view}</strong>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('Legal Search')}
              className="px-3 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-700" />
              <span>Research Hub</span>
            </button>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
              {role === 'Admin' ? 'Tenant Admin Role' : 'Paralegal Role'}
            </span>
          </div>
        </header>

        {/* Dynamic View Router */}
        <div className="p-6 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">
          {view === 'Overview' && (
            <OverviewView role={role} navigate={(v) => setView(v)} show={show} />
          )}

          {/* Tenant Admin Specific Views */}
          {view === 'Profiles' && role === 'Admin' && <ProfilesView show={show} />}
          {view === 'Knowledge Bases' && role === 'Admin' && <KnowledgeBasesView show={show} />}
          {view === 'Corpus & Retrieval Tests' && role === 'Admin' && (
            <CorpusAndRetrievalView show={show} />
          )}
          {view === 'Audit Logs' && role === 'Admin' && <AuditLogsView show={show} />}

          {/* Shared / Paralegal Views */}
          {view === 'Cases' && (
            <CasesView role={role} navigate={(v) => setView(v)} show={show} />
          )}
          {view === 'Legal Search' && <SearchView show={show} />}
          {view === 'Saved Briefs' && <SavedBriefsView show={show} />}
        </div>
      </section>

      {/* TOAST NOTIFICATION */}
      {notice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{notice}</span>
        </div>
      )}
    </main>
  );
}

// -----------------------------------------------------------------------------
// HEADING COMPONENT
// -----------------------------------------------------------------------------
function Heading({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700">
          Legal AI Platform
        </p>
        <h1 className="text-xl font-extrabold text-slate-900 mt-0.5">{title}</h1>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      {action}
    </div>
  );
}

// -----------------------------------------------------------------------------
// OVERVIEW VIEW
// -----------------------------------------------------------------------------
function OverviewView({
  role,
  navigate,
  show
}: {
  role: Role;
  navigate: (view: View) => void;
  show: (message: string) => void;
}) {
  return (
    <>
      <Heading
        title={role === 'Admin' ? 'Tenant Administration Center' : 'Legal Assistant Workspace'}
        description={
          role === 'Admin'
            ? 'Configure LLM profiles, manage knowledge bases, upload corpus documents, and test retrieval benchmarks.'
            : 'Organize active matters, upload case intake files, and execute grounded legal precedent search.'
        }
        action={
          <button
            onClick={() => show('Tenant workflow dispatcher active: Ingest & Search routes bound.')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" /> How Workflow Routing Works
          </button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{role === 'Admin' ? 'LLM Profiles' : 'Active Matters'}</span>
            <Cpu className="w-4 h-4 text-violet-700" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{role === 'Admin' ? '3 Active' : '4 Matters'}</div>
          <div className="text-[11px] text-slate-500">
            {role === 'Admin' ? 'GPT-4o Legal Precision selected' : '2 updated today'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{role === 'Admin' ? 'Knowledge Bases' : 'Uploaded Files'}</span>
            <Database className="w-4 h-4 text-violet-700" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{role === 'Admin' ? '3 Indexed' : '12 Files'}</div>
          <div className="text-[11px] text-slate-500">
            {role === 'Admin' ? '2,846 Judgments & Statutes' : 'Ready for citation extraction'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{role === 'Admin' ? 'Workflow Routes' : 'Saved Precedents'}</span>
            <Zap className="w-4 h-4 text-violet-700" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{role === 'Admin' ? 'Linked' : '18 Briefs'}</div>
          <div className="text-[11px] text-slate-500">
            {role === 'Admin' ? '/legal/ingest & /legal/search' : '6 updated this week'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Grounded Accuracy</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">96.4%</div>
          <div className="text-[11px] text-emerald-700 font-medium">Zero hallucination guard active</div>
        </div>
      </div>

      {/* Fast Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
            {role === 'Admin' ? 'Tenant Admin Controls' : 'Paralegal Actions'}
          </p>
          <h3 className="text-sm font-extrabold text-slate-900">
            {role === 'Admin' ? 'Configure Firm Legal Platform' : 'Start Research or Matter Work'}
          </h3>

          <div className="flex flex-col gap-2 pt-1">
            {role === 'Admin' ? (
              <>
                <button
                  onClick={() => navigate('Profiles')}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50/50 transition text-left cursor-pointer"
                >
                  <Cpu className="w-4 h-4 text-violet-700 shrink-0" />
                  <div className="flex-1">
                    <strong className="block text-xs font-bold text-slate-900">Set LLM Profiles</strong>
                    <span className="block text-[11px] text-slate-500">Tune temperature, top-p, and legal system prompts</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => navigate('Knowledge Bases')}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50/50 transition text-left cursor-pointer"
                >
                  <Database className="w-4 h-4 text-violet-700 shrink-0" />
                  <div className="flex-1">
                    <strong className="block text-xs font-bold text-slate-900">Manage Knowledge Bases</strong>
                    <span className="block text-[11px] text-slate-500">Review vector indexes, collections, and synchronization</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => navigate('Corpus & Retrieval Tests')}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50/50 transition text-left cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-violet-700 shrink-0" />
                  <div className="flex-1">
                    <strong className="block text-xs font-bold text-slate-900">Upload & Retrieval Tests</strong>
                    <span className="block text-[11px] text-slate-500">Ingest test documents & benchmark retrieval accuracy</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('Cases')}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50/50 transition text-left cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-violet-700 shrink-0" />
                  <div className="flex-1">
                    <strong className="block text-xs font-bold text-slate-900">Upload Case Files</strong>
                    <span className="block text-[11px] text-slate-500">Add client pleadings, petitions, and witness statements</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => navigate('Legal Search')}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50/50 transition text-left cursor-pointer"
                >
                  <Library className="w-4 h-4 text-violet-700 shrink-0" />
                  <div className="flex-1">
                    <strong className="block text-xs font-bold text-slate-900">Legal Precedent Search</strong>
                    <span className="block text-[11px] text-slate-500">Search judgments, section transitions, and binding ratios</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Workflow Architecture Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
            Tenant Workflow Routing
          </p>
          <h3 className="text-sm font-extrabold text-slate-900">Decoupled Architecture Pipeline</h3>
          <div className="flex flex-col gap-2 pt-1">
            {[
              'Tenant-specific ingestion trigger (/webhooks/run/legal/ingest or /legal/ingest)',
              'Extraction & Vectorization using configured LLM Profile & Chunking strategy',
              'Natural Language Intent Parsing on search query (Judge, Court, Statute, Disposition)',
              'Hybrid Semantic Retrieval with Citation provenance verification'
            ].map((step, i) => (
              <div
                key={step}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700"
              >
                <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// -----------------------------------------------------------------------------
// TENANT ADMIN: PROFILES VIEW
// -----------------------------------------------------------------------------
function ProfilesView({ show }: { show: (message: string) => void }) {
  const [profiles, setProfiles] = useState<LLMProfile[]>(DEFAULT_PROFILES);
  const [selectedId, setSelectedId] = useState('prof-legal-gpt4o');

  const activeProfile = profiles.find((p) => p.id === selectedId) || profiles[0];

  const handleSelectActive = (id: string) => {
    setSelectedId(id);
    setProfiles((prev) =>
      prev.map((p) => ({ ...p, is_active: p.id === id }))
    );
    show(`Active profile updated to ${profiles.find((p) => p.id === id)?.name}`);
  };

  return (
    <>
      <Heading
        title="Tenant LLM Profiles"
        description="Select and configure active LLM profiles used for legal reasoning, statutory extraction, and judgment summaries."
        action={
          <button
            onClick={() => show('Profile settings saved successfully.')}
            className="px-4 py-2 bg-violet-700 hover:bg-violet-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" /> Save Profile Configurations
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Profile Selector List */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
            Available Profiles
          </p>
          {profiles.map((prof) => (
            <div
              key={prof.id}
              onClick={() => handleSelectActive(prof.id)}
              className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col gap-2 ${
                prof.id === selectedId
                  ? 'bg-violet-50/70 border-violet-500 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900">{prof.name}</span>
                {prof.is_active && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Provider: <span className="font-semibold text-slate-700">{prof.provider}</span> ({prof.model})
              </p>
              <div className="flex items-center gap-3 text-[10px] text-slate-600 pt-1 border-t border-slate-200/50">
                <span>Temp: {prof.temperature}</span>
                <span>Max Tokens: {prof.max_tokens}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Profile Configuration Editor */}
        <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">{activeProfile.name} Configuration</h3>
              <p className="text-[11px] text-slate-500">Adjust parameters for the active tenant legal pipeline.</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
              Model: {activeProfile.model}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-800 flex justify-between">
                <span>Temperature</span>
                <span className="text-violet-700">{activeProfile.temperature}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={activeProfile.temperature}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setProfiles((prev) =>
                    prev.map((p) => (p.id === activeProfile.id ? { ...p, temperature: val } : p))
                  );
                }}
                className="w-full accent-violet-700 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">Low values (0.0–0.2) recommended for legal precision.</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-800 flex justify-between">
                <span>Top-P (Nucleus Sampling)</span>
                <span className="text-violet-700">{activeProfile.top_p}</span>
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={activeProfile.top_p}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setProfiles((prev) =>
                    prev.map((p) => (p.id === activeProfile.id ? { ...p, top_p: val } : p))
                  );
                }}
                className="w-full accent-violet-700 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">Controls diversity of generated legal analysis.</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-800">
              System Instruction Prompt
            </label>
            <textarea
              rows={4}
              value={activeProfile.system_prompt}
              onChange={(e) => {
                const val = e.target.value;
                setProfiles((prev) =>
                  prev.map((p) => (p.id === activeProfile.id ? { ...p, system_prompt: val } : p))
                );
              }}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3 focus:outline-none focus:border-violet-700"
            />
          </div>
        </div>
      </div>
    </>
  );
}

// -----------------------------------------------------------------------------
// TENANT ADMIN: KNOWLEDGE BASES VIEW
// -----------------------------------------------------------------------------
function KnowledgeBasesView({ show }: { show: (message: string) => void }) {
  const [kbList] = useState(DEFAULT_KNOWLEDGE_BASES);

  return (
    <>
      <Heading
        title="Knowledge Base Management"
        description="View and oversee statutory and case law collections connected to your tenant."
        action={
          <Link
            href="/admin?tab=knowledge"
            className="px-3.5 py-1.5 bg-violet-700 hover:bg-violet-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Full Knowledge Console
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {kbList.map((kb) => (
          <div
            key={kb.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3 hover:border-violet-300 transition"
          >
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center font-bold">
                <Database className="w-4 h-4" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                {kb.status}
              </span>
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-slate-900">{kb.name}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Type: {kb.type}</p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>{kb.documents} indexed documents</span>
              <span className="text-[10px] text-slate-400">{kb.last_updated}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// -----------------------------------------------------------------------------
// TENANT ADMIN: CORPUS & RETRIEVAL TESTS VIEW
// -----------------------------------------------------------------------------
function CorpusAndRetrievalView({ show }: { show: (message: string) => void }) {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [corpusText, setCorpusText] = useState('');
  const [ingesting, setIngesting] = useState(false);

  // Retrieval Test Bench State
  const [testQuery, setTestQuery] = useState(
    'Section 148A(b) notice quashed principles of natural justice hearing breach'
  );
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any[] | null>(null);

  const handleIngest = async () => {
    if (!corpusText.trim() && uploadedFiles.length === 0) {
      show('Please provide text or files to ingest');
      return;
    }
    setIngesting(true);
    try {
      await api.ingestLegalDocument({
        title: uploadedFiles[0] || 'Manual Legal Corpus Paste',
        document_text: corpusText,
        corpus_type: 'firm_corpus',
      });
      show('Document successfully processed through tenant ingestion workflow.');
      setUploadedFiles([]);
      setCorpusText('');
    } catch (err: any) {
      show(`Ingestion failed: ${err.message}`);
    } finally {
      setIngesting(false);
    }
  };

  const handleRunRetrievalTest = async () => {
    if (!testQuery.trim()) return;
    setTesting(true);
    try {
      const res = await api.searchLegalCases({ query: testQuery, limit: 3 });
      setTestResults(res.results || []);
      show(`Retrieval test completed: ${res.results?.length || 0} chunks retrieved.`);
    } catch (err: any) {
      show(`Retrieval test failed: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <>
      <Heading
        title="Corpus Ingestion & Retrieval Test Bench"
        description="Upload firm documents to the corpus and benchmark retrieval relevance against active LLM profiles."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PANEL A: Ingestion Form */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
              <Upload className="w-4 h-4 text-violet-700" /> Ingest Documents to Tenant Corpus
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold">Workflow: /legal/ingest</span>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 flex flex-col items-center justify-center text-center gap-2 hover:border-violet-500 transition">
            <Upload className="w-6 h-6 text-violet-700" />
            <p className="text-xs font-bold text-slate-800">Select Files (PDF, DOCX, TXT)</p>
            <input
              id="corpus-file-upload"
              type="file"
              accept=".pdf,.docx,.txt"
              multiple
              className="hidden"
              onChange={(e) => {
                const names = Array.from(e.target.files ?? []).map((f) => f.name);
                setUploadedFiles((prev) => [...prev, ...names]);
                if (names.length) show(`${names.length} file(s) queued for ingestion.`);
              }}
            />
            <label
              htmlFor="corpus-file-upload"
              className="px-3.5 py-1.5 bg-violet-700 hover:bg-violet-800 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs"
            >
              Browse Files
            </label>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-bold uppercase text-slate-600">Queued Files:</p>
              {uploadedFiles.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs text-slate-800">
                  <span>{f}</span>
                  <span className="text-[10px] text-emerald-700 font-bold">Ready</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-800">Or Paste Source Text</label>
            <textarea
              rows={3}
              value={corpusText}
              onChange={(e) => setCorpusText(e.target.value)}
              placeholder="Paste judgments, legal opinions, or statutory interpretations..."
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:border-violet-700"
            />
          </div>

          <button
            onClick={handleIngest}
            disabled={ingesting}
            className="w-full py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {ingesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>{ingesting ? 'Ingesting via Workflow...' : 'Execute Ingestion'}</span>
          </button>
        </div>

        {/* PANEL B: Retrieval Test Bench */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-violet-700" /> Interactive Retrieval Benchmark
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold">Workflow: /legal/search</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-800">Benchmark Search Query</label>
            <div className="flex gap-2">
              <input
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                placeholder="Enter test legal query..."
                className="flex-1 text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-violet-700"
              />
              <button
                onClick={handleRunRetrievalTest}
                disabled={testing}
                className="px-4 py-2 bg-violet-700 hover:bg-violet-800 text-white rounded-xl text-xs font-bold transition shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
              >
                {testing ? 'Benchmarking...' : 'Test Retrieval'}
              </button>
            </div>
          </div>

          {/* Test Results Output */}
          <div className="flex-1 flex flex-col gap-2 min-h-[160px] overflow-y-auto">
            {testResults ? (
              testResults.map((r, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 font-bold">{r.title || 'Judgment'}</strong>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-violet-100 text-violet-800 rounded-full">
                      Score: {r.relevance_score}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{r.court} · Judge: {r.judge || 'Bench'}</p>
                  <p className="text-[11px] text-slate-700 font-medium">Disposition: {r.disposition}</p>
                </div>
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400 text-center p-6">
                Click &apos;Test Retrieval&apos; to run vector similarity and statutory intent benchmarks.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// -----------------------------------------------------------------------------
// TENANT ADMIN: AUDIT LOGS VIEW
// -----------------------------------------------------------------------------
function AuditLogsView({ show }: { show: (message: string) => void }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await api.getLegalAuditLogs();
        setLogs(res || []);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  return (
    <>
      <Heading
        title="Compliance & Accounting Audit Logs"
        description="Immutable audit trail of all legal search queries, document ingestion runs, and workflow executions."
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading audit trail...</div>
        ) : logs.length > 0 ? (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Query / Document</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Results</th>
                <th className="p-3.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/60 transition">
                  <td className="p-3.5 font-bold text-slate-900">{l.action}</td>
                  <td className="p-3.5 text-slate-700 max-w-xs truncate">{l.query_text}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-md bg-violet-50 text-violet-800 text-[10px] font-bold">
                      {l.role}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-600">{l.results_count}</td>
                  <td className="p-3.5 text-right text-slate-500 text-[11px]">{l.timestamp || 'Just now'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            No audit records found. Executed search and ingestion queries will automatically log here.
          </div>
        )}
      </div>
    </>
  );
}

// -----------------------------------------------------------------------------
// PARALEGAL / SHARED: CASES VIEW
// -----------------------------------------------------------------------------
function CasesView({
  role,
  navigate,
  show
}: {
  role: Role;
  navigate: (view: View) => void;
  show: (message: string) => void;
}) {
  const [caseList, setCaseList] = useState(initialCases);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('');
  const [selectedCase, setSelectedCase] = useState<any | null>(initialCases[0]);
  const [uploadingCaseDoc, setUploadingCaseDoc] = useState(false);

  const handleCreateCase = () => {
    if (!newTitle.trim()) return;
    const item = {
      id: `case-${Date.now()}`,
      title: newTitle,
      type: newType || 'General matter',
      court: 'High Court of Delhi',
      files: [],
      updated: 'Just now',
    };
    setCaseList([item, ...caseList]);
    setSelectedCase(item);
    setNewTitle('');
    setNewType('');
    show(`Created case workspace for '${newTitle}'`);
  };

  const handleUploadToCase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedCase) return;
    const filename = files[0].name;

    setUploadingCaseDoc(true);
    try {
      await api.ingestLegalDocument({
        title: filename,
        case_id: selectedCase.id,
        corpus_type: 'case_material',
        document_text: `Client uploaded matter document: ${filename}`,
      });

      setCaseList((prev) =>
        prev.map((c) =>
          c.id === selectedCase.id
            ? { ...c, files: [...c.files, filename], updated: 'Just now' }
            : c
        )
      );
      setSelectedCase((prev: any) =>
        prev ? { ...prev, files: [...prev.files, filename] } : prev
      );
      show(`File '${filename}' uploaded and indexed to case workspace.`);
    } catch (err: any) {
      show(`Upload failed: ${err.message}`);
    } finally {
      setUploadingCaseDoc(false);
    }
  };

  return (
    <>
      <Heading
        title={role === 'Admin' ? 'Firm Case Workspaces' : 'Active Case Workspaces'}
        description="Manage matter files, client chronology, witness statements, and precedent binders."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases List */}
        <div className="flex flex-col gap-4">
          {/* Create Case Input */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              New Case Workspace
            </p>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Mehta Industries v. Union of India"
              className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-violet-700"
            />
            <input
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              placeholder="e.g. Writ Petition / Sec 148A Tax Appeal"
              className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-violet-700"
            />
            <button
              onClick={handleCreateCase}
              className="w-full py-2 bg-violet-700 hover:bg-violet-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Create Workspace
            </button>
          </div>

          {/* List */}
          <div className="flex flex-col gap-2">
            {caseList.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCase(c)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col gap-1.5 ${
                  selectedCase?.id === c.id
                    ? 'bg-violet-50/60 border-violet-400 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-900">{c.title}</h4>
                  <span className="text-[10px] text-slate-400">{c.updated}</span>
                </div>
                <p className="text-[11px] text-slate-500">{c.type} · {c.court}</p>
                <div className="flex items-center gap-1 text-[10px] text-violet-700 font-semibold mt-1">
                  <span>{c.files.length} documents uploaded</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Case Workspace Details */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-5">
          {selectedCase ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700">
                    Active Matter Workspace
                  </span>
                  <h2 className="text-base font-extrabold text-slate-900 mt-0.5">{selectedCase.title}</h2>
                  <p className="text-xs text-slate-500">{selectedCase.type} — {selectedCase.court}</p>
                </div>
                <button
                  onClick={() => navigate('Legal Search')}
                  className="px-3.5 py-1.5 bg-violet-700 hover:bg-violet-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 self-start cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" /> Research for Case
                </button>
              </div>

              {/* Upload Case File Button */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <strong className="block text-xs font-bold text-slate-800">Upload Matter Documents</strong>
                  <span className="block text-[11px] text-slate-500">
                    Files are indexed into case binder via tenant /legal/ingest workflow.
                  </span>
                </div>
                <input
                  id="case-doc-upload"
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={handleUploadToCase}
                />
                <label
                  htmlFor="case-doc-upload"
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {uploadingCaseDoc ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>{uploadingCaseDoc ? 'Uploading...' : 'Upload File'}</span>
                </label>
              </div>

              {/* Files in Case */}
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Case Documents & Intakes ({selectedCase.files.length})
                </p>
                {selectedCase.files.length > 0 ? (
                  selectedCase.files.map((file: string, i: number) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-white border border-slate-200 text-xs flex items-center justify-between shadow-2xs hover:border-slate-300 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-violet-700" />
                        <span className="font-semibold text-slate-800">{file}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Indexed
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No documents uploaded yet. Click &apos;Upload File&apos; above.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center p-12 text-xs text-slate-400">
              Select a case from the left list.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// -----------------------------------------------------------------------------
// SEARCH VIEW (EMBEDDED LEGAL RESEARCH HUB)
// -----------------------------------------------------------------------------
function SearchView({ show }: { show: (message: string) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <Heading
        title="Legal Precedent Research Hub"
        description="AI Semantic & Structured precedent retrieval powered by tenant workflow /legal/search."
      />
      <LegalResearchHub />
    </div>
  );
}

// -----------------------------------------------------------------------------
// SAVED BRIEFS VIEW
// -----------------------------------------------------------------------------
function SavedBriefsView({ show }: { show: (message: string) => void }) {
  const [briefs] = useState([
    { title: 'Mens rea requirement in economic offences under CGST', case: 'State v. Mehra', updated: 'Today, 11:20 AM' },
    { title: 'Section 148A(b) Notice Quashing Precedents (Delhi HC)', case: 'Arora Industries v. DCIT', updated: 'Yesterday' },
    { title: 'BNS Sec 103(1) transition comparative brief', case: 'Khan v. Union of India', updated: '3 days ago' },
  ]);

  return (
    <>
      <Heading
        title="Saved Briefs & Research Notes"
        description="Review and export grounded research notes saved from case work and precedent searches."
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <th className="p-3.5">Brief Note</th>
              <th className="p-3.5">Associated Matter</th>
              <th className="p-3.5">Last Updated</th>
              <th className="p-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {briefs.map((b, i) => (
              <tr key={i} className="hover:bg-slate-50/60 transition">
                <td className="p-3.5 font-bold text-slate-900">{b.title}</td>
                <td className="p-3.5 text-slate-600">{b.case}</td>
                <td className="p-3.5 text-slate-500">{b.updated}</td>
                <td className="p-3.5 text-right">
                  <button
                    onClick={() => show(`Exported brief: '${b.title}'`)}
                    className="text-violet-700 hover:text-violet-900 font-bold text-xs flex items-center gap-1 ml-auto cursor-pointer"
                  >
                    Export Binder <Download className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
