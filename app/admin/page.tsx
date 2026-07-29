'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@mui/material/Alert';
import { api } from '@/lib/api';
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

type ActiveTabType =
  | 'nodes'
  | 'workflows'
  | 'users'
  | 'oauth'
  | 'logs'
  | 'customers'
  | 'metrics'
  | 'knowledge'
  | 'settings'
  | 'profiles'
  | 'provider-presets'
  | 'playground';

const ALL_TABS: { id: ActiveTabType; label: string; roles: string[] }[] = [
  { id: 'customers', label: 'Customers', roles: ['system_admin'] },
  { id: 'nodes', label: 'Nodes ', roles: ['admin', 'system_admin'] },
  { id: 'workflows', label: 'Workflows', roles: ['user', 'admin', 'system_admin'] },
  { id: 'users', label: 'Users', roles: ['admin', 'system_admin'] },
  { id: 'oauth', label: 'OAuth Providers', roles: ['admin', 'system_admin'] },
  { id: 'logs', label: 'System Logs', roles: ['admin', 'system_admin'] },
  { id: 'metrics', label: 'Metrics', roles: ['admin', 'system_admin'] },
  { id: 'knowledge', label: 'Knowledge Bases', roles: ['admin', 'system_admin'] },
  { id: 'profiles', label: 'LLM Profiles', roles: ['admin', 'system_admin'] },
  // BLOCK COMMENT: SYSTEM ADMIN RESTRICTION FOR PROVIDER PRESETS TAB
  { id: 'provider-presets', label: 'Provider Presets', roles: ['admin', 'system_admin'] },
  { id: 'settings', label: 'LLM Settings', roles: ['admin', 'system_admin'] },
  { id: 'playground', label: 'Retrieval Playground', roles: ['admin', 'system_admin'] },
];

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTabType>('nodes');
  const [playgroundKbId, setPlaygroundKbId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hiddenTabIds, setHiddenTabIds] = useState<Set<ActiveTabType>>(new Set());
  // Auth & Profile states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const navContainerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<{ [key in ActiveTabType]?: HTMLButtonElement | null }>({});

  const checkTabVisibility = useCallback(() => {
    const container = navContainerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const newHidden = new Set<ActiveTabType>();

    ALL_TABS.forEach((tab) => {
      const el = tabRefs.current[tab.id];
      if (!el) return;
      const rect = el.getBoundingClientRect();

      // Check if element is cut off left or right (with 4px margin of error)
      const isVisible =
        rect.left >= containerRect.left - 4 &&
        rect.right <= containerRect.right + 4;

      if (!isVisible) {
        newHidden.add(tab.id);
      }
    });

    setHiddenTabIds(newHidden);
  }, []);

  useEffect(() => {
    const container = navContainerRef.current;
    if (!container) return;

    // Small delay to allow initial layout render
    const timer = setTimeout(checkTabVisibility, 50);

    const handleScroll = () => checkTabVisibility();
    const handleResize = () => checkTabVisibility();

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => checkTabVisibility());
      resizeObserver.observe(container);
    }

    return () => {
      clearTimeout(timer);
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [userRole, isMounted, checkTabVisibility]);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    async function initializeUser() {
      try {
        const userData = await api.getCurrentUser();
        if (userData.role !== 'admin' && userData.role !== 'system_admin') {
          router.push('/workflow-builder');
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
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Failed to authenticate in Admin Console:', err);
        api.logout();
        setIsAuthenticated(false);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    initializeUser();
  }, [isAuthenticated, router]);

  // Load initial tab from URL search parameters on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (
        tab &&
        [
          'nodes',
          'workflows',
          'users',
          'oauth',
          'logs',
          'customers',
          'metrics',
          'knowledge',
          'settings',
          'playground',
          'profiles',
          'provider-presets',
        ].includes(tab)
      ) {
        setActiveTab(tab as ActiveTabType);
      }
    }
  }, []);

  const handleTabChange = (tab: ActiveTabType) => {
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
        setAlertMessage({ type: 'success', text: 'Registration successful! Please login.' });
        setIsRegistering(false);
      } else {
        const data = await api.login({ email: loginEmail, password: loginPassword });
        localStorage.setItem('token', data.token);
        document.cookie = `token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

        if (data.role === 'admin' || data.role === 'system_admin') {
          setUserRole(data.role);
          setCustomerId(
            data.customer_id !== null && data.customer_id !== undefined
              ? String(data.customer_id)
              : null,
          );
          setIsAuthenticated(true);
        } else {
          router.push('/workflow-builder');
        }
      }
    } catch (err) {
      setAlertMessage({ type: 'error', text: 'Authentication failed. Check your credentials.' });
    }
  };

  if (!isMounted) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 px-4">
        <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl border border-gray-200">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {isRegistering ? 'Create Account' : 'Admin Portal'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {isRegistering ? 'Join the gateway system' : 'Please sign in to manage the gateway'}
            </p>
          </div>
          {alertMessage && (
            <Alert severity={alertMessage.type} className="mb-4">
              {alertMessage.text}
            </Alert>
          )}
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4 rounded-md shadow-sm">
              {isRegistering && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Username</label>
                  <input
                    type="text"
                    required
                    className="relative block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm bg-white"
                    placeholder="jdoe"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  className="relative block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm bg-white"
                  placeholder="admin@gateway.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
                <input
                  type="password"
                  required
                  className="relative block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm bg-white"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
            </div>
            <button
              type="submit"
              className="group relative flex w-full justify-center rounded-lg border border-transparent bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-lg cursor-pointer"
            >
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-blue-500 group-hover:text-blue-400" />
              </span>
              {isRegistering ? 'Register' : 'Access Console'}
            </button>
          </form>
          <div className="text-center mt-4">
            <button
              onClick={() => {
                setAlertMessage(null);
                setIsRegistering(!isRegistering);
              }}
              className="text-sm text-blue-600 hover:underline cursor-pointer"
            >
              {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <IconMap.activity className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-gray-500">Loading system registry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="mx-auto w-full space-y-8">
        {(() => {
          const availableTabs = ALL_TABS.filter((t) => !userRole || t.roles.includes(userRole));
          const hiddenTabs = availableTabs.filter((t) => hiddenTabIds.has(t.id));

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
                    className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      activeTab === tab.id
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
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
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-blue-600 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg shadow-sm transition-all cursor-pointer"
                    title="More options"
                    aria-expanded={isMenuOpen}
                  >
                    <span>+{hiddenTabs.length} More</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isMenuOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </button>

                  {isMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-50 max-h-96 overflow-y-auto">
                        <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
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
                            className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-colors cursor-pointer ${
                              activeTab === tab.id
                                ? 'text-blue-600 bg-blue-50/80 font-bold'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            <span>{tab.label}</span>
                            {activeTab === tab.id && (
                              <Check className="h-4 w-4 text-blue-600 shrink-0 ml-2" />
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
          {activeTab === 'nodes' && (userRole === 'admin' || userRole === 'system_admin') && (
            <NodesTab userRole={userRole} customerId={customerId ? Number(customerId) : null} />
          )}
          {activeTab === 'workflows' && <WorkflowsTab userRole={userRole} />}
          {activeTab === 'users' && (userRole === 'admin' || userRole === 'system_admin') && (
            <UsersTab userId={userId} loginEmail={userEmail || ''} />
          )}
          {activeTab === 'oauth' && (userRole === 'admin' || userRole === 'system_admin') && (
            <OAuthTab />
          )}
          {activeTab === 'logs' && (userRole === 'admin' || userRole === 'system_admin') && (
            <LogsTab userRole={userRole} />
          )}
          {activeTab === 'metrics' && (userRole === 'admin' || userRole === 'system_admin') && (
            <MetricsTab userRole={userRole} />
          )}
          {/* BLOCK: Pass userRole and customerId to KnowledgeBasesTab */}
          {activeTab === 'knowledge' && (userRole === 'admin' || userRole === 'system_admin') && (
            <KnowledgeBasesTab
              userRole={userRole}
              customerId={customerId ? Number(customerId) : null}
              onSwitchToPlayground={(kbId: string) => {
                setPlaygroundKbId(kbId);
                handleTabChange('playground');
              }}
            />
          )}
          {/* END BLOCK */}
          {activeTab === 'profiles' && (userRole === 'admin' || userRole === 'system_admin') && (
            <ProfilesTab userRole={userRole} customerId={customerId ? Number(customerId) : null} />
          )}
          {activeTab === 'provider-presets' && (userRole === 'admin' || userRole === 'system_admin') && (
            <ProviderPresetsTab userRole={userRole} />
          )}
          {activeTab === 'settings' && (userRole === 'admin' || userRole === 'system_admin') && (
            <CompanySettingsTab
              userRole={userRole}
              customerId={customerId ? Number(customerId) : null}
            />
          )}
          {activeTab === 'playground' && (userRole === 'admin' || userRole === 'system_admin') && (
            <PlaygroundTab initialKbId={playgroundKbId} />
          )}
        </div>

      </div>
    </div>
  );
}
