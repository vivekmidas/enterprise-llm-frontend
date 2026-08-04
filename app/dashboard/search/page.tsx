import { Metadata } from 'next';
import SearchInterface from './components/SearchInterface';

export const metadata: Metadata = {
  title: 'Case Search - Enterprise Case Management',
  description: 'Search and filter legal cases with advanced filters and AI-powered semantic search',
};

export default function SearchPage() {
  return (
    <main className="h-screen bg-gray-50 overflow-hidden">
      <SearchInterface />
    </main>
  );
}
