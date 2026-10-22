'use client';

/* ==============================================================================
   BLOCK COMMENT: WORKFLOW ENDPOINT BAR & API INVOCATION SPEC DRAWER
   Reference: EPIC-WORKFLOW-ENDPOINT-001 / STORY-WF-INVOKE-UI
   Description:
     Displays the tenant-scoped execution endpoint path
     (/run/workflows/{customer_id}/{workflow_id}) on top of the workflow
     definition once saved. Provides a collapsible responsive drawer showing:
       1. Full endpoint URL and optional webhook alias path
       2. Required HTTP headers (Content-Type, Authorization / X-API-Key)
       3. Resolved entry input_contract schema fields
       4. Auto-generated sample JSON payload and copyable cURL command
     Uses strictly relative/flex/grid responsive layout (no absolute positioning).
   ============================================================================== */

import React, { useMemo, useState } from 'react';
import {
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Terminal,
  FileJson,
  ShieldCheck,
  Code2,
  Link2,
} from 'lucide-react';
import type { Node, Edge } from '@xyflow/react';
import { BACKEND_URL } from '@/lib/api';
import type { WorkflowNodeData } from '../types';

export interface WorkflowInvocationSpec {
  method?: string;
  url_path: string;
  webhook_path?: string | null;
  customer_id: string | number;
  workflow_id: string;
  workflow_name?: string;
  is_enabled?: boolean;
  headers: Record<string, string>;
  webhook_auth_hint?: string | null;
  input_contract: Record<string, any>;
  normalized_contract?: Record<string, any>;
  sample_payload: Record<string, any>;
}

interface WorkflowEndpointBarProps {
  agentId: string;
  customerId: string | number | null;
  isAgentEnabled: boolean;
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  invocationSpec: WorkflowInvocationSpec | null;
}

interface ContractFieldRow {
  path: string;
  type: string;
  required: boolean;
  description?: string;
}

/** Extracts flat field list from either rules-based or JSON-schema contract */
function extractContractFields(contract: any, prefix = ''): ContractFieldRow[] {
  if (!contract || typeof contract !== 'object') return [];

  if (Array.isArray(contract.rules)) {
    return contract.rules
      .filter((r: any) => r && typeof r === 'object' && (r.field_name || r.name))
      .map((r: any) => ({
        path: String(r.field_name || r.name),
        type: String(r.field_type || r.type || 'string'),
        required: Boolean(r.required || r.mandatory),
        description: r.description ? String(r.description) : undefined,
      }));
  }

  const props = contract.properties || (contract.type === 'object' ? {} : contract);
  if (!props || typeof props !== 'object') return [];
  const reqList = Array.isArray(contract.required) ? contract.required : [];
  const rows: ContractFieldRow[] = [];

  Object.entries(props).forEach(([key, val]: [string, any]) => {
    if (['type', 'required', 'mandatory', 'additionalProperties'].includes(key)) return;
    const fieldPath = prefix ? `${prefix}.${key}` : key;
    if (typeof val === 'string') {
      rows.push({
        path: fieldPath,
        type: val,
        required: reqList.includes(key),
      });
    } else if (val && typeof val === 'object') {
      const fType = Array.isArray(val.type) ? val.type.join(' | ') : String(val.type || 'object');
      const isReq = Boolean(val.required || val.mandatory || reqList.includes(key));
      rows.push({
        path: fieldPath,
        type: val.format ? `${fType} (${val.format})` : fType,
        required: isReq,
        description: val.description ? String(val.description) : undefined,
      });
      if (val.properties && typeof val.properties === 'object') {
        rows.push(...extractContractFields(val, fieldPath));
      }
    }
  });

  return rows;
}

/** Generates sample JSON payload on the client if nodes were updated locally */
function buildSampleFromFields(fields: ContractFieldRow[]): Record<string, any> {
  const sample: Record<string, any> = {};
  fields.forEach((f) => {
    const parts = f.path.split('.');
    let cur = sample;
    parts.forEach((rawPart, idx) => {
      const part = rawPart.replace('[]', '');
      const isLeaf = idx === parts.length - 1;
      if (isLeaf) {
        const lowerType = f.type.toLowerCase();
        if (lowerType.includes('email')) cur[part] = 'user@example.com';
        else if (lowerType.includes('phone')) cur[part] = '+1-555-123-4567';
        else if (lowerType.includes('int') || lowerType.includes('number')) cur[part] = 0;
        else if (lowerType.includes('bool')) cur[part] = true;
        else if (lowerType.includes('array')) cur[part] = ['<item>'];
        else if (lowerType.includes('object')) cur[part] = cur[part] || {};
        else cur[part] = '<string>';
      } else {
        if (!cur[part] || typeof cur[part] !== 'object') {
          cur[part] = {};
        }
        cur = cur[part];
      }
    });
  });
  return sample;
}

export default function WorkflowEndpointBar({
  agentId,
  customerId,
  isAgentEnabled,
  nodes,
  edges,
  invocationSpec,
}: WorkflowEndpointBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [contractViewMode, setContractViewMode] = useState<'table' | 'json'>('table');

  const resolvedCustomerId =
    invocationSpec?.customer_id ??
    (customerId !== null && customerId !== undefined && String(customerId) !== ''
      ? customerId
      : 'default');

  const urlPath = invocationSpec?.url_path || `/run/workflows/${resolvedCustomerId}/${agentId}`;
  const fullUrl = `${BACKEND_URL}${urlPath}`;

  // Derive entry contract & sample payload from invocationSpec or live canvas trigger node
  const derivedSpec = useMemo(() => {
    const targetIds = new Set(edges.map((e) => String(e.target)));
    const entryNode =
      nodes.find((n) => {
        const d = (n.data || {}) as any;
        const nType = String(d.node_type || d.properties?.node_type || '').toUpperCase();
        const cat = String(d.category || d.group || '').toUpperCase();
        const name = String(d.name || '').toLowerCase();
        return (
          nType === 'TRIGGER' ||
          cat === 'TRIGGER' ||
          cat === 'START' ||
          name.includes('webhook') ||
          name.includes('trigger')
        );
      }) ||
      nodes.find((n) => !targetIds.has(String(n.id))) ||
      nodes[0];

    const entryData = (entryNode?.data || {}) as any;
    const entryProps = entryData.properties || {};
    const liveBasePath = String(entryProps.base_path || '').replace(/^\/+|\/+$/g, '');
    const webhookPath =
      invocationSpec?.webhook_path || (liveBasePath ? `/webhooks/run/${liveBasePath}` : null);

    let contract: Record<string, any> = {};
    const liveIn = entryData.input_contract || entryData.inputContract;
    const liveOut = entryData.output_contract || entryData.outputContract;

    if (liveIn && typeof liveIn === 'object' && Object.keys(liveIn).length > 0) {
      contract = liveIn;
    } else if (liveOut && typeof liveOut === 'object' && Object.keys(liveOut).length > 0) {
      contract = liveOut;
    } else if (
      invocationSpec?.input_contract &&
      Object.keys(invocationSpec.input_contract).length > 0
    ) {
      contract = invocationSpec.input_contract;
    } else if (entryNode) {
      const firstEdge = edges.find((e) => String(e.source) === String(entryNode.id));
      const nextNode = firstEdge
        ? nodes.find((n) => String(n.id) === String(firstEdge.target))
        : undefined;
      const nextIn = (nextNode?.data as any)?.input_contract;
      if (nextIn && typeof nextIn === 'object' && Object.keys(nextIn).length > 0) {
        contract = nextIn;
      }
    }

    const fields = extractContractFields(contract);
    const hasSpecSample =
      invocationSpec?.sample_payload && Object.keys(invocationSpec.sample_payload).length > 0;
    const samplePayload = hasSpecSample
      ? invocationSpec!.sample_payload
      : fields.length > 0
        ? buildSampleFromFields(fields)
        : {};

    const headers: Record<string, string> = invocationSpec?.headers || {
      'Content-Type': 'application/json',
      Authorization: 'Bearer <JWT_TOKEN_OR_GW_LIVE_KEY>',
      'X-API-Key': 'gw_live_<YOUR_API_KEY>',
    };

    return {
      webhookPath,
      contract,
      fields,
      samplePayload,
      headers,
    };
  }, [nodes, edges, invocationSpec]);

  const curlSnippet = useMemo(() => {
    const payloadStr = JSON.stringify(derivedSpec.samplePayload, null, 2);
    return [
      `curl -X POST '${fullUrl}' \\`,
      `  -H 'Content-Type: application/json' \\`,
      `  -H 'Authorization: Bearer <YOUR_JWT_OR_API_KEY>' \\`,
      `  -d '${payloadStr}'`,
    ].join('\n');
  }, [fullUrl, derivedSpec.samplePayload]);

  // Only show bar when workflow has been saved and has an ID
  if (!agentId) {
    return null;
  }

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <div className="w-full border-b border-slate-200 bg-slate-50/90 text-slate-800 transition-all">
      {/* Compact Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-2">
        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
          <span className="inline-flex items-center gap-1 rounded bg-indigo-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            POST
          </span>

          <div className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 font-mono text-xs text-slate-700 shadow-2xs">
            <Link2 size={13} className="text-indigo-500 shrink-0" />
            <span className="truncate font-semibold select-all" title={fullUrl}>
              {urlPath}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleCopy('url', fullUrl)}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            title="Copy full endpoint URL"
          >
            {copiedKey === 'url' ? (
              <>
                <Check size={12} className="text-emerald-600" />
                <span className="text-emerald-700">Copied URL</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy URL</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleCopy('curl-top', curlSnippet)}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            title="Copy ready-to-run cURL command"
          >
            {copiedKey === 'curl-top' ? (
              <>
                <Check size={12} className="text-emerald-600" />
                <span className="text-emerald-700">Copied cURL</span>
              </>
            ) : (
              <>
                <Terminal size={12} />
                <span>Copy cURL</span>
              </>
            )}
          </button>

          {derivedSpec.webhookPath && (
            <span className="hidden md:inline-flex items-center gap-1 rounded border border-purple-200 bg-purple-50 px-2 py-0.5 font-mono text-[10px] text-purple-700">
              Webhook: {derivedSpec.webhookPath}
            </span>
          )}

          {!isAgentEnabled && (
            <span className="inline-flex items-center rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
              Enable workflow to accept requests
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50/80 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
        >
          <Code2 size={13} />
          <span>API Spec &amp; Payload</span>
          {derivedSpec.fields.length > 0 && (
            <span className="rounded-full bg-indigo-200/80 px-1.5 py-0.2 text-[10px] font-bold text-indigo-800">
              {derivedSpec.fields.length}
            </span>
          )}
          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Collapsible Responsive Details Drawer */}
      {isExpanded && (
        <div className="border-t border-slate-200 bg-white px-6 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column: Headers & Input Contract */}
            <div className="flex flex-col gap-3">
              {/* Required Headers */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <ShieldCheck size={13} className="text-indigo-600" />
                    <span>Required Headers</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy('headers', JSON.stringify(derivedSpec.headers, null, 2))
                    }
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    {copiedKey === 'headers' ? (
                      <Check size={11} className="text-emerald-600" />
                    ) : (
                      <Copy size={11} />
                    )}
                    <span>{copiedKey === 'headers' ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>

                <div className="space-y-1 font-mono text-[11px]">
                  {Object.entries(derivedSpec.headers).map(([hKey, hVal]) => (
                    <div
                      key={hKey}
                      className="flex flex-wrap items-center justify-between gap-2 rounded bg-white px-2.5 py-1 border border-slate-200/80"
                    >
                      <span className="font-semibold text-slate-700">{hKey}:</span>
                      <span className="text-slate-500 truncate">{hVal}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Input Contract */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <FileJson size={13} className="text-indigo-600" />
                    <span>Entry Input Contract</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="inline-flex rounded border border-slate-200 bg-white p-0.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setContractViewMode('table')}
                        className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                          contractViewMode === 'table'
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Fields
                      </button>
                      <button
                        type="button"
                        onClick={() => setContractViewMode('json')}
                        className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                          contractViewMode === 'json'
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Schema JSON
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy('contract', JSON.stringify(derivedSpec.contract || {}, null, 2))
                      }
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      {copiedKey === 'contract' ? (
                        <Check size={11} className="text-emerald-600" />
                      ) : (
                        <Copy size={11} />
                      )}
                      <span>{copiedKey === 'contract' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {contractViewMode === 'table' ? (
                  derivedSpec.fields.length > 0 ? (
                    <div className="max-h-40 overflow-y-auto rounded border border-slate-200 bg-white divide-y divide-slate-100 font-mono text-[11px]">
                      {derivedSpec.fields.map((field) => (
                        <div
                          key={field.path}
                          className="flex items-center justify-between px-2.5 py-1.5"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-semibold text-slate-800 truncate">
                              {field.path}
                            </span>
                            {field.required && (
                              <span className="rounded bg-amber-50 border border-amber-200 px-1 py-0.2 text-[9px] font-bold uppercase text-amber-700">
                                required
                              </span>
                            )}
                          </div>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 shrink-0">
                            {field.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded border border-dashed border-slate-200 bg-white p-3 text-xs text-slate-500">
                      No entry contract fields defined on Trigger node. Select your Trigger node
                      &rarr; <strong>Data Contracts</strong> tab to define expected JSON fields.
                    </div>
                  )
                ) : (
                  <pre className="max-h-40 overflow-auto rounded border border-slate-200 bg-slate-900 p-2.5 font-mono text-[11px] text-slate-100">
                    {JSON.stringify(derivedSpec.contract || {}, null, 2)}
                  </pre>
                )}
              </div>
            </div>

            {/* Right Column: Sample Payload & cURL */}
            <div className="flex flex-col gap-3">
              {/* Sample Payload */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <Code2 size={13} className="text-indigo-600" />
                    <span>Sample Request Payload</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy('payload', JSON.stringify(derivedSpec.samplePayload, null, 2))
                    }
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    {copiedKey === 'payload' ? (
                      <Check size={11} className="text-emerald-600" />
                    ) : (
                      <Copy size={11} />
                    )}
                    <span>{copiedKey === 'payload' ? 'Copied' : 'Copy Payload'}</span>
                  </button>
                </div>
                <pre className="max-h-28 overflow-auto rounded border border-slate-200 bg-slate-900 p-2.5 font-mono text-[11px] text-emerald-300">
                  {JSON.stringify(derivedSpec.samplePayload, null, 2)}
                </pre>
              </div>

              {/* cURL Command */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <Terminal size={13} className="text-indigo-600" />
                    <span>Quick Test cURL</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('curl-drawer', curlSnippet)}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    {copiedKey === 'curl-drawer' ? (
                      <Check size={11} className="text-emerald-600" />
                    ) : (
                      <Copy size={11} />
                    )}
                    <span>{copiedKey === 'curl-drawer' ? 'Copied' : 'Copy cURL'}</span>
                  </button>
                </div>
                <pre className="max-h-32 overflow-auto rounded border border-slate-200 bg-slate-900 p-2.5 font-mono text-[11px] text-slate-200">
                  {curlSnippet}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
