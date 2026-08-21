/*
===============================================================================
BLOCK COMMENT: LEGAL AI PLATFORM - STANDARD MAIN PAGE LAYOUT
Module: frontend/app/legal/page.tsx
Description:
    Legal AI platform matching the exact layout and design system of the main admin page (/admin).
    - Top subnav tabs: Overview, Cases, Legal Search, Saved Briefs, Audit Logs
    - Role Switcher & System Admin Module Navigation (/admin?tab=profiles, /admin?tab=knowledge, /admin?tab=playground, /admin?tab=users)
    - Fully multi-tenant and domain-agnostic backend integration.
===============================================================================
*/

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Check,
  Cpu,
  Database,
  Download,
  ExternalLink,
  FileSearch,
  FileText,
  FolderKanban,
  HelpCircle,
  Library,
  Lock,
  Plus,
  RefreshCw,
  Scale,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
  Workflow,
} from 'lucide-react';
import { api } from '@/lib/api';
import LegalResearchHub from './LegalResearchHub';

/*
===============================================================================
BLOCK COMMENT: EMBEDDED TENANT MANAGEMENT & LEGAL AI PLATFORM
Module: frontend/app/legal/page.tsx
Description:
    - Unified Legal AI Platform with integrated tabs for Matter Management & Tenant Administration.
    - Standard Legal tabs: Overview, Cases, Precedent Search, Saved Briefs, Audit Trail.
    - Tenant Admin tabs: LLM Profiles, Knowledge Bases, Playground, Users, Roles, Workflows.
    - Fully multi-tenant and directly calls scoped backend APIs.
===============================================================================
*/

import { useSearchParams } from 'next/navigation';
import { hasPermissionScope, loadRoutePermissionsFromDB } from '@/lib/config/route_permissions';
import ProfilesTab from '@/app/admin/profiles/page';
import KnowledgeBasesTab from '@/app/admin/knowledge/page';
import UsersTab from '@/app/admin/users/page';
import RolesTab from '@/app/admin/roles/page';
import WorkflowsTab from '@/app/admin/workflows/page';
import PlaygroundTab from '@/app/admin/playground/page';

type View =
  | 'overview'
  | 'cases'
  | 'search'
  | 'briefs'
  | 'profiles'
  | 'knowledge'
  | 'playground'
  | 'users'
  | 'roles'
  | 'workflows'
  | 'audit';

interface TabDefinition {
  id: View;
  label: string;
  icon: React.ReactNode;
  permission?: string;
  fallbackAdmin?: boolean;
}

const ALL_LEGAL_TABS: TabDefinition[] = [
  { id: 'overview', label: 'Overview', icon: <Activity className="w-4 h-4" /> },
  { id: 'cases', label: 'Case Workspaces', icon: <FolderKanban className="w-4 h-4" />, permission: 'legal:case_management:view' },
  { id: 'search', label: 'Precedent Search', icon: <Library className="w-4 h-4" />, permission: 'legal:research:query' },
  { id: 'briefs', label: 'Saved Briefs', icon: <FileSearch className="w-4 h-4" />, permission: 'legal:case_management:bookmark' },
  { id: 'profiles', label: 'LLM Profiles', icon: <Cpu className="w-4 h-4" />, permission: 'admin:profiles:view', fallbackAdmin: true },
  { id: 'knowledge', label: 'Knowledge Bases', icon: <Database className="w-4 h-4" />, permission: 'admin:knowledge:view', fallbackAdmin: true },
  { id: 'playground', label: 'Playground', icon: <Sparkles className="w-4 h-4" />, permission: 'admin:playground:view', fallbackAdmin: true },
  { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" />, permission: 'admin:user_management:read', fallbackAdmin: true },
  { id: 'roles', label: 'Roles', icon: <Shield className="w-4 h-4" />, permission: 'admin:role_management:view', fallbackAdmin: true },
  { id: 'workflows', label: 'Workflows', icon: <Workflow className="w-4 h-4" />, permission: 'admin:workflows:view', fallbackAdmin: true },
  { id: 'audit', label: 'Audit Trail', icon: <ShieldCheck className="w-4 h-4" />, permission: 'legal:research:query' },
];

function LegalPlatformContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeRole, setActiveRole] = useState<string>('tenant_admin');
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<View>('overview');
  const [playgroundKbId, setPlaygroundKbId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  // Initial Auth & Role Check
  useEffect(() => {
    async function loadUser() {
      try {
        await loadRoutePermissionsFromDB().catch(() => { });
        const user = await api.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          const userRole = user.role || user.role_type || 'tenant_user';
          setActiveRole(userRole);
          setUserPermissions(user.permissions || []);

          if (Array.isArray(user.roles) && user.roles.length > 1) {
            setAvailableRoles(user.roles);
          } else {
            setAvailableRoles([userRole]);
          }
        }
      } catch (err) {
        console.error('Failed to load current user for legal portal:', err);
      }
    }
    loadUser();
  }, []);

  // Sync tab from URL query param
  useEffect(() => {
    const urlTab = searchParams?.get('tab') as View | null;
    if (urlTab) {
      setActiveTab(urlTab);
    }
  }, [searchParams]);

  const show = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3000);
  };

  const handleTabChange = (tabId: View) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabId);
      window.history.replaceState(null, '', url.pathname + url.search);
    }
  };

  const switchRole = (next: string) => {
    setActiveRole(next);
    show(`${next.replace(/_/g, ' ')} perspective active`);
  };

  const normalizedRole = (activeRole || '').toLowerCase();
  const isAdmin =
    normalizedRole === 'admin' ||
    normalizedRole === 'tenant_admin' ||
    normalizedRole === 'system_admin' ||
    hasPermissionScope(userPermissions, 'admin:*:*') ||
    hasPermissionScope(userPermissions, 'tenant:admin:*') ||
    hasPermissionScope(userPermissions, '*:*:*');

  const isAllowedTab = (tab: TabDefinition) => {
    if (tab.id === 'overview') return true;
    if (isAdmin) return true;
    if (userPermissions.length === 0) {
      if (tab.fallbackAdmin) return isAdmin;
      return true;
    }
    if (hasPermissionScope(userPermissions, '*:*:*')) return true;
    if (tab.fallbackAdmin && (hasPermissionScope(userPermissions, 'admin:*:*') || hasPermissionScope(userPermissions, 'tenant:admin:*'))) {
      return true;
    }
    if (tab.permission && hasPermissionScope(userPermissions, tab.permission)) {
      return true;
    }
    if (tab.id === 'cases' && (hasPermissionScope(userPermissions, 'legal:*:*') || hasPermissionScope(userPermissions, 'legal:case_management:*'))) {
      return true;
    }
    if (tab.id === 'search' && (hasPermissionScope(userPermissions, 'legal:*:*') || hasPermissionScope(userPermissions, 'legal:research:*'))) {
      return true;
    }
    if (tab.id === 'briefs' && (hasPermissionScope(userPermissions, 'legal:*:*') || hasPermissionScope(userPermissions, 'legal:research:*') || hasPermissionScope(userPermissions, 'legal:case_management:*'))) {
      return true;
    }
    if (tab.id === 'knowledge' && (hasPermissionScope(userPermissions, 'kb:*:*') || hasPermissionScope(userPermissions, 'kb:base:view') || hasPermissionScope(userPermissions, 'admin:knowledge:*'))) {
      return true;
    }
    if (tab.id === 'workflows' && (hasPermissionScope(userPermissions, 'workflow:*:*') || hasPermissionScope(userPermissions, 'workflow:view') || hasPermissionScope(userPermissions, 'workflow:builder:view'))) {
      return true;
    }
    if (tab.id === 'audit' && (hasPermissionScope(userPermissions, 'admin:logs:view') || hasPermissionScope(userPermissions, 'legal:*:*'))) {
      return true;
    }
    return false;
  };

  const tabs = ALL_LEGAL_TABS.filter(isAllowedTab);

  const formatRoleLabel = (roleStr: string) => {
    if (!roleStr) return 'User';
    if (roleStr.toLowerCase() === 'tenant_admin') return 'Tenant Admin';
    if (roleStr.toLowerCase() === 'system_admin') return 'System Admin';
    if (roleStr.toLowerCase() === 'para_legal' || roleStr.toLowerCase() === 'paralegal') return 'Paralegal';
    if (roleStr.toLowerCase() === 'legal_analyst') return 'Legal Analyst';
    return roleStr.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background text-foreground flex flex-col font-sans">
      <div className="flex-1 w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-8 flex flex-col gap-6">
        {/* HEADER BANNER */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-violet-700 text-white flex items-center justify-center font-bold shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold text-gray-900">Legal AI Platform</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800 text-[10px] font-bold uppercase tracking-wider">
                  {currentUser?.customer_id ? `Tenant: ${currentUser.customer_id}` : 'Firm Workspace'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                AI Semantic Retrieval, Precedent Analysis & Case Matter Management
              </p>
            </div>
          </div>

          {/* Role Display / Multi-Role Switcher */}
          <div className="flex items-center flex-wrap gap-2">
            {availableRoles.length > 1 ? (
              <div className="bg-gray-100 p-1 rounded-xl flex items-center border border-gray-200">
                {availableRoles.map((r) => (
                  <button
                    key={r}
                    onClick={() => switchRole(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${activeRole === r
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    {r.toLowerCase().includes('admin') ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-violet-700" />
                    ) : (
                      <FileSearch className="w-3.5 h-3.5 text-violet-700" />
                    )}
                    <span>{formatRoleLabel(r)}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-3.5 py-1.5 bg-violet-50 border border-violet-200 text-violet-900 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5">
                {isAdmin ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-violet-700" />
                ) : (
                  <FileSearch className="w-3.5 h-3.5 text-violet-700" />
                )}
                <span>Role: {formatRoleLabel(currentUser?.role_name || activeRole)}</span>
              </div>
            )}
          </div>
        </div>

        {/* STICKY TAB NAVIGATION */}
        <nav aria-label="Legal workspace sections" className="sticky top-16 z-40 -mx-5 border-b border-border bg-background/95 px-5 py-1 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12 flex items-center gap-1 overflow-x-auto whitespace-nowrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0  ${activeTab === tab.id
                ? 'bg-white text-violet-700 border-b-2 border-violet-700'
                : 'text-gray-500 hover:text-gray-900 border-transparent hover:bg-gray-100/60'
                }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* TAB CONTENTS */}
        <div className="pt-2">
          {activeTab === 'overview' && (
            <OverviewTab
              isAdmin={isAdmin}
              currentUser={currentUser}
              isAllowedTab={(tabId) => {
                const def = ALL_LEGAL_TABS.find((t) => t.id === tabId);
                return def ? isAllowedTab(def) : false;
              }}
              setActiveTab={handleTabChange}
              show={show}
            />
          )}
          {activeTab === 'cases' && (
            <CasesTab setActiveTab={handleTabChange} show={show} />
          )}
          {activeTab === 'search' && <LegalResearchHub />}
          {activeTab === 'briefs' && <SavedBriefsTab show={show} />}

          {/* Embedded Admin Management Tabs */}
          {activeTab === 'profiles' && (
            <ProfilesTab
              userRole={activeRole}
              customerId={currentUser?.customer_id ? Number(currentUser.customer_id) : null}
            />
          )}
          {activeTab === 'knowledge' && (
            <KnowledgeBasesTab
              userRole={activeRole}
              customerId={currentUser?.customer_id ? Number(currentUser.customer_id) : null}
              onSwitchToPlayground={(kbId: string) => {
                setPlaygroundKbId(kbId);
                handleTabChange('playground');
              }}
            />
          )}
          {activeTab === 'playground' && (
            <PlaygroundTab initialKbId={playgroundKbId} />
          )}
          {activeTab === 'users' && (
            <UsersTab
              userId={currentUser?.id}
              loginEmail={currentUser?.email || ''}
              customerId={currentUser?.customer_id}
              userRole={activeRole}
            />
          )}
          {activeTab === 'roles' && (
            <RolesTab
              userRole={activeRole}
              customerId={currentUser?.customer_id ? String(currentUser.customer_id) : null}
            />
          )}
          {activeTab === 'workflows' && (
            <WorkflowsTab
              userRole={activeRole}
              customerId={currentUser?.customer_id}
            />
          )}

          {activeTab === 'audit' && <AuditLogsTab />}
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {notice && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-2xl border border-gray-700 flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{notice}</span>
        </div>
      )}
    </div>
  );
}

export default function LegalPlatformPage() {
  return (
    <React.Suspense fallback={<div className="flex h-screen items-center justify-center text-xs font-bold uppercase tracking-wider text-gray-500">Loading Legal Platform...</div>}>
      <LegalPlatformContent />
    </React.Suspense>
  );
}

// -----------------------------------------------------------------------------
// OVERVIEW TAB
// -----------------------------------------------------------------------------
function OverviewTab({
  isAdmin,
  currentUser,
  isAllowedTab,
  setActiveTab,
  show,
}: {
  isAdmin: boolean;
  currentUser: any;
  isAllowedTab: (tabId: View) => boolean;
  setActiveTab: (tab: View) => void;
  show: (message: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* System Admin Modules Alert */}
      {isAdmin && (
        <div className="bg-violet-50/80 border border-violet-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-700 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <strong className="block text-xs font-bold text-gray-900">
                Tenant Admin Management Consoles
              </strong>
              <p className="text-[11px] text-gray-600">
                Configure firm LLM system prompts, vector knowledge bases, and retrieval benchmarks for tenant:{' '}
                <span className="font-mono font-bold text-violet-800">{currentUser?.customer_id || 'active'}</span>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
            {isAllowedTab('profiles') && (
              <button
                onClick={() => setActiveTab('profiles')}
                className="px-3 py-1.5 bg-white border border-violet-300 hover:bg-violet-100 text-violet-900 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <Cpu className="w-3.5 h-3.5" /> LLM Profiles
              </button>
            )}
            {isAllowedTab('knowledge') && (
              <button
                onClick={() => setActiveTab('knowledge')}
                className="px-3 py-1.5 bg-white border border-violet-300 hover:bg-violet-100 text-violet-900 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" /> Knowledge Bases
              </button>
            )}
            {isAllowedTab('playground') && (
              <button
                onClick={() => setActiveTab('playground')}
                className="px-3 py-1.5 bg-white border border-violet-300 hover:bg-violet-100 text-violet-900 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> Playground
              </button>
            )}
            {isAllowedTab('users') && (
              <button
                onClick={() => setActiveTab('users')}
                className="px-3 py-1.5 bg-white border border-violet-300 hover:bg-violet-100 text-violet-900 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" /> Users
              </button>
            )}
            {isAllowedTab('roles') && (
              <button
                onClick={() => setActiveTab('roles')}
                className="px-3 py-1.5 bg-white border border-violet-300 hover:bg-violet-100 text-violet-900 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" /> Roles
              </button>
            )}
            {isAllowedTab('workflows') && (
              <button
                onClick={() => setActiveTab('workflows')}
                className="px-3 py-1.5 bg-white border border-violet-300 hover:bg-violet-100 text-violet-900 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <Workflow className="w-3.5 h-3.5" /> Workflows
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grid of Workspaces */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            Matter & Research Actions
          </p>
          <h3 className="text-sm font-extrabold text-gray-900">
            {isAdmin ? 'Firm Workspaces & Ingestion' : 'Active Legal Operations'}
          </h3>

          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={() => setActiveTab('cases')}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50/50 transition text-left cursor-pointer"
            >
              <FolderKanban className="w-4 h-4 text-violet-700 shrink-0" />
              <div className="flex-1">
                <strong className="block text-xs font-bold text-gray-900">Case Workspaces</strong>
                <span className="block text-[11px] text-gray-500">
                  Organize matter documents and upload intake files via /legal/ingest
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50/50 transition text-left cursor-pointer"
            >
              <Library className="w-4 h-4 text-violet-700 shrink-0" />
              <div className="flex-1">
                <strong className="block text-xs font-bold text-gray-900">Precedent Research Hub</strong>
                <span className="block text-[11px] text-gray-500">
                  AI Semantic search across statutory sections, courts, and binding precedents
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </button>

            <button
              onClick={() => setActiveTab('briefs')}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50/50 transition text-left cursor-pointer"
            >
              <FileSearch className="w-4 h-4 text-violet-700 shrink-0" />
              <div className="flex-1">
                <strong className="block text-xs font-bold text-gray-900">Saved Briefs & Queries</strong>
                <span className="block text-[11px] text-gray-500">
                  Review and export structured research binders
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Decoupled Architecture Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            Tenant Workflow Dispatcher
          </p>
          <h3 className="text-sm font-extrabold text-gray-900">Domain-Agnostic Core Architecture</h3>
          <div className="flex flex-col gap-2 pt-1">
            {[
              'Document Ingestion: Dispatches to tenant workflow /webhooks/run/legal/ingest or /legal/ingest',
              'Precedent Search: Dispatches to tenant workflow /webhooks/run/legal/search or /legal/search',
              'Profiles & System Prompts: Configured directly in /admin?tab=profiles',
              'Audit Logs: Stored immutably in legal_audit_logs DB table'
            ].map((step, i) => (
              <div
                key={step}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium text-gray-700"
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
    </div>
  );
}

// -----------------------------------------------------------------------------
// CASES TAB
// -----------------------------------------------------------------------------
function CasesTab({
  setActiveTab,
  show
}: {
  setActiveTab: (tab: View) => void;
  show: (message: string) => void;
}) {
  const [caseList, setCaseList] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newCourt, setNewCourt] = useState('High Court of Delhi');
  const [creating, setCreating] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Load client-side case workspaces (linking layer over generic backend files)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('legal_case_workspaces');
      if (stored) {
        const parsed = JSON.parse(stored);
        setCaseList(parsed);
        if (parsed.length > 0) setSelectedCase(parsed[0]);
      } else {
        const initial = [
          {
            id: 'case-1',
            title: 'State v. Mehra',
            category: 'Bail application',
            court: 'High Court of Delhi',
            files: ['Matter_Chronology.docx', 'Bail_Petition_Draft.pdf'],
            precedents: [],
            updated_at: new Date().toISOString()
          },
          {
            id: 'case-2',
            title: 'Arora Industries v. DCIT',
            category: 'Tax appeal (Sec 148A)',
            court: 'High Court of Delhi',
            files: ['Assessment_Order.pdf', 'Show_Cause_Reply.docx'],
            precedents: [],
            updated_at: new Date().toISOString()
          }
        ];
        setCaseList(initial);
        setSelectedCase(initial[0]);
        localStorage.setItem('legal_case_workspaces', JSON.stringify(initial));
      }
    } catch (err) {
      console.error('Failed to load local case workspaces:', err);
    }
  }, []);

  const saveCases = (newList: any[]) => {
    setCaseList(newList);
    try {
      localStorage.setItem('legal_case_workspaces', JSON.stringify(newList));
    } catch (e) { }
  };

  const handleCreateCase = () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    const newCase = {
      id: `case-${Date.now()}`,
      title: newTitle,
      category: newCategory || 'General Legal Matter',
      court: newCourt,
      files: [],
      precedents: [],
      updated_at: new Date().toISOString()
    };
    const updated = [newCase, ...caseList];
    saveCases(updated);
    setSelectedCase(newCase);
    setNewTitle('');
    setNewCategory('');
    setCreating(false);
    show(`Created case workspace for '${newTitle}'`);
  };

  const handleUploadToCase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedCase) return;
    const file = files[0];

    setUploadingDoc(true);
    try {
      await api.ingestLegalDocument({
        title: file.name,
        case_id: selectedCase.id,
        corpus_type: 'case_material',
        document_text: `Uploaded matter file: ${file.name}`,
      });
      show(`File '${file.name}' ingested via generic backend workflow.`);

      const updated = caseList.map((c) =>
        c.id === selectedCase.id
          ? { ...c, files: [...(c.files || []), file.name], updated_at: new Date().toISOString() }
          : c
      );
      saveCases(updated);
      setSelectedCase((prev: any) =>
        prev ? { ...prev, files: [...(prev.files || []), file.name], updated_at: new Date().toISOString() } : prev
      );
    } catch (err: any) {
      show(`Upload failed: ${err.message}`);
    } finally {
      setUploadingDoc(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Create Case & Case List */}
      <div className="flex flex-col gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            Create New Matter
          </p>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. State v. Sharma (Bail Appeal)"
            className="text-xs bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-violet-700"
          />
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="e.g. Tax Appeal / Sec 148A / Bail"
            className="text-xs bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-violet-700"
          />
          <button
            onClick={handleCreateCase}
            disabled={creating}
            className="w-full py-2 bg-violet-700 hover:bg-violet-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {creating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{creating ? 'Creating Workspace...' : 'Create Case Workspace'}</span>
          </button>
        </div>

        {/* Cases List */}
        <div className="flex flex-col gap-2">
          {caseList.length > 0 ? (
            caseList.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCase(c)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col gap-1.5 ${selectedCase?.id === c.id
                  ? 'bg-violet-50/70 border-violet-400 shadow-xs'
                  : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-gray-900">{c.title}</h4>
                  <span className="text-[10px] text-gray-400">
                    {c.updated_at ? new Date(c.updated_at).toLocaleDateString() : 'Active'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">{c.category || 'Matter'} · {c.court || 'Court'}</p>
                <div className="flex items-center gap-2 text-[10px] text-violet-700 font-semibold mt-1">
                  <span>{c.files?.length || 0} files</span>
                  <span>·</span>
                  <span>{c.precedents?.length || 0} linked precedents</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-6 bg-white rounded-2xl border border-gray-200 text-xs text-gray-400">
              No active case workspaces. Create your first case above.
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Case Workspace Detail Panel */}
      <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col gap-5">
        {selectedCase ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700">
                  Active Matter Details
                </span>
                <h2 className="text-base font-extrabold text-gray-900 mt-0.5">{selectedCase.title}</h2>
                <p className="text-xs text-gray-500">
                  {selectedCase.category} — {selectedCase.court || 'High Court'}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('search')}
                className="px-3.5 py-1.5 bg-violet-700 hover:bg-violet-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 self-start cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" /> Research for Case
              </button>
            </div>

            {/* Upload Case File */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
              <div>
                <strong className="block text-xs font-bold text-gray-800">Upload Matter Documents</strong>
                <span className="block text-[11px] text-gray-500">
                  Ingests document into tenant legal workflow /legal/ingest.
                </span>
              </div>
              <input
                id="case-doc-upload"
                type="file"
                accept=".pdf,.docx,.txt,.md"
                className="hidden"
                onChange={handleUploadToCase}
              />
              <label
                htmlFor="case-doc-upload"
                className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {uploadingDoc ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span>{uploadingDoc ? 'Ingesting...' : 'Upload File'}</span>
              </label>
            </div>

            {/* Case Files */}
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                Case Documents & Pleadings ({selectedCase.files?.length || 0})
              </p>
              {selectedCase.files && selectedCase.files.length > 0 ? (
                selectedCase.files.map((file: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-white border border-gray-200 text-xs flex items-center justify-between shadow-2xs hover:border-gray-300 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-violet-700" />
                      <span className="font-semibold text-gray-800">
                        {typeof file === 'string' ? file : file.name || 'Document'}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Indexed
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-gray-400">
                  No documents uploaded yet. Use &apos;Upload File&apos; above.
                </div>
              )}
            </div>

            {/* Linked Precedents */}
            <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                Linked Precedents & Findings ({selectedCase.precedents?.length || 0})
              </p>
              {selectedCase.precedents && selectedCase.precedents.length > 0 ? (
                selectedCase.precedents.map((p: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs flex flex-col gap-1"
                  >
                    <strong className="text-gray-900 font-bold">{p.title || 'Precedent Record'}</strong>
                    <p className="text-[11px] text-gray-500">{p.court} · {p.citation || p.cnr}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-gray-400">
                  No precedents linked yet. Search judgments in Precedent Search and click &apos;Save Precedent to Case&apos;.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center p-12 text-xs text-gray-400">
            Select or create a case workspace from the left panel.
          </div>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// SAVED BRIEFS TAB
// -----------------------------------------------------------------------------
function SavedBriefsTab({ show }: { show: (message: string) => void }) {
  const [queries, setQueries] = useState<any>({ private_queries: [], public_queries: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSaved() {
      try {
        const res = await api.getSavedQueries();
        setQueries(res || { private_queries: [], public_queries: [] });
      } catch (err) {
        console.error('Failed to load saved queries:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSaved();
  }, []);

  const allQueries = [...(queries.private_queries || []), ...(queries.public_queries || [])];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
      {loading ? (
        <div className="p-8 text-center text-xs text-gray-500">Loading saved research queries...</div>
      ) : allQueries.length > 0 ? (
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
              <th className="p-3.5">Title</th>
              <th className="p-3.5">Query Text</th>
              <th className="p-3.5">Scope</th>
              <th className="p-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {allQueries.map((q) => (
              <tr key={q.id} className="hover:bg-gray-50/60 transition">
                <td className="p-3.5 font-bold text-gray-900">{q.title}</td>
                <td className="p-3.5 text-gray-700 max-w-xs truncate">{q.query_text || 'Structured Filters'}</td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded-md bg-violet-50 text-violet-800 text-[10px] font-bold">
                    {q.is_public ? 'Firm Public' : 'Private'}
                  </span>
                </td>
                <td className="p-3.5 text-right">
                  <button
                    onClick={() => show(`Exported brief: '${q.title}'`)}
                    className="text-violet-700 hover:text-violet-900 font-bold text-xs flex items-center gap-1 ml-auto cursor-pointer"
                  >
                    Export Binder <Download className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="p-8 text-center text-xs text-gray-400">
          No saved research queries found. Save searches directly from Precedent Search.
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// AUDIT LOGS TAB
// -----------------------------------------------------------------------------
function AuditLogsTab() {
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
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
      {loading ? (
        <div className="p-8 text-center text-xs text-gray-500">Loading audit trail...</div>
      ) : logs.length > 0 ? (
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
              <th className="p-3.5">Action</th>
              <th className="p-3.5">Query / Document</th>
              <th className="p-3.5">Role</th>
              <th className="p-3.5">Results</th>
              <th className="p-3.5 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50/60 transition">
                <td className="p-3.5 font-bold text-gray-900">{l.action}</td>
                <td className="p-3.5 text-gray-700 max-w-xs truncate">{l.query_text}</td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded-md bg-violet-50 text-violet-800 text-[10px] font-bold">
                    {l.role}
                  </span>
                </td>
                <td className="p-3.5 text-gray-600">{l.results_count}</td>
                <td className="p-3.5 text-right text-gray-500 text-[11px]">{l.timestamp || 'Just now'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="p-8 text-center text-xs text-gray-400">
          No audit records found. Executed search and ingestion queries will automatically log here.
        </div>
      )}
    </div>
  );
}
