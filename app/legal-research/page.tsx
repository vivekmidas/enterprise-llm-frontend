/*
===============================================================================
BLOCK COMMENT: REDIRECT TO /legal
Module: frontend/app/legal-research/page.tsx
Description:
    Auto-redirects any traffic from /legal-research directly to /legal.
===============================================================================
*/

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegalResearchPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/legal');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-600 text-xs">
      Redirecting to Legal AI Platform...
    </div>
  );
}
