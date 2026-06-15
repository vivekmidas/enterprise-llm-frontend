'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Cpu, LogOut, User, Github } from 'lucide-react';
import { api } from '@/lib/api';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('admin_token');
      const email = localStorage.getItem('user_email');
      setIsAuthenticated(!!token);
      setUserEmail(email);
    };

    checkAuth();
    // Listen for storage changes to sync auth state across tabs
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, [pathname]);

  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
    // Clear the cookie on logout
    document.cookie = "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
    setUserEmail(null);
    router.push('/login');
  };

  // Don't show header on login/signup pages if preferred, 
  // but following instructions to add to layout.
  
  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100 sticky top-0 z-50">
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
            </div>
            <Link href="/admin" className="text-sm font-bold text-blue-600 hover:text-blue-700">
              Console
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-gray-600 hover:text-gray-900">Log in</Link>
            <Link href="/signup" className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-all shadow-sm">Sign up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}