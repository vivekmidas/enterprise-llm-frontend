'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Cpu, LogOut, User, Github } from 'lucide-react';
import { api } from '@/lib/api'; // Assuming api.logout() clears the cookie

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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null); // New state for user role
  const [userId, setUserId] = useState<string | null>(null); // New state for user ID

  useEffect(() => {
    const checkAuth = () => {
      const token = getCookie('admin_token'); // Read token from cookie
      const email = localStorage.getItem('user_email');
      const role = localStorage.getItem('user_role'); // Read role from localStorage
      const id = localStorage.getItem('user_id'); // Read user ID from localStorage
      setIsAuthenticated(!!token);
      setUserEmail(email);
      setUserRole(role);
      setUserId(id);
    };

    checkAuth();
    // Listen for storage changes to sync auth state across tabs
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, [pathname]);

  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
    // Clear auth-related items from cookie and localStorage on logout
    document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_id');
    setUserEmail(null);
    setUserRole(null);
    setUserId(null);
    router.push('/login');
  };

  // Don't show header on login/signup pages if preferred,
  // but following instructions to add to layout.

  return (
    <nav className="flex items-center justify-between px-8 h-16 bg-white border-b border-gray-200 sticky top-0 z-50 shrink-0 shadow-sm">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Cpu className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-gray-900">LLM Gateway</span>
        </Link>
      </div>

      <div className="flex items-center gap-6">
        {/* <Link href="https://github.com" className="text-gray-400 hover:text-gray-600 transition-colors">
          <Github className="h-5 w-5" />
        </Link> */}

        {isAuthenticated ? (
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">{userEmail}</span>
              {userRole && (
                <span className="text-xs font-medium text-gray-500 ml-2">({userRole})</span>
              )}
              {userId && (
                <span className="text-xs font-medium text-gray-500 ml-2">ID: {userId}</span>
              )}
            </div>
            <Link href="/admin" className="text-sm font-bold text-blue-600 hover:text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-50 transition-all duration-200">
              Console
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-gray-600 hover:text-gray-900">
              Log in
            </Link>
            <Link
              href="/signup"
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
