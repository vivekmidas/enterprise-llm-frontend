'use client';

import { useState, useEffect } from 'react';
import { getAuditLogs } from '@/lib/api/cases';
import { AuditLog, AuditAction } from '@/lib/types/case';
import { format } from 'date-fns';
import { AlertCircle, Loader, Download } from 'lucide-react';
import { Badge } from '@/app/components/Badge';

const actionColors: Record<AuditAction, string> = {
  SEARCH: 'bg-blue-100 text-blue-800',
  VIEW: 'bg-gray-100 text-gray-800',
  EDIT: 'bg-orange-100 text-orange-800',
  EXPORT: 'bg-green-100 text-green-800',
  PRINT: 'bg-purple-100 text-purple-800',
  SAVE_QUERY: 'bg-indigo-100 text-indigo-800',
  DELETE_QUERY: 'bg-red-100 text-red-800',
};

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<AuditAction | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const auditLogs = await getAuditLogs({
        action: filterAction || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        limit: 100,
      });
      setLogs(auditLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilter = () => {
    loadAuditLogs();
  };

  const getActionLabel = (action: AuditAction): string => {
    return action.replace(/_/g, ' ');
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action
            </label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value as AuditAction | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All Actions</option>
              <option value="SEARCH">Search</option>
              <option value="VIEW">View</option>
              <option value="EDIT">Edit</option>
              <option value="EXPORT">Export</option>
              <option value="PRINT">Print</option>
              <option value="SAVE_QUERY">Save Query</option>
              <option value="DELETE_QUERY">Delete Query</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleFilter}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
          >
            Apply Filters
          </button>
          <button
            onClick={() => {
              setFilterAction('');
              setDateFrom('');
              setDateTo('');
            }}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium text-sm"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Activity Log ({logs.length})
            </h2>
            <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-sm font-medium">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-blue-600" size={32} />
          </div>
        ) : error ? (
          <div className="p-6 flex items-start gap-3 bg-red-50">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-medium text-red-900">Error Loading Logs</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-sm">No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={actionColors[log.action]}>
                        {getActionLabel(log.action)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {log.resource_type === 'case' && log.case_id && (
                        <span className="font-mono">Case: {log.case_id.substring(0, 8)}</span>
                      )}
                      {log.resource_type === 'query' && log.query_id && (
                        <span className="font-mono">Query: {log.query_id.substring(0, 8)}</span>
                      )}
                      {log.resource_type === 'search' && (
                        <span>Search</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.details?.query_text && (
                        <span className="line-clamp-1">{log.details.query_text}</span>
                      )}
                      {log.details?.result_count !== undefined && (
                        <span className="text-gray-600">
                          {log.details.result_count} results
                        </span>
                      )}
                      {log.details?.export_format && (
                        <span className="uppercase text-xs bg-gray-100 px-2 py-1 rounded">
                          {log.details.export_format}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
