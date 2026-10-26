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

  // API Keys (EPIC-AUTH-001)
  {
    pattern: '/admin/api-keys',
    permission: 'admin:tenant_settings:configure',
    module: 'admin',
    submodule: 'api_keys',
    label: 'API Keys',
  },
  {
    pattern: '/admin/api-keys/**',
    permission: 'admin:tenant_settings:configure',
    module: 'admin',
    submodule: 'api_keys',
    label: 'API Keys Sub-routes',
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
    submodule: 'hub',
    label: 'Legal AI Action Hub',
  },
  {
    pattern: '/legal/cases/new',
    permission: 'legal:research:edit',
    module: 'legal',
    submodule: 'cases',
    label: 'Create Case Workspace',
  },
  {
    pattern: '/legal/cases',
    permission: 'legal:research:view',
    module: 'legal',
    submodule: 'cases',
    label: 'Case Workspaces',
  },
  {
    pattern: '/legal/cases/**',
    permission: 'legal:research:view',
    module: 'legal',
    submodule: 'cases',
    label: 'Case Sub-routes',
  },
  {
    pattern: '/legal/summarize',
    permission: 'legal:research:upload',
    module: 'legal',
    submodule: 'summarize',
    label: 'Matter Summarizer',
  },
  {
    pattern: '/legal/search',
    permission: 'legal:research:query',
    module: 'legal',
    submodule: 'search',
    label: 'Precedent Discovery',
  },
  {
    pattern: '/legal/statutes',
    permission: 'legal:research:query',
    module: 'legal',
    submodule: 'statutes',
    label: 'Section & Statute Research',
  },
  {
    pattern: '/legal/parties',
    permission: 'legal:research:query',
    module: 'legal',
    submodule: 'parties',
    label: 'Party Intelligence',
  },
  {
    pattern: '/legal/translate',
    permission: 'legal:research:query',
    module: 'legal',
    submodule: 'translate',
    label: 'Indic Legal Translation',
  },
  {
    pattern: '/legal/draft',
    permission: 'legal:research:query',
    module: 'legal',
    submodule: 'draft',
    label: 'Contract & Deed Drafter',
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

/* ==============================================================================
   BLOCK COMMENT: 1-TO-1 CANONICAL PERMISSION ALIAS & EQUIVALENCE ENGINE
   Reference: EPIC-RBAC-1TO1-001 / STORY-CANONICAL-ROUTE-PERMS-001
   Description:
     Maps simplified 1-to-1 route-aligned permissions (e.g. admin:roles:view,
     admin:users:view, admin:workflows:view, admin:nodes:view) bidirectionally
     with legacy 3-tier keys (e.g. admin:role_management:view,
     admin:user_management:read, workflows:builder:view, nodes:catalog:view).
   ============================================================================== */
const MODULE_SUBMODULE_EQUIVALENCE_GROUPS: Array<Array<[string, string]>> = [
  [
    ['admin', 'workflows'],
    ['workflows', 'builder'],
    ['workflow', 'builder'],
    ['workflows', 'all'],
    ['workflow', 'all'],
  ],
  [
    ['admin', 'nodes'],
    ['nodes', 'catalog'],
    ['node', 'catalog'],
    ['admin', 'node_management'],
    ['nodes', 'all'],
    ['node', 'all'],
  ],
  [
    ['admin', 'roles'],
    ['admin', 'role_management'],
  ],
  [
    ['admin', 'users'],
    ['admin', 'user_management'],
  ],
  [
    ['admin', 'customers'],
    ['admin', 'customer_management'],
  ],
  [
    ['admin', 'company_settings'],
    ['admin', 'tenant_settings'],
    ['admin', 'settings'],
  ],
  [
    ['admin', 'api_keys'],
    ['admin', 'tenant_settings'],
  ],
  [
    ['admin', 'knowledge'],
    ['kb', 'base'],
    ['kb', 'document'],
    ['knowledge', 'base'],
    ['kb', 'all'],
    ['knowledge', 'all'],
  ],
  [
    ['legal', 'research'],
    ['legal', 'case_management'],
    ['legal', 'cases'],
    ['legal', 'hub'],
    ['legal', 'search'],
    ['legal', 'statutes'],
    ['legal', 'parties'],
    ['legal', 'translate'],
    ['legal', 'draft'],
    ['legal', 'summarize'],
  ],
];

const KNOWN_ACTIONS = new Set([
  'view',
  'read',
  'create',
  'edit',
  'update',
  'delete',
  'execute',
  'manage',
  'query',
  'ingest',
  'configure',
  'upload',
  'bookmark',
  'admin',
  'evidence',
  'draft',
  '*',
]);

export function expandPermissionAliases(requiredPermission: string): Set<string> {
  if (!requiredPermission) return new Set();
  const clean = requiredPermission.trim().toLowerCase();
  const candidates = new Set<string>([clean, '*:*:*']);

  const parts = clean.split(':');
  let mod = '';
  let submod = '';
  let action = '';

  if (parts.length === 2) {
    mod = parts[0];
    if (KNOWN_ACTIONS.has(parts[1])) {
      submod = 'all';
      action = parts[1];
    } else {
      submod = parts[1];
      action = 'view';
    }
  } else if (parts.length >= 3) {
    mod = parts[0];
    submod = parts[1];
    action = parts[2];
  } else {
    return candidates;
  }

  const equivPairs: Array<[string, string]> = [[mod, submod]];
  for (const group of MODULE_SUBMODULE_EQUIVALENCE_GROUPS) {
    const matchesPair = group.some(([m, s]) => m === mod && (s === submod || submod === 'all'));
    if (matchesPair) {
      group.forEach((p) => equivPairs.push(p));
    }
  }

  const equivActions = new Set<string>([action, '*', 'manage', 'admin']);
  if (action === 'view' || action === 'read') {
    equivActions.add('view');
    equivActions.add('read');
    if (mod === 'legal' || submod === 'research' || submod === 'playground') {
      equivActions.add('query');
    }
  } else if (action === 'query') {
    equivActions.add('query');
    equivActions.add('view');
    equivActions.add('read');
  } else if (action === 'edit' || action === 'update' || action === 'configure') {
    equivActions.add('edit');
    equivActions.add('update');
    equivActions.add('configure');
  }

  for (const [m, s] of equivPairs) {
    candidates.add(`${m}:*:*`);
    candidates.add(`${m}:*`);
    candidates.add(`${m}:manage`);
    candidates.add(`${m}:all:manage`);
    candidates.add(`${m}:${s}:*`);
    candidates.add(`${m}:${s}:manage`);
    for (const a of equivActions) {
      candidates.add(`${m}:${s}:${a}`);
      candidates.add(`${m}:${a}`);
    }
  }

  return candidates;
}

/**
 * Checks if a set of user permissions satisfies a required permission scope,
 * supporting 3-tier wildcard rules (*:*:*, xx:*:*, xx:yy:*) and 1-to-1 / legacy aliases.
 */
export function hasPermissionScope(userPermissions: string[], requiredPermission: string): boolean {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  if (userPermissions.includes('*:*:*')) return true;

  const acceptable = expandPermissionAliases(requiredPermission);
  for (const up of userPermissions) {
    if (!up) continue;
    const cleanUp = up.trim().toLowerCase();
    if (acceptable.has(cleanUp)) return true;
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
  const perms = getEffectivePermissions(userPermissions, userRole);
  const normalizedRole = (userRole || '').toLowerCase().trim();

  if (defaultRoute) return defaultRoute;

  // ==============================================================================
  // BLOCK COMMENT: STORY 2 - WORKFLOW DESIGNER REDIRECT
  // When user has workflow design & view rights (or workflow_designer role),
  // open the workflow editor (/workflow-builder) as default destination.
  // ==============================================================================
  const hasWorkflowView =
    hasPermissionScope(perms, 'workflow:builder:view') ||
    hasPermissionScope(perms, 'workflows:builder:view') ||
    hasPermissionScope(perms, 'workflow:*:*') ||
    hasPermissionScope(perms, 'workflows:*:*') ||
    hasPermissionScope(perms, '*:*:*');

  const hasWorkflowDesign =
    hasPermissionScope(perms, 'workflow:builder:edit') ||
    hasPermissionScope(perms, 'workflows:builder:edit') ||
    hasPermissionScope(perms, 'workflow:builder:create') ||
    hasPermissionScope(perms, 'workflows:builder:create') ||
    hasPermissionScope(perms, 'workflow:builder:manage') ||
    hasPermissionScope(perms, 'workflows:builder:manage') ||
    hasPermissionScope(perms, 'workflow:*:*') ||
    hasPermissionScope(perms, 'workflows:*:*') ||
    hasPermissionScope(perms, '*:*:*');

  const isWorkflowDesigner =
    normalizedRole === 'workflow_designer' ||
    (hasWorkflowView &&
      hasWorkflowDesign &&
      !['para_legal', 'paralegal', 'tenant_user', 'standard_user'].includes(normalizedRole));

  if (isWorkflowDesigner) {
    return '/workflow-builder';
  }

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
    hasPermissionScope(perms, 'workflows:builder:view') ||
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
  workflow_designer: [
    'workflows:builder:view',
    'workflows:builder:create',
    'workflows:builder:edit',
    'workflows:builder:delete',
    'workflows:builder:execute',
    'workflows:builder:manage',
    'workflow:builder:view',
    'workflow:builder:create',
    'workflow:builder:edit',
    'workflow:builder:delete',
    'workflow:builder:execute',
    'workflow:builder:manage',
    'nodes:catalog:view',
    'nodes:catalog:execute',
    'nodes:catalog:manage',
    'admin:knowledge:view',
    'admin:profiles:view',
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
export function getEffectivePermissions(userPermissions?: string[], role?: string): string[] {
  const explicit = Array.isArray(userPermissions) ? userPermissions : [];
  if (explicit.length > 0) return explicit;
  if (!role) return [];
  const normalized = role.toLowerCase().trim();
  return ROLE_PRESET_PERMISSIONS[normalized] || [];
}
