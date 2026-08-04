import { Metadata } from 'next';
import AdminCaseManager from './components/AdminCaseManager';

export const metadata: Metadata = {
  title: 'Case Management - Admin Panel',
  description: 'Manage cases, edit extracted data, and review import jobs',
};

export default function AdminCasesPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <AdminCaseManager />
    </main>
  );
}
