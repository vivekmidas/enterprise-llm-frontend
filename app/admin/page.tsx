'use client';

import React, { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Alert from '@mui/material/Alert';
import { api } from '@/lib/api';
// BLOCK COMMENT: DYNAMIC PERMISSION-DRIVEN ADMIN DASHBOARD TABS
// Component: frontend/app/admin/page.tsx
// Description: Dynamically generates dashboard tabs from active DB route permissions (api.getRoutePermissions).

import {
  getRequiredPermissionForPath,
  hasPermissionScope,
  getDefaultRedirectForPermissions,
  loadRoutePermissionsFromDB,
  RoutePermissionRule,
} from '@/lib/config/route_permissions';

import { IconMap } from '@/lib/icons';
import { Shield, Lock, Check, ChevronDown } from 'lucide-react';

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
// BLOCK COMMENT: IMPORT PERMISSIONS TAB FOR SYSTEM ADMIN
import PermissionsTab from './permissions/page';
import BackupTab from './backup/page';
import DomainsTab from './domains/page';

export interface AdminTabItem {
  id: string;
  label: string;
  permission: string;
}

function buildDynamicAdminTabs(routes: RoutePermissionRule[]): AdminTabItem[] {
  const tabsMap = new Map<string, AdminTabItem>();

  // Baseline tab order
  const defaultTabOrder = ['nodes', 'workflows', 'users', 'roles', 'permissions', 'domains', 'customers', 'knowledge', 'oauth', 'logs', 'metrics', 'backup', 'profiles', 'provider-presets', 'playground', 'settings'];


  routes.forEach((rule) => {
    if (!rule.pattern || rule.pattern.includes('*')) return;

    let tabId = '';
    if (rule.pattern.startsWith('/admin?tab=')) {
      tabId = rule.pattern.split('tab=')[1];
    } else if (rule.pattern.startsWith('/admin/')) {
      tabId = rule.pattern.replace('/admin/', '');
    }

    if (!tabId) return;

    const formattedLabel = rule.label || (rule.submodule ? rule.submodule.replace(/_/g, ' ') : tabId.replace(/-/g, ' '));
    const capitalizedLabel = formattedLabel.charAt(0).toUpperCase() + formattedLabel.slice(1);

    if (!tabsMap.has(tabId)) {
      tabsMap.set(tabId, {
        id: tabId,
        label: capitalizedLabel,
        permission: rule.permission,
      });
    }
  });

  // Sort based on default order, remaining at the end
  return Array.from(tabsMap.values()).sort((a, b) => {
    const idxA = defaultTabOrder.indexOf(a.id);
    const idxB = defaultTabOrder.indexOf(b.id);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.label.localeCompare(b.label);
  });
}

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('nodes');
  const [availableTabs, setAvailableTabs] = useState<AdminTabItem[]>([]);
  const [playgroundKbId, setPlaygroundKbId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hiddenTabIds, setHiddenTabIds] = useState<Set<string>>(new Set());
  // Auth & Profile states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);




  const navContainerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

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

  /* ==============================================================================
     BLOCK COMMENT: INITIALIZE AUTHENTICATED ADMIN CONSOLE
     Validates session via api.getCurrentUser() and routes to allowed tabs.
     ============================================================================== */
  useEffect(() => {
    setIsMounted(true);

    async function initializeUser() {
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

        // Dynamically build and filter allowed tabs
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
          if (fallback !== '/admin') {
            router.push(fallback);
          } else {
            router.push('/legal');
          }
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

        const urlTab = searchParams?.get('tab');
        if (urlTab) {
          setActiveTab(urlTab);
        } else if (filteredTabs.length > 0) {
          setActiveTab(filteredTabs[0].id);
        }
      } catch (err) {
        console.error('Failed to initialize admin user:', err);
        setIsAuthenticated(false);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    initializeUser();
  }, [searchParams, router]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState(null, '', url.pathname + url.search);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMessage(null);
    try {
      if (isRegistering) {
        await api.register({
          username: loginUsername,
          email: loginEmail,
          password: loginPassword,
          name: '',
          lastname: '',
        });
        setAlertMessage({
          type: 'success',
          text: 'Registration successful. Please sign in.',
        });
        setIsRegistering(false);
      } else {
        await api.login({
          email: loginEmail,
          password: loginPassword,
        });
        window.location.reload();
      }
    } catch (err) {
      setAlertMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Authentication failed',
      });
    }
  };

  if (!isMounted) return null;

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50 text-gray-700">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-xs font-bold uppercase tracking-wider">Loading enterprise gateway...</p>
        </div>
      </div>
    );
  }

  /* ==============================================================================
     BLOCK COMMENT: UNAUTHENTICATED REDIRECT STATE
     Redirects unauthorized requests to primary /login page.
     ============================================================================== */
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

  const isAdmin = userRole === 'admin' || userRole === 'system_admin' || userRole === 'tenant_admin';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <div className="flex-1 w-full max-w mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Dynamic Admin Navigation Bar */}
        {(() => {
          const hiddenTabs = availableTabs.filter((t: AdminTabItem) => hiddenTabIds.has(t.id));

          return (
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
                    onClick={() => {
                      if (tab.id === 'playground') setPlaygroundKbId(null);
                      handleTabChange(tab.id);
                    }}
                    className={`px-4 py-3 text-xs hover:text-primary font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0  ${activeTab === tab.id
                      ? 'bg-white text-primary bg-primary/10 border-primary'
                      : 'text-muted-foreground hover:text-foreground  border-transparent'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Chevron Dropdown Popup - Only shows options that are NOT visible */}
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
                      className={`h-4 w-4 transition-transform duration-200 ${isMenuOpen ? 'rotate-180 text-foreground' : 'text-muted-foreground'
                        }`}
                    />
                  </button>

                  {isMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                      <div
                        className="absolute right-0 top-full mt-2 w-60 bg-popover text-popover-foreground border border-border rounded-xl shadow-xl py-1 z-50 max-h-96 overflow-y-auto"
                      >
                        <div
                          className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider border-b border-border text-muted-foreground"
                        >
                          Hidden Options
                        </div>
                        {hiddenTabs.map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => {
                              if (tab.id === 'playground') setPlaygroundKbId(null);
                              handleTabChange(tab.id);
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
                            className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-colors cursor-pointer ${activeTab === tab.id
                              ? 'bg-accent text-foreground font-bold'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                              }`}
                          >
                            <span>{tab.label}</span>
                            {activeTab === tab.id && (
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
          );
        })()}

        <div className="pt-2">
          {activeTab === 'customers' && userRole === 'system_admin' && <CustomersTab />}
          {activeTab === 'nodes' && isAdmin && (
            <NodesTab userRole={userRole} customerId={customerId ? Number(customerId) : null} />
          )}
          {activeTab === 'workflows' && (
            <WorkflowsTab userRole={userRole} customerId={customerId ? Number(customerId) : null} />
          )}
          {activeTab === 'users' && isAdmin && (
            <UsersTab
              userId={userId}
              loginEmail={userEmail || ''}
              customerId={customerId ? (customerId) : null}
              userRole={userRole}
            />
          )}
          {activeTab === 'roles' && isAdmin && (
            <RolesTab userRole={userRole} customerId={customerId ? String(customerId) : null} />
          )}
          {/* BLOCK COMMENT: RENDER PERMISSIONS TAB */}
          {activeTab === 'permissions' && isAdmin && (
            <PermissionsTab />
          )}
          {activeTab === 'domains' && isAdmin && (
            <DomainsTab userRole={userRole} customerId={customerId ? Number(customerId) : null} />
          )}
          {activeTab === 'oauth' && isAdmin && (
            <OAuthTab />
          )}

          {activeTab === 'logs' && isAdmin && (
            <LogsTab userRole={userRole} />
          )}
          {activeTab === 'metrics' && isAdmin && (
            <MetricsTab userRole={userRole} />
          )}
          {activeTab === 'backup' && isAdmin && (
            <BackupTab />
          )}
          {/* BLOCK: Pass userRole and customerId to KnowledgeBasesTab */}
          {activeTab === 'knowledge' && (
            <KnowledgeBasesTab
              userRole={userRole || undefined}
              customerId={customerId ? Number(customerId) : null}
              onSwitchToPlayground={(kbId: string) => {
                setPlaygroundKbId(kbId);
                handleTabChange('playground');
              }}
            />
          )}
          {/* END BLOCK */}
          {activeTab === 'profiles' && isAdmin && (
            <ProfilesTab userRole={userRole} customerId={customerId ? Number(customerId) : null} />
          )}
          {activeTab === 'provider-presets' && isAdmin && (
            <ProviderPresetsTab userRole={userRole} />
          )}
          {activeTab === 'settings' && isAdmin && (
            <CompanySettingsTab
              userRole={userRole}
              customerId={customerId || undefined}
            />
          )}
          {activeTab === 'playground' && (
            <PlaygroundTab initialKbId={playgroundKbId} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white">Loading admin page...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
