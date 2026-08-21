'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Scale, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function LegalHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    api.getCurrentUser().then(setUser).catch(() => setUser(null));
  }, [pathname]);

  const logout = () => {
    api.logout();
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 sm:px-8">
        <Link href="/legal" className="flex items-center gap-3" aria-label="Legal workspace home">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Scale className="size-4" aria-hidden="true" />
          </span>
          <span className="font-heading text-sm font-semibold tracking-tight text-foreground">nFlow Legal</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 sm:flex">
            <User className="size-3.5 text-muted-foreground" aria-hidden="true" />
            <span className="text-xs font-medium text-foreground">{user?.name || user?.email || 'Legal user'}</span>
            {user?.role && <span className="text-[11px] text-muted-foreground">{String(user.role).replace(/_/g, ' ')}</span>}
          </div>
          <button onClick={logout} className="flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
            <LogOut className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
