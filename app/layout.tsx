import type { Metadata } from 'next';
import Providers from '@components/Providers';
import Header from '@components/Header';
import './globals.css';
export const metadata: Metadata = {
  title: 'Enterprise LLM Frontend',
  description: 'Workflow Builder for Enterprise LLM Gateway',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white">
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
