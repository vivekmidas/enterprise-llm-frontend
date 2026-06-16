import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public paths that do not require authentication
  // These are /login, /signup, and the main landing page /
  const publicPaths = ['/login', '/signup', '/'];

  // Check if the current path is one of the public paths
  const isPublicPath = publicPaths.includes(pathname);

  // Check if the user has an authentication token in their cookies
  // This assumes your backend sets an httpOnly cookie named 'admin_token' upon login.
  const isAuthenticated = request.cookies.has('admin_token');

  // Case 1: User is NOT authenticated
  if (!isAuthenticated) {
    // If trying to access a protected path, redirect to login
    if (!isPublicPath) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // If trying to access a public path, allow the request to proceed
    return NextResponse.next();
  }

  // Case 2: User IS authenticated
  // If trying to access a public authentication-related page (login/signup),
  // redirect them to the workflow builder (or admin page if they are admin).
  // Allow authenticated users to still view the main landing page ('/').
  if (isPublicPath && pathname !== '/') {
    return NextResponse.redirect(new URL('/workflow-builder', request.url));
  }

  // If authenticated and trying to access a protected path, allow the request to proceed
  return NextResponse.next();
}

// Configure the paths where the middleware should run
export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - api (API routes)
    // - any files in the public folder (e.g., /images, /docs)
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|js|css|map)$).*)',
  ],
};
