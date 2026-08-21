import type { ReactNode } from 'react';
import LegalHeader from './LegalHeader';

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <LegalHeader />
      <main id="main-content">{children}</main>
    </>
  );
}
