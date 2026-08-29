/*
===============================================================================
BLOCK COMMENT: LEGAL RESEARCH HUB COMPONENT (PARALEGAL WORKSPACE)
Module: frontend/app/legal/LegalResearchHub.tsx
Description:
    - Minimalist Grok-style hero landing page with centered search, file attachment,
      intent pills, and search mode switcher.
    - Seamless transition to 3-Pane Paralegal Workspace on query submission:
      * Top bar: sticky search bar with mode toggle, filter popover, and reset button.
      * Panel 1: Left navigation rail (minimized icon-only by default, expands on hover
        or burger menu toggle) showing core legal workflow modules & active matters.
      * Panel 2: Precedent stream with statutory disambiguation banner (IPC 307 vs 302),
        multi-select filter popover, and high-density result cards.
      * Panel 3: Right viewport deep-dive reader with Facts, Ratio Decidendi, Full Text,
        and Citation Network.
===============================================================================
*/

'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  hasPermissionScope,
  loadRoutePermissionsFromDB,
  getEffectivePermissions,
} from '@/lib/config/route_permissions';
import {
  Search,
  BookOpen,
  Filter,
  Bookmark,
  Printer,
  FileText,
  Scale,
  Sparkles,
  ShieldCheck,
  Info,
  Network,
  Plus,
  RefreshCw,
  Calendar,
  Building2,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FolderPlus,
  Layers,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  X,
  Pin,
  ExternalLink,
  RotateCcw,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowUp,
  Paperclip,
  Menu,
  FileCode,
  FileEdit,
  FolderKanban,
  Sword,
  ShieldAlert,
  HelpCircle,
  Copy,
  History,
  Compass,
  ArrowRight,
  CheckCheck,
  UploadCloud,
  FileCheck,
  Download,
  Link2,
  FileJson,
  CalendarDays,
  Gavel,
} from 'lucide-react';

// Default Taxonomies for Legal Search
const DEFAULT_COURT_OPTIONS = [
  { label: 'Supreme Court of India', value: 'Supreme Court of India' },
  { label: 'High Court of Delhi', value: 'High Court of Delhi' },
  { label: 'Bombay High Court', value: 'Bombay High Court' },
  { label: 'Madras High Court', value: 'Madras High Court' },
  { label: 'Calcutta High Court', value: 'Calcutta High Court' },
  { label: 'Punjab & Haryana High Court', value: 'High Court of Punjab and Haryana' },
  { label: 'Karnataka High Court', value: 'Karnataka High Court' },
  { label: 'Telangana High Court', value: 'Telangana High Court' },
];

const DEFAULT_STATUTE_OPTIONS = [
  'IPC Sec 307 (Attempt to Murder)',
  'IPC Sec 302 (Murder)',
  'BNS Sec 109 (Attempt to Murder)',
  'BNS Sec 103 (Murder)',
  'Income Tax Act Sec 148A(b)',
  'Income Tax Act Sec 148',
  'CGST Sec 107',
  'CrPC Sec 439 (Bail)',
  'BNSS Sec 480 (Bail)',
  'Companies Act Sec 241/242',
  'Arbitration Act Sec 9',
];

const DEFAULT_OUTCOME_TAG_OPTIONS = [
  '[Bail Granted]',
  '[Notice Quashed / Appeal Allowed]',
  '[Petition Dismissed]',
  '[Interim Stay Granted]',
  '[Remanded back to AO]',
  '[Charges Framed]',
];

const DEFAULT_STATUS_BADGE_OPTIONS = ['Good Law', 'Overruled', 'Distinguished / Referred'];

const SUBFOLDERS = [
  '📁 03_Research_&_Judgments',
  '📁 01_Pleadings_&_Drafts',
  '📁 02_Client_Documents_&_Transcripts',
  '📁 04_Compilations_&_Binders',
];

const QUICK_PROMPTS = [
  {
    label: '⚖️ Attempt to murder bail after charge sheet',
    query:
      'Bail in attempt to murder case under IPC Section 307 where charge sheet filed and no vital injury',
    category: 'Criminal / Bail',
  },
  {
    label: '📑 Sec 148A notice quashed on limitation',
    query:
      'Income tax reassessment notice under Section 148A quashed due to limitation and lack of sanction',
    category: 'Direct Tax',
  },
  {
    label: '🏢 IBC Sec 7 default threshold & limitation',
    query: 'Insolvency application under IBC Section 7 dismissed for debt below threshold limit',
    category: 'Insolvency / Corporate',
  },
  {
    label: '📜 Section 9 Arbitration interim injunction',
    query:
      'Interim relief under Arbitration Section 9 for preservation of property prior to tribunal constitution',
    category: 'Arbitration',
  },
];

// Helper function to normalize values into pill arrays, filtering out empty or placeholder values
function toPillsArray(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (item === null || item === undefined) return '';
        if (typeof item === 'object') {
          if (item.case)
            return item.plaintiff
              ? `${item.case} (${item.plaintiff} v ${item.respondent || ''})`
              : String(item.case);
          if (item.title) return String(item.title);
          if (item.citation) return String(item.citation);
          if (item.name) return String(item.name);
          return JSON.stringify(item);
        }
        return String(item).trim();
      })
      .filter(
        (s) =>
          s.length > 0 &&
          s.toLowerCase() !== 'not specified' &&
          s.toLowerCase() !== 'not available' &&
          s.toLowerCase() !== 'null',
      );
  }
  if (typeof val === 'object') {
    if (val.case)
      return [
        val.plaintiff
          ? `${val.case} (${val.plaintiff} v ${val.respondent || ''})`
          : String(val.case),
      ];
    if (val.title) return [String(val.title)];
    if (val.citation) return [String(val.citation)];
    return [];
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (
      !trimmed ||
      trimmed.toLowerCase() === 'not specified' ||
      trimmed.toLowerCase() === 'not available' ||
      trimmed.toLowerCase() === 'null'
    ) {
      return [];
    }
    if (trimmed.includes(';') && !trimmed.startsWith('{')) {
      return trimmed
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }
    return [trimmed];
  }
  return [String(val)];
}

export interface LegalResearchHubProps {
  userPermissions?: string[];
  userRole?: string;
}

export default function LegalResearchHub({
  userPermissions: propPermissions,
  userRole: propRole,
}: LegalResearchHubProps = {}) {
  const router = useRouter();
  // Navigation & Workspace State
  const [hasSearched, setHasSearched] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState<
    'search' | 'draft' | 'affidavit' | 'cases' | 'opponent' | 'briefs'
  >('search');
  const [searchMode, setSearchMode] = useState<'grounded' | 'ai'>('grounded');
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Derive Effective Permissions for the logged-in user or active role
  const effectivePermissions = useMemo(() => {
    if (propPermissions && propPermissions.length > 0) return propPermissions;
    if (propRole) return getEffectivePermissions([], propRole);
    return getEffectivePermissions(
      userPermissions,
      currentUser?.role || currentUser?.role_type || currentUser?.role_name,
    );
  }, [propPermissions, propRole, userPermissions, currentUser]);

  // Left Sidebar Rail State (Expanded by default as main navbar)
  const [isRailPinned, setIsRailPinned] = useState(true);
  const [isRailHovered, setIsRailHovered] = useState(false);
  const isRailExpanded = isRailPinned || isRailHovered;

  // Search & Results State
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [parsedIntent, setParsedIntent] = useState<any>(null);

  // Attachment / Upload state
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [copiedCitationId, setCopiedCitationId] = useState<string | null>(null);

  // Filters State & Popover
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const filterPopoverRef = useRef<HTMLDivElement>(null);

  const [courtOptions, setCourtOptions] = useState(DEFAULT_COURT_OPTIONS);
  const [statuteOptions, setStatuteOptions] = useState(DEFAULT_STATUTE_OPTIONS);
  const [outcomeTagOptions, setOutcomeTagOptions] = useState(DEFAULT_OUTCOME_TAG_OPTIONS);
  const [statusBadgeOptions, setStatusBadgeOptions] = useState(DEFAULT_STATUS_BADGE_OPTIONS);

  const [selectedCourts, setSelectedCourts] = useState<string[]>([
    'Supreme Court of India',
    'High Court of Delhi',
  ]);
  const [selectedStatutes, setSelectedStatutes] = useState<string[]>([]);
  const [selectedOutcomeTags, setSelectedOutcomeTags] = useState<string[]>([]);
  const [selectedStatusBadges, setSelectedStatusBadges] = useState<string[]>(['Good Law']);
  const [judgeFilter, setJudgeFilter] = useState('');
  const [yearMin, setYearMin] = useState(2018);
  const [yearMax, setYearMax] = useState(2026);

  const activeFiltersCount =
    selectedCourts.length +
    selectedStatutes.length +
    selectedOutcomeTags.length +
    selectedStatusBadges.length +
    (judgeFilter ? 1 : 0);

  // Panel 3 State (Detail View)
  const [selectedCnr, setSelectedCnr] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [showPanel3, setShowPanel3] = useState(true);

  // Case Workspaces & Modals
  const [caseWorkspaces, setCaseWorkspaces] = useState<any[]>([]);
  const [showSavePrecedentModal, setShowSavePrecedentModal] = useState(false);
  const [precedentToSave, setPrecedentToSave] = useState<any>(null);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [selectedSubfolder, setSelectedSubfolder] = useState('📁 03_Research_&_Judgments');
  const [linkMode, setLinkMode] = useState<'existing' | 'new'>('existing');
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCaseNumber, setNewCaseNumber] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Knowledge Base & Profile configuration state
  const [activeKbIds, setActiveKbIds] = useState<string[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  // Close filter popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(event.target as Node)) {
        setShowFilterPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initial Data Loading
  useEffect(() => {
    async function initUserAndPermissions() {
      try {
        await loadRoutePermissionsFromDB().catch(() => {});
        const user = await api.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          setUserPermissions(user.permissions || []);
        }
      } catch (err) {
        console.warn('Could not load user permissions for Legal Hub:', err);
      }
    }
    initUserAndPermissions();
    loadFilterOptions();
    loadCaseWorkspaces();
    loadTenantKBsAndProfiles();
  }, []);

  const loadTenantKBsAndProfiles = async () => {
    try {
      const kbs = await api.getKnowledgeBases();
      if (Array.isArray(kbs) && kbs.length > 0) {
        setActiveKbIds(kbs.map((k: any) => String(k.id)));
      }
      const profs = await api.getLlmProfiles();
      if (Array.isArray(profs) && profs.length > 0) {
        const active = profs.find((p: any) => p.is_active || p.is_default) || profs[0];
        if (active) setActiveProfileId(active.id);
      }
    } catch (err) {
      console.warn('Could not pre-load tenant KBs/profiles:', err);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const data = await api.getLegalFilterOptions();
      if (data) {
        if (data.courts) setCourtOptions(data.courts);
        if (data.statutes) setStatuteOptions(data.statutes);
        if (data.outcome_tags) setOutcomeTagOptions(data.outcome_tags);
        if (data.status_badges) setStatusBadgeOptions(data.status_badges);
      }
    } catch (err) {
      console.warn('Backend filter options fallback used', err);
    }
  };

  const loadCaseWorkspaces = () => {
    try {
      const stored =
        typeof window !== 'undefined' ? sessionStorage.getItem('legal_case_workspaces') : null;
      if (stored) {
        const cases = JSON.parse(stored);
        setCaseWorkspaces(cases || []);
        if (cases && cases.length > 0) {
          setSelectedCaseId(cases[0].id);
        }
      } else {
        const sampleCases = [
          {
            id: 'case-101',
            title: 'Suresh Pandey and others versus The State of Jharkhand',
            case_number: 'CRL.A. 252/2006',
            category: 'Criminal / Sections 302/149 IPC',
            court: 'High Court of Jharkhand at Ranchi',
            updated_at: new Date().toISOString(),
          },
          {
            id: 'case-102',
            title: 'State of Maharashtra v. Rajesh Sharma',
            case_number: 'CRL.A. 412/2023',
            category: 'Criminal / IPC 307 Bail',
            court: 'Supreme Court of India',
            updated_at: new Date().toISOString(),
          },
          {
            id: 'case-103',
            title: 'M/s Vertex Industries v. DCIT Circle 2(1)',
            case_number: 'W.P.(C) 9812/2023',
            category: 'Income Tax / Sec 148A Quashing',
            court: 'High Court of Delhi',
            updated_at: new Date().toISOString(),
          },
        ];
        setCaseWorkspaces(sampleCases);
        setSelectedCaseId(sampleCases[0].id);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('legal_case_workspaces', JSON.stringify(sampleCases));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async (queryText?: string) => {
    const textToSearch = queryText !== undefined ? queryText : searchQuery;
    if (!textToSearch.trim() && !attachedFile) return;

    setLoading(true);
    setHasSearched(true);

    try {
      // 1. Execute Two-Stage Domain & Precedent Search (with phonetic and tag pre-filtering)
      let domainSearchSuccess = false;
      let mappedItems: any[] = [];

      try {
        const searchRes = await api.searchDomainKnowledge({
          query: textToSearch,
          domain: 'legal',
          knowledge_base_id: activeKbIds[0] || undefined,
          filters: {
            ...(selectedCourts.length > 0 ? { court: selectedCourts[0] } : {}),
            ...(selectedStatutes.length > 0 ? { statute: selectedStatutes[0] } : {}),
            ...(selectedOutcomeTags.length > 0 ? { disposition: selectedOutcomeTags[0] } : {}),
            ...(judgeFilter ? { judge: judgeFilter } : {}),
            year_min: yearMin,
            year_max: yearMax,
          },
        });

        if (searchRes && searchRes.results && searchRes.results.length > 0) {
          domainSearchSuccess = true;
          if (searchRes.intent_parsed) {
            setParsedIntent(searchRes.intent_parsed);
          }

          mappedItems = searchRes.results.map((r: any, index: number) => {
            const meta = r.metadata || {};
            const extracted =
              r.extracted_fields ||
              meta.extracted_fields ||
              meta.domain_info?.extracted_fields ||
              meta;
            const findings = r.findings || meta.findings || {};
            const caseTitle =
              r.title || meta.name || meta.case_title || meta.document_name || 'Legal Precedent';
            const summaryText =
              r.case_overview ||
              r.summary ||
              meta.summary ||
              meta.executive_case_summary ||
              'Not available';
            const fullTextContent =
              r.content || meta.full_text || meta.raw_text || meta.text || summaryText;
            const linkedCases =
              r.linked_cases ||
              meta.connected_cases ||
              meta.citations ||
              meta.precedents ||
              extracted.connected_cases ||
              null;

            return {
              cnr: r.id || meta.cnr || `doc_${index}`,
              case_number: r.case_number || meta.case_number || meta.doc_id || r.id,
              case_title: caseTitle,
              title: caseTitle,
              court_type: r.court || meta.court_type || meta.court || meta.jurisdiction || null,
              court: r.court || meta.court_type || meta.court || meta.jurisdiction || null,
              judge: r.judge || meta.judge || meta.judges || meta.coram || meta.bench || null,
              decision_date:
                r.decision_date || r.date || meta.decision_date || meta.date || meta.year || null,
              filing_date: r.filing_date || meta.filing_date || null,
              hearing_date: r.hearing_date || meta.hearing_date || null,
              incident_date: r.incident_date || meta.incident_date || null,
              case_date: r.case_date || meta.case_date || null,
              linked_cases: linkedCases,
              citations: r.citations || meta.citations || null,
              parallel_citation:
                r.parallel_citation || meta.citation || meta.parallel_citation || null,
              status_badge: r.status_badge || meta.status_badge || 'Good Law',
              outcome_tag:
                r.final_decision || r.outcome || meta.outcome || meta.outcome_tag || null,
              outcome: r.final_decision || r.outcome || meta.outcome || meta.outcome_tag || null,
              parties: r.parties || meta.parties || null,
              plaintiffs: r.plaintiffs || meta.plaintiffs || meta.appellant || null,
              respondents: r.respondents || meta.respondents || meta.respondent || null,
              sections_or_articles_involved:
                r.sections_or_articles_involved ||
                meta.sections_or_articles_involved ||
                meta.sections ||
                r.sections ||
                null,
              matched_statutes: Array.isArray(r.sections_or_articles_involved)
                ? r.sections_or_articles_involved
                : r.sections_or_articles_involved
                  ? [r.sections_or_articles_involved]
                  : [],
              case_summary: summaryText,
              summary: summaryText,
              case_overview: r.case_overview || findings.case_overview || summaryText,
              one_line_summary: r.one_line_summary || findings.one_line_summary || '',
              petitioner_arguments:
                r.petitioner_arguments ||
                findings.petitioner_arguments ||
                extracted.high_court_arguments?.petitioner_arguments ||
                [],
              respondent_arguments:
                r.respondent_arguments ||
                findings.respondent_arguments ||
                extracted.high_court_arguments?.respondent_arguments ||
                [],
              court_findings:
                r.court_findings ||
                findings.court_findings ||
                extracted.labour_court_findings?.findings ||
                null,
              holding: r.holding || findings.holding || extracted.judgment_status?.holding || null,
              ratio_snippet: summaryText,
              full_text: fullTextContent,
              content: fullTextContent,
              document_path: r.file_path || meta.file_path || meta.document_path || null,
              score: r.relevance_score || r.score || 0.95,
              matched_tags: r.matched_tags || [],
              parent_sections: {
                facts: meta.facts || summaryText,
                ratio_decidendi: r.holding || summaryText,
                holding_order: r.final_decision || r.outcome || null,
              },
            };
          });
        }
      } catch (domainErr) {
        console.warn('Domain search fallback to standard retrieval:', domainErr);
      }

      // 2. Fallback to standard RAG pipeline if domain search returned empty
      if (!domainSearchSuccess) {
        const retrieveRes = await api.retrieveKnowledge({
          query: textToSearch,
          knowledge_base_ids: activeKbIds,
          profile_id: activeProfileId || undefined,
        });

        const retrievedChunks = retrieveRes?.chunks || retrieveRes?.context?.chunks || [];
        const contextObj = retrieveRes?.context || {
          chunks: retrievedChunks,
          context: retrievedChunks.map((c: any) => c.content).join('\n\n'),
          total_chunks: retrievedChunks.length,
          total_tokens: 0,
        };

        // Generate Structured Cases via LLM
        let parsedCases: any[] = [];
        try {
          const genRes = await api.generateResponse({
            query: textToSearch,
            context: contextObj,
            profile_id: activeProfileId || undefined,
          });

          const rawAnswer = genRes?.answer || genRes?.content || genRes?.response;
          if (rawAnswer) {
            const parsed = typeof rawAnswer === 'string' ? JSON.parse(rawAnswer.trim()) : rawAnswer;
            if (parsed && typeof parsed === 'object') {
              if (Array.isArray(parsed.cases)) {
                parsedCases = parsed.cases;
              } else if (Array.isArray(parsed)) {
                parsedCases = parsed;
              } else if (parsed.case_title || parsed.title) {
                parsedCases = [parsed];
              }
            }
          }
        } catch (genErr) {
          console.warn('Generation failed:', genErr);
        }

        if (parsedCases.length > 0) {
          mappedItems = parsedCases.map((c: any, index: number) => {
            const caseTitle = c.case_title || c.title || null;
            const summaryText = c.case_summary || c.summary || null;
            const fullTextContent = c.content || c.full_text || c.raw_text || summaryText || null;
            const linkedCases =
              c.linked_cases ||
              c.connected_cases ||
              c.citations ||
              c.cited_cases ||
              c.precedents ||
              null;

            return {
              cnr: c.cnr || `gen_case_${index}`,
              case_number: c.case_number || null,
              case_title: caseTitle,
              title: caseTitle,
              court_type: c.court_type || c.court || null,
              court: c.court_type || c.court || null,
              judge: c.judge || c.judges || c.coram || null,
              decision_date: c.decision_date || c.date || null,
              filing_date: c.filing_date || null,
              hearing_date: c.hearing_date || null,
              incident_date: c.incident_date || null,
              case_date: c.case_date || null,
              linked_cases: linkedCases,
              citations: c.citations || null,
              parallel_citation: c.parallel_citation || null,
              status_badge: c.status_badge || null,
              outcome_tag: c.outcome || null,
              outcome: c.outcome || null,
              parties: c.parties || null,
              plaintiffs: c.plaintiffs || null,
              respondents: c.respondents || null,
              sections_or_articles_involved: c.sections_or_articles_involved || c.sections || null,
              matched_statutes: Array.isArray(c.sections_or_articles_involved)
                ? c.sections_or_articles_involved
                : c.sections_or_articles_involved
                  ? [c.sections_or_articles_involved]
                  : [],
              case_summary: summaryText,
              summary: summaryText,
              case_overview: c.case_overview || summaryText,
              one_line_summary: c.one_line_summary || '',
              petitioner_arguments:
                c.petitioner_arguments || c.high_court_arguments?.petitioner_arguments || [],
              respondent_arguments:
                c.respondent_arguments || c.high_court_arguments?.respondent_arguments || [],
              court_findings: c.court_findings || null,
              holding: c.holding || summaryText,
              ratio_snippet: summaryText,
              full_text: fullTextContent,
              content: fullTextContent,
              document_path: c.file_path || c.document_path || null,
              score: c.score || 0.95,
              parent_sections: {
                facts: c.facts || summaryText,
                ratio_decidendi: summaryText,
                holding_order: c.outcome || null,
              },
            };
          });
        } else if (retrievedChunks.length > 0) {
          mappedItems = retrievedChunks.map((chunk: any, index: number) => {
            const meta = chunk.metadata || {};
            const title =
              meta.case_title || meta.title || meta.document_name || meta.file_name || null;
            const summaryText = meta.summary || meta.case_summary || null;
            const fullTextContent =
              chunk.content || meta.full_text || meta.raw_text || meta.text || null;
            const linkedCases =
              meta.linked_cases ||
              meta.connected_cases ||
              meta.citations ||
              meta.cited_cases ||
              meta.precedents ||
              null;

            return {
              cnr: meta.cnr || chunk.chunk_id || `chk_${index}`,
              case_number: meta.case_number || meta.cnr || meta.doc_id || null,
              case_title: title,
              title: title,
              court_type: meta.court_type || meta.court || meta.jurisdiction || null,
              court: meta.court_type || meta.court || meta.jurisdiction || null,
              judge: meta.judge || meta.judges || meta.coram || meta.bench || null,
              decision_date: meta.decision_date || meta.date || meta.year || null,
              filing_date: meta.filing_date || null,
              hearing_date: meta.hearing_date || null,
              incident_date: meta.incident_date || null,
              case_date: meta.case_date || null,
              linked_cases: linkedCases,
              citations: meta.citations || null,
              parallel_citation: meta.citation || meta.parallel_citation || meta.cnr || null,
              status_badge: meta.status_badge || null,
              outcome_tag: meta.outcome || meta.outcome_tag || null,
              outcome: meta.outcome || meta.outcome_tag || null,
              parties: meta.parties || null,
              appellants: meta.plaintiffs || meta.appellant || null,
              petitioners: meta.plaintiffs || meta.appellant || null,
              plaintiffs: meta.plaintiffs || meta.appellant || null,
              respondents: meta.respondents || meta.respondent || null,
              sections_or_articles_involved:
                meta.sections_or_articles_involved || meta.sections || meta.statutes || null,
              matched_statutes: Array.isArray(meta.sections_or_articles_involved)
                ? meta.sections_or_articles_involved
                : [],
              case_summary: summaryText,
              summary: summaryText,
              case_overview: meta.case_overview || summaryText,
              one_line_summary: meta.one_line_summary || '',
              petitioner_arguments: meta.petitioner_arguments || [],
              respondent_arguments: meta.respondent_arguments || [],
              court_findings: meta.court_findings || null,
              holding: meta.holding || summaryText,
              ratio_snippet: summaryText,
              full_text: fullTextContent,
              content: fullTextContent,
              document_path: meta.file_path || meta.document_path || meta.source_document || null,
              score: chunk.score,
              parent_sections: {
                facts: meta.facts || summaryText,
                ratio_decidendi: summaryText,
                holding_order: meta.outcome || meta.holding || null,
              },
            };
          });
        }
      }

      setResults(mappedItems);
      if (mappedItems.length > 0) {
        setSelectedCnr(mappedItems[0].cnr);
        setSelectedResult(mappedItems[0]);
      } else {
        setSelectedCnr(null);
        setSelectedResult(null);
      }
    } catch (err) {
      console.error('Retrieval failed:', err);
      setResults([]);
      setSelectedCnr(null);
      setSelectedResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePromptClick = (promptQuery: string) => {
    setSearchQuery(promptQuery);
    handleSearch(promptQuery);
  };

  const resetToHero = () => {
    setHasSearched(false);
    setSearchQuery('');
    setResults([]);
    setSelectedResult(null);
  };

  const toggleCourt = (courtVal: string) => {
    setSelectedCourts((prev) =>
      prev.includes(courtVal) ? prev.filter((c) => c !== courtVal) : [...prev, courtVal],
    );
  };

  const toggleStatute = (st: string) => {
    setSelectedStatutes((prev) =>
      prev.includes(st) ? prev.filter((s) => s !== st) : [...prev, st],
    );
  };

  const handleQuickSearch = (term: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (
      !term ||
      typeof term !== 'string' ||
      !term.trim() ||
      term.trim().toLowerCase() === 'not available' ||
      term.trim().toLowerCase() === 'not specified'
    ) {
      return;
    }
    const cleanTerm = term.trim();
    setSearchQuery(cleanTerm);
    setHasSearched(true);
    handleSearch(cleanTerm);
    triggerToast(`Searching for: ${cleanTerm}`);
  };

  const handleDownloadText = (item: any) => {
    if (!item) return;
    const title = item.case_title || item.title || item.case_number || 'legal_judgment';
    const filename = `${String(title)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 45)}_extracted.txt`;
    const headerInfo = [
      `================================================================================`,
      `LEGAL PRECEDENT DOSSIER - EXTRACTED RECORD`,
      `================================================================================`,
      `CASE TITLE: ${item.case_title || item.title || 'Not available'}`,
      `CASE NUMBER / CNR: ${Array.isArray(item.case_number) ? item.case_number.join(', ') : item.case_number || item.cnr || 'Not available'}`,
      `COURT / JURISDICTION: ${item.court_type || item.court || 'Not available'}`,
      `CORAM / JUDGE: ${Array.isArray(item.judge) ? item.judge.join(', ') : item.judge || item.judges || item.coram || 'Not available'}`,
      `DECISION DATE: ${item.decision_date || item.date || 'Not available'}`,
      item.filing_date ? `FILING DATE: ${item.filing_date}` : null,
      item.hearing_date ? `HEARING DATE: ${item.hearing_date}` : null,
      `PARALLEL CITATION: ${item.parallel_citation || 'Not available'}`,
      `PRECEDENT STATUS: ${item.status_badge || 'Not available'}`,
      `OUTCOME / DISPOSITION: ${item.outcome || item.outcome_tag || 'Not available'}`,
      `SECTIONS INVOLVED: ${toPillsArray(item.sections_or_articles_involved || item.matched_statutes).join(', ') || 'Not available'}`,
      `LINKED CASES / CITATIONS: ${toPillsArray(item.linked_cases || item.citations).join(', ') || 'None recorded'}`,
      `================================================================================`,
      `CASE SUMMARY:`,
      item.case_summary || item.summary || 'Not available',
      `================================================================================`,
      `COMPLETE EXTRACTED JUDGMENT / PRECEDENT TEXT:`,
      item.full_text ||
        item.content ||
        item.raw_text ||
        item.case_summary ||
        item.summary ||
        'No raw text extracted.',
      `================================================================================`,
    ]
      .filter(Boolean)
      .join('\n\n');

    const blob = new Blob([headerInfo], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast(`Downloaded extracted text: ${filename}`);
  };

  const handleDownloadJson = (item: any) => {
    if (!item) return;
    const title = item.case_title || item.title || item.case_number || 'legal_metadata';
    const filename = `${String(title)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 45)}_metadata.json`;
    const blob = new Blob([JSON.stringify(item, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast(`Downloaded metadata JSON: ${filename}`);
  };

  const handleDownloadPdf = (item: any) => {
    if (!item) return;
    const path =
      item.document_path ||
      item.source_document ||
      (item.cnr ? `/storage/judgments/${item.cnr}.pdf` : null);
    if (path) {
      window.open(path, '_blank');
      triggerToast('Opening PDF document...');
    } else {
      triggerToast('PDF document source not available');
    }
  };

  const handleCopyCitation = (citation: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(citation);
    setCopiedCitationId(id);
    triggerToast(`Citation copied: ${citation}`);
    setTimeout(() => setCopiedCitationId(null), 2000);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCardClick = (r: any) => {
    setSelectedCnr(r.cnr);
    setSelectedResult(r);
    setShowPanel3(true);
  };

  const openSaveModalForPrecedent = (r: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setPrecedentToSave(r);
    setShowSavePrecedentModal(true);
  };

  const handleSavePrecedent = async () => {
    if (!precedentToSave) return;
    try {
      let targetCaseId = selectedCaseId;
      let cases = [...caseWorkspaces];

      if (linkMode === 'new') {
        if (!newCaseTitle.trim()) return;
        const newCase = {
          id: `case-${Date.now()}`,
          title: newCaseTitle,
          case_number: newCaseNumber || `MAT-${Date.now().toString().slice(-4)}`,
          category: 'Legal Research Matter',
          court: precedentToSave.court || 'Supreme Court of India',
          updated_at: new Date().toISOString(),
        };
        cases = [newCase, ...cases];
        targetCaseId = newCase.id;
      }

      setCaseWorkspaces(cases);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('legal_case_workspaces', JSON.stringify(cases));
      }

      setShowSavePrecedentModal(false);
      triggerToast(`Saved to Case: ${precedentToSave.title}`);
    } catch (err) {
      console.error('Failed to link precedent', err);
    }
  };

  // ===========================================================================
  // RENDER: UNIFIED PARALEGAL WORKSPACE (PERMANENT LEFT NAVBAR + DYNAMIC CONTENT)
  // ===========================================================================
  return (
    <div className="h-[calc(100vh-8rem)] min-h-[580px] bg-slate-100 text-slate-900 flex flex-col font-sans overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* STICKY TOP SEARCH & WORKSPACE HEADER (WHEN SEARCHED) */}
      {hasSearched && (
        <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between shrink-0 shadow-2xs z-30 gap-4">
          {/* Left: Brand & Home Reset */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={resetToHero}
              title="Return to Clean Search Landing"
              className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-violet-700 flex items-center justify-center text-white shadow-xs">
                <Scale className="w-4 h-4" />
              </div>
              <span className="text-xs font-extrabold text-slate-900 hidden sm:inline">
                nFlow Legal
              </span>
            </button>
          </div>

          {/* Center: Search Bar with Filters & Mode */}
          <div className="flex-1 max-w-2xl relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 z-10 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search precedents, statutes (e.g. Attempt to murder vs 302)..."
              className="w-full text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 pl-9 pr-24 focus:outline-none focus:border-violet-700 focus:ring-2 focus:ring-violet-200"
            />

            {/* Filter Popover Trigger */}
            <button
              onClick={() => setShowFilterPopover(!showFilterPopover)}
              className={`absolute right-1.5 px-2 py-1 rounded-lg border transition flex items-center gap-1 text-[10px] font-bold cursor-pointer ${
                showFilterPopover || activeFiltersCount > 0
                  ? 'bg-violet-50 text-violet-800 border-violet-300 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-3 h-3 text-violet-700" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-3.5 h-3.5 rounded-full bg-violet-700 text-white text-[8px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* MULTI-SELECT FILTER POPOVER OVERLAY */}
            {showFilterPopover && (
              <div
                ref={filterPopoverRef}
                className="absolute top-11 right-0 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-extrabold text-slate-900">Precedent Filters</span>
                  <button
                    onClick={() => setShowFilterPopover(false)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Court Hierarchy Filters */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Courts & Benches
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {courtOptions.map((court: any) => {
                      const val = typeof court === 'string' ? court : court.value;
                      const label = typeof court === 'string' ? court : court.label;
                      const active = selectedCourts.includes(val);
                      return (
                        <button
                          key={val}
                          onClick={() => toggleCourt(val)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition border cursor-pointer ${
                            active
                              ? 'bg-violet-100 text-violet-900 border-violet-300 shadow-2xs font-bold'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Statute Filter */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Statutes & Codes
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {statuteOptions.map((st: string) => {
                      const active = selectedStatutes.includes(st);
                      return (
                        <button
                          key={st}
                          onClick={() => toggleStatute(st)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition border cursor-pointer ${
                            active
                              ? 'bg-indigo-100 text-indigo-900 border-indigo-300 shadow-2xs font-bold'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {st}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
              <button
                onClick={() => setSearchMode('grounded')}
                className={`px-2 py-0.5 rounded-lg transition ${
                  searchMode === 'grounded'
                    ? 'bg-white text-violet-800 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                Exact
              </button>
              <button
                onClick={() => setSearchMode('ai')}
                className={`px-2 py-0.5 rounded-lg transition ${
                  searchMode === 'ai' ? 'bg-white text-violet-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                AI Memo
              </button>
            </div>

            <button
              onClick={() => window.print()}
              title="Export Case Binder"
              className="flex items-center gap-1 text-xs bg-slate-900 hover:bg-black text-white font-semibold px-2.5 py-1.5 rounded-xl transition shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Export</span>
            </button>
          </div>
        </header>
      )}

      {/* WORKSPACE BODY WITH PERMANENT LEFT NAVBAR */}
      <div className="flex-1 flex overflow-hidden">
        {/* =====================================================================
            PANEL 1: PERMANENT LEFT NAVBAR (PARALEGAL SKILLS & ACTIONS)
            ===================================================================== */}
        <nav
          aria-label="Workflow Navigation"
          onMouseEnter={() => setIsRailHovered(true)}
          onMouseLeave={() => setIsRailHovered(false)}
          className={`${
            isRailExpanded ? 'w-64 shadow-xl z-40' : 'w-16'
          } border-r border-slate-200 bg-white flex flex-col shrink-0 transition-all duration-300 relative select-none`}
        >
          {/* Top Brand Header in Rail */}
          <div className="h-14 px-3 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-violet-700 flex items-center justify-center text-white shadow-xs shrink-0">
                <Scale className="w-4 h-4" />
              </div>
              {isRailExpanded && (
                <span className="font-extrabold text-sm text-slate-900 tracking-tight whitespace-nowrap">
                  nFlow Legal
                </span>
              )}
            </div>
            <button
              onClick={() => setIsRailPinned(!isRailPinned)}
              title={isRailPinned ? 'Unpin Sidebar (Auto-collapse)' : 'Pin Sidebar Open'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              {isRailPinned ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4 text-violet-700" />
              )}
            </button>
          </div>

          {/* Subtitle Section Header */}
          {isRailExpanded && (
            <div className="px-3 pt-3 pb-1 flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-slate-500 shrink-0">
              <span>PARALEGAL SKILLS</span>
            </div>
          )}

          {/* Workflow Items List (Filtered by User Permissions) */}
          <div className="flex-1 p-2 flex flex-col gap-1 overflow-y-auto">
            {(() => {
              const items = [
                {
                  id: 'search',
                  label: 'Precedent Search',
                  sublabel: 'Intent & Section Discovery',
                  icon: <Search className="w-4 h-4" />,
                  bg: 'bg-violet-100 text-violet-700',
                  permission: 'legal:research:query',
                  action: () => {
                    setActiveWorkflow('search');
                  },
                },
                {
                  id: 'draft',
                  label: 'Draft Pleadings',
                  sublabel: 'Pleadings & Counter-Briefs',
                  icon: <FileEdit className="w-4 h-4" />,
                  bg: 'bg-purple-100 text-purple-700',
                  permission: 'legal:research:upload',
                  action: () => {
                    setActiveWorkflow('draft');
                    triggerToast('Drafting Assistant selected');
                  },
                },
                {
                  id: 'affidavit',
                  label: 'Affidavit Drafter',
                  sublabel: 'Standard Court Submissions',
                  icon: <FileCode className="w-4 h-4" />,
                  bg: 'bg-indigo-100 text-indigo-700',
                  permission: 'legal:research:upload',
                  action: () => {
                    setActiveWorkflow('affidavit');
                    triggerToast('Affidavit Drafter selected');
                  },
                },
                {
                  id: 'cases',
                  label: 'Case Vault',
                  sublabel: 'Multi-Doc Dossier & Timeline',
                  icon: <FolderKanban className="w-4 h-4" />,
                  bg: 'bg-blue-100 text-blue-700',
                  permission: 'legal:research:view',
                  action: () => {
                    setActiveWorkflow('cases');
                    triggerToast('Case Vault selected');
                  },
                },
                {
                  id: 'opponent',
                  label: 'Litigation Autopilot',
                  sublabel: 'Gaps & Strategy Cockpit',
                  icon: <Sword className="w-4 h-4" />,
                  bg: 'bg-rose-100 text-rose-700',
                  permission: 'legal:autopilot:view',
                  isRoute: true,
                  href: '/autopilot',
                  action: () => {
                    router.push('/autopilot');
                  },
                },
              ];

              const allowedItems = items.filter((item) => {
                return (
                  hasPermissionScope(effectivePermissions, '*:*:*') ||
                  hasPermissionScope(effectivePermissions, 'legal:*:*') ||
                  hasPermissionScope(effectivePermissions, item.permission)
                );
              });

              return allowedItems.map((item) => (
                <button
                  key={item.id}
                  onClick={item.action}
                  title={!isRailExpanded ? item.label : undefined}
                  className={`w-full p-2.5 rounded-xl flex items-center gap-3 transition font-semibold text-xs cursor-pointer ${
                    activeWorkflow === item.id && !item.isRoute
                      ? 'bg-violet-50 text-violet-900 border border-violet-200 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}
                  >
                    {item.icon}
                  </div>
                  {isRailExpanded && (
                    <div className="flex flex-col text-left truncate flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-slate-900 truncate">{item.label}</span>
                        {item.isRoute && (
                          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
                            Cockpit
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-normal truncate">
                        {item.sublabel}
                      </span>
                    </div>
                  )}
                </button>
              ));
            })()}
          </div>

          {/* Active Case Matter Quick Selector (Bottom of Rail) */}
          {isRailExpanded && (
            <div className="p-3 border-t border-slate-100 bg-slate-50 flex flex-col gap-1.5 shrink-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Active Matter</span>
                <span className="text-violet-700">{caseWorkspaces.length} Total</span>
              </span>
              <select
                value={selectedCaseId}
                onChange={(e) => {
                  setSelectedCaseId(e.target.value);
                  triggerToast('Active case switched');
                }}
                className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none focus:border-violet-600"
              >
                {caseWorkspaces.map((cw) => (
                  <option key={cw.id} value={cw.id}>
                    {cw.case_number}
                  </option>
                ))}
              </select>
            </div>
          )}
        </nav>

        {/* =====================================================================
            RIGHT MAIN AREA: STATE 1 HERO VIEW (WHEN !hasSearched)
            ===================================================================== */}
        {!hasSearched ? (
          <div className="flex-1 flex flex-col justify-between bg-white text-slate-900 font-sans p-6 overflow-y-auto">
            {/* HERO CENTER CONTAINER */}
            <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full text-center px-4 py-12">
              {/* GROK-STYLE SEARCH INPUT CONTAINER */}
              <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-2 transition-all focus-within:border-violet-600 focus-within:ring-4 focus-within:ring-violet-100 hover:border-slate-300">
                <div className="flex items-center gap-2 px-3 pt-2">
                  <button
                    onClick={() => setShowAttachModal(true)}
                    title="Attach Document / Case Brief for Similarity Search"
                    className="p-2 rounded-xl text-slate-500 hover:text-violet-700 hover:bg-violet-50 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                  >
                    <Plus className="w-4 h-4 text-slate-600" />
                    <Paperclip className="w-3.5 h-3.5" />
                  </button>

                  <textarea
                    rows={2}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSearch();
                      }
                    }}
                    placeholder="Search legal precedents, sections (e.g. 'cases involving attempt to murder vs 302'), or drop a brief..."
                    className="flex-1 text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-transparent border-none resize-none focus:outline-none px-2 py-1 leading-relaxed"
                  />
                </div>

                {attachedFile && (
                  <div className="mx-3 my-1 px-3 py-1.5 bg-violet-50 rounded-xl border border-violet-200 flex items-center justify-between text-xs text-violet-900 font-semibold">
                    <span className="flex items-center gap-2 truncate">
                      <FileCheck className="w-3.5 h-3.5 text-violet-700" />
                      {attachedFile.name}
                    </span>
                    <button
                      onClick={() => setAttachedFile(null)}
                      className="text-violet-700 hover:text-red-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Bottom Bar inside Search Box */}
                <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-slate-100 mt-1">
                  {/* Search Mode Switch */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                    <button
                      onClick={() => setSearchMode('grounded')}
                      className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                        searchMode === 'grounded'
                          ? 'bg-white text-violet-800 shadow-xs border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3 text-violet-700" /> Exact Precedents
                    </button>
                    <button
                      onClick={() => setSearchMode('ai')}
                      className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                        searchMode === 'ai'
                          ? 'bg-white text-violet-800 shadow-xs border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-violet-700" /> AI Memo
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={() => handleSearch()}
                    disabled={loading || (!searchQuery.trim() && !attachedFile)}
                    className={`p-2.5 rounded-2xl font-bold transition flex items-center justify-center cursor-pointer shadow-md ${
                      searchQuery.trim() || attachedFile
                        ? 'bg-violet-700 text-white hover:bg-violet-800 shadow-violet-700/30'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowUp className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* QUICK PROMPT PILLS */}
              <div className="mt-8 flex flex-col items-center gap-3 w-full">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Suggested Precedent Discovery Queries
                </span>
                <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
                  {QUICK_PROMPTS.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePromptClick(p.query)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-violet-50 text-slate-700 hover:text-violet-900 border border-slate-200 hover:border-violet-300 transition-all shadow-2xs hover:shadow-xs flex items-center gap-2 cursor-pointer text-left"
                    >
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* FOOTER STATS */}
            <div className="max-w-4xl mx-auto w-full py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>🏛️ Supreme Court & High Courts Jurisprudence Index</span>
              <span>⚡ Statutory Section Graph: IPC / BNS • CrPC / BNSS • Tax • IBC</span>
            </div>

            {/* ATTACHMENT MODAL */}
            {showAttachModal && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                <div className="bg-white border border-slate-300 p-6 rounded-3xl w-full max-w-md flex flex-col gap-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <UploadCloud className="w-4 h-4 text-violet-700" /> Upload Document for Similarity
                      Search
                    </h3>
                    <button
                      onClick={() => setShowAttachModal(false)}
                      className="text-slate-400 hover:text-slate-800 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <label className="border-2 border-dashed border-slate-300 hover:border-violet-500 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-slate-50 hover:bg-violet-50/50 cursor-pointer transition">
                    <FileText className="w-8 h-8 text-violet-700" />
                    <div className="text-center">
                      <span className="text-xs font-bold text-slate-900 block">
                        Click to upload or drag & drop
                      </span>
                      <span className="text-[11px] text-slate-500">
                        PDF, TXT, or MD pleadings, orders or briefs
                      </span>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.txt,.md,.doc,.docx"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setAttachedFile(e.target.files[0]);
                          setShowAttachModal(false);
                          triggerToast(`Attached: ${e.target.files[0].name}`);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ===================================================================
             RIGHT MAIN AREA: STATE 2 RANKED RESULTS & DETAIL READER (POST-SEARCH)
             =================================================================== */
          <>
            {/* PANEL 2: PRECEDENT STREAM & RANKED RESULTS (Center) */}
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 border-r border-slate-200">
              {/* Stream Header */}
              <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-200 shrink-0 bg-slate-50">
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-violet-700" />
                  Ranked Precedents ({results.length})
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Sorted by Legal Relevance & Hierarchy
                </span>
              </div>

          {/* BLOCK: INFERRED QUERY TAGS & SCOPED PRE-FILTER BANNER */}
          {parsedIntent &&
            (parsedIntent.extracted_judge ||
              parsedIntent.extracted_section ||
              parsedIntent.extracted_court ||
              parsedIntent.extracted_year ||
              (parsedIntent.extracted_filters &&
                Object.keys(parsedIntent.extracted_filters).length > 0)) && (
              <div className="mx-4 mt-3 p-3 bg-violet-50/90 border border-violet-200 rounded-2xl flex flex-col gap-2 shadow-2xs shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-violet-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-violet-700" />
                    Inferred Query Tags (Scoped Candidate Filter)
                  </span>
                  <button
                    onClick={() => setParsedIntent(null)}
                    className="text-[10px] text-violet-700 hover:text-violet-900 font-bold flex items-center gap-0.5 cursor-pointer"
                    title="Clear inferred filter tags"
                  >
                    <X className="w-3 h-3" /> Clear
                  </button>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {parsedIntent.extracted_judge && (
                    <span
                      onClick={(e) => handleQuickSearch(parsedIntent.extracted_judge, e)}
                      className="px-2.5 py-1 bg-white hover:bg-violet-100 text-violet-950 border border-violet-300 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                      title="Click to search by this judge"
                    >
                      <Gavel className="w-3 h-3 text-violet-700" />
                      <span>Coram: {parsedIntent.extracted_judge}</span>
                    </span>
                  )}
                  {parsedIntent.extracted_section && (
                    <span
                      onClick={(e) => handleQuickSearch(parsedIntent.extracted_section, e)}
                      className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-lg text-xs font-mono font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                      title="Click to search this section"
                    >
                      <Scale className="w-3 h-3 text-amber-700" />
                      <span>Section: {parsedIntent.extracted_section}</span>
                    </span>
                  )}
                  {parsedIntent.extracted_court && (
                    <span
                      onClick={(e) => handleQuickSearch(parsedIntent.extracted_court, e)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                      title="Click to search this court"
                    >
                      <Building2 className="w-3 h-3 text-slate-600" />
                      <span>Court: {parsedIntent.extracted_court}</span>
                    </span>
                  )}
                  {parsedIntent.extracted_year && (
                    <span
                      onClick={(e) => handleQuickSearch(String(parsedIntent.extracted_year), e)}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-950 border border-indigo-300 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                      title="Click to search this year"
                    >
                      <Calendar className="w-3 h-3 text-indigo-600" />
                      <span>Year: {parsedIntent.extracted_year}</span>
                    </span>
                  )}
                  {parsedIntent.extracted_location && (
                    <span
                      onClick={(e) => handleQuickSearch(parsedIntent.extracted_location, e)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                      title="Click to search this location"
                    >
                      <span>Location: {parsedIntent.extracted_location}</span>
                    </span>
                  )}
                </div>
              </div>
            )}

          {/* Results List */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-500 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin text-violet-700" />
                <span className="font-semibold">Querying precedent database & case records...</span>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-20 text-slate-400 text-xs italic">
                No matching legal precedents found. Try adjusting filters or search query.
              </div>
            ) : (
              results.map((r) => {
                const isSelected = selectedCnr === r.cnr;
                const caseTitle = r.case_title || r.title || 'Not available';
                const courtType = r.court_type || r.court || 'Not available';
                const judge = Array.isArray(r.judge)
                  ? r.judge.join(', ')
                  : r.judge || r.judges || r.coram || 'Not available';
                const caseNumbersPills = toPillsArray(r.case_number);
                const partiesPills = toPillsArray(r.parties);
                const respondentsPills = toPillsArray(r.respondents);
                const plaintiffsPills = toPillsArray(r.plaintiffs || r.appellants || r.petitioners);
                const sectionsPills = toPillsArray(
                  r.sections_or_articles_involved || r.matched_statutes || r.sections,
                );
                const summaryText =
                  r.case_summary || r.summary || r.ratio_snippet || 'Not available';
                const petArgs = Array.isArray(r.petitioner_arguments)
                  ? r.petitioner_arguments
                  : r.petitioner_arguments
                    ? [r.petitioner_arguments]
                    : [];
                const respArgs = Array.isArray(r.respondent_arguments)
                  ? r.respondent_arguments
                  : r.respondent_arguments
                    ? [r.respondent_arguments]
                    : [];
                const docPath =
                  r.document_path ||
                  r.source_document ||
                  `/storage/judgments/${r.cnr || 'case_order'}.pdf`;

                return (
                  <div
                    key={r.cnr}
                    onClick={() => handleCardClick(r)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-3 ${
                      isSelected
                        ? 'bg-white border-violet-500 shadow-md ring-2 ring-violet-200'
                        : 'bg-white hover:border-slate-300 border-slate-200 shadow-2xs hover:shadow-xs'
                    }`}
                  >
                    {/* First Row: Case Title */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <h3 className="text-sm font-extrabold text-slate-900 leading-snug break-words">
                          {caseTitle}
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono flex-wrap">
                          {caseNumbersPills.length > 0 ? (
                            caseNumbersPills.map((cn) => (
                              <span
                                key={cn}
                                onClick={(e) => handleQuickSearch(cn, e)}
                                className="font-bold text-violet-900 bg-violet-50 hover:bg-violet-100 px-1.5 py-0.5 rounded border border-violet-200 cursor-pointer"
                                title="Click to search this case number"
                              >
                                {cn}
                              </span>
                            ))
                          ) : r.case_number ? (
                            <span
                              onClick={(e) => handleQuickSearch(String(r.case_number), e)}
                              className="font-bold text-violet-900 bg-violet-50 hover:bg-violet-100 px-1.5 py-0.5 rounded border border-violet-200 cursor-pointer"
                              title="Click to search this case number"
                            >
                              {String(r.case_number)}
                            </span>
                          ) : null}
                          {r.decision_date && (
                            <span
                              onClick={(e) => handleQuickSearch(r.decision_date, e)}
                              className="hover:text-violet-700 hover:underline cursor-pointer"
                              title="Click to search by date"
                            >
                              Date: {r.decision_date}
                            </span>
                          )}
                          {r.parallel_citation && (
                            <span
                              onClick={(e) => handleQuickSearch(r.parallel_citation, e)}
                              className="hover:text-violet-700 hover:underline cursor-pointer"
                              title="Click to search by citation"
                            >
                              • {r.parallel_citation}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {r.status_badge && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              r.status_badge === 'Overruled'
                                ? 'bg-red-50 text-red-800 border-red-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {r.status_badge}
                          </span>
                        )}
                        {r.outcome && (
                          <span
                            className="text-[10px] font-bold text-violet-900 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-md max-w-[200px] truncate"
                            title={r.outcome}
                          >
                            {r.outcome}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Second Row: Court Type and Coram / Judges / Judge */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                          Court Type:
                        </span>
                        <span
                          onClick={(e) => handleQuickSearch(courtType, e)}
                          className="font-bold text-slate-900 truncate hover:text-violet-700 hover:underline cursor-pointer"
                          title="Click to search / filter by court"
                        >
                          {courtType}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                          Coram / Judge:
                        </span>
                        <span
                          onClick={(e) => handleQuickSearch(judge, e)}
                          className="font-bold text-slate-900 truncate hover:text-violet-700 hover:underline cursor-pointer"
                          title="Click to search precedents by this judge"
                        >
                          {judge}
                        </span>
                      </div>
                    </div>

                    {/* Third Row: Parties as pills, Respondents as pills */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Parties:
                        </span>
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {partiesPills.length > 0 ? (
                            partiesPills.map((p, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-0.5 bg-indigo-50 text-indigo-900 border border-indigo-200/80 rounded-full text-[10px] font-semibold"
                              >
                                {p}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Not available</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Respondents:
                        </span>
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {respondentsPills.length > 0 ? (
                            respondentsPills.map((resp, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-0.5 bg-rose-50 text-rose-900 border border-rose-200/80 rounded-full text-[10px] font-semibold"
                              >
                                {resp}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Not available</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Fourth Row: Plaintiffs as pills */}
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Plaintiffs:
                      </span>
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {plaintiffsPills.length > 0 ? (
                          plaintiffsPills.map((pl, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 bg-emerald-50 text-emerald-900 border border-emerald-200/80 rounded-full text-[10px] font-semibold"
                            >
                              {pl}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Not available</span>
                        )}
                      </div>
                    </div>

                    {/* Fifth Row: Sections as pills */}
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Sections / Articles Involved:
                      </span>
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {sectionsPills.length > 0 ? (
                          sectionsPills.map((sec, idx) => (
                            <span
                              key={idx}
                              onClick={(e) => handleQuickSearch(sec, e)}
                              className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 hover:border-amber-300 rounded text-[10px] font-mono font-bold transition cursor-pointer"
                              title="Click to search precedents citing this section"
                            >
                              {sec}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Not available</span>
                        )}
                      </div>
                    </div>

                    {/* BLOCK: CASE FINDINGS PREVIEW (Petitioner Arguments & Respondent Arguments) */}
                    {(petArgs.length > 0 || respArgs.length > 0) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50/90 p-2.5 rounded-xl border border-slate-200/70">
                        {petArgs.length > 0 && (
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1">
                              <Sword className="w-3 h-3 text-emerald-700" /> Petitioner Arguments:
                            </span>
                            <p className="text-[10px] text-slate-700 line-clamp-2 italic">
                              "{petArgs[0]}"
                            </p>
                          </div>
                        )}
                        {respArgs.length > 0 && (
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-900 flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3 text-rose-700" /> Respondent Defenses:
                            </span>
                            <p className="text-[10px] text-slate-700 line-clamp-2 italic">
                              "{respArgs[0]}"
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sixth Row: Case Summary */}
                    <div className="text-[11px] text-slate-800 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                      <span className="font-extrabold text-violet-950 block mb-1">
                        Case Summary:
                      </span>
                      <p className="text-slate-700 whitespace-pre-wrap">{summaryText}</p>
                    </div>

                    {/* Seventh Row: Card Bottom Action Bar */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) =>
                            handleCopyCitation(r.parallel_citation || caseTitle, r.cnr, e)
                          }
                          className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1 text-[10px] transition cursor-pointer"
                          title="Copy citation to clipboard"
                        >
                          {copiedCitationId === r.cnr ? (
                            <CheckCheck className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>Copy Citation</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => openSaveModalForPrecedent(r, e)}
                          className="py-1 px-2.5 bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-200 rounded-lg font-semibold flex items-center gap-1 text-[10px] transition cursor-pointer"
                          title="Save this precedent into an active matter folder"
                        >
                          <Pin className="w-3 h-3" />
                          <span>Save to Matter</span>
                        </button>
                        <span className="text-violet-700 font-extrabold text-xs flex items-center gap-0.5">
                          <span>Inspect</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* =====================================================================
            PANEL 3: RIGHT VIEWPORT DEEP READER & CASE DOSSIER DETAIL
            ===================================================================== */}
        {showPanel3 &&
          selectedResult &&
          (() => {
            const linkedCasesList = toPillsArray(
              selectedResult.linked_cases ||
                selectedResult.connected_cases ||
                selectedResult.citations ||
                selectedResult.cited_cases ||
                selectedResult.precedents,
            );
            const sectionsList = toPillsArray(
              selectedResult.sections_or_articles_involved ||
                selectedResult.matched_statutes ||
                selectedResult.sections,
            );
            const rawTextContent =
              selectedResult.full_text ||
              selectedResult.content ||
              selectedResult.raw_text ||
              selectedResult.case_summary ||
              selectedResult.summary ||
              'No extracted text record available for this precedent.';
            const wordCount = rawTextContent.trim().split(/\s+/).filter(Boolean).length;

            const petArgs = Array.isArray(selectedResult.petitioner_arguments)
              ? selectedResult.petitioner_arguments
              : selectedResult.petitioner_arguments
                ? [selectedResult.petitioner_arguments]
                : [];
            const respArgs = Array.isArray(selectedResult.respondent_arguments)
              ? selectedResult.respondent_arguments
              : selectedResult.respondent_arguments
                ? [selectedResult.respondent_arguments]
                : [];
            const courtFindingsText =
              selectedResult.court_findings || selectedResult.parent_sections?.facts || null;
            const holdingText =
              selectedResult.holding ||
              selectedResult.parent_sections?.ratio_decidendi ||
              selectedResult.outcome ||
              null;
            const caseOverviewText =
              selectedResult.case_overview ||
              selectedResult.case_summary ||
              selectedResult.summary ||
              null;

            return (
              <div className="w-96 lg:w-[460px] bg-white border-l border-slate-200 flex flex-col shrink-0 shadow-xl relative z-20 overflow-hidden">
                {/* Header */}
                <div className="p-3.5 border-b border-slate-200 flex items-start justify-between gap-2 bg-slate-50/80">
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        onClick={(e) =>
                          handleQuickSearch(selectedResult.case_number || selectedResult.cnr, e)
                        }
                        className="text-[10px] font-mono font-extrabold text-violet-800 bg-violet-50 hover:bg-violet-100 px-2 py-0.5 rounded border border-violet-200 cursor-pointer"
                        title="Click to search case number"
                      >
                        {selectedResult.case_number || selectedResult.cnr}
                      </span>
                      {selectedResult.status_badge && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                            selectedResult.status_badge === 'Overruled'
                              ? 'bg-red-50 text-red-800 border-red-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {selectedResult.status_badge}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs font-extrabold text-slate-900 leading-snug break-words">
                      {selectedResult.case_title || selectedResult.title || 'Not available'}
                    </h3>
                    {selectedResult.parallel_citation && (
                      <p
                        onClick={(e) => handleQuickSearch(selectedResult.parallel_citation, e)}
                        className="text-[10px] text-slate-600 font-mono hover:text-violet-700 cursor-pointer flex items-center gap-1"
                        title="Click to search this citation"
                      >
                        <Copy className="w-2.5 h-2.5 text-slate-400" />
                        <span>{selectedResult.parallel_citation}</span>
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowPanel3(false)}
                    className="p-1 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition cursor-pointer shrink-0"
                    title="Close Inspector"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Panel 3 Body: Core Inspector Sections */}
                <div className="flex-1 p-3.5 overflow-y-auto flex flex-col gap-4 text-xs">
                  {/* 1. EXTRACTED DATES, JUDGES & METADATA */}
                  <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80 flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-violet-700" />
                        Extracted Dates & Metadata
                      </span>
                    </div>

                    {/* Dates Row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div
                        onClick={(e) => handleQuickSearch(selectedResult.decision_date, e)}
                        className="bg-white p-2.5 rounded-xl border border-slate-200 hover:border-violet-400 hover:bg-violet-50/40 transition cursor-pointer flex flex-col gap-0.5"
                        title="Click to search by decision date"
                      >
                        <span className="text-[9px] font-bold uppercase text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-violet-600" /> Judgment Date
                        </span>
                        <span className="text-[11px] font-bold text-slate-900">
                          {selectedResult.decision_date ||
                            selectedResult.date ||
                            selectedResult.case_date ||
                            'Not available'}
                        </span>
                      </div>

                      <div
                        onClick={(e) =>
                          handleQuickSearch(
                            selectedResult.filing_date ||
                              selectedResult.hearing_date ||
                              selectedResult.incident_date,
                            e,
                          )
                        }
                        className="bg-white p-2.5 rounded-xl border border-slate-200 hover:border-violet-400 hover:bg-violet-50/40 transition cursor-pointer flex flex-col gap-0.5"
                        title="Click to search by filing/hearing date"
                      >
                        <span className="text-[9px] font-bold uppercase text-slate-500 flex items-center gap-1">
                          <History className="w-3 h-3 text-indigo-600" /> Filing / Hearing Date
                        </span>
                        <span className="text-[11px] font-bold text-slate-900">
                          {selectedResult.filing_date ||
                            selectedResult.hearing_date ||
                            selectedResult.incident_date ||
                            'Not specified'}
                        </span>
                      </div>
                    </div>

                    {/* Coram / Judge & Court */}
                    <div className="grid grid-cols-2 gap-2">
                      <div
                        onClick={(e) => {
                          const targetJudge = Array.isArray(selectedResult.judge)
                            ? selectedResult.judge[0]
                            : selectedResult.judge || selectedResult.judges || selectedResult.coram;
                          if (targetJudge) handleQuickSearch(targetJudge, e);
                        }}
                        className="bg-white p-2.5 rounded-xl border border-slate-200 hover:border-violet-400 hover:bg-violet-50/40 transition cursor-pointer flex flex-col gap-0.5"
                        title="Click to search all cases by this Judge"
                      >
                        <span className="text-[9px] font-bold uppercase text-slate-500 flex items-center gap-1">
                          <Gavel className="w-3 h-3 text-violet-700" /> Coram / Judge
                        </span>
                        <span
                          className="text-[11px] font-bold text-slate-900 truncate block"
                          title={
                            Array.isArray(selectedResult.judge)
                              ? selectedResult.judge.join(', ')
                              : selectedResult.judge
                          }
                        >
                          {Array.isArray(selectedResult.judge)
                            ? selectedResult.judge.join(', ')
                            : selectedResult.judge ||
                              selectedResult.judges ||
                              selectedResult.coram ||
                              'Not available'}
                        </span>
                      </div>

                      <div
                        onClick={(e) =>
                          handleQuickSearch(selectedResult.court_type || selectedResult.court, e)
                        }
                        className="bg-white p-2.5 rounded-xl border border-slate-200 hover:border-violet-400 hover:bg-violet-50/40 transition cursor-pointer flex flex-col gap-0.5"
                        title="Click to filter by this Court"
                      >
                        <span className="text-[9px] font-bold uppercase text-slate-500 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-600" /> Court Jurisdiction
                        </span>
                        <span className="text-[11px] font-bold text-slate-900 truncate block">
                          {selectedResult.court_type || selectedResult.court || 'Not available'}
                        </span>
                      </div>
                    </div>

                    {/* Statutory Sections Clickable */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col gap-1.5">
                      <span className="text-[9px] font-bold uppercase text-slate-500 flex items-center gap-1">
                        <Scale className="w-3 h-3 text-amber-700" /> Statutory Sections Involved:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {sectionsList.length > 0 ? (
                          sectionsList.map((sec: string, idx: number) => (
                            <span
                              key={idx}
                              onClick={(e) => handleQuickSearch(sec, e)}
                              className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 hover:border-amber-400 rounded-md text-[10px] font-mono font-bold transition cursor-pointer"
                              title="Click to search precedents citing this statutory section"
                            >
                              {sec}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">
                            No specific sections recorded
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Linked Cases & Precedent Citations */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col gap-1.5">
                      <span className="text-[9px] font-bold uppercase text-slate-500 flex items-center gap-1">
                        <Link2 className="w-3 h-3 text-indigo-700" /> Linked Cases & Citations:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {linkedCasesList.length > 0 ? (
                          linkedCasesList.map((cItem: string, idx: number) => (
                            <button
                              key={idx}
                              onClick={(e) => handleQuickSearch(cItem, e)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-200 hover:border-indigo-400 rounded-lg text-[10px] font-mono font-semibold transition flex items-center gap-1 shadow-2xs cursor-pointer text-left"
                              title="Click to search this linked precedent"
                            >
                              <Link2 className="w-2.5 h-2.5 text-indigo-600 shrink-0" />
                              <span className="truncate max-w-[280px]">{cItem}</span>
                            </button>
                          ))
                        ) : selectedResult.parallel_citation ? (
                          <button
                            onClick={(e) => handleQuickSearch(selectedResult.parallel_citation, e)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-200 hover:border-indigo-400 rounded-lg text-[10px] font-mono font-semibold transition flex items-center gap-1 cursor-pointer"
                            title="Click to search this citation"
                          >
                            <Link2 className="w-2.5 h-2.5 text-indigo-600 shrink-0" />
                            <span>{selectedResult.parallel_citation}</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">
                            No linked precedents or citations cited
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* BLOCK: CASE FINDINGS & SUBMISSIONS (Petitioner Args, Respondent Counter, Holding) */}
                  <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80 flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-violet-700" />
                        Case Findings & Submissions
                      </span>
                    </div>

                    {/* Petitioner Arguments */}
                    <div className="bg-white p-3 rounded-xl border border-emerald-200/80 flex flex-col gap-1.5 shadow-2xs">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                        <Sword className="w-3.5 h-3.5 text-emerald-700" />
                        Petitioner Submissions & Legal Grounds:
                      </span>
                      {petArgs.length > 0 ? (
                        <ul className="list-disc list-inside flex flex-col gap-1 text-[11px] text-slate-800 leading-relaxed font-medium">
                          {petArgs.map((arg: string, idx: number) => (
                            <li key={idx} className="break-words">
                              {arg}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[10px] text-slate-500 italic">
                          No explicit petitioner grounds recorded.
                        </p>
                      )}
                    </div>

                    {/* Respondent Counter-Arguments */}
                    <div className="bg-white p-3 rounded-xl border border-rose-200/80 flex flex-col gap-1.5 shadow-2xs">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-700" />
                        Respondent Counter-Arguments & Defenses:
                      </span>
                      {respArgs.length > 0 ? (
                        <ul className="list-disc list-inside flex flex-col gap-1 text-[11px] text-slate-800 leading-relaxed font-medium">
                          {respArgs.map((arg: string, idx: number) => (
                            <li key={idx} className="break-words">
                              {arg}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[10px] text-slate-500 italic">
                          No explicit respondent defenses recorded.
                        </p>
                      )}
                    </div>

                    {/* Judicial Findings & Holding */}
                    <div className="bg-white p-3 rounded-xl border border-violet-200/80 flex flex-col gap-1.5 shadow-2xs">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-950 flex items-center gap-1.5">
                        <Gavel className="w-3.5 h-3.5 text-violet-700" />
                        Judicial Holding & Ratio Decidendi:
                      </span>
                      <p className="text-[11px] text-slate-800 leading-relaxed font-medium">
                        {holdingText ||
                          courtFindingsText ||
                          'Order passed in accordance with statutory guidelines.'}
                      </p>
                    </div>
                  </div>

                  {/* BLOCK: 500-WORD EXECUTIVE CASE SUMMARY */}
                  {caseOverviewText && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col overflow-hidden">
                      <div className="p-3 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4 text-violet-700 shrink-0" />
                          <span className="text-[11px] font-extrabold text-slate-900">
                            Executive Case Summary (Narrative Overview)
                          </span>
                        </div>
                      </div>
                      <div className="p-3.5 text-[11px] text-slate-800 leading-relaxed font-medium whitespace-pre-wrap select-text bg-slate-50/20">
                        {caseOverviewText}
                      </div>
                    </div>
                  )}

                  {/* 2. COMPLETE EXTRACTED TEXT RECORD */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col overflow-hidden">
                    <div className="p-3 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-violet-700 shrink-0" />
                        <span className="text-[11px] font-extrabold text-slate-900">
                          Complete Extracted Text
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {wordCount.toLocaleString()} words
                        </span>
                        <button
                          onClick={(e) => handleCopyCitation(rawTextContent, 'fulltext', e)}
                          className="text-[10px] font-bold text-violet-700 hover:text-violet-900 bg-white hover:bg-violet-50 px-2 py-1 rounded-lg border border-slate-200 hover:border-violet-300 transition flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Copy full text to clipboard"
                        >
                          {copiedCitationId === 'fulltext' ? (
                            <CheckCheck className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>Copy Text</span>
                        </button>
                      </div>
                    </div>
                    <div className="p-3.5 text-[11px] text-slate-800 leading-relaxed font-mono whitespace-pre-wrap select-text max-h-72 overflow-y-auto bg-slate-50/30">
                      {rawTextContent}
                    </div>
                  </div>

                  {/* 3. OPTIONS TO DOWNLOAD */}
                  <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5 text-violet-700" />
                        Download & Export Options
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* Download PDF */}
                      <button
                        onClick={() => handleDownloadPdf(selectedResult)}
                        className="p-2.5 bg-white hover:bg-violet-50 text-slate-800 hover:text-violet-950 border border-slate-200 hover:border-violet-300 rounded-xl transition flex flex-col items-center justify-center gap-1 shadow-2xs cursor-pointer group text-center"
                        title="Download or open original PDF judgment"
                      >
                        <FileText className="w-4 h-4 text-rose-600 group-hover:scale-110 transition" />
                        <span className="text-[10px] font-extrabold">Original PDF</span>
                        <span className="text-[8px] text-slate-400 font-mono">.pdf format</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2 shrink-0">
                  <button
                    onClick={(e) =>
                      handleCopyCitation(
                        selectedResult.parallel_citation || selectedResult.title,
                        'panel3_citation',
                        e,
                      )
                    }
                    className="flex-1 py-2 px-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    {copiedCitationId === 'panel3_citation' ? (
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-violet-700" />
                    )}
                    <span>Copy Citation</span>
                  </button>
                  <button
                    onClick={(e) => openSaveModalForPrecedent(selectedResult, e)}
                    className="flex-1 py-2 px-2.5 bg-violet-700 hover:bg-violet-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Pin className="w-3.5 h-3.5" />
                    <span>Save to Matter</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </>
      )}
      </div>

      {/* SAVE TO MATTER MODAL */}
      {showSavePrecedentModal && precedentToSave && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-300 p-5 rounded-3xl w-full max-w-md flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Pin className="w-4 h-4 text-violet-700" /> Link Precedent to Case Matter
              </h3>
              <button
                onClick={() => setShowSavePrecedentModal(false)}
                className="text-slate-400 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-violet-50 p-2.5 rounded-xl border border-violet-200 text-xs">
              <span className="font-bold text-violet-900 block truncate">
                {precedentToSave.title}
              </span>
              <span className="text-[10px] text-slate-600 font-mono">{precedentToSave.court}</span>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <label className="font-bold text-slate-700">Target Case Matter:</label>
              <select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-violet-700"
              >
                {caseWorkspaces.map((cw) => (
                  <option key={cw.id} value={cw.id}>
                    {cw.case_number} - {cw.title}
                  </option>
                ))}
              </select>

              <label className="font-bold text-slate-700 pt-1">Folder Destination:</label>
              <select
                value={selectedSubfolder}
                onChange={(e) => setSelectedSubfolder(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-violet-700"
              >
                {SUBFOLDERS.map((sf) => (
                  <option key={sf} value={sf}>
                    {sf}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowSavePrecedentModal(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePrecedent}
                className="px-4 py-1.5 text-xs bg-violet-700 hover:bg-violet-800 text-white font-bold rounded-xl shadow-md cursor-pointer"
              >
                Save & Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
