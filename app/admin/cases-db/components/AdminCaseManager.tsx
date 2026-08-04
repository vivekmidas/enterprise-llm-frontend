'use client';

import { useState } from 'react';
import { Upload, List, Settings } from 'lucide-react';
import CaseListAdmin from './CaseListAdmin';
import CaseImportWidget from './CaseImportWidget';
import AdminAuditDashboard from './AdminAuditDashboard';

type TabType = 'cases' | 'import' | 'audit';

export default function AdminCaseManager() {
  const [activeTab, setActiveTab] = useState<TabType>('cases');

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Case Database Management</h1>
          <p className="text-gray-600 mt-1">
            Manage cases, review extraction, and monitor system activity
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('cases')}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                activeTab === 'cases'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <List size={18} className="inline mr-2" />
              Cases
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                activeTab === 'import'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Upload size={18} className="inline mr-2" />
              Import
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                activeTab === 'audit'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Settings size={18} className="inline mr-2" />
              Audit & Activity
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'cases' && <CaseListAdmin />}
        {activeTab === 'import' && <CaseImportWidget />}
        {activeTab === 'audit' && <AdminAuditDashboard />}
      </div>
    </div>
  );
}
