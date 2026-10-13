/*
===============================================================================
BLOCK COMMENT: AI-FIRST LANDING HUB FOR LOGGED-IN LEGAL PORTAL (LIGHT THEME)
Module: frontend/app/legal/AILandingHub.tsx
Description:
    - Warm parchment / ivory legal stationery background (#FAF8F2) with crisp white cards.
    - Tailored for legal domain aesthetics: dignified typography, classic accents, and clear readability.
    - 7 first-class AI action cards calling out explicit AI mechanisms.
    - Direct page-level navigation for granular RBAC authorization.
===============================================================================
*/

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FolderKanban,
  PlusCircle,
  FileUp,
  Scale,
  BookOpen,
  Users,
  Languages,
  Search,
  Sparkles,
  ArrowRight,
  Clock,
  ChevronRight,
  BrainCircuit,
  Building2,
  ShieldCheck,
  PenTool,
} from 'lucide-react';

export interface AILandingHubProps {
  userName?: string;
  showToast?: (message: string) => void;
}

export default function AILandingHub({
  userName = 'Counsel',
  showToast = () => {},
}: AILandingHubProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [recentCases, setRecentCases] = useState<any[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('legal_case_workspaces');
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecentCases(parsed.slice(0, 3));
      }
    } catch (e) {
      console.warn('Could not load recent cases:', e);
    }
  }, []);

  // Keyboard shortcut: Press '/' to focus search
  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/legal/search?query=${encodeURIComponent(searchQuery.trim())}`);
  };

  // 7 First-Class AI Action Cards in Light Parchment/White Theme
  const AI_ACTION_CARDS = [
    {
      id: 'open-case',
      title: 'Open Existing Case',
      badge: 'Case Dossiers',
      route: '/legal/cases',
      icon: FolderKanban,
      badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200/80',
      iconColor: 'text-indigo-700',
      iconBg: 'bg-indigo-50 border-indigo-200',
      borderHover: 'hover:border-indigo-400',
      glowShadow: 'hover:shadow-[0_12px_28px_rgba(79,70,229,0.12)]',
      aiEngine: 'RAG & Matter Memory Engine',
      shortDesc: 'Access active case dossiers, filed petitions, court dates, and case memory.',
      aiUsageDesc:
        'Embeds and indexes all matter files into localized vector stores. Performs semantic search across pleadings, past hearing notes, and orders in milliseconds.',
      buttonText: 'Open Case Workspaces',
    },
    {
      id: 'upload-summarize',
      title: 'Upload & Summarize Matter',
      badge: 'Matter Intake & Brief',
      route: '/legal/summarize',
      icon: FileUp,
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
      iconColor: 'text-emerald-700',
      iconBg: 'bg-emerald-50 border-emerald-200',
      borderHover: 'hover:border-emerald-500',
      glowShadow: 'hover:shadow-[0_12px_28px_rgba(16,185,129,0.12)]',
      aiEngine: 'Long-Context LLM & NER Synthesis',
      shortDesc: 'Instant matter intake, factual matrix, timeline & 1-click workspace onboarding.',
      aiUsageDesc:
        'Digests case briefs, petitions, and orders. Extracts claimant/respondent entities, jurisdiction, event chronologies, and disputed legal issues, linking directly into active case workspaces.',
      buttonText: 'Intake & Summarize Matter',
    },
    {
      id: 'contract-drafter',
      title: 'AI Contract & Deed Drafter',
      badge: 'Legal Drafting',
      route: '/legal/draft',
      icon: PenTool,
      badgeBg: 'bg-amber-50 text-amber-900 border-amber-200/80',
      iconColor: 'text-amber-800',
      iconBg: 'bg-amber-50 border-amber-200',
      borderHover: 'hover:border-amber-500',
      glowShadow: 'hover:shadow-[0_12px_28px_rgba(217,119,6,0.12)]',
      aiEngine: 'Jurisdictional Clause & Deed AI',
      shortDesc: 'Draft rental agreements, sworn affidavits, mutual NDAs & commercial covenants.',
      aiUsageDesc:
        'Automates end-to-end drafting of legally enforceable agreements, sworn affidavits with statutory verification, commercial leases, and powers of attorney tailored to Indian law and stamp acts.',
      buttonText: 'Draft Contract or Deed',
    },
    {
      id: 'find-similar',
      title: 'Find Relevant / Similar Cases',
      badge: 'Precedent Discovery',
      route: '/legal/search',
      icon: Scale,
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-200/80',
      iconColor: 'text-blue-700',
      iconBg: 'bg-blue-50 border-blue-200',
      borderHover: 'hover:border-blue-500',
      glowShadow: 'hover:shadow-[0_12px_28px_rgba(37,99,235,0.12)]',
      aiEngine: 'Dense Semantic Precedent Matcher',
      shortDesc: 'Discover binding precedents by natural language query or draft upload.',
      aiUsageDesc:
        'Leverages dense semantic embeddings and cross-encoder re-ranking against millions of Indian High Court and Supreme Court judgments to locate matching factual parallels and legal principles.',
      buttonText: 'Find Similar Precedents',
    },
    {
      id: 'section-research',
      title: 'Section & Statute Research',
      badge: 'Statutory Lens',
      route: '/legal/statutes',
      icon: BookOpen,
      badgeBg: 'bg-orange-50 text-orange-900 border-orange-200/80',
      iconColor: 'text-orange-800',
      iconBg: 'bg-orange-50 border-orange-200',
      borderHover: 'hover:border-orange-500',
      glowShadow: 'hover:shadow-[0_12px_28px_rgba(234,88,12,0.12)]',
      aiEngine: 'Knowledge-Graph Statutory Reasoning',
      shortDesc: 'Research provisions by section number (e.g. S. 138) or factual description.',
      aiUsageDesc:
        'Knowledge-graph AI maps statutory sections across old and new codes (IPC vs BNS, CrPC vs BNSS, NI Act, IBC) to authoritative judicial interpretations, statutory ingredients, and landmark rulings.',
      buttonText: 'Research Section & Ratio',
    },
    {
      id: 'party-intelligence',
      title: 'Party & Litigant Intelligence',
      badge: 'Litigant Search',
      route: '/legal/parties',
      icon: Users,
      badgeBg: 'bg-rose-50 text-rose-900 border-rose-200/80',
      iconColor: 'text-rose-700',
      iconBg: 'bg-rose-50 border-rose-200',
      borderHover: 'hover:border-rose-500',
      glowShadow: 'hover:shadow-[0_12px_28px_rgba(225,29,72,0.12)]',
      aiEngine: 'Cross-Court Entity Resolution AI',
      shortDesc: 'Track corporate entities or individuals across Courts & Tribunals.',
      aiUsageDesc:
        'Employs entity disambiguation AI across tribunals and appellate courts to map a litigant’s historical track record, bench patterns, dispute frequency, and recurring opposing counsel.',
      buttonText: 'Search Litigant Track Record',
    },
    {
      id: 'indic-translation',
      title: 'Indic Legal Translation',
      badge: 'Vernacular AI',
      route: '/legal/translate',
      icon: Languages,
      badgeBg: 'bg-teal-50 text-teal-900 border-teal-200/80',
      iconColor: 'text-teal-700',
      iconBg: 'bg-teal-50 border-teal-200',
      borderHover: 'hover:border-teal-500',
      glowShadow: 'hover:shadow-[0_12px_28px_rgba(13,148,136,0.12)]',
      aiEngine: 'Indic Legal Domain Translation Models',
      shortDesc: 'Translate court filings, orders & evidence between English and 10+ Indian languages.',
      aiUsageDesc:
        'Fine-tuned Indic translation models accurately translate court orders, police FIRs, depositions, and sale deeds across Hindi, Marathi, Gujarati, Tamil, Telugu, Bengali, Kannada, Punjabi, and Malayalam while strictly retaining judicial terms of art and statutory references.',
      buttonText: 'Translate Document',
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-64px)] w-full bg-[#FAF7F0] text-slate-900 flex flex-col items-center justify-start px-4 sm:px-6 lg:px-12 py-10">
      {/* Subtle Warm Watermark Pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#E8E2D5_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />

      {/* Main Container */}
      <div className="w-full max-w-6xl z-10 flex flex-col items-center">
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-amber-300/80 bg-amber-100/70 text-amber-900 text-xs font-semibold mb-3 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>Enterprise AI Legal Workspace</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-center text-[#1E232A] mb-2.5 font-serif">
          What do you want to do today?
        </h1>
        <p className="text-sm sm:text-base text-slate-600 text-center max-w-2xl mb-8 font-normal">
          First-class AI actions for Indian legal practice. Hover over each action card to explore how AI accelerates your workflow.
        </p>

        {/* Universal Search Command Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="w-full max-w-3xl relative mb-10 group"
        >
          <div className="relative flex items-center rounded-2xl border border-[#DCD5C6] bg-white shadow-[0_4px_20px_rgba(44,39,30,0.06)] transition-all duration-200 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-500/20 hover:border-slate-400">
            <div className="pl-4 pr-2 text-slate-400">
              <Search className="w-5 h-5 text-indigo-700" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search precedents, acts, sections (e.g. S. 138 NI Act), parties, or ask a legal question..."
              className="w-full bg-transparent py-4 text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none"
            />
            <div className="hidden sm:flex items-center gap-1.5 pr-3">
              <kbd className="px-2 py-0.5 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-md">
                /
              </kbd>
              <button
                type="submit"
                className="ml-2 px-4 py-2 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <span>Search</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Query Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3.5 text-xs text-slate-600">
            <span className="text-slate-500 font-medium">Quick Suggestions:</span>
            {[
              { label: 'Section 138 NI Act Notice Limitation', query: 'Section 138 Negotiable Instruments Act notice limitation' },
              { label: 'Bail under Section 45 PMLA', query: 'Twin conditions for bail under Section 45 PMLA' },
              { label: 'Section 34 Arbitral Award Patent Illegality', query: 'Section 34 Arbitration Act patent illegality public policy' },
              { label: 'Translate FIR Marathi to English', query: 'Translate FIR Marathi to English' },
            ].map((pill, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSearchQuery(pill.query);
                  router.push(`/legal/search?query=${encodeURIComponent(pill.query)}`);
                }}
                className="px-2.5 py-1 rounded-lg bg-white border border-[#E0D8C8] hover:border-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-900 transition-colors cursor-pointer text-[11px] text-slate-700 shadow-2xs"
              >
                {pill.label}
              </button>
            ))}
          </div>
        </form>

        {/* 7 AI First-Class Action Cards Grid (Responsive 1/2/3 columns) */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-12">
          {AI_ACTION_CARDS.map((card, index) => {
            const Icon = card.icon;
            const isHovered = hoveredCard === index;

            return (
              <div
                key={card.id}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => router.push(card.route)}
                className={`group relative flex flex-col justify-between p-6 rounded-2xl border border-[#E2DBD0] bg-white shadow-[0_2px_12px_rgba(44,39,30,0.05)] cursor-pointer transition-all duration-200 hover:-translate-y-1 ${card.borderHover} ${card.glowShadow}`}
              >
                {/* Card Top Row: Icon + Badge */}
                <div className="relative z-10 flex items-start justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-200 ${card.iconBg}`}
                  >
                    <Icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${card.badgeBg}`}
                  >
                    {card.badge}
                  </span>
                </div>

                {/* Card Middle: Title & AI Mechanism Callout */}
                <div className="relative z-10 flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-1.5 flex items-center gap-1.5 group-hover:text-indigo-900 transition-colors">
                    <span>{card.title}</span>
                    <ArrowRight className="w-4 h-4 opacity-0 -translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-indigo-700" />
                  </h3>

                  {/* AI Engine Tag */}
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#F5F2EA] border border-[#E5DFD0] text-[10px] font-semibold text-slate-700 mb-2.5">
                    <BrainCircuit className="w-3 h-3 text-amber-700" />
                    <span>{card.aiEngine}</span>
                  </div>

                  {/* Hover Transition: Shows explicit "How AI Works" vs Short Description */}
                  <div className="min-h-[58px]">
                    {isHovered ? (
                      <div className="text-xs text-slate-700 leading-relaxed animate-in fade-in duration-150">
                        <span className="font-bold text-slate-900">How AI Works: </span>
                        {card.aiUsageDesc}
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {card.shortDesc}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Bottom: Action CTA Button */}
                <div className="relative z-10 pt-4 mt-3 border-t border-[#EDE7DB] flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-900 flex items-center gap-1.5">
                    {card.buttonText}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-[#FAF8F3] border border-[#DDD5C7] flex items-center justify-center text-slate-600 group-hover:bg-indigo-900 group-hover:border-indigo-900 group-hover:text-white transition-all shadow-2xs">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Resume Strip: Active Case Workspaces */}
        {recentCases.length > 0 && (
          <div className="w-full max-w-4xl p-5 rounded-2xl border border-[#E0D8C8] bg-white shadow-[0_2px_12px_rgba(44,39,30,0.04)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-indigo-700" />
                <span>Resume Active Matters</span>
              </div>
              <Link
                href="/legal/cases"
                className="text-xs text-indigo-800 hover:text-indigo-950 font-bold flex items-center gap-1 transition-colors"
              >
                <span>View all matters</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {recentCases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => router.push(`/legal/cases?caseId=${encodeURIComponent(c.id)}`)}
                  className="p-3.5 rounded-xl border border-[#E8E2D5] bg-[#FAF8F4] hover:bg-white hover:border-indigo-300 hover:shadow-xs cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 truncate mb-1">
                      {c.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate mb-1">
                      {c.category || 'General Litigation'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-[#E8E2D5]">
                    <span>{c.court || 'High Court'}</span>
                    <span className="text-indigo-800 font-bold">Open →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
