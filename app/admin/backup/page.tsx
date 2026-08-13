/*
===============================================================================
BLOCK COMMENT: SQL BACKUP EXPORTER ADMIN TAB COMPONENT
Module: frontend/app/admin/backup/page.tsx
Description:
    Provides system_admin with an interactive dashboard for SQL data backups.
    - Top panel with "Export System SQL Backup" action.
    - Displays all historical backups in reverse chronological order in a table.
    - Columns: Filename, Date & Time, Size (formatted), Download / Copy actions.
    - Search filtering, summary statistics, and instant file download capabilities.
===============================================================================
*/

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import {
  Database,
  Download,
  RefreshCw,
  Search,
  Copy,
  Check,
  HardDrive,
  Calendar,
  FileCode,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import Alert from '@mui/material/Alert';

interface BackupItem {
  filename: string;
  filepath: string;
  size_bytes: number;
  created_at: number; // epoch timestamp (seconds)
}

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatDateTime(timestamp: number): string {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return '';
  const now = Date.now();
  const diffSec = Math.floor((now - timestamp * 1000) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

export default function BackupTab() {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedFilename, setCopiedFilename] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const data = await api.getSqlBackupsHistory();
      // Ensure reverse chronological sorting
      const sorted = (data || []).sort((a, b) => b.created_at - a.created_at);
      setBackups(sorted);
    } catch (err: any) {
      console.error('Failed to fetch backup history:', err);
      setAlertMessage({
        type: 'error',
        text: err?.message || 'Failed to load backup history',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleExportBackup = async () => {
    setExporting(true);
    setAlertMessage(null);
    try {
      const filename = await api.exportSqlBackup();
      setAlertMessage({
        type: 'success',
        text: `Successfully exported and downloaded backup: ${filename}`,
      });
      // Refresh list to include the new backup
      await fetchBackups();
    } catch (err: any) {
      setAlertMessage({
        type: 'error',
        text: err?.message || 'Failed to generate SQL data backup',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadExisting = async (filename: string) => {
    setDownloadingFile(filename);
    try {
      await api.downloadSqlBackupFile(filename);
      setAlertMessage({
        type: 'success',
        text: `Downloaded backup: ${filename}`,
      });
    } catch (err: any) {
      setAlertMessage({
        type: 'error',
        text: err?.message || `Failed to download ${filename}`,
      });
    } finally {
      setDownloadingFile(null);
    }
  };

  const handleCopyFilename = (filename: string) => {
    navigator.clipboard.writeText(filename);
    setCopiedFilename(filename);
    setTimeout(() => setCopiedFilename(null), 2000);
  };

  // Filtered backups
  const filteredBackups = useMemo(() => {
    if (!searchQuery.trim()) return backups;
    const q = searchQuery.toLowerCase();
    return backups.filter((b) => b.filename.toLowerCase().includes(q));
  }, [backups, searchQuery]);

  // Statistics
  const totalBackups = backups.length;
  const totalSizeBytes = backups.reduce((acc, b) => acc + (b.size_bytes || 0), 0);
  const latestBackupTime = backups.length > 0 ? backups[0].created_at : null;

  return (
    <div className="space-y-6">
      {/* Alert Notification */}
      {alertMessage && (
        <Alert
          severity={alertMessage.type}
          onClose={() => setAlertMessage(null)}
          className="shadow-sm"
        >
          {alertMessage.text}
        </Alert>
      )}

      {/* Top Header Card with Export Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Database className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">SQL Backup Exporter</h1>
          </div>
          <p className="text-xs text-gray-500 font-medium">
            Export full system RBAC, tenant configuration, and workflow data as portable SQL dumps.
          </p>
        </div>

        {/* Top Export Button & Refresh */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchBackups}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl border border-gray-200 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            title="Refresh backup list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportBackup}
            disabled={exporting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow disabled:opacity-50 cursor-pointer"
            title="Export complete database backup"
          >
            <Database className="w-4 h-4 text-blue-200" />
            <span>{exporting ? 'Generating SQL Backup...' : 'Export System SQL Backup'}</span>
            <Download className="w-3.5 h-3.5 opacity-90" />
          </button>
        </div>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Backups</div>
            <div className="text-xl font-black text-gray-900">{totalBackups}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Storage</div>
            <div className="text-xl font-black text-gray-900">{formatBytes(totalSizeBytes)}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Latest Backup</div>
            <div className="text-sm font-bold text-gray-900 truncate">
              {latestBackupTime ? formatDateTime(latestBackupTime) : 'Never'}
            </div>
            {latestBackupTime && (
              <span className="text-[11px] text-purple-600 font-medium">
                {formatRelativeTime(latestBackupTime)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Header Filter Bar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search backups by filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white text-xs text-gray-900 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            />
          </div>
          <div className="text-xs font-medium text-gray-500">
            Showing <span className="font-bold text-gray-800">{filteredBackups.length}</span> of {totalBackups} backups
          </div>
        </div>

        {/* Backups Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100/75 border-b border-gray-200 text-gray-600 uppercase tracking-wider text-[11px] font-bold">
                <th className="py-3 px-5">Filename</th>
                <th className="py-3 px-5">Date & Time</th>
                <th className="py-3 px-5">Size</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                      <span className="text-xs font-semibold">Loading backup registry...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredBackups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="p-3 bg-gray-100 rounded-full text-gray-400">
                        <Database className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-gray-800">
                          {searchQuery ? 'No backups match your search' : 'No SQL backups found'}
                        </div>
                        <p className="text-xs text-gray-400 max-w-sm">
                          {searchQuery
                            ? 'Try clearing your search keyword.'
                            : 'Click "Export System SQL Backup" above to generate your first backup dump.'}
                        </p>
                      </div>
                      {!searchQuery && (
                        <button
                          onClick={handleExportBackup}
                          disabled={exporting}
                          className="mt-2 flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                        >
                          <Database className="w-3.5 h-3.5" />
                          <span>Export First Backup</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBackups.map((item) => (
                  <tr
                    key={item.filename}
                    className="hover:bg-blue-50/40 transition-colors group"
                  >
                    {/* Filename */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-600 rounded-lg transition-colors">
                          <FileCode className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-mono text-xs font-bold text-gray-900">
                            {item.filename}
                          </span>
                          <div className="text-[11px] text-gray-400 font-mono truncate max-w-xs md:max-w-md">
                            {item.filepath}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-gray-800 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{formatDateTime(item.created_at)}</span>
                        </div>
                        <div className="text-[11px] text-gray-400 font-medium pl-5">
                          {formatRelativeTime(item.created_at)}
                        </div>
                      </div>
                    </td>

                    {/* Size */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {formatBytes(item.size_bytes)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {/* Copy Filename Button */}
                        <button
                          onClick={() => handleCopyFilename(item.filename)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          title="Copy filename"
                        >
                          {copiedFilename === item.filename ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        {/* Download File Button */}
                        <button
                          onClick={() => handleDownloadExisting(item.filename)}
                          disabled={downloadingFile === item.filename}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                          title="Download SQL backup"
                        >
                          <Download
                            className={`w-3.5 h-3.5 ${
                              downloadingFile === item.filename ? 'animate-bounce' : ''
                            }`}
                          />
                          <span>
                            {downloadingFile === item.filename ? 'Downloading...' : 'Download'}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
