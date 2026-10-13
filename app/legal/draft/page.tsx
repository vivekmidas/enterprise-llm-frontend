/*
===============================================================================
BLOCK COMMENT: AI CONTRACT & DEED DRAFTER (LIGHT THEME)
Module: frontend/app/legal/draft/page.tsx
Description:
    - Interactive legal drafting engine for standard Indian and commercial agreements.
    - Generates Residential Rental Agreements, Sworn Affidavits, Mutual NDAs,
      Commercial Leases, and General Power of Attorney (GPA).
    - Warm parchment background (#FAF7F0) with crisp paper card styling,
      live clause customization, copy to clipboard, download, and workspace linkage.
===============================================================================
*/

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PenTool,
  ArrowLeft,
  Sparkles,
  Copy,
  Download,
  CheckCircle2,
  FileText,
  Building,
  Home,
  ShieldCheck,
  Scale,
  UserCheck,
  FolderPlus,
  RefreshCw,
  Sliders,
  Printer,
  ChevronRight,
} from 'lucide-react';

interface TemplateOption {
  id: string;
  category: 'Tenancy' | 'Affidavits' | 'Commercial' | 'Powers';
  title: string;
  description: string;
  badge: string;
  icon: any;
  defaultParty1Label: string;
  defaultParty2Label: string;
  hasRent: boolean;
  hasDeposit: boolean;
  hasDuration: boolean;
  hasProperty: boolean;
}

const TEMPLATES: TemplateOption[] = [
  {
    id: 'rental-agreement',
    category: 'Tenancy',
    title: 'Residential Rental Agreement',
    description: 'Standard 11-month lease agreement with security deposit, maintenance and notice clauses.',
    badge: '11-Month Tenancy',
    icon: Home,
    defaultParty1Label: 'Landlord / Lessor',
    defaultParty2Label: 'Tenant / Lessee',
    hasRent: true,
    hasDeposit: true,
    hasDuration: true,
    hasProperty: true,
  },
  {
    id: 'general-affidavit',
    category: 'Affidavits',
    title: 'General Sworn Affidavit',
    description: 'Formal sworn declaration under oath with statutory verification block before an Oath Commissioner.',
    badge: 'Sworn Oath',
    icon: Scale,
    defaultParty1Label: 'Deponent (Declarant)',
    defaultParty2Label: 'Attesting Authority / Public',
    hasRent: false,
    hasDeposit: false,
    hasDuration: false,
    hasProperty: false,
  },
  {
    id: 'mutual-nda',
    category: 'Commercial',
    title: 'Mutual Non-Disclosure Agreement',
    description: 'Comprehensive bilateral confidentiality deed safeguarding trade secrets and proprietary data.',
    badge: 'Confidentiality',
    icon: ShieldCheck,
    defaultParty1Label: 'First Party (Disclosing)',
    defaultParty2Label: 'Second Party (Receiving)',
    hasRent: false,
    hasDeposit: false,
    hasDuration: true,
    hasProperty: false,
  },
  {
    id: 'commercial-lease',
    category: 'Tenancy',
    title: 'Commercial Office Lease Agreement',
    description: 'Commercial tenancy covenants with lock-in period, GST provisions, fit-out rules, and arbitration.',
    badge: 'Commercial Property',
    icon: Building,
    defaultParty1Label: 'Lessor / Property Owner',
    defaultParty2Label: 'Lessee / Corporate Tenant',
    hasRent: true,
    hasDeposit: true,
    hasDuration: true,
    hasProperty: true,
  },
  {
    id: 'power-of-attorney',
    category: 'Powers',
    title: 'General Power of Attorney (GPA)',
    description: 'Authorizes attorney to manage properties, execute deeds, and represent principal before tribunals.',
    badge: 'Authority Deed',
    icon: UserCheck,
    defaultParty1Label: 'Principal (Grantor)',
    defaultParty2Label: 'Attorney / Agent (Grantee)',
    hasRent: false,
    hasDeposit: false,
    hasDuration: false,
    hasProperty: true,
  },
  {
    id: 'contractor-agreement',
    category: 'Commercial',
    title: 'Independent Contractor Agreement',
    description: 'Professional services contract with IP assignment, indemnity, milestones, and invoice terms.',
    badge: 'Work & IP Assignment',
    icon: FileText,
    defaultParty1Label: 'Client / Company',
    defaultParty2Label: 'Service Provider / Freelancer',
    hasRent: true,
    hasDeposit: false,
    hasDuration: true,
    hasProperty: false,
  },
];

export default function ContractDrafterPage() {
  const router = useRouter();

  // Template Selection
  const [selectedTemplateId, setSelectedTemplateId] = useState('rental-agreement');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Form State
  const [party1Name, setParty1Name] = useState('Rajesh Sharma');
  const [party1Father, setParty1Father] = useState('Late Shri O.P. Sharma');
  const [party1Address, setParty1Address] = useState('Flat 402, Royal Palms, Sector 54, Gurugram, Haryana - 122002');
  const [party1Id, setParty1Id] = useState('Aadhaar: XXXX-XXXX-4912');

  const [party2Name, setParty2Name] = useState('Ananya Sen');
  const [party2Father, setParty2Father] = useState('Shri Pradeep Sen');
  const [party2Address, setParty2Address] = useState('B-12, Green Park Extension, New Delhi - 110016');
  const [party2Id, setParty2Id] = useState('PAN: ABCPS1234D');

  const [propertyDesc, setPropertyDesc] = useState('Residential Apartment No. 301, Tower B, Silver Crest Heights, New Delhi - 110048');
  const [duration, setDuration] = useState('11 Months');
  const [considerationAmount, setConsiderationAmount] = useState('₹45,000 / month');
  const [securityDeposit, setSecurityDeposit] = useState('₹90,000 (Two Months Rent)');
  const [noticePeriod, setNoticePeriod] = useState('1 Month (30 Days)');
  const [jurisdictionCity, setJurisdictionCity] = useState('New Delhi');

  // Clauses toggles
  const [includeArbitration, setIncludeArbitration] = useState(true);
  const [includeLockIn, setIncludeLockIn] = useState(true);
  const [includeIndemnity, setIncludeIndemnity] = useState(true);
  const [includeStampNotice, setIncludeStampNotice] = useState(true);

  // Affidavit specific
  const [affidavitFacts, setAffidavitFacts] = useState(
    '1. That I am the absolute lawful owner and resident of the above premises.\n2. That all statutory property taxes and electricity dues have been settled up to current quarter.\n3. That no litigation or encumbrance is pending against the said property in any court of law.'
  );

  // Output State
  const [isDrafting, setIsDrafting] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [savedToWorkspace, setSavedToWorkspace] = useState(false);

  const currentTemplate = TEMPLATES.find((t) => t.id === selectedTemplateId) || TEMPLATES[0];

  const filteredTemplates =
    selectedCategory === 'All'
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === selectedCategory);

  const handleGenerateDraft = () => {
    setIsDrafting(true);
    setSavedToWorkspace(false);

    setTimeout(() => {
      setIsDrafting(false);
      let draftText = '';
      const today = new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      if (selectedTemplateId === 'rental-agreement') {
        draftText = `${includeStampNotice ? `[TO BE EXECUTED ON NON-JUDICIAL STAMP PAPER OF REQUISITE VALUE AS PER APPLICABLE STATE STAMP ACT]\n\n` : ''}RESIDENTIAL RENTAL AGREEMENT

THIS AGREEMENT OF LEASE is executed and entered into on this ${today} at ${jurisdictionCity}, India.

BY AND BETWEEN:

${party1Name.toUpperCase()}, son/daughter of ${party1Father}, residing at ${party1Address}, bearing ${party1Id} (hereinafter referred to as the "LESSOR / LANDLORD", which expression shall unless repugnant to the context include their legal heirs, executors, administrators, and assigns) of the FIRST PART;

AND

${party2Name.toUpperCase()}, son/daughter of ${party2Father}, residing at ${party2Address}, bearing ${party2Id} (hereinafter referred to as the "LESSEE / TENANT", which expression shall unless repugnant to the context include their successors and permitted assigns) of the SECOND PART.

WHEREAS the Lessor is the absolute and lawful owner of the demised premises situated at:
"${propertyDesc}".

AND WHEREAS at the request of the Lessee, the Lessor has agreed to let out, and the Lessee has agreed to take on tenancy the said demised premises for residential occupancy on the terms and conditions set forth hereinbelow:

NOW, THEREFORE, THIS INDENTURE WITNESSETH AS FOLLOWS:

1. TENANCY TERM & COMMENCEMENT:
   The tenancy shall be for a fixed term of ${duration}, commencing from ${today}, subject to renewal upon mutual written consent of both parties.

2. RENT & CONSIDERATION:
   The Lessee agrees to pay a monthly rent of ${considerationAmount}, payable in advance on or before the 7th day of each English calendar month directly into the bank account designated by the Lessor.

3. INTEREST-FREE REFUNDABLE SECURITY DEPOSIT:
   The Lessee has deposited a sum of ${securityDeposit} as interest-free refundable security deposit with the Lessor. The said deposit shall be refunded upon vacant handover of premises, subject to deductions for unpaid utilities or physical damages beyond normal wear and tear.

4. PERMITTED USE & COVENANTS:
   The premises shall be used exclusively for bona fide residential purposes. The Lessee shall not sublet, assign, or part with possession of the premises or any portion thereof without the express written permission of the Lessor.

${includeLockIn ? `5. LOCK-IN PERIOD & NOTICE:
   Both parties agree to a lock-in period of six (6) months from commencement. Thereafter, either party may terminate this agreement by serving ${noticePeriod} advance notice in writing, or rent in lieu thereof.\n\n` : ''}6. MAINTENANCE & STATUTORY DUES:
   The Lessee shall bear monthly electricity, piped gas, and water consumption charges as per actual meter readings. Regular day-to-day minor repairs shall be borne by the Lessee, while structural repairs shall be attended to by the Lessor.

${includeArbitration ? `7. DISPUTE RESOLUTION & ARBITRATION:
   Any dispute or difference arising out of or in connection with this agreement shall be referred to arbitration by a Sole Arbitrator appointed by mutual agreement under the Arbitration and Conciliation Act, 1996. The seat and venue of arbitration shall be ${jurisdictionCity}.\n\n` : ''}8. JURISDICTION:
   This Agreement shall be governed by the laws of India, and the Courts situated at ${jurisdictionCity} shall have exclusive territorial jurisdiction over any proceedings arising hereunder.

IN WITNESS WHEREOF, the Lessor and the Lessee have subscribed their hands and signatures hereto on the day, month, and year first above written.

_____________________________                    _____________________________
FIRST PARTY (LESSOR/LANDLORD)                    SECOND PARTY (LESSEE/TENANT)
Name: ${party1Name}                              Name: ${party2Name}

WITNESSES:

1. Signature: __________________                 2. Signature: __________________
   Name:                                            Name:
   Address:                                         Address:
`;
      } else if (selectedTemplateId === 'general-affidavit') {
        draftText = `${includeStampNotice ? `[BEFORE THE NOTARY PUBLIC / OATH COMMISSIONER AT ${jurisdictionCity.toUpperCase()}]\n[TO BE AFFIXED WITH NON-JUDICIAL STAMP DUTY / NOTARIAL STAMP]\n\n` : ''}GENERAL SWORN AFFIDAVIT

I, ${party1Name.toUpperCase()}, son/daughter of ${party1Father}, aged about ___ years, residing at ${party1Address}, bearing ${party1Id}, do hereby solemnly affirm, declare, and state on oath as under:

1. That I am a permanent and law-abiding citizen of India, competent to swear and depose this affidavit.

2. That the facts detailed herein are true, correct, and based on my personal knowledge and authentic records:
${affidavitFacts}

3. That this affidavit is executed and sworn by me bona fide to be submitted before the competent statutory authority, court of law, or financial institution for all lawful purposes and record.

4. That no material fact has been concealed, suppressed, or misrepresented herein.

                                                 _____________________________
                                                 DEPONENT (${party1Name.toUpperCase()})

VERIFICATION:
Verified at ${jurisdictionCity} on this ${today} that the contents of paragraphs 1 to 4 of the above affidavit are true and correct to the best of my knowledge and belief. No part of it is false and nothing material has been concealed therefrom.

                                                 _____________________________
                                                 DEPONENT

ATTESTED & SWORN BEFORE ME:
Identified by Counsel / Produced upon verification of Identity.

OATH COMMISSIONER / NOTARY PUBLIC
${jurisdictionCity}, India
`;
      } else if (selectedTemplateId === 'mutual-nda') {
        draftText = `${includeStampNotice ? `[NON-JUDICIAL STAMP PAPER]\n\n` : ''}MUTUAL NON-DISCLOSURE & CONFIDENTIALITY AGREEMENT

THIS MUTUAL NON-DISCLOSURE AGREEMENT ("Agreement") is executed on this ${today} at ${jurisdictionCity}, India.

BETWEEN:

${party1Name.toUpperCase()}, having its principal place of business / address at ${party1Address} (hereinafter referred to as the "FIRST PARTY");

AND

${party2Name.toUpperCase()}, having its principal place of business / address at ${party2Address} (hereinafter referred to as the "SECOND PARTY").

(The First Party and Second Party are hereinafter collectively referred to as "Parties" and individually as "Party").

1. PURPOSE & CONFIDENTIAL INFORMATION:
   The Parties desire to explore a business relationship and in connection therewith may disclose proprietary, commercial, financial, technical, or trade secret information ("Confidential Information").

2. NON-DISCLOSURE OBLIGATIONS:
   Each receiving party agrees to hold all Confidential Information of the disclosing party in strict confidence and shall not disclose, reproduce, or disseminate such information to any third party without prior written authorization.

3. TERM OF CONFIDENTIALITY:
   The obligations of confidentiality under this Agreement shall endure for a period of ${duration} from the date of disclosure.

${includeIndemnity ? `4. INDEMNIFICATION:
   The receiving party agrees to indemnify and hold harmless the disclosing party against all damages, losses, or costs arising from unauthorized disclosure of Confidential Information.\n\n` : ''}${includeArbitration ? `5. ARBITRATION & GOVERNING LAW:
   This Agreement shall be governed by Indian Law. Any dispute shall be resolved through binding arbitration under the Arbitration and Conciliation Act, 1996 seated at ${jurisdictionCity}.\n\n` : ''}IN WITNESS WHEREOF, the Parties have executed this Mutual NDA on the date set forth above.

_____________________________                    _____________________________
FIRST PARTY                                      SECOND PARTY
Name: ${party1Name}                              Name: ${party2Name}
`;
      } else {
        // Fallback generic commercial agreement
        draftText = `${includeStampNotice ? `[NON-JUDICIAL STAMP PAPER]\n\n` : ''}${currentTemplate.title.toUpperCase()}

THIS DEED is executed on this ${today} at ${jurisdictionCity}, India between:

1. ${party1Name.toUpperCase()} (First Party), residing/headquartered at ${party1Address}.
2. ${party2Name.toUpperCase()} (Second Party), residing/headquartered at ${party2Address}.

WHEREAS the First Party and Second Party mutually agree to enter into this legally binding arrangement for "${propertyDesc || currentTemplate.title}".

OPERATIVE COVENANTS:
1. Scope & Duration: Effective for ${duration} from execution date.
2. Consideration: Sum payable as ${considerationAmount}, with statutory compliance.
3. Applicable Law & Forum: Exclusively governed by Indian law and the courts at ${jurisdictionCity}.

IN WITNESS WHEREOF the Parties have set their hands hereto.

_____________________________                    _____________________________
FIRST PARTY: ${party1Name}                       SECOND PARTY: ${party2Name}
`;
      }

      setGeneratedDraft(draftText);
    }, 900);
  };

  const handleCopy = () => {
    if (!generatedDraft) return;
    navigator.clipboard.writeText(generatedDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedDraft) return;
    const blob = new Blob([generatedDraft], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentTemplate.title.replace(/\s+/g, '_')}_Draft.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveToCaseWorkspace = () => {
    if (!generatedDraft) return;
    try {
      const stored = localStorage.getItem('legal_case_workspaces');
      const list = stored ? JSON.parse(stored) : [];
      const newCase = {
        id: `case-${Date.now()}`,
        title: `${currentTemplate.title} - ${party1Name} vs ${party2Name}`,
        category: currentTemplate.category === 'Tenancy' ? 'Commercial Dispute' : 'Commercial Contract',
        court: `Jurisdiction: ${jurisdictionCity}`,
        parties: [party1Name, party2Name].filter(Boolean),
        files: [`${currentTemplate.title.replace(/\s+/g, '_')}_Executed_Draft.txt`],
        timeline: [
          { date: new Date().toLocaleDateString('en-GB'), text: `Legal draft generated for ${currentTemplate.title}.` },
        ],
        precedents: ['Indian Contract Act, 1872', 'Specific Relief Act, 1963'],
        summary: `Executed draft for ${currentTemplate.title} between ${party1Name} and ${party2Name}.`,
        updated_at: new Date().toISOString(),
      };
      const updated = [newCase, ...list];
      localStorage.setItem('legal_case_workspaces', JSON.stringify(updated));
      setSavedToWorkspace(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-slate-900 p-6 sm:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E0D8C8]">
          <div>
            <Link
              href="/legal"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-950 mb-2 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to AI Hub</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
                <PenTool className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 font-serif">
                  AI Contract & Deed Drafter
                </h1>
                <p className="text-xs text-slate-600">
                  Generate enforceable rental agreements, sworn affidavits, NDAs, leases & powers of attorney
                </p>
              </div>
            </div>
          </div>

          {/* Template Category Filters */}
          <div className="flex flex-wrap items-center gap-1.5 bg-white border border-[#DDD5C7] rounded-xl p-1 text-xs">
            {['All', 'Tenancy', 'Affidavits', 'Commercial', 'Powers'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-800 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Template Selector Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredTemplates.map((tmpl) => {
            const Icon = tmpl.icon;
            const isSelected = selectedTemplateId === tmpl.id;
            return (
              <div
                key={tmpl.id}
                onClick={() => {
                  setSelectedTemplateId(tmpl.id);
                  setGeneratedDraft('');
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                  isSelected
                    ? 'bg-white border-amber-600 shadow-[0_4px_16px_rgba(217,119,6,0.12)] ring-1 ring-amber-600'
                    : 'bg-white/80 border-[#E0D8C8] hover:border-slate-400 hover:bg-white shadow-[0_2px_8px_rgba(44,39,30,0.03)]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-[#FAF8F3] text-slate-700 border border-[#DDD5C7]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF8F3] border border-[#DDD5C7] text-slate-700">
                      {tmpl.badge}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">{tmpl.title}</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                    {tmpl.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#EDE7DB] flex items-center justify-between text-[11px] font-bold text-amber-800">
                  <span>{isSelected ? 'Selected' : 'Use Template'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* 2-Column Split: Customization Form (Left) + Live Draft Output (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-[#E0D8C8] rounded-2xl p-5 shadow-[0_2px_12px_rgba(44,39,30,0.04)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EDE7DB]">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-800" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Drafting Parameters: {currentTemplate.title}
                  </h2>
                </div>
              </div>

              {/* First Party */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold text-amber-900 uppercase">
                  {currentTemplate.defaultParty1Label}
                </span>
                <input
                  type="text"
                  value={party1Name}
                  onChange={(e) => setParty1Name(e.target.value)}
                  placeholder="Full Legal Name"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F3] border border-[#DDD5C7] text-xs text-slate-900 focus:outline-none focus:border-amber-600"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={party1Father}
                    onChange={(e) => setParty1Father(e.target.value)}
                    placeholder="Son/Daughter/Spouse of"
                    className="w-full px-3 py-1.5 rounded-lg bg-[#FAF8F3] border border-[#DDD5C7] text-[11px] text-slate-800 focus:outline-none focus:border-amber-600"
                  />
                  <input
                    type="text"
                    value={party1Id}
                    onChange={(e) => setParty1Id(e.target.value)}
                    placeholder="Aadhaar / PAN / ID"
                    className="w-full px-3 py-1.5 rounded-lg bg-[#FAF8F3] border border-[#DDD5C7] text-[11px] text-slate-800 focus:outline-none focus:border-amber-600"
                  />
                </div>
                <textarea
                  rows={2}
                  value={party1Address}
                  onChange={(e) => setParty1Address(e.target.value)}
                  placeholder="Full Residential or Registered Address"
                  className="w-full px-3 py-1.5 rounded-lg bg-[#FAF8F3] border border-[#DDD5C7] text-[11px] text-slate-800 focus:outline-none focus:border-amber-600"
                />
              </div>

              {/* Second Party (if not affidavit) */}
              {selectedTemplateId !== 'general-affidavit' && (
                <div className="space-y-2.5 pt-3 border-t border-[#EDE7DB]">
                  <span className="text-[11px] font-bold text-amber-900 uppercase">
                    {currentTemplate.defaultParty2Label}
                  </span>
                  <input
                    type="text"
                    value={party2Name}
                    onChange={(e) => setParty2Name(e.target.value)}
                    placeholder="Full Legal Name"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F3] border border-[#DDD5C7] text-xs text-slate-900 focus:outline-none focus:border-amber-600"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={party2Father}
                      onChange={(e) => setParty2Father(e.target.value)}
                      placeholder="Son/Daughter/Spouse of"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#FAF8F3] border border-[#DDD5C7] text-[11px] text-slate-800 focus:outline-none focus:border-amber-600"
                    />
                    <input
                      type="text"
                      value={party2Id}
                      onChange={(e) => setParty2Id(e.target.value)}
                      placeholder="Aadhaar / PAN / ID"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#FAF8F3] border border-[#DDD5C7] text-[11px] text-slate-800 focus:outline-none focus:border-amber-600"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={party2Address}
                    onChange={(e) => setParty2Address(e.target.value)}
                    placeholder="Full Residential or Registered Address"
                    className="w-full px-3 py-1.5 rounded-lg bg-[#FAF8F3] border border-[#DDD5C7] text-[11px] text-slate-800 focus:outline-none focus:border-amber-600"
                  />
                </div>
              )}

              {/* Specific terms based on template */}
              <div className="space-y-2.5 pt-3 border-t border-[#EDE7DB]">
                <span className="text-[11px] font-bold text-slate-700 uppercase">
                  Terms & Jurisdiction
                </span>

                {currentTemplate.hasProperty && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Property / Demised Premises Description
                    </label>
                    <textarea
                      rows={2}
                      value={propertyDesc}
                      onChange={(e) => setPropertyDesc(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#FAF8F3] border border-[#DDD5C7] text-xs text-slate-800 focus:outline-none focus:border-amber-600"
                    />
                  </div>
                )}

                {selectedTemplateId === 'general-affidavit' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Numbered Sworn Statements / Deposition Points
                    </label>
                    <textarea
                      rows={4}
                      value={affidavitFacts}
                      onChange={(e) => setAffidavitFacts(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#FAF8F3] border border-[#DDD5C7] text-xs text-slate-800 focus:outline-none focus:border-amber-600 font-mono"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {currentTemplate.hasDuration && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Tenure / Term</label>
                      <input
                        type="text"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-[#FAF8F3] border border-[#DDD5C7] text-xs text-slate-800 focus:outline-none focus:border-amber-600"
                      />
                    </div>
                  )}

                  {currentTemplate.hasRent && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Monthly Consideration</label>
                      <input
                        type="text"
                        value={considerationAmount}
                        onChange={(e) => setConsiderationAmount(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-[#FAF8F3] border border-[#DDD5C7] text-xs text-slate-800 focus:outline-none focus:border-amber-600"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {currentTemplate.hasDeposit && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Security Deposit</label>
                      <input
                        type="text"
                        value={securityDeposit}
                        onChange={(e) => setSecurityDeposit(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-[#FAF8F3] border border-[#DDD5C7] text-xs text-slate-800 focus:outline-none focus:border-amber-600"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Forum / City Jurisdiction</label>
                    <input
                      type="text"
                      value={jurisdictionCity}
                      onChange={(e) => setJurisdictionCity(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#FAF8F3] border border-[#DDD5C7] text-xs text-slate-800 focus:outline-none focus:border-amber-600"
                    />
                  </div>
                </div>

                {/* Optional Clauses */}
                <div className="space-y-1.5 pt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeStampNotice}
                      onChange={(e) => setIncludeStampNotice(e.target.checked)}
                      className="rounded text-amber-800 focus:ring-amber-600"
                    />
                    <span>Include Non-Judicial Stamp Paper Notice</span>
                  </label>

                  {selectedTemplateId !== 'general-affidavit' && (
                    <>
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeArbitration}
                          onChange={(e) => setIncludeArbitration(e.target.checked)}
                          className="rounded text-amber-800 focus:ring-amber-600"
                        />
                        <span>Arbitration & Conciliation Act 1996 clause</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeLockIn}
                          onChange={(e) => setIncludeLockIn(e.target.checked)}
                          className="rounded text-amber-800 focus:ring-amber-600"
                        />
                        <span>Enforce 6-Month Lock-in Period</span>
                      </label>
                    </>
                  )}
                </div>
              </div>

              {/* Generate Draft Button */}
              <button
                type="button"
                onClick={handleGenerateDraft}
                disabled={isDrafting}
                className="w-full py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isDrafting ? 'AI Drafting Enforceable Deed...' : 'Draft Legal Document Now'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live Draft Preview (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-[#E0D8C8] rounded-2xl p-6 shadow-[0_2px_12px_rgba(44,39,30,0.04)] flex flex-col min-h-[560px]">
              {/* Output Actions Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EDE7DB]">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-800" />
                  <span className="text-xs font-bold text-slate-800">
                    {generatedDraft ? 'Live Enforceable Draft' : 'Draft Preview Output'}
                  </span>
                </div>

                {generatedDraft && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="px-3 py-1.5 rounded-lg bg-[#FAF8F3] border border-[#DDD5C7] hover:bg-[#F0ECE0] text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownload}
                      className="px-3 py-1.5 rounded-lg bg-[#FAF8F3] border border-[#DDD5C7] hover:bg-[#F0ECE0] text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveToCaseWorkspace}
                      className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 text-xs font-bold text-amber-900 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FolderPlus className="w-3.5 h-3.5 text-amber-800" />
                      <span>{savedToWorkspace ? 'Saved to Cases!' : 'Link to Case'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Draft Viewer Paper Area */}
              <div className="flex-1 py-4">
                {isDrafting ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                    <div className="w-10 h-10 border-3 border-amber-700 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-bold text-slate-800">
                      Compiling Statutory Clauses & Jurisdiction Rules...
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-sm">
                      Applying Indian Stamp Act notices, dispute resolution mechanics, and parties recital covenants.
                    </p>
                  </div>
                ) : generatedDraft ? (
                  <div className="relative">
                    <textarea
                      value={generatedDraft}
                      onChange={(e) => setGeneratedDraft(e.target.value)}
                      className="w-full h-[520px] p-5 rounded-xl bg-[#FAF8F3] border border-[#E0D8C8] text-xs text-slate-900 font-mono leading-relaxed resize-none focus:outline-none focus:border-amber-700 shadow-inner"
                    />
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Live editor: You can directly tweak any text or covenant above.</span>
                      <span>{generatedDraft.split(/\s+/).length} words</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-12 text-slate-400 space-y-3">
                    <PenTool className="w-10 h-10 text-slate-300" />
                    <p className="text-xs font-bold text-slate-600">
                      No draft compiled yet
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-sm">
                      Select your template, configure the party details on the left, and click "Draft Legal Document Now" to generate an enforceable draft.
                    </p>
                    <button
                      type="button"
                      onClick={handleGenerateDraft}
                      className="mt-2 px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                    >
                      Quick Draft with Defaults
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
