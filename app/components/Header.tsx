'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Workflow, LogOut, User, Github, Shield, ArrowLeftRight } from 'lucide-react';
import { api } from '@/lib/api'; // Assuming api.logout() clears the cookie
import {
  hasPermissionScope,
  loadRoutePermissionsFromDB,
  getEffectivePermissions,
} from '@/lib/config/route_permissions';

// Helper to get a cookie value by name
const getCookie = (name: string) => {
  if (typeof document === 'undefined') return null; // Ensure this runs only on the client-side
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null); // New state for user role
  const [userId, setUserId] = useState<string | null>(null); // New state for user ID
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  useEffect(() => {
    loadRoutePermissionsFromDB().catch(console.error);
    const checkAuth = async () => {
      const token = getCookie('token'); // Read token from cookie
      setIsAuthenticated(!!token);
      if (token) {
        try {
          const userData = await api.getCurrentUser();
          setUserName(userData.name);
          setUserRole(userData.role);
          setUserId(userData.id);
          setUserPermissions(userData.permissions || []);
        } catch (err) {
          console.error('Failed to fetch user in Header:', err);
          setUserName(null);
          setUserRole(null);
          setUserId(null);
          setUserPermissions([]);
          setIsAuthenticated(false);
          document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        }
      } else {
        setUserName(null);
        setUserRole(null);
        setUserId(null);
        setUserPermissions([]);
      }
    };

    checkAuth();
    // Listen for storage changes to sync auth state across tabs
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, [pathname]);

  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
    setUserName(null);
    setUserRole(null);
    setUserId(null);
    // Clear auth-related items from cookie and localStorage on logout
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';

    router.push('/login');
  };

  // ===============================================================================
  // BLOCK COMMENT: STORY 2 - ROLE SWITCHER PRIVILEGE EVALUATION
  // Evaluates if user possesses both Admin rights AND Workflow Designer rights.
  // When dual-privileged, enables seamless 1-click toggling between /admin and /workflow-builder.
  // ===============================================================================
  const effectivePerms = getEffectivePermissions(userPermissions, userRole || undefined);

  const hasAdminRights =
    ['admin', 'system_admin', 'tenant_admin'].includes((userRole || '').toLowerCase()) ||
    hasPermissionScope(effectivePerms, '*:*:*') ||
    hasPermissionScope(effectivePerms, 'admin:*:*') ||
    hasPermissionScope(effectivePerms, 'admin:dashboard:view') ||
    effectivePerms.some((p) => p.startsWith('admin:'));

  const hasWorkflowView =
    hasPermissionScope(effectivePerms, 'workflow:builder:view') ||
    hasPermissionScope(effectivePerms, 'workflows:builder:view') ||
    hasPermissionScope(effectivePerms, 'workflow:*:*') ||
    hasPermissionScope(effectivePerms, 'workflows:*:*') ||
    hasPermissionScope(effectivePerms, '*:*:*');

  const hasWorkflowDesign =
    hasPermissionScope(effectivePerms, 'workflow:builder:edit') ||
    hasPermissionScope(effectivePerms, 'workflows:builder:edit') ||
    hasPermissionScope(effectivePerms, 'workflow:builder:create') ||
    hasPermissionScope(effectivePerms, 'workflows:builder:create') ||
    hasPermissionScope(effectivePerms, 'workflow:builder:manage') ||
    hasPermissionScope(effectivePerms, 'workflows:builder:manage') ||
    hasPermissionScope(effectivePerms, 'workflow:*:*') ||
    hasPermissionScope(effectivePerms, 'workflows:*:*') ||
    hasPermissionScope(effectivePerms, '*:*:*');

  const hasDesignerRights =
    (userRole || '').toLowerCase() === 'workflow_designer' ||
    (hasWorkflowView && hasWorkflowDesign);

  const canSwitchRole = hasAdminRights && hasDesignerRights;
  const isAdminPath = pathname?.startsWith('/admin');

  const handleToggleRole = () => {
    if (isAdminPath) {
      router.push('/workflow-builder');
    } else {
      router.push('/admin');
    }
  };

  // Legal routes render their own focused workspace header.
  if (pathname?.startsWith('/legal')) return null;

  return (
    <>
      <a href="#main-content" className="sr-only sr-only-focusable">
        Skip to main content
      </a>
      <nav className="flex items-center justify-between px-8 h-16 bg-nav-bg border-b border-nav-border text-nav-fg sticky top-0 z-50 shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 p-1.5 rounded-lg">
              <Workflow className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              nFlow
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-6">
          {/* <Link href="https://github.com" className="text-gray-400 hover:text-gray-600 transition-colors">
          <Github className="h-5 w-5" />
        </Link> */}

          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              {/*
              ===============================================================================
              BLOCK COMMENT: STORY 2 - ROLE SWITCHER BUTTON
              Rendered adjacent to user badge for users with dual privileges.
              Relative positioning only, responsive design.
              ===============================================================================
              */}
              {canSwitchRole && (
                <button
                  type="button"
                  onClick={handleToggleRole}
                  title={
                    isAdminPath
                      ? 'Switch to Workflow Designer (/workflow-builder)'
                      : 'Switch to Admin Console (/admin)'
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200 cursor-pointer bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:border-violet-300 hover:text-violet-700 shadow-xs"
                >
                  {isAdminPath ? (
                    <>
                      <Workflow className="h-3.5 w-3.5 text-violet-600 shrink-0" />
                      <span className="hidden sm:inline">Designer</span>
                      <ArrowLeftRight className="h-3 w-3 text-gray-400 shrink-0" />
                    </>
                  ) : (
                    <>
                      <Shield className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      <span className="hidden sm:inline">Admin</span>
                      <ArrowLeftRight className="h-3 w-3 text-gray-400 shrink-0" />
                    </>
                  )}
                </button>
              )}

              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-600">{userName || 'User'}</span>
                {userRole && (
                  <span className="text-sm font-medium text-gray-500 ml-2">({userRole})</span>
                )}
                {/* {userId && (
                  <span className="text-xs font-medium text-gray-500 ml-2">ID: {userId}</span>
                )} */}
              </div>
              {/* <Link
                href="/legal"
                className="text-sm font-bold text-slate-700 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
              >
                Legal Platform
              </Link> */}

              {/*
              ===============================================================================
              BLOCK COMMENT: CLEAN TOP NAVIGATION HEADER
              Removed duplicate links (Workflows, Users, Manage Roles, Console).
              Header displays active user profile badge and Logout action.
              ===============================================================================
              */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-all duration-200"
              >
                <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-semibold text-gray-600 hover:text-gray-900"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-md hover:shadow-violet-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
