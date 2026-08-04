import { Metadata } from 'next';
import AuditLogViewer from './components/AuditLogViewer';

export const metadata: Metadata = {
  title: 'My Audit Logs - Case Management',
  description: 'View your search history and actions for audit and compliance tracking',
};

export default function AuditLogsPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-2">Track your searches, views, exports, and other actions</p>
        </div>
        <AuditLogViewer />
      </div>
    </main>
  );
}
