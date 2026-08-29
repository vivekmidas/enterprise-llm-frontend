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
  // Workflow Builder & Demo Flows
  {
    pattern: '/workflow-builder/new',
    permission: 'workflow:builder:create',
    module: 'workflows',
    submodule: 'builder',
    label: 'Create Workflow Canvas',
  },
  {
    pattern: '/workflow-builder/*/edit',
    permission: 'workflow:builder:edit',
    module: 'workflows',
    submodule: 'builder',
    label: 'Edit Workflow Canvas',
  },
  {
    pattern: '/workflow-builder',
    permission: 'workflow:builder:view',
    module: 'workflows',
    submodule: 'builder',
    label: 'Workflow Builder',
  },
  {
    pattern: '/workflow-builder/**',
    permission: 'workflow:builder:view',
    module: 'workflows',
    submodule: 'builder',
    label: 'Workflow Builder Sub-routes',
  },
  {
    pattern: '/demo-flows',
    permission: 'workflow:builder:view',
    module: 'workflows',
    submodule: 'builder',
    label: 'Demo Flows',
  },
  {
    pattern: '/demo-flows/**',
    permission: 'workflow:builder:view',
    module: 'workflows',
    submodule: 'builder',
    label: 'Demo Flows Sub-routes',
  },

  // Users & Roles
  {
    pattern: '/admin/users',
    permission: 'admin:user_management:read',
    module: 'admin',
    submodule: 'user_management',
    label: 'Users',
  },
  {
    pattern: '/admin/users/**',
    permission: 'admin:user_management:read',
    module: 'admin',
    submodule: 'user_management',
    label: 'Users Sub-routes',
  },
  {
    pattern: '/admin/roles',
    permission: 'admin:role_management:view',
    module: 'admin',
    submodule: 'role_management',
    label: 'Roles',
  },
  {
    pattern: '/admin/roles/**',
    permission: 'admin:role_management:view',
    module: 'admin',
    submodule: 'role_management',
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
    permission: 'admin:customer_management:view',
    module: 'admin',
    submodule: 'customer_management',
    label: 'Customers',
  },
  {
    pattern: '/admin/customers/**',
    permission: 'admin:customer_management:view',
    module: 'admin',
    submodule: 'customer_management',
    label: 'Customers Sub-routes',
  },

  // Nodes Catalog
  {
    pattern: '/admin/nodes',
    permission: 'admin:node_management:view',
    module: 'admin',
    submodule: 'node_management',
    label: 'Nodes',
  },
  {
    pattern: '/admin/nodes/**',
    permission: 'admin:node_management:view',
    module: 'admin',
    submodule: 'node_management',
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
    label: 'Domain Registry',
  },
  {
    pattern: '/admin/domains/**',
    permission: 'admin:domains:manage',
    module: 'admin',
    submodule: 'domains',
    label: 'Domain Registry Sub-routes',
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
  {
    pattern: '/knowledge',
    permission: 'kb:base:view',
    module: 'knowledge',
    submodule: 'base',
    label: 'Knowledge Portal',
  },
  {
    pattern: '/knowledge/**',
    permission: 'kb:base:view',
    module: 'knowledge',
    submodule: 'base',
    label: 'Knowledge Portal Sub-routes',
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
  {
    pattern: '/logs',
    permission: 'admin:logs:view',
    module: 'admin',
    submodule: 'logs',
    label: 'System Logs',
  },
  {
    pattern: '/logs/**',
    permission: 'admin:logs:view',
    module: 'admin',
    submodule: 'logs',
    label: 'System Logs Sub-routes',
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
  {
    pattern: '/oauth',
    permission: 'admin:oauth:view',
    module: 'admin',
    submodule: 'oauth',
    label: 'OAuth Portal',
  },
  {
    pattern: '/oauth/**',
    permission: 'admin:oauth:view',
    module: 'admin',
    submodule: 'oauth',
    label: 'OAuth Portal Sub-routes',
  },

  // Workflows & Triggers
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
  {
    pattern: '/admin/triggers',
    permission: 'admin:triggers:view',
    module: 'admin',
    submodule: 'triggers',
    label: 'Triggers',
  },
  {
    pattern: '/admin/triggers/**',
    permission: 'admin:triggers:view',
    module: 'admin',
    submodule: 'triggers',
    label: 'Triggers Sub-routes',
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
    permission: 'admin:tenant_settings:configure',
    module: 'admin',
    submodule: 'tenant_settings',
    label: 'Company Settings',
  },
  {
    pattern: '/admin/company-settings/**',
    permission: 'admin:tenant_settings:configure',
    module: 'admin',
    submodule: 'tenant_settings',
    label: 'Company Settings Sub-routes',
  },

  // Admin & System
  {
    pattern: '/admin',
    permission: 'admin:dashboard:view',
    module: 'admin',
    submodule: 'dashboard',
    label: 'Admin Dashboard',
  },
  {
    pattern: '/system',
    permission: 'admin:dashboard:view',
    module: 'admin',
    submodule: 'dashboard',
    label: 'System Overview',
  },
  {
    pattern: '/system/**',
    permission: 'admin:dashboard:view',
    module: 'admin',
    submodule: 'dashboard',
    label: 'System Sub-routes',
  },

  // Legal
  {
    pattern: '/legal',
    permission: 'legal:research:query',
    module: 'legal',
    submodule: 'research',
    label: 'Legal AI Platform',
  },
  {
    pattern: '/legal/**',
    permission: 'legal:research:query',
    module: 'legal',
    submodule: 'research',
    label: 'Legal AI Sub-routes',
  },
  {
    pattern: '/legal-research',
    permission: 'legal:research:query',
    module: 'legal',
    submodule: 'research',
    label: 'Legal Research',
  },
  {
    pattern: '/legal-research/**',
    permission: 'legal:research:query',
    module: 'legal',
    submodule: 'research',
    label: 'Legal Research Sub-routes',
  },
  {
    pattern: '/autopilot',
    permission: 'legal:autopilot:view',
    module: 'legal',
    submodule: 'autopilot',
    label: 'Litigation Autopilot Workspace',
  },
  {
    pattern: '/autopilot/**',
    permission: 'legal:autopilot:view',
    module: 'legal',
    submodule: 'autopilot',
    label: 'Litigation Autopilot Sub-routes',
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
 * Checks if a set of user permissions satisfies a required permission scope,
 * supporting 3-tier wildcard rules (*:*:*, xx:*:*, xx:yy:*).
 */
export function hasPermissionScope(userPermissions: string[], requiredPermission: string): boolean {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  if (userPermissions.includes('*:*:*')) return true;
  if (userPermissions.includes(requiredPermission)) return true;

  const parts = requiredPermission.split(':');
  const module = parts[0] || '';
  const submodule = parts[1] || '';

  // Check Module wildcard xx:*:* or xx:*
  if (userPermissions.includes(`${module}:*:*`) || userPermissions.includes(`${module}:*`)) {
    return true;
  }

  // Check Submodule wildcard xx:yy:*
  if (submodule && userPermissions.includes(`${module}:${submodule}:*`)) {
    return true;
  }

  return false;
}

/**
 * Dynamically resolves the best default destination route based on a user's permissions and domain.
 * Returns null if user has no matching authorized route permissions.
 */
export function getDefaultRedirectForPermissions(
  userPermissions: string[],
  userRole?: string,
  domainId?: string,
  defaultRoute?: string,
): string | null {
  const perms = userPermissions || [];
  const normalizedRole = (userRole || '').toLowerCase();

  // Admin & Tenant Admin roles route directly to /admin
  if (
    normalizedRole === 'system_admin' ||
    normalizedRole === 'admin' ||
    normalizedRole === 'tenant_admin' ||
    hasPermissionScope(perms, '*:*:*') ||
    hasPermissionScope(perms, 'admin:*:*') ||
    hasPermissionScope(perms, 'admin:dashboard:view') ||
    perms.some((p) => p.startsWith('admin:'))
  ) {
    return '/admin';
  }

  if (defaultRoute) return defaultRoute;

  if (
    hasPermissionScope(perms, 'legal:research:query') ||
    hasPermissionScope(perms, 'legal:autopilot:view') ||
    hasPermissionScope(perms, 'legal:*:*') ||
    hasPermissionScope(perms, 'kb:base:view') ||
    hasPermissionScope(perms, 'kb:*:*')
  ) {
    return '/legal';
  }
  if (
    hasPermissionScope(perms, 'workflow:builder:view') ||
    hasPermissionScope(perms, 'workflow:*:*')
  ) {
    return '/workflow-builder';
  }
  if (domainId) {
    return `/${domainId}`;
  }
  return null;
}

export const ROLE_PRESET_PERMISSIONS: Record<string, string[]> = {
  system_admin: ['*:*:*'],
  tenant_admin: [
    'admin:dashboard:view',
    'admin:user_management:read',
    'admin:user_management:create',
    'admin:user_management:edit',
    'admin:user_management:delete',
    'admin:user_management:manage',
    'admin:role_management:view',
    'admin:role_management:create',
    'admin:role_management:edit',
    'admin:role_management:delete',
    'admin:role_management:manage',
    'admin:knowledge:view',
    'admin:knowledge:create',
    'admin:knowledge:edit',
    'admin:knowledge:delete',
    'admin:knowledge:ingest',
    'admin:knowledge:manage',
    'admin:profiles:view',
    'admin:profiles:create',
    'admin:profiles:edit',
    'admin:profiles:delete',
    'admin:profiles:manage',
    'workflows:builder:view',
    'workflows:builder:create',
    'workflows:builder:edit',
    'workflows:builder:delete',
    'workflows:builder:execute',
    'workflows:builder:manage',
    'nodes:catalog:view',
    'nodes:catalog:execute',
    'nodes:catalog:manage',
    'admin:playground:view',
    'admin:playground:query',
    'admin:provider_presets:view',
    'admin:provider_presets:manage',
    'admin:logs:view',
    'admin:logs:manage',
    'admin:oauth:view',
    'admin:oauth:manage',
    'admin:metrics:view',
    'admin:metrics:manage',
    'admin:tenant_settings:view',
    'admin:tenant_settings:configure',
    'legal:research:query',
    'legal:research:view',
    'legal:research:upload',
    'legal:research:edit',
    'legal:research:delete',
    'legal:research:bookmark',
    'legal:research:admin',
    'legal:autopilot:view',
    'legal:autopilot:edit',
    'legal:autopilot:evidence',
    'legal:autopilot:draft',
  ],
  para_legal: [
    'legal:research:query',
    'legal:research:view',
    'legal:research:upload',
    'legal:research:bookmark',
    'legal:autopilot:view',
    'legal:autopilot:edit',
    'legal:autopilot:evidence',
    'legal:autopilot:draft',
    'admin:knowledge:view',
    'nodes:catalog:view',
  ],
  paralegal: [
    'legal:research:query',
    'legal:research:view',
    'legal:research:upload',
    'legal:research:bookmark',
    'legal:autopilot:view',
    'legal:autopilot:edit',
    'legal:autopilot:evidence',
    'legal:autopilot:draft',
    'admin:knowledge:view',
    'nodes:catalog:view',
  ],
  legal_analyst: [
    'legal:research:query',
    'legal:research:view',
    'legal:research:upload',
    'legal:research:edit',
    'legal:research:bookmark',
    'legal:autopilot:view',
    'legal:autopilot:edit',
    'legal:autopilot:evidence',
    'legal:autopilot:draft',
    'admin:knowledge:view',
    'admin:knowledge:ingest',
    'workflows:builder:view',
    'workflows:builder:execute',
    'nodes:catalog:view',
  ],
  tenant_user: [
    'legal:research:query',
    'legal:research:view',
    'admin:knowledge:view',
    'nodes:catalog:view',
  ],
  standard_user: [
    'legal:research:query',
    'legal:research:view',
    'admin:knowledge:view',
    'nodes:catalog:view',
  ],
};

/**
 * Returns effective permission list for a user, combining explicit permissions with their role preset.
 */
export function getEffectivePermissions(
  userPermissions?: string[],
  role?: string,
): string[] {
  const explicit = Array.isArray(userPermissions) ? userPermissions : [];
  if (explicit.length > 0) return explicit;
  if (!role) return [];
  const normalized = role.toLowerCase().trim();
  return ROLE_PRESET_PERMISSIONS[normalized] || [];
}
