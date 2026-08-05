"use client";

import React from "react";
import { hasPermissionScope } from "@/lib/config/route_permissions";

interface HasPermissionProps {
  permission: string;
  userPermissions?: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const HasPermission: React.FC<HasPermissionProps> = ({
  permission,
  userPermissions = [],
  fallback = null,
  children,
}) => {
  const allowed = hasPermissionScope(userPermissions, permission);
  if (!allowed) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
};
