'use client';

import React, { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';

const COURTS = [
  { label: 'All High Courts', value: '' },
  { label: 'Delhi High Court (court=7_26)', value: '7_26' },
  { label: 'Bombay High Court (court=27_1)', value: '27_1' },
  { label: 'Madras High Court (court=33_10)', value: '33_10' },
  { label: 'Allahabad High Court (court=9_13)', value: '9_13' },
  { label: 'Punjab & Haryana High Court (court=3_22)', value: '3_22' },
];

export default function LegalResearchPage() {
  // Search & Intent state
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [parsedIntent, setParsedIntent] = useState<any>(null);

  // Manual Filter states
  const [courtFilter, setCourtFilter] = useState('');
  const [judgeFilter, setJudgeFilter] = useState('');
  const [statuteFilter, setStatuteFilter] = useState('');
  const [dispositionFilter, setDispositionFilter] = useState('');

  // Selected Case & Tab state
  const [selectedCnr, setSelectedCnr] = useState<string | null>(null);
  const [selectedCaseDetail, setSelectedCaseDetail] = useState<any>(null);
  const [activeInspectorTab, setActiveInspectorTab] = useState<'text' | 'graph' | 'audit'>('text');
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Saved Queries state
  const [activeQueryTab, setActiveQueryTab] = useState<'private' | 'public'>('private');
  const [privateQueries, setPrivateQueries] = useState<any[]>([]);
  const [publicQueries, setPublicQueries] = useState<any[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveQueryTitle, setSaveQueryTitle] = useState('');
  const [saveQueryIsPublic, setSaveQueryIsPublic] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Execute Search
  const handleSearch = async (queryText?: string) => {
    const textToSearch = queryText !== undefined ? queryText : searchQuery;
    setLoading(true);
    try {
      const res = await api.searchLegalCases({
        query: textToSearch,
        court_code: courtFilter || undefined,
        judge: judgeFilter || undefined,
        statute: statuteFilter || undefined,
        disposition: dispositionFilter || undefined,
        limit: 30
      });
      setResults(res.results || []);
      setParsedIntent(res.intent_parsed || null);
      if (res.results && res.results.length > 0) {
        setSelectedCnr(res.results[0].cnr);
      } else {
        setSelectedCnr(null);
        setSelectedCaseDetail(null);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load Saved Queries & Initial Search
  useEffect(() => {
    handleSearch('cases related to pre-deposit under CGST Sec 107 with judge Anil Kshetarpal in Delhi High Court');
    loadSavedQueries();
    loadAuditLogs();
  }, []);

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

  // Load selected case detail
  useEffect(() => {
    if (!selectedCnr) return;
    setLoadingDetail(true);
    api.getCaseDetail(selectedCnr)
      .then((detail) => setSelectedCaseDetail(detail))
      .catch((err) => console.error('Failed to load case detail', err))
      .finally(() => setLoadingDetail(false));
  }, [selectedCnr]);

  // Save Query Handler
  const handleSaveQuery = async () => {
    if (!saveQueryTitle.trim()) return;
    try {
      await api.saveQuery({
        title: saveQueryTitle,
        query_text: searchQuery,
        filters_json: { courtFilter, judgeFilter, statuteFilter, dispositionFilter },
        is_public: saveQueryIsPublic
      });
      setShowSaveModal(false);
      setSaveQueryTitle('');
      loadSavedQueries();
    } catch (err) {
      console.error('Failed to save query', err);
    }
  };

  // Helper disposition badge color for Light Theme
  const getDispositionBadge = (disp: string) => {
    if (!disp) return <span className="px-2.5 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 border border-slate-200 font-medium">PENDING</span>;
    if (disp.includes('ALLOWED') || disp.includes('QUASHED')) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ALLOWED / QUASHED
        </span>
      );
    }
    if (disp.includes('DISMISSED') && !disp.includes('WITHDRAWN')) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
          <XCircle className="w-3 h-3 text-rose-600" /> DISMISSED
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
        <AlertCircle className="w-3 h-3 text-amber-600" /> {disp}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* --- WORKSPACE LIGHT HEADER BAR --- */}
      <header className="h-14 border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/20">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Legal Research Workspace
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200 font-mono font-medium">
                1 Month AWS Open Data Ingested
              </span>
            </h1>
            <p className="text-xs text-slate-500">AI Precedent Strategy Path & Judgment Analytics Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium">
            Role: Paralegal Research User
          </span>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs bg-violet-600 hover:bg-violet-700 text-white font-medium px-3.5 py-1.5 rounded-lg shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5" /> Print Case Brief
          </button>
        </div>
      </header>

      {/* --- 3-PANE LIGHT WORKSPACE LAYOUT --- */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden h-[calc(100vh-3.5rem)]">
        
        {/* ========================================== */}
        {/* PANE 1: FILTERS & SAVED QUERIES (3 COLS)  */}
        {/* ========================================== */}
        <div className="col-span-3 border-r border-slate-200 bg-slate-50/70 p-4 flex flex-col gap-4 overflow-y-auto">
          
          {/* AI Natural Language Search Input */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
            <label className="text-xs font-semibold text-violet-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-violet-600" /> AI Natural Language Search
            </label>
            <div className="relative">
              <textarea
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ask e.g. cases related to pre-deposit under CGST Sec 107 with judge Anil Kshetarpal in Delhi..."
                className="w-full text-xs bg-slate-50 text-slate-900 border border-slate-200 rounded-xl p-3 pr-9 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-500 resize-none h-24 shadow-inner"
              />
              <button
                onClick={() => handleSearch()}
                disabled={loading}
                className="absolute right-2.5 bottom-2.5 bg-violet-600 hover:bg-violet-700 text-white p-2 rounded-lg transition shadow-md shadow-violet-600/20"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* AI Intent Parsed Chips */}
            {parsedIntent && (
              <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
                {parsedIntent.extracted_judge && (
                  <span className="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-200 flex items-center gap-1 font-medium">
                    👨‍⚖️ {parsedIntent.extracted_judge}
                  </span>
                )}
                {parsedIntent.extracted_court && (
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 font-medium">
                    🏛️ {parsedIntent.extracted_court}
                  </span>
                )}
                {parsedIntent.extracted_statute && (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 font-medium">
                    📜 {parsedIntent.extracted_statute}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Saved Queries Manager */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-violet-600" /> Saved Research Queries
              </span>
              <button 
                onClick={() => setShowSaveModal(true)}
                className="text-[11px] text-violet-600 hover:text-violet-700 flex items-center gap-1 font-medium transition"
              >
                <Plus className="w-3 h-3" /> Save Current
              </button>
            </div>

            {/* Tabs: My Private vs Tenant Public */}
            <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl border border-slate-200 text-[11px]">
              <button
                onClick={() => setActiveQueryTab('private')}
                className={`py-1.5 rounded-lg font-semibold transition ${activeQueryTab === 'private' ? 'bg-white text-violet-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
              >
                My Private ({privateQueries.length})
              </button>
              <button
                onClick={() => setActiveQueryTab('public')}
                className={`py-1.5 rounded-lg font-semibold transition ${activeQueryTab === 'public' ? 'bg-white text-violet-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Tenant Public ({publicQueries.length})
              </button>
            </div>

            {/* List of Saved Queries */}
            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
              {(activeQueryTab === 'private' ? privateQueries : publicQueries).map((q) => (
                <button
                  key={q.id}
                  onClick={() => {
                    setSearchQuery(q.query_text || '');
                    handleSearch(q.query_text);
                  }}
                  className="text-left p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs transition group"
                >
                  <p className="font-semibold text-slate-800 group-hover:text-violet-700 truncate">{q.title}</p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{q.query_text}</p>
                </button>
              ))}
              {(activeQueryTab === 'private' ? privateQueries : publicQueries).length === 0 && (
                <p className="text-[11px] text-slate-400 italic p-3 text-center">No saved queries found.</p>
              )}
            </div>
          </div>

          {/* Structured Dynamic Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-violet-600" /> Structured Filters
            </span>

            <div>
              <label className="text-[11px] text-slate-500 font-medium">Court Jurisdiction</label>
              <select
                value={courtFilter}
                onChange={(e) => setCourtFilter(e.target.value)}
                className="w-full mt-1 text-xs bg-slate-50 text-slate-900 border border-slate-200 rounded-xl p-2 focus:outline-none focus:border-violet-600"
              >
                {COURTS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-500 font-medium">Judge Name</label>
              <input
                type="text"
                value={judgeFilter}
                onChange={(e) => setJudgeFilter(e.target.value)}
                placeholder="e.g. Anil Kshetarpal"
                className="w-full mt-1 text-xs bg-slate-50 text-slate-900 border border-slate-200 rounded-xl p-2 focus:outline-none focus:border-violet-600"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-500 font-medium">Statute / Provision</label>
              <input
                type="text"
                value={statuteFilter}
                onChange={(e) => setStatuteFilter(e.target.value)}
                placeholder="e.g. CGST Act Sec 107"
                className="w-full mt-1 text-xs bg-slate-50 text-slate-900 border border-slate-200 rounded-xl p-2 focus:outline-none focus:border-violet-600"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-500 font-medium">Outcome / Disposition</label>
              <select
                value={dispositionFilter}
                onChange={(e) => setDispositionFilter(e.target.value)}
                className="w-full mt-1 text-xs bg-slate-50 text-slate-900 border border-slate-200 rounded-xl p-2 focus:outline-none focus:border-violet-600"
              >
                <option value="">All Outcomes</option>
                <option value="ALLOWED / QUASHED">ALLOWED / QUASHED</option>
                <option value="DISMISSED">DISMISSED</option>
                <option value="WITHDRAWN">DISMISSED AS WITHDRAWN</option>
              </select>
            </div>

            <button
              onClick={() => handleSearch()}
              className="mt-1 w-full bg-violet-600 hover:bg-violet-700 text-white text-xs py-2.5 rounded-xl font-semibold transition shadow-md shadow-violet-600/20"
            >
              Apply Research Filters
            </button>
          </div>

        </div>

        {/* ========================================== */}
        {/* PANE 2: MATCHING CASE CARDS (4 COLS)       */}
        {/* ========================================== */}
        <div className="col-span-4 border-r border-slate-200 bg-white p-4 flex flex-col gap-3 overflow-y-auto">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-violet-600" /> Judgment Orders ({results.length})
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Sorted by Relevance</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin text-violet-600" />
              <span>Searching High Court Open Data Dataset...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center text-slate-400 py-16 text-xs">No matching judgments found for query.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {results.map((r) => {
                const isSelected = selectedCnr === r.cnr;
                return (
                  <div
                    key={r.cnr}
                    onClick={() => setSelectedCnr(r.cnr)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                      isSelected
                        ? 'bg-violet-50/80 border-violet-500 shadow-md ring-1 ring-violet-500/30'
                        : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-violet-700 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-violet-600" /> {r.court}
                      </span>
                      <span className="text-slate-500 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" /> {r.decision_date}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-relaxed">
                      {r.title}
                    </h3>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-600 truncate max-w-[200px] flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-slate-400" /> {r.judge}
                      </span>
                      {getDispositionBadge(r.disposition)}
                    </div>

                    {r.matched_statutes && r.matched_statutes.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1.5 border-t border-slate-100">
                        {r.matched_statutes.map((st: string, idx: number) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                            {st}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================== */}
        {/* PANE 3: CASE INSPECTOR & GRAPH (5 COLS)    */}
        {/* ========================================== */}
        <div className="col-span-5 bg-slate-50/50 p-4 flex flex-col gap-4 overflow-y-auto">
          {loadingDetail ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin text-violet-600" />
              <span>Extracting judgment text & strategy graph...</span>
            </div>
          ) : !selectedCaseDetail ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs gap-3">
              <Info className="w-10 h-10 text-slate-300" />
              <span>Select a case from middle pane to inspect judgment text and strategy graph.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              
              {/* Detail Header Card */}
              <div className="bg-white p-4.5 rounded-2xl border border-slate-200 flex flex-col gap-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-violet-700 font-semibold">CNR: {selectedCaseDetail.cnr || selectedCaseDetail.case_identity?.cnr}</span>
                    <h2 className="text-sm font-bold text-slate-900 mt-1 leading-snug">
                      {selectedCaseDetail.case_title || selectedCaseDetail.title || selectedCaseDetail.case_identity?.case_title}
                    </h2>
                  </div>
                  {getDispositionBadge(selectedCaseDetail.disposition || selectedCaseDetail.decision_and_holding?.disposition)}
                </div>

                <div className="grid grid-cols-2 text-xs text-slate-600 gap-y-1.5 pt-2 border-t border-slate-100">
                  <div>🏛️ Court: <span className="text-slate-900 font-medium">{selectedCaseDetail.court || selectedCaseDetail.case_identity?.court}</span></div>
                  <div>📅 Date: <span className="text-slate-900 font-medium">{selectedCaseDetail.decision_date || selectedCaseDetail.case_identity?.decision_date}</span></div>
                  <div className="col-span-2 truncate">👨‍⚖️ Bench: <span className="text-slate-900 font-medium">{selectedCaseDetail.judge || selectedCaseDetail.case_identity?.bench_judge}</span></div>
                </div>
              </div>

              {/* Inspector View Tabs */}
              <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-2xl border border-slate-300/80 text-xs">
                <button
                  onClick={() => setActiveInspectorTab('text')}
                  className={`flex-1 py-2 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition ${
                    activeInspectorTab === 'text' ? 'bg-white text-violet-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> Full Judgment Text
                </button>
                <button
                  onClick={() => setActiveInspectorTab('graph')}
                  className={`flex-1 py-2 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition ${
                    activeInspectorTab === 'graph' ? 'bg-white text-violet-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Network className="w-3.5 h-3.5" /> Precedent Graph
                </button>
                <button
                  onClick={() => setActiveInspectorTab('audit')}
                  className={`flex-1 py-2 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition ${
                    activeInspectorTab === 'audit' ? 'bg-white text-violet-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Compliance Audit
                </button>
              </div>

              {/* Tab 1: Judgment Full Text */}
              {activeInspectorTab === 'text' && (
                <div className="bg-white p-4.5 rounded-2xl border border-slate-200 flex flex-col gap-2 max-h-[500px] overflow-y-auto shadow-sm">
                  <pre className="text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed">
                    {selectedCaseDetail.full_text || selectedCaseDetail.full_text_snippet || 'No text extracted.'}
                  </pre>
                </div>
              )}

              {/* Tab 2: Strategy Knowledge Graph */}
              {activeInspectorTab === 'graph' && (
                <div className="bg-white p-4.5 rounded-2xl border border-slate-200 flex flex-col gap-3 min-h-[360px] shadow-sm">
                  <h4 className="text-xs font-bold text-violet-700 flex items-center gap-1.5">
                    <Network className="w-4 h-4 text-violet-600" /> Legal Precedent & Strategy Graph
                  </h4>
                  {selectedCaseDetail.knowledge_graph?.nodes ? (
                    <div className="flex flex-col gap-2 text-xs">
                      <div className="flex gap-4 text-[11px] text-slate-500 border-b border-slate-100 pb-2.5">
                        <span>Total Nodes: <strong className="text-slate-900 font-mono">{selectedCaseDetail.knowledge_graph.node_count}</strong></span>
                        <span>Total Edges: <strong className="text-slate-900 font-mono">{selectedCaseDetail.knowledge_graph.edge_count}</strong></span>
                      </div>
                      <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                        {selectedCaseDetail.knowledge_graph.nodes.map((n: any, idx: number) => (
                          <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                            <span className="font-mono text-xs text-violet-700 font-semibold px-2 py-0.5 rounded bg-violet-100 border border-violet-200">{n.type}</span>
                            <span className="text-slate-800 truncate max-w-[260px] font-medium">{n.label || n.act || n.id}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No Knowledge Graph generated for this record.</p>
                  )}
                </div>
              )}

              {/* Tab 3: Compliance Audit Logs */}
              {activeInspectorTab === 'audit' && (
                <div className="bg-white p-4.5 rounded-2xl border border-slate-200 flex flex-col gap-2.5 max-h-[400px] overflow-y-auto text-xs shadow-sm">
                  <h4 className="text-xs font-semibold text-slate-800 mb-1">Accounting & Compliance Audit Trail</h4>
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span className="font-semibold text-violet-700">{log.action}</span>
                        <span>{log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</span>
                      </div>
                      <p className="text-slate-800 font-medium">{log.query_text}</p>
                      <span className="text-[10px] text-slate-400 font-mono">User ID: {log.user_id} | Role: {log.role}</span>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}
        </div>

      </div>

      {/* --- SAVE QUERY MODAL --- */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-md flex flex-col gap-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">Save Research Query</h3>
            
            <div>
              <label className="text-xs text-slate-600 font-medium">Query Title</label>
              <input
                type="text"
                value={saveQueryTitle}
                onChange={(e) => setSaveQueryTitle(e.target.value)}
                placeholder="e.g. CGST Sec 107 Pre-deposit Appeal Strategy"
                className="w-full mt-1 text-xs bg-slate-50 text-slate-900 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-violet-600"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isPublicCheck"
                checked={saveQueryIsPublic}
                onChange={(e) => setSaveQueryIsPublic(e.target.checked)}
                className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
              />
              <label htmlFor="isPublicCheck" className="text-xs text-slate-700 cursor-pointer">
                Share as <strong>Public Query</strong> across tenant organization
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuery}
                className="px-4 py-2 text-xs bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl shadow-md"
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
