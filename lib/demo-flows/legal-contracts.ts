import type { Node, Edge } from '@xyflow/react';
import type { WorkflowNodeData } from '@/app/workflow-builder/types';

export const LEGAL_FLOW_ID = 'demo-legal-contracts';
export const LEGAL_FLOW_NAME = 'Legal Contract Intelligence — AI Review';
export const LEGAL_FLOW_DESCRIPTION =
  'Automated contract review: doc parsing → clause risk flagging → conditional routing for attorney escalation or auto-registration → calendar sync and immutable audit logging.';
export const LEGAL_FLOW_CATEGORY = 'Legal';

export const legalNodes: Node<WorkflowNodeData>[] = [
  {
    id: 'legal-trigger',
    type: 'agentNode',
    position: { x: 60, y: 220 },
    data: {
      name: 'document_upload_trigger',
      label: 'Document Upload',
      description:
        'Fires when a contract is uploaded to SharePoint / iManage or arrives via email attachment.',
      node_type: 'TRIGGER',
      category: 'Trigger',
      icon: 'play-circle',
      color: '#3b82f6',
      badge: 'Trigger',
      user_properties: {},
      executionStatus: 'idle',
    },
  },
  {
    id: 'legal-doc-parser',
    type: 'agentNode',
    position: { x: 300, y: 220 },
    data: {
      name: 'llm_doc_parser',
      label: 'Doc Parser',
      description:
        'LLM extracts parties, dates, obligations, payment terms, SLA clauses, and governing law.',
      node_type: 'LLM',
      category: 'LLM',
      icon: 'bot',
      color: '#8b5cf6',
      badge: 'LLM',
      user_properties: {},
      executionStatus: 'idle',
    },
  },
  {
    id: 'legal-clause-flagger',
    type: 'agentNode',
    position: { x: 540, y: 220 },
    data: {
      name: 'llm_clause_risk_flagger',
      label: 'Clause Risk Flagger',
      description:
        'LLM identifies non-standard clauses and assigns per-clause risk scores (Low / Medium / High).',
      node_type: 'LLM',
      category: 'LLM',
      icon: 'bot',
      color: '#8b5cf6',
      badge: 'LLM',
      user_properties: {},
      executionStatus: 'idle',
    },
  },
  {
    id: 'legal-risk-router',
    type: 'agentNode',
    position: { x: 780, y: 220 },
    data: {
      name: 'risk_router',
      label: 'Risk Router',
      description: 'Routes contract: High risk → attorney alert. Standard → auto-register.',
      node_type: 'Condition',
      category: 'Condition',
      icon: 'git-branch',
      color: '#f59e0b',
      badge: 'Condition',
      user_properties: {},
      executionStatus: 'idle',
    },
  },
  {
    id: 'legal-lawyer-alert',
    type: 'agentNode',
    position: { x: 1020, y: 80 },
    data: {
      name: 'lawyer_alert',
      label: 'Lawyer Alert',
      description:
        'Sends Slack + email to assigned attorney with risk summary and flagged clauses.',
      node_type: 'Output',
      category: 'Output',
      icon: 'alert-triangle',
      color: '#ef4444',
      badge: 'Output',
      user_properties: {},
      executionStatus: 'idle',
    },
  },
  {
    id: 'legal-auto-register',
    type: 'agentNode',
    position: { x: 1020, y: 360 },
    data: {
      name: 'contract_register',
      label: 'Contract Register',
      description:
        'Adds standard contract to the contract register database with extracted metadata.',
      node_type: 'Data',
      category: 'Data',
      icon: 'database',
      color: '#06b6d4',
      badge: 'Data',
      user_properties: {},
      executionStatus: 'idle',
    },
  },
  {
    id: 'legal-calendar-sync',
    type: 'agentNode',
    position: { x: 1280, y: 220 },
    data: {
      name: 'calendar_sync',
      label: 'Calendar Sync',
      description:
        'Pushes renewal dates, payment obligations, and SLA deadlines to Google/Outlook calendar with 30/7/1 day reminders.',
      node_type: 'Data',
      category: 'Data',
      icon: 'calendar',
      color: '#06b6d4',
      badge: 'Data',
      user_properties: {},
      executionStatus: 'idle',
    },
  },
  {
    id: 'legal-audit',
    type: 'agentNode',
    position: { x: 1520, y: 220 },
    data: {
      name: 'audit_logger',
      label: 'Audit Logger',
      description:
        'Writes immutable audit trail: who reviewed, risk score, decision, timestamp. Supports SOC2 / GDPR compliance.',
      node_type: 'Output',
      category: 'Output',
      icon: 'shield',
      color: '#6366f1',
      badge: 'Output',
      user_properties: {},
      executionStatus: 'idle',
    },
  },
];

export const legalEdges: Edge[] = [
  {
    id: 'e-trigger-parser',
    source: 'legal-trigger',
    target: 'legal-doc-parser',
    animated: true,
  },
  {
    id: 'e-parser-flagger',
    source: 'legal-doc-parser',
    target: 'legal-clause-flagger',
    animated: true,
  },
  {
    id: 'e-flagger-router',
    source: 'legal-clause-flagger',
    target: 'legal-risk-router',
    animated: true,
  },
  {
    id: 'e-router-lawyer',
    source: 'legal-risk-router',
    target: 'legal-lawyer-alert',
    label: 'High Risk',
    animated: true,
  },
  {
    id: 'e-router-register',
    source: 'legal-risk-router',
    target: 'legal-auto-register',
    label: 'Standard',
    animated: true,
  },
  { id: 'e-lawyer-calendar', source: 'legal-lawyer-alert', target: 'legal-calendar-sync' },
  { id: 'e-register-calendar', source: 'legal-auto-register', target: 'legal-calendar-sync' },
  {
    id: 'e-calendar-audit',
    source: 'legal-calendar-sync',
    target: 'legal-audit',
    animated: true,
  },
];

export const legalDemoPayload = {
  id: LEGAL_FLOW_ID,
  name: LEGAL_FLOW_NAME,
  description: LEGAL_FLOW_DESCRIPTION,
  category: LEGAL_FLOW_CATEGORY,
  is_enabled: true,
  nodes: legalNodes,
  edges: legalEdges,
  properties: {},
};
