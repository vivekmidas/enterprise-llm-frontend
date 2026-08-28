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

import React, { useState, useMemo } from 'react';
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
  Wand2,
  FileUp,
  Gavel,
  Calendar,
  CalendarCheck,
  ShieldAlert,
} from 'lucide-react';
import {
  ALL_MATTERS,
  MatterCase,
  CaseGap,
  CaseParty,
  UploadedDoc,
  StatutoryReadyReckoner,
  HistoricalPrecedent,
  STATUTORY_RECKONER_DB,
  generateDraftDocument,
  HearingRecord,
  TimelineEvent,
} from './mock_autopilot_data';

export type CaseCategory = 'commercial' | 'criminal' | 'constitutional' | 'arbitration' | 'civil';

export interface CategoryOption {
  id: CaseCategory;
  label: string;
  badge: string;
  badgeColor: string;
  icon: any;
  courtDefault: string;
  claimDefault: string;
  party1Label: string;
  party1Placeholder: string;
  party2Label: string;
  party2Placeholder: string;
  valueLabel: string;
  valuePlaceholder: string;
  secondaryRefLabel: string;
  secondaryRefPlaceholder: string;
  disputeLabel: string;
  disputePlaceholder: string;
  defaultSections: string[];
  presetSample: {
    title: string;
    party1: string;
    party2: string;
    court: string;
    value: string;
    secondaryRef: string;
    dispute: string;
  };
}

export const CASE_CATEGORY_CONFIG: Record<CaseCategory, CategoryOption> = {
  commercial: {
    id: 'commercial',
    label: 'Commercial Matter',
    badge: 'Commercial Litigation',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    icon: Building2,
    courtDefault: 'Commercial Court, Patiala House Courts, Delhi',
    claimDefault: '₹1,85,00,000',
    party1Label: 'Claimant / Plaintiff',
    party1Placeholder: 'e.g. Apex Steel & Heavy Engineering Ltd.',
    party2Label: 'Respondent / Defendant',
    party2Placeholder: 'e.g. Zenith Infrastructure Corp LLP',
    valueLabel: 'Claim Value / Contract Scope',
    valuePlaceholder: 'e.g. ₹1,85,00,000 (Principal + 18% Interest)',
    secondaryRefLabel: 'Master Agreement / Contract Date',
    secondaryRefPlaceholder: 'e.g. Contract No. SC-902/2024 dated 15 Jan 2024',
    disputeLabel: 'Commercial Dispute & Breach of Terms',
    disputePlaceholder: 'e.g. Unpaid milestone invoices, supply delay penalties, unilateral debit note deductions...',
    defaultSections: ['sec12a_cca', 'sec21_arb', 'sec63_bsa'],
    presetSample: {
      title: 'Apex Steel Ltd. v. Zenith Infrastructure Corp',
      party1: 'Apex Steel Ltd. (Through Arvind Malhotra, Director)',
      party2: 'Zenith Infrastructure Corp LLP (Designated Partner)',
      court: 'Commercial Court, Patiala House Courts, New Delhi',
      value: '₹1,85,00,000',
      secondaryRef: 'Master Supply Agreement Ref: MSA-2024/09',
      dispute: 'Recovery of unpaid structural steel invoices with belated debit notes raised after 15-day inspection window.',
    },
  },
  criminal: {
    id: 'criminal',
    label: 'Criminal / BNS Matter',
    badge: 'Criminal & White Collar',
    badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
    icon: ShieldCheck,
    courtDefault: 'Court of Chief Metropolitan Magistrate (CMM), Tis Hazari Courts, Delhi',
    claimDefault: '₹92,00,000',
    party1Label: 'State / Complainant',
    party1Placeholder: 'e.g. State (NCT of Delhi) / Shivam Polymers Pvt Ltd',
    party2Label: 'Accused / Petitioner',
    party2Placeholder: 'e.g. Rajesh Bansal (Managing Director)',
    valueLabel: 'Dishonoured Sum / Quantum of Fraud',
    valuePlaceholder: 'e.g. ₹92,00,000 (Dishonoured Cheques + Inducement)',
    secondaryRefLabel: 'FIR No. & Police Station / Complaint Ref',
    secondaryRefPlaceholder: 'e.g. FIR No. 142/2026, PS Economic Offences Wing (EOW)',
    disputeLabel: 'Criminal Allegations, Mens Rea & Overt Acts',
    disputePlaceholder: 'e.g. Cheating under Sec 318(4) BNS, dishonest inducement at inception, criminal breach of trust (Sec 316 BNS)...',
    defaultSections: ['sec318_bns', 'sec316_bns', 'sec35_bnss', 'sec528_bnss', 'sec138_ni_act', 'sec63_bsa'],
    presetSample: {
      title: 'State (Shivam Polymers) v. Rajesh Bansal & Anr.',
      party1: 'Shivam Polymers Pvt Ltd (Vikram Sethi, Director)',
      party2: 'Rajesh Bansal (Managing Director, Bansal Packaging)',
      court: 'Court of Chief Metropolitan Magistrate (CMM), Tis Hazari Courts, Delhi',
      value: '₹92,00,000',
      secondaryRef: 'FIR No. 142/2026, PS EOW Central',
      dispute: 'Accused dishonestly induced delivery of 80 MT Polymer Granules and issued post-dated cheques from a closed bank account.',
    },
  },
  constitutional: {
    id: 'constitutional',
    label: 'Constitutional / Writ',
    badge: 'Writ & Constitutional Law',
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
    icon: Scale,
    courtDefault: 'High Court of Delhi (Writ Jurisdiction - Division Bench)',
    claimDefault: '500 MW Solar Power Project',
    party1Label: 'Petitioner',
    party1Placeholder: 'e.g. Sunray Clean Energy Solutions Ltd.',
    party2Label: 'Respondent (State / Public Authority)',
    party2Placeholder: 'e.g. Union of India & Solar Energy Corp of India (SECI)',
    valueLabel: 'Matter Scope / Statutory Tariff Valuation',
    valuePlaceholder: 'e.g. 500 MW Power Purchase Agreement Scope',
    secondaryRefLabel: 'Impugned Notification / Order No.',
    secondaryRefPlaceholder: 'e.g. MoP Circular F.No. 44/2025/Solar dated 14 Nov 2025',
    disputeLabel: 'Grounds of Ultra Vires & Constitutional Violations',
    disputePlaceholder: 'e.g. Retrospective tariff amendment violating Article 14, 19(1)(g) and doctrine of legitimate expectation without hearing...',
    defaultSections: ['art226_writ', 'sec63_bsa'],
    presetSample: {
      title: 'Sunray Clean Energy Ltd. v. Union of India & Anr.',
      party1: 'Sunray Clean Energy Solutions Ltd.',
      party2: 'Union of India (Ministry of Power) & SECI',
      court: 'High Court of Delhi (Writ Jurisdiction - DB)',
      value: '500 MW PPA Tariff Rights',
      secondaryRef: 'MoP Circular F.No. 44/2025/Solar',
      dispute: 'Writ Petition under Article 226 challenging retrospective tariff rollback without opportunity of hearing.',
    },
  },
  arbitration: {
    id: 'arbitration',
    label: 'Arbitration',
    badge: 'Domestic & International Arbitration',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: BookMarked,
    courtDefault: 'Delhi International Arbitration Centre (DIAC), High Court of Delhi',
    claimDefault: '₹24,50,00,000',
    party1Label: 'Claimant',
    party1Placeholder: 'e.g. Global Metro Consortium Ltd.',
    party2Label: 'Respondent',
    party2Placeholder: 'e.g. National High Speed Rail Corp',
    valueLabel: 'Arbitration Claim / Liquidated Sum',
    valuePlaceholder: 'e.g. ₹24,50,00,000 (Escalation + Overhead + Delay)',
    secondaryRefLabel: 'Arbitration Clause & Seat Agreement',
    secondaryRefPlaceholder: 'e.g. GCC Clause 20.6 (DIAC Rules, Seat: New Delhi)',
    disputeLabel: 'Arbitrable Claims, Delay Notice & Milestone Quantum',
    disputePlaceholder: 'e.g. Section 21 notice invoked for non-issuance of work completion certificate and prolonged right-of-way handover...',
    defaultSections: ['sec21_arb', 'sec12a_cca', 'sec63_bsa'],
    presetSample: {
      title: 'Global Metro Consortium v. National Rail Corp',
      party1: 'Global Metro Consortium Ltd.',
      party2: 'National High Speed Rail Corp',
      court: 'Delhi International Arbitration Centre (DIAC)',
      value: '₹24,50,00,000',
      secondaryRef: 'GCC Clause 20.6 (DIAC Rules, New Delhi Seat)',
      dispute: 'Dispute referred to arbitration under Section 21 for unpaid milestone bills and prolongation costs.',
    },
  },
  civil: {
    id: 'civil',
    label: 'Civil / Property',
    badge: 'Civil & Specific Relief',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: Layers,
    courtDefault: 'District & Sessions Court, Saket Courts, New Delhi',
    claimDefault: '₹65,00,000',
    party1Label: 'Plaintiff / Appellant',
    party1Placeholder: 'e.g. Rameshwar Dayal & Sons',
    party2Label: 'Defendant / Respondent',
    party2Placeholder: 'e.g. Grand Heritage Estates Pvt Ltd',
    valueLabel: 'Suit Valuation / Relief Sought',
    valuePlaceholder: 'e.g. ₹65,00,000 (Specific Performance & Injunction)',
    secondaryRefLabel: 'Agreement to Sell / Property Details',
    secondaryRefPlaceholder: 'e.g. ATS dated 18 May 2023 for Industrial Plot No. 88',
    disputeLabel: 'Cause of Action & Specific Relief Grounds',
    disputePlaceholder: 'e.g. Suit for specific performance of sale deed and temporary injunction under Order 39 Rules 1 & 2 CPC against third-party sale...',
    defaultSections: ['order39_cpc', 'sec63_bsa', 'sec12a_cca'],
    presetSample: {
      title: 'Rameshwar Dayal v. Grand Heritage Estates Pvt Ltd',
      party1: 'Rameshwar Dayal',
      party2: 'Grand Heritage Estates Pvt Ltd',
      court: 'District Court Saket, New Delhi',
      value: '₹65,00,000',
      secondaryRef: 'Agreement to Sell dated 18 May 2023',
      dispute: 'Suit for specific performance of registered Agreement to Sell with urgent Order 39 injunction.',
    },
  },
};

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

  // New Case Intake Modal States
  const [showNewCaseModal, setShowNewCaseModal] = useState<boolean>(false);
  const [newCaseCategory, setNewCaseCategory] = useState<CaseCategory>('commercial');
  const [newCaseTitle, setNewCaseTitle] = useState<string>('');
  const [newCaseParty1, setNewCaseParty1] = useState<string>('');
  const [newCaseParty2, setNewCaseParty2] = useState<string>('');
  const [newCaseCourt, setNewCaseCourt] = useState<string>(CASE_CATEGORY_CONFIG.commercial.courtDefault);
  const [newCaseClaim, setNewCaseClaim] = useState<string>(CASE_CATEGORY_CONFIG.commercial.claimDefault);
  const [newCaseSecondaryRef, setNewCaseSecondaryRef] = useState<string>('');
  const [newCaseDisputeDescription, setNewCaseDisputeDescription] = useState<string>('');
  const [isAutoDetecting, setIsAutoDetecting] = useState<boolean>(false);
  const [detectedBadgeText, setDetectedBadgeText] = useState<string | null>(null);

  const [showDraftModal, setShowDraftModal] = useState<boolean>(false);
  const [currentDraft, setCurrentDraft] = useState<{ title: string; content: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Hearing / Court Proceeding Update Modal States
  const [showHearingModal, setShowHearingModal] = useState<boolean>(false);
  const [hearingDate, setHearingDate] = useState<string>('28 Feb 2026');
  const [hearingCourt, setHearingCourt] = useState<string>('Court No. 3, High Court of Delhi');
  const [hearingStage, setHearingStage] = useState<HearingRecord['proceeding_stage']>('Interim Arguments');
  const [hearingOrderSummary, setHearingOrderSummary] = useState<string>('');
  const [hearingDirections, setHearingDirections] = useState<string>('');
  const [hearingNextDate, setHearingNextDate] = useState<string>('24 Mar 2026');
  const [hearingImpactPreset, setHearingImpactPreset] = useState<string>('interim_stay_granted');

  // Memoized Timeline in Reverse Chronological Order
  const sortedTimeline = useMemo(() => {
    return [...activeMatter.timeline].sort((a, b) => {
      const timeA = Date.parse(a.date) || 0;
      const timeB = Date.parse(b.date) || 0;
      return timeB - timeA;
    });
  }, [activeMatter.timeline]);

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

  // Category Selector Change Handler
  const handleSelectCategory = (cat: CaseCategory) => {
    setNewCaseCategory(cat);
    const cfg = CASE_CATEGORY_CONFIG[cat];
    setNewCaseCourt(cfg.courtDefault);
    setNewCaseClaim(cfg.claimDefault);
    setDetectedBadgeText(null);
  };

  // Preset Auto-fill
  const handleApplyPreset = (cat: CaseCategory) => {
    setNewCaseCategory(cat);
    const cfg = CASE_CATEGORY_CONFIG[cat];
    setNewCaseTitle(cfg.presetSample.title);
    setNewCaseParty1(cfg.presetSample.party1);
    setNewCaseParty2(cfg.presetSample.party2);
    setNewCaseCourt(cfg.presetSample.court);
    setNewCaseClaim(cfg.presetSample.value);
    setNewCaseSecondaryRef(cfg.presetSample.secondaryRef);
    setNewCaseDisputeDescription(cfg.presetSample.dispute);
    setDetectedBadgeText(`Loaded ${cfg.badge} Preset`);
    triggerToast(`Applied ${cfg.label} sample brief.`);
  };

  // Simulated Document Drop / Parse
  const handleSimulatedDocDrop = (fileInputName?: string) => {
    setIsAutoDetecting(true);
    triggerToast('Analyzing document metadata & classifying legal domain...');
    setTimeout(() => {
      setIsAutoDetecting(false);
      const name = (fileInputName || '').toLowerCase();
      let targetCat: CaseCategory = 'commercial';
      if (name.includes('fir') || name.includes('bns') || name.includes('cheque') || name.includes('police')) {
        targetCat = 'criminal';
      } else if (name.includes('writ') || name.includes('petition') || name.includes('article') || name.includes('ppa')) {
        targetCat = 'constitutional';
      } else if (name.includes('arbitration') || name.includes('diac') || name.includes('section 21')) {
        targetCat = 'arbitration';
      } else if (name.includes('suit') || name.includes('injunction') || name.includes('property')) {
        targetCat = 'civil';
      }
      handleApplyPreset(targetCat);
      setDetectedBadgeText(`Auto-Classified: ${CASE_CATEGORY_CONFIG[targetCat].badge} (99.4% confidence)`);
      triggerToast(`AI Auto-classified as ${CASE_CATEGORY_CONFIG[targetCat].label}`);
    }, 700);
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

  // Create New Case Workspace
  const handleCreateNewCase = () => {
    if (!newCaseTitle.trim()) {
      triggerToast('Please provide a matter title');
      return;
    }

    const cfg = CASE_CATEGORY_CONFIG[newCaseCategory];
    const targetSections = cfg.defaultSections
      .map((code) => STATUTORY_RECKONER_DB[code])
      .filter(Boolean);

    let createdParties: CaseParty[] = [];
    let initialDocs: UploadedDoc[] = [];
    let initialGaps: CaseGap[] = [];

    if (newCaseCategory === 'criminal') {
      createdParties = [
        {
          id: `p_crm_1`,
          name: newCaseParty1 || 'State of NCT of Delhi (At instance of Complainant)',
          role: 'Claimant / Creditor',
          entity_type: 'Private Limited Company',
          address: 'Central District, New Delhi',
          contact_person: 'Complainant Authorized Representative',
        },
        {
          id: `p_crm_2`,
          name: newCaseParty2 || 'Rajesh Bansal (Managing Director)',
          role: 'Respondent / Debtor',
          entity_type: 'LLP',
          address: 'Lawrence Road Industrial Area, Delhi',
          contact_person: 'Accused In-Charge of Business Affairs',
        },
      ];
      initialDocs = [
        {
          id: `doc_crm_1`,
          filename: 'Police_FIR_Cognizable_Charges.pdf',
          doc_type: 'First Information Report (FIR)',
          pages: 6,
          date: 'Today',
          file_size: '1.4 MB',
          status: 'Parsed',
          extracted_clauses: [
            {
              clause_number: 'FIR Allegations',
              clause_title: 'Sections 318(4) & 316(2) BNS (Cheating & CBT)',
              extracted_snippet: newCaseDisputeDescription.trim() || 'Accused dishonestly induced complainant to supply goods against closed account cheques.',
              legal_impact: 'Discloses cognizable cheating and dishonest inducement at inception.',
            },
          ],
        },
      ];
      initialGaps = [
        {
          id: `gap_crm_1`,
          title: 'Section 35(3) BNSS Police Notice Compliance & Arrest Protection',
          category: 'Procedural / Notice',
          severity: 'High',
          status: 'Open',
          plain_english_explanation: 'Offence punishable up to 7 years requires mandatory notice of appearance under Arnesh Kumar / Satender Antil guidelines.',
          statutory_or_clause_ref: 'Section 35(3), Bharatiya Nagarik Suraksha Sanhita 2023',
          source: { title: 'Statutory Procedure', doc_name: 'BNSS Code' },
          suggested_fix: 'Submit formal written cooperation reply to Investigating Officer with acknowledgment receipt.',
          remedial_cta_label: 'Draft Section 35(3) Reply',
          remedial_cta_action_type: 'draft_notice',
          remedial_target_template: 'draft_sec35_bnss',
        },
      ];
    } else if (newCaseCategory === 'constitutional') {
      createdParties = [
        {
          id: `p_con_1`,
          name: newCaseParty1 || 'Sunray Clean Energy Solutions Ltd.',
          role: 'Claimant / Creditor',
          entity_type: 'Private Limited Company',
          address: 'Barakhamba Road, Connaught Place, New Delhi',
        },
        {
          id: `p_con_2`,
          name: newCaseParty2 || 'Union of India (Ministry of Power) & Anr.',
          role: 'Respondent / Debtor',
          entity_type: 'LLP',
          address: 'Shram Shakti Bhawan, Rafi Marg, New Delhi',
        },
      ];
      initialDocs = [
        {
          id: `doc_con_1`,
          filename: 'Impugned_Statutory_Notification.pdf',
          doc_type: 'Government Circular / Order',
          pages: 12,
          date: 'Today',
          file_size: '2.1 MB',
          status: 'Parsed',
          extracted_clauses: [
            {
              clause_number: 'Impugned Direction',
              clause_title: 'Retrospective Rollback of Tariff Guarantees',
              extracted_snippet: newCaseDisputeDescription.trim() || 'Unilateral withdrawal of feed-in tariff without opportunity of hearing.',
              legal_impact: 'Violative of Article 14 (Arbitrariness) and Natural Justice.',
            },
          ],
        },
      ];
      initialGaps = [
        {
          id: `gap_con_1`,
          title: 'Exhaustion of Alternative Remedy vs Fundamental Right Scrutiny',
          category: 'Procedural / Notice',
          severity: 'High',
          status: 'Open',
          plain_english_explanation: 'High Court writ entertainable under Whirlpool doctrine when patent breach of natural justice or jurisdictional excess is shown.',
          statutory_or_clause_ref: 'Article 226, Constitution of India',
          source: { title: 'Constitutional Law', doc_name: 'Writ Guidelines' },
          suggested_fix: 'Demonstrate absence of efficacious alternative forum and urgency of interim stay.',
          remedial_cta_label: 'Draft Article 226 Writ Petition',
          remedial_cta_action_type: 'draft_notice',
          remedial_target_template: 'draft_art226_writ',
        },
      ];
    } else if (newCaseCategory === 'arbitration') {
      createdParties = [
        {
          id: `p_arb_1`,
          name: newCaseParty1 || 'Global Metro Consortium Ltd.',
          role: 'Claimant / Creditor',
          entity_type: 'Private Limited Company',
          address: 'Nehru Place Commercial Complex, New Delhi',
        },
        {
          id: `p_arb_2`,
          name: newCaseParty2 || 'National High Speed Rail Corp Ltd.',
          role: 'Respondent / Debtor',
          entity_type: 'Private Limited Company',
          address: 'Dwarka Sector 21, New Delhi',
        },
      ];
      initialDocs = [
        {
          id: `doc_arb_1`,
          filename: 'General_Conditions_of_Contract_Arb_Clause.pdf',
          doc_type: 'Contract / Agreement',
          pages: 45,
          date: 'Today',
          file_size: '3.8 MB',
          status: 'Parsed',
          extracted_clauses: [
            {
              clause_number: 'Clause 20.6',
              clause_title: 'Arbitration in New Delhi (DIAC Rules)',
              extracted_snippet: 'All disputes shall be referred to institutional arbitration in New Delhi.',
              legal_impact: 'Exclusive seat and institutional arbitration mechanism defined.',
            },
          ],
        },
      ];
      initialGaps = [
        {
          id: `gap_arb_1`,
          title: 'Section 21 Statutory Notice of Invocation of Arbitration',
          category: 'Procedural / Notice',
          severity: 'High',
          status: 'Open',
          plain_english_explanation: 'Statutory prerequisite under Sec 21 before filing Section 11(6) appointment petition before High Court.',
          statutory_or_clause_ref: 'Section 21, Arbitration and Conciliation Act 1996',
          source: { title: 'Arbitration Law', doc_name: 'Arbitration Act' },
          suggested_fix: 'Serve speed post invocation notice proposing panel of 3 independent arbitrators.',
          remedial_cta_label: 'Draft Section 21 Invocation Notice',
          remedial_cta_action_type: 'draft_notice',
          remedial_target_template: 'draft_sec21_arbitration',
        },
      ];
    } else {
      // Commercial & Civil Default
      createdParties = [
        {
          id: `p_com_1`,
          name: newCaseParty1 || 'Apex Steel & Heavy Engineering Ltd.',
          role: 'Claimant / Creditor',
          entity_type: 'Private Limited Company',
          address: 'Industrial Area, New Delhi',
        },
        {
          id: `p_com_2`,
          name: newCaseParty2 || 'Zenith Infrastructure Corp LLP',
          role: 'Respondent / Debtor',
          entity_type: 'LLP',
          address: 'Cyber Hub, Gurugram',
        },
      ];
      initialDocs = [
        {
          id: `doc_com_1`,
          filename: 'Executed_Master_Contract_Invoices.pdf',
          doc_type: 'Agreement & Invoices',
          pages: 18,
          date: 'Today',
          file_size: '2.4 MB',
          status: 'Parsed',
          extracted_clauses: [
            {
              clause_number: 'Clause 5 & 14',
              clause_title: 'Payment & Quality Inspection Window',
              extracted_snippet: newCaseDisputeDescription.trim() || 'Payment due in 30 days. Belated defect claims barred post 15-day window.',
              legal_impact: '30-day debt maturity and waiver of latent defect objections.',
            },
          ],
        },
      ];
      initialGaps = [
        {
          id: `gap_com_1`,
          title: 'Mandatory Section 12A Pre-Institution Mediation Notice (CCA 2015)',
          category: 'Procedural / Notice',
          severity: 'High',
          status: 'Open',
          plain_english_explanation: 'Prior to filing in Commercial Court, Section 12A mediation must be initiated before DSLSA per Patil Automation.',
          statutory_or_clause_ref: 'Section 12A, Commercial Courts Act 2015',
          source: { title: 'Commercial Courts Act', doc_name: 'Commercial Courts Act' },
          suggested_fix: 'Generate Form 1 application for mediation before Legal Services Authority.',
          remedial_cta_label: 'Generate Section 12A Form 1',
          remedial_cta_action_type: 'draft_notice',
          remedial_target_template: 'draft_sec12a_form1',
        },
      ];
    }

    const created: MatterCase = {
      id: `case_${Date.now()}`,
      case_code: `custom_${Date.now()}` as any,
      case_title: newCaseTitle.trim(),
      case_subtitle: `${newCaseCourt} · ${cfg.badge} Workspace`,
      court_forum: newCaseCourt,
      claim_amount: newCaseClaim || cfg.claimDefault,
      dispute_description:
        newCaseDisputeDescription.trim() ||
        `${cfg.label} matter between ${newCaseParty1 || 'Claimant / Petitioner'} and ${newCaseParty2 || 'Respondent'} regarding ${newCaseSecondaryRef || 'contractual and statutory claims'}.`,
      matter_status: 'Initial intake completed',
      evidence_completeness: 55,
      open_gaps_count: initialGaps.length,
      last_reviewed: 'Just now',
      case_category: cfg.badge,
      parties: createdParties,
      statutory_sections: targetSections.length > 0 ? targetSections : activeMatter.statutory_sections,
      documents: initialDocs,
      timeline: [
        {
          id: `tl_init_1`,
          date: 'Today',
          title: `${cfg.label} Case File Initiated`,
          description: `Matter created by advocate for ${newCaseParty1 || 'Party 1'} vs ${newCaseParty2 || 'Party 2'}.`,
          source: { title: 'Intake Record', doc_name: 'Intake Dossier', date: 'Today' },
        },
      ],
      facts: [
        {
          id: `fact_c_1`,
          label: cfg.valueLabel,
          value: newCaseClaim || cfg.claimDefault,
          category: 'Financial',
          source: { title: 'Initial Pleadings', doc_name: 'Intake Brief' },
          verified: true,
        },
      ],
      gaps: initialGaps,
      actions: activeMatter.actions,
      precedents: activeMatter.precedents,
      sample_enrichment_text: 'Opposite party sent formal communication acknowledging liability and proposing settlement.',
      sample_enrichment_doc_name: 'Opposite_Party_Letter_Acknowledgment.pdf',
    };

    setActiveMatter(created);
    setShowNewCaseModal(false);
    setNewCaseTitle('');
    setNewCaseParty1('');
    setNewCaseParty2('');
    setNewCaseSecondaryRef('');
    setNewCaseDisputeDescription('');
    setDetectedBadgeText(null);
    setOpenStages({ 1: true, 2: true, 3: true, 4: true, 5: true });
    triggerToast(`Created new case workspace: ${created.case_title}`);
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

  // Court Hearing Preset Selector
  const handleSelectHearingPreset = (preset: string) => {
    setHearingImpactPreset(preset);
    if (preset === 'interim_stay_granted') {
      setHearingStage('Interim Arguments');
      setHearingOrderSummary('Interim stay granted on impugned demand/action. Notice issued to opposite party returnable in 4 weeks. Ad-interim protection active.');
      setHearingDirections('Petitioner to effect dasti service within 3 days and file affidavit of service. Registry to issue formal notice.');
      setHearingNextDate('24 Mar 2026');
    } else if (preset === 'counter_affidavit_deadline') {
      setHearingStage('Notice Returnable');
      setHearingOrderSummary('Opposite party counsel entered appearance and sought time to file Counter Affidavit. Court granted 3 weeks for Counter and 2 weeks for Rejoinder.');
      setHearingDirections('Respondent to file Counter Affidavit on or before 20 Mar 2026. Rejoinder by Petitioner before 05 Apr 2026.');
      setHearingNextDate('12 Apr 2026');
    } else if (preset === 'issues_framed') {
      setHearingStage('Framing of Issues');
      setHearingOrderSummary('Pleadings complete. Admission/denial of documents recorded. Court framed 4 substantive issues and directed parties to file list of witnesses.');
      setHearingDirections('Plaintiff to file List of Witnesses and Tender PW-1 Evidence Affidavit within 4 weeks. Advance copy to Defendant.');
      setHearingNextDate('30 Apr 2026');
    } else if (preset === 'order_reserved') {
      setHearingStage('Final Hearing');
      setHearingOrderSummary('Substantive arguments concluded by senior counsels for both sides. Written submissions on key precedents taken on record. Judgment/Order reserved.');
      setHearingDirections('Both parties permitted to submit 3-page convenience compilation of citations within 48 hours.');
      setHearingNextDate('Order Reserved');
    }
  };

  // Save Court Hearing / Daily Order Sheet Update
  const handleSaveHearingUpdate = () => {
    if (!hearingOrderSummary.trim()) {
      triggerToast('Please provide court order / proceeding summary');
      return;
    }

    const updated = JSON.parse(JSON.stringify(activeMatter)) as MatterCase;

    // Create new Timeline event with Hearing metadata
    const newTimelineEvent: TimelineEvent = {
      id: `tl_hearing_${Date.now()}`,
      date: hearingDate || 'Today',
      title: `Court Hearing: ${hearingStage}`,
      description: hearingOrderSummary.trim(),
      source: {
        title: 'Daily Court Order Sheet',
        doc_name: `Daily_Order_${(hearingDate || 'Today').replace(/\s+/g, '_')}.pdf`,
        page_or_clause: 'Order Sheet Entry',
      },
      event_type: 'Hearing',
      impact_badge: hearingStage,
      next_date: hearingNextDate || undefined,
      bench_direction: hearingDirections.trim() || undefined,
    };

    updated.timeline.unshift(newTimelineEvent);

    if (hearingNextDate) {
      updated.next_hearing_date = hearingNextDate;
    }

    // Dynamic Impact on Case Strategy, Gaps & Next Actions
    if (hearingImpactPreset === 'interim_stay_granted') {
      updated.matter_status = `Interim Relief Active · Next Date: ${hearingNextDate || 'TBD'}`;
      updated.evidence_completeness = Math.min(100, updated.evidence_completeness + 5);
      updated.actions.unshift({
        id: `act_hearing_${Date.now()}`,
        title: 'Comply with Interim Order Conditions & Effect Dasti Service',
        category: 'Formal Proceedings',
        short_description: 'Procure certified copy of interim order sheet and effect immediate dasti notice.',
        prerequisites: ['Certified copy of order sheet'],
        statutory_ref: 'Order 39 Rule 3 Proviso CPC / Art 226',
        next_procedural_steps: ['Procure certified true copy from court registry', 'Serve by speed post + email and file affidavit of service'],
        feasibility_score: 95,
        recommended_tag: 'URGENT COMPLIANCE',
      });
    } else if (hearingImpactPreset === 'counter_affidavit_deadline') {
      updated.matter_status = `Pleadings Stage · Timelines Fixed (Next: ${hearingNextDate || 'TBD'})`;
      updated.gaps.unshift({
        id: `gap_hearing_${Date.now()}`,
        title: `Court Deadline: Prepare & File Rejoinder Affidavit before ${hearingNextDate || 'next date'}`,
        category: 'Procedural / Notice',
        severity: 'High',
        status: 'Open',
        plain_english_explanation: `Court granted 3 weeks for Counter Affidavit and 2 weeks for Rejoinder on ${hearingDate}. Failure to file rejoinder forfeits right to rebuttal.`,
        statutory_or_clause_ref: 'High Court Rules & Orders (Writ/Commercial Practice)',
        source: { title: 'Order Sheet Entry', doc_name: 'Daily_Court_Order.pdf' },
        suggested_fix: 'Draft concise rejoinder affidavit dealing specifically with preliminary objections.',
        remedial_cta_label: 'Draft Rejoinder Affidavit',
        remedial_cta_action_type: 'draft_notice',
        remedial_target_template: 'draft_rejoinder_affidavit',
      });
      updated.open_gaps_count = updated.gaps.filter((g) => g.status === 'Open').length;
    } else if (hearingImpactPreset === 'issues_framed') {
      updated.matter_status = `Trial Stage · Issues Framed (Next: ${hearingNextDate || 'TBD'})`;
      updated.actions.unshift({
        id: `act_issues_${Date.now()}`,
        title: 'File List of Witnesses & PW-1 Evidence by Affidavit',
        category: 'Formal Proceedings',
        short_description: 'Draft witness list and tender PW-1 evidence affidavit under Order 18 Rule 4 CPC / BSA.',
        prerequisites: ['Original documents in safe custody'],
        statutory_ref: 'Order 18 Rule 4 CPC / Order 16 CPC',
        next_procedural_steps: ['Identify key authorized witness', 'Prepare exhibit bundle with Sec 63 BSA certificates'],
        feasibility_score: 90,
        recommended_tag: 'TRIAL READINESS',
      });
    } else if (hearingImpactPreset === 'order_reserved') {
      updated.matter_status = 'Judgment / Final Order Reserved';
    } else {
      updated.matter_status = `Proceeding Logged: ${hearingStage} (${hearingDate})`;
    }

    updated.last_reviewed = 'Just now';
    setActiveMatter(updated);
    setShowHearingModal(false);
    setHearingOrderSummary('');
    setHearingDirections('');
    triggerToast('Court Hearing update recorded! Timeline, status, and gaps refreshed.');
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

          {/* Left Panel Case Timeline View (Reverse Chronological) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-700" />
                Case Timeline ({sortedTimeline.length})
              </span>
              <button
                onClick={() => {
                  setHearingCourt(activeMatter.court_forum || 'Court No. 3, High Court');
                  setShowHearingModal(true);
                }}
                className="text-[10px] text-amber-800 hover:text-amber-950 font-extrabold bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300 cursor-pointer flex items-center gap-1 shadow-2xs transition-colors"
              >
                <Gavel className="w-3 h-3 text-amber-700" />
                <span>+ Log Hearing</span>
              </button>
            </div>

            <div className="space-y-3 relative pl-3 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {sortedTimeline.map((event) => {
                const isHearing = event.event_type === 'Hearing';
                return (
                  <div
                    key={event.id}
                    className={`relative pl-3 text-xs p-2 rounded-xl transition-all ${
                      isHearing
                        ? 'bg-amber-50/70 border border-amber-200/90 shadow-2xs'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`absolute -left-[14px] top-2.5 w-2.5 h-2.5 rounded-full ring-4 ring-white ${
                        isHearing ? 'bg-amber-600' : 'bg-indigo-700'
                      }`}
                    ></div>
                    <div className="flex items-center justify-between gap-1">
                      <div className="font-black text-[11px] text-indigo-900 flex items-center gap-1.5">
                        {isHearing && <Gavel className="w-3 h-3 text-amber-700" />}
                        <span>{event.date}</span>
                      </div>
                      {event.impact_badge && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                          {event.impact_badge}
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-slate-900 mt-0.5 leading-snug">{event.title}</div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">{event.description}</p>
                    {event.bench_direction && (
                      <div className="mt-1 p-1.5 rounded-lg bg-white/90 border border-amber-200 text-[10px] font-medium text-amber-950">
                        <span className="font-bold text-amber-800">Direction: </span>
                        {event.bench_direction}
                      </div>
                    )}
                    {event.next_date && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-indigo-800">
                        <Calendar className="w-3 h-3 text-indigo-600" />
                        <span>Next Date: {event.next_date}</span>
                      </div>
                    )}
                    <div className="mt-1 text-[10px] text-slate-400 font-mono truncate">
                      Source: {event.source.doc_name} ({event.source.page_or_clause || event.source.date})
                    </div>
                  </div>
                );
              })}
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

              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  onClick={() => {
                    setHearingCourt(activeMatter.court_forum || 'Court No. 3, High Court');
                    setShowHearingModal(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs flex items-center gap-1.5 transition shadow-2xs cursor-pointer shrink-0"
                >
                  <Gavel className="w-3.5 h-3.5 text-amber-700" />
                  <span>Log Court Hearing</span>
                </button>
                <button
                  onClick={() => {
                    setEvidenceTextInput(activeMatter.sample_enrichment_text);
                    setEvidenceDocInput(activeMatter.sample_enrichment_doc_name);
                    setShowAddEvidenceModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white font-extrabold text-xs flex items-center gap-2 transition shadow-xs cursor-pointer shrink-0"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Add Evidence</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-800 text-indigo-200">Demo</span>
                </button>
              </div>
            </div>

            {/* Dispute Description & Subject Matter (Substantive Claims & Legal Issues) */}
            <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-1">
              <div className="text-[10px] font-extrabold uppercase text-indigo-900 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-indigo-700" />
                <span>Dispute Description & Subject Matter (Substantive Claims & Legal Issues)</span>
              </div>
              <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                {activeMatter.dispute_description || 'No dispute description specified for this matter.'}
              </p>
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

                  {/* Parties List Cards with Edit / Delete CTAs (3 columns) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {activeMatter.parties.map((p) => (
                      <div key={p.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 relative group flex flex-col justify-between">
                        <div>
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

                          <div className="mt-2">
                            <div className="font-black text-sm text-slate-900 leading-snug">{p.name}</div>
                            <div className="text-[11px] text-slate-500 font-medium">{p.entity_type}</div>
                            {p.contact_person && (
                              <div className="text-[11px] text-slate-600 mt-1.5">
                                <strong>Contact / Key Person:</strong> {p.contact_person}
                              </div>
                            )}
                            {p.address && <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">{p.address}</div>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Forum & Claim Scope Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                      <div className="text-[10px] font-extrabold uppercase text-slate-400">Court / Forum Jurisdiction</div>
                      <div className="font-black text-slate-900 mt-1 text-xs">{activeMatter.court_forum}</div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                      <div className="text-[10px] font-extrabold uppercase text-slate-400">Total Claim Amount / Financial Scope</div>
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 animate-scaleIn space-y-4 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-900">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">New Legal Case Intake Workspace</h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Configure matter domain or upload brief for AI automated classification & field mapping
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewCaseModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step 1: Case Domain Classification Pill Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                  1. Select Legal Domain / Case Category
                </label>
                <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  {CASE_CATEGORY_CONFIG[newCaseCategory].badge}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {(Object.keys(CASE_CATEGORY_CONFIG) as CaseCategory[]).map((catKey) => {
                  const item = CASE_CATEGORY_CONFIG[catKey];
                  const Icon = item.icon;
                  const isSelected = newCaseCategory === catKey;
                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => handleSelectCategory(catKey)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-950 text-white border-indigo-950 shadow-md ring-2 ring-indigo-300'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-indigo-200' : 'text-slate-600'}`} />
                      <span className="text-[11px] font-bold leading-tight">{item.label.split(' ')[0]}</span>
                      <span className={`text-[9px] mt-0.5 line-clamp-1 ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                        {catKey === 'constitutional' ? 'Writ/Art 226' : catKey === 'criminal' ? 'BNS/FIR' : catKey === 'commercial' ? 'Contract' : catKey === 'arbitration' ? 'DIAC/Sec 21' : 'CPC Relief'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fast-Track AI Document Auto-Detect & Sample Presets */}
            <div className="bg-gradient-to-r from-slate-50 to-indigo-50/40 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Wand2 className="w-3.5 h-3.5 text-indigo-700" />
                  <span>AI Fast-Track: Auto-Fill or Drop Initial Document</span>
                </div>
                {detectedBadgeText && (
                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 animate-pulse">
                    {detectedBadgeText}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset(newCaseCategory)}
                  disabled={isAutoDetecting}
                  className="px-2.5 py-1 text-[11px] font-bold bg-white text-indigo-900 border border-indigo-200 rounded-lg hover:bg-indigo-50 shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  <span>Load {CASE_CATEGORY_CONFIG[newCaseCategory].label} Preset Brief</span>
                </button>

                <label className="px-2.5 py-1 text-[11px] font-bold bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 shadow-2xs cursor-pointer flex items-center gap-1">
                  <FileUp className="w-3 h-3 text-slate-600" />
                  <span>Drop / Upload Brief PDF</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleSimulatedDocDrop(e.target.files[0].name);
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Step 2: Dynamically Tuned Form Fields for Selected Category */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                  Matter Title & Reference
                </label>
                <input
                  type="text"
                  value={newCaseTitle}
                  onChange={(e) => setNewCaseTitle(e.target.value)}
                  placeholder={CASE_CATEGORY_CONFIG[newCaseCategory].presetSample.title}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* Dynamic Parties */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-600 mb-1 flex items-center justify-between">
                    <span>{CASE_CATEGORY_CONFIG[newCaseCategory].party1Label}</span>
                    <span className="text-[9px] text-slate-400 font-normal">Initiating Party</span>
                  </label>
                  <input
                    type="text"
                    value={newCaseParty1}
                    onChange={(e) => setNewCaseParty1(e.target.value)}
                    placeholder={CASE_CATEGORY_CONFIG[newCaseCategory].party1Placeholder}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-600 mb-1 flex items-center justify-between">
                    <span>{CASE_CATEGORY_CONFIG[newCaseCategory].party2Label}</span>
                    <span className="text-[9px] text-slate-400 font-normal">Opposing Party</span>
                  </label>
                  <input
                    type="text"
                    value={newCaseParty2}
                    onChange={(e) => setNewCaseParty2(e.target.value)}
                    placeholder={CASE_CATEGORY_CONFIG[newCaseCategory].party2Placeholder}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Forum & Valuation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-600 mb-1">
                    Forum / Adjudicating Authority
                  </label>
                  <input
                    type="text"
                    value={newCaseCourt}
                    onChange={(e) => setNewCaseCourt(e.target.value)}
                    placeholder={CASE_CATEGORY_CONFIG[newCaseCategory].courtDefault}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-600 mb-1">
                    {CASE_CATEGORY_CONFIG[newCaseCategory].valueLabel}
                  </label>
                  <input
                    type="text"
                    value={newCaseClaim}
                    onChange={(e) => setNewCaseClaim(e.target.value)}
                    placeholder={CASE_CATEGORY_CONFIG[newCaseCategory].valuePlaceholder}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Secondary Reference (Contract / FIR / Notification / Clause) */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-600 mb-1">
                  {CASE_CATEGORY_CONFIG[newCaseCategory].secondaryRefLabel}
                </label>
                <input
                  type="text"
                  value={newCaseSecondaryRef}
                  onChange={(e) => setNewCaseSecondaryRef(e.target.value)}
                  placeholder={CASE_CATEGORY_CONFIG[newCaseCategory].secondaryRefPlaceholder}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* Dispute Description */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-600 mb-1">
                  {CASE_CATEGORY_CONFIG[newCaseCategory].disputeLabel}
                </label>
                <textarea
                  rows={2}
                  value={newCaseDisputeDescription}
                  onChange={(e) => setNewCaseDisputeDescription(e.target.value)}
                  placeholder={CASE_CATEGORY_CONFIG[newCaseCategory].disputePlaceholder}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* Ready Reckoner Auto-Provisioning Preview */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-700" />
                  <span className="text-[10px] font-bold text-slate-600">Auto-Provisioned Statutory Reckoners:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {CASE_CATEGORY_CONFIG[newCaseCategory].defaultSections.map((secCode) => (
                    <span
                      key={secCode}
                      className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {STATUTORY_RECKONER_DB[secCode]?.short_label || secCode}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-medium">
                Workspace will load customized evidentiary rules and statutory checklists.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNewCaseModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNewCase}
                  className="px-4 py-2 rounded-xl text-xs font-extrabold bg-indigo-900 hover:bg-indigo-950 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <FolderKanban className="w-3.5 h-3.5" />
                  <span>Create {CASE_CATEGORY_CONFIG[newCaseCategory].label.split(' ')[0]} Case</span>
                </button>
              </div>
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
      {/* 6. MODAL: LOG COURT HEARING & DAILY ORDER SHEET */}
      {/* --------------------------------------------------------------------- */}
      {showHearingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                  <Gavel className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Log Court Hearing & Daily Order Sheet</h3>
                  <p className="text-xs text-slate-500">Record bench proceedings, interim orders, and next compliance directives</p>
                </div>
              </div>
              <button
                onClick={() => setShowHearingModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Quick Outcome Presets */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Quick Outcome Templates</label>
                  <span className="text-[11px] text-amber-800 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    Auto-fills directions & updates findings
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectHearingPreset('stay_granted')}
                    className="px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-900 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <ShieldAlert className="w-3 h-3 text-rose-600" />
                    <span>Interim Stay Granted</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectHearingPreset('counter_affidavit')}
                    className="px-2.5 py-1.5 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-900 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>Counter-Affidavit Directed (4 Wks)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectHearingPreset('settlement')}
                    className="px-2.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Scale className="w-3 h-3 text-indigo-600" />
                    <span>Referred to Mediation / Lok Adalat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectHearingPreset('reserved')}
                    className="px-2.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Arguments Concluded (Judgment Reserved)</span>
                  </button>
                </div>
              </div>

              {/* Court Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Hearing Date *</label>
                  <input
                    type="date"
                    value={hearingDate}
                    onChange={(e) => setHearingDate(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Presiding Court / Forum *</label>
                  <input
                    type="text"
                    value={hearingCourt}
                    onChange={(e) => setHearingCourt(e.target.value)}
                    placeholder="e.g. High Court - Court 3"
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Stage of Matter</label>
                  <select
                    value={hearingStage}
                    onChange={(e) => setHearingStage(e.target.value as HearingRecord['proceeding_stage'])}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                  >
                    <option value="Notice Returnable">Notice Returnable / Pleadings</option>
                    <option value="Interim Arguments">Interim Arguments / Stay Injunction</option>
                    <option value="Framing of Issues">Framing of Issues / Directions</option>
                    <option value="Evidence / Cross">Evidence / Cross-Examination</option>
                    <option value="Final Hearing">Final Hearing / Arguments</option>
                    <option value="Order Reserved">Order Reserved / Pronouncement</option>
                  </select>
                </div>
              </div>

              {/* Order Summary & Outcome */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Bench Daily Order Summary *</label>
                  <span className="text-[11px] text-slate-400">Oral or formal order text</span>
                </div>
                <textarea
                  rows={3}
                  value={hearingOrderSummary}
                  onChange={(e) => setHearingOrderSummary(e.target.value)}
                  placeholder="Record summary of arguments presented by Senior Counsel, queries raised by the Hon'ble Bench, and daily ruling..."
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 leading-relaxed"
                />
              </div>

              {/* Directions & Compliance */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Bench Directions & Next Steps</label>
                <input
                  type="text"
                  value={hearingDirections}
                  onChange={(e) => setHearingDirections(e.target.value)}
                  placeholder="e.g. Respondent to file rejoinder within 2 weeks; maintain status quo on encashment"
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Next Hearing Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Next Hearing / Returnable Date</label>
                  <input
                    type="date"
                    value={hearingNextDate}
                    onChange={(e) => setHearingNextDate(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <div className="p-3 rounded-xl border border-amber-200/80 bg-amber-50/50 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                    Logging this hearing automatically updates the <strong>Reverse-Chronological Timeline</strong>, attaches the daily order badge, and refreshes the matter&apos;s active status.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <button
                type="button"
                onClick={() => setShowHearingModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveHearingUpdate}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <Gavel className="w-3.5 h-3.5" />
                <span>Save Court Update & Refresh Matter</span>
              </button>
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
