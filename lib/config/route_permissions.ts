// BLOCK COMMENT: FRONTEND 3-TIER PERMISSION MATCHING ENGINE (xx:yy:zzz FORMAT)
// File: frontend/lib/config/route_permissions.ts
// Description: Evaluates exact permission keys, submodule wildcards (xx:yy:*), module wildcards (xx:*:*), and global super admin (*:*:*).

import { api } from '@/lib/api';

export interface RoutePermissionRule {
  pattern: string;
  permission: string;
  module?: string;
  submodule?: string;
  label?: string;
}

// Default baseline route permissions
export const DEFAULT_ROUTE_PATTERNS: RoutePermissionRule[] = [
  { pattern: "/workflow-builder/new", permission: "workflow:builder:create" },
  { pattern: "/workflow-builder/*/edit", permission: "workflow:builder:edit" },
  { pattern: "/workflow-builder", permission: "workflow:builder:view" },
  { pattern: "/workflow-builder/**", permission: "workflow:builder:view" },
  { pattern: "/admin/users", permission: "admin:user_management:read" },
  { pattern: "/admin/users/**", permission: "admin:user_management:read" },
  { pattern: "/admin/roles", permission: "admin:role_management:view" },
  { pattern: "/admin/roles/**", permission: "admin:role_management:view" },
  { pattern: "/admin/provider-presets", permission: "admin:provider_presets:view" },
  { pattern: "/admin/provider-presets/**", permission: "admin:provider_presets:view" },
  { pattern: "/admin/playground", permission: "admin:playground:view" },
  { pattern: "/admin/playground/**", permission: "admin:playground:view" },
  { pattern: "/admin/customers", permission: "admin:customer_management:view" },
  { pattern: "/admin/customers/**", permission: "admin:customer_management:view" },
  { pattern: "/admin/nodes", permission: "admin:node_management:view" },
  { pattern: "/admin/nodes/**", permission: "admin:node_management:view" },
  { pattern: "/admin", permission: "admin:dashboard:view" },
  { pattern: "/admin/**", permission: "admin:dashboard:view" },
  { pattern: "/legal", permission: "legal:research:query" },
  { pattern: "/legal/**", permission: "legal:research:query" },
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
        permission: r.permission || r.permission_id,
        module: r.module,
        submodule: r.submodule,
        label: r.label,
      }));
    }
  } catch (err) {
    console.error("Failed to load route permissions from DB, using defaults:", err);
  }
  return activeRoutePatterns;
}

export function getActiveRoutePatterns(): RoutePermissionRule[] {
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
 * supporting 3-tier wildcard rules (*:*:*, xx:*:*, xx:yy:*).
 */
export function hasPermissionScope(userPermissions: string[], requiredPermission: string): boolean {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  if (userPermissions.includes("*:*:*")) return true;
  if (userPermissions.includes(requiredPermission)) return true;

  const parts = requiredPermission.split(":");
  const module = parts[0] || "";
  const submodule = parts[1] || "";

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
 * Dynamically resolves the best default destination route based on a user's permissions.
 */
export function getDefaultRedirectForPermissions(userPermissions: string[], userRole?: string): string {
  const perms = userPermissions || [];
  if (userRole === "system_admin" || hasPermissionScope(perms, "*:*:*") || hasPermissionScope(perms, "admin:*:*")) {
    return "/admin";
  }
  if (hasPermissionScope(perms, "legal:research:query") || hasPermissionScope(perms, "legal:*:*")) {
    return "/legal";
  }
  if (hasPermissionScope(perms, "workflow:builder:view") || hasPermissionScope(perms, "workflow:*:*")) {
    return "/workflow-builder";
  }
  if (hasPermissionScope(perms, "kb:base:view") || hasPermissionScope(perms, "kb:*:*")) {
    return "/legal";
  }
  return "/legal";
}

