/*
===============================================================================
BLOCK COMMENT: LOGGED-IN LEGAL PORTAL - AI-FIRST LANDING PAGE
Module: frontend/app/legal/page.tsx
Description:
    - Simplified, dedicated landing page for logged-in legal practitioners.
    - Hero "What do you want to do today?" with 7 first-class AI action cards.
    - Uses distinct page routes (/legal/cases, /legal/search, /legal/summarize,
      /legal/statutes, /legal/parties, /legal/translate) for granular authorization.
===============================================================================
*/

'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import AILandingHub from './AILandingHub';

/** Handles legacy ?tab= redirect logic — must be in its own component so
 *  useSearchParams() is covered by the Suspense boundary below. */
function LegalRedirectHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Backward compatibility: redirect legacy ?tab= queries to new dedicated pages
  useEffect(() => {
    const tab = searchParams?.get('tab');
    const query = searchParams?.get('query');
    if (tab === 'search') {
      router.replace(`/legal/search${query ? `?query=${encodeURIComponent(query)}` : ''}`);
    } else if (tab === 'cases') {
      router.replace('/legal/cases');
    } else if (tab === 'autopilot') {
      router.replace('/autopilot');
    } else if (tab === 'translate') {
      router.replace('/legal/translate');
    }
  }, [searchParams, router]);

  return null;
}

export default function LegalLandingPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    api.getCurrentUser().then(setCurrentUser).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-slate-900">
      <Suspense fallback={null}>
        <LegalRedirectHandler />
      </Suspense>
      <AILandingHub
        userName={currentUser?.name || currentUser?.full_name || 'Counsel'}
      />
    </div>
  );
}
