// BLOCK COMMENT: FRONTEND 3-TIER PERMISSION MATCHING ENGINE (xx:yy:zzz FORMAT)
// File: frontend/lib/config/route_permissions.ts
// Description: Evaluates exact permission keys, submodule wildcards (xx:yy:*), module wildcards (xx:*:*), and global super admin (*:*:*).

import { api, getAccessToken } from '@/lib/api';

export interface RoutePermissionRule {
  pattern: string;
  permission: string;
  module?: string;
  submodule?: string;
  label?: string;
}

// Default baseline route permissions
export const DEFAULT_ROUTE_PATTERNS: RoutePermissionRule[] = [
  // Workflow Builder
  {
    pattern: '/workflow-builder/new',
    permission: 'workflows:builder:create',
    module: 'workflows',
    submodule: 'builder',
    label: 'Create Workflow Canvas',
  },
  {
    pattern: '/workflow-builder/*/edit',
    permission: 'workflows:builder:edit',
    module: 'workflows',
    submodule: 'builder',
    label: 'Edit Workflow Canvas',
  },
  {
    pattern: '/workflow-builder',
    permission: 'workflows:builder:view',
    module: 'workflows',
    submodule: 'builder',
    label: 'Workflow Builder',
  },
  {
    pattern: '/workflow-builder/**',
    permission: 'workflows:builder:view',
    module: 'workflows',
    submodule: 'builder',
    label: 'Workflow Builder Sub-routes',
  },

  // Users & Roles
  {
    pattern: '/admin/users',
    permission: 'admin:users:view',
    module: 'admin',
    submodule: 'users',
    label: 'Users',
  },
  {
    pattern: '/admin/users/**',
    permission: 'admin:users:view',
    module: 'admin',
    submodule: 'users',
    label: 'Users Sub-routes',
  },
  {
    pattern: '/admin/roles',
    permission: 'admin:roles:view',
    module: 'admin',
    submodule: 'roles',
    label: 'Roles',
  },
  {
    pattern: '/admin/roles/**',
    permission: 'admin:roles:view',
    module: 'admin',
    submodule: 'roles',
    label: 'Roles Sub-routes',
  },

  // Presets & Playground
  {
    pattern: '/admin/provider-presets',
    permission: 'admin:provider_presets:view',
    module: 'admin',
    submodule: 'provider_presets',
    label: 'Provider Presets',
  },
  {
    pattern: '/admin/provider-presets/**',
    permission: 'admin:provider_presets:view',
    module: 'admin',
    submodule: 'provider_presets',
    label: 'Provider Presets Sub-routes',
  },
  {
    pattern: '/admin/playground',
    permission: 'admin:playground:view',
    module: 'admin',
    submodule: 'playground',
    label: 'Retrieval Playground',
  },
  {
    pattern: '/admin/playground/**',
    permission: 'admin:playground:view',
    module: 'admin',
    submodule: 'playground',
    label: 'Retrieval Playground Sub-routes',
  },

  // Customers / Tenants
  {
    pattern: '/admin/customers',
    permission: 'admin:customers:view',
    module: 'admin',
    submodule: 'customers',
    label: 'Customers',
  },
  {
    pattern: '/admin/customers/**',
    permission: 'admin:customers:view',
    module: 'admin',
    submodule: 'customers',
    label: 'Customers Sub-routes',
  },

  // Nodes Catalog
  {
    pattern: '/admin/nodes',
    permission: 'admin:nodes:view',
    module: 'admin',
    submodule: 'nodes',
    label: 'Nodes',
  },
  {
    pattern: '/admin/nodes/**',
    permission: 'admin:nodes:view',
    module: 'admin',
    submodule: 'nodes',
    label: 'Nodes Sub-routes',
  },

  // Permissions Registry
  {
    pattern: '/admin/permissions',
    permission: 'admin:permissions:view',
    module: 'admin',
    submodule: 'permissions',
    label: 'Permissions Registry',
  },
  {
    pattern: '/admin/permissions/**',
    permission: 'admin:permissions:view',
    module: 'admin',
    submodule: 'permissions',
    label: 'Permissions Registry Sub-routes',
  },

  // Backup & Domains
  {
    pattern: '/admin/backup',
    permission: 'admin:backup:manage',
    module: 'admin',
    submodule: 'backup',
    label: 'SQL Backup Exporter',
  },
  {
    pattern: '/admin/backup/**',
    permission: 'admin:backup:manage',
    module: 'admin',
    submodule: 'backup',
    label: 'SQL Backup Exporter Sub-routes',
  },
  {
    pattern: '/admin/domains',
    permission: 'admin:domains:manage',
    module: 'admin',
    submodule: 'domains',
    label: 'Domains',
  },
  {
    pattern: '/admin/domains/**',
    permission: 'admin:domains:manage',
    module: 'admin',
    submodule: 'domains',
    label: 'Domains Sub-routes',
  },

  // LLM Profiles
  {
    pattern: '/admin/profiles',
    permission: 'admin:profiles:view',
    module: 'admin',
    submodule: 'profiles',
    label: 'LLM Profiles',
  },
  {
    pattern: '/admin/profiles/**',
    permission: 'admin:profiles:view',
    module: 'admin',
    submodule: 'profiles',
    label: 'LLM Profiles Sub-routes',
  },

  // Knowledge Bases
  {
    pattern: '/admin/knowledge',
    permission: 'admin:knowledge:view',
    module: 'admin',
    submodule: 'knowledge',
    label: 'Knowledge Bases',
  },
  {
    pattern: '/admin/knowledge/**',
    permission: 'admin:knowledge:view',
    module: 'admin',
    submodule: 'knowledge',
    label: 'Knowledge Bases Sub-routes',
  },

  // Logs
  {
    pattern: '/admin/logs',
    permission: 'admin:logs:view',
    module: 'admin',
    submodule: 'logs',
    label: 'Audit Logs',
  },
  {
    pattern: '/admin/logs/**',
    permission: 'admin:logs:view',
    module: 'admin',
    submodule: 'logs',
    label: 'Audit Logs Sub-routes',
  },

  // OAuth
  {
    pattern: '/admin/oauth',
    permission: 'admin:oauth:view',
    module: 'admin',
    submodule: 'oauth',
    label: 'OAuth Integrations',
  },
  {
    pattern: '/admin/oauth/**',
    permission: 'admin:oauth:view',
    module: 'admin',
    submodule: 'oauth',
    label: 'OAuth Integrations Sub-routes',
  },

  // API Keys (EPIC-AUTH-001)
  {
    pattern: '/admin/api-keys',
    permission: 'admin:api_keys:view',
    module: 'admin',
    submodule: 'api_keys',
    label: 'API Keys',
  },
  {
    pattern: '/admin/api-keys/**',
    permission: 'admin:api_keys:view',
    module: 'admin',
    submodule: 'api_keys',
    label: 'API Keys Sub-routes',
  },
  {
    pattern: '/oauth/google',
    permission: 'admin:oauth:view',
    module: 'admin',
    submodule: 'oauth',
    label: 'Google OAuth Connection',
  },

  // Workflows
  {
    pattern: '/admin/workflows',
    permission: 'admin:workflows:view',
    module: 'admin',
    submodule: 'workflows',
    label: 'Workflows',
  },
  {
    pattern: '/admin/workflows/**',
    permission: 'admin:workflows:view',
    module: 'admin',
    submodule: 'workflows',
    label: 'Workflows Sub-routes',
  },

  // Metrics
  {
    pattern: '/admin/metrics',
    permission: 'admin:metrics:view',
    module: 'admin',
    submodule: 'metrics',
    label: 'Metrics & Telemetry',
  },
  {
    pattern: '/admin/metrics/**',
    permission: 'admin:metrics:view',
    module: 'admin',
    submodule: 'metrics',
    label: 'Metrics Sub-routes',
  },
  {
    pattern: '/metrics',
    permission: 'admin:metrics:view',
    module: 'admin',
    submodule: 'metrics',
    label: 'Metrics Portal',
  },
  {
    pattern: '/metrics/**',
    permission: 'admin:metrics:view',
    module: 'admin',
    submodule: 'metrics',
    label: 'Metrics Portal Sub-routes',
  },

  // Company Settings
  {
    pattern: '/admin/company-settings',
    permission: 'admin:company_settings:view',
    module: 'admin',
    submodule: 'company_settings',
    label: 'Company Settings',
  },
  {
    pattern: '/admin/company-settings/**',
    permission: 'admin:company_settings:view',
    module: 'admin',
    submodule: 'company_settings',
    label: 'Company Settings Sub-routes',
  },

  // Admin
  {
    pattern: '/admin',
    permission: 'admin:dashboard:view',
    module: 'admin',
    submodule: 'dashboard',
    label: 'Admin Dashboard',
  },
];

let activeRoutePatterns: RoutePermissionRule[] = [...DEFAULT_ROUTE_PATTERNS];
let pendingRoutePermissionsPromise: Promise<RoutePermissionRule[]> | null = null;

/**
 * Loads route permission rules dynamically from DB at startup.
 */
export async function loadRoutePermissionsFromDB(): Promise<RoutePermissionRule[]> {
  // If not authenticated, use default route patterns directly
  if (!getAccessToken()) {
    return activeRoutePatterns;
  }

  if (pendingRoutePermissionsPromise) {
    return pendingRoutePermissionsPromise;
  }

  pendingRoutePermissionsPromise = (async () => {
    try {
      const dbRoutes = await api.getRoutePermissions();
      if (Array.isArray(dbRoutes) && dbRoutes.length > 0) {
        activeRoutePatterns = dbRoutes.map((r: any) => ({
          pattern: r.pattern,
          permission: r.permission || r.permission_id,
          module: r.module,
          submodule: r.submodule,
          label: r.label,
        }));
      }
    } catch (err) {
      console.error('Failed to load route permissions from DB, using defaults:', err);
    } finally {
      pendingRoutePermissionsPromise = null;
    }
    return activeRoutePatterns;
  })();

  return pendingRoutePermissionsPromise;
}

export function getActiveRoutePatterns(): RoutePermissionRule[] {
  return activeRoutePatterns;
}

/**
 * Converts a glob pattern string (e.g., '/workflow-builder/**') into a RegExp.
 */
export function globToRegex(glob: string): RegExp {
  const regexString = glob.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]+');
  return new RegExp(`^${regexString}$`);
}

/**
 * Resolves the required permission for a given URL path using active DB route patterns.
 */
export function getRequiredPermissionForPath(pathname: string): string | null {
  for (const rule of activeRoutePatterns) {
    const regex = globToRegex(rule.pattern);
    if (regex.test(pathname)) {
      return rule.permission;
    }
  }
  return null;
}

/**
 * Checks if a set of user permissions satisfies a canonical x:y:z permission scope,
 * supporting exact match, wildcards (*:*:*, xx:*:*, xx:yy:*), and same-submodule :manage / :admin.
 */
export function hasPermissionScope(userPermissions: string[], requiredPermission: string): boolean {
  if (!userPermissions || !Array.isArray(userPermissions) || !requiredPermission) return false;
  if (userPermissions.includes('*:*:*')) return true;

  const reqClean = requiredPermission.trim().toLowerCase();
  const rParts = reqClean.split(':');
  const [rMod, rSub] = rParts;

  for (const up of userPermissions) {
    if (!up) continue;
    const g = up.trim().toLowerCase();
    if (g === '*:*:*' || g === reqClean) return true;

    const gParts = g.split(':');
    if (rParts.length >= 3 && gParts.length >= 2) {
      const [gMod, gSub, gAct] = gParts;
      if (gParts.length >= 3) {
        if (gMod === rMod && (gSub === '*' || gSub === 'all') && (gAct === '*' || gAct === 'manage' || gAct === 'admin')) {
          return true;
        }
        if (gMod === rMod && gSub === rSub && (gAct === '*' || gAct === 'manage' || gAct === 'admin')) {
          return true;
        }
      } else if (gMod === rMod && (gSub === '*' || gSub === 'manage' || gSub === 'admin')) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Dynamically resolves the best default destination route based on canonical permissions and role.
 */
export function getDefaultRedirectForPermissions(
  userPermissions: string[],
  userRole?: string,
  domainId?: string,
  defaultRoute?: string,
): string | null {
  if (defaultRoute) return defaultRoute;

  const perms = Array.isArray(userPermissions) ? userPermissions : [];
  const normalizedRole = (userRole || '').toLowerCase().trim();

  const hasWorkflowView =
    hasPermissionScope(perms, 'workflows:builder:view') ||
    hasPermissionScope(perms, 'workflows:*:*') ||
    hasPermissionScope(perms, '*:*:*');

  const hasWorkflowDesign =
    hasPermissionScope(perms, 'workflows:builder:edit') ||
    hasPermissionScope(perms, 'workflows:builder:create') ||
    hasPermissionScope(perms, 'workflows:builder:manage') ||
    hasPermissionScope(perms, 'workflows:*:*') ||
    hasPermissionScope(perms, '*:*:*');

  const isWorkflowDesigner =
    normalizedRole === 'workflow_designer' ||
    (hasWorkflowView && hasWorkflowDesign && normalizedRole !== 'tenant_user');

  if (isWorkflowDesigner) {
    return '/workflow-builder';
  }

  if (
    normalizedRole === 'system_admin' ||
    normalizedRole === 'tenant_admin' ||
    hasPermissionScope(perms, '*:*:*') ||
    hasPermissionScope(perms, 'admin:*:*') ||
    hasPermissionScope(perms, 'admin:dashboard:view') ||
    perms.some((p) => p.startsWith('admin:'))
  ) {
    return '/admin';
  }

  if (hasPermissionScope(perms, 'admin:knowledge:view')) {
    return '/admin/knowledge';
  }

  if (hasWorkflowView) {
    return '/workflow-builder';
  }

  if (domainId) {
    return `/${domainId}`;
  }
  return null;
}
