import { hrDemoPayload, HR_FLOW_ID } from './hr-recruitment';
import { legalDemoPayload, LEGAL_FLOW_ID } from './legal-contracts';

export * from './hr-recruitment';
export * from './legal-contracts';

export interface DemoFlowMeta {
  id: string;
  name: string;
  description: string;
  industry: string;
  industryIcon: string;
  industryColor: string;
  nodeCount: number;
  integrations: string[];
  tags: string[];
  payload: typeof hrDemoPayload | typeof legalDemoPayload;
}

export const DEMO_FLOWS: DemoFlowMeta[] = [
  {
    id: HR_FLOW_ID,
    name: 'AI Talent Pipeline',
    description:
      'Full hiring automation: CV parsing → semantic job matching → auto-triage into rejection, screening, or fast-track → CRM sync and DEI reporting.',
    industry: 'HR / Recruitment',
    industryIcon: '👥',
    industryColor: '#8b5cf6',
    nodeCount: 9,
    integrations: ['Greenhouse', 'Workday', 'Lever', 'Calendly', 'Salesforce', 'DocuSign'],
    tags: ['LLM', 'Branching', 'Email', 'CRM', 'DEI'],
    payload: hrDemoPayload,
  },
  {
    id: LEGAL_FLOW_ID,
    name: 'AI Contract Intelligence',
    description:
      'Automated contract review: doc parsing → clause risk flagging → attorney escalation or auto-registration → deadline tracking and audit logging.',
    industry: 'Legal',
    industryIcon: '⚖️',
    industryColor: '#6366f1',
    nodeCount: 8,
    integrations: ['SharePoint', 'iManage', 'Google Calendar', 'Outlook', 'Slack', 'Salesforce'],
    tags: ['LLM', 'Risk Scoring', 'Calendar', 'Audit', 'Compliance'],
    payload: legalDemoPayload,
  },
];

export function getDemoFlowById(id: string): DemoFlowMeta | undefined {
  return DEMO_FLOWS.find((f) => f.id === id);
}
