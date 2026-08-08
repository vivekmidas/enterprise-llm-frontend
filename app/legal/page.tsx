'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegalDomainRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/legal-research');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-medium">Directing to Legal Research Workspace...</span>
      </div>
    </div>
  );
}
