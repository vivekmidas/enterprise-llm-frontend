/*
===============================================================================
BLOCK COMMENT: LEGAL RESEARCH HUB COMPONENT
Module: frontend/app/legal/LegalResearchHub.tsx
Description:
    Integrated 3-Panel Legal Precedent Research Workspace embedded directly into /legal.
    - Panel 1: Collapsible mini-rail / drawer for Case Workspaces & Saved Queries.
    - Panel 2: Center Viewport with search bar, multi-select filter popover trigger, intent chips, and judgment result cards.
    - Panel 3: Right Viewport Detail Panel featuring Parent Section Breakdown (Facts, Issues, Ratio Decidendi, Holding Order) & Precedent Strategy Graph.
    - Multi-Select Filter Popover: Dropdown overlay anchored to search bar with multi-select checkboxes for Courts, Statutory Sections, Outcome Tags, Status Badges, Judge, and Year range.
===============================================================================
*/

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
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
  PanelLeftOpen
} from 'lucide-react';

// Fallback Default Taxonomies (in case API returns null)
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
  'Income Tax Act Sec 148A(b)',
  'Income Tax Act Sec 148',
  'BNS Sec 103(1)',
  'BNSS Sec 480',
  'IPC Sec 302',
  'CGST Sec 107',
  'CrPC Sec 439',
  'Companies Act Sec 241/242',
];

const DEFAULT_OUTCOME_TAG_OPTIONS = [
  '[Notice Quashed / Appeal Allowed]',
  '[Bail Granted]',
  '[Petition Dismissed]',
  '[Interim Stay Granted]',
  '[Remanded back to AO]'
];

const DEFAULT_STATUS_BADGE_OPTIONS = [
  'Good Law',
  'Overruled',
  'Distinguished / Referred'
];

const SUBFOLDERS = [
  '📁 03_Research_&_Judgments',
  '📁 01_Pleadings_&_Drafts',
  '📁 02_Client_Documents_&_Transcripts',
  '📁 04_Compilations_&_Binders',
];

export default function LegalResearchHub() {
  // Mode State: Grounded Non-LLM vs AI Assisted
  const [searchMode, setSearchMode] = useState<'grounded' | 'ai'>('grounded');

  // Search & Intent state
  const [searchQuery, setSearchQuery] = useState(
    ''
  );
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [parsedIntent, setParsedIntent] = useState<any>(null);

  // ---------------------------------------------------------------------------
  // PANEL 1 STATE: MINIMIZED / COLLAPSED BY DEFAULT
  // ---------------------------------------------------------------------------
  const [isPanel1Collapsed, setIsPanel1Collapsed] = useState(true);

  // ---------------------------------------------------------------------------
  // MULTI-SELECT FILTER POPOVER STATE
  // ---------------------------------------------------------------------------
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const filterPopoverRef = useRef<HTMLDivElement>(null);

  // Filter Taxonomies (fetched from API or fallback)
  const [courtOptions, setCourtOptions] = useState(DEFAULT_COURT_OPTIONS);
  const [statuteOptions, setStatuteOptions] = useState(DEFAULT_STATUTE_OPTIONS);
  const [outcomeTagOptions, setOutcomeTagOptions] = useState(DEFAULT_OUTCOME_TAG_OPTIONS);
  const [statusBadgeOptions, setStatusBadgeOptions] = useState(DEFAULT_STATUS_BADGE_OPTIONS);

  // Multi-Select Selections
  const [selectedCourts, setSelectedCourts] = useState<string[]>(['Supreme Court of India', 'High Court of Delhi']);
  const [selectedStatutes, setSelectedStatutes] = useState<string[]>(['Income Tax Act Sec 148A(b)']);
  const [selectedOutcomeTags, setSelectedOutcomeTags] = useState<string[]>(['[Notice Quashed / Appeal Allowed]']);
  const [selectedStatusBadges, setSelectedStatusBadges] = useState<string[]>(['Good Law']);
  const [judgeFilter, setJudgeFilter] = useState('');
  const [yearMin, setYearMin] = useState(2022);
  const [yearMax, setYearMax] = useState(2026);

  // Active Filters Count Badge
  const activeFiltersCount =
    selectedCourts.length +
    selectedStatutes.length +
    selectedOutcomeTags.length +
    selectedStatusBadges.length +
    (judgeFilter ? 1 : 0);

  // ---------------------------------------------------------------------------
  // PANEL 3 STATE: DETAIL PANEL (HIDDEN BY DEFAULT, OPENS ON RESULT CLICK)
  // ---------------------------------------------------------------------------
  const [selectedCnr, setSelectedCnr] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [showPanel3, setShowPanel3] = useState(false);
  const [activeTab, setActiveTab] = useState<'context' | 'graph' | 'audit'>('context');

  // Case Workspaces & Save Precedent Modal
  const [caseWorkspaces, setCaseWorkspaces] = useState<any[]>([]);
  const [showSavePrecedentModal, setShowSavePrecedentModal] = useState(false);
  const [precedentToSave, setPrecedentToSave] = useState<any>(null);
  const [linkMode, setLinkMode] = useState<'existing' | 'new'>('existing');
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [selectedSubfolder, setSelectedSubfolder] = useState('📁 03_Research_&_Judgments');
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCaseNumber, setNewCaseNumber] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Saved Queries state
  const [activeQueryTab, setActiveQueryTab] = useState<'private' | 'public'>('private');
  const [privateQueries, setPrivateQueries] = useState<any[]>([]);
  const [publicQueries, setPublicQueries] = useState<any[]>([]);
  const [showSaveQueryModal, setShowSaveQueryModal] = useState(false);
  const [saveQueryTitle, setSaveQueryTitle] = useState('');
  const [saveQueryIsPublic, setSaveQueryIsPublic] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

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
    loadFilterOptions();
    handleSearch();
    loadCaseWorkspaces();
    loadSavedQueries();
    loadAuditLogs();
  }, []);

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
      console.warn('Failed to load backend filter options, using default fallback', err);
    }
  };

  const handleSearch = async (queryText?: string) => {
    const textToSearch = queryText !== undefined ? queryText : searchQuery;
    setLoading(true);
    try {
      const res = await api.searchLegalCases({
        query: textToSearch,
        courts: selectedCourts,
        judge: judgeFilter || undefined,
        statutes: selectedStatutes,
        outcome_tags: selectedOutcomeTags,
        year_min: yearMin,
        year_max: yearMax,
        limit: 20
      });
      const items = res.results || [];
      setResults(items);
      setParsedIntent(res.intent_parsed || null);

      if (items.length > 0) {
        if (!selectedCnr) {
          setSelectedCnr(items[0].cnr);
          setSelectedResult(items[0]);
        }
      } else {
        setSelectedCnr(null);
        setSelectedResult(null);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  /* ==============================================================================
     BLOCK COMMENT: SESSION-SCOPED LEGAL CASE WORKSPACE STORAGE
     Prevents cross-user / cross-tenant workspace persistence across logins.
     ============================================================================== */
  const loadCaseWorkspaces = () => {
    try {
      const stored = typeof window !== 'undefined' ? sessionStorage.getItem('legal_case_workspaces') : null;
      if (stored) {
        const cases = JSON.parse(stored);
        setCaseWorkspaces(cases || []);
        if (cases && cases.length > 0) {
          setSelectedCaseId(cases[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load case workspaces', err);
    }
  };

  const loadSavedQueries = async () => {
    try {
      const res = await api.getSavedQueries();
      setPrivateQueries(res.private_queries || []);
      setPublicQueries(res.public_queries || []);
    } catch (err) {
      console.error('Failed to load saved queries', err);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await api.getLegalAuditLogs();
      setAuditLogs(res || []);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    }
  };

  const toggleCourt = (c: string) => {
    setSelectedCourts(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const toggleStatute = (st: string) => {
    setSelectedStatutes(prev => prev.includes(st) ? prev.filter(x => x !== st) : [...prev, st]);
  };

  const toggleOutcomeTag = (tag: string) => {
    setSelectedOutcomeTags(prev => prev.includes(tag) ? prev.filter(x => x !== tag) : [...prev, tag]);
  };

  const toggleStatusBadge = (badge: string) => {
    setSelectedStatusBadges(prev => prev.includes(badge) ? prev.filter(x => x !== badge) : [...prev, badge]);
  };

  const handleResetFilters = () => {
    setSelectedCourts(['Supreme Court of India', 'High Court of Delhi']);
    setSelectedStatutes(['Income Tax Act Sec 148A(b)']);
    setSelectedOutcomeTags(['[Notice Quashed / Appeal Allowed]']);
    setSelectedStatusBadges(['Good Law']);
    setJudgeFilter('');
    setYearMin(2022);
    setYearMax(2026);
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
          case_number: newCaseNumber || undefined,
          category: 'Income Tax / Re-assessment Appeal',
          court: precedentToSave.court || 'High Court of Delhi',
          files: [],
          precedents: [],
          updated_at: new Date().toISOString()
        };
        cases = [newCase, ...cases];
        targetCaseId = newCase.id;
      }

      const payload = {
        cnr: precedentToSave.cnr,
        title: precedentToSave.title,
        court: precedentToSave.court,
        decision_date: precedentToSave.decision_date,
        parallel_citation: precedentToSave.parallel_citation,
        status_badge: precedentToSave.status_badge || 'Good Law',
        outcome_tag: precedentToSave.outcome_tag,
        subfolder: selectedSubfolder,
        ratio_snippet: precedentToSave.ratio_snippet,
        query_text: searchQuery,
        filters_json: { selectedCourts, selectedStatutes, selectedOutcomeTags, yearMin, yearMax }
      };

      const updated = cases.map((c) =>
        c.id === targetCaseId
          ? { ...c, precedents: [...(c.precedents || []), payload], updated_at: new Date().toISOString() }
          : c
      );

      setCaseWorkspaces(updated);
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('legal_case_workspaces', JSON.stringify(updated));
        }
      } catch (e) { }

      setShowSavePrecedentModal(false);
      triggerToast('Precedent saved and linked to Case Workspace!');
      loadAuditLogs();
    } catch (err) {
      console.error('Failed to link precedent', err);
    }
  };

  const handleSaveQuery = async () => {
    if (!saveQueryTitle.trim()) return;
    try {
      await api.saveQuery({
        title: saveQueryTitle,
        query_text: searchQuery,
        filters_json: { selectedCourts, selectedStatutes, selectedOutcomeTags, yearMin, yearMax },
        is_public: saveQueryIsPublic
      });
      setShowSaveQueryModal(false);
      setSaveQueryTitle('');
      triggerToast('Search query saved successfully!');
      loadSavedQueries();
    } catch (err) {
      console.error('Failed to save query', err);
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="h-[calc(100vh-8rem)] bg-slate-50 text-slate-900 flex flex-col font-sans overflow-hidden rounded-2xl border border-slate-200 shadow-sm">

      {/* HEADER BAR */}
      <header className="h-12 border-b border-slate-200 bg-white px-4 flex items-center justify-between shrink-0 shadow-xs z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-700 flex items-center justify-center text-white shadow-sm shadow-violet-700/30">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
              Legal Precedent Research Hub
              {/* <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 font-mono font-semibold">
                3-Panel View
              </span> */}
            </h2>
          </div>
        </div>

        {/* Mode Toggle Switch */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setSearchMode('grounded')}
            className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 text-xs ${searchMode === 'grounded'
              ? 'bg-white text-violet-800 shadow-xs border border-slate-200 font-bold'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-violet-700" /> Grounded Search
          </button>
          <button
            onClick={() => setSearchMode('ai')}
            className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 text-xs ${searchMode === 'ai'
              ? 'bg-white text-violet-800 shadow-xs border border-slate-200 font-bold'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-700" /> AI Research
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs bg-slate-900 hover:bg-black text-white font-semibold px-3 py-1.5 rounded-xl transition shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Export Binder
          </button>
        </div>
      </header>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN 3-PANEL VIEW */}
      <div className="flex-1 flex overflow-hidden">

        {/* PANEL 1: LEFT SIDEBAR */}
        <div
          className={`${isPanel1Collapsed ? 'w-12' : 'w-72'
            } border-r border-slate-200 bg-slate-50 flex flex-col shrink-0 transition-all duration-300 relative z-20`}
        >
          <div className="h-10 px-2.5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
            {!isPanel1Collapsed && (
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate">
                <Layers className="w-4 h-4 text-violet-700" /> Workspaces & Queries
              </span>
            )}
            <button
              onClick={() => setIsPanel1Collapsed(!isPanel1Collapsed)}
              title={isPanel1Collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition mx-auto cursor-pointer"
            >
              {isPanel1Collapsed ? <PanelLeftOpen className="w-4 h-4 text-violet-700" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          {isPanel1Collapsed ? (
            <div className="flex-1 flex flex-col items-center py-4 gap-4 text-slate-600">
              <button
                onClick={() => setIsPanel1Collapsed(false)}
                title="Active Case Workspaces"
                className="p-2 rounded-xl bg-white border border-slate-200 text-violet-700 hover:bg-violet-50 transition shadow-xs relative cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-violet-700 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                  {caseWorkspaces.length}
                </span>
              </button>

              <button
                onClick={() => setIsPanel1Collapsed(false)}
                title="Saved Queries"
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-violet-50 transition shadow-xs cursor-pointer"
              >
                <Bookmark className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex-1 p-3 flex flex-col gap-3 overflow-y-auto">
              {/* Case Workspaces */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-violet-700" /> Case Workspaces
                  </span>
                  <span className="text-[9px] px-2 py-0.5 bg-violet-100 text-violet-800 font-bold rounded-full">
                    {caseWorkspaces.length} Assigned
                  </span>
                </div>

                <div className="flex flex-col gap-1 max-h-44 overflow-y-auto pr-1">
                  {caseWorkspaces.map((cw) => (
                    <div
                      key={cw.id}
                      onClick={() => setSelectedCaseId(cw.id)}
                      className={`p-2 rounded-lg border flex flex-col gap-0.5 cursor-pointer transition ${selectedCaseId === cw.id
                        ? 'bg-violet-50 border-violet-400 ring-1 ring-violet-300'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                        }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-violet-800">{cw.case_number}</span>
                        <span className="text-[9px] text-slate-500 font-mono truncate">{cw.court}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-900 truncate">{cw.title}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Saved Research Queries */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-violet-700" /> Saved Queries
                  </span>
                  <button
                    onClick={() => setShowSaveQueryModal(true)}
                    className="text-[10px] text-violet-700 hover:text-violet-900 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Save
                  </button>
                </div>

                <div className="grid grid-cols-2 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
                  <button
                    onClick={() => setActiveQueryTab('private')}
                    className={`py-1 rounded-md transition cursor-pointer ${activeQueryTab === 'private' ? 'bg-white text-violet-800 shadow-xs' : 'text-slate-600'
                      }`}
                  >
                    Private ({privateQueries.length})
                  </button>
                  <button
                    onClick={() => setActiveQueryTab('public')}
                    className={`py-1 rounded-md transition cursor-pointer ${activeQueryTab === 'public' ? 'bg-white text-violet-800 shadow-xs' : 'text-slate-600'
                      }`}
                  >
                    Firm ({publicQueries.length})
                  </button>
                </div>

                <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                  {(activeQueryTab === 'private' ? privateQueries : publicQueries).map((q) => (
                    <button
                      key={q.id}
                      onClick={() => {
                        setSearchQuery(q.query_text || '');
                        handleSearch(q.query_text);
                      }}
                      className="text-left p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs transition cursor-pointer"
                    >
                      <p className="font-bold text-slate-900 truncate text-[11px]">{q.title}</p>
                      <p className="text-[9px] text-slate-500 truncate">{q.query_text}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PANEL 2: CENTER VIEWPORT (SEARCH BAR + PRECEDENT RESULTS LIST) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">

          {/* TOP MIDDLE SEARCH SECTION */}
          <div className="bg-white border-b border-slate-200 p-3.5 shrink-0 shadow-xs relative z-20">
            <div className="max-w-4xl mx-auto w-full flex flex-col gap-2">

              {/* Centered Search Bar with Filter Icon Popover Trigger */}
              <div className="relative flex items-center gap-2">
                <div className="relative flex-1 flex items-center">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 z-10 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Type query or statute e.g. Section 148A(b) Income Tax Act..."
                    className="w-full text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 pl-10 pr-24 focus:outline-none focus:border-violet-700 focus:ring-2 focus:ring-violet-200"
                  />

                  <button
                    onClick={() => setShowFilterPopover(!showFilterPopover)}
                    className={`absolute right-1.5 p-1 px-2.5 rounded-lg border transition flex items-center gap-1 text-[11px] font-bold cursor-pointer ${showFilterPopover || activeFiltersCount > 0
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
                </div>

                <button
                  onClick={() => handleSearch()}
                  disabled={loading}
                  className="bg-violet-700 hover:bg-violet-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-violet-700/20 flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Search</span>
                </button>
              </div>

              {/* MULTI-SELECT FILTER POPOVER OVERLAY */}
              {showFilterPopover && (
                <div
                  ref={filterPopoverRef}
                  className="absolute top-14 left-0 right-0 max-w-4xl mx-auto bg-white p-4 rounded-2xl border border-slate-300 shadow-2xl z-50 grid grid-cols-12 gap-4 text-xs"
                >
                  <div className="col-span-12 flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-extrabold text-slate-900 flex items-center gap-2 text-xs">
                      <SlidersHorizontal className="w-4 h-4 text-violet-700" /> Precedent Filters
                    </span>
                    <button
                      onClick={() => setShowFilterPopover(false)}
                      className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Court Jurisdiction */}
                  <div className="col-span-6 flex flex-col gap-1.5">
                    <span className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">
                      Court Jurisdiction
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-1">
                      {courtOptions.map((c: any) => {
                        const val = typeof c === 'string' ? c : c.value;
                        const label = typeof c === 'string' ? c : c.label;
                        const active = selectedCourts.includes(val);
                        return (
                          <button
                            key={val}
                            onClick={() => toggleCourt(val)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition border flex items-center gap-1 cursor-pointer ${active
                              ? 'bg-violet-700 text-white border-violet-700'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                              }`}
                          >
                            {active && <Check className="w-2.5 h-2.5" />}
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Statutory Sections */}
                  <div className="col-span-6 flex flex-col gap-1.5">
                    <span className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">
                      Statutory Sections
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-1">
                      {statuteOptions.map((st) => {
                        const active = selectedStatutes.includes(st);
                        return (
                          <button
                            key={st}
                            onClick={() => toggleStatute(st)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition border flex items-center gap-1 cursor-pointer ${active
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                              }`}
                          >
                            {active && <Check className="w-2.5 h-2.5" />}
                            {st}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Popover Action Footer */}
                  <div className="col-span-12 flex items-center justify-between pt-2 border-t border-slate-200">
                    <button
                      onClick={handleResetFilters}
                      className="text-slate-600 hover:text-slate-900 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                    <button
                      onClick={() => {
                        setShowFilterPopover(false);
                        handleSearch();
                      }}
                      className="bg-violet-700 hover:bg-violet-800 text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* RESULTS CARDS LIST */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200 shrink-0">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-violet-700" /> Judgment Precedents ({results.length})
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Sorted by Relevance</span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-500 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin text-violet-700" />
                <span>Searching precedent database...</span>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs italic">No matching precedents found.</div>
            ) : (
              <div className="flex flex-col gap-3 max-w-4xl mx-auto w-full">
                {results.map((r) => {
                  const isSelected = selectedCnr === r.cnr;
                  return (
                    <div
                      key={r.cnr}
                      onClick={() => handleCardClick(r)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2.5 ${isSelected
                        ? 'bg-violet-50/80 border-violet-500 shadow-sm ring-1 ring-violet-400'
                        : 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex flex-col gap-0.5 max-w-[80%]">
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 flex-wrap">
                            <span className="font-bold text-violet-800">{r.court}</span>
                            <span>•</span>
                            <span className="font-mono">{r.decision_date}</span>
                            <span>•</span>
                            <span className="font-mono font-bold text-slate-800">{r.parallel_citation}</span>
                          </div>
                          <h3 className="text-xs font-extrabold text-slate-900">{r.title}</h3>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            {r.status_badge || 'Good Law'}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-800 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                        <span className="font-bold text-violet-900 mr-1">Ratio Snippet:</span>
                        {r.ratio_snippet}
                      </p>

                      <div className="flex items-center justify-between pt-0.5">
                        <span className="text-[10px] text-slate-500 font-semibold">{r.judge}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => openSaveModalForPrecedent(r, e)}
                            className="bg-violet-700 hover:bg-violet-800 text-white font-bold text-[11px] px-3 py-1 rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Pin className="w-3 h-3" /> Save to Case
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCardClick(r);
                            }}
                            className="bg-slate-900 hover:bg-black text-white font-bold text-[11px] px-3 py-1 rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <BookOpen className="w-3 h-3" /> Details
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* PANEL 3: RIGHT DETAIL PANEL */}
        {showPanel3 && selectedResult && (
          <div className="w-96 border-l border-slate-200 bg-slate-50 p-4 flex flex-col gap-3 overflow-y-auto shrink-0 shadow-lg relative z-20">
            <div className="flex items-start justify-between border-b border-slate-200 pb-2">
              <div>
                <span className="text-[10px] font-mono font-bold text-violet-800">CNR: {selectedResult.cnr}</span>
                <h3 className="text-xs font-extrabold text-slate-900 mt-0.5 leading-snug">
                  {selectedResult.title}
                </h3>
              </div>
              <button
                onClick={() => setShowPanel3(false)}
                className="p-1 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 bg-slate-200 p-0.5 rounded-lg border border-slate-300 text-[10px] font-bold">
              <button
                onClick={() => setActiveTab('context')}
                className={`py-1 rounded-md transition cursor-pointer ${activeTab === 'context' ? 'bg-white text-violet-800 shadow-xs' : 'text-slate-600'
                  }`}
              >
                Breakdown
              </button>
              <button
                onClick={() => setActiveTab('graph')}
                className={`py-1 rounded-md transition cursor-pointer ${activeTab === 'graph' ? 'bg-white text-violet-800 shadow-xs' : 'text-slate-600'
                  }`}
              >
                Citations
              </button>
            </div>

            {activeTab === 'context' ? (
              <div className="flex flex-col gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-1">
                  <h4 className="text-[11px] font-extrabold text-violet-900">Facts of Case</h4>
                  <p className="text-[11px] text-slate-800 leading-relaxed font-medium">
                    {selectedResult.parent_sections?.facts || 'Facts details available in complete case binder.'}
                  </p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-1">
                  <h4 className="text-[11px] font-extrabold text-violet-900">Ratio Decidendi</h4>
                  <p className="text-[11px] text-slate-800 leading-relaxed font-medium bg-amber-50 p-2 rounded-lg border border-amber-200">
                    {selectedResult.parent_sections?.ratio_decidendi || selectedResult.ratio_snippet}
                  </p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-1">
                  <h4 className="text-[11px] font-extrabold text-violet-900">Holding & Order</h4>
                  <p className="text-[11px] text-slate-800 leading-relaxed font-medium">
                    {selectedResult.parent_sections?.holding_order || 'Notice quashed with liberty reserved.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-2 text-xs">
                <h4 className="text-[11px] font-bold text-violet-800">Statutory & Citation Nodes</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedResult.matched_statutes?.map((st: string, idx: number) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-mono">
                      {st}
                    </span>
                  )) || <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-mono">Income Tax Act Sec 148A(b)</span>}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* SAVE PRECEDENT MODAL */}
      {showSavePrecedentModal && precedentToSave && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-300 p-5 rounded-2xl w-full max-w-md flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Pin className="w-4 h-4 text-violet-700" /> Save Precedent to Case
              </h3>
              <button onClick={() => setShowSavePrecedentModal(false)} className="text-slate-400 hover:text-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-violet-50 p-2.5 rounded-xl border border-violet-200 text-xs">
              <span className="font-bold text-violet-900 block truncate">{precedentToSave.title}</span>
              <span className="text-[10px] text-slate-600 font-mono">{precedentToSave.court}</span>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <label className="font-bold text-slate-700">Select Assigned Workspace:</label>
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

              <label className="font-bold text-slate-700 pt-1">Target Workspace Subfolder:</label>
              <select
                value={selectedSubfolder}
                onChange={(e) => setSelectedSubfolder(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-violet-700"
              >
                {SUBFOLDERS.map((sf) => (
                  <option key={sf} value={sf}>{sf}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setShowSavePrecedentModal(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePrecedent}
                className="px-4 py-1.5 text-xs bg-violet-700 hover:bg-violet-800 text-white font-bold rounded-lg shadow-md cursor-pointer"
              >
                Save & Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAVE QUERY MODAL */}
      {showSaveQueryModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-300 p-5 rounded-2xl w-full max-w-md flex flex-col gap-3 shadow-xl">
            <h3 className="text-xs font-bold text-slate-900">Save Research Query</h3>
            <div>
              <label className="text-[11px] text-slate-700 font-bold">Query Title</label>
              <input
                type="text"
                value={saveQueryTitle}
                onChange={(e) => setSaveQueryTitle(e.target.value)}
                placeholder="e.g. Section 148A(b) Hearing Defense"
                className="w-full mt-1 text-xs bg-slate-50 text-slate-900 border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-violet-700"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowSaveQueryModal(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuery}
                className="px-4 py-1.5 text-xs bg-violet-700 hover:bg-violet-800 text-white font-bold rounded-lg shadow-md cursor-pointer"
              >
                Save Query
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
