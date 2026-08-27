/*
===============================================================================
BLOCK COMMENT: LEGAL PILOT - FULLY INTERACTIVE WORKSPACE WITH READY RECKONER & DOC DRAWER
Module: frontend/app/autopilot/page.tsx
Description:
    - Requirement 1: Section CTAs (Add / Edit / Delete Parties and their roles).
    - Requirement 2: Document management + Click on document opens Slide-Over Extracted Details Drawer.
    - Requirement 3: Relevant statutory sections in Header + 2-Tab Ready Reckoner (Summary vs Verbatim Bare Act).
===============================================================================
*/

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Scale,
  ShieldCheck,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2,
  Upload,
  FolderKanban,
  BookOpen,
  GitBranch,
  FileCheck,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Copy,
  Download,
  Check,
  Layers,
  FileSearch,
  Building2,
  Users,
  Edit3,
  Trash2,
  FileCode,
  BookMarked,
  Info,
  Zap,
} from 'lucide-react';
import {
  ALL_MATTERS,
  MatterCase,
  CaseGap,
  CaseParty,
  UploadedDoc,
  StatutoryReadyReckoner,
  HistoricalPrecedent,
  generateDraftDocument,
} from './mock_autopilot_data';

export default function LegalPilotInteractiveWorkspacePage() {
  // Active Case State
  const [selectedCaseCode, setSelectedCaseCode] = useState<string>('orion_v_delta');
  const [activeMatter, setActiveMatter] = useState<MatterCase>(ALL_MATTERS['orion_v_delta']);

  // Accordion Step Expansion State
  const [openStages, setOpenStages] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: false,
    4: true, // Gap Analysis default open (Star feature)
    5: false,
  });

  // Selected Item Drawers & Modals
  const [selectedReckoner, setSelectedReckoner] = useState<StatutoryReadyReckoner | null>(null);
  const [reckonerTab, setReckonerTab] = useState<'summary' | 'bare_act'>('summary');

  const [selectedDocForDrawer, setSelectedDocForDrawer] = useState<UploadedDoc | null>(null);

  // Party Management Modal State
  const [showPartyModal, setShowPartyModal] = useState<boolean>(false);
  const [editingPartyId, setEditingPartyId] = useState<string | null>(null);
  const [partyName, setPartyName] = useState<string>('');
  const [partyRole, setPartyRole] = useState<CaseParty['role']>('Claimant / Creditor');
  const [partyType, setPartyType] = useState<CaseParty['entity_type']>('Private Limited Company');
  const [partyAddress, setPartyAddress] = useState<string>('');
  const [partyContact, setPartyContact] = useState<string>('');

  // Modals State
  const [showAddEvidenceModal, setShowAddEvidenceModal] = useState<boolean>(false);
  const [evidenceTextInput, setEvidenceTextInput] = useState<string>('');
  const [evidenceDocInput, setEvidenceDocInput] = useState<string>('');

  const [showNewCaseModal, setShowNewCaseModal] = useState<boolean>(false);
  const [newCaseTitle, setNewCaseTitle] = useState<string>('');
  const [newCaseCourt, setNewCaseCourt] = useState<string>('Commercial Court, Delhi');
  const [newCaseClaim, setNewCaseClaim] = useState<string>('₹75,00,000');
  const [newCaseClaimant, setNewCaseClaimant] = useState<string>('');
  const [newCaseRespondent, setNewCaseRespondent] = useState<string>('');

  const [showDraftModal, setShowDraftModal] = useState<boolean>(false);
  const [currentDraft, setCurrentDraft] = useState<{ title: string; content: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Toggle Accordion Stage
  const toggleStage = (stageNum: number) => {
    setOpenStages((prev) => ({ ...prev, [stageNum]: !prev[stageNum] }));
  };

  // Switch Case
  const handleSwitchCase = (code: string) => {
    setSelectedCaseCode(code);
    const freshMatter = JSON.parse(JSON.stringify(ALL_MATTERS[code]));
    setActiveMatter(freshMatter);
    setOpenStages({ 1: true, 2: true, 3: false, 4: true, 5: false });
    triggerToast(`Loaded: ${freshMatter.case_title}`);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // =========================================================================
  // PARTY MANAGEMENT HANDLERS (Requirement 1: Add / Edit / Delete Parties)
  // =========================================================================
  const handleOpenAddParty = () => {
    setEditingPartyId(null);
    setPartyName('');
    setPartyRole('Claimant / Creditor');
    setPartyType('Private Limited Company');
    setPartyAddress('');
    setPartyContact('');
    setShowPartyModal(true);
  };

  const handleOpenEditParty = (party: CaseParty) => {
    setEditingPartyId(party.id);
    setPartyName(party.name);
    setPartyRole(party.role);
    setPartyType(party.entity_type);
    setPartyAddress(party.address);
    setPartyContact(party.contact_person || '');
    setShowPartyModal(true);
  };

  const handleSaveParty = () => {
    if (!partyName.trim()) {
      triggerToast('Please provide a party name');
      return;
    }

    const updated = { ...activeMatter };
    if (editingPartyId) {
      // Edit existing
      updated.parties = updated.parties.map((p) =>
        p.id === editingPartyId
          ? {
              ...p,
              name: partyName.trim(),
              role: partyRole,
              entity_type: partyType,
              address: partyAddress.trim(),
              contact_person: partyContact.trim(),
            }
          : p
      );
      triggerToast('Party details updated.');
    } else {
      // Add new
      updated.parties.push({
        id: `party_${Date.now()}`,
        name: partyName.trim(),
        role: partyRole,
        entity_type: partyType,
        address: partyAddress.trim(),
        contact_person: partyContact.trim(),
      });
      triggerToast('Added new party to case.');
    }

    setActiveMatter(updated);
    setShowPartyModal(false);
  };

  const handleDeleteParty = (partyId: string) => {
    const updated = { ...activeMatter };
    updated.parties = updated.parties.filter((p) => p.id !== partyId);
    setActiveMatter(updated);
    triggerToast('Party removed from case.');
  };

  // Delete Document
  const handleDeleteDocument = (docId: string) => {
    const updated = { ...activeMatter };
    updated.documents = updated.documents.filter((d) => d.id !== docId);
    setActiveMatter(updated);
    setSelectedDocForDrawer(null);
    triggerToast('Document removed from evidence vault.');
  };

  // Create New Case
  const handleCreateNewCase = () => {
    if (!newCaseTitle.trim()) {
      triggerToast('Please provide a matter title');
      return;
    }

    const created: MatterCase = {
      id: `case_${Date.now()}`,
      case_code: `custom_${Date.now()}` as any,
      case_title: newCaseTitle.trim(),
      case_subtitle: `${newCaseCourt} · Newly created intake workspace`,
      court_forum: newCaseCourt,
      claim_amount: newCaseClaim || '₹50,00,000',
      matter_status: 'Initial intake',
      evidence_completeness: 45,
      open_gaps_count: 2,
      last_reviewed: 'Just now',
      parties: [
        {
          id: `p_init_1`,
          name: newCaseClaimant || 'Client Manufacturing Pvt Ltd',
          role: 'Claimant / Creditor',
          entity_type: 'Private Limited Company',
          address: 'Industrial Area, New Delhi',
        },
        {
          id: `p_init_2`,
          name: newCaseRespondent || 'Debtor Infrastructure LLP',
          role: 'Respondent / Debtor',
          entity_type: 'LLP',
          address: 'Cyber Hub, Gurugram',
        },
      ],
      statutory_sections: activeMatter.statutory_sections,
      documents: [
        {
          id: `doc_init_1`,
          filename: 'Commercial_Contract_Executed.pdf',
          doc_type: 'Agreement',
          pages: 14,
          date: 'Today',
          file_size: '1.2 MB',
          status: 'Parsed',
          extracted_clauses: [
            {
              clause_number: 'Clause 5',
              clause_title: 'Payment Terms',
              extracted_snippet: 'Payment due within 30 days of invoice.',
              legal_impact: '30-day default timeline.',
            },
          ],
        },
      ],
      timeline: [
        {
          id: `tl_init_1`,
          date: 'Today',
          title: 'Case File Created & Initial Intake Logged',
          description: `Matter created by advocate for ${newCaseClaimant || 'Client'} vs ${newCaseRespondent || 'Debtor'}.`,
          source: { title: 'Intake Record', doc_name: 'Intake Dossier', date: 'Today' },
        },
      ],
      facts: [
        {
          id: `fact_c_1`,
          label: 'Total Liquid Claim',
          value: newCaseClaim || '₹50,00,000',
          category: 'Financial',
          source: { title: 'Invoices Statement', doc_name: 'Ledger Extract' },
          verified: true,
        },
      ],
      gaps: [
        {
          id: `gap_init_1`,
          title: 'Mandatory Section 12A Pre-Institution Mediation Notice',
          category: 'Procedural / Notice',
          severity: 'High',
          status: 'Open',
          plain_english_explanation:
            'Prior to filing in Commercial Court, Section 12A mediation must be initiated before DSLSA per Patil Automation.',
          statutory_or_clause_ref: 'Section 12A, Commercial Courts Act 2015',
          source: { title: 'Statutory Procedure', doc_name: 'Commercial Courts Act' },
          suggested_fix: 'Generate Form 1 application for mediation before Legal Services Authority.',
          remedial_cta_label: 'Generate Section 12A Form 1',
          remedial_cta_action_type: 'draft_notice',
          remedial_target_template: 'draft_sec12a_form1',
        },
      ],
      actions: activeMatter.actions,
      precedents: activeMatter.precedents,
      sample_enrichment_text: 'Debtor sent email acknowledging dues and proposing payment in installments.',
      sample_enrichment_doc_name: 'Debtor_Email_Acknowledgment.pdf',
    };

    setActiveMatter(created);
    setShowNewCaseModal(false);
    setOpenStages({ 1: true, 2: true, 3: true, 4: true, 5: true });
    triggerToast(`Created new case: ${created.case_title}`);
  };

  // Apply Evidence (Dynamic Enrichment)
  const handleApplyEvidence = () => {
    if (!evidenceTextInput.trim() && !evidenceDocInput.trim()) {
      triggerToast('Please provide a note or document name');
      return;
    }

    const updated = JSON.parse(JSON.stringify(activeMatter)) as MatterCase;

    // Add document
    if (evidenceDocInput.trim()) {
      updated.documents.push({
        id: `doc_supp_${Date.now()}`,
        filename: evidenceDocInput.trim().endsWith('.pdf') ? evidenceDocInput.trim() : `${evidenceDocInput.trim()}.pdf`,
        doc_type: 'Supplemental Evidence (Added)',
        pages: 3,
        date: 'Today',
        file_size: '340 KB',
        status: 'Supplemental',
        extracted_clauses: [
          {
            clause_number: 'Admission Entry',
            clause_title: 'Unconditional Acknowledgment',
            extracted_snippet: evidenceTextInput.trim(),
            legal_impact: 'Section 18 Limitation Act debt acknowledgment.',
          },
        ],
      });
    }

    // Add Timeline Entry
    updated.timeline.push({
      id: `tl_supp_${Date.now()}`,
      date: '24 Feb 2026',
      title: 'Supplemental Admission Received',
      description: evidenceTextInput.trim().slice(0, 140) + '...',
      source: {
        title: evidenceDocInput.trim() || 'WhatsApp Communication Record',
        doc_name: evidenceDocInput.trim() || 'WhatsApp_Chat_Export.pdf',
        date: '24 Feb 2026',
      },
    });

    // Close top gaps
    if (updated.gaps.length > 0) {
      updated.gaps[0].status = 'Closed';
      updated.gaps[0].resolution_note = 'Resolved: Acknowledgment confirms liability under Section 18 Limitation Act.';
    }
    if (updated.gaps.length > 1 && updated.case_code === 'orion_v_delta') {
      updated.gaps[1].status = 'Closed';
      updated.gaps[1].resolution_note = 'Resolved: Defect waiver confirmed by debtor communication.';
    }

    updated.open_gaps_count = updated.gaps.filter((g) => g.status === 'Open').length;
    updated.evidence_completeness = Math.min(98, updated.evidence_completeness + 14);
    updated.matter_status = 'Post-enrichment review';
    updated.last_reviewed = 'Just now';
    updated.enrichment_applied = true;

    setActiveMatter(updated);
    setShowAddEvidenceModal(false);
    triggerToast('Evidence processed! Gaps updated.');
  };

  // Remedial CTA Trigger on a Gap
  const handleRemedialCTA = (gap: CaseGap) => {
    if (gap.remedial_cta_action_type === 'upload_doc') {
      setEvidenceDocInput('Joint_Laboratory_Test_Report_NABL.pdf');
      setEvidenceTextInput('Certified joint NABL laboratory tensile test report confirming compliance with Grade Fe 500D specifications.');
      setShowAddEvidenceModal(true);
    } else if (gap.remedial_cta_action_type === 'draft_notice') {
      const template = gap.remedial_target_template || 'draft_sec21_arbitration';
      const draft = generateDraftDocument(template, activeMatter);
      setCurrentDraft(draft);
      setShowDraftModal(true);
    } else {
      triggerToast(`Action triggered: ${gap.remedial_cta_label}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      {/* --------------------------------------------------------------------- */}
      {/* 1. TOP GLOBAL BAR */}
      {/* --------------------------------------------------------------------- */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-900 text-white flex items-center justify-center font-bold shadow-xs">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900 tracking-tight">Legal Pilot</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                DEMO MODE
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Commercial Case & Statutory Ready Reckoner Workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>No authentication required for this mockup</span>
          </div>

          <Link
            href="/legal"
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition shadow-2xs"
          >
            Exit demo
          </Link>
        </div>
      </header>

      {/* --------------------------------------------------------------------- */}
      {/* 2. BODY LAYOUT: 1ST PANEL (LEFT DOSSIER & TIMELINE) + MAIN ACCORDION */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col lg:flex-row items-start">
        {/* =================================================================== */}
        {/* 1ST PANEL / LEFT SIDEBAR: CASE SELECTOR, EVIDENCE VAULT & TIMELINE */}
        {/* =================================================================== */}
        <aside className="w-full lg:w-80 bg-white border-r border-slate-200 p-5 space-y-6 shrink-0 lg:sticky lg:top-14 lg:h-[calc(100vh-57px)] overflow-y-auto">
          {/* Case File Selector & "+ New Case" */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Active Matter File
              </span>
              <button
                onClick={() => setShowNewCaseModal(true)}
                className="text-[11px] font-extrabold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Case</span>
              </button>
            </div>

            <div className="relative">
              <select
                value={selectedCaseCode}
                onChange={(e) => handleSwitchCase(e.target.value)}
                className="w-full text-xs font-black p-3 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-indigo-950 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
              >
                <option value="orion_v_delta">1. Orion v. Delta (₹1.85 Cr Supply Dispute)</option>
                <option value="cloudnet_v_starlight">2. CloudNet v. Starlight (₹65L Service Termination)</option>
                <option value="precision_v_vanguard">3. Precision Flow v. Vanguard (₹42L Summary Debt)</option>
                <option value="shivam_v_bansal">4. State (Shivam Polymers) v. Bansal (₹92L Criminal Cheating & NI 138)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3.5 pointer-events-none" />
            </div>
          </div>

          {/* Evidence Vault Documents List (Requirement 2: Click to view details in pull out drawer) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-700" />
                Evidence Vault ({activeMatter.documents.length})
              </span>
              <button
                onClick={() => {
                  setEvidenceDocInput('Additional_Consignment_Invoice.pdf');
                  setShowAddEvidenceModal(true);
                }}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                + Upload
              </button>
            </div>

            <div className="space-y-2">
              {activeMatter.documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocForDrawer(doc)}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-indigo-50/50 hover:border-indigo-200 transition text-xs flex items-start gap-2 cursor-pointer group"
                >
                  <FileSearch className="w-3.5 h-3.5 text-indigo-700 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 group-hover:text-indigo-900 truncate">
                      {doc.filename}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span>{doc.doc_type}</span>
                      <span>•</span>
                      <span>{doc.pages}p</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition">
                    View
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Left Panel Chronological Case Timeline View */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-700" />
                Case Timeline ({activeMatter.timeline.length})
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Chronological</span>
            </div>

            <div className="space-y-3 relative pl-3 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {activeMatter.timeline.map((event) => (
                <div key={event.id} className="relative pl-3 text-xs">
                  <div className="absolute -left-[14px] top-1.5 w-2 h-2 rounded-full bg-indigo-700 ring-4 ring-white"></div>
                  <div className="font-black text-[11px] text-indigo-900">{event.date}</div>
                  <div className="font-bold text-slate-900 mt-0.5 leading-snug">{event.title}</div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">{event.description}</p>
                  <div className="mt-1 text-[10px] text-slate-400 font-mono truncate">
                    Source: {event.source.doc_name} ({event.source.page_or_clause || event.source.date})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* =================================================================== */}
        {/* MAIN WORKSPACE: FULL WIDTH HEADER + 4 METRIC CARDS + ACCORDION */}
        {/* =================================================================== */}
        <main className="flex-1 p-6 lg:p-8 w-full space-y-6">
          {/* Breadcrumb & Title Section with Right Action */}
          <div className="w-full space-y-3 pb-1 border-b border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                  <span>Matters</span>
                  <span>›</span>
                  <span className="text-slate-900 font-bold">{activeMatter.matter_status}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-indigo-950 tracking-tight">
                  {activeMatter.case_title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600">{activeMatter.case_subtitle}</p>
              </div>

              <button
                onClick={() => {
                  setEvidenceTextInput(activeMatter.sample_enrichment_text);
                  setEvidenceDocInput(activeMatter.sample_enrichment_doc_name);
                  setShowAddEvidenceModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white font-extrabold text-xs flex items-center gap-2 transition shadow-sm self-start sm:self-center cursor-pointer shrink-0"
              >
                <Upload className="w-4 h-4 text-indigo-300" />
                <span>Add evidence</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-800 text-indigo-200">Demo</span>
              </button>
            </div>

            {/* Clickable Ready Reckoner Section Pills (Full width without label) */}
            <div className="pt-1 flex items-center gap-2 flex-wrap w-full">
              {activeMatter.statutory_sections.map((reck) => (
                <button
                  key={reck.section_code}
                  onClick={() => {
                    setSelectedReckoner(reck);
                    setReckonerTab('summary');
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-indigo-50/80 hover:bg-indigo-100 text-indigo-950 border border-indigo-200/80 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <span className="text-indigo-700 font-black">§</span>
                  <span>{reck.short_label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4 Clickable Top Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => toggleStage(1)}
              className="p-4 rounded-2xl border border-slate-200 bg-white transition shadow-2xs hover:border-indigo-300 cursor-pointer"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold">Matter status</span>
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-base font-black text-indigo-950 mt-2 capitalize">{activeMatter.matter_status}</div>
            </div>

            <div
              onClick={() => toggleStage(2)}
              className="p-4 rounded-2xl border border-slate-200 bg-white transition shadow-2xs hover:border-indigo-300 cursor-pointer"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold">Evidence completeness</span>
                <FileText className="w-4 h-4" />
              </div>
              <div className="text-base font-black text-indigo-950 mt-2">{activeMatter.evidence_completeness}%</div>
            </div>

            <div
              onClick={() => toggleStage(4)}
              className="p-4 rounded-2xl border border-slate-200 bg-white transition shadow-2xs hover:border-indigo-300 cursor-pointer"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold">Open gaps</span>
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="text-base font-black text-indigo-950 mt-2">{activeMatter.open_gaps_count} items</div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold">Last reviewed</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-base font-black text-indigo-950 mt-2">{activeMatter.last_reviewed}</div>
            </div>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* STAGE-WISE ACCORDION FLOW (STAGES 1 TO 5) */}
          {/* ----------------------------------------------------------------- */}
          <div className="space-y-4">
            {/* =============================================================== */}
            {/* STAGE 1: CASE INTAKE, PARTIES (WITH ADD/EDIT/DELETE CTAS) */}
            {/* =============================================================== */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <button
                onClick={() => toggleStage(1)}
                className="w-full p-4.5 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-900 flex items-center justify-center font-black text-xs">
                    1
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-indigo-950">
                      Stage 1: Case Details, Parties Involved & Roles ({activeMatter.parties.length} Parties)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Manage claimant, respondent, guarantors, witnesses, and jurisdiction forum.
                    </p>
                  </div>
                </div>
                {openStages[1] ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>

              {openStages[1] && (
                <div className="p-6 border-t border-slate-200 space-y-4 text-xs">
                  {/* Parties Header & "+ Add Party" CTA */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">
                      Parties & Legal Roles
                    </h4>
                    <button
                      onClick={handleOpenAddParty}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-extrabold text-xs flex items-center gap-1 border border-indigo-200 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Party</span>
                    </button>
                  </div>

                  {/* Parties List Cards with Edit / Delete CTAs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeMatter.parties.map((p) => (
                      <div key={p.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 relative group">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-900">
                            {p.role}
                          </span>
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                            <button
                              onClick={() => handleOpenEditParty(p)}
                              title="Edit Party Details"
                              className="p-1 rounded hover:bg-slate-200 text-slate-600 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteParty(p.id)}
                              title="Delete Party"
                              className="p-1 rounded hover:bg-rose-100 text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="font-black text-sm text-slate-900">{p.name}</div>
                          <div className="text-[11px] text-slate-500 font-medium">{p.entity_type}</div>
                          {p.contact_person && (
                            <div className="text-[11px] text-slate-600 mt-1">
                              <strong>Contact / Key Person:</strong> {p.contact_person}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400 mt-0.5">{p.address}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Forum & Claim Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                      <div className="text-[10px] font-extrabold uppercase text-slate-400">Court / Forum Jurisdiction</div>
                      <div className="font-black text-slate-900 mt-1 text-xs">{activeMatter.court_forum}</div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                      <div className="text-[10px] font-extrabold uppercase text-slate-400">Total Claim Amount</div>
                      <div className="font-black text-indigo-950 mt-1 text-xs">{activeMatter.claim_amount}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* =============================================================== */}
            {/* STAGE 2: INGESTED DOCUMENTS (CLICKABLE DETAILS DRAWER) */}
            {/* =============================================================== */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <button
                onClick={() => toggleStage(2)}
                className="w-full p-4.5 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-900 flex items-center justify-center font-black text-xs">
                    2
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-indigo-950">
                      Stage 2: Ingested Evidence Files & Document Intelligence ({activeMatter.documents.length} Files)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Click any document to inspect extracted clauses, OCR text, and linked gaps in pull-out panel.
                    </p>
                  </div>
                </div>
                {openStages[2] ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>

              {openStages[2] && (
                <div className="p-6 border-t border-slate-200 space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">
                      Parsed Documents (Click to Inspect Extract)
                    </h4>
                    <button
                      onClick={() => {
                        setEvidenceDocInput('New_Inspection_Report.pdf');
                        setShowAddEvidenceModal(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-extrabold text-xs flex items-center gap-1 border border-indigo-200 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Upload Document</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {activeMatter.documents.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDocForDrawer(doc)}
                        className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-indigo-50/50 hover:border-indigo-300 transition shadow-2xs cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            {doc.pages} Pages
                          </span>
                          <span className="text-[10px] text-indigo-600 font-bold group-hover:underline">
                            Inspect Extract →
                          </span>
                        </div>
                        <div className="font-black text-xs text-slate-900 mt-2 truncate">{doc.filename}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{doc.doc_type}</div>
                        <div className="text-[10px] text-slate-400 mt-1">{doc.file_size} • {doc.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* =============================================================== */}
            {/* STAGE 3: AI VERIFIED FACTS & STATUTORY CROSS REFERENCES */}
            {/* =============================================================== */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <button
                onClick={() => toggleStage(3)}
                className="w-full p-4.5 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-900 flex items-center justify-center font-black text-xs">
                    3
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-indigo-950">
                      Stage 3: AI Verified Facts & Statutory Cross-References (BNS/IPC, BNSS/CrPC, BSA/IEA)
                    </h3>
                    <p className="text-xs text-slate-500">
                      {activeMatter.facts.length} core facts with source links & substantive Indian legal provisions.
                    </p>
                  </div>
                </div>
                {openStages[3] ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>

              {openStages[3] && (
                <div className="p-6 border-t border-slate-200 space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeMatter.facts.map((fact) => (
                      <div key={fact.id} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase text-slate-400">{fact.category}</span>
                          <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Verified
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-500">{fact.label}</div>
                        <div className="text-xs font-black text-slate-900">{fact.value}</div>
                        <div className="text-[10px] text-slate-400 font-mono pt-1">
                          Source: {fact.source.doc_name} ({fact.source.page_or_clause})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* =============================================================== */}
            {/* STAGE 4: SIGNATURE GAP ANALYSIS & REMEDIAL CTAS (STAR FEATURE) */}
            {/* =============================================================== */}
            <div className="bg-white rounded-2xl border-2 border-indigo-300 shadow-sm overflow-hidden ring-4 ring-indigo-500/5">
              <button
                onClick={() => toggleStage(4)}
                className="w-full p-4.5 bg-indigo-50/50 hover:bg-indigo-50 flex items-center justify-between text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-900 text-white flex items-center justify-center font-black text-xs">
                    4
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-sm text-indigo-950">
                        Stage 4: Signature Gap Analysis & Remedial Action CTAs
                      </h3>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-600 text-white">
                        Star Feature
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Identified vulnerabilities with direct one-click remedial action triggers.
                    </p>
                  </div>
                </div>
                {openStages[4] ? <ChevronUp className="w-4 h-4 text-slate-700" /> : <ChevronDown className="w-4 h-4 text-slate-700" />}
              </button>

              {openStages[4] && (
                <div className="p-6 border-t border-slate-200 space-y-4">
                  {activeMatter.gaps.map((gap) => {
                    const isOpen = gap.status === 'Open';
                    const isClosed = gap.status === 'Closed';

                    return (
                      <div
                        key={gap.id}
                        className={`p-5 rounded-2xl border transition shadow-2xs ${
                          isClosed
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : gap.severity === 'High'
                            ? 'bg-white border-slate-200 hover:border-indigo-300'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                  isClosed
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-indigo-100 text-indigo-900'
                                }`}
                              >
                                {gap.status}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                {gap.category}
                              </span>
                              {!isClosed && (
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    gap.severity === 'High'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {gap.severity} Priority
                                </span>
                              )}
                              <span className="text-[10px] text-slate-500 font-mono">
                                Ref: {gap.statutory_or_clause_ref}
                              </span>
                            </div>

                            <h4 className="font-extrabold text-sm text-slate-900">{gap.title}</h4>
                            <p className="text-xs text-slate-600 leading-relaxed">{gap.plain_english_explanation}</p>

                            {isClosed && gap.resolution_note && (
                              <div className="mt-2 p-2.5 rounded-xl bg-emerald-100/70 border border-emerald-300 text-xs text-emerald-900 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                                <span>{gap.resolution_note}</span>
                              </div>
                            )}

                            <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
                              <span className="text-slate-400 font-bold uppercase text-[9px]">Source:</span>
                              <span className="bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200 text-slate-700">
                                {gap.source.doc_name} ({gap.source.page_or_clause || gap.source.date})
                              </span>
                            </div>
                          </div>

                          {/* Direct Remedial CTA Button */}
                          {isOpen && (
                            <button
                              onClick={() => handleRemedialCTA(gap)}
                              className="px-4 py-2.5 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white font-extrabold text-xs transition shadow-2xs flex items-center gap-1.5 self-start sm:self-center shrink-0 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                              <span>{gap.remedial_cta_label}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* =============================================================== */}
            {/* STAGE 5: STRATEGY BRANCHES & FIRST-DRAFT COURT PLEADINGS */}
            {/* =============================================================== */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <button
                onClick={() => toggleStage(5)}
                className="w-full p-4.5 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-900 flex items-center justify-center font-black text-xs">
                    5
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-indigo-950">
                      Stage 5: Strategy Branches & First-Draft Court Pleadings Generator
                    </h3>
                    <p className="text-xs text-slate-500">
                      Categorized procedural options & instant pre-filled Indian legal notices.
                    </p>
                  </div>
                </div>
                {openStages[5] ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>

              {openStages[5] && (
                <div className="p-6 border-t border-slate-200 space-y-4">
                  {activeMatter.actions.map((act) => (
                    <div key={act.id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                            {act.category}
                          </span>
                          {act.recommended_tag && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-900 text-white">
                              {act.recommended_tag}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-indigo-900">Feasibility: {act.feasibility_score}%</span>
                      </div>

                      <h4 className="font-extrabold text-sm text-slate-900">{act.title}</h4>
                      <p className="text-xs text-slate-600">{act.short_description}</p>

                      <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
                        <div className="font-bold text-slate-700">Prerequisites: {act.prerequisites.join(' • ')}</div>
                        <div className="text-[11px] text-slate-500 font-mono">Ref: {act.statutory_ref}</div>
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-xs text-slate-600">Next: {act.next_procedural_steps[0]}</span>
                        <button
                          onClick={() => {
                            const draft = generateDraftDocument(act.draft_template_id || 'default', activeMatter);
                            setCurrentDraft(draft);
                            setShowDraftModal(true);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-indigo-900 text-white text-xs font-bold hover:bg-indigo-950 cursor-pointer flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-300" />
                          <span>Generate First-Draft Notice</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* SLIDE-OVER DRAWER: STATUTORY READY RECKONER (Requirement 3: 2 Forms) */}
      {/* --------------------------------------------------------------------- */}
      {selectedReckoner && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-slate-200 flex flex-col animate-slideLeft">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-900">
                  {selectedReckoner.act_name}
                </span>
                <h3 className="font-extrabold text-base text-slate-900 mt-1">§ {selectedReckoner.short_label}</h3>
              </div>
              <button
                onClick={() => setSelectedReckoner(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2-Tab Switcher: 1. Summary vs 2. Details as in the Act */}
            <div className="px-6 pt-3 border-b border-slate-200 bg-slate-50/50 flex gap-2">
              <button
                onClick={() => setReckonerTab('summary')}
                className={`pb-2.5 px-3 text-xs font-extrabold border-b-2 transition cursor-pointer ${
                  reckonerTab === 'summary'
                    ? 'border-indigo-900 text-indigo-950 font-black'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                1. Practitioner Summary
              </button>
              <button
                onClick={() => setReckonerTab('bare_act')}
                className={`pb-2.5 px-3 text-xs font-extrabold border-b-2 transition cursor-pointer ${
                  reckonerTab === 'bare_act'
                    ? 'border-indigo-900 text-indigo-950 font-black'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                2. Details as in the Act (Bare Act)
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-5 text-xs">
              {reckonerTab === 'summary' ? (
                /* TAB 1: SUMMARY FORM */
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
                    <strong className="text-[10px] font-extrabold uppercase text-indigo-900 block mb-1">
                      Core Legal Rule:
                    </strong>
                    <p className="text-indigo-950 font-medium leading-relaxed">
                      {selectedReckoner.summary_view.core_legal_rule}
                    </p>
                  </div>

                  <div>
                    <strong className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1.5">
                      Essential Ingredients & Applicability:
                    </strong>
                    <ul className="list-disc list-inside text-slate-700 space-y-1 bg-slate-50 p-3 rounded-xl">
                      {selectedReckoner.summary_view.essential_ingredients.map((ing, i) => (
                        <li key={i}>{ing}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <strong className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1">
                      Statutory Limitation & Timelines:
                    </strong>
                    <p className="text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      {selectedReckoner.summary_view.statutory_limitation}
                    </p>
                  </div>

                  <div>
                    <strong className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1">
                      Landmark Supreme Court Ruling:
                    </strong>
                    <p className="text-slate-800 font-bold bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                      {selectedReckoner.summary_view.landmark_sc_ruling}
                    </p>
                  </div>

                  <div>
                    <strong className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1">
                      Counsel Practical Checklist:
                    </strong>
                    <ul className="list-disc list-inside text-slate-700 space-y-1 bg-slate-50 p-3 rounded-xl">
                      {selectedReckoner.summary_view.counsel_checklist.map((chk, i) => (
                        <li key={i}>{chk}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                /* TAB 2: VERBATIM BARE ACT FORM */
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-100 border border-slate-200">
                    <strong className="text-sm font-black text-slate-900 block mb-1">
                      {selectedReckoner.details_view_bare_act.official_heading}
                    </strong>
                    <span className="text-[10px] text-slate-500 font-mono">Official Gazette / Bare Act Reproduction</span>
                  </div>

                  <pre className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-serif text-slate-900 whitespace-pre-wrap leading-relaxed text-xs">
                    {selectedReckoner.details_view_bare_act.verbatim_text}
                  </pre>

                  {selectedReckoner.details_view_bare_act.provisos_and_explanations && (
                    <div>
                      <strong className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1.5">
                        Provisos & Statutory Explanations:
                      </strong>
                      <div className="space-y-2">
                        {selectedReckoner.details_view_bare_act.provisos_and_explanations.map((prov, i) => (
                          <p key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 italic">
                            {prov}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* SLIDE-OVER DRAWER: DOCUMENT EXTRACTED DETAILS (Requirement 2) */}
      {/* --------------------------------------------------------------------- */}
      {selectedDocForDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-slate-200 flex flex-col animate-slideLeft">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-900 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 truncate max-w-xs">
                    {selectedDocForDrawer.filename}
                  </h3>
                  <div className="text-xs text-slate-500">
                    {selectedDocForDrawer.doc_type} • {selectedDocForDrawer.pages} Pages • {selectedDocForDrawer.file_size}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedDocForDrawer(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-5 text-xs">
              {/* Extracted Clauses */}
              {selectedDocForDrawer.extracted_clauses && selectedDocForDrawer.extracted_clauses.length > 0 && (
                <div>
                  <strong className="text-[11px] font-extrabold uppercase text-slate-400 block mb-2">
                    Extracted Contract Clauses & Legal Impact:
                  </strong>
                  <div className="space-y-2.5">
                    {selectedDocForDrawer.extracted_clauses.map((cl, i) => (
                      <div key={i} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-indigo-950 text-xs">{cl.clause_number}: {cl.clause_title}</span>
                        </div>
                        <p className="text-slate-800 italic bg-white p-2 rounded border border-slate-200">
                          "{cl.extracted_snippet}"
                        </p>
                        <div className="text-[11px] text-emerald-800 font-bold pt-1">
                          <strong>Legal Impact:</strong> {cl.legal_impact}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw OCR Snippet */}
              {selectedDocForDrawer.raw_ocr_snippet && (
                <div>
                  <strong className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1">
                    OCR / Text Stream Extract:
                  </strong>
                  <pre className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 whitespace-pre-wrap font-mono">
                    {selectedDocForDrawer.raw_ocr_snippet}
                  </pre>
                </div>
              )}

              {/* Associated Gaps */}
              {selectedDocForDrawer.associated_gaps && selectedDocForDrawer.associated_gaps.length > 0 && (
                <div>
                  <strong className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1">
                    Associated Identified Gaps:
                  </strong>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedDocForDrawer.associated_gaps.map((g, i) => (
                      <span key={i} className="px-2 py-1 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                        ⚠️ {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => handleDeleteDocument(selectedDocForDrawer.id)}
                className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold cursor-pointer"
              >
                Delete File
              </button>
              <button
                onClick={() => triggerToast(`Downloaded extract for: ${selectedDocForDrawer.filename}`)}
                className="px-4 py-1.5 rounded-lg bg-indigo-900 text-white text-xs font-bold hover:bg-indigo-950 cursor-pointer"
              >
                Download Document Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT PARTY (Requirement 1) */}
      {/* --------------------------------------------------------------------- */}
      {showPartyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-scaleIn space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-900" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  {editingPartyId ? 'Edit Party Details' : 'Add Party to Case'}
                </h3>
              </div>
              <button
                onClick={() => setShowPartyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Party Legal Name</label>
                <input
                  type="text"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder="e.g. Orion Components Pvt Ltd"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Case Role</label>
                  <select
                    value={partyRole}
                    onChange={(e) => setPartyRole(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white"
                  >
                    <option value="Claimant / Creditor">Claimant / Creditor</option>
                    <option value="Respondent / Debtor">Respondent / Debtor</option>
                    <option value="Guarantor / Director">Guarantor / Director</option>
                    <option value="Witness / Site Engineer">Witness / Site Engineer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Entity Type</label>
                  <select
                    value={partyType}
                    onChange={(e) => setPartyType(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white"
                  >
                    <option value="Private Limited Company">Private Limited Company</option>
                    <option value="LLP">LLP</option>
                    <option value="Individual Partner">Individual Partner</option>
                    <option value="Proprietorship">Proprietorship</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Contact / Signatory</label>
                <input
                  type="text"
                  value={partyContact}
                  onChange={(e) => setPartyContact(e.target.value)}
                  placeholder="e.g. Mr. Arvind Malhotra (Director)"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Registered Address</label>
                <input
                  type="text"
                  value={partyAddress}
                  onChange={(e) => setPartyAddress(e.target.value)}
                  placeholder="e.g. Okhla Industrial Area Phase III, New Delhi"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setShowPartyModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveParty}
                className="px-4 py-2 rounded-xl text-xs font-extrabold bg-indigo-900 hover:bg-indigo-950 text-white shadow-xs cursor-pointer"
              >
                Save Party
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: ADD EVIDENCE */}
      {/* --------------------------------------------------------------------- */}
      {showAddEvidenceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-900" />
                <h3 className="text-sm font-extrabold text-slate-900">Add Evidence to Workspace</h3>
              </div>
              <button
                onClick={() => setShowAddEvidenceModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              Upload a supplemental document or paste a newly received factual disclosure. The system will automatically
              refresh the gap analysis and update matter readiness.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-1">
                  Text / Email / WhatsApp Note:
                </label>
                <textarea
                  rows={4}
                  value={evidenceTextInput}
                  onChange={(e) => setEvidenceTextInput(e.target.value)}
                  placeholder="e.g. Debtor Managing Director sent WhatsApp message admitting liability..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-slate-50"
                ></textarea>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-1">
                  Mock Attachment Filename:
                </label>
                <input
                  type="text"
                  value={evidenceDocInput}
                  onChange={(e) => setEvidenceDocInput(e.target.value)}
                  placeholder="e.g. Joint_Laboratory_Test_Report_NABL.pdf"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-slate-50"
                />
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowAddEvidenceModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyEvidence}
                className="px-4 py-2 rounded-xl text-xs font-extrabold bg-indigo-900 hover:bg-indigo-950 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                <span>Process Evidence</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: NEW CASE INTAKE */}
      {/* --------------------------------------------------------------------- */}
      {showNewCaseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-scaleIn space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-indigo-900" />
                <h3 className="text-sm font-extrabold text-slate-900">New Commercial Case Intake</h3>
              </div>
              <button
                onClick={() => setShowNewCaseModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Matter Title</label>
                <input
                  type="text"
                  value={newCaseTitle}
                  onChange={(e) => setNewCaseTitle(e.target.value)}
                  placeholder="e.g. Apex Steel Ltd. v. Zenith Infrastructure Corp"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Claimant Party</label>
                  <input
                    type="text"
                    value={newCaseClaimant}
                    onChange={(e) => setNewCaseClaimant(e.target.value)}
                    placeholder="e.g. Apex Steel Ltd."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Respondent Party</label>
                  <input
                    type="text"
                    value={newCaseRespondent}
                    onChange={(e) => setNewCaseRespondent(e.target.value)}
                    placeholder="e.g. Zenith Infra Corp"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Court / Forum</label>
                  <input
                    type="text"
                    value={newCaseCourt}
                    onChange={(e) => setNewCaseCourt(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Claim Amount</label>
                  <input
                    type="text"
                    value={newCaseClaim}
                    onChange={(e) => setNewCaseClaim(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowNewCaseModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewCase}
                className="px-4 py-2 rounded-xl text-xs font-extrabold bg-indigo-900 hover:bg-indigo-950 text-white shadow-xs cursor-pointer"
              >
                Create Case Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: DRAFT NOTICE PREVIEW */}
      {/* --------------------------------------------------------------------- */}
      {showDraftModal && currentDraft && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] animate-scaleIn">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-900" />
                <h3 className="font-extrabold text-sm text-slate-900">{currentDraft.title}</h3>
              </div>
              <button
                onClick={() => setShowDraftModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto">
              <pre className="text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                {currentDraft.content}
              </pre>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[10px] text-amber-800 font-bold">
                * AI-generated suggestion – for human review only
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(currentDraft.content);
                    triggerToast('Draft text copied to clipboard.');
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold hover:bg-white cursor-pointer"
                >
                  Copy Text
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([currentDraft.content], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${currentDraft.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                    triggerToast('Draft downloaded as .txt file.');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-bold cursor-pointer"
                >
                  Download Draft (.txt)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TOAST NOTIFICATION */}
      {/* --------------------------------------------------------------------- */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
