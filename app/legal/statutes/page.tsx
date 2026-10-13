/*
===============================================================================
BLOCK COMMENT: SECTION & STATUTORY RESEARCH PAGE (LIGHT THEME)
Module: frontend/app/legal/statutes/page.tsx
Description:
    - Dedicated page for researching statutory sections, legislative ingredients,
      and old vs new criminal code concordance (IPC/BNS, CrPC/BNSS).
    - Warm parchment background (#FAF7F0) with crisp white cards.
    - Links directly to judicial interpretation and ratio decidendi.
===============================================================================
*/

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  ArrowLeft,
  Search,
  Scale,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  Layers,
} from 'lucide-react';

const STATUTE_PRESETS = [
  {
    act: 'Negotiable Instruments Act, 1881',
    section: '138',
    title: 'Dishonour of cheque for insufficiency, etc., of funds in the account',
    bnsMapping: 'Special Act (Independent of BNS/BNSS)',
    ingredients: [
      'Cheque drawn on an account maintained by drawer for payment of money.',
      'Cheque presented to bank within validity period (3 months).',
      'Cheque returned unpaid by bank due to insufficiency of funds.',
      'Statutory demand notice issued in writing within 30 days of return memo.',
      'Failure of drawer to make payment within 15 days of receipt of notice.',
    ],
    leadingPrecedents: [
      {
        case: 'Dashrath Rupsingh Rathod v. State of Maharashtra (2014) 9 SCC 129',
        ratio: 'Territorial jurisdiction determined by location of drawee bank branch where account is maintained.',
      },
      {
        case: 'Kalamani Tex v. P. Balasubramanian (2021) 5 SCC 283',
        ratio: 'Statutory presumption under Section 139 mandates drawer to rebut liability by standard of preponderance of probabilities.',
      },
    ],
  },
  {
    act: 'Indian Penal Code (IPC) / Bharatiya Nyaya Sanhita (BNS)',
    section: '307 IPC / 109 BNS',
    title: 'Attempt to Murder',
    bnsMapping: 'IPC Section 307 maps directly to Section 109 BNS (2023)',
    ingredients: [
      'Doing of an act by the accused.',
      'Act done with intention or knowledge to cause death.',
      'Execution of act under circumstances that, if death resulted, it would amount to murder.',
      'Actus reus must be proximate to the intended result.',
    ],
    leadingPrecedents: [
      {
        case: 'State of Maharashtra v. Balram Bama Patil (1983) 2 SCC 28',
        ratio: 'Infliction of bodily injury capable of causing death is not essential; intention or knowledge coupled with overt act suffices.',
      },
      {
        case: 'Hari Singh v. State of Sukhbir Singh (1988) 4 SCC 551',
        ratio: 'Intention is gathered from nature of weapon, blow delivered, and bodily region targeted.',
      },
    ],
  },
  {
    act: 'Arbitration and Conciliation Act, 1996',
    section: '34',
    title: 'Application for setting aside arbitral award',
    bnsMapping: 'Commercial Arbitration Framework',
    ingredients: [
      'Incapacity of a party or invalidity of arbitration agreement under law.',
      'Absence of proper notice of appointment or proceedings.',
      'Award deals with dispute not contemplated or not submitted.',
      'Award is in conflict with public policy of India or vitiated by patent illegality.',
    ],
    leadingPrecedents: [
      {
        case: 'Ssangyong Engineering & Construction Co. Ltd. v. NHAI (2019) 15 SCC 131',
        ratio: 'Patent illegality must be illegality going to root of matter, not mere erroneous application of law.',
      },
      {
        case: 'Associate Builders v. DDA (2015) 3 SCC 49',
        ratio: 'Arbitral tribunal is sole judge of quantity and quality of evidence; court does not sit in appeal.',
      },
    ],
  },
];

export default function StatutoryResearchPage() {
  const router = useRouter();
  const [selectedAct, setSelectedAct] = useState(STATUTE_PRESETS[0].act);
  const [sectionNumber, setSectionNumber] = useState(STATUTE_PRESETS[0].section);
  const [activePreset, setActivePreset] = useState<any>(STATUTE_PRESETS[0]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = STATUTE_PRESETS.find(
      (p) =>
        p.section.toLowerCase().includes(sectionNumber.toLowerCase()) ||
        p.act.toLowerCase().includes(selectedAct.toLowerCase())
    );
    if (matched) {
      setActivePreset(matched);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-slate-900 p-6 sm:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header & Breadcrumb */}
        <div>
          <Link
            href="/legal"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-800 hover:text-orange-950 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to AI Hub</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-800">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 font-serif">Section & Statute Research</h1>
              <p className="text-xs text-slate-600">
                Statutory ingredients, old vs new code concordance (IPC/BNS), and ratio decidendi
              </p>
            </div>
          </div>
        </div>

        {/* Search / Lookup Bar */}
        <form
          onSubmit={handleSearch}
          className="bg-white border border-[#E0D8C8] rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 shadow-[0_2px_12px_rgba(44,39,30,0.04)]"
        >
          <div className="sm:col-span-5">
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Select Act / Code
            </label>
            <select
              value={selectedAct}
              onChange={(e) => setSelectedAct(e.target.value)}
              className="w-full bg-[#FAF8F3] border border-[#DDD5C7] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-orange-600"
            >
              <option value="Negotiable Instruments Act, 1881">Negotiable Instruments Act, 1881</option>
              <option value="Indian Penal Code (IPC) / Bharatiya Nyaya Sanhita (BNS)">
                IPC / Bharatiya Nyaya Sanhita (BNS)
              </option>
              <option value="Arbitration and Conciliation Act, 1996">Arbitration Act, 1996</option>
              <option value="Insolvency and Bankruptcy Code, 2016">Insolvency and Bankruptcy Code (IBC)</option>
              <option value="Prevention of Money Laundering Act, 2002">PMLA, 2002</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Section Number
            </label>
            <input
              type="text"
              value={sectionNumber}
              onChange={(e) => setSectionNumber(e.target.value)}
              placeholder="e.g. 138 or 307"
              className="w-full bg-[#FAF8F3] border border-[#DDD5C7] rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-600"
            />
          </div>

          <div className="sm:col-span-4 flex items-end">
            <button
              type="submit"
              className="w-full px-4 py-2 rounded-xl bg-orange-800 hover:bg-orange-900 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Lookup Provision & Ratio</span>
            </button>
          </div>
        </form>

        {/* Statutory Details Display */}
        {activePreset && (
          <div className="space-y-6">
            {/* Act & Section Title */}
            <div className="bg-white border border-[#E0D8C8] rounded-2xl p-6 space-y-3 shadow-[0_2px_12px_rgba(44,39,30,0.04)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-900 border border-orange-200">
                  {activePreset.act}
                </span>
                <span className="text-xs text-slate-500 font-mono font-semibold">
                  {activePreset.bnsMapping}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 font-serif">
                Section {activePreset.section}: {activePreset.title}
              </h2>
            </div>

            {/* Essential Ingredients Checklist */}
            <div className="bg-white border border-[#E0D8C8] rounded-2xl p-6 space-y-3 shadow-[0_2px_12px_rgba(44,39,30,0.04)]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-orange-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Essential Statutory Ingredients (Burden of Proof)</span>
              </h3>
              <div className="space-y-2">
                {activePreset.ingredients.map((ing: string, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-orange-700 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{ing}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Judicial Precedents & Ratio Decidendi */}
            <div className="bg-white border border-[#E0D8C8] rounded-2xl p-6 space-y-4 shadow-[0_2px_12px_rgba(44,39,30,0.04)]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-2">
                <Scale className="w-4 h-4 text-indigo-700" />
                <span>Authoritative Precedents & Ratio Decidendi</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activePreset.leadingPrecedents.map((item: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl bg-[#FAF8F3] border border-[#DDD5C7] text-xs flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-bold text-indigo-900 mb-1 font-serif">{item.case}</h4>
                      <p className="text-slate-600 leading-relaxed text-[11px]">{item.ratio}</p>
                    </div>
                    <Link
                      href={`/legal/search?query=${encodeURIComponent(item.case)}`}
                      className="text-[11px] text-indigo-800 hover:text-indigo-950 font-bold flex items-center gap-1 self-start"
                    >
                      <span>Read Judgment in Hub</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Precedent Search CTA */}
            <div className="flex justify-end">
              <button
                onClick={() =>
                  router.push(
                    `/legal/search?query=${encodeURIComponent(
                      `${activePreset.act} Section ${activePreset.section} landmark judgments`
                    )}`
                  )
                }
                className="px-5 py-2.5 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <span>Find All Supreme Court Judgments on Section {activePreset.section}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
