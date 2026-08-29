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

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { hasPermissionScope, loadRoutePermissionsFromDB } from '@/lib/config/route_permissions';
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
  MessageSquare,
  Handshake,
  Search,
  Briefcase,
  Tag,
  UploadCloud,
  Image as ImageIcon,
  Paperclip,
  Save,
} from 'lucide-react';
import {
  ALL_MATTERS,
  MatterCase,
  CaseGap,
  CaseParty,
  UploadedDoc,
  ExtractedDocClause,
  StatutoryReadyReckoner,
  HistoricalPrecedent,
  STATUTORY_RECKONER_DB,
  generateDraftDocument,
  HearingRecord,
  TimelineEvent,
  SourceRef,
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
    disputePlaceholder:
      'e.g. Unpaid milestone invoices, supply delay penalties, unilateral debit note deductions...',
    defaultSections: ['sec12a_cca', 'sec21_arb', 'sec63_bsa'],
    presetSample: {
      title: 'Apex Steel Ltd. v. Zenith Infrastructure Corp',
      party1: 'Apex Steel Ltd. (Through Arvind Malhotra, Director)',
      party2: 'Zenith Infrastructure Corp LLP (Designated Partner)',
      court: 'Commercial Court, Patiala House Courts, New Delhi',
      value: '₹1,85,00,000',
      secondaryRef: 'Master Supply Agreement Ref: MSA-2024/09',
      dispute:
        'Recovery of unpaid structural steel invoices with belated debit notes raised after 15-day inspection window.',
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
    disputePlaceholder:
      'e.g. Cheating under Sec 318(4) BNS, dishonest inducement at inception, criminal breach of trust (Sec 316 BNS)...',
    defaultSections: [
      'sec318_bns',
      'sec316_bns',
      'sec35_bnss',
      'sec528_bnss',
      'sec138_ni_act',
      'sec63_bsa',
    ],
    presetSample: {
      title: 'State (Shivam Polymers) v. Rajesh Bansal & Anr.',
      party1: 'Shivam Polymers Pvt Ltd (Vikram Sethi, Director)',
      party2: 'Rajesh Bansal (Managing Director, Bansal Packaging)',
      court: 'Court of Chief Metropolitan Magistrate (CMM), Tis Hazari Courts, Delhi',
      value: '₹92,00,000',
      secondaryRef: 'FIR No. 142/2026, PS EOW Central',
      dispute:
        'Accused dishonestly induced delivery of 80 MT Polymer Granules and issued post-dated cheques from a closed bank account.',
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
    disputePlaceholder:
      'e.g. Retrospective tariff amendment violating Article 14, 19(1)(g) and doctrine of legitimate expectation without hearing...',
    defaultSections: ['art226_writ', 'sec63_bsa'],
    presetSample: {
      title: 'Sunray Clean Energy Ltd. v. Union of India & Anr.',
      party1: 'Sunray Clean Energy Solutions Ltd.',
      party2: 'Union of India (Ministry of Power) & SECI',
      court: 'High Court of Delhi (Writ Jurisdiction - DB)',
      value: '500 MW PPA Tariff Rights',
      secondaryRef: 'MoP Circular F.No. 44/2025/Solar',
      dispute:
        'Writ Petition under Article 226 challenging retrospective tariff rollback without opportunity of hearing.',
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
    disputePlaceholder:
      'e.g. Section 21 notice invoked for non-issuance of work completion certificate and prolonged right-of-way handover...',
    defaultSections: ['sec21_arb', 'sec12a_cca', 'sec63_bsa'],
    presetSample: {
      title: 'Global Metro Consortium v. National Rail Corp',
      party1: 'Global Metro Consortium Ltd.',
      party2: 'National High Speed Rail Corp',
      court: 'Delhi International Arbitration Centre (DIAC)',
      value: '₹24,50,00,000',
      secondaryRef: 'GCC Clause 20.6 (DIAC Rules, New Delhi Seat)',
      dispute:
        'Dispute referred to arbitration under Section 21 for unpaid milestone bills and prolongation costs.',
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
    disputePlaceholder:
      'e.g. Suit for specific performance of sale deed and temporary injunction under Order 39 Rules 1 & 2 CPC against third-party sale...',
    defaultSections: ['order39_cpc', 'sec63_bsa', 'sec12a_cca'],
    presetSample: {
      title: 'Rameshwar Dayal v. Grand Heritage Estates Pvt Ltd',
      party1: 'Rameshwar Dayal',
      party2: 'Grand Heritage Estates Pvt Ltd',
      court: 'District Court Saket, New Delhi',
      value: '₹65,00,000',
      secondaryRef: 'Agreement to Sell dated 18 May 2023',
      dispute:
        'Suit for specific performance of registered Agreement to Sell with urgent Order 39 injunction.',
    },
  },
};

export default function LegalPilotInteractiveWorkspacePage() {
  // Active Case State
  const [selectedCaseCode, setSelectedCaseCode] = useState<string>('orion_v_delta');
  const [activeMatter, setActiveMatter] = useState<MatterCase>(ALL_MATTERS['orion_v_delta']);

  // User & Permission State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  useEffect(() => {
    async function initUser() {
      try {
        await loadRoutePermissionsFromDB().catch(() => {});
        const user = await api.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          setUserPermissions(user.permissions || []);
        }
      } catch (err) {
        console.warn('Could not load user permissions for Autopilot:', err);
      }
    }
    initUser();
  }, []);

  // Permission Scopes
  const canEditCase =
    userPermissions.length === 0 ||
    hasPermissionScope(userPermissions, '*:*:*') ||
    hasPermissionScope(userPermissions, 'legal:*:*') ||
    hasPermissionScope(userPermissions, 'legal:autopilot:edit') ||
    hasPermissionScope(userPermissions, 'legal:autopilot:*');

  const canIngestEvidence =
    userPermissions.length === 0 ||
    hasPermissionScope(userPermissions, '*:*:*') ||
    hasPermissionScope(userPermissions, 'legal:*:*') ||
    hasPermissionScope(userPermissions, 'legal:autopilot:evidence') ||
    hasPermissionScope(userPermissions, 'legal:autopilot:*');

  const canDraftNotices =
    userPermissions.length === 0 ||
    hasPermissionScope(userPermissions, '*:*:*') ||
    hasPermissionScope(userPermissions, 'legal:*:*') ||
    hasPermissionScope(userPermissions, 'legal:autopilot:draft') ||
    hasPermissionScope(userPermissions, 'legal:autopilot:*');

  // Accordion Step Expansion State (5 Sequential Stages)
  const [openStages, setOpenStages] = useState<Record<number, boolean>>({
    1: true, // Case Details & Parties
    2: true, // Case Activity Log & Timeline Flow
    3: false, // AI Verified Facts & Statutory References
    4: true, // Gap Analysis (Star feature)
    5: false, // Strategy Branches & Pleadings
  });

  // Selected Item Drawers & Modals
  const [selectedReckoner, setSelectedReckoner] = useState<StatutoryReadyReckoner | null>(null);
  const [reckonerTab, setReckonerTab] = useState<'summary' | 'bare_act'>('summary');

  const [selectedDocForDrawer, setSelectedDocForDrawer] = useState<UploadedDoc | null>(null);
  const [isEditingDoc, setIsEditingDoc] = useState<boolean>(false);
  const [editDocFilename, setEditDocFilename] = useState<string>('');
  const [editDocType, setEditDocType] = useState<string>('Commercial Contract');
  const [editDocPages, setEditDocPages] = useState<number>(1);
  const [editDocFileSize, setEditDocFileSize] = useState<string>('1.0 MB');
  const [editDocDate, setEditDocDate] = useState<string>('');
  const [editDocProvenance, setEditDocProvenance] = useState<string>('Client Direct Submission');
  const [editDocStatus, setEditDocStatus] = useState<'Parsed' | 'Supplemental'>('Parsed');
  const [editDocDescription, setEditDocDescription] = useState<string>('');
  const [editDocTags, setEditDocTags] = useState<string>('');
  const [editDocRawOcr, setEditDocRawOcr] = useState<string>('');
  const [editDocClauses, setEditDocClauses] = useState<ExtractedDocClause[]>([]);
  const [editDocGaps, setEditDocGaps] = useState<string>('');

  // Party Management Modal State
  const [showPartyModal, setShowPartyModal] = useState<boolean>(false);
  const [editingPartyId, setEditingPartyId] = useState<string | null>(null);
  const [partyName, setPartyName] = useState<string>('');
  const [partyRole, setPartyRole] = useState<CaseParty['role']>('Claimant / Creditor');
  const [partyType, setPartyType] = useState<CaseParty['entity_type']>('Private Limited Company');
  const [partyAddress, setPartyAddress] = useState<string>('');
  const [partyContact, setPartyContact] = useState<string>('');

  // Add Evidence to Workspace Modal States
  const [showAddEvidenceModal, setShowAddEvidenceModal] = useState<boolean>(false);
  const [evidenceDocInput, setEvidenceDocInput] = useState<string>('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceDocType, setEvidenceDocType] = useState<string>('Commercial Contract');
  const [evidenceProvenance, setEvidenceProvenance] = useState<string>('Client Direct Submission');
  const [evidenceDate, setEvidenceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [evidencePages, setEvidencePages] = useState<number>(1);
  const [evidenceFileSize, setEvidenceFileSize] = useState<string>('1.2 MB');
  const [evidenceDescription, setEvidenceDescription] = useState<string>('');
  const [evidenceTags, setEvidenceTags] = useState<string>('');
  const [isDraggingEvidence, setIsDraggingEvidence] = useState<boolean>(false);

  // Evidence Tag Suggestions
  const suggestedEvidenceTags = [
    'Primary Contract',
    'Annexure',
    'Bank Guarantee',
    'Site Photo',
    'WhatsApp Export',
    'Debt Acknowledgment',
    'Tax Invoice / Challan',
    'Statutory Demand',
    'Section 18 Limitation',
  ];

  const handleToggleEvidenceTag = (tag: string) => {
    const list = evidenceTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const exists = list.some((t) => t.toLowerCase() === tag.toLowerCase());
    if (exists) {
      const filtered = list.filter((t) => t.toLowerCase() !== tag.toLowerCase());
      setEvidenceTags(filtered.join(', '));
    } else {
      const appended = [...list, tag];
      setEvidenceTags(appended.join(', '));
    }
  };

  const handleEvidenceFileSelect = (file: File) => {
    setEvidenceFile(file);
    setEvidenceDocInput(file.name);
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    const sizeInKB = (file.size / 1024).toFixed(0);
    setEvidenceFileSize(file.size > 1024 * 1024 ? `${sizeInMB} MB` : `${sizeInKB} KB`);

    // Auto infer file type
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
      setEvidenceDocType('Site Inspection Photo / Visual');
      setEvidencePages(1);
    } else if (lowerName.endsWith('.md') || lowerName.endsWith('.txt')) {
      setEvidenceDocType('WhatsApp / Email / Note Export');
      setEvidencePages(1);
    } else if (lowerName.endsWith('.pdf')) {
      setEvidenceDocType('Commercial Contract');
      setEvidencePages(Math.max(1, Math.round(file.size / 70000)));
    }
  };

  const handleOpenAddEvidence = (presetDocName?: string) => {
    setEvidenceDocInput(presetDocName || '');
    setEvidenceFile(null);
    setEvidenceDocType('Commercial Contract');
    setEvidenceProvenance('Client Direct Submission');
    setEvidenceDate(new Date().toISOString().split('T')[0]);
    setEvidencePages(3);
    setEvidenceFileSize('450 KB');
    setEvidenceDescription('');
    setEvidenceTags('');
    setIsDraggingEvidence(false);
    setShowAddEvidenceModal(true);
  };

  // New Case Intake Modal States
  const [showNewCaseModal, setShowNewCaseModal] = useState<boolean>(false);
  const [newCaseCategory, setNewCaseCategory] = useState<CaseCategory>('commercial');
  const [newCaseTitle, setNewCaseTitle] = useState<string>('');
  const [newCaseParty1, setNewCaseParty1] = useState<string>('');
  const [newCaseParty2, setNewCaseParty2] = useState<string>('');
  const [newCaseCourt, setNewCaseCourt] = useState<string>(
    CASE_CATEGORY_CONFIG.commercial.courtDefault,
  );
  const [newCaseClaim, setNewCaseClaim] = useState<string>(
    CASE_CATEGORY_CONFIG.commercial.claimDefault,
  );
  const [newCaseSecondaryRef, setNewCaseSecondaryRef] = useState<string>('');
  const [newCaseDisputeDescription, setNewCaseDisputeDescription] = useState<string>('');
  const [isAutoDetecting, setIsAutoDetecting] = useState<boolean>(false);
  const [detectedBadgeText, setDetectedBadgeText] = useState<string | null>(null);

  const [showDraftModal, setShowDraftModal] = useState<boolean>(false);
  const [currentDraft, setCurrentDraft] = useState<{ title: string; content: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Case Activity Log & Update Modal States
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [editingUpdateId, setEditingUpdateId] = useState<string | null>(null);
  const [updateCategory, setUpdateCategory] = useState<
    | 'Client Discussion'
    | 'Counsel Strategy'
    | 'Court / Tribunal Hearing'
    | 'Settlement / Negotiation'
    | 'General Note'
    | 'Others'
  >('Court / Tribunal Hearing');
  const [updateDate, setUpdateDate] = useState<string>('2026-02-28');
  const [updateTitle, setUpdateTitle] = useState<string>('');
  const [updateNotes, setUpdateNotes] = useState<string>('');
  const [updateActionPoint, setUpdateActionPoint] = useState<string>('');
  const [updatePeopleInvolved, setUpdatePeopleInvolved] = useState<string>('');
  const [updateNextDate, setUpdateNextDate] = useState<string>('');
  const [updateHasDoc, setUpdateHasDoc] = useState<boolean>(false);
  const [updateDocName, setUpdateDocName] = useState<string>('');
  const [updateDocClause, setUpdateDocClause] = useState<string>('');

  // Key people suggestions from active matter parties + common roles
  const suggestedPeople = useMemo(() => {
    const fromParties = activeMatter.parties
      .map((p) => p.contact_person || p.name)
      .filter(Boolean);
    const standardRoles = [
      'Client CFO / MD',
      'Senior Advocate',
      'Respondent Legal Head',
      'Arbitrator / Bench',
    ];
    return Array.from(new Set([...fromParties, ...standardRoles])).slice(0, 8);
  }, [activeMatter.parties]);

  // Toggle person suggestion into comma-separated text field
  const handleTogglePersonSuggestion = (person: string) => {
    const list = updatePeopleInvolved
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    const exists = list.some((p) => p.toLowerCase() === person.toLowerCase());
    if (exists) {
      const filtered = list.filter((p) => p.toLowerCase() !== person.toLowerCase());
      setUpdatePeopleInvolved(filtered.join(', '));
    } else {
      const appended = [...list, person];
      setUpdatePeopleInvolved(appended.join(', '));
    }
  };

  // Main Panel Timeline Filter & Search
  const [timelineFilter, setTimelineFilter] = useState<
    'all' | 'client' | 'counsel' | 'hearing' | 'settlement' | 'general' | 'others'
  >('all');
  const [timelineSearch, setTimelineSearch] = useState<string>('');

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
    setOpenStages({ 1: true, 2: true, 3: false, 4: false, 5: true, 6: false });
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
      if (
        name.includes('fir') ||
        name.includes('bns') ||
        name.includes('cheque') ||
        name.includes('police')
      ) {
        targetCat = 'criminal';
      } else if (
        name.includes('writ') ||
        name.includes('petition') ||
        name.includes('article') ||
        name.includes('ppa')
      ) {
        targetCat = 'constitutional';
      } else if (
        name.includes('arbitration') ||
        name.includes('diac') ||
        name.includes('section 21')
      ) {
        targetCat = 'arbitration';
      } else if (
        name.includes('suit') ||
        name.includes('injunction') ||
        name.includes('property')
      ) {
        targetCat = 'civil';
      }
      handleApplyPreset(targetCat);
      setDetectedBadgeText(
        `Auto-Classified: ${CASE_CATEGORY_CONFIG[targetCat].badge} (99.4% confidence)`,
      );
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
          : p,
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

  // Document Edit Handlers
  const handleStartEditDoc = (doc?: UploadedDoc) => {
    const targetDoc = doc || selectedDocForDrawer;
    if (!targetDoc) return;
    setEditDocFilename(targetDoc.filename);
    setEditDocType(targetDoc.doc_type || 'Commercial Contract');
    setEditDocPages(targetDoc.pages || 1);
    setEditDocFileSize(targetDoc.file_size || '1.0 MB');
    setEditDocDate(targetDoc.date || 'Today');
    setEditDocProvenance(targetDoc.provenance || 'Client Direct Submission');
    setEditDocStatus(targetDoc.status || 'Parsed');
    setEditDocDescription(targetDoc.description || '');
    setEditDocTags(targetDoc.tags ? targetDoc.tags.join(', ') : '');
    setEditDocRawOcr(targetDoc.raw_ocr_snippet || '');
    setEditDocClauses(
      targetDoc.extracted_clauses && targetDoc.extracted_clauses.length > 0
        ? JSON.parse(JSON.stringify(targetDoc.extracted_clauses))
        : []
    );
    setEditDocGaps(targetDoc.associated_gaps ? targetDoc.associated_gaps.join(', ') : '');
    if (!selectedDocForDrawer || selectedDocForDrawer.id !== targetDoc.id) {
      setSelectedDocForDrawer(targetDoc);
    }
    setIsEditingDoc(true);
  };

  const handleCancelEditDoc = () => {
    setIsEditingDoc(false);
  };

  const handleToggleEditDocTag = (tag: string) => {
    const list = editDocTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const exists = list.some((t) => t.toLowerCase() === tag.toLowerCase());
    if (exists) {
      const filtered = list.filter((t) => t.toLowerCase() !== tag.toLowerCase());
      setEditDocTags(filtered.join(', '));
    } else {
      const appended = [...list, tag];
      setEditDocTags(appended.join(', '));
    }
  };

  const handleAddClauseToDoc = () => {
    setEditDocClauses([
      ...editDocClauses,
      {
        clause_number: `Clause ${editDocClauses.length + 1}`,
        clause_title: 'New Clause / Provision',
        extracted_snippet: '',
        legal_impact: '',
      },
    ]);
  };

  const handleUpdateClauseField = (
    index: number,
    field: keyof ExtractedDocClause,
    value: string
  ) => {
    const updated = [...editDocClauses];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setEditDocClauses(updated);
  };

  const handleDeleteClauseFromDoc = (index: number) => {
    setEditDocClauses(editDocClauses.filter((_, i) => i !== index));
  };

  const handleSaveEditDoc = () => {
    if (!selectedDocForDrawer) return;
    if (!editDocFilename.trim()) {
      triggerToast('Document title/filename cannot be empty');
      return;
    }

    const tagsArray = editDocTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const gapsArray = editDocGaps
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean);

    const updatedDoc: UploadedDoc = {
      ...selectedDocForDrawer,
      filename: editDocFilename.trim(),
      doc_type: editDocType.trim() || 'Commercial Contract',
      pages: Number(editDocPages) || 1,
      file_size: editDocFileSize.trim() || '1.0 MB',
      date: editDocDate || selectedDocForDrawer.date || 'Today',
      provenance: editDocProvenance,
      status: editDocStatus,
      description: editDocDescription.trim(),
      tags: tagsArray,
      raw_ocr_snippet: editDocRawOcr.trim(),
      extracted_clauses: editDocClauses.filter(
        (cl) => cl.clause_title.trim() || cl.extracted_snippet.trim() || cl.clause_number.trim()
      ),
      associated_gaps: gapsArray,
    };

    const updatedMatter = { ...activeMatter };
    updatedMatter.documents = updatedMatter.documents.map((d) =>
      d.id === updatedDoc.id ? updatedDoc : d
    );
    setActiveMatter(updatedMatter);
    setSelectedDocForDrawer(updatedDoc);
    setIsEditingDoc(false);
    triggerToast(`Document "${updatedDoc.filename}" updated successfully.`);
  };

  // Delete Document
  const handleDeleteDocument = (docId: string) => {
    const updated = { ...activeMatter };
    updated.documents = updated.documents.filter((d) => d.id !== docId);
    setActiveMatter(updated);
    setSelectedDocForDrawer(null);
    setIsEditingDoc(false);
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
              extracted_snippet:
                newCaseDisputeDescription.trim() ||
                'Accused dishonestly induced complainant to supply goods against closed account cheques.',
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
          plain_english_explanation:
            'Offence punishable up to 7 years requires mandatory notice of appearance under Arnesh Kumar / Satender Antil guidelines.',
          statutory_or_clause_ref: 'Section 35(3), Bharatiya Nagarik Suraksha Sanhita 2023',
          source: { title: 'Statutory Procedure', doc_name: 'BNSS Code' },
          suggested_fix:
            'Submit formal written cooperation reply to Investigating Officer with acknowledgment receipt.',
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
              extracted_snippet:
                newCaseDisputeDescription.trim() ||
                'Unilateral withdrawal of feed-in tariff without opportunity of hearing.',
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
          plain_english_explanation:
            'High Court writ entertainable under Whirlpool doctrine when patent breach of natural justice or jurisdictional excess is shown.',
          statutory_or_clause_ref: 'Article 226, Constitution of India',
          source: { title: 'Constitutional Law', doc_name: 'Writ Guidelines' },
          suggested_fix:
            'Demonstrate absence of efficacious alternative forum and urgency of interim stay.',
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
              extracted_snippet:
                'All disputes shall be referred to institutional arbitration in New Delhi.',
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
          plain_english_explanation:
            'Statutory prerequisite under Sec 21 before filing Section 11(6) appointment petition before High Court.',
          statutory_or_clause_ref: 'Section 21, Arbitration and Conciliation Act 1996',
          source: { title: 'Arbitration Law', doc_name: 'Arbitration Act' },
          suggested_fix:
            'Serve speed post invocation notice proposing panel of 3 independent arbitrators.',
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
              extracted_snippet:
                newCaseDisputeDescription.trim() ||
                'Payment due in 30 days. Belated defect claims barred post 15-day window.',
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
          plain_english_explanation:
            'Prior to filing in Commercial Court, Section 12A mediation must be initiated before DSLSA per Patil Automation.',
          statutory_or_clause_ref: 'Section 12A, Commercial Courts Act 2015',
          source: { title: 'Commercial Courts Act', doc_name: 'Commercial Courts Act' },
          suggested_fix:
            'Generate Form 1 application for mediation before Legal Services Authority.',
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
      statutory_sections:
        targetSections.length > 0 ? targetSections : activeMatter.statutory_sections,
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
      sample_enrichment_text:
        'Opposite party sent formal communication acknowledging liability and proposing settlement.',
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

  // Apply Evidence (Dynamic Ingestion & Enrichment)
  const handleApplyEvidence = () => {
    if (!evidenceDocInput.trim() && !evidenceDescription.trim()) {
      triggerToast('Please upload a file, enter document name, or provide description');
      return;
    }

    const updated = JSON.parse(JSON.stringify(activeMatter)) as MatterCase;

    const tagsArray = evidenceTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    // Determine extension
    let filename = evidenceDocInput.trim() || 'Supplemental_Evidence.pdf';
    let fileExt = 'pdf';
    if (filename.includes('.')) {
      fileExt = filename.split('.').pop()?.toLowerCase() || 'pdf';
    } else {
      if (evidenceDocType.includes('Photo') || evidenceDocType.includes('Visual')) {
        filename += '.png';
        fileExt = 'png';
      } else if (evidenceDocType.includes('WhatsApp') || evidenceDocType.includes('Note')) {
        filename += '.md';
        fileExt = 'md';
      } else {
        filename += '.pdf';
        fileExt = 'pdf';
      }
    }

    const newDoc: UploadedDoc = {
      id: `doc_supp_${Date.now()}`,
      filename,
      doc_type: evidenceDocType,
      pages: Number(evidencePages) || 1,
      date: evidenceDate || 'Today',
      file_size: evidenceFileSize || '450 KB',
      status: 'Supplemental',
      description: evidenceDescription.trim() || 'Uploaded supplemental evidence artifact.',
      tags: tagsArray.length > 0 ? tagsArray : ['Supplemental', 'Discovery'],
      provenance: evidenceProvenance,
      file_ext: fileExt,
      extracted_clauses: evidenceDescription.trim()
        ? [
            {
              clause_number: 'Key Finding / Clause',
              clause_title: evidenceDocType,
              extracted_snippet: evidenceDescription.trim(),
              legal_impact: 'Admitted into matter factual repository and linked to case strategy.',
            },
          ]
        : undefined,
      raw_ocr_snippet: evidenceDescription.trim() || `OCR extract for ${filename}`,
    };

    updated.documents.push(newDoc);

    // Add Timeline Entry
    updated.timeline.unshift({
      id: `tl_supp_${Date.now()}`,
      date: evidenceDate || 'Today',
      title: `Evidence Ingested: ${filename}`,
      description:
        evidenceDescription.trim() ||
        `Supplemental document (${evidenceDocType}) received via ${evidenceProvenance}.`,
      event_type: 'Evidence',
      impact_badge: 'Evidence Ingested',
      people_involved: [evidenceProvenance],
      source: {
        title: filename,
        doc_name: filename,
        date: evidenceDate || 'Today',
      },
    });

    // Automatically resolve gaps if any open
    if (updated.gaps.length > 0 && updated.gaps.some((g) => g.status === 'Open')) {
      const firstOpen = updated.gaps.find((g) => g.status === 'Open');
      if (firstOpen) {
        firstOpen.status = 'Closed';
        firstOpen.resolution_note = `Resolved by newly ingested evidence: ${filename} (${evidenceProvenance}).`;
      }
    }

    updated.open_gaps_count = updated.gaps.filter((g) => g.status === 'Open').length;
    updated.evidence_completeness = Math.min(98, updated.evidence_completeness + 14);
    updated.matter_status = 'Post-enrichment review';
    updated.last_reviewed = 'Just now';
    updated.enrichment_applied = true;

    setActiveMatter(updated);
    setShowAddEvidenceModal(false);
    triggerToast(`Evidence "${filename}" added to workspace & analysis refreshed!`);
  };

  // Remedial CTA Trigger on a Gap
  const handleRemedialCTA = (gap: CaseGap) => {
    if (gap.remedial_cta_action_type === 'upload_doc') {
      handleOpenAddEvidence('Joint_Laboratory_Test_Report_NABL.pdf');
      setEvidenceDescription(
        'Certified joint NABL laboratory tensile test report confirming compliance with Grade Fe 500D specifications and rebuttal of late defect notice.',
      );
      setEvidenceDocType('Expert / Forensic Technical Report');
      setEvidenceProvenance('Third Party / Subpoena');
      setEvidenceTags('NABL Lab Test, Joint Inspection, Fe 500D, Quality Rebuttal');
    } else if (gap.remedial_cta_action_type === 'draft_notice') {
      const template = gap.remedial_target_template || 'draft_sec21_arbitration';
      const draft = generateDraftDocument(template, activeMatter);
      setCurrentDraft(draft);
      setShowDraftModal(true);
    } else {
      triggerToast(`Action triggered: ${gap.remedial_cta_label}`);
    }
  };

  // Category styling helper
  const getCategoryStyle = (eventType?: string, impactBadge?: string) => {
    const type = `${eventType || ''} ${impactBadge || ''}`;
    if (type.includes('Client')) {
      return {
        pillBg: 'bg-blue-100 text-blue-900 border-blue-300',
        dotBg: 'bg-blue-600',
        borderHover: 'hover:border-blue-400',
        borderBase: 'border-blue-200',
        icon: '🗣️',
        label: 'Client Discussion',
        filterKey: 'client',
      };
    }
    if (type.includes('Counsel') || type.includes('Strategy')) {
      return {
        pillBg: 'bg-purple-100 text-purple-900 border-purple-300',
        dotBg: 'bg-purple-600',
        borderHover: 'hover:border-purple-400',
        borderBase: 'border-purple-200',
        icon: '⚖️',
        label: 'Counsel Strategy',
        filterKey: 'counsel',
      };
    }
    if (type.includes('Hearing') || type.includes('Order') || type.includes('Court')) {
      return {
        pillBg: 'bg-amber-100 text-amber-900 border-amber-300',
        dotBg: 'bg-amber-500',
        borderHover: 'hover:border-amber-400',
        borderBase: 'border-amber-200/90',
        icon: '🏛️',
        label: 'Court / Tribunal Hearing',
        filterKey: 'hearing',
      };
    }
    if (type.includes('Settlement') || type.includes('Negotiation')) {
      return {
        pillBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        dotBg: 'bg-emerald-600',
        borderHover: 'hover:border-emerald-400',
        borderBase: 'border-emerald-200',
        icon: '🤝',
        label: 'Settlement / Negotiation',
        filterKey: 'settlement',
      };
    }
    if (
      type.includes('General') ||
      type.includes('Notice') ||
      type.includes('Filing') ||
      type.includes('Evidence')
    ) {
      return {
        pillBg: 'bg-slate-100 text-slate-800 border-slate-300',
        dotBg: 'bg-indigo-600',
        borderHover: 'hover:border-slate-400',
        borderBase: 'border-slate-200',
        icon: '📝',
        label: 'General Note / Milestone',
        filterKey: 'general',
      };
    }
    return {
      pillBg: 'bg-slate-100 text-slate-800 border-slate-300',
      dotBg: 'bg-slate-500',
      borderHover: 'hover:border-slate-400',
      borderBase: 'border-slate-200',
      icon: '📁',
      label: 'Others',
      filterKey: 'others',
    };
  };

  // Main Panel Filtered & Searched Timeline
  const filteredTimeline = useMemo(() => {
    const q = timelineSearch.trim().toLowerCase();
    return sortedTimeline.filter((event) => {
      const style = getCategoryStyle(event.event_type, event.impact_badge);
      const matchesFilter = timelineFilter === 'all' || style.filterKey === timelineFilter;
      const textToSearch =
        `${event.title} ${event.description} ${event.bench_direction || ''} ${event.key_action || ''} ${event.date} ${event.source?.doc_name || ''}`.toLowerCase();
      const matchesSearch = !q || textToSearch.includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [sortedTimeline, timelineFilter, timelineSearch]);

  // Open Modal for Add New Update
  const handleOpenAddUpdate = () => {
    setEditingUpdateId(null);
    setUpdateCategory('Court / Tribunal Hearing');
    setUpdateDate(new Date().toISOString().split('T')[0]);
    setUpdateTitle('');
    setUpdateNotes('');
    setUpdateActionPoint('');
    setUpdatePeopleInvolved('');
    setUpdateNextDate('');
    setUpdateHasDoc(false);
    setUpdateDocName('');
    setUpdateDocClause('');
    setShowUpdateModal(true);
  };

  // Open Modal for Editing Existing Update
  const handleOpenEditUpdate = (event: TimelineEvent) => {
    setEditingUpdateId(event.id);
    let mappedCat: typeof updateCategory = 'Others';
    const type = `${event.event_type || ''} ${event.impact_badge || ''}`;
    if (type.includes('Client')) mappedCat = 'Client Discussion';
    else if (type.includes('Counsel') || type.includes('Strategy')) mappedCat = 'Counsel Strategy';
    else if (type.includes('Hearing') || type.includes('Court') || type.includes('Order'))
      mappedCat = 'Court / Tribunal Hearing';
    else if (type.includes('Settlement') || type.includes('Negotiation'))
      mappedCat = 'Settlement / Negotiation';
    else if (type.includes('General') || type.includes('Notice') || type.includes('Filing'))
      mappedCat = 'General Note';
    else mappedCat = 'Others';

    setUpdateCategory(mappedCat);
    setUpdateDate(event.date || new Date().toISOString().split('T')[0]);
    setUpdateTitle(event.title || '');
    setUpdateNotes(event.description || '');
    setUpdateActionPoint(event.bench_direction || event.key_action || '');
    setUpdatePeopleInvolved(
      Array.isArray(event.people_involved)
        ? event.people_involved.join(', ')
        : (event.people_involved || ''),
    );
    setUpdateNextDate(event.next_date || '');
    if (event.source && (event.source.doc_name || event.source.title)) {
      setUpdateHasDoc(true);
      setUpdateDocName(event.source.doc_name || event.source.title || '');
      setUpdateDocClause(event.source.page_or_clause || '');
    } else {
      setUpdateHasDoc(false);
      setUpdateDocName('');
      setUpdateDocClause('');
    }
    setShowUpdateModal(true);
  };

  // Save Case Update (Create or Edit)
  const handleSaveUpdate = () => {
    if (!updateTitle.trim() && !updateNotes.trim()) {
      triggerToast('Please provide an update title or detailed notes');
      return;
    }

    const updated = JSON.parse(JSON.stringify(activeMatter)) as MatterCase;

    let eventType: TimelineEvent['event_type'] = 'Others';
    if (updateCategory === 'Client Discussion') eventType = 'Client Discussion';
    else if (updateCategory === 'Counsel Strategy') eventType = 'Counsel Strategy';
    else if (updateCategory === 'Court / Tribunal Hearing') eventType = 'Hearing';
    else if (updateCategory === 'Settlement / Negotiation') eventType = 'Settlement';
    else if (updateCategory === 'General Note') eventType = 'General Note';
    else eventType = 'Others';

    const sourceObj: SourceRef | undefined =
      updateHasDoc && updateDocName.trim()
        ? {
            title: updateDocName.trim(),
            doc_name: updateDocName.trim(),
            page_or_clause: updateDocClause.trim() || undefined,
            date: updateDate,
          }
        : undefined;

    const peopleArray = updatePeopleInvolved
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingUpdateId) {
      const index = updated.timeline.findIndex((e) => e.id === editingUpdateId);
      if (index !== -1) {
        updated.timeline[index] = {
          ...updated.timeline[index],
          date: updateDate,
          title: updateTitle.trim() || `${updateCategory} Update`,
          description: updateNotes.trim(),
          event_type: eventType,
          impact_badge: updateCategory,
          people_involved: peopleArray.length > 0 ? peopleArray : undefined,
          next_date: updateNextDate.trim() || undefined,
          bench_direction: updateActionPoint.trim() || undefined,
          key_action: updateActionPoint.trim() || undefined,
          source: sourceObj,
        };
      }
      triggerToast('Case update modified successfully!');
    } else {
      const newTimelineEvent: TimelineEvent = {
        id: `tl_${Date.now()}`,
        date: updateDate || 'Today',
        title: updateTitle.trim() || `${updateCategory} Update`,
        description: updateNotes.trim(),
        event_type: eventType,
        impact_badge: updateCategory,
        people_involved: peopleArray.length > 0 ? peopleArray : undefined,
        next_date: updateNextDate.trim() || undefined,
        bench_direction: updateActionPoint.trim() || undefined,
        key_action: updateActionPoint.trim() || undefined,
        source: sourceObj,
      };
      updated.timeline.unshift(newTimelineEvent);
      triggerToast('New case update logged!');
    }

    if (updateNextDate.trim()) {
      updated.next_hearing_date = updateNextDate.trim();
    }
    updated.last_reviewed = 'Just now';
    setActiveMatter(updated);
    setShowUpdateModal(false);
  };

  // Delete Case Update
  const handleDeleteUpdate = (eventId: string) => {
    const updated = JSON.parse(JSON.stringify(activeMatter)) as MatterCase;
    updated.timeline = updated.timeline.filter((e) => e.id !== eventId);
    updated.last_reviewed = 'Just now';
    setActiveMatter(updated);
    triggerToast('Case update deleted.');
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
              <span className="font-extrabold text-sm text-slate-900 tracking-tight">
                Legal Pilot
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                DEMO MODE
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Commercial Case & Statutory Ready Reckoner Workspace
            </p>
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
                <option value="cloudnet_v_starlight">
                  2. CloudNet v. Starlight (₹65L Service Termination)
                </option>
                <option value="precision_v_vanguard">
                  3. Precision Flow v. Vanguard (₹42L Summary Debt)
                </option>
                <option value="shivam_v_bansal">
                  4. State (Shivam Polymers) v. Bansal (₹92L Criminal Cheating & NI 138)
                </option>
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
                onClick={() => handleOpenAddEvidence()}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                + Upload
              </button>
            </div>

            <div className="space-y-2">
              {activeMatter.documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    setSelectedDocForDrawer(doc);
                    setIsEditingDoc(false);
                  }}
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
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEditDoc(doc);
                      }}
                      title="Edit Document"
                      className="p-1 rounded-md text-slate-400 hover:text-indigo-700 hover:bg-white transition cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <span className="text-[10px] text-indigo-600 font-bold">
                      View
                    </span>
                  </div>
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
                onClick={handleOpenAddUpdate}
                className="text-[10px] text-amber-800 hover:text-amber-950 font-extrabold bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300 cursor-pointer flex items-center gap-1 shadow-2xs transition-colors"
              >
                <Plus className="w-3 h-3 text-amber-700" />
                <span>Log Updates</span>
              </button>
            </div>

            <div className="space-y-3 relative pl-3 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {sortedTimeline.map((event) => {
                const style = getCategoryStyle(event.event_type, event.impact_badge);
                return (
                  <div
                    key={event.id}
                    onClick={() => handleOpenEditUpdate(event)}
                    className="relative pl-3 text-xs p-2 rounded-xl transition-all hover:bg-slate-50 border border-slate-200/60 bg-white/70 shadow-2xs cursor-pointer group"
                  >
                    <div
                      className={`absolute -left-[14px] top-2.5 w-2.5 h-2.5 rounded-full ring-4 ring-white ${style.dotBg}`}
                    ></div>
                    <div className="flex items-center justify-between gap-1">
                      <div className="font-black text-[11px] text-indigo-900 flex items-center gap-1.5">
                        <span>{style.icon}</span>
                        <span>{event.date}</span>
                      </div>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md border ${style.pillBg}`}>
                        {style.label}
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 mt-0.5 leading-snug group-hover:text-indigo-950">
                      {event.title}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-tight line-clamp-2">
                      {event.description}
                    </p>
                    {(event.bench_direction || event.key_action) && (
                      <div className="mt-1 p-1.5 rounded-lg bg-amber-50/60 border border-amber-200/80 text-[10px] font-medium text-amber-950">
                        <span className="font-bold text-amber-800">Action: </span>
                        {event.bench_direction || event.key_action}
                      </div>
                    )}
                    {event.next_date && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-indigo-800">
                        <Calendar className="w-3 h-3 text-indigo-600" />
                        <span>Next Date: {event.next_date}</span>
                      </div>
                    )}
                    <div className="mt-1 text-[10px] text-slate-400 font-mono truncate">
                      {event.source?.doc_name ? `Doc: ${event.source.doc_name}` : 'Direct Note / Memo'}
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
                  onClick={handleOpenAddUpdate}
                  className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs flex items-center gap-1.5 transition shadow-2xs cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-700" />
                  <span>Log Updates</span>
                </button>
                <button
                  onClick={() => {
                    handleOpenAddEvidence(activeMatter.sample_enrichment_doc_name);
                    setEvidenceDescription(activeMatter.sample_enrichment_text);
                    setEvidenceTags('WhatsApp Export, Admission, Section 18');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white font-extrabold text-xs flex items-center gap-2 transition shadow-xs cursor-pointer shrink-0"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Add Documents</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-800 text-indigo-200">
                    Demo
                  </span>
                </button>
              </div>
            </div>

            {/* Dispute Description & Subject Matter (Substantive Claims & Legal Issues) */}
            <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-1">
              <div className="text-[10px] font-extrabold uppercase text-indigo-900 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-indigo-700" />
                <span>
                  Dispute Description & Subject Matter (Substantive Claims & Legal Issues)
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                {activeMatter.dispute_description ||
                  'No dispute description specified for this matter.'}
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
              <div className="text-base font-black text-indigo-950 mt-2 capitalize">
                {activeMatter.matter_status}
              </div>
            </div>

            <div
              onClick={() => toggleStage(2)}
              className="p-4 rounded-2xl border border-slate-200 bg-white transition shadow-2xs hover:border-indigo-300 cursor-pointer"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold">Activity & Timeline</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-base font-black text-indigo-950 mt-2">
                {sortedTimeline.length} updates
              </div>
            </div>

            <div
              onClick={() => toggleStage(3)}
              className="p-4 rounded-2xl border border-slate-200 bg-white transition shadow-2xs hover:border-indigo-300 cursor-pointer"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold">Evidence completeness</span>
                <FileText className="w-4 h-4" />
              </div>
              <div className="text-base font-black text-indigo-950 mt-2">
                {activeMatter.evidence_completeness}%
              </div>
            </div>

            <div
              onClick={() => toggleStage(5)}
              className="p-4 rounded-2xl border border-slate-200 bg-white transition shadow-2xs hover:border-indigo-300 cursor-pointer"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold">Open gaps</span>
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="text-base font-black text-indigo-950 mt-2">
                {activeMatter.open_gaps_count} items
              </div>
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
                      Case Details, Parties Involved & Roles ({activeMatter.parties.length}{' '}
                      Parties)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Manage claimant, respondent, guarantors, witnesses, and jurisdiction forum.
                    </p>
                  </div>
                </div>
                {openStages[1] ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
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
                      <div
                        key={p.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 relative group flex flex-col justify-between"
                      >
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
                            <div className="font-black text-sm text-slate-900 leading-snug">
                              {p.name}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {p.entity_type}
                            </div>
                            {p.contact_person && (
                              <div className="text-[11px] text-slate-600 mt-1.5">
                                <strong>Contact / Key Person:</strong> {p.contact_person}
                              </div>
                            )}
                            {p.address && (
                              <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                                {p.address}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Forum & Claim Scope Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                      <div className="text-[10px] font-extrabold uppercase text-slate-400">
                        Court / Forum Jurisdiction
                      </div>
                      <div className="font-black text-slate-900 mt-1 text-xs">
                        {activeMatter.court_forum}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                      <div className="text-[10px] font-extrabold uppercase text-slate-400">
                        Total Claim Amount / Financial Scope
                      </div>
                      <div className="font-black text-indigo-950 mt-1 text-xs">
                        {activeMatter.claim_amount}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* =============================================================== */}
            {/* STAGE 2: CASE ACTIVITY LOG & FULL TIMELINE (APPROVED WIREFRAME) */}
            {/* =============================================================== */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <button
                onClick={() => toggleStage(2)}
                className="w-full p-4.5 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-black text-xs">
                    2
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-indigo-950">
                      Case Activity Log & Full Timeline Flow ({sortedTimeline.length} Updates)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Chronological record of court proceedings, client instructions, senior counsel conferences, and notes.
                    </p>
                  </div>
                </div>
                {openStages[2] ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {openStages[2] && (
                <div className="p-6 border-t border-slate-200 space-y-6 text-xs">
                  {/* Controls: Filter Pills, Search Bar & '+ Log New Update' CTA */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                    {/* Category Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTimelineFilter('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                          timelineFilter === 'all'
                            ? 'bg-indigo-900 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        All ({sortedTimeline.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimelineFilter('client')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          timelineFilter === 'client'
                            ? 'bg-indigo-900 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        🗣️ Client Discussion
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimelineFilter('counsel')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          timelineFilter === 'counsel'
                            ? 'bg-indigo-900 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        ⚖️ Counsel Strategy
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimelineFilter('hearing')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          timelineFilter === 'hearing'
                            ? 'bg-indigo-900 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        🏛️ Court Hearing
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimelineFilter('settlement')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          timelineFilter === 'settlement'
                            ? 'bg-indigo-900 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        🤝 Settlement
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimelineFilter('others')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          timelineFilter === 'others'
                            ? 'bg-indigo-900 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        📁 Others
                      </button>
                    </div>

                    {/* Search and + Log Update CTA */}
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <div className="relative flex-1 md:w-56">
                        <input
                          type="text"
                          value={timelineSearch}
                          onChange={(e) => setTimelineSearch(e.target.value)}
                          placeholder="Search notes, directions..."
                          className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                      </div>
                      <button
                        onClick={handleOpenAddUpdate}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 transition flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span> Log Update</span>
                      </button>
                    </div>
                  </div>

                  {/* Timeline Stream with Date Node on Left (Approved Layout) */}
                  <div className="space-y-6 relative before:absolute before:left-24 sm:before:left-28 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-300">
                    {filteredTimeline.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <p className="font-bold text-xs">No updates matching your filter or search.</p>
                      </div>
                    ) : (
                      filteredTimeline.map((event) => {
                        const style = getCategoryStyle(event.event_type, event.impact_badge);
                        return (
                          <div key={event.id} className="relative flex items-start gap-4 sm:gap-6">
                            {/* Date on Timeline Axis (Left) */}
                            <div className="w-20 sm:w-24 text-right shrink-0 pt-3">
                              <span className="text-xs font-extrabold text-slate-800 block leading-tight">
                                {event.date}
                              </span>
                            </div>
                            {/* Node Dot */}
                            <div className="relative z-10 -ml-[13px] sm:-ml-[17px] mt-3.5 shrink-0">
                              <div className={`w-4 h-4 rounded-full ${style.dotBg} ring-4 ring-white shadow-2xs`}></div>
                            </div>
                            {/* Main Card in line with timeline node */}
                            <div
                              className={`flex-1 bg-white border ${style.borderBase} rounded-2xl p-5 shadow-2xs space-y-3 ${style.borderHover} transition`}
                            >
                              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                                <span
                                  className={`px-2.5 py-0.5 rounded-lg border font-black text-xs flex items-center gap-1.5 ${style.pillBg}`}
                                >
                                  <span>{style.icon}</span>
                                  <span>{style.label}</span>
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleOpenEditUpdate(event)}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 font-bold text-xs flex items-center gap-1 cursor-pointer transition"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUpdate(event.id)}
                                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 font-bold text-xs cursor-pointer transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div>
                                <h3 className="text-sm font-extrabold text-slate-900">{event.title}</h3>
                                <p className="text-xs text-slate-700 mt-1 leading-relaxed whitespace-pre-wrap">
                                  {event.description}
                                </p>
                              </div>

                              {event.people_involved && event.people_involved.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Users className="w-3 h-3 text-indigo-700" />
                                    <span>People Involved:</span>
                                  </span>
                                  {event.people_involved.map((person, pIdx) => (
                                    <span
                                      key={pIdx}
                                      className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-semibold text-[10px] border border-slate-200 shadow-2xs"
                                    >
                                      {person}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {(event.bench_direction || event.key_action) && (
                                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1">
                                  <div className="font-extrabold text-amber-900 flex items-center gap-1.5">
                                    <span>⚡ Key Decision / Action / Direction:</span>
                                  </div>
                                  <p className="text-amber-950 font-medium leading-relaxed">
                                    {event.bench_direction || event.key_action}
                                  </p>
                                </div>
                              )}

                              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                                <div className="flex items-center gap-2 text-slate-600">
                                  {event.source?.doc_name ? (
                                    <>
                                      <span className="font-bold text-slate-500">Document Attached:</span>
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono text-[11px] border border-slate-200">
                                        <FileText className="w-3 h-3 text-rose-600" />
                                        <span>
                                          {event.source.doc_name}
                                          {event.source.page_or_clause ? ` (${event.source.page_or_clause})` : ''}
                                        </span>
                                      </span>
                                    </>
                                  ) : (
                                    <span className="italic text-slate-500 font-medium">
                                      📝 Direct Note / Memo (No document attached)
                                    </span>
                                  )}
                                </div>
                                {event.next_date && (
                                  <div className="flex items-center gap-1.5 font-bold text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>Next Date: {event.next_date}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* =============================================================== */}
            {/* STAGE 3: INGESTED DOCUMENTS (CLICKABLE DETAILS DRAWER) */}
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
                      Ingested Evidence Files & Document Intelligence (
                      {activeMatter.documents.length} Files)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Click any document to inspect extracted clauses, OCR text, and linked gaps in
                      pull-out panel.
                    </p>
                  </div>
                </div>
                {openStages[3] ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {openStages[3] && (
                <div className="p-6 border-t border-slate-200 space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">
                      Parsed Documents (Click to Inspect Extract)
                    </h4>
                    <button
                      onClick={() => handleOpenAddEvidence()}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-extrabold text-xs flex items-center gap-1 border border-indigo-200 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Evidence</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {activeMatter.documents.map((doc) => {
                      const isImg =
                        doc.filename.endsWith('.png') ||
                        doc.filename.endsWith('.jpg') ||
                        doc.filename.endsWith('.jpeg') ||
                        doc.file_ext === 'png' ||
                        doc.file_ext === 'jpg';
                      const isMd =
                        doc.filename.endsWith('.md') ||
                        doc.filename.endsWith('.txt') ||
                        doc.file_ext === 'md';

                      return (
                        <div
                          key={doc.id}
                          onClick={() => {
                            setSelectedDocForDrawer(doc);
                            setIsEditingDoc(false);
                          }}
                          className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-indigo-50/40 hover:border-indigo-300 transition shadow-2xs cursor-pointer group flex flex-col justify-between space-y-2.5"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                                    isImg
                                      ? 'bg-amber-50 text-amber-900 border-amber-200'
                                      : isMd
                                        ? 'bg-blue-50 text-blue-900 border-blue-200'
                                        : 'bg-rose-50 text-rose-900 border-rose-200'
                                  }`}
                                >
                                  {isImg ? '🖼️ IMG' : isMd ? '📝 MD' : '📄 PDF'}
                                </span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                  {doc.pages} {doc.pages === 1 ? 'Page' : 'Pages'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartEditDoc(doc);
                                  }}
                                  className="text-[10px] text-slate-500 hover:text-indigo-700 font-bold flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition cursor-pointer"
                                  title="Edit Document"
                                >
                                  <Edit3 className="w-2.5 h-2.5" />
                                  <span>Edit</span>
                                </button>
                                <span className="text-[10px] text-indigo-600 font-bold group-hover:underline flex items-center gap-0.5 shrink-0">
                                  <span>Inspect</span>
                                  <span>→</span>
                                </span>
                              </div>
                            </div>

                            <div className="mt-2">
                              <div
                                className="font-black text-xs text-slate-900 truncate"
                                title={doc.filename}
                              >
                                {doc.filename}
                              </div>
                              <div className="text-[11px] text-indigo-900 font-bold mt-0.5">
                                {doc.doc_type}
                              </div>
                              {doc.provenance && (
                                <div className="text-[10px] text-slate-500 font-medium mt-1 flex items-center gap-1">
                                  <span>Provenance:</span>
                                  <span className="font-bold text-slate-700">{doc.provenance}</span>
                                </div>
                              )}
                              {doc.description && (
                                <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-snug">
                                  {doc.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                            {doc.tags && doc.tags.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap">
                                {doc.tags.slice(0, 3).map((t, tIdx) => (
                                  <span
                                    key={tIdx}
                                    className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200"
                                  >
                                    #{t}
                                  </span>
                                ))}
                                {doc.tags.length > 3 && (
                                  <span className="text-[9px] text-slate-400 font-medium">
                                    +{doc.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                              <span>{doc.file_size}</span>
                              <span>{doc.date}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* =============================================================== */}
            {/* STAGE 4: AI VERIFIED FACTS & STATUTORY CROSS REFERENCES */}
            {/* =============================================================== */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <button
                onClick={() => toggleStage(4)}
                className="w-full p-4.5 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-900 flex items-center justify-center font-black text-xs">
                    4
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-indigo-950">
                      AI Verified Facts & Statutory Cross-References (BNS/IPC, BNSS/CrPC,
                      BSA/IEA)
                    </h3>
                    <p className="text-xs text-slate-500">
                      {activeMatter.facts.length} core facts with source links & substantive Indian
                      legal provisions.
                    </p>
                  </div>
                </div>
                {openStages[4] ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {openStages[4] && (
                <div className="p-6 border-t border-slate-200 space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeMatter.facts.map((fact) => (
                      <div
                        key={fact.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase text-slate-400">
                            {fact.category}
                          </span>
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
            {/* STAGE 5: SIGNATURE GAP ANALYSIS & REMEDIAL CTAS (STAR FEATURE) */}
            {/* =============================================================== */}
            <div className="bg-white rounded-2xl border-2 border-indigo-300 shadow-sm overflow-hidden ring-4 ring-indigo-500/5">
              <button
                onClick={() => toggleStage(5)}
                className="w-full p-4.5 bg-indigo-50/50 hover:bg-indigo-50 flex items-center justify-between text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-900 text-white flex items-center justify-center font-black text-xs">
                    5
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-sm text-indigo-950">
                      Signature Gap Analysis & Remedial Action CTAs
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
                {openStages[5] ? (
                  <ChevronUp className="w-4 h-4 text-slate-700" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-700" />
                )}
              </button>

              {openStages[5] && (
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
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {gap.plain_english_explanation}
                            </p>

                            {isClosed && gap.resolution_note && (
                              <div className="mt-2 p-2.5 rounded-xl bg-emerald-100/70 border border-emerald-300 text-xs text-emerald-900 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                                <span>{gap.resolution_note}</span>
                              </div>
                            )}

                            <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
                              <span className="text-slate-400 font-bold uppercase text-[9px]">
                                Source:
                              </span>
                              <span className="bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200 text-slate-700">
                                {gap.source.doc_name} (
                                {gap.source.page_or_clause || gap.source.date})
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
            {/* STAGE 6: STRATEGY BRANCHES & FIRST-DRAFT COURT PLEADINGS */}
            {/* =============================================================== */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <button
                onClick={() => toggleStage(6)}
                className="w-full p-4.5 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-900 flex items-center justify-center font-black text-xs">
                    6
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-indigo-950">
                      Strategy Branches & First-Draft Court Pleadings Generator
                    </h3>
                    <p className="text-xs text-slate-500">
                      Categorized procedural options & instant pre-filled Indian legal notices.
                    </p>
                  </div>
                </div>
                {openStages[6] ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {openStages[6] && (
                <div className="p-6 border-t border-slate-200 space-y-4">
                  {activeMatter.actions.map((act) => (
                    <div
                      key={act.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3"
                    >
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
                        <span className="text-xs font-bold text-indigo-900">
                          Feasibility: {act.feasibility_score}%
                        </span>
                      </div>

                      <h4 className="font-extrabold text-sm text-slate-900">{act.title}</h4>
                      <p className="text-xs text-slate-600">{act.short_description}</p>

                      <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
                        <div className="font-bold text-slate-700">
                          Prerequisites: {act.prerequisites.join(' • ')}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Ref: {act.statutory_ref}
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-xs text-slate-600">
                          Next: {act.next_procedural_steps[0]}
                        </span>
                        <button
                          onClick={() => {
                            const draft = generateDraftDocument(
                              act.draft_template_id || 'default',
                              activeMatter,
                            );
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
                <h3 className="font-extrabold text-base text-slate-900 mt-1">
                  § {selectedReckoner.short_label}
                </h3>
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
                    <span className="text-[10px] text-slate-500 font-mono">
                      Official Gazette / Bare Act Reproduction
                    </span>
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
                        {selectedReckoner.details_view_bare_act.provisos_and_explanations.map(
                          (prov, i) => (
                            <p
                              key={i}
                              className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 italic"
                            >
                              {prov}
                            </p>
                          ),
                        )}
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
      {/* SLIDE-OVER DRAWER: DOCUMENT EXTRACTED DETAILS & EDITING (Requirement 2) */}
      {/* --------------------------------------------------------------------- */}
      {selectedDocForDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-slate-200 flex flex-col animate-slideLeft">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                    isEditingDoc
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-indigo-100 text-indigo-900'
                  }`}
                >
                  {isEditingDoc ? <Edit3 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-slate-900 truncate max-w-xs">
                      {isEditingDoc ? 'Edit Document Details' : selectedDocForDrawer.filename}
                    </h3>
                    {isEditingDoc && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                        Editing Mode
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {isEditingDoc
                      ? `Modifying: ${selectedDocForDrawer.filename}`
                      : `${selectedDocForDrawer.doc_type} • ${selectedDocForDrawer.pages} Pages • ${selectedDocForDrawer.file_size}`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {!isEditingDoc ? (
                  <button
                    onClick={() => handleStartEditDoc()}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-indigo-50 text-indigo-900 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-700" />
                    <span>Edit</span>
                  </button>
                ) : (
                  <button
                    onClick={handleCancelEditDoc}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedDocForDrawer(null);
                    setIsEditingDoc(false);
                  }}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-5 text-xs">
              {isEditingDoc ? (
                /* EDIT MODE FORM */
                <div className="space-y-4">
                  {/* File Name & Doc Classification */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Document Filename / Title *</label>
                      <input
                        type="text"
                        value={editDocFilename}
                        onChange={(e) => setEditDocFilename(e.target.value)}
                        placeholder="e.g. Joint_Inspection_Report.pdf"
                        className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Document Classification / Type</label>
                      <select
                        value={editDocType}
                        onChange={(e) => setEditDocType(e.target.value)}
                        className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="Commercial Contract">Commercial Contract / Agreement</option>
                        <option value="First Information Report (FIR)">First Information Report (FIR)</option>
                        <option value="Tax Invoices & Challans">Tax Invoices & Delivery Challans</option>
                        <option value="Site Inspection Photo / Visual">Site Inspection Photo / Visual Evidence</option>
                        <option value="WhatsApp / Email / Note Export">WhatsApp / Email / Note Communication</option>
                        <option value="Legal Notice & Proof of Service">Legal Notice & Proof of Service</option>
                        <option value="Court Order / Certified Record">Court Order / Certified Record</option>
                        <option value="Expert / Forensic Technical Report">Expert / Forensic Technical Report</option>
                        <option value="Supplemental Admission">Supplemental Admission / Debt Acknowledgment</option>
                        <option value="Other Evidence">Other Evidence</option>
                      </select>
                    </div>
                  </div>

                  {/* Provenance, Status, Date, Pages & Size */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Provenance / Origin</label>
                      <select
                        value={editDocProvenance}
                        onChange={(e) => setEditDocProvenance(e.target.value)}
                        className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="Client Direct Submission">Client Direct Submission</option>
                        <option value="Opposing Party Production">Opposing Party Production</option>
                        <option value="Court Certified Record">Court Certified Copy</option>
                        <option value="Third Party / Subpoena">Third Party / Subpoena</option>
                        <option value="Field Investigation">Field Investigation / Site Audit</option>
                        <option value="Forensic / Expert Report">Forensic / Expert Report</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Processing Status</label>
                      <select
                        value={editDocStatus}
                        onChange={(e) => setEditDocStatus(e.target.value as 'Parsed' | 'Supplemental')}
                        className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="Parsed">Parsed & Indexed</option>
                        <option value="Supplemental">Supplemental Evidence</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Document Date</label>
                      <input
                        type="text"
                        value={editDocDate}
                        onChange={(e) => setEditDocDate(e.target.value)}
                        placeholder="e.g. Today or 14-Aug-2024"
                        className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Page Count</label>
                      <input
                        type="number"
                        min={1}
                        value={editDocPages}
                        onChange={(e) => setEditDocPages(Number(e.target.value) || 1)}
                        className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">File Size Estimate</label>
                      <input
                        type="text"
                        value={editDocFileSize}
                        onChange={(e) => setEditDocFileSize(e.target.value)}
                        placeholder="e.g. 1.2 MB"
                        className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Legal Relevance & Description */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Legal Relevance & Factual Summary</label>
                    <textarea
                      rows={3}
                      value={editDocDescription}
                      onChange={(e) => setEditDocDescription(e.target.value)}
                      placeholder="Describe what this evidence establishes in terms of claims, liabilities or defenses..."
                      className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed"
                    />
                  </div>

                  {/* Tags */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-indigo-700" />
                        <span>Evidence Tags (Comma-Separated)</span>
                      </label>
                      <span className="text-[10px] text-slate-400">e.g. Contract, Annexure, WhatsApp</span>
                    </div>
                    <input
                      type="text"
                      value={editDocTags}
                      onChange={(e) => setEditDocTags(e.target.value)}
                      placeholder="Contract, Annexure-B, Bank Guarantee, Section 18 Admission"
                      className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Suggested:
                      </span>
                      {suggestedEvidenceTags.map((tag) => {
                        const isSelected = editDocTags
                          .split(',')
                          .map((t) => t.trim().toLowerCase())
                          .includes(tag.toLowerCase());
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleToggleEditDocTag(tag)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                              isSelected
                                ? 'bg-indigo-100 text-indigo-950 border-indigo-300 shadow-2xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <span>{isSelected ? '✓' : '+'}</span>
                            <span>{tag}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Extracted Clauses Management */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold uppercase text-slate-700 flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-indigo-700" />
                        <span>Extracted Clauses & Legal Impact ({editDocClauses.length})</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleAddClauseToDoc}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Clause</span>
                      </button>
                    </div>

                    {editDocClauses.length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-slate-500 text-xs">
                        No clauses extracted yet. Click "Add Clause" above to record clauses.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {editDocClauses.map((clause, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="grid grid-cols-2 gap-2 flex-1">
                                <input
                                  type="text"
                                  value={clause.clause_number}
                                  onChange={(e) =>
                                    handleUpdateClauseField(idx, 'clause_number', e.target.value)
                                  }
                                  placeholder="Clause Ref (e.g. Clause 4.2)"
                                  className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-indigo-950 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                                />
                                <input
                                  type="text"
                                  value={clause.clause_title}
                                  onChange={(e) =>
                                    handleUpdateClauseField(idx, 'clause_title', e.target.value)
                                  }
                                  placeholder="Clause Title (e.g. Liquidated Damages)"
                                  className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteClauseFromDoc(idx)}
                                title="Delete Clause"
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                                Verbatim Extracted Text / Snippet:
                              </label>
                              <textarea
                                rows={2}
                                value={clause.extracted_snippet}
                                onChange={(e) =>
                                  handleUpdateClauseField(idx, 'extracted_snippet', e.target.value)
                                }
                                placeholder="Verbatim quote or clause language..."
                                className="w-full text-xs font-serif italic bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-emerald-800 uppercase block mb-0.5">
                                Legal Impact / Strategy Consequence:
                              </label>
                              <input
                                type="text"
                                value={clause.legal_impact}
                                onChange={(e) =>
                                  handleUpdateClauseField(idx, 'legal_impact', e.target.value)
                                }
                                placeholder="e.g. Limits liability to 5% of total contract value."
                                className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-emerald-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Raw OCR Text / Stream Extract */}
                  <div className="space-y-1 pt-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Raw OCR / Document Text Stream Extract
                    </label>
                    <textarea
                      rows={5}
                      value={editDocRawOcr}
                      onChange={(e) => setEditDocRawOcr(e.target.value)}
                      placeholder="Paste raw OCR extracted text or full transcript here..."
                      className="w-full text-[11px] font-mono bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 whitespace-pre-wrap focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  {/* Associated Gaps */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Associated Identified Gaps (Comma-Separated)
                    </label>
                    <input
                      type="text"
                      value={editDocGaps}
                      onChange={(e) => setEditDocGaps(e.target.value)}
                      placeholder="e.g. Missing Delivery Challan, Unacknowledged Inspection Email"
                      className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
              ) : (
                /* VIEW MODE */
                <>
                  {/* Document Provenance & Description Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg bg-indigo-100 text-indigo-900 border border-indigo-200">
                        Provenance: {selectedDocForDrawer.provenance || 'Client Direct Submission'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        Status: {selectedDocForDrawer.status}
                      </span>
                    </div>

                    {selectedDocForDrawer.description && (
                      <div>
                        <strong className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                          Legal Relevance & Description:
                        </strong>
                        <p className="text-xs text-slate-800 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                          {selectedDocForDrawer.description}
                        </p>
                      </div>
                    )}

                    {selectedDocForDrawer.tags && selectedDocForDrawer.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                          Tags:
                        </span>
                        {selectedDocForDrawer.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold text-[10px] shadow-2xs"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Extracted Clauses */}
                  {selectedDocForDrawer.extracted_clauses &&
                    selectedDocForDrawer.extracted_clauses.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <strong className="text-[11px] font-extrabold uppercase text-slate-400 block">
                            Extracted Contract Clauses & Legal Impact:
                          </strong>
                          <button
                            onClick={() => handleStartEditDoc()}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-2.5 h-2.5" />
                            <span>Edit Clauses</span>
                          </button>
                        </div>
                        <div className="space-y-2.5">
                          {selectedDocForDrawer.extracted_clauses.map((cl, i) => (
                            <div
                              key={i}
                              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-black text-indigo-950 text-xs">
                                  {cl.clause_number}: {cl.clause_title}
                                </span>
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
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-[11px] font-extrabold uppercase text-slate-400 block">
                          OCR / Text Stream Extract:
                        </strong>
                        <button
                          onClick={() => handleStartEditDoc()}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                          <span>Edit Text</span>
                        </button>
                      </div>
                      <pre className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 whitespace-pre-wrap font-mono">
                        {selectedDocForDrawer.raw_ocr_snippet}
                      </pre>
                    </div>
                  )}

                  {/* Associated Gaps */}
                  {selectedDocForDrawer.associated_gaps &&
                    selectedDocForDrawer.associated_gaps.length > 0 && (
                      <div>
                        <strong className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1">
                          Associated Identified Gaps:
                        </strong>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {selectedDocForDrawer.associated_gaps.map((g, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 rounded bg-amber-100 text-amber-900 font-bold text-[10px]"
                            >
                              ⚠️ {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              {isEditingDoc ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancelEditDoc}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditDoc}
                    className="px-5 py-2 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-extrabold shadow-md shadow-indigo-900/20 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Save Changes</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleDeleteDocument(selectedDocForDrawer.id)}
                    className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold cursor-pointer"
                  >
                    Delete File
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartEditDoc()}
                      className="px-3.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Document</span>
                    </button>
                    <button
                      onClick={() =>
                        triggerToast(`Downloaded extract for: ${selectedDocForDrawer.filename}`)
                      }
                      className="px-4 py-1.5 rounded-lg bg-indigo-900 text-white text-xs font-bold hover:bg-indigo-950 cursor-pointer"
                    >
                      Download Summary
                    </button>
                  </div>
                </>
              )}
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
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                  Party Legal Name
                </label>
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
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Case Role
                  </label>
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
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Entity Type
                  </label>
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
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                  Contact / Signatory
                </label>
                <input
                  type="text"
                  value={partyContact}
                  onChange={(e) => setPartyContact(e.target.value)}
                  placeholder="e.g. Mr. Arvind Malhotra (Director)"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                  Registered Address
                </label>
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
      {/* MODAL: ADD EVIDENCE TO WORKSPACE (DRAG & DROP, PDF/MD/IMG/DOC, PROVENANCE, TAGS) */}
      {/* --------------------------------------------------------------------- */}
      {showAddEvidenceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-900 flex items-center justify-center font-black text-sm">
                  <UploadCloud className="w-5 h-5 text-indigo-700" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">Add Evidence to Workspace</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Upload documents, photos, or text notes with provenance and legal tags.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddEvidenceModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* 1. Drag & Drop or File Browser Area */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Attachment / File Upload (PDF, Markdown, JPG/PNG, DOCX, TXT)
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingEvidence(true);
                  }}
                  onDragLeave={() => setIsDraggingEvidence(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingEvidence(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleEvidenceFileSelect(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center transition flex flex-col items-center justify-center gap-2 ${
                    isDraggingEvidence
                      ? 'border-indigo-500 bg-indigo-50/80 scale-[1.01]'
                      : evidenceFile
                        ? 'border-emerald-300 bg-emerald-50/40'
                        : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/20'
                  }`}
                >
                  {evidenceFile ? (
                    <div className="flex items-center justify-between w-full p-2 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-xs">
                          {evidenceFile.name.endsWith('.pdf')
                            ? 'PDF'
                            : evidenceFile.name.endsWith('.md')
                              ? 'MD'
                              : evidenceFile.name.endsWith('.png') || evidenceFile.name.endsWith('.jpg')
                                ? 'IMG'
                                : 'DOC'}
                        </div>
                        <div>
                          <div className="font-extrabold text-xs text-slate-900 truncate max-w-sm">
                            {evidenceFile.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {evidenceFileSize} • Ready to parse
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEvidenceFile(null);
                          setEvidenceDocInput('');
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                        <FileUp className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-800 text-xs">
                          Drag & drop file here, or{' '}
                          <label className="text-indigo-600 underline hover:text-indigo-800 cursor-pointer font-bold">
                            browse from computer
                            <input
                              type="file"
                              accept=".pdf,.md,.png,.jpg,.jpeg,.txt,.docx"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleEvidenceFileSelect(e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Supports PDF documents, Markdown notes (.md), Images (.png, .jpg), and Word (.docx)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 2. File / Evidence Name & Document Type Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Document / Evidence Name *</label>
                  <input
                    type="text"
                    value={evidenceDocInput}
                    onChange={(e) => setEvidenceDocInput(e.target.value)}
                    placeholder="e.g. Joint_Inspection_Report_NABL.pdf or Site_Defects_Photo.png"
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Document Classification / Type</label>
                  <select
                    value={evidenceDocType}
                    onChange={(e) => setEvidenceDocType(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Commercial Contract">Commercial Contract / Agreement</option>
                    <option value="Tax Invoices & Challans">Tax Invoices & Delivery Challans</option>
                    <option value="Site Inspection Photo / Visual">Site Inspection Photo / Visual Evidence</option>
                    <option value="WhatsApp / Email / Note Export">WhatsApp / Email / Note Communication</option>
                    <option value="Legal Notice & Proof of Service">Legal Notice & Proof of Service (Speed Post / Dasti)</option>
                    <option value="Court Order / Certified Record">Court Order / Certified Record</option>
                    <option value="Expert / Forensic Technical Report">Expert / Forensic Technical Report</option>
                    <option value="Supplemental Admission">Supplemental Admission / Debt Acknowledgment</option>
                    <option value="Other Evidence">Other Evidence</option>
                  </select>
                </div>
              </div>

              {/* 3. Provenance (Origin / Source) & Date / Pages Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Source Provenance / Origin</label>
                  <select
                    value={evidenceProvenance}
                    onChange={(e) => setEvidenceProvenance(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Client Direct Submission">Client Direct Submission</option>
                    <option value="Opposing Party Production">Opposing Party Production / Discovery</option>
                    <option value="Court Certified Record">Court Certified Copy</option>
                    <option value="Third Party / Subpoena">Third Party / Subpoena / Statutory Body</option>
                    <option value="Field Investigation">Field Investigation / Site Audit</option>
                    <option value="Forensic / Expert Report">Forensic / Expert Report</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Date of Document / Receipt</label>
                  <input
                    type="date"
                    value={evidenceDate}
                    onChange={(e) => setEvidenceDate(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Pages / Items Scope</label>
                  <input
                    type="number"
                    min={1}
                    value={evidencePages}
                    onChange={(e) => setEvidencePages(Number(e.target.value) || 1)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* 4. Description / Relevance / Extracted Summary */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Legal Relevance & Content Description *
                </label>
                <textarea
                  rows={3}
                  value={evidenceDescription}
                  onChange={(e) => setEvidenceDescription(e.target.value)}
                  placeholder="Describe what this evidence proves (e.g. WhatsApp admitting defect was user error; or NABL lab test proving tensile strength exceeded 500 MPa on day of delivery)..."
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed"
                />
              </div>

              {/* 5. Tags (Comma-Separated with Clickable Suggestions) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-700" />
                    <span>Evidence Tags (Comma-Separated)</span>
                  </label>
                  <span className="text-[10px] text-slate-400">e.g. Contract, Annexure, WhatsApp</span>
                </div>
                <input
                  type="text"
                  value={evidenceTags}
                  onChange={(e) => setEvidenceTags(e.target.value)}
                  placeholder="Contract, Annexure-B, Bank Guarantee, Section 18 Admission"
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Quick Tags:
                  </span>
                  {suggestedEvidenceTags.map((tag) => {
                    const isSelected = evidenceTags
                      .split(',')
                      .map((t) => t.trim().toLowerCase())
                      .includes(tag.toLowerCase());
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleEvidenceTag(tag)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-indigo-100 text-indigo-950 border-indigo-300 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <span>{isSelected ? '✓' : '+'}</span>
                        <span>{tag}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/70">
              <button
                type="button"
                onClick={() => setShowAddEvidenceModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyEvidence}
                className="px-5 py-2.5 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-extrabold shadow-md shadow-indigo-900/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                <span>Ingest Evidence & Refresh Analysis</span>
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
                  <h3 className="text-base font-extrabold text-slate-900">
                    New Legal Case Intake Workspace
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Configure matter domain or upload brief for AI automated classification & field
                    mapping
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
                      <Icon
                        className={`w-4 h-4 mb-1 ${isSelected ? 'text-indigo-200' : 'text-slate-600'}`}
                      />
                      <span className="text-[11px] font-bold leading-tight">
                        {item.label.split(' ')[0]}
                      </span>
                      <span
                        className={`text-[9px] mt-0.5 line-clamp-1 ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}
                      >
                        {catKey === 'constitutional'
                          ? 'Writ/Art 226'
                          : catKey === 'criminal'
                            ? 'BNS/FIR'
                            : catKey === 'commercial'
                              ? 'Contract'
                              : catKey === 'arbitration'
                                ? 'DIAC/Sec 21'
                                : 'CPC Relief'}
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
                  <span className="text-[10px] font-bold text-slate-600">
                    Auto-Provisioned Statutory Reckoners:
                  </span>
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
                  <span>
                    Create {CASE_CATEGORY_CONFIG[newCaseCategory].label.split(' ')[0]} Case
                  </span>
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
                    const blob = new Blob([currentDraft.content], {
                      type: 'text/plain;charset=utf-8',
                    });
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
      {/* --------------------------------------------------------------------- */}
      {/* 6. MODAL: ADD / EDIT CASE UPDATE (FREE-FLOWING) */}
      {/* --------------------------------------------------------------------- */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-sm">
                  📝
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    {editingUpdateId ? 'Edit Case Update / Note' : 'Log Case Update / Activity'}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Record discussion notes, counsel advice, court orders, or general memos.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Category Selector (6 Pills) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Update Category *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setUpdateCategory('Client Discussion')}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold transition text-left flex items-center gap-1.5 cursor-pointer ${
                      updateCategory === 'Client Discussion'
                        ? 'border-blue-400 bg-blue-50 text-blue-950 shadow-2xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-blue-50/50 text-slate-700'
                    }`}
                  >
                    <span>🗣️</span> <span>Client Discussion</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpdateCategory('Counsel Strategy')}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold transition text-left flex items-center gap-1.5 cursor-pointer ${
                      updateCategory === 'Counsel Strategy'
                        ? 'border-purple-400 bg-purple-50 text-purple-950 shadow-2xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-purple-50/50 text-slate-700'
                    }`}
                  >
                    <span>⚖️</span> <span>Counsel Strategy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpdateCategory('Court / Tribunal Hearing')}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold transition text-left flex items-center gap-1.5 cursor-pointer ${
                      updateCategory === 'Court / Tribunal Hearing'
                        ? 'border-amber-400 bg-amber-50 text-amber-950 shadow-2xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-amber-50/50 text-slate-700'
                    }`}
                  >
                    <span>🏛️</span> <span>Court Hearing</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpdateCategory('Settlement / Negotiation')}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold transition text-left flex items-center gap-1.5 cursor-pointer ${
                      updateCategory === 'Settlement / Negotiation'
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-950 shadow-2xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-emerald-50/50 text-slate-700'
                    }`}
                  >
                    <span>🤝</span> <span>Settlement</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpdateCategory('General Note')}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold transition text-left flex items-center gap-1.5 cursor-pointer ${
                      updateCategory === 'General Note'
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-950 shadow-2xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span>📝</span> <span>General Note</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpdateCategory('Others')}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold transition text-left flex items-center gap-1.5 cursor-pointer ${
                      updateCategory === 'Others'
                        ? 'border-slate-400 bg-slate-200 text-slate-900 shadow-2xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span>📁</span> <span>Others</span>
                  </button>
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Date of Event / Update *</label>
                <input
                  type="date"
                  value={updateDate}
                  onChange={(e) => setUpdateDate(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Subject / Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Update Title / Subject *</label>
                <input
                  type="text"
                  value={updateTitle}
                  onChange={(e) => setUpdateTitle(e.target.value)}
                  placeholder="e.g. Call with CFO on settlement parameters or Interim stay arguments concluded"
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* People Involved (Comma-separated with Quick Suggestions) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-700" />
                    <span>People Involved / Attendees (Optional)</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Comma-separated</span>
                </div>
                <input
                  type="text"
                  value={updatePeopleInvolved}
                  onChange={(e) => setUpdatePeopleInvolved(e.target.value)}
                  placeholder="e.g. Vikram Malhotra (CFO), Adv. Harish Salve, Rajesh Gupta (VP Legal)"
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
                {/* Clickable Quick Suggestion Chips */}
                {suggestedPeople.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Suggestions:
                    </span>
                    {suggestedPeople.map((person) => {
                      const isSelected = updatePeopleInvolved
                        .split(',')
                        .map((s) => s.trim().toLowerCase())
                        .includes(person.toLowerCase());
                      return (
                        <button
                          key={person}
                          type="button"
                          onClick={() => handleTogglePersonSuggestion(person)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? 'bg-indigo-100 text-indigo-950 border-indigo-300 shadow-2xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <span>{isSelected ? '✓' : '+'}</span>
                          <span>{person}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Detailed Notes / Summary */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Detailed Notes / Summary *</label>
                <textarea
                  rows={3}
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  placeholder="Free-flowing notes on what was discussed, bench remarks, strategy agreed upon, or next obligations..."
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 leading-relaxed"
                />
              </div>

              {/* Key Decisions / Directions (Optional) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Key Decision / Bench Direction / Action Point (Optional)
                </label>
                <input
                  type="text"
                  value={updateActionPoint}
                  onChange={(e) => setUpdateActionPoint(e.target.value)}
                  placeholder="e.g. File rejoinder within 2 weeks or Client approved settlement cap of ₹4.5 Cr"
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Next Target Date */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Next Follow-up / Hearing Date (Optional)
                </label>
                <input
                  type="date"
                  value={updateNextDate}
                  onChange={(e) => setUpdateNextDate(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* OPTIONAL DOCUMENT ATTACHMENT SECTION */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={updateHasDoc}
                      onChange={(e) => setUpdateHasDoc(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Attach Document / File Reference (Optional)
                    </span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Leave unchecked for pure notes/calls
                  </span>
                </div>

                {updateHasDoc && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">
                        Document Name / File
                      </label>
                      <input
                        type="text"
                        value={updateDocName}
                        onChange={(e) => setUpdateDocName(e.target.value)}
                        placeholder="e.g. Daily_Order_Sheet.pdf or Meeting_Notes.docx"
                        className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">
                        Page / Clause Reference
                      </label>
                      <input
                        type="text"
                        value={updateDocClause}
                        onChange={(e) => setUpdateDocClause(e.target.value)}
                        placeholder="e.g. Page 2, Para 4"
                        className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/70">
              <button
                type="button"
                onClick={() => setShowUpdateModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveUpdate}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{editingUpdateId ? 'Update Note' : 'Save Case Update'}</span>
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
