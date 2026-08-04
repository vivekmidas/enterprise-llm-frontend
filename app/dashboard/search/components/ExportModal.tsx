'use client';

import { useState } from 'react';
import { Case } from '@/lib/types/case';
import { exportCases } from '@/lib/api/cases';
import { X, Download, Loader } from 'lucide-react';
import { useSearchStore } from '@/lib/stores/searchStore';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: Case;
}

export default function ExportModal({ isOpen, onClose, caseData }: ExportModalProps) {
  const [format, setFormat] = useState<'pdf' | 'csv' | 'json'>('pdf');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { searchText, filters, searchMode } = useSearchStore();

  const handleExport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const blob = await exportCases(
        [caseData.id],
        format,
        searchText ? { text: searchText, mode: searchMode, filters } : undefined
      );

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `case_${caseData.id}.${format === 'csv' ? 'csv' : format === 'json' ? 'json' : 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export case');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Export Case</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Export Format
            </label>
            <div className="space-y-2">
              {[
                { value: 'pdf' as const, label: 'PDF Document', desc: 'Formatted document for printing' },
                { value: 'csv' as const, label: 'CSV Spreadsheet', desc: 'Compatible with Excel' },
                { value: 'json' as const, label: 'JSON Data', desc: 'Structured data format' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition ${
                    format === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value={option.value}
                    checked={format === option.value}
                    onChange={(e) => setFormat(e.target.value as typeof format)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{option.label}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{option.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Case Summary */}
          <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-1">
            <p className="font-medium text-gray-900">Exporting:</p>
            <p className="text-gray-700">{caseData.title}</p>
            <p className="text-gray-600">Case ID: {caseData.id}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading && <Loader size={16} className="animate-spin" />}
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
