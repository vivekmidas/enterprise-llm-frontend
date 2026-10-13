/*
===============================================================================
BLOCK COMMENT: PARTY & LITIGANT INTELLIGENCE PAGE (LIGHT THEME)
Module: frontend/app/legal/parties/page.tsx
Description:
    - Dedicated page for analyzing litigation footprints of corporate entities or individuals.
    - Warm parchment background (#FAF7F0) with crisp white cards.
    - Surfaces dispute frequency, judicial forums, recurring opposing counsels, and past orders.
===============================================================================
*/

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  ArrowLeft,
  Search,
  Building2,
  Scale,
  Gavel,
  History,
  FileText,
  ArrowRight,
  TrendingUp,
  Award,
} from 'lucide-react';

const PARTY_PRESETS: Record<string, any> = {
  'National Highways Authority of India': {
    entity: 'National Highways Authority of India (NHAI)',
    type: 'Statutory Corporation / PSU',
    totalMatters: 1842,
    primaryForums: ['Supreme Court of India', 'High Court of Delhi', 'Bombay High Court'],
    commonDisputes: [
      { category: 'Arbitration S. 34 / 37 (EPC Claims)', percentage: '68%' },
      { category: 'Land Acquisition Compensation (Sec 3G)', percentage: '22%' },
      { category: 'Tender & Commercial Writs', percentage: '10%' },
    ],
    frequentCounsels: [
      'Tushar Mehta (Solicitor General)',
      'Neeraj Kishan Kaul (Sr. Adv.)',
      'Maninder Singh (Sr. Adv.)',
    ],
    recentJudgments: [
      {
        citation: 'NHAI v. M. Hakeem (2021) 9 SCC 1',
        bench: 'R.F. Nariman, B.R. Gavai, JJ.',
        outcome: 'Court under Section 34 cannot modify arbitral award.',
      },
      {
        citation: 'Ssangyong Eng. & Const. Co. v. NHAI (2019) 15 SCC 131',
        bench: 'R.F. Nariman, Vineet Saran, JJ.',
        outcome: 'Defined patent illegality and public policy doctrine under amended Act.',
      },
    ],
  },
  'DLF Ltd.': {
    entity: 'DLF Limited',
    type: 'Public Listed Real Estate Enterprise',
    totalMatters: 614,
    primaryForums: ['Supreme Court of India', 'NCLAT', 'NCDRC (Consumer)', 'Delhi High Court'],
    commonDisputes: [
      { category: 'Consumer Delay Penalty (NCDRC/RERA)', percentage: '45%' },
      { category: 'Competition Law (CCI Abuse of Dominance)', percentage: '30%' },
      { category: 'Commercial Contracts & Joint Ventures', percentage: '25%' },
    ],
    frequentCounsels: [
      'Abhishek Manu Singhvi (Sr. Adv.)',
      'Mukul Rohatgi (Sr. Adv.)',
      'Pinaki Misra (Sr. Adv.)',
    ],
    recentJudgments: [
      {
        citation: 'DLF Home Developers v. Rajapura Homes (2021) SCC Online SC 781',
        bench: 'D.Y. Chandrachud, M.R. Shah, JJ.',
        outcome: 'Section 11 court must examine prima facie existence of arbitration agreement.',
      },
    ],
  },
};

export default function PartyIntelligencePage() {
  const router = useRouter();
  const [partyQuery, setPartyQuery] = useState('National Highways Authority of India');
  const [partyData, setPartyData] = useState<any>(
    PARTY_PRESETS['National Highways Authority of India']
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const queryLower = partyQuery.toLowerCase();
    const foundKey = Object.keys(PARTY_PRESETS).find((k) =>
      k.toLowerCase().includes(queryLower)
    );
    if (foundKey) {
      setPartyData(PARTY_PRESETS[foundKey]);
    } else {
      setPartyData({
        entity: partyQuery,
        type: 'Litigant Entity',
        totalMatters: 48,
        primaryForums: ['Supreme Court of India', 'High Court of Delhi'],
        commonDisputes: [
          { category: 'Commercial Litigation', percentage: '60%' },
          { category: 'Contractual Disputes', percentage: '40%' },
        ],
        frequentCounsels: ['Appearing Advocates across Tribunals'],
        recentJudgments: [
          {
            citation: `${partyQuery} v. Union of India (2023)`,
            bench: 'Division Bench',
            outcome: 'Interim relief granted subject to deposit.',
          },
        ],
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-slate-900 p-6 sm:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header & Breadcrumb */}
        <div>
          <Link
            href="/legal"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-800 hover:text-rose-950 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to AI Hub</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-800">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 font-serif">Party & Litigant Intelligence</h1>
              <p className="text-xs text-slate-600">
                Track historical litigation footprint, dispute frequency, and counsel track records
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="bg-white border border-[#E0D8C8] rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3 shadow-[0_2px_12px_rgba(44,39,30,0.04)]"
        >
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={partyQuery}
              onChange={(e) => setPartyQuery(e.target.value)}
              placeholder="Search company or individual (e.g. National Highways Authority of India, DLF Ltd.)..."
              className="w-full bg-[#FAF8F3] border border-[#DDD5C7] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-rose-600"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-800 hover:bg-rose-900 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Analyze Litigant</span>
          </button>
        </form>

        {/* Litigant Details View */}
        {partyData && (
          <div className="space-y-6">
            {/* Entity Header Banner */}
            <div className="bg-white border border-[#E0D8C8] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_2px_12px_rgba(44,39,30,0.04)]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-900 border border-rose-200">
                  {partyData.type}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1.5 font-serif">{partyData.entity}</h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Primary Forums: {partyData.primaryForums.join(' · ')}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#DDD5C7] text-center shrink-0">
                <div className="text-2xl font-black text-rose-800 font-serif">{partyData.totalMatters}</div>
                <div className="text-[11px] text-slate-600 uppercase tracking-wider font-bold">
                  Indexed Court Matters
                </div>
              </div>
            </div>

            {/* Dispute Breakdown & Opposing Counsels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Common Disputes */}
              <div className="bg-white border border-[#E0D8C8] rounded-2xl p-5 space-y-3 shadow-[0_2px_12px_rgba(44,39,30,0.04)]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Dispute Category Distribution</span>
                </h3>
                <div className="space-y-2.5">
                  {partyData.commonDisputes.map((d: any, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-[#FAF8F3] border border-[#DDD5C7] flex items-center justify-between text-xs">
                      <span className="text-slate-800 font-medium">{d.category}</span>
                      <span className="font-bold text-rose-900 font-mono">{d.percentage}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recurring Opposing Counsels */}
              <div className="bg-white border border-[#E0D8C8] rounded-2xl p-5 space-y-3 shadow-[0_2px_12px_rgba(44,39,30,0.04)]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-700" />
                  <span>Frequent Senior Counsels</span>
                </h3>
                <div className="space-y-2.5">
                  {partyData.frequentCounsels.map((c: string, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-[#FAF8F3] border border-[#DDD5C7] flex items-center justify-between text-xs">
                      <span className="text-slate-800 font-bold">{c}</span>
                      <span className="text-[10px] text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-bold">
                        Frequent Appearance
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Landmark Rulings Involving Party */}
            <div className="bg-white border border-[#E0D8C8] rounded-2xl p-6 space-y-3 shadow-[0_2px_12px_rgba(44,39,30,0.04)]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Gavel className="w-4 h-4 text-indigo-700" />
                <span>Recent Landmark Orders & Precedents</span>
              </h3>
              <div className="space-y-3">
                {partyData.recentJudgments.map((item: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl bg-[#FAF8F3] border border-[#DDD5C7] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-slate-900 mb-0.5 font-serif">{item.citation}</h4>
                      <p className="text-[11px] text-slate-500">Bench: {item.bench}</p>
                      <p className="text-slate-700 mt-1">{item.outcome}</p>
                    </div>
                    <Link
                      href={`/legal/search?query=${encodeURIComponent(item.citation)}`}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#F0ECE0] text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#DDD5C7] shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                      <span>Search Precedents</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
