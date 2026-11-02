import type { Metadata } from 'next';
import Providers from '@components/Providers';
import Header from '@components/Header';
import './globals.css';
export const metadata: Metadata = {
  title: 'nFlow — Workflow Automation for Growing Businesses',
  description:
    'Open-source workflow automation platform for small & mid-size enterprises. Visual builder, RBAC, observability, custom nodes, and AI-native integrations.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <Header />
          {children}
        </Providers>
        {/* <script src="http://localhost:3000/plugin.js" data-api-key="ik_live_intuactai_main_site" async></script> */}
      </body>
    </html>
  );
}
