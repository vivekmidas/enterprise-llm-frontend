'use client';

import { Case } from '@/lib/types/case';
import { Badge } from '@/app/components/Badge';
import { useSearchStore } from '@/lib/stores/searchStore';
import { FileText, Download, Printer, Save, History } from 'lucide-react';
import { useState } from 'react';
import SaveQueryModal from './SaveQueryModal';
import ExportModal from './ExportModal';

interface CaseDetailsProps {
  caseData: Case;
}

export default function CaseDetails({ caseData }: CaseDetailsProps) {
  const [showSaveQuery, setShowSaveQuery] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const statusColors: Record<string, string> = {
    open: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    archived: 'bg-gray-100 text-gray-800',
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200 bg-white">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{caseData.title}</h1>
            <p className="text-sm text-gray-600 mt-1">Case ID: {caseData.id}</p>
          </div>
          <Badge className={`${statusColors[caseData.status] || statusColors.open}`}>
            {caseData.status}
          </Badge>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {caseData.judge && (
            <div>
              <p className="text-gray-600">Judge</p>
              <p className="font-medium text-gray-900">{caseData.judge}</p>
            </div>
          )}
          {caseData.court && (
            <div>
              <p className="text-gray-600">Court</p>
              <p className="font-medium text-gray-900">{caseData.court}</p>
            </div>
          )}
          {caseData.location && (
            <div>
              <p className="text-gray-600">Location</p>
              <p className="font-medium text-gray-900">{caseData.location}</p>
            </div>
          )}
          {caseData.article && (
            <div>
              <p className="text-gray-600">Article/Section</p>
              <p className="font-medium text-gray-900 font-mono">{caseData.article}</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {caseData.description && (
          <section>
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Description</h2>
            <p className="text-sm text-gray-700 leading-relaxed">{caseData.description}</p>
          </section>
        )}

        {caseData.full_text_content && (
          <section>
            <h2 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <FileText size={16} />
              Full Case Content
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
              <p className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                {caseData.full_text_content.substring(0, 2000)}
                {caseData.full_text_content.length > 2000 && (
                  <span className="text-gray-500">... [content truncated]</span>
                )}
              </p>
            </div>
          </section>
        )}

        {caseData.tags && caseData.tags.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {caseData.tags.map((tag) => (
                <Badge key={tag} className="bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {tag}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Metadata */}
        <section className="border-t border-gray-200 pt-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Metadata</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Created</span>
              <span className="text-gray-900">
                {new Date(caseData.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Modified</span>
              <span className="text-gray-900">
                {new Date(caseData.updated_at).toLocaleDateString()}
              </span>
            </div>
            {caseData.created_by && (
              <div className="flex justify-between">
                <span className="text-gray-600">Created By</span>
                <span className="text-gray-900">{caseData.created_by}</span>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Action Buttons */}
      <div className="flex-shrink-0 p-6 border-t border-gray-200 bg-gray-50 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowSaveQuery(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm flex items-center justify-center gap-2"
          >
            <Save size={16} />
            Save Query
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium text-sm flex items-center justify-center gap-2"
          >
            <Download size={16} />
            Export
          </button>
        </div>
        <button
          onClick={handlePrint}
          className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium text-sm flex items-center justify-center gap-2"
        >
          <Printer size={16} />
          Print
        </button>
        <button
          className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium text-sm flex items-center justify-center gap-2"
        >
          <History size={16} />
          View Audit Trail
        </button>
      </div>

      {/* Modals */}
      {showSaveQuery && <SaveQueryModal isOpen={showSaveQuery} onClose={() => setShowSaveQuery(false)} />}
      {showExport && (
        <ExportModal
          isOpen={showExport}
          onClose={() => setShowExport(false)}
          caseData={caseData}
        />
      )}
    </div>
  );
}
