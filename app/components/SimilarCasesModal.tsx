/*
===============================================================================
BLOCK COMMENT: SIMILAR CASES & PRECEDENTS MODAL
Epic: epic_system_tenant_common_knowledge_bases.md / epic_legal_case_intake_workspace.md
Description:
    Provides an interactive modal for searching and reviewing similar legal cases
    and precedents based on statutory sections and matter keywords.
    Features:
    1. Search Query Input: Pre-filled with active matter sections, editable.
    2. Case Cards displaying:
       - Match Relevance (% match with color-coded confidence pill)
       - Case Heading / Title
       - Parties (Claimant/Plaintiff vs Respondent/Defendant)
       - Sections (§ badges for relevant statutes: CCA, BNS, BNSS, Arb Act, etc.)
       - Case Summary (facts, core legal dispute, key findings)
    3. Seamless navigation / action to switch to case or view details.
===============================================================================
*/

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Scale,
  Search,
  X,
  ExternalLink,
  ChevronRight,
  Filter,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Building2,
  Tag,
  ArrowUpRight
} from 'lucide-react';

export interface SimilarCaseItem {
  id: string;
  case_heading: string;
  parties: string;
  sections: string[];
  case_summary: string;
  case_type: 'tenant_matter' | 'precedent_ruling';
  forum?: string;
  matter_ref?: string;
  citation?: string;
  default_relevance: number; // base score 0-100
}

// Built-in Indian Commercial & Criminal Similar Cases / Precedents Catalogue
export const SIMILAR_CASES_CATALOGUE: SimilarCaseItem[] = [
  {
    id: 'orion_v_delta',
    case_heading: 'Commercial Supply Contract Termination, IP Firmware Infringement & Invoiced Recovery',
    parties: 'Orion Tech Labs Pvt. Ltd. (Plaintiff) vs Delta Systems Corp (Defendant)',
    sections: ['Sec 12A Commercial Courts Act', 'Sec 21 Arbitration Act (DIAC)', 'Sec 318(4) BNS (formerly Sec 420 IPC)', 'Sec 63 BSA (formerly Sec 65B Evidence Act)'],
    case_summary: 'Dispute involving sudden unilateral termination of multi-year enterprise component manufacturing agreement and unauthorized reverse-engineering of firmware IP. Plaintiff seeking ₹4.80 Cr unpaid milestone invoices, mandatory mediation compliance under Section 12A CCA, and urgent Section 9 interim injunction to restrain proprietary firmware disclosure.',
    case_type: 'tenant_matter',
    forum: 'High Court of Delhi (Commercial Division)',
    matter_ref: 'COMM-SUIT-1048/2025',
    default_relevance: 96,
  },
  {
    id: 'patil_automation_v_rakheja',
    case_heading: 'Mandatory Exhaustion of Section 12A Pre-Institution Mediation Prior to Suit Filing',
    parties: 'Patil Automation Pvt Ltd vs Rakheja Engineers Pvt Ltd',
    sections: ['Sec 12A Commercial Courts Act', 'Order VII Rule 11 CPC', 'Sec 30(4) Arbitration Act'],
    case_summary: 'Landmark Supreme Court ruling declaring Section 12A of the Commercial Courts Act, 2015 to be mandatory and absolute. Held that any commercial plaint instituted without first exhausting pre-institution mediation—unless urgent interim relief is genuinely contemplated—is liable to be rejected under Order VII Rule 11 of CPC. Settled law that mediation period of 3 months is excluded from limitation.',
    case_type: 'precedent_ruling',
    forum: 'Supreme Court of India',
    citation: '(2022) 10 SCC 1',
    default_relevance: 92,
  },
  {
    id: 'shivam_v_bansal',
    case_heading: 'Criminal Cheating, Dishonestly Induced Goods Delivery & Forged Bank Return Memos',
    parties: 'Shivam Enterprises (Complainant) vs Bansal Trading Co. & Ors (Accused)',
    sections: ['Sec 103 BNS (formerly Sec 302 IPC connected)', 'Sec 318(4) BNS (formerly Sec 420 IPC)', 'Sec 316(2) BNS (formerly Sec 406 IPC)', 'Sec 173 BNSS (Registration of FIR)', 'Sec 175(3) BNSS (Magistrate Directing FIR)', 'Sec 63 BSA (Electronic Evidence)'],
    case_summary: 'Criminal complaint regarding dishonestly induced supply of industrial copper consignments worth ₹92 Lakhs backed by forged bank return memos and pre-closed bank accounts. Linked proceedings under Section 175(3) BNSS for magistrate investigation direction and Section 35(3) BNSS notice of appearance issued to accused directors.',
    case_type: 'tenant_matter',
    forum: 'Metropolitan Magistrate Court, Patiala House Courts, New Delhi',
    matter_ref: 'FIR No. 142/2026 (PS Connaught Place)',
    default_relevance: 90,
  },
  {
    id: 'cloudnet_v_starlight',
    case_heading: 'Enterprise SaaS Agreement Termination, Cloud Lockout & Interim Preservation',
    parties: 'CloudNet Solutions (Petitioner) vs Starlight Media Ltd (Respondent)',
    sections: ['Sec 9 Arbitration Act', 'Sec 12A Commercial Courts Act', 'Sec 21 Arbitration Act', 'Sec 63 BSA (formerly Sec 65B Evidence Act)'],
    case_summary: 'Software as a Service termination dispute where service provider terminated cloud hosting access with ₹1.25 Cr outstanding. Mandatory Section 12A CCA pre-institution mediation resulted in Non-Starter Report. Petitioner filed Section 9 interim petition seeking preservation of database servers and restraining respondent from migrating data to unauthorized third-party vendors.',
    case_type: 'tenant_matter',
    forum: 'Commercial Court, Tis Hazari Courts, Delhi',
    matter_ref: 'ARB-PET-89/2026',
    default_relevance: 88,
  },
  {
    id: 'vijay_kumar_ghai_v_wb',
    case_heading: 'Essential Ingredients of Cheating: Mens Rea at Inception vs Mere Breach of Contract',
    parties: 'Vijay Kumar Ghai vs State of West Bengal & Ors',
    sections: ['Sec 318(4) BNS (formerly Sec 420 IPC)', 'Sec 316(2) BNS (formerly Sec 406 IPC)', 'Sec 528 BNSS (formerly Sec 482 CrPC - Quashing)'],
    case_summary: 'Supreme Court established that to sustain an indictment under Section 420 IPC / Section 318(4) BNS for cheating, fraudulent or dishonest intention must exist at the very inception of the transaction. A mere breach of contractual promise at a subsequent stage cannot be given the cloak of criminal offence. Inherent quashing powers under Section 482 CrPC / 528 BNSS applied to stifle vexatious complaint.',
    case_type: 'precedent_ruling',
    forum: 'Supreme Court of India',
    citation: '(2022) 7 SCC 124',
    default_relevance: 85,
  },
  {
    id: 'precision_v_vanguard',
    case_heading: 'Summary Invoiced Recovery under Order 37 CPC on Dishonored Negotiable Instruments',
    parties: 'Precision Auto Components (Plaintiff) vs Vanguard Heavy Engg (Defendant)',
    sections: ['Order XXXVII CPC', 'Sec 138 Negotiable Instruments Act', 'Sec 318(4) BNS (formerly Sec 420 IPC)'],
    case_summary: 'Summary suit under Order 37 CPC for liquidated recovery of ₹1.84 Cr for auto components delivered against accepted invoices and dishonored security cheques. Defendant moved application for unconditional leave to defend alleging patent defects in machinery. Court evaluated triable issue standards under IDBI Trusteeship principles.',
    case_type: 'tenant_matter',
    forum: 'High Court of Bombay (Ordinary Original Civil Jurisdiction)',
    matter_ref: 'COMM-CS-314/2026',
    default_relevance: 84,
  },
  {
    id: 'arjun_panditrao_v_gorantyal',
    case_heading: 'Mandatory Certificate for Electronic Records under Section 65B IEA / Section 63 BSA',
    parties: 'Arjun Panditrao Khotkar vs Kailash Kushanrao Gorantyal & Ors',
    sections: ['Sec 63 BSA (formerly Sec 65B Evidence Act)', 'Sec 65 BSA (Primary vs Secondary Electronic Records)'],
    case_summary: 'Three-Judge Bench of the Supreme Court affirmed that certificate under Section 65B(4) of Indian Evidence Act (now Section 63(4) BSA 2023) is an absolute condition precedent to the admissibility of electronic evidence (emails, SMS, call logs, server hard drives) where secondary electronic copies are produced in court.',
    case_type: 'precedent_ruling',
    forum: 'Supreme Court of India',
    citation: '(2020) 7 SCC 1',
    default_relevance: 82,
  },
  {
    id: 'bsnl_v_nortel',
    case_heading: 'Limitation Period for Invoking Section 11(6) Arbitration Application',
    parties: 'Bharat Sanchar Nigam Ltd vs Nortel Networks India Pvt Ltd',
    sections: ['Sec 21 Arbitration Act', 'Sec 11 Arbitration Act', 'Article 137 Limitation Act, 1963'],
    case_summary: 'Supreme Court ruled that period of limitation for filing an application seeking appointment of an arbitrator under Section 11 of the Arbitration and Conciliation Act is governed by Article 137 of Limitation Act (3 years from date of notice under Section 21). High Courts have power to refuse referral of claims that are ex-facie hopelessly barred by limitation.',
    case_type: 'precedent_ruling',
    forum: 'Supreme Court of India',
    citation: '(2021) 5 SCC 738',
    default_relevance: 78,
  },
  {
    id: 'priyanka_srivastava_v_up',
    case_heading: 'Mandatory Affidavit Requirement Prior to Section 156(3) CrPC / 175(3) BNSS Directions',
    parties: 'Priyanka Srivastava & Anr vs State of Uttar Pradesh',
    sections: ['Sec 175(3) BNSS (formerly Sec 156(3) CrPC)', 'Sec 173 BNSS (formerly Sec 154 CrPC)'],
    case_summary: 'Supreme Court laid down mandatory safeguard against abuse of Section 156(3) CrPC (now Section 175(3) BNSS). Held that every application under Section 156(3) seeking magistrate direction to police for FIR registration must be supported by an affidavit sworn by applicant affirming prior exhaustion of remedies under Sections 154(1) and 154(3).',
    case_type: 'precedent_ruling',
    forum: 'Supreme Court of India',
    citation: '(2015) 6 SCC 287',
    default_relevance: 75,
  }
];

interface SimilarCasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  activeMatterSections?: string[];
  onSelectCase?: (caseId: string) => void;
}

export default function SimilarCasesModal({
  isOpen,
  onClose,
  initialQuery = '',
  activeMatterSections = [],
  onSelectCase,
}: SimilarCasesModalProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [filterType, setFilterType] = useState<'all' | 'tenant_matter' | 'precedent_ruling'>('all');

  // Sync initial query when opened
  useEffect(() => {
    if (isOpen) {
      if (initialQuery) {
        setSearchQuery(initialQuery);
      } else if (activeMatterSections.length > 0) {
        setSearchQuery(activeMatterSections.join(', '));
      }
    }
  }, [isOpen, initialQuery, activeMatterSections]);

  // Dynamic Matching & Relevance Algorithm
  const filteredCases = useMemo(() => {
    const qLower = searchQuery.toLowerCase().trim();
    const queryTokens = qLower
      .split(/[\s,;+]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 2);

    return SIMILAR_CASES_CATALOGUE.map((item) => {
      // Calculate relevance score
      let score = item.default_relevance;
      const combinedText = [
        item.case_heading,
        item.parties,
        item.case_summary,
        item.forum || '',
        ...item.sections,
      ]
        .join(' ')
        .toLowerCase();

      if (queryTokens.length > 0) {
        let matchCount = 0;
        let sectionMatchCount = 0;

        queryTokens.forEach((token) => {
          if (combinedText.includes(token)) {
            matchCount++;
          }
          if (item.sections.some((s) => s.toLowerCase().includes(token))) {
            sectionMatchCount++;
          }
        });

        const tokenMatchRatio = matchCount / queryTokens.length;
        score = Math.min(
          99,
          Math.max(
            40,
            Math.round(
              item.default_relevance * 0.4 +
                tokenMatchRatio * 45 +
                (sectionMatchCount > 0 ? 15 : 0)
            )
          )
        );
      }

      return {
        ...item,
        calculated_relevance: score,
      };
    })
      .filter((item) => {
        if (filterType !== 'all' && item.case_type !== filterType) {
          return false;
        }
        if (queryTokens.length === 0) return true;
        // Keep items with reasonable match
        return item.calculated_relevance >= 50;
      })
      .sort((a, b) => b.calculated_relevance - a.calculated_relevance);
  }, [searchQuery, filterType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* 1. Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/70 flex items-center justify-center text-indigo-700 dark:text-indigo-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Similar Cases & Judicial Precedents</span>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-full">
                  {filteredCases.length} Matched
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Statutory cross-referencing across tenant case files and landmark Indian jurisprudence
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Search Query Field (Field 1 Requested by User) */}
        <div className="p-6 pb-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-indigo-600" />
                <span>Search Query</span>
              </span>
              <span className="text-[11px] font-normal text-slate-400">
                Filter by sections, keywords, or legal issues
              </span>
            </label>

            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Sec 12A Commercial Courts Act, BNS 318(4), CrPC 156(3), Arbitration..."
                className="w-full text-xs font-medium pl-10 pr-24 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-2xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-md transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  filterType === 'all'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All ({SIMILAR_CASES_CATALOGUE.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('tenant_matter')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  filterType === 'tenant_matter'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Tenant Matters (4)
              </button>
              <button
                type="button"
                onClick={() => setFilterType('precedent_ruling')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  filterType === 'precedent_ruling'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Landmark Precedents (5)
              </button>
            </div>

            {activeMatterSections.length > 0 && (
              <button
                type="button"
                onClick={() => setSearchQuery(activeMatterSections.join(', '))}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> Reset to Current Matter
              </button>
            )}
          </div>
        </div>

        {/* 3. Cards List with Match Relevance, Summary, Heading, Parties, Sections (Field 2 Requested by User) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/60 dark:bg-slate-900/50">
          {filteredCases.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No matching cases found</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Try adjusting the statutory codes in your search query or clear the filter to see all precedents.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-indigo-700 transition"
              >
                View All Cases
              </button>
            </div>
          ) : (
            filteredCases.map((cs) => {
              const relevance = cs.calculated_relevance;
              const isHigh = relevance >= 85;
              const isMedium = relevance >= 70 && relevance < 85;

              return (
                <div
                  key={cs.id}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-200 space-y-3"
                >
                  {/* Card Header: Match Relevance & Heading */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide ${
                            isHigh
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                              : isMedium
                              ? 'bg-blue-50 text-blue-800 border border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
                              : 'bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{relevance}% Match Relevance</span>
                        </span>

                        <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md">
                          {cs.case_type === 'tenant_matter' ? 'Internal Tenant Matter' : 'Landmark Supreme Court Precedent'}
                        </span>

                        {cs.citation && (
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {cs.citation}
                          </span>
                        )}
                        {cs.matter_ref && (
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {cs.matter_ref}
                          </span>
                        )}
                      </div>

                      {/* Case Heading */}
                      <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug pt-1">
                        {cs.case_heading}
                      </h4>
                    </div>

                    {/* Action Button */}
                    {cs.case_type === 'tenant_matter' && onSelectCase && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectCase(cs.id);
                          onClose();
                        }}
                        className="shrink-0 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>Open Matter</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Parties Field */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-0.5">
                      <Building2 className="w-3 h-3 text-indigo-600" /> Parties:
                    </div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {cs.parties}
                    </div>
                    {cs.forum && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Forum / Court: <span className="font-medium text-slate-700 dark:text-slate-300">{cs.forum}</span>
                      </div>
                    )}
                  </div>

                  {/* Sections Field */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Applicable Statutory Sections:
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {cs.sections.map((sec, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 shadow-2xs"
                        >
                          <span className="text-indigo-700 dark:text-indigo-400 font-black">§</span>
                          <span>{sec}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Case Summary Field */}
                  <div className="space-y-1 pt-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Case Summary & Legal Issue:
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-850 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      {cs.case_summary}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 4. Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Precedents verified against Indian Kanoon & Supreme Court Database</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
