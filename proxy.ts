import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  getRequiredPermissionForPath,
  hasPermissionScope,
  getDefaultRedirectForPermissions,
} from '@/lib/config/route_permissions';

/**
 * Parses JWT payload at Edge Middleware runtime without native crypto dependencies.
 */
function parseJwtPayload(token: string) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const publicPaths = ['/login', '/signup', '/'];
  const isPublicPath = publicPaths.includes(pathname);
  const token = request.cookies.get('token')?.value;

  // Case 1: Unauthenticated User Access
  if (!token) {
    if (!isPublicPath) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Extract JWT claims at Edge runtime
  const payload = parseJwtPayload(token);
  const userPermissions: string[] = payload?.permissions || [];
  const userRole: string = payload?.role || '';

  // Case 2: Authenticated User Accessing Auth Pages (/login, /signup)
  if (isPublicPath && pathname !== '/') {
    const defaultLandingPage = getDefaultRedirectForPermissions(userPermissions, userRole);
    return NextResponse.redirect(new URL(defaultLandingPage, request.url));
  }

  // Case 3: URL Route-Permission Authorization Guard
  const requiredPermission = getRequiredPermissionForPath(pathname);
  if (requiredPermission) {
    const isSystemSuperAdmin = userRole === 'system_admin' || hasPermissionScope(userPermissions, 'system:admin:*');
    const isAuthorized = isSystemSuperAdmin || hasPermissionScope(userPermissions, requiredPermission);

    if (!isAuthorized) {
      const fallbackRoute = getDefaultRedirectForPermissions(userPermissions, userRole);
      return NextResponse.redirect(new URL(fallbackRoute, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|js|css|map)$).*)',
  ],
};
