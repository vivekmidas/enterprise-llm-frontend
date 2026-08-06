import { api } from '@/lib/api';

export interface RoutePermissionRule {
  pattern: string;
  permission: string;
}

// Default baseline route permissions (in-memory fallback before DB fetch completes)
export const DEFAULT_ROUTE_PATTERNS: RoutePermissionRule[] = [
  { pattern: "/workflow-builder/new", permission: "workflow:create" },
  { pattern: "/workflow-builder/*/edit", permission: "workflow:edit" },
  { pattern: "/workflow-builder", permission: "workflow:view" },
  { pattern: "/workflow-builder/**", permission: "workflow:view" },
  { pattern: "/admin/knowledge", permission: "legal:document:upload" },
  { pattern: "/admin/knowledge/**", permission: "legal:document:upload" },
  { pattern: "/admin/users", permission: "admin:users:read" },
  { pattern: "/admin/users/**", permission: "admin:users:read" },
  { pattern: "/admin/roles", permission: "admin:tenant:configure" },
  { pattern: "/admin/roles/**", permission: "admin:tenant:configure" },
  { pattern: "/admin/nodes", permission: "node:view" },
  { pattern: "/admin/nodes/**", permission: "node:view" },
  { pattern: "/admin/oauth", permission: "admin:tenant:configure" },
  { pattern: "/admin/oauth/**", permission: "admin:tenant:configure" },
  { pattern: "/admin/logs", permission: "admin:tenant:configure" },
  { pattern: "/admin/logs/**", permission: "admin:tenant:configure" },
  { pattern: "/admin/metrics", permission: "admin:tenant:configure" },
  { pattern: "/admin/metrics/**", permission: "admin:tenant:configure" },
  { pattern: "/admin/profiles", permission: "admin:tenant:configure" },
  { pattern: "/admin/profiles/**", permission: "admin:tenant:configure" },
  { pattern: "/admin/provider-presets", permission: "admin:tenant:configure" },
  { pattern: "/admin/provider-presets/**", permission: "admin:tenant:configure" },
  { pattern: "/admin/playground", permission: "kb:base:view" },
  { pattern: "/admin/playground/**", permission: "kb:base:view" },
  { pattern: "/admin/customers", permission: "system:admin:*" },
  { pattern: "/admin/customers/**", permission: "system:admin:*" },
  { pattern: "/admin", permission: "tenant:admin:*" },
  { pattern: "/admin/**", permission: "tenant:admin:*" },
  { pattern: "/legal-research", permission: "legal:research:query" },
  { pattern: "/legal-research/**", permission: "legal:research:query" },
];

let activeRoutePatterns: RoutePermissionRule[] = [...DEFAULT_ROUTE_PATTERNS];

/**
 * Loads route permission rules dynamically from DB at startup.
 */
export async function loadRoutePermissionsFromDB(): Promise<RoutePermissionRule[]> {
  try {
    const dbRoutes = await api.getRoutePermissions();
    if (Array.isArray(dbRoutes) && dbRoutes.length > 0) {
      activeRoutePatterns = dbRoutes.map((r: any) => ({
        pattern: r.pattern,
        permission: r.permission,
      }));
    }
  } catch (err) {
    console.error("Failed to load route permissions from DB, using defaults:", err);
  }
  return activeRoutePatterns;
}

/**
 * Converts a glob pattern string (e.g., '/workflow-builder/**') into a RegExp.
 */
export function globToRegex(glob: string): RegExp {
  const regexString = glob
    .replace(/\*\*/g, ".*")
    .replace(/\*/g, "[^/]+");
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
 * supporting wildcard permission patterns (e.g. 'tenant:admin:*' or '*:*:*').
 */
export function hasPermissionScope(userPermissions: string[], requiredPermission: string): boolean {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  if (userPermissions.includes("*:*:*")) return true;
  if (userPermissions.includes(requiredPermission)) return true;

  for (const perm of userPermissions) {
    if (perm.endsWith("*")) {
      const prefix = perm.slice(0, -1);
      if (requiredPermission.startsWith(prefix)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Dynamically resolves the best default destination route based on a user's permissions.
 */
export function getDefaultRedirectForPermissions(userPermissions: string[], userRole?: string): string {
  const perms = userPermissions || [];
  if (userRole === "system_admin" || hasPermissionScope(perms, "system:admin:*")) {
    return "/admin";
  }
  if (userRole === "admin" || hasPermissionScope(perms, "tenant:admin:*")) {
    return "/admin";
  }
  if (
    hasPermissionScope(perms, "legal:document:upload") ||
    hasPermissionScope(perms, "kb:document:ingest") ||
    hasPermissionScope(perms, "kb:base:view") ||
    hasPermissionScope(perms, "legal:*") ||
    hasPermissionScope(perms, "kb:*")
  ) {
    return "/admin?tab=knowledge";
  }
  if (hasPermissionScope(perms, "workflow:view") || hasPermissionScope(perms, "workflow:create")) {
    return "/workflow-builder";
  }
  if (hasPermissionScope(perms, "legal:research:query")) {
    return "/legal-research";
  }
  return "/legal-research";
}
