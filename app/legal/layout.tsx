import type { ReactNode } from 'react';
import LegalHeader from './LegalHeader';
/* ==============================================================================
   BLOCK COMMENT: CENTRAL LEGAL CHAT ASSISTANT WIDGET
   Epic: epic_system_tenant_common_knowledge_bases.md
   Story: STORY-SYSKB-04 (Multilingual Voice Conversational Knowledge Assistant)
   Description:
       Mounts the chat assistant widget at the root legal layout level so that
       it remains accessible across all /legal sub-views and routes.
   ============================================================================== */
import LegalChatAssistantModal from '@/app/components/LegalChatAssistantModal';

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <LegalHeader />
      <main id="main-content">{children}</main>
      <LegalChatAssistantModal idleTimeoutSeconds={30} />
    </>
  );
}

