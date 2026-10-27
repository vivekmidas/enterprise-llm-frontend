/* ==============================================================================
   BLOCK COMMENT: 1-TO-1 ROUTE-BASED ADMIN SHELL & NAVIGATION LAYOUT
   Reference: EPIC-RBAC-1TO1-001 / STORY-CANONICAL-ROUTE-PERMS-001
   Component: frontend/app/admin/layout.tsx
   Description:
     - Renders persistent Admin Navigation Bar across all /admin/<section> routes
       (/admin/roles, /admin/users, /admin/permissions, /admin/workflows, etc.).
     - Automatically redirects legacy /admin?tab=<section> URLs to /admin/<section>.
     - Enforces canonical route permissions (admin:<section>:view) per route.
   ============================================================================== */

'use client';

import React, { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import {
  hasPermissionScope,
  getDefaultRedirectForPermissions,
  loadRoutePermissionsFromDB,
  RoutePermissionRule,
} from '@/lib/config/route_permissions';
import { Check, ChevronDown } from 'lucide-react';

// Subpage components
import CustomersTab from './customers/page';
import NodesTab from './nodes/page';
import WorkflowsTab from './workflows/page';
import UsersTab from './users/page';
import OAuthTab from './oauth/page';
import LogsTab from './logs/page';
import MetricsTab from './metrics/page';
import KnowledgeBasesTab from './knowledge/page';
import CompanySettingsTab from './company-settings/page';
import PlaygroundTab from './playground/page';
import ProfilesTab from './profiles/page';
import ProviderPresetsTab from './provider-presets/page';
import RolesTab from './roles/page';
import PermissionsTab from './permissions/page';
import BackupTab from './backup/page';
import DomainsTab from './domains/page';
import ApiKeysTab from './api-keys/page';

export interface AdminTabItem {
  id: string;
  href: string;
  label: string;
  permission: string;
}

const TAB_ID_ALIASES: Record<string, string> = {
  settings: 'company-settings',
  'tenant-settings': 'company-settings',
};

const KNOWN_ADMIN_SECTIONS = new Set([
  'nodes',
  'workflows',
  'users',
  'roles',
  'permissions',
  'api-keys',
  'domains',
  'customers',
  'knowledge',
  'oauth',
  'logs',
  'metrics',
  'backup',
  'profiles',
  'provider-presets',
  'playground',
  'company-settings',
]);

function buildDynamicAdminTabs(routes: RoutePermissionRule[]): AdminTabItem[] {
  const tabsMap = new Map<string, AdminTabItem>();

  const defaultTabOrder = [
    'nodes',
    'workflows',
    'users',
    'roles',
    'permissions',
    'api-keys',
    'domains',
    'customers',
    'knowledge',
    'oauth',
    'logs',
    'metrics',
    'backup',
    'profiles',
    'provider-presets',
    'playground',
    'company-settings',
  ];

  routes.forEach((rule) => {
    if (!rule.pattern || rule.pattern.includes('*')) return;

    let rawTabId = '';
    if (rule.pattern.startsWith('/admin?tab=')) {
      rawTabId = rule.pattern.split('tab=')[1];
    } else if (rule.pattern.startsWith('/admin/')) {
      rawTabId = rule.pattern.replace('/admin/', '').split('/')[0];
    }

    if (!rawTabId) return;
    const tabId = TAB_ID_ALIASES[rawTabId] || rawTabId;

    const formattedLabel =
      rule.label || (rule.submodule ? rule.submodule.replace(/_/g, ' ') : tabId.replace(/-/g, ' '));
    const capitalizedLabel = formattedLabel.charAt(0).toUpperCase() + formattedLabel.slice(1);

    if (!tabsMap.has(tabId)) {
      tabsMap.set(tabId, {
        id: tabId,
        href: `/admin/${tabId}`,
        label: capitalizedLabel,
        permission: rule.permission,
      });
    }
  });

  if (!tabsMap.has('api-keys')) {
    tabsMap.set('api-keys', {
      id: 'api-keys',
      href: '/admin/api-keys',
      label: 'API Keys',
      permission: 'admin:api_keys:view',
    });
  }

  return Array.from(tabsMap.values()).sort((a, b) => {
    const idxA = defaultTabOrder.indexOf(a.id);
    const idxB = defaultTabOrder.indexOf(b.id);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.label.localeCompare(b.label);
  });
}

function resolveSectionFromPath(pathname: string, searchParams: URLSearchParams | null): string {
  const queryTab = searchParams?.get('tab');
  if (queryTab) {
    return TAB_ID_ALIASES[queryTab] || queryTab;
  }
  if (pathname && pathname.startsWith('/admin/')) {
    const seg = pathname.replace('/admin/', '').split('/')[0];
    if (seg) {
      return TAB_ID_ALIASES[seg] || seg;
    }
  }
  return '';
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || '/admin';
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [availableTabs, setAvailableTabs] = useState<AdminTabItem[]>([]);
  const [playgroundKbId, setPlaygroundKbId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hiddenTabIds, setHiddenTabIds] = useState<Set<string>>(new Set());

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const navContainerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const activeSection = resolveSectionFromPath(pathname, searchParams);

  const checkTabVisibility = useCallback(() => {
    const container = navContainerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const newHidden = new Set<string>();

    availableTabs.forEach((tab) => {
      const el = tabRefs.current[tab.id];
      if (!el) return;
      const rect = el.getBoundingClientRect();

      if (rect.right > containerRect.right - 4 || rect.left < containerRect.left + 4) {
        newHidden.add(tab.id);
      }
    });

    setHiddenTabIds(newHidden);
  }, [availableTabs]);

  useEffect(() => {
    if (loading || !isAuthenticated) return;
    checkTabVisibility();
    window.addEventListener('resize', checkTabVisibility);
    return () => window.removeEventListener('resize', checkTabVisibility);
  }, [loading, isAuthenticated, checkTabVisibility]);

  useEffect(() => {
    setIsMounted(true);

    async function initializeAdminSession() {
      try {
        const routes = await loadRoutePermissionsFromDB();
        const userData = await api.getCurrentUser();
        if (!userData || !userData.id) {
          setIsAuthenticated(false);
          router.push('/login');
          return;
        }

        setIsAuthenticated(true);
        const perms = userData.permissions || [];
        setUserPermissions(perms);

        const allTabs = buildDynamicAdminTabs(routes);
        const filteredTabs = allTabs.filter((t) => hasPermissionScope(perms, t.permission));
        setAvailableTabs(filteredTabs);

        const canAccessAdmin =
          hasPermissionScope(perms, 'admin:dashboard:view') ||
          hasPermissionScope(perms, 'admin:*:*') ||
          hasPermissionScope(perms, '*:*:*') ||
          filteredTabs.length > 0 ||
          userData.role === 'admin' ||
          userData.role === 'system_admin' ||
          userData.role === 'tenant_admin' ||
          userData.role_type === 'admin' ||
          userData.role_type === 'system_admin' ||
          userData.role_type === 'tenant_admin';

        if (!canAccessAdmin) {
          const fallback = getDefaultRedirectForPermissions(perms, userData.role) || '/legal';
          router.push(fallback !== '/admin' ? fallback : '/legal');
          return;
        }

        setUserRole(userData.role);
        setUserId(userData.id);
        setUserEmail(userData.email);
        setCustomerId(
          userData.customer_id !== null && userData.customer_id !== undefined
            ? String(userData.customer_id)
            : null,
        );
      } catch (err) {
        console.error('Failed to initialize admin user:', err);
        setIsAuthenticated(false);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    initializeAdminSession();
  }, [router]);

  // Redirect legacy /admin?tab=<section> or root /admin to clean /admin/<section> URL
  useEffect(() => {
    if (loading || !isAuthenticated || availableTabs.length === 0) return;

    const queryTab = searchParams?.get('tab');
    if (queryTab) {
      const normalized = TAB_ID_ALIASES[queryTab] || queryTab;
      const extraParams = new URLSearchParams(searchParams.toString());
      extraParams.delete('tab');
      const qs = extraParams.toString();
      router.replace(`/admin/${normalized}${qs ? `?${qs}` : ''}`);
      return;
    }

    if (pathname === '/admin') {
      router.replace(`/admin/${availableTabs[0].id}`);
    }
  }, [loading, isAuthenticated, pathname, searchParams, availableTabs, router]);

  const handleNavigateSection = (sectionId: string) => {
    const normalized = TAB_ID_ALIASES[sectionId] || sectionId;
    if (normalized === 'playground') {
      setPlaygroundKbId(null);
    }
    router.push(`/admin/${normalized}`);
  };

  if (!isMounted) return null;

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50 text-gray-700">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-xs font-bold uppercase tracking-wider">
            Loading enterprise gateway...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-gray-500">Redirecting to login...</span>
        </div>
      </div>
    );
  }

  const currentTabId = activeSection || availableTabs[0]?.id || 'nodes';
  const hiddenTabs = availableTabs.filter((t) => hiddenTabIds.has(t.id));

  const renderSectionComponent = () => {
    switch (currentTabId) {
      case 'customers':
        return <CustomersTab />;
      case 'nodes':
        return <NodesTab userRole={userRole} customerId={customerId ? String(customerId) : null} />;
      case 'workflows':
        return (
          <WorkflowsTab userRole={userRole} customerId={customerId ? Number(customerId) : null} />
        );
      case 'users':
        return (
          <UsersTab
            userId={userId}
            loginEmail={userEmail || ''}
            customerId={customerId ? customerId : null}
            userRole={userRole}
          />
        );
      case 'roles':
        return <RolesTab userRole={userRole} customerId={customerId ? String(customerId) : null} />;
      case 'permissions':
        return <PermissionsTab />;
      case 'api-keys':
        return <ApiKeysTab />;
      case 'domains':
        return (
          <DomainsTab userRole={userRole} customerId={customerId ? Number(customerId) : null} />
        );
      case 'oauth':
        return <OAuthTab />;
      case 'logs':
        return <LogsTab userRole={userRole} />;
      case 'metrics':
        return <MetricsTab userRole={userRole} />;
      case 'backup':
        return <BackupTab />;
      case 'knowledge':
        return (
          <KnowledgeBasesTab
            userRole={userRole || undefined}
            customerId={customerId ? Number(customerId) : null}
            onSwitchToPlayground={(kbId: string) => {
              setPlaygroundKbId(kbId);
              router.push('/admin/playground');
            }}
          />
        );
      case 'profiles':
        return (
          <ProfilesTab userRole={userRole} customerId={customerId ? Number(customerId) : null} />
        );
      case 'provider-presets':
        return <ProviderPresetsTab userRole={userRole} />;
      case 'company-settings':
        return <CompanySettingsTab userRole={userRole} customerId={customerId || undefined} />;
      case 'playground':
        return <PlaygroundTab initialKbId={playgroundKbId} />;
      default:
        return children;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <div className="flex-1 w-full max-w mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Dynamic 1-to-1 Route Admin Navigation Bar */}
        <div className="sticky top-16 z-40 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-2 py-1">
          <div
            ref={navContainerRef}
            className="flex items-center overflow-x-auto whitespace-nowrap flex-1 min-w-0"
          >
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[tab.id] = el;
                }}
                data-tab-id={tab.id}
                onClick={() => handleNavigateSection(tab.id)}
                className={`px-4 py-3 text-xs hover:text-primary font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 rounded-none border-b-2 ${
                  currentTabId === tab.id
                    ? 'text-primary border-primary'
                    : 'text-muted-foreground hover:text-foreground border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {hiddenTabs.length > 0 && (
            <div className="relative shrink-0 pr-2">
              <button
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider bg-card border border-border text-muted-foreground rounded-lg shadow-sm transition-all cursor-pointer hover:text-foreground"
                title="More options"
                aria-expanded={isMenuOpen}
              >
                <span>+{hiddenTabs.length} More</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isMenuOpen ? 'rotate-180 text-foreground' : 'text-muted-foreground'
                  }`}
                />
              </button>

              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-60 bg-popover text-popover-foreground border border-border rounded-xl shadow-xl py-1 z-50 max-h-96 overflow-y-auto">
                    <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider border-b border-border text-muted-foreground">
                      Hidden Options
                    </div>
                    {hiddenTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          handleNavigateSection(tab.id);
                          setIsMenuOpen(false);
                          setTimeout(() => {
                            tabRefs.current[tab.id]?.scrollIntoView({
                              behavior: 'smooth',
                              inline: 'nearest',
                              block: 'nearest',
                            });
                            checkTabVisibility();
                          }, 50);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-colors cursor-pointer ${
                          currentTabId === tab.id
                            ? 'bg-accent text-foreground font-bold'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <span>{tab.label}</span>
                        {currentTabId === tab.id && (
                          <Check className="h-4 w-4 shrink-0 ml-2 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="pt-2">
          {KNOWN_ADMIN_SECTIONS.has(currentTabId) ? renderSectionComponent() : children}
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-gray-50 text-gray-700">
          Loading admin console...
        </div>
      }
    >
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  );
}

