/*
===============================================================================
BLOCK COMMENT: LEGAL AI PLATFORM - DEFAULT THEME IMPLEMENTATION
Module: frontend/app/legal/page.tsx
Description:
    Default light theme implementation using standard Tailwind CSS classes.
    - Clean slate-50/white cards with border-slate-200 and shadow-xs.
    - Integrated 3-Panel Legal Precedent Research Hub.
    - Seamless role switching and workspace navigation.
===============================================================================
*/

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  Download,
  ExternalLink,
  FileSearch,
  FolderKanban,
  HelpCircle,
  Library,
  Menu,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
  X,
  Scale,
  Plus
} from 'lucide-react';
import { Button } from '@components/ui/button';
import LegalResearchHub from './LegalResearchHub';

type Role = 'Admin' | 'Paralegal';
type View = 'Overview' | 'Upload & Corpus' | 'Users' | 'Cases' | 'Legal Search' | 'Saved Briefs';

const adminNav: View[] = ['Overview', 'Upload & Corpus', 'Users', 'Cases', 'Legal Search', 'Saved Briefs'];
const paraNav: View[] = ['Overview', 'Cases', 'Legal Search', 'Saved Briefs'];
const cases = [
  'State v. Mehra — Bail application',
  'Arora Industries — Tax appeal',
  'Khan v. Union of India — Writ petition',
  'Rao matter — Commercial dispute'
];
const files = ['Matter_Chronology.docx', 'Witness_Statement.pdf', 'Client_notes.txt'];

export default function Page() {
  const [role, setRole] = useState<Role>('Paralegal');
  const [view, setView] = useState<View>('Overview');
  const [mobile, setMobile] = useState(false);
  const [notice, setNotice] = useState('');

  const show = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2600);
  };

  const switchRole = (next: Role) => {
    setRole(next);
    setView('Overview');
    show(`${next} workspace active`);
  };

  const navigate = (next: View) => {
    setView(next);
    setMobile(false);
  };

  const nav = role === 'Admin' ? adminNav : paraNav;

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
              <span className="block text-[10px] text-slate-500 font-medium">AZB & Partners</span>
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
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Preview Role
          </p>
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
                  <span>{item}</span>
                </div>
                {role === item && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 py-1 overflow-y-auto">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 px-2 mb-1">
            {role} Workspace
          </p>
          {nav.map((item) => (
            <button
              key={item}
              onClick={() => navigate(item)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                view === item
                  ? 'bg-violet-50 text-violet-800 border border-violet-200 shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {item === 'Overview' ? (
                <Activity className="w-4 h-4 text-violet-700" />
              ) : item === 'Upload & Corpus' ? (
                <Upload className="w-4 h-4 text-violet-700" />
              ) : item === 'Users' ? (
                <Users className="w-4 h-4 text-violet-700" />
              ) : item === 'Cases' ? (
                <FolderKanban className="w-4 h-4 text-violet-700" />
              ) : item === 'Legal Search' ? (
                <Library className="w-4 h-4 text-violet-700" />
              ) : (
                <BarChart3 className="w-4 h-4 text-violet-700" />
              )}
              <span>{item}</span>
              {item === 'Upload & Corpus' && (
                <span className="ml-auto text-[9px] px-1.5 py-0.5 bg-violet-100 text-violet-800 rounded font-bold">
                  Admin
                </span>
              )}
            </button>
          ))}

          {/* Direct Admin Links */}
          {role === 'Admin' && (
            <div className="pt-3 mt-2 border-t border-slate-100 flex flex-col gap-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 px-2 mb-1">
                Admin Consoles
              </p>
              <Link
                href="/admin?tab=knowledge"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Knowledge Base</span>
                <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
              </Link>
              <Link
                href="/admin?tab=users"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>User Management</span>
                <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
              </Link>
            </div>
          )}
        </nav>

        {/* User Info */}
        <div className="pt-3 mt-auto border-t border-slate-100 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-800 font-bold flex items-center justify-center text-xs">
            AM
          </div>
          <div className="flex-1 truncate">
            <strong className="block text-xs font-bold text-slate-900 truncate">Ananya Mehta</strong>
            <span className="block text-[10px] text-slate-500">{role} Workspace</span>
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
              onClick={() => navigate('Legal Search')}
              className="px-3 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-700" />
              <span>Legal Research</span>
            </button>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
              {role === 'Admin' ? '42 / 50 seats' : 'Paralegal access'}
            </span>
            <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-xs">
              AM
            </div>
          </div>
        </header>

        {/* View Router */}
        <div className="p-6 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">
          {view === 'Overview' && <Overview role={role} navigate={navigate} show={show} />}
          {view === 'Upload & Corpus' && role === 'Admin' && <AdminCorpus show={show} />}
          {view === 'Users' && role === 'Admin' && <UsersView show={show} />}
          {view === 'Cases' && <CasesView role={role} navigate={navigate} show={show} />}
          {view === 'Legal Search' && <SearchView navigate={navigate} show={show} />}
          {view === 'Saved Briefs' && <Saved navigate={navigate} show={show} />}
        </div>
      </section>

      {/* TOAST */}
      {notice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{notice}</span>
        </div>
      )}
    </main>
  );
}

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

function Overview({
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
        title={role === 'Admin' ? 'Administration Center' : 'Seek Grounded Legal Help'}
        description={
          role === 'Admin'
            ? 'Manage users, firm corpus, cases, and knowledge sources used by Legal AI.'
            : 'Upload case material or search existing matters for grounded legal assistance.'
        }
        action={
          <button
            onClick={() => show('Help: Upload case files, verify grounded citations, and export binders.')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" /> How this works
          </button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{role === 'Admin' ? 'Indexed Corpus' : 'Active Cases'}</span>
            <FileSearch className="w-4 h-4 text-violet-700" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{role === 'Admin' ? '2,846' : '24'}</div>
          <div className="text-[11px] text-slate-500">
            {role === 'Admin' ? '94 added this month' : '8 updated this week'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{role === 'Admin' ? 'Active Users' : 'Saved Briefs'}</span>
            <Users className="w-4 h-4 text-violet-700" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{role === 'Admin' ? '42' : '18'}</div>
          <div className="text-[11px] text-slate-500">
            {role === 'Admin' ? '3 pending invites' : '6 updated this week'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Grounded Matches</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">94%</div>
          <div className="text-[11px] text-emerald-700 font-medium">Cross-checked against past data</div>
        </div>
      </div>

      {/* Actions & Workflow */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
            {role === 'Admin' ? 'Admin Actions' : 'Fast Actions'}
          </p>
          <h3 className="text-sm font-extrabold text-slate-900">
            {role === 'Admin' ? 'Keep Knowledge Base Updated' : 'What would you like to do?'}
          </h3>

          <div className="flex flex-col gap-2 pt-1">
            {role === 'Admin' ? (
              <>
                <button
                  onClick={() => navigate('Upload & Corpus')}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50/50 transition text-left cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-violet-700 shrink-0" />
                  <div className="flex-1">
                    <strong className="block text-xs font-bold text-slate-900">Upload & Pass Data</strong>
                    <span className="block text-[11px] text-slate-500">Add DOCX, PDF, TXT to firm corpus</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => navigate('Users')}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50/50 transition text-left cursor-pointer"
                >
                  <Users className="w-4 h-4 text-violet-700 shrink-0" />
                  <div className="flex-1">
                    <strong className="block text-xs font-bold text-slate-900">Manage Users</strong>
                    <span className="block text-[11px] text-slate-500">Invite, change access, or roles</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => navigate('Cases')}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50/50 transition text-left cursor-pointer"
                >
                  <FolderKanban className="w-4 h-4 text-violet-700 shrink-0" />
                  <div className="flex-1">
                    <strong className="block text-xs font-bold text-slate-900">Manage Cases</strong>
                    <span className="block text-[11px] text-slate-500">Audit case workspaces</span>
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
                    <strong className="block text-xs font-bold text-slate-900">Upload to a Case</strong>
                    <span className="block text-[11px] text-slate-500">Add DOCX, PDF, or client notes</span>
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
                    <span className="block text-[11px] text-slate-500">Find judgments, sections, and BNS signals</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Grounded Process */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
            Grounded Workflow
          </p>
          <h3 className="text-sm font-extrabold text-slate-900">From Intake to Verifiable Brief</h3>
          <div className="flex flex-col gap-2 pt-1">
            {[
              'Upload or paste case material into active matter',
              'Cross-check past firm precedents and statutory sections',
              'Review citations and IPC/CrPC → BNS/BNSS transition mapping',
              'Save grounded precedent directly to case binder'
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

function AdminCorpus({ show }: { show: (message: string) => void }) {
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [text, setText] = useState('');

  return (
    <>
      <Heading
        title="Upload & Firm Corpus"
        description="Admin-only controls for adding and indexing firm knowledge."
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/admin?tab=knowledge"
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-violet-700" /> Admin Console
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-2xl border-2 border-dashed border-slate-300 hover:border-violet-500 transition flex flex-col items-center justify-center text-center p-6 gap-3">
          <Upload className="w-8 h-8 text-violet-700" />
          <h3 className="text-xs font-bold text-slate-900">Pass Data to the Corpus</h3>
          <p className="text-[11px] text-slate-500 max-w-xs">
            Upload DOCX, PDF, TXT files for automated parsing and indexing.
          </p>
          <input
            id="admin-file"
            type="file"
            accept=".docx,.pdf,.txt"
            multiple
            className="hidden"
            onChange={(e) => {
              const names = Array.from(e.target.files ?? []).map((file) => file.name);
              setUploaded((prev) => [...prev, ...names]);
              if (names.length) show(`${names.length} file(s) added to intake queue`);
            }}
          />
          <label
            htmlFor="admin-file"
            className="px-4 py-2 bg-violet-700 hover:bg-violet-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" /> Choose Files
          </label>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-2.5">
          <label htmlFor="corpus-text" className="text-xs font-bold text-slate-800">
            Paste Source Text
          </label>
          <textarea
            id="corpus-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste statutes, firm notes, or reference judgments..."
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3 h-28 focus:outline-none focus:border-violet-700"
          />
          <button
            onClick={() => {
              if (text.trim()) {
                setUploaded((prev) => [...prev, 'Pasted Source Text']);
                setText('');
                show('Pasted text added to intake queue');
              }
            }}
            className="self-end px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Add Text to Queue
          </button>
        </div>
      </div>

      {/* Intake Queue */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold text-slate-900">Intake Queue (Ready to Index)</h3>
          <button
            onClick={() => show('Corpus indexing started')}
            className="px-3.5 py-1.5 bg-violet-700 hover:bg-violet-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Index All Items
          </button>
        </div>

        {uploaded.length > 0 ? (
          <div className="flex flex-col gap-2">
            {uploaded.map((f, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <div className="flex items-center gap-2">
                  <FileSearch className="w-4 h-4 text-violet-700" />
                  <span className="font-semibold text-slate-800">{f}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Ready
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs">
            No files waiting in queue. Upload files or paste text above.
          </div>
        )}
      </div>
    </>
  );
}

function UsersView({ show }: { show: (message: string) => void }) {
  const [users, setUsers] = useState([
    ['Ananya Mehta', 'Admin', 'Active'],
    ['Rohan Iyer', 'Paralegal', 'Active'],
    ['Priya Kapoor', 'Paralegal', 'Active'],
    ['Vikram Shah', 'Admin', 'Pending']
  ]);

  return (
    <>
      <Heading
        title="User Management"
        description="Admin-only access controls for firm members."
        action={
          <button
            onClick={() => show('Invite user modal opened')}
            className="px-3.5 py-1.5 bg-violet-700 hover:bg-violet-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Invite User
          </button>
        }
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <th className="p-3.5">User</th>
              <th className="p-3.5">Role</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(([name, userRole, status]) => (
              <tr key={name} className="hover:bg-slate-50/60 transition">
                <td className="p-3.5 font-bold text-slate-900">{name}</td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded-md bg-violet-50 text-violet-800 border border-violet-200 text-[10px] font-bold">
                    {userRole}
                  </span>
                </td>
                <td className="p-3.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {status}
                  </span>
                </td>
                <td className="p-3.5 text-right">
                  <button
                    onClick={() => {
                      setUsers((prev) =>
                        prev.map((u) =>
                          u[0] === name ? [u[0], u[1], u[2] === 'Active' ? 'Suspended' : 'Active'] : u
                        )
                      );
                      show(`${name} status updated`);
                    }}
                    className="text-violet-700 hover:text-violet-900 font-bold text-xs cursor-pointer"
                  >
                    {status === 'Active' ? 'Suspend' : 'Activate'}
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

function CasesView({
  role,
  navigate,
  show
}: {
  role: Role;
  navigate: (view: View) => void;
  show: (message: string) => void;
}) {
  const [newCase, setNewCase] = useState('');
  const [caseList, setCaseList] = useState(cases);

  return (
    <>
      <Heading
        title={role === 'Admin' ? 'Firm Case Registry' : 'Case Workspaces'}
        description="Organize matter documents, citations, and grounded research notes."
      />

      {role === 'Paralegal' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <input
            value={newCase}
            onChange={(e) => setNewCase(e.target.value)}
            placeholder="Create new case workspace name..."
            className="flex-1 text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-700"
          />
          <button
            onClick={() => {
              if (newCase.trim()) {
                setCaseList((prev) => [newCase, ...prev]);
                setNewCase('');
                show('New case workspace created');
              }
            }}
            className="px-4 py-2.5 bg-violet-700 hover:bg-violet-800 text-white rounded-xl text-xs font-bold transition shadow-xs shrink-0 cursor-pointer"
          >
            Create Case
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {caseList.map((item) => (
          <div
            key={item}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-3.5 hover:border-violet-300 transition"
          >
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center shrink-0">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <h3 className="text-xs font-extrabold text-slate-900">{item}</h3>
              <p className="text-[11px] text-slate-500">Cross-checked documents · Citations ready</p>
              <button
                onClick={() => navigate('Legal Search')}
                className="self-start text-xs font-bold text-violet-700 hover:text-violet-900 flex items-center gap-1 mt-1 cursor-pointer"
              >
                Open in Research Hub <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function SearchView({
  navigate,
  show
}: {
  navigate: (view: View) => void;
  show: (message: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Heading
        title="Legal Precedent Research Hub"
        description="Search judgments, binding precedents, statutory citations, and court orders with multi-dimensional filtering."
      />
      <LegalResearchHub />
    </div>
  );
}

function Saved({
  navigate,
  show
}: {
  navigate: (view: View) => void;
  show: (message: string) => void;
}) {
  return (
    <>
      <Heading
        title="Saved Briefs"
        description="Review grounded research notes saved from case work and precedent search."
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <th className="p-3.5">Brief Note</th>
              <th className="p-3.5">Associated Case</th>
              <th className="p-3.5">Updated</th>
              <th className="p-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {['Mens rea in economic offences', 'Arjun bail application — first draft', 'BNS transition note for client call'].map((item, i) => (
              <tr key={item} className="hover:bg-slate-50/60 transition">
                <td className="p-3.5 font-bold text-slate-900">{item}</td>
                <td className="p-3.5 text-slate-600">{cases[i]}</td>
                <td className="p-3.5 text-slate-500">{i === 0 ? 'Today, 10:42 AM' : 'Yesterday'}</td>
                <td className="p-3.5 text-right">
                  <button
                    onClick={() => navigate('Legal Search')}
                    className="text-violet-700 hover:text-violet-900 font-bold text-xs flex items-center gap-1 ml-auto cursor-pointer"
                  >
                    Open Hub <Download className="w-3.5 h-3.5" />
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
