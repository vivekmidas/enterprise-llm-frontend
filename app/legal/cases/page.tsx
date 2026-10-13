/*
===============================================================================
BLOCK COMMENT: CASE WORKSPACES PAGE (LIGHT THEME)
Module: frontend/app/legal/cases/page.tsx
Description:
    - Dedicated page for managing and browsing active legal case dossiers.
    - Warm parchment background (#FAF7F0) with crisp white cards.
    - Includes matter files, chronology, and AI case memory.
===============================================================================
*/

'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import {
  FolderKanban,
  Plus,
  ArrowLeft,
  Search,
  FileText,
  Upload,
  Sparkles,
  ChevronRight,
  Gavel,
  Clock,
  Calendar,
  Building2,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

function CaseWorkspacesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCaseId = searchParams.get('caseId');

  const [caseList, setCaseList] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'files' | 'timeline' | 'precedents'>('files');

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const backendCases = await api.listLegalCases().catch(() => []);
        const stored = localStorage.getItem('legal_case_workspaces');
        const parsedLocal = stored ? JSON.parse(stored) : [];

        // Format backend cases to match workspace structure
        const formattedBackend = (backendCases || []).map((b: any) => ({
          id: b.id,
          court_assigned_id: b.court_assigned_id,
          title: b.title,
          category: b.category,
          court: b.forum_court,
          parties: [
            ...(b.initiating_parties || []).map((p: any) => p.name),
            ...(b.opposing_parties || []).map((p: any) => p.name),
          ].filter(Boolean),
          files: ['Intake_Matter_Brief.pdf'],
          timeline: [
            { date: b.created_at ? new Date(b.created_at).toLocaleDateString('en-GB') : 'Recent', text: 'Case record established.' }
          ],
          precedents: [],
          summary: b.factual_matrix || b.core_issue,
          coreIssue: b.core_issue,
          updated_at: b.updated_at || new Date().toISOString(),
        }));

        // Deduplicate by ID
        const combined = [...formattedBackend];
        for (const loc of parsedLocal) {
          if (!combined.some((c) => c.id === loc.id)) {
            combined.push(loc);
          }
        }

        if (combined.length > 0) {
          setCaseList(combined);
          if (initialCaseId) {
            const matched = combined.find((c: any) => c.id === initialCaseId);
            setSelectedCase(matched || combined[0]);
          } else {
            setSelectedCase(combined[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load legal cases:', err);
      }
    };

    fetchCases();
  }, [initialCaseId]);

  const filteredCases = caseList.filter(
    (c) =>
      c.title?.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.category?.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-slate-900 p-6 sm:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E0D8C8]">
          <div>
            <Link
              href="/legal"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-800 hover:text-indigo-950 mb-2 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to AI Hub</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                <FolderKanban className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 font-serif">Case Workspaces & Dossiers</h1>
                <p className="text-xs text-slate-600">
                  AI-indexed matter folders with semantic vector memory and chronological tracking
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/legal/summarize?createCase=true"
            className="px-4 py-2.5 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Case</span>
          </Link>
        </div>

        {/* 2-Column Split: Case List + Case Workspace Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Case Selector List (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-[#E0D8C8] rounded-2xl p-4 flex flex-col space-y-4 shadow-[0_2px_12px_rgba(44,39,30,0.04)]">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter cases by title or category..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full bg-[#FAF8F3] border border-[#DDD5C7] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[600px] pr-1">
              {filteredCases.map((c) => {
                const isSelected = selectedCase?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCase(c)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                        : 'border-[#E8E2D5] bg-[#FAF8F4] hover:bg-white hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
                        {c.title}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-500 font-semibold">
                        {c.court ? c.court.split(' ')[0] : 'Court'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mb-2">
                      {c.category || 'Litigation'}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-[#E8E2D5]">
                      <span>{c.files?.length || 0} files</span>
                      <span className="text-indigo-800 font-bold">Select →</span>
                    </div>
                  </div>
                );
              })}

              {filteredCases.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-500">
                  No cases found matching your search.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Case Workspace Detail (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-[#E0D8C8] rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-[0_2px_12px_rgba(44,39,30,0.04)]">
            {selectedCase ? (
              <div className="space-y-6">
                {/* Case Header Details */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E0D8C8]">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                      {selectedCase.category || 'General Matter'}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 mt-1.5 font-serif">{selectedCase.title}</h2>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedCase.court || 'High Court'}</span>
                      </span>
                      {selectedCase.court_assigned_id && (
                        <span className="px-2 py-0.5 rounded bg-[#FAF8F3] border border-[#DDD5C7] font-mono text-[11px] text-indigo-900 font-semibold">
                          Court Docket: {selectedCase.court_assigned_id}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-mono">
                        Ref: {selectedCase.id}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/legal/search?query=${encodeURIComponent(selectedCase.title)}`}
                      className="px-3 py-1.5 rounded-xl bg-[#FAF8F3] hover:bg-[#F0ECE0] text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#DDD5C7] cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-700" />
                      <span>Precedent Match</span>
                    </Link>
                  </div>
                </div>

                {/* Sub-tabs: Files, Timeline, Precedents */}
                <div className="flex items-center gap-2 border-b border-[#E0D8C8] pb-2 text-xs font-bold">
                  {(['files', 'timeline', 'precedents'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 rounded-lg capitalize transition-colors cursor-pointer ${
                        activeTab === tab
                          ? 'bg-indigo-900 text-white'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-[#FAF8F3]'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Tab Content 1: Files */}
                {activeTab === 'files' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-bold uppercase">
                        Case Ingested Documents
                      </span>
                      <label className="text-xs text-indigo-800 hover:text-indigo-950 cursor-pointer flex items-center gap-1 font-bold">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              const updatedFiles = [...(selectedCase.files || []), file.name];
                              const updated = { ...selectedCase, files: updatedFiles };
                              setSelectedCase(updated);
                              const list = caseList.map((c) => (c.id === updated.id ? updated : c));
                              setCaseList(list);
                              localStorage.setItem('legal_case_workspaces', JSON.stringify(list));
                            }
                          }}
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(selectedCase.files || []).map((file: string, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-[#FAF8F3] border border-[#DDD5C7] flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <FileText className="w-4 h-4 text-indigo-700 shrink-0" />
                            <span className="text-xs text-slate-800 font-medium truncate">{file}</span>
                          </div>
                          <Link
                            href={`/legal/summarize`}
                            className="text-[11px] text-indigo-800 hover:text-indigo-950 shrink-0 font-bold ml-2"
                          >
                            Summarize →
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab Content 2: Timeline */}
                {activeTab === 'timeline' && (
                  <div className="space-y-3">
                    <span className="text-xs text-slate-500 font-bold uppercase">
                      Chronology of Events
                    </span>
                    <div className="space-y-2">
                      {(selectedCase.timeline || []).map((t: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-[#FAF8F3] border border-[#DDD5C7] flex items-start gap-3"
                        >
                          <span className="px-2 py-0.5 rounded bg-white text-indigo-900 border border-[#DDD5C7] font-mono text-[11px] font-bold shrink-0">
                            {t.date}
                          </span>
                          <span className="text-xs text-slate-700 leading-relaxed">{t.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab Content 3: Precedents */}
                {activeTab === 'precedents' && (
                  <div className="space-y-3">
                    <span className="text-xs text-slate-500 font-bold uppercase">
                      Attached Precedents
                    </span>
                    <div className="space-y-2">
                      {(selectedCase.precedents || []).map((p: string, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-[#FAF8F3] border border-[#DDD5C7] flex items-center justify-between"
                        >
                          <span className="text-xs text-slate-800 font-bold">{p}</span>
                          <Link
                            href={`/legal/search?query=${encodeURIComponent(p)}`}
                            className="text-[11px] text-indigo-800 hover:text-indigo-950 font-bold"
                          >
                            View Ratio →
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16 space-y-2">
                <FolderKanban className="w-12 h-12 text-slate-300" />
                <p className="text-xs">Select a case from the left column to view dossier.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CaseWorkspacesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF7F0]" />}>
      <CaseWorkspacesContent />
    </Suspense>
  );
}
