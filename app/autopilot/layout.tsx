import type { ReactNode } from 'react';
/* ==============================================================================
   BLOCK COMMENT: AUTOPILOT LEGAL ASSISTANT LAYOUT INTEGRATION
   Epic: epic_system_tenant_common_knowledge_bases.md
   Story: STORY-SYSKB-04 (Multilingual Voice Conversational Knowledge Assistant)
   Description:
       Mounts the chat assistant widget for the /autopilot route and all nested
       cockpit views so users can query statutes and case dossiers simultaneously.
   ============================================================================== */
import LegalChatAssistantModal from '@/app/components/LegalChatAssistantModal';

export default function AutopilotLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <LegalChatAssistantModal idleTimeoutSeconds={30} />
    </>
  );
}
