/*
===============================================================================
BLOCK COMMENT: PRECEDENT SEARCH & SIMILAR CASES PAGE (LIGHT THEME)
Module: frontend/app/legal/search/page.tsx
Description:
    - Dedicated page for Precedent Discovery and Case Similarity Matching.
    - Warm parchment header styling (#FAF7F0) with crisp white elements.
    - Embeds LegalResearchHub with breadcrumbs and query parameter synchronization.
===============================================================================
*/

'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Scale, Sparkles } from 'lucide-react';
import LegalResearchHub from '../LegalResearchHub';
import { api } from '@/lib/api';

/** Reads searchParams and renders the page body — kept in its own component
 *  so useSearchParams() is covered by the Suspense boundary below. */
function PrecedentSearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('query') || '';
  const mode = searchParams.get('mode') || 'grounded';

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    api.getCurrentUser().then(setCurrentUser).catch(() => {});
  }, []);

  return (
    <>
      {/* Top Breadcrumb Navigation */}
      <div className="px-6 py-3 border-b border-[#E0D8C8] bg-white flex items-center justify-between shadow-2xs">
        <Link
          href="/legal"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-800 hover:text-indigo-950 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to AI Hub</span>
        </Link>
        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
          <Scale className="w-3.5 h-3.5 text-blue-700" />
          <span>Precedent Discovery &amp; Case Matching Engine</span>
        </div>
      </div>

      {/* Embedded Paralegal Workspace */}
      <LegalResearchHub
        userPermissions={currentUser?.permissions || []}
        userRole={currentUser?.role || 'para_legal'}
        initialQuery={query}
        initialMode={mode}
      />
    </>
  );
}

export default function PrecedentSearchPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F0] text-slate-900">
      <Suspense fallback={null}>
        <PrecedentSearchContent />
      </Suspense>
    </div>
  );
}
