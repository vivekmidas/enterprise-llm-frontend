'use client';

import { useState } from 'react';
import { importCases, getImportJobStatus } from '@/lib/api/cases';
import { Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react';

type JobStatus = 'pending' | 'processing' | 'extracted' | 'review' | 'published' | 'failed';

interface ImportJob {
  id: string;
  status: JobStatus;
  file_name: string;
  total_cases: number;
  processed_cases: number;
  error_message?: string;
}

export default function CaseImportWidget() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileSelect(files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFileSelect(files);
  };

  const handleFileSelect = async (files: File[]) => {
    setError(null);
    setIsUploading(true);

    try {
      for (const file of files) {
        // Validate file type
        if (!['application/pdf', 'text/plain', 'application/json'].includes(file.type)) {
          setError('Only PDF, TXT, and JSON files are supported');
          continue;
        }

        const result = await importCases(file);

        // Add new job to list
        setJobs((prev) => [
          {
            id: result.job_id,
            status: 'pending',
            file_name: file.name,
            total_cases: 0,
            processed_cases: 0,
          },
          ...prev,
        ]);

        // Poll job status
        pollJobStatus(result.job_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import cases');
    } finally {
      setIsUploading(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const maxAttempts = 30; // Poll for max 30 seconds
    let attempts = 0;

    const poll = async () => {
      try {
        const job = await getImportJobStatus(jobId);

        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, ...job } : j))
        );

        // Continue polling if not done
        if (
          !['published', 'failed'].includes(job.status) &&
          attempts < maxAttempts
        ) {
          attempts++;
          setTimeout(poll, 1000);
        }
      } catch (err) {
        console.error('[v0] Failed to poll job status:', err);
      }
    };

    poll();
  };

  const getStatusColor = (status: JobStatus) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      processing: 'bg-blue-100 text-blue-800',
      extracted: 'bg-purple-100 text-purple-800',
      review: 'bg-orange-100 text-orange-800',
      published: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status: JobStatus) => {
    if (status === 'published') return <CheckCircle size={16} />;
    if (status === 'failed') return <AlertCircle size={16} />;
    if (['processing', 'pending'].includes(status)) {
      return <Loader size={16} className="animate-spin" />;
    }
    return null;
  };

  return (
    <div className="h-full flex flex-col overflow-hidden p-6 max-w-4xl mx-auto">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mb-8 p-12 border-2 border-dashed rounded-lg transition text-center cursor-pointer ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
      >
        <Upload size={32} className="mx-auto text-gray-400 mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Import Cases
        </h3>
        <p className="text-gray-600 mb-4">
          Drag and drop your case files here, or click to select
        </p>
        <p className="text-xs text-gray-500 mb-4">
          Supported formats: PDF, TXT, JSON
        </p>
        <label className="inline-block">
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
            accept=".pdf,.txt,.json"
          />
          <span className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium cursor-pointer inline-block disabled:opacity-50">
            {isUploading ? 'Uploading...' : 'Select Files'}
          </span>
        </label>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-medium text-red-900">Import Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Jobs List */}
      {jobs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Import History
          </h3>
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="p-4 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900">{job.file_name}</p>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                          job.status
                        )}`}
                      >
                        {getStatusIcon(job.status)}
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {job.processed_cases} / {job.total_cases} cases processed
                    </p>
                    {job.error_message && (
                      <p className="text-sm text-red-600 mt-1">{job.error_message}</p>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="w-32">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{
                          width: `${
                            job.total_cases > 0
                              ? (job.processed_cases / job.total_cases) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1 text-right">
                      {job.total_cases > 0
                        ? Math.round(
                            (job.processed_cases / job.total_cases) * 100
                          )
                        : 0}
                      %
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {jobs.length === 0 && !error && (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <p>No imports yet. Start by uploading a file above.</p>
        </div>
      )}
    </div>
  );
}
