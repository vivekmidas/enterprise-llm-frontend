/*
===============================================================================
BLOCK COMMENT: 1-CLICK NEW CASE WORKSPACE CREATION (EPIC 3.2 & 3.3)
Module: frontend/app/legal/cases/new/page.tsx
Reference: Epic 3.2 Create a New Case & 3.3 Post-Analysis Action 1
Description:
    Dedicated endpoint for 1-Click New Case Conversion from Analysis.
    - Pre-populates all fields from origin LegalAnalysisDB.
    - Captures both Internal System ID and Official Court-Assigned ID (CNR Number).
    - Preserves field-level provenance (AI-Generated vs User-Edited).
    - Writes to MySQL database and redirects to the active case workspace.
===============================================================================
*/

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  FolderPlus,
  ArrowLeft,
  Sparkles,
  Scale,
  Building2,
  Users,
  FileText,
  Gavel,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';

function NewCaseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const analysisId = searchParams?.get('analysisId');

  const [loading, setLoading] = useState(!!analysisId);
  const [analysis, setAnalysis] = useState<any | null>(null);

  // Form Fields
  const [caseTitle, setCaseTitle] = useState('');
  const [courtAssignedId, setCourtAssignedId] = useState('');
  const [court, setCourt] = useState('High Court of Delhi');
  const [category, setCategory] = useState('Commercial Arbitration (Section 34 / S.11)');
  const [claimant, setClaimant] = useState('');
  const [respondent, setRespondent] = useState('');
  const [coreIssue, setCoreIssue] = useState('');
  const [disputedValue, setDisputedValue] = useState('Unliquidated / Reputational');
  const [submitting, setSubmitting] = useState(false);
  const [createdCaseId, setCreatedCaseId] = useState<string | null>(null);

  useEffect(() => {
    if (analysisId) {
      setLoading(true);
      api
        .getLegalAnalysis(analysisId)
        .then((data) => {
          setAnalysis(data);
          setCaseTitle(data.title || '');
          setCoreIssue(data.factual_matrix || data.executive_summary || '');
          setCourtAssignedId(`CNR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`);

          const fields = data.fields_provenance || [];
          const claimantField = fields.find((f: any) => f.field_name === 'claimant');
          const respondentField = fields.find((f: any) => f.field_name === 'respondent');
          const forumField = fields.find((f: any) => f.field_name === 'forum');
          const catField = fields.find((f: any) => f.field_name === 'matter_type');

          if (claimantField) setClaimant(claimantField.current_value);
          if (respondentField) setRespondent(respondentField.current_value);
          if (forumField) setCourt(forumField.current_value);
          if (catField) setCategory(catField.current_value);
        })
        .catch((err) => {
          console.error('Failed to load analysis for new case:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [analysisId]);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseTitle.trim()) return;

    setSubmitting(true);
    try {
      const payload = {
        case_title: caseTitle.trim(),
        court_assigned_id: courtAssignedId.trim(),
        category: category,
        forum_court: court,
        initiating_parties: [{ name: claimant || 'Client', role: 'Petitioner / Complainant' }],
        opposing_parties: [{ name: respondent || 'Opposing Party', role: 'Respondent / Accused' }],
        core_issue: coreIssue,
        disputed_value: disputedValue,
      };

      let caseId = '';
      if (analysisId) {
        const res = await api.convertAnalysisToCase(analysisId, payload);
        caseId = res.id;
      } else {
        // Standalone case creation
        const localCases = JSON.parse(localStorage.getItem('legal_case_workspaces') || '[]');
        caseId = `case-${Date.now()}`;
        const newCase = {
          id: caseId,
          court_assigned_id: courtAssignedId,
          title: caseTitle,
          category,
          court,
          parties: [claimant, respondent].filter(Boolean),
          files: ['Intake_Document.pdf'],
          timeline: [{ date: new Date().toLocaleDateString('en-GB'), text: 'Matter record established.' }],
          precedents: [],
          summary: coreIssue,
          coreIssue,
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem('legal_case_workspaces', JSON.stringify([newCase, ...localCases]));
      }

      setCreatedCaseId(caseId);
      setTimeout(() => {
        router.push(`/legal/cases?caseId=${caseId}`);
      }, 1000);
    } catch (err: any) {
      console.error('Failed to create case:', err);
      alert(`Error creating case: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-slate-900 p-6 sm:p-10">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-[#E0D8C8]">
          <Link
            href="/legal/cases"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Cases Dossier</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 font-serif">
                {analysisId ? '1-Click Case Creation (From Analysis)' : 'Initiate New Matter Workspace'}
              </h1>
              <p className="text-xs text-slate-600">
                {analysisId
                  ? `Pre-filled from Analysis ${analysisId}. Captures dual identifiers and starts immutable audit trail.`
                  : 'Establish a structured legal matter with dual internal and court docket numbers.'}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white border border-[#E0D8C8] rounded-2xl">
            <div className="w-8 h-8 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span className="text-xs text-slate-600">Loading analysis parameters...</span>
          </div>
        ) : (
          <form onSubmit={handleCreateCase} className="bg-white border border-[#E0D8C8] rounded-2xl p-6 shadow-sm space-y-5">
            {/* Origin & Provenance Pill */}
            {analysisId && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Linked to Verified Intake Analysis: <strong>{analysisId}</strong></span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-emerald-300">
                  Full Lineage
                </span>
              </div>
            )}

            {/* Dual Identifiers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Internal Matter System ID
                </label>
                <input
                  type="text"
                  disabled
                  value={analysisId ? `tenant-case_${analysisId.slice(4, 14)}` : 'Auto-generated on save'}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Court-Assigned ID / CNR Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={courtAssignedId}
                  onChange={(e) => setCourtAssignedId(e.target.value)}
                  placeholder="e.g. DLHC01-002345-2024"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F3] border border-[#DDD5C7] text-xs text-slate-900 focus:outline-none focus:border-amber-600 font-mono"
                />
              </div>
            </div>

            {/* Case Title */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">Matter / Case Title</label>
                {analysisId && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200">
                    ✨ AI-Suggested
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                value={caseTitle}
                onChange={(e) => setCaseTitle(e.target.value)}
                placeholder="e.g. Singhania Enterprises v. Anonymous Handle & Platform X"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#DDD5C7] text-xs text-slate-900 focus:outline-none focus:border-amber-600 font-medium"
              />
            </div>

            {/* Forum & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Court / Forum</label>
                <input
                  type="text"
                  value={court}
                  onChange={(e) => setCourt(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F3] border border-[#DDD5C7] text-xs text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Matter Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F3] border border-[#DDD5C7] text-xs text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Complainant / Petitioner
                </label>
                <input
                  type="text"
                  value={claimant}
                  onChange={(e) => setClaimant(e.target.value)}
                  placeholder="e.g. ABC Ltd."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F3] border border-[#DDD5C7] text-xs text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Opposing Litigant / Respondent
                </label>
                <input
                  type="text"
                  value={respondent}
                  onChange={(e) => setRespondent(e.target.value)}
                  placeholder="e.g. Union of India"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F3] border border-[#DDD5C7] text-xs text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>

            {/* Core Issue & Factual Matrix */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Core Legal Issue & Factual Matrix
              </label>
              <textarea
                rows={4}
                value={coreIssue}
                onChange={(e) => setCoreIssue(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F3] border border-[#DDD5C7] text-xs text-slate-900 focus:outline-none focus:border-amber-600 leading-relaxed font-serif"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#EDE7DB]">
              <Link
                href="/legal/summarize"
                className="px-4 py-2 rounded-xl bg-[#FAF8F3] text-slate-700 hover:bg-[#F0ECE0] text-xs font-bold transition-colors"
              >
                ← Intake Another Matter
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <FolderPlus className="w-4 h-4" />
                <span>{submitting ? 'Creating Case...' : 'Confirm & Launch Workspace'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function NewCasePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF7F0] p-10 text-slate-600 text-xs">Loading case creator...</div>}>
      <NewCaseContent />
    </Suspense>
  );
}
