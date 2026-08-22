'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Scale, User } from 'lucide-react';
import { api } from '@/lib/api';

export default function LegalHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    api.getCurrentUser().then(setUser).catch(() => setUser(null));
  }, [pathname]);

  const handleLogout = () => {
    api.logout();
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
    router.push('/login');
  };

  return (
    <>
      <a href="#main-content" className="sr-only sr-only-focusable">
        Skip to main content
      </a>
      <nav className="flex items-center justify-between px-8 h-16 bg-nav-bg border-b border-nav-border text-nav-fg sticky top-0 z-50 shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <Link href="/legal" className="flex items-center gap-2" aria-label="Legal workspace home">
            <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 p-1.5 rounded-lg">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              nFlow Legal
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">{user?.name || user?.email || 'Legal User'}</span>
              {user?.role && (
                <span className="text-sm font-medium text-gray-500 ml-2">
                  ({String(user.role).replace(/_/g, ' ')})
                </span>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-all duration-200 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
