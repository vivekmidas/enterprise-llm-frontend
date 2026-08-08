/*
===============================================================================
BLOCK COMMENT: BELLA JOURNEY 1 LEGAL RESEARCH HUB (3-PANEL LAYOUT)
Module: frontend/app/legal-research/page.tsx
Author: AdI Tech Developer / Legal AI Architecture Team
Description:
    Frontend component for Bella's Journey 1 Legal Precedent Research Hub.
    - Panel 1: Collapsible mini-rail (60px) / drawer (280px) for Case Workspaces & Saved Queries (default: Minimized).
    - Panel 2: Center Viewport with top-middle prominent search bar, multi-select filter popover trigger, intent chips, and judgment result cards.
    - Panel 3: Right Viewport Detail Panel featuring Parent Section Breakdown (Facts, Issues, Ratio Decidendi, Holding Order) & Precedent Strategy Graph (default: Hidden, OPENS AUTOMATICALLY on Result Card Click).
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

export default function LegalResearchPage() {
  // Mode State: Grounded Non-LLM vs AI Assisted
  const [searchMode, setSearchMode] = useState<'grounded' | 'ai'>('grounded');

  // Search & Intent state
  const [searchQuery, setSearchQuery] = useState(
    'Section 148A(b) Income Tax Act opportunity of hearing principles of natural justice breach'
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

  /*
  -----------------------------------------------------------------------------
  INTERACTION: loadFilterOptions()
  Fetches multi-select taxonomy from GET /api/knowledge/legal/filter-options
  -----------------------------------------------------------------------------
  */
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

  /*
  -----------------------------------------------------------------------------
  INTERACTION: handleSearch()
  Executes legal precedent search via api.searchLegalCases() with payload
  -----------------------------------------------------------------------------
  */
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
        // If Panel 3 is open or first load, sync selected result
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

  const loadCaseWorkspaces = async () => {
    try {
      const cases = await api.getCaseWorkspaces();
      setCaseWorkspaces(cases || []);
      if (cases && cases.length > 0) {
        setSelectedCaseId(cases[0].id);
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

  /*
  -----------------------------------------------------------------------------
  INTERACTION HANDLERS: Multi-Select Toggles
  -----------------------------------------------------------------------------
  */
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

  /*
  -----------------------------------------------------------------------------
  INTERACTION: handleCardClick(r)
  TRIGGER: User clicks a result card in Panel 2.
  OUTCOME: Sets active CNR, selected result AND OPENS PANEL 3 AUTOMATICALLY.
  -----------------------------------------------------------------------------
  */
  const handleCardClick = (r: any) => {
    setSelectedCnr(r.cnr);
    setSelectedResult(r);
    setShowPanel3(true); // <--- OPENS THIRD PANEL AUTOMATICALLY
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

      if (linkMode === 'new') {
        if (!newCaseTitle.trim()) return;
        const newCase = await api.createCaseWorkspace({
          title: newCaseTitle,
          case_number: newCaseNumber || undefined,
          category: 'Income Tax / Re-assessment Appeal',
          court: precedentToSave.court || 'High Court of Delhi',
        });
        targetCaseId = newCase.id;
        await loadCaseWorkspaces();
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

      const res = await api.linkPrecedentToCase(targetCaseId, payload);
      setShowSavePrecedentModal(false);
      triggerToast(res.message || 'Precedent saved and linked to Case Workspace!');
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
    <div className="h-screen bg-slate-50 text-slate-900 flex flex-col font-sans overflow-hidden">

      {/* ======================================================================= */}
      {/* HEADER BAR                                                              */}
      {/* ======================================================================= */}
      <header className="h-14 border-b border-slate-200 bg-white px-5 flex items-center justify-between shrink-0 shadow-xs z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-700 flex items-center justify-center text-white shadow-sm shadow-violet-700/30">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
              Bella Legal Precedent Research Hub
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 font-mono font-semibold">
                Paralegal Mode
              </span>
            </h1>
            <p className="text-[10px] text-slate-500">Judiciary Database • 3-Panel Multi-Filter Legal AI Workspace</p>
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
            className="flex items-center gap-1.5 text-xs bg-slate-900 hover:bg-black text-white font-semibold px-3.5 py-1.5 rounded-xl transition shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" /> Export Binder
          </button>
        </div>
      </header>

      {/* --- TOAST NOTIFICATION --- */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MAIN WORKSPACE VIEW (3-PANEL FLEX LAYOUT)                               */}
      {/* ======================================================================= */}
      <div className="flex-1 flex overflow-hidden">

        {/* ===================================================================== */}
        {/* PANEL 1: LEFT SIDEBAR (MINIMIZED / COLLAPSED BY DEFAULT)              */}
        {/* ===================================================================== */}
        <div
          className={`${isPanel1Collapsed ? 'w-14' : 'w-72'
            } border-r border-slate-200 bg-slate-50 flex flex-col shrink-0 transition-all duration-300 relative z-20`}
        >
          {/* Header Bar on Panel 1 with Toggle Button */}
          <div className="h-12 px-3 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
            {!isPanel1Collapsed && (
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate">
                <Layers className="w-4 h-4 text-violet-700" /> Workspaces & Queries
              </span>
            )}
            <button
              onClick={() => setIsPanel1Collapsed(!isPanel1Collapsed)}
              title={isPanel1Collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition mx-auto"
            >
              {isPanel1Collapsed ? <PanelLeftOpen className="w-5 h-5 text-violet-700" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
          </div>

          {/* Panel 1 Collapsed State (Mini-Rail) */}
          {isPanel1Collapsed ? (
            <div className="flex-1 flex flex-col items-center py-4 gap-6 text-slate-600">
              <button
                onClick={() => setIsPanel1Collapsed(false)}
                title="Active Case Workspaces"
                className="p-2 rounded-xl bg-white border border-slate-200 text-violet-700 hover:bg-violet-50 transition shadow-xs relative"
              >
                <Layers className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-700 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {caseWorkspaces.length}
                </span>
              </button>

              <button
                onClick={() => setIsPanel1Collapsed(false)}
                title="Saved Queries"
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-violet-50 transition shadow-xs"
              >
                <Bookmark className="w-5 h-5" />
              </button>
            </div>
          ) : (
            /* Panel 1 Expanded State (Drawer) */
            <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">

              {/* Case Workspaces */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-violet-700" /> Case Workspaces
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-violet-100 text-violet-800 font-bold rounded-full">
                    {caseWorkspaces.length} Assigned
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {caseWorkspaces.map((cw) => (
                    <div
                      key={cw.id}
                      onClick={() => setSelectedCaseId(cw.id)}
                      className={`p-2.5 rounded-xl border flex flex-col gap-0.5 cursor-pointer transition ${selectedCaseId === cw.id
                          ? 'bg-violet-50 border-violet-400 ring-1 ring-violet-300'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                        }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-violet-800">{cw.case_number}</span>
                        <span className="text-[9px] text-slate-500 font-mono truncate">{cw.court}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 truncate">{cw.title}</p>
                      <span className="text-[10px] text-slate-500 truncate">Client: {cw.client_name || 'Ram Sharma'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Saved Research Queries */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-violet-700" /> Saved Queries
                  </span>
                  <button
                    onClick={() => setShowSaveQueryModal(true)}
                    className="text-[11px] text-violet-700 hover:text-violet-900 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Save
                  </button>
                </div>

                <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                  <button
                    onClick={() => setActiveQueryTab('private')}
                    className={`py-1 rounded-lg transition ${activeQueryTab === 'private' ? 'bg-white text-violet-800 shadow-xs' : 'text-slate-600'
                      }`}
                  >
                    Private ({privateQueries.length})
                  </button>
                  <button
                    onClick={() => setActiveQueryTab('public')}
                    className={`py-1 rounded-lg transition ${activeQueryTab === 'public' ? 'bg-white text-violet-800 shadow-xs' : 'text-slate-600'
                      }`}
                  >
                    Tenant ({publicQueries.length})
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto">
                  {(activeQueryTab === 'private' ? privateQueries : publicQueries).map((q) => (
                    <button
                      key={q.id}
                      onClick={() => {
                        setSearchQuery(q.query_text || '');
                        handleSearch(q.query_text);
                      }}
                      className="text-left p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs transition"
                    >
                      <p className="font-bold text-slate-900 truncate">{q.title}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{q.query_text}</p>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* ===================================================================== */}
        {/* PANEL 2: CENTER VIEWPORT (SEARCH BAR + PRECEDENT RESULTS LIST)         */}
        {/* ===================================================================== */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">

          {/* TOP MIDDLE SEARCH SECTION */}
          <div className="bg-white border-b border-slate-200 p-4 shrink-0 shadow-xs relative z-20">
            <div className="max-w-4xl mx-auto w-full flex flex-col gap-3">

              {/* Centered Search Bar with Filter Icon Popover Trigger */}
              <div className="relative flex items-center gap-2">
                <div className="relative flex-1 flex items-center">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 z-10 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Type query or statute e.g. Section 148A(b) Income Tax Act opportunity of hearing..."
                    className="w-full text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 pl-10 pr-28 focus:outline-none focus:border-violet-700 focus:ring-2 focus:ring-violet-200 shadow-inner"
                  />

                  {/* Filter Icon Button with Active Counter Badge */}
                  <button
                    onClick={() => setShowFilterPopover(!showFilterPopover)}
                    className={`absolute right-2 p-1.5 px-3 rounded-xl border transition flex items-center gap-1.5 text-xs font-bold ${showFilterPopover || activeFiltersCount > 0
                        ? 'bg-violet-50 text-violet-800 border-violet-300 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-violet-700" />
                    <span>Filters</span>
                    {activeFiltersCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-violet-700 text-white text-[9px] font-bold flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => handleSearch()}
                  disabled={loading}
                  className="bg-violet-700 hover:bg-violet-800 text-white font-bold text-xs px-5 py-3 rounded-2xl transition shadow-md shadow-violet-700/20 flex items-center gap-1.5 shrink-0"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Search</span>
                </button>
              </div>

              {/* =============================================================== */}
              {/* MULTI-SELECT FILTER POPOVER OVERLAY                             */}
              {/* =============================================================== */}
              {showFilterPopover && (
                <div
                  ref={filterPopoverRef}
                  className="absolute top-16 left-0 right-0 max-w-4xl mx-auto bg-white p-5 rounded-2xl border border-slate-300 shadow-2xl z-50 grid grid-cols-12 gap-5 text-xs animate-in fade-in slide-in-from-top-2"
                >
                  <div className="col-span-12 flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-extrabold text-slate-900 flex items-center gap-2 text-xs">
                      <SlidersHorizontal className="w-4 h-4 text-violet-700" /> Multi-Dimensional Filter Engine
                    </span>
                    <button
                      onClick={() => setShowFilterPopover(false)}
                      className="text-slate-400 hover:text-slate-700 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 1. Court Jurisdiction (Multi-Select) */}
                  <div className="col-span-6 flex flex-col gap-2">
                    <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                      <Building2 className="w-3.5 h-3.5 text-violet-700" /> Court Jurisdiction (Multi-Select)
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                      {courtOptions.map((c: any) => {
                        const val = typeof c === 'string' ? c : c.value;
                        const label = typeof c === 'string' ? c : c.label;
                        const active = selectedCourts.includes(val);
                        return (
                          <button
                            key={val}
                            onClick={() => toggleCourt(val)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border flex items-center gap-1 ${active
                                ? 'bg-violet-700 text-white border-violet-700 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                              }`}
                          >
                            {active && <Check className="w-3 h-3" />}
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Statutory Sections (Multi-Select) */}
                  <div className="col-span-6 flex flex-col gap-2">
                    <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                      <FileText className="w-3.5 h-3.5 text-violet-700" /> Statutory Sections (Multi-Select)
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                      {statuteOptions.map((st) => {
                        const active = selectedStatutes.includes(st);
                        return (
                          <button
                            key={st}
                            onClick={() => toggleStatute(st)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border flex items-center gap-1 ${active
                                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                              }`}
                          >
                            {active && <Check className="w-3 h-3" />}
                            {st}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Outcome Tags (Multi-Select) */}
                  <div className="col-span-6 flex flex-col gap-2 pt-2 border-t border-slate-100">
                    <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Outcome / Verdict Tag
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {outcomeTagOptions.map((tag) => {
                        const active = selectedOutcomeTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            onClick={() => toggleOutcomeTag(tag)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border flex items-center gap-1 ${active
                                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                              }`}
                          >
                            {active && <Check className="w-3 h-3" />}
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Precedent Status & Year Bounds */}
                  <div className="col-span-6 flex flex-col gap-2 pt-2 border-t border-slate-100">
                    <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-700" /> Status Badge & Year Bounds
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {statusBadgeOptions.map((badge) => {
                        const active = selectedStatusBadges.includes(badge);
                        return (
                          <button
                            key={badge}
                            onClick={() => toggleStatusBadge(badge)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border flex items-center gap-1 ${active
                                ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                              }`}
                          >
                            {active && <Check className="w-3 h-3" />}
                            {badge}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2 pt-2 text-[11px]">
                      <span className="text-slate-600 font-semibold">Years:</span>
                      <input
                        type="number"
                        value={yearMin}
                        onChange={(e) => setYearMin(Number(e.target.value))}
                        className="w-16 p-1 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold"
                      />
                      <span>to</span>
                      <input
                        type="number"
                        value={yearMax}
                        onChange={(e) => setYearMax(Number(e.target.value))}
                        className="w-16 p-1 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold"
                      />
                    </div>
                  </div>

                  {/* Popover Action Footer */}
                  <div className="col-span-12 flex items-center justify-between pt-3 border-t border-slate-200">
                    <button
                      onClick={handleResetFilters}
                      className="text-slate-600 hover:text-slate-900 text-xs font-bold flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
                    </button>
                    <button
                      onClick={() => {
                        setShowFilterPopover(false);
                        handleSearch();
                      }}
                      className="bg-violet-700 hover:bg-violet-800 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              )}

              {/* AI Intent Parsed Chips */}
              {parsedIntent && (
                <div className="flex items-center gap-2 text-[11px] flex-wrap pt-1">
                  <span className="text-slate-500 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-violet-600" /> Extracted Intent:
                  </span>
                  {parsedIntent.extracted_statute && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-medium">
                      📜 {parsedIntent.extracted_statute}
                    </span>
                  )}
                  {parsedIntent.extracted_court && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 font-medium">
                      🏛️ {parsedIntent.extracted_court}
                    </span>
                  )}
                  {parsedIntent.extracted_judge && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-violet-50 text-violet-900 border border-violet-200 font-medium">
                      👨‍⚖️ {parsedIntent.extracted_judge}
                    </span>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* RESULTS CARDS LIST */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4">

            <div className="flex items-center justify-between pb-2 border-b border-slate-200 shrink-0">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-700" /> Judgment Precedents ({results.length})
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Sorted by Relevance Score</span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500 text-xs">
                <RefreshCw className="w-7 h-7 animate-spin text-violet-700" />
                <span>Executing Grounded Retrieval across Supreme Court & High Court Datasets...</span>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-20 text-slate-400 text-xs italic">No matching precedents found. Try adjusting multi-select filters.</div>
            ) : (
              <div className="flex flex-col gap-4 max-w-4xl mx-auto w-full">
                {results.map((r) => {
                  const isSelected = selectedCnr === r.cnr;
                  return (
                    <div
                      key={r.cnr}
                      onClick={() => handleCardClick(r)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-3 ${isSelected
                          ? 'bg-violet-50/80 border-violet-500 shadow-md ring-2 ring-violet-500/20'
                          : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-xs'
                        }`}
                    >
                      {/* ROW 1: Case Summary, Citation & Badges */}
                      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2.5">
                        <div className="flex flex-col gap-1 max-w-[80%]">
                          <div className="flex items-center gap-2 text-xs flex-wrap">
                            <span className="font-bold text-violet-800 flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-violet-700" /> {r.court}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-600 font-mono flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" /> {r.decision_date}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-700 font-mono font-bold">{r.parallel_citation}</span>
                          </div>

                          <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                            {r.title}
                          </h3>
                        </div>

                        {/* Status Badge & Outcome Tag */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" /> {r.status_badge || 'Good Law'}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-100 text-violet-900 border border-violet-300">
                            {r.outcome_tag || '[Notice Quashed / Appeal Allowed]'}
                          </span>
                        </div>
                      </div>

                      {/* ROW 2: Ratio Snippet & Action Buttons */}
                      <div className="flex flex-col gap-3">
                        <p className="text-xs text-slate-800 leading-relaxed font-medium bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                          <span className="font-bold text-violet-900 mr-1.5">Ratio Decidendi Snippet:</span>
                          {r.ratio_snippet}
                        </p>

                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-semibold">{r.judge}</span>
                          </div>

                          {/* ACTION BUTTONS */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => openSaveModalForPrecedent(r, e)}
                              className="bg-violet-700 hover:bg-violet-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition shadow-xs flex items-center gap-1.5"
                            >
                              <Pin className="w-3.5 h-3.5" /> Save to Case
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCardClick(r);
                              }}
                              className="bg-slate-900 hover:bg-black text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition shadow-xs flex items-center gap-1.5"
                            >
                              <BookOpen className="w-3.5 h-3.5" /> View Details
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* ===================================================================== */}
        {/* PANEL 3: RIGHT DETAIL PANEL (EXPANDS AUTOMATICALLY ON RESULT CLICK)   */}
        {/* ===================================================================== */}
        {showPanel3 && selectedResult && (
          <div className="w-[480px] border-l border-slate-200 bg-slate-50 p-5 flex flex-col gap-4 overflow-y-auto shrink-0 shadow-2xl transition-all relative z-20">

            {/* Header with Close Icon */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[11px] font-mono font-bold text-violet-800">CNR: {selectedResult.cnr}</span>
                <h2 className="text-sm font-extrabold text-slate-900 mt-0.5 leading-snug">
                  {selectedResult.title}
                </h2>
              </div>
              <button
                onClick={() => setShowPanel3(false)}
                className="p-1 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs Switcher */}
            <div className="grid grid-cols-2 bg-slate-200 p-1 rounded-xl border border-slate-300 text-xs font-bold">
              <button
                onClick={() => setActiveTab('context')}
                className={`py-1.5 rounded-lg transition ${activeTab === 'context' ? 'bg-white text-violet-800 shadow-xs' : 'text-slate-600'
                  }`}
              >
                Parent Breakdown
              </button>
              <button
                onClick={() => setActiveTab('graph')}
                className={`py-1.5 rounded-lg transition ${activeTab === 'graph' ? 'bg-white text-violet-800 shadow-xs' : 'text-slate-600'
                  }`}
              >
                Precedent Graph
              </button>
            </div>

            {/* Tab 1: Parent Context Breakdown */}
            {activeTab === 'context' && (
              <div className="flex flex-col gap-4">

                {/* Facts of Case */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-2">
                  <h4 className="text-xs font-extrabold text-violet-900 flex items-center gap-1.5">
                    📌 Section 1: Facts of the Case
                  </h4>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {selectedResult.parent_sections?.facts || 'Facts details available in complete binder export.'}
                  </p>
                </div>

                {/* Framing of Issues */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-2">
                  <h4 className="text-xs font-extrabold text-violet-900 flex items-center gap-1.5">
                    📌 Section 2: Framing of Legal Issues
                  </h4>
                  <ul className="list-disc pl-4 text-xs text-slate-800 flex flex-col gap-1 font-medium">
                    {selectedResult.parent_sections?.issues?.map((iss: string, idx: number) => (
                      <li key={idx}>{iss}</li>
                    )) || <li>Whether opportunity of hearing under Section 148A(b) was violated?</li>}
                  </ul>
                </div>

                {/* Ratio Decidendi */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-2">
                  <h4 className="text-xs font-extrabold text-violet-900 flex items-center gap-1.5">
                    📌 Section 3: Ratio Decidendi & Binding Precedent
                  </h4>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                    {selectedResult.parent_sections?.ratio_decidendi || selectedResult.ratio_snippet}
                  </p>
                </div>

                {/* Final Holding */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-2">
                  <h4 className="text-xs font-extrabold text-violet-900 flex items-center gap-1.5">
                    📌 Section 4: Final Holding & Court Order
                  </h4>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {selectedResult.parent_sections?.holding_order || 'Notice quashed with liberty reserved to re-initiate compliance.'}
                  </p>
                </div>

              </div>
            )}

            {/* Tab 2: Strategy Graph */}
            {activeTab === 'graph' && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3">
                <h4 className="text-xs font-bold text-violet-800 flex items-center gap-1.5">
                  <Network className="w-4 h-4 text-violet-700" /> Statutory & Citation Graph Nodes
                </h4>
                <div className="flex flex-col gap-2 text-xs">
                  <div className="font-semibold text-slate-700">Matched Statutes:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedResult.matched_statutes?.map((st: string, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 font-mono text-[11px]">
                        {st}
                      </span>
                    )) || <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 font-mono text-[11px]">Income Tax Act Sec 148A(b)</span>}
                  </div>

                  <div className="font-semibold text-slate-700 pt-2">Binding Cited Precedents:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedResult.matched_precedents?.map((pr: string, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-900 border border-blue-300 font-mono text-[11px]">
                        {pr}
                      </span>
                    )) || <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-900 border border-blue-300 font-mono text-[11px]">Union of India v. Ashish Agarwal (2022)</span>}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* ======================================================================= */}
      {/* MODAL: SAVE PRECEDENT & LINK TO CASE WORKSPACE                          */}
      {/* ======================================================================= */}
      {showSavePrecedentModal && precedentToSave && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-300 p-6 rounded-3xl w-full max-w-lg flex flex-col gap-5 shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Pin className="w-4 h-4 text-violet-700" /> Save Precedent & Link to Case Workspace
              </h3>
              <button onClick={() => setShowSavePrecedentModal(false)} className="text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Precedent Overview */}
            <div className="bg-violet-50 p-3.5 rounded-2xl border border-violet-200 flex flex-col gap-1 text-xs">
              <span className="font-bold text-violet-900">{precedentToSave.title}</span>
              <span className="text-[11px] text-slate-600 font-mono">{precedentToSave.court} | {precedentToSave.parallel_citation}</span>
            </div>

            {/* Choice: Existing vs New Case Workspace */}
            <div className="flex flex-col gap-3 text-xs">
              <span className="font-bold text-slate-900">Select Target Workspace Action:</span>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="radio"
                    name="linkMode"
                    checked={linkMode === 'existing'}
                    onChange={() => setLinkMode('existing')}
                    className="text-violet-700 focus:ring-violet-700"
                  />
                  Link to Assigned Workspace
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="radio"
                    name="linkMode"
                    checked={linkMode === 'new'}
                    onChange={() => setLinkMode('new')}
                    className="text-violet-700 focus:ring-violet-700"
                  />
                  Create & Link New Workspace
                </label>
              </div>

              {linkMode === 'existing' ? (
                <div className="flex flex-col gap-2 pt-1">
                  <label className="font-bold text-slate-700">Select Assigned Workspace:</label>
                  <select
                    value={selectedCaseId}
                    onChange={(e) => setSelectedCaseId(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:border-violet-700"
                  >
                    {caseWorkspaces.map((cw) => (
                      <option key={cw.id} value={cw.id}>
                        {cw.case_number} - {cw.title}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-1">
                  <label className="font-bold text-slate-700">New Case Workspace Title:</label>
                  <input
                    type="text"
                    value={newCaseTitle}
                    onChange={(e) => setNewCaseTitle(e.target.value)}
                    placeholder="e.g. State v. Ram Sharma (Income Tax Appeal)"
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:border-violet-700"
                  />
                  <input
                    type="text"
                    value={newCaseNumber}
                    onChange={(e) => setNewCaseNumber(e.target.value)}
                    placeholder="Case Reference ID e.g. C-2026-104"
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:border-violet-700 mt-1"
                  />
                </div>
              )}

              {/* Subfolder Selection */}
              <div className="flex flex-col gap-2 pt-2">
                <label className="font-bold text-slate-700">Target Workspace Subfolder:</label>
                <select
                  value={selectedSubfolder}
                  onChange={(e) => setSelectedSubfolder(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:border-violet-700"
                >
                  {SUBFOLDERS.map((sf) => (
                    <option key={sf} value={sf}>{sf}</option>
                  ))}
                </select>
              </div>

              {/* Auto-Attached Search Metadata Preview */}
              <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 flex flex-col gap-1 text-[11px]">
                <span className="font-bold text-slate-700">Auto-Attached Search Metadata:</span>
                <span className="text-slate-800 truncate">Query: "{searchQuery}"</span>
                <span className="text-slate-600">Active Filters: {selectedCourts.join(', ')} | Years: {yearMin}-{yearMax}</span>
              </div>

            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                onClick={() => setShowSavePrecedentModal(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePrecedent}
                className="px-5 py-2.5 text-xs bg-violet-700 hover:bg-violet-800 text-white font-bold rounded-xl shadow-md"
              >
                Save & Link to Case
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL: SAVE SEARCH QUERY                                                */}
      {/* ======================================================================= */}
      {showSaveQueryModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-300 p-6 rounded-3xl w-full max-w-md flex flex-col gap-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">Save Research Query</h3>

            <div>
              <label className="text-xs text-slate-700 font-bold">Query Title</label>
              <input
                type="text"
                value={saveQueryTitle}
                onChange={(e) => setSaveQueryTitle(e.target.value)}
                placeholder="e.g. Income Tax Sec 148A(b) Pre-assessment Notice Strategy"
                className="w-full mt-1 text-xs bg-slate-50 text-slate-900 border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:border-violet-700"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isPublicCheck"
                checked={saveQueryIsPublic}
                onChange={(e) => setSaveQueryIsPublic(e.target.checked)}
                className="rounded border-slate-300 text-violet-700 focus:ring-violet-700"
              />
              <label htmlFor="isPublicCheck" className="text-xs text-slate-800 font-medium cursor-pointer">
                Share as <strong>Public Query</strong> across tenant organization
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowSaveQueryModal(false)}
                className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuery}
                className="px-4 py-2 text-xs bg-violet-700 hover:bg-violet-800 text-white font-bold rounded-xl shadow-md"
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
