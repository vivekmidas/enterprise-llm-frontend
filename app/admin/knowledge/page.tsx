'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { TagInput, getColor } from '@/lib/tag-utils';
import { toSentenceCase } from '@/lib/utils';
import {
  BookOpen,
  Plus,
  Trash2,
  Upload,
  RefreshCw,
  CheckCircle,
  Info,
  Search,
  SlidersHorizontal,
  Pencil,
  Settings,
  X,
  ChevronDown,
  FileText,
  LayoutGrid,
  Code2,
  FileJson,
  Copy,
  Check,
  Bug,
  Lock,
  Database,
  Eye,
  Layers,
  AlertCircle,
  ExternalLink,
  FileSpreadsheet,
  Sparkles,
  Columns,
  Table,
  Filter,
  ChevronRight,
  FileCode
} from 'lucide-react';
import { COLOR_PALETTE } from '@/lib/utils';

const EMBEDDING_MODELS = [
  { name: 'nomic-embed-text (Ollama, 768d)', value: 'nomic-embed-text', dimension: 768 },
  {
    name: 'text-embedding-3-small (OpenAI, 1536d)',
    value: 'text-embedding-3-small',
    dimension: 1536,
  },
  {
    name: 'text-embedding-3-large (OpenAI, 3072d)',
    value: 'text-embedding-3-large',
    dimension: 3072,
  },
  { name: 'bge-large-en-v1.5 (Ollama, 1024d)', value: 'bge-large-en-v1.5', dimension: 1024 },
];

/* BLOCK: Multi-tenant support for system-admin in KnowledgeBasesTab */
import { BACKEND_URL, getHeaders } from '@/lib/api';

// =============================================================================
// DOMAIN-AGNOSTIC DYNAMIC EXTRACTED JSON RENDERER
// Dynamically renders any domain schema fields from extracted_json directly
// =============================================================================
function renderDynamicExtractedJson(data: any) {
  if (!data || typeof data !== 'object') return null;

  const payload = data.extracted_fields || data;
  if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) return null;

  // Extract only target fields: executive_summary, bench, court, sections
  const executiveSummary =
    payload.executive_case_summary?.case_overview || payload.executive_summary || "NA";

  const court = payload.document?.court || payload.court || payload.court_name;
  const bench = payload.document?.judge || payload.bench || payload.judges || payload.judge;
  const sections = payload.document?.citation || payload.sections || payload.section || payload.acts_and_sections || payload.provisions;

  const hasBadges = Boolean(court || bench || sections);
  if (!executiveSummary && !hasBadges) return null;

  return (
    <div className="mt-2 text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
      {executiveSummary && (
        <div className="p-2.5 bg-blue-50/70 border border-blue-150 rounded-lg text-blue-950">
          <div className="flex items-center gap-1.5 font-bold text-[11px] text-blue-800 uppercase tracking-wider mb-1">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            Executive Summary
          </div>
          <p className="text-xs leading-relaxed text-slate-700 font-normal line-clamp-3">
            {executiveSummary}
          </p>
        </div>
      )}

      {hasBadges && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {court && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs">
              <span className="font-semibold text-blue-700">Court:</span>{' '}
              {Array.isArray(court) ? court.join(', ') : String(court)}
            </span>
          )}

          {bench && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-900 border border-purple-200 shadow-2xs">
              <span className="font-semibold text-purple-700">Bench:</span>{' '}
              {Array.isArray(bench)
                ? bench.map((b) => (typeof b === 'object' ? JSON.stringify(b) : String(b))).join(', ')
                : String(bench)}
            </span>
          )}

          {sections && (
            Array.isArray(sections) ? (
              sections.slice(0, 10).map((sec, idx) => (
                <span
                  key={`sec-${idx}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs"
                >
                  <span className="font-semibold text-emerald-700">Section:</span>{' '}
                  {typeof sec === 'object' ? JSON.stringify(sec) : String(sec)}
                </span>
              ))
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs">
                <span className="font-semibold text-emerald-700">Sections:</span>{' '}
                {String(sections)}
              </span>
            )
          )}
        </div>
      )}
    </div>
  );
}

export interface KnowledgeBasesTabProps {
  userRole?: string;
  customerId?: number | null;
  onSwitchToPlayground?: (kbId: string) => void;
}

export default function KnowledgeBasesTab({
  userRole,
  customerId,
  onSwitchToPlayground,
}: KnowledgeBasesTabProps = {}) {
  const isSystemAdmin = userRole === 'system_admin';
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState<string>(
    customerId ? String(customerId) : 'all',
  );
  const [customersMap, setCustomersMap] = useState<Record<number, string>>({});
  const [createKbTargetCustomer, setCreateKbTargetCustomer] = useState<string>('');

  // Top Main Tab Navigation
  const [activeMainTab, setActiveMainTab] = useState<'kb' | 'domains'>('kb');

  const [kbList, setKbList] = useState<any[]>([]);
  const [selectedKb, setSelectedKb] = useState<any>(null);
  const [docList, setDocList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [docsLoading, setDocsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docError, setDocError] = useState<string | null>(null);
  const [reprocessingDocIds, setReprocessingDocIds] = useState<Record<string, boolean>>({});

  // Document Status & Search Filtering State
  const [docStatusFilter, setDocStatusFilter] = useState<'all' | 'ready' | 'processing' | 'failed'>('all');
  const [docSearchQuery, setDocSearchQuery] = useState('');

  // Document Multi-Select & Sequential Deletion State
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [deletingDocIds, setDeletingDocIds] = useState<Record<string, boolean>>({});
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Snackbar Notification State (4-second auto-dismiss)
  const [snackbar, setSnackbar] = useState<{
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const snackbarTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const triggerSnackbar = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (snackbarTimeoutRef.current) {
      clearTimeout(snackbarTimeoutRef.current);
    }
    const id = Date.now();
    setSnackbar({ id, message, type });
    snackbarTimeoutRef.current = setTimeout(() => {
      setSnackbar((current) => (current?.id === id ? null : current));
    }, 4000);
  };

  // Status breakdown counts
  const statusCounts = useMemo(() => {
    const counts = { all: docList.length, ready: 0, processing: 0, failed: 0 };
    docList.forEach((doc) => {
      const s = (doc.status || '').toLowerCase();
      if (['ready', 'completed', 'active', 'indexed'].includes(s)) {
        counts.ready++;
      } else if (['processing', 'pending', 'chunking', 'embedding', 'queued'].includes(s)) {
        counts.processing++;
      } else if (['error', 'failed'].includes(s)) {
        counts.failed++;
      } else {
        counts.ready++;
      }
    });
    return counts;
  }, [docList]);

  // Filtered documents list based on status & search
  const filteredDocList = useMemo(() => {
    return docList.filter((doc) => {
      const s = (doc.status || '').toLowerCase();
      const isReady = ['ready', 'completed', 'active', 'indexed'].includes(s);
      const isProcessing = ['processing', 'pending', 'chunking', 'embedding', 'queued'].includes(s);
      const isFailed = ['error', 'failed'].includes(s);

      if (docStatusFilter === 'ready' && !isReady && (isProcessing || isFailed)) return false;
      if (docStatusFilter === 'processing' && !isProcessing) return false;
      if (docStatusFilter === 'failed' && !isFailed) return false;

      if (docSearchQuery.trim()) {
        const q = docSearchQuery.toLowerCase().trim();
        const name = (doc.name || '').toLowerCase();
        const type = (doc.metadata_json?.type || doc.metadata_json?.doc_type || '').toLowerCase();
        const desc = (doc.metadata_json?.description || '').toLowerCase();
        const tags = Array.isArray(doc.tags)
          ? doc.tags.map((t: any) => (typeof t === 'string' ? t : t.value || '').toLowerCase()).join(' ')
          : Array.isArray(doc.metadata_json?.tags)
            ? doc.metadata_json.tags.join(' ').toLowerCase()
            : '';
        if (!name.includes(q) && !type.includes(q) && !desc.includes(q) && !tags.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [docList, docStatusFilter, docSearchQuery]);

  // Selection helpers
  const toggleSelectDoc = (docId: string | number) => {
    const idStr = String(docId);
    setSelectedDocIds((prev) =>
      prev.includes(idStr) ? prev.filter((id) => id !== idStr) : [...prev, idStr]
    );
  };

  const allFilteredSelected =
    filteredDocList.length > 0 &&
    filteredDocList.every((d) => selectedDocIds.includes(String(d.id)));

  const someFilteredSelected =
    filteredDocList.some((d) => selectedDocIds.includes(String(d.id))) && !allFilteredSelected;

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      const filteredIds = new Set(filteredDocList.map((d) => String(d.id)));
      setSelectedDocIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const filteredIds = filteredDocList.map((d) => String(d.id));
      setSelectedDocIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleClearSelection = () => {
    setSelectedDocIds([]);
  };

  // KB Form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKbName, setNewKbName] = useState('');
  const [newKbPurpose, setNewKbPurpose] = useState('');
  const [newKbTags, setNewKbTags] = useState('');
  const [newKbDomainId, setNewKbDomainId] = useState('');
  const [newKbEnableDocling, setNewKbEnableDocling] = useState(true);
  const [newKbEnableOpenDataLoader, setNewKbEnableOpenDataLoader] = useState(true);
  const [newKbEnableDedup, setNewKbEnableDedup] = useState(false);
  const [newKbExtractionPrompt, setNewKbExtractionPrompt] = useState('');
  const [domainSchemas, setDomainSchemas] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);

  // 2-Frame Domain Tab State
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [domainSearchQuery, setDomainSearchQuery] = useState('');
  const [domainScopeFilter, setDomainScopeFilter] = useState<'ALL' | 'SYSTEM' | 'TENANT'>('ALL');

  useEffect(() => {
    api.getDomainSchemas().then((data) => {
      setDomainSchemas(data || []);
      if (data && data.length > 0 && !selectedDomainId) {
        setSelectedDomainId(data[0].id);
      }
    }).catch((err) => console.error('Failed to load domain schemas', err));
  }, []);

  const domainSchemasMap = useMemo(() => {
    const map: Record<string, any> = {};
    domainSchemas.forEach((d) => {
      map[d.id] = d;
    });
    return map;
  }, [domainSchemas]);

  // Doc Form state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [docDescription, setDocDescription] = useState('');
  const [docTags, setDocTags] = useState('');
  const [docType, setDocType] = useState('general');
  const [docParserStrategy, setDocParserStrategy] = useState<'dual' | 'docling_only' | 'opendataloader_only'>('dual');
  const [docEnableDedup, setDocEnableDedup] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Custom Doc Types state
  const [showDocTypesModal, setShowDocTypesModal] = useState(false);
  const [docTypes, setDocTypes] = useState<string[]>([]);
  const [newDocType, setNewDocType] = useState('');
  const [savingDocTypes, setSavingDocTypes] = useState(false);



  // Domain Schemas Modal state
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [editingDomainId, setEditingDomainId] = useState<string | null>(null);
  const [domainName, setDomainName] = useState('');
  const [domainKey, setDomainKey] = useState('');
  const [domainScope, setDomainScope] = useState<'SYSTEM' | 'TENANT'>('SYSTEM');
  const [domainDescription, setDomainDescription] = useState('');
  const [domainSystemPrompt, setDomainSystemPrompt] = useState(
    "You are an expert domain knowledge extractor.\nExtract structured field values accurately from the provided document content based on the target schema.\nIf you find additional relevant domain knowledge that is not covered by the target schema, output it under the 'extra_fields' key.\nReturn valid JSON only."
  );
  const [domainUserPrompt, setDomainUserPrompt] = useState(
    'Document Filename: {filename}\n\nTarget Schema Fields:\n{fields_summary}\n\nContent:\n{content}'
  );
  const [domainFields, setDomainFields] = useState<
    Array<{ key: string; label: string; description?: string; type?: string; weight: number; importance: string; required?: boolean }>
  >([
    { key: 'case_number', label: 'Case Number', description: 'Extract case reference number e.g. W.P. No.348 of 1998', weight: 2.0, importance: 'high', required: true },
    { key: 'parties', label: 'Parties Involved', description: 'Extract petitioners and respondents with name and type', weight: 2.0, importance: 'high', required: false },
    { key: 'rulings', label: 'Court Rulings', description: 'Extract ruling decisions, reasoning, and consequences', weight: 2.5, importance: 'critical', required: false },
  ]);
  const [savingDomain, setSavingDomain] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);

  const handleOpenCreateDomain = () => {
    setEditingDomainId(null);
    setDomainName('');
    setDomainKey('');
    setDomainScope(isSystemAdmin ? 'SYSTEM' : 'TENANT');
    setDomainDescription('');
    setDomainSystemPrompt(
      "You are an expert domain knowledge extractor.\nExtract structured field values accurately from the provided document content based on the target schema.\nIf you find additional relevant domain knowledge that is not covered by the target schema, output it under the 'extra_fields' key.\nReturn valid JSON only."
    );
    setDomainUserPrompt(
      'Document Filename: {filename}\n\nTarget Schema Fields:\n{fields_summary}\n\nContent:\n{content}'
    );
    setDomainFields([
      { key: 'policy_number', label: 'Policy Number', type: 'string', weight: 2.0, importance: 'high', required: true },
      { key: 'validity_expiry', label: 'Validity Expiry', type: 'date', weight: 1.5, importance: 'medium', required: false },
    ]);
    setDomainError(null);
    setShowDomainModal(true);
  };

  const handleOpenEditDomain = (domain: any) => {
    setEditingDomainId(domain.id);
    setDomainName(domain.name || '');
    setDomainKey(domain.domain_key || '');
    setDomainScope(domain.scope || 'SYSTEM');
    setDomainDescription(domain.description || '');
    setDomainSystemPrompt(
      domain.system_prompt ||
      "You are an expert domain knowledge extractor.\nExtract structured field values accurately from the provided document content based on the target schema.\nIf you find additional relevant domain knowledge that is not covered by the target schema, output it under the 'extra_fields' key.\nReturn valid JSON only."
    );
    setDomainUserPrompt(
      domain.user_prompt ||
      'Document Filename: {filename}\n\nTarget Schema Fields:\n{fields_summary}\n\nContent:\n{content}'
    );
    setDomainFields(domain.schema_json?.fields || []);
    setDomainError(null);
    setShowDomainModal(true);
  };

  const handleAddField = () => {
    setDomainFields((prev) => [
      ...prev,
      { key: '', label: '', type: 'string', weight: 1.0, importance: 'medium', required: false },
    ]);
  };

  const handleRemoveField = (idx: number) => {
    setDomainFields((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateField = (idx: number, key: string, val: any) => {
    setDomainFields((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, [key]: val } : f))
    );
  };

  const handleSaveDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainName.trim() || !domainKey.trim()) {
      setDomainError('Schema Name and Domain Key are required.');
      return;
    }
    setSavingDomain(true);
    setDomainError(null);
    try {
      const payload = {
        name: domainName.trim(),
        domain_key: domainKey.trim().toLowerCase(),
        scope: domainScope,
        description: domainDescription.trim(),
        system_prompt: domainSystemPrompt.trim(),
        user_prompt: domainUserPrompt.trim(),
        fields: domainFields,
      };

      if (editingDomainId) {
        await api.updateDomainSchema(editingDomainId, payload);
      } else {
        await api.createDomainSchema(payload);
      }

      const updatedList = await api.getDomainSchemas();
      setDomainSchemas(updatedList);
      setShowDomainModal(false);
    } catch (err: any) {
      console.error(err);
      setDomainError(err.message || 'Failed to save Domain Schema.');
    } finally {
      setSavingDomain(false);
    }
  };

  const handleDeleteDomainSchema = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Domain Schema?')) return;
    try {
      await api.deleteDomainSchema(id);
      const updatedList = await api.getDomainSchemas();
      setDomainSchemas(updatedList);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to delete Domain Schema. It may be linked to active Knowledge Bases.');
    }
  };

  // ── Unified 3-Way Extracted Data Inspector State ──────────────────────────
  const [ekpLoading, setEkpLoading] = useState(false);
  const [selectedEkpDoc, setSelectedEkpDoc] = useState<any>(null);
  const [showEkpInspectModal, setShowEkpInspectModal] = useState(false);
  const [ekpParagraphs, setEkpParagraphs] = useState<any[]>([]);
  const [ekpEntities, setEkpEntities] = useState<any[]>([]);
  const [ekpViewsData, setEkpViewsData] = useState<any>(null);
  const [activeTextParser, setActiveTextParser] = useState<'docling' | 'opendataloader'>('docling');
  const [textSubView, setTextSubView] = useState<'spans' | 'text'>('spans');
  const [textSearch, setTextSearch] = useState('');
  const [entitySearch, setEntitySearch] = useState('');
  const [copiedText, setCopiedText] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedEntitiesJson, setCopiedEntitiesJson] = useState(false);

  // Entity Edit state
  const [editingEntityId, setEditingEntityId] = useState<string | null>(null);
  const [editEntityForm, setEditEntityForm] = useState<{
    entity_type: string;
    entity_key: string;
    value: string;
    confidence: number;
    basis: string;
  }>({ entity_type: '', entity_key: '', value: '', confidence: 1.0, basis: 'FACT' });
  const [savingEntity, setSavingEntity] = useState(false);

  // Clean entity_key for card header (hide raw array indices like lawyers[1].advocate)
  const formatEntityKey = (entityKey?: string, entityType?: string) => {
    if (!entityKey) return entityType || 'Entity';
    const cleanPath = entityKey.replace(/\[\d+\]/g, '');
    const parts = cleanPath.split('.').filter(Boolean);
    if (parts.length === 0) return entityType || 'Entity';

    const formattedParts = parts.map((p) => {
      const w = p.replace(/_/g, ' ');
      return w.charAt(0).toUpperCase() + w.slice(1);
    });

    if (entityType && formattedParts[0].toLowerCase() === entityType.toLowerCase()) {
      formattedParts.shift();
    }

    return formattedParts.length > 0 ? formattedParts.join(' → ') : (entityType || 'Entity');
  };

  // Format complex domain fields (objects, arrays) into clean, human-readable strings instead of [object Object]
  const formatDomainFieldValue = (val: any, depth = 0): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);

    if (Array.isArray(val)) {
      if (val.length === 0) return '';
      return val
        .map((item) => {
          if (typeof item === 'object' && item !== null) {
            if (depth >= 2) return JSON.stringify(item);
            return formatDomainFieldValue(item, depth + 1);
          }
          return String(item);
        })
        .filter(Boolean)
        .join(', ');
    }

    if (typeof val === 'object') {
      const entries = Object.entries(val).filter(
        ([_, v]) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)
      );
      if (entries.length === 0) return '';

      return entries
        .map(([subKey, subVal]) => {
          const cleanKey = subKey.replace(/_/g, ' ');
          if (typeof subVal === 'object' && subVal !== null) {
            if (depth >= 2) return `${cleanKey}: ${JSON.stringify(subVal)}`;
            const formattedSub = formatDomainFieldValue(subVal, depth + 1);
            return formattedSub ? `${cleanKey}: ${formattedSub}` : '';
          }
          return `${cleanKey}: ${String(subVal)}`;
        })
        .filter(Boolean)
        .join(' • ');
    }

    return String(val);
  };

  // Structured JSON object from extracted_json or views without needing on-the-fly reconstruction
  const prettifiedEntitiesJson = useMemo(() => {
    const directExtracted =
      selectedEkpDoc?.extracted_json ||
      ekpViewsData?.extracted_json ||
      ekpViewsData?.views?.json ||
      selectedEkpDoc?.metadata_json?.extracted_json ||
      selectedEkpDoc?.metadata_json?.domain_info;

    if (directExtracted && typeof directExtracted === 'object' && Object.keys(directExtracted).length > 0) {
      return JSON.stringify(directExtracted, null, 2);
    }

    if (!ekpEntities || ekpEntities.length === 0) return '{}';
    const result: Record<string, any> = {};

    ekpEntities.forEach((ent) => {
      let parsedVal = ent.value;
      if (typeof parsedVal === 'string' && (parsedVal.trim().startsWith('{') || parsedVal.trim().startsWith('['))) {
        try {
          parsedVal = JSON.parse(parsedVal);
        } catch (_) { }
      }

      const keyPath = ent.entity_key || ent.entity_type || 'entity';
      const parts = keyPath.split('.').filter(Boolean);

      let current = result;
      for (let i = 0; i < parts.length; i++) {
        let rawPart = parts[i];
        let propName = rawPart.replace(/\[\d+\]/g, '').trim();
        let indexMatch = rawPart.match(/\[(\d+)\]/);
        let arrayIdx = indexMatch ? parseInt(indexMatch[1], 10) : null;

        const isLast = i === parts.length - 1;

        if (!propName && arrayIdx !== null) {
          continue;
        }

        if (isLast) {
          if (arrayIdx !== null) {
            if (!Array.isArray(current[propName])) {
              current[propName] = [];
            }
            current[propName][arrayIdx] = parsedVal;
          } else {
            current[propName || rawPart] = parsedVal;
          }
        } else {
          if (arrayIdx !== null) {
            if (!Array.isArray(current[propName])) {
              current[propName] = [];
            }
            if (!current[propName][arrayIdx]) {
              current[propName][arrayIdx] = {};
            }
            current = current[propName][arrayIdx];
          } else {
            if (!current[propName] || typeof current[propName] !== 'object') {
              current[propName] = {};
            }
            current = current[propName];
          }
        }
      }
    });

    return JSON.stringify(result, null, 2);
  }, [ekpEntities, selectedEkpDoc, ekpViewsData]);

  // Computed parser data for Docling
  const doclingData = useMemo(() => {
    const rawText =
      ekpViewsData?.views?.extracted?.docling_raw_text ||
      (ekpViewsData?.views?.extracted?.parser_name?.includes('docling') ? ekpViewsData?.views?.extracted?.raw_text : '') ||
      selectedEkpDoc?.metadata_json?.views?.extracted?.docling_raw_text ||
      '';

    let spans: any[] =
      ekpViewsData?.views?.extracted?.docling_spans ||
      selectedEkpDoc?.metadata_json?.views?.extracted?.docling_spans ||
      [];

    if (!spans || spans.length === 0) {
      const allExtractedSpans = ekpViewsData?.views?.extracted?.spans || selectedEkpDoc?.metadata_json?.views?.extracted?.spans;
      if (allExtractedSpans && Array.isArray(allExtractedSpans) && allExtractedSpans.length > 0) {
        spans = allExtractedSpans.filter((s: any) => !s.source_parser || s.source_parser.includes('docling') || s.source_parser === 'unknown');
      } else if (ekpParagraphs && ekpParagraphs.length > 0) {
        spans = ekpParagraphs.map((p) => ({
          span_id: p.span_id || p.id,
          page_number: p.page_number || 1,
          paragraph_index: p.paragraph_number || 0,
          text: p.text_content || '',
          block_type: 'paragraph',
          source_parser: 'docling',
          bbox: p.bounding_box || null,
        }));
      }
    }

    const tables = ekpViewsData?.views?.extracted?.tables || selectedEkpDoc?.metadata_json?.views?.extracted?.tables || [];
    const report = ekpViewsData?.comparison_report || selectedEkpDoc?.metadata_json?.comparison_report;

    return {
      rawText: rawText || spans.map((s: any) => s.text || s.text_content || '').join('\n\n'),
      spans,
      tables,
      report,
      isAvailable: spans.length > 0 || Boolean(rawText),
    };
  }, [ekpViewsData, selectedEkpDoc, ekpParagraphs]);

  // Computed parser data for OpenDataLoaderPDFParser
  const openDataLoaderData = useMemo(() => {
    const rawText =
      ekpViewsData?.views?.extracted?.opendataloader_raw_text ||
      (ekpViewsData?.views?.extracted?.parser_name?.includes('opendataloader') ? ekpViewsData?.views?.extracted?.raw_text : '') ||
      selectedEkpDoc?.metadata_json?.views?.extracted?.opendataloader_raw_text ||
      '';

    let spans: any[] =
      ekpViewsData?.views?.extracted?.opendataloader_spans ||
      selectedEkpDoc?.metadata_json?.views?.extracted?.opendataloader_spans ||
      [];

    if (!spans || spans.length === 0) {
      const allExtractedSpans = ekpViewsData?.views?.extracted?.spans || selectedEkpDoc?.metadata_json?.views?.extracted?.spans;
      if (allExtractedSpans && Array.isArray(allExtractedSpans) && allExtractedSpans.length > 0) {
        spans = allExtractedSpans.filter((s: any) => s.source_parser && (s.source_parser.includes('opendataloader') || s.source_parser.includes('pymupdf') || s.source_parser.includes('recovered')));
      }
      if (spans.length === 0 && ekpParagraphs && ekpParagraphs.length > 0 && (ekpViewsData?.comparison_report?.secondary_parser?.includes('opendataloader') || selectedEkpDoc?.metadata_json?.comparison_report?.secondary_parser?.includes('opendataloader'))) {
        spans = ekpParagraphs.map((p) => ({
          span_id: p.span_id || p.id,
          page_number: p.page_number || 1,
          paragraph_index: p.paragraph_number || 0,
          text: p.text_content || '',
          block_type: 'paragraph',
          source_parser: 'opendataloader_pdf',
          bbox: p.bounding_box || null,
        }));
      }
    }

    const report = ekpViewsData?.comparison_report || selectedEkpDoc?.metadata_json?.comparison_report;

    return {
      rawText: rawText || (spans.length > 0 ? spans.map((s: any) => s.text || s.text_content || '').join('\n\n') : (report?.secondary_raw_sample || '')),
      spans,
      report,
      isAvailable: spans.length > 0 || Boolean(rawText) || Boolean(report?.secondary_parser),
    };
  }, [ekpViewsData, selectedEkpDoc, ekpParagraphs]);

  // Computed data for Extracted JSON
  const jsonExtractedData = useMemo(() => {
    const rawExtracted =
      selectedEkpDoc?.extracted_json ||
      ekpViewsData?.extracted_json ||
      ekpViewsData?.views?.json ||
      selectedEkpDoc?.metadata_json?.extracted_json ||
      selectedEkpDoc?.metadata_json?.domain_info;

    const domainInfo = (rawExtracted && typeof rawExtracted === 'object') ? rawExtracted : selectedEkpDoc?.metadata_json?.domain_info;
    const jsonTree = ekpViewsData?.views?.json || selectedEkpDoc?.metadata_json?.views?.json;
    const hasEntities = ekpEntities && ekpEntities.length > 0;
    const hasExtractedJson = Boolean(rawExtracted && typeof rawExtracted === 'object' && Object.keys(rawExtracted).length > 0);
    const isExtracted = hasExtractedJson || hasEntities;

    return {
      isExtracted,
      domainInfo,
      jsonTree,
      entities: ekpEntities || [],
      extractedFields: domainInfo?.extracted_fields || domainInfo || {},
      extraFields: domainInfo?.extra_fields || {},
      debugInfo: domainInfo?.debug_info || {},
      error: domainInfo?.error || null,
    };
  }, [selectedEkpDoc, ekpViewsData, ekpEntities]);

  const fetchEkpDocDetails = async (doc: any) => {
    setSelectedEkpDoc(doc);
    setEkpLoading(true);
    setShowEkpInspectModal(true);
    setActiveTextParser('docling');
    setTextSubView('spans');
    setTextSearch('');
    setEntitySearch('');
    try {
      const kbId = doc.knowledge_base_id || selectedKb?.id;
      const [pRes, eRes, vRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/v3/knowledge/documents/${doc.id}/paragraphs`, { headers: getHeaders() }),
        fetch(`${BACKEND_URL}/api/v3/knowledge/documents/${doc.id}/entities`, { headers: getHeaders() }),
        kbId ? fetch(`${BACKEND_URL}/api/v3/knowledge/bases/${kbId}/documents/${doc.id}/views`, { headers: getHeaders() }) : Promise.resolve(null),
      ]);
      if (pRes.ok) {
        const pData = await pRes.json();
        setEkpParagraphs(pData || []);
      } else {
        setEkpParagraphs([]);
      }

      if (vRes && vRes.ok) {
        const vData = await vRes.json();
        setEkpViewsData(vData);
      } else {
        setEkpViewsData(doc.metadata_json?.views ? { views: doc.metadata_json.views, comparison_report: doc.metadata_json.comparison_report } : null);
      }

      let entities: any[] = [];
      if (eRes.ok) {
        entities = await eRes.json();
      }

      // Fallback: If EKP backend entities array is empty, construct entities from domain_info metadata
      if ((!entities || entities.length === 0) && doc.metadata_json?.domain_info) {
        const domainInfo = doc.metadata_json.domain_info;
        const domainTag = domainInfo.domain_key || domainInfo.domain_name || 'domain';
        const allFields = { ...(domainInfo.extracted_fields || {}), ...(domainInfo.extra_fields || {}) };
        const synthesized: any[] = [];
        let counter = 0;

        const flattenEntry = (prefix: string, val: any) => {
          if (val === null || val === undefined) return;

          if (Array.isArray(val)) {
            val.forEach((item, idx) => {
              if (typeof item === 'object' && item !== null) {
                if (item.name && item.type) {
                  synthesized.push({
                    id: `ent_${counter++}`,
                    entity_type: domainTag,
                    entity_key: `${prefix}.${item.type}`,
                    value: item.name,
                    confidence: 1.0,
                    basis: 'FACT',
                  });
                } else {
                  Object.entries(item).forEach(([subK, subV]) => {
                    flattenEntry(`${prefix}[${idx}].${subK}`, subV);
                  });
                }
              } else {
                synthesized.push({
                  id: `ent_${counter++}`,
                  entity_type: domainTag,
                  entity_key: `${prefix}[${idx}]`,
                  value: String(item),
                  confidence: 1.0,
                  basis: 'FACT',
                });
              }
            });
          } else if (typeof val === 'object' && val !== null) {
            Object.entries(val).forEach(([subK, subV]) => {
              flattenEntry(prefix ? `${prefix}.${subK}` : subK, subV);
            });
          } else {
            synthesized.push({
              id: `ent_${counter++}`,
              entity_type: domainTag,
              entity_key: prefix,
              value: String(val),
              confidence: 1.0,
              basis: 'FACT',
            });
          }
        };

        Object.entries(allFields).forEach(([k, v]) => {
          flattenEntry(k, v);
        });

        setEkpEntities(synthesized);
      } else {
        setEkpEntities(entities || []);
      }
    } catch (err) {
      console.error('Failed to load EKP details:', err);
      setEkpParagraphs([]);
      setEkpEntities([]);
    } finally {
      setEkpLoading(false);
    }
  };

  const startEditEntity = (ent: any) => {
    setEditingEntityId(ent.id);
    setEditEntityForm({
      entity_type: ent.entity_type || '',
      entity_key: ent.entity_key || '',
      value: typeof ent.value === 'object' ? JSON.stringify(ent.value) : String(ent.value || ''),
      confidence: ent.confidence ?? 1.0,
      basis: ent.basis || 'FACT',
    });
  };

  const handleSaveEntity = async (entityId: string) => {
    setSavingEntity(true);
    try {
      let parsedValue: any = editEntityForm.value;
      try {
        if (editEntityForm.value.startsWith('{') || editEntityForm.value.startsWith('[')) {
          parsedValue = JSON.parse(editEntityForm.value);
        }
      } catch (_) { }

      const res = await fetch(`${BACKEND_URL}/api/v3/knowledge/entities/${entityId}`, {
        method: 'PUT',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_type: editEntityForm.entity_type,
          entity_key: editEntityForm.entity_key,
          value: parsedValue,
          confidence: editEntityForm.confidence,
          basis: editEntityForm.basis,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setEkpEntities((prev) => prev.map((item) => (item.id === entityId ? updated : item)));
        setEditingEntityId(null);
      }
    } catch (err) {
      console.error('Failed to update entity:', err);
    } finally {
      setSavingEntity(false);
    }
  };

  const fetchDocTypes = async () => {
    try {
      const targetCustId = isSystemAdmin && selectedCustomerFilter !== 'all' ? selectedCustomerFilter : undefined;
      const url = new URL(`${BACKEND_URL}/api/knowledge/document-types`);
      if (targetCustId) {
        url.searchParams.append('customer_id', targetCustId);
      }
      const res = await fetch(url.toString(), { headers: getHeaders() });
      if (res.ok) {
        const types = await res.json();
        setDocTypes(types || []);
        if (types && types.length > 0) {
          const lowercaseTypes = types.map((t: string) => t.toLowerCase());
          if (!lowercaseTypes.includes(docType.toLowerCase())) {
            setDocType(types[0].toLowerCase());
          }
        }
      }
    } catch (err) {
      console.error('Failed to load document types', err);
    }
  };

  const handleReprocessDocument = async (docId: string | number) => {
    if (!selectedKb) return;
    setReprocessingDocIds((prev) => ({ ...prev, [docId]: true }));
    try {
      await api.reprocessDocument(String(selectedKb.id), String(docId));
      setDocList((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, status: 'processing' } : d))
      );
    } catch (err: any) {
      console.error('Failed to reprocess document', err);
      alert(err.message || 'Failed to queue document for reprocessing.');
    } finally {
      setReprocessingDocIds((prev) => ({ ...prev, [docId]: false }));
    }
  };

  const handleRefreshAllStatus = async () => {
    if (selectedKb) {
      await fetchDocs(selectedKb.id);
    }
    await fetchKBs();
  };

  const handleSaveDocTypes = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDocTypes(true);
    try {
      const targetCustId = isSystemAdmin && selectedCustomerFilter !== 'all' ? selectedCustomerFilter : undefined;
      const url = new URL(`${BACKEND_URL}/api/knowledge/document-types`);
      if (targetCustId) {
        url.searchParams.append('customer_id', targetCustId);
      }
      const res = await fetch(url.toString(), {
        method: 'PUT',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(docTypes),
      });
      if (res.ok) {
        const updated = await res.json();
        setDocTypes(updated || []);
        setShowDocTypesModal(false);
      } else {
        alert('Failed to save document types');
      }
    } catch (err) {
      console.error('Failed to save document types', err);
      alert('Failed to save document types');
    } finally {
      setSavingDocTypes(false);
    }
  };

  // Auto-refresh and status checking states
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [fetchingDocIds, setFetchingDocIds] = useState<Record<number, boolean>>({});
  const [updatingDocTypeIds, setUpdatingDocTypeIds] = useState<Record<number, boolean>>({});

  // KB creation settings
  const [newKbChunkSize, setNewKbChunkSize] = useState<number>(1000);
  const [newKbChunkOverlap, setNewKbChunkOverlap] = useState<number>(200);
  const [newKbLlmProfileId, setNewKbLlmProfileId] = useState<string>('');
  const [llmProfiles, setLlmProfiles] = useState<any[]>([]);

  // Multi-Doc Upload Queue
  interface UploadItem {
    id: string;
    file: File;
    status: 'pending' | 'uploading' | 'completed' | 'failed';
    progress: number;
    error?: string;
  }
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);

  // Users map for resolving created_by IDs
  const [usersMap, setUsersMap] = useState<Record<number, string>>({});

  // KB Edit State
  const [showEditKbModal, setShowEditKbModal] = useState(false);
  const [editKbName, setEditKbName] = useState('');
  const [editKbDesc, setEditKbDesc] = useState('');
  const [editKbPurpose, setEditKbPurpose] = useState('');
  const [editKbTags, setEditKbTags] = useState<string[]>([]);
  const [editKbEmbeddingModel, setEditKbEmbeddingModel] = useState('nomic-embed-text');
  const [editKbVectorDimension, setEditKbVectorDimension] = useState<number>(768);
  const [editKbChunkSize, setEditKbChunkSize] = useState<number>(1000);
  const [editKbChunkOverlap, setEditKbChunkOverlap] = useState<number>(200);
  const [editKbLlmProfileId, setEditKbLlmProfileId] = useState<string>('');
  const [editKbEnableDocling, setEditKbEnableDocling] = useState(true);
  const [editKbEnableOpenDataLoader, setEditKbEnableOpenDataLoader] = useState(true);
  const [editKbEnableDedup, setEditKbEnableDedup] = useState(false);
  const [editKbExtractionPrompt, setEditKbExtractionPrompt] = useState('');
  const [savingKb, setSavingKb] = useState(false);

  // Doc Edit State
  const [showEditDocModal, setShowEditDocModal] = useState(false);
  const [editDoc, setEditDoc] = useState<any>(null);
  const [editDocName, setEditDocName] = useState('');
  const [editDocDesc, setEditDocDesc] = useState('');
  const [editDocTags, setEditDocTags] = useState<string[]>([]);
  const [editDocType, setEditDocType] = useState('');
  const [savingDoc, setSavingDoc] = useState(false);

  const fetchKBs = async (targetCustId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const custToFetch = targetCustId !== undefined ? targetCustId : selectedCustomerFilter;
      const data = await api.getKnowledgeBases(custToFetch);
      setKbList(data || []);
      if (data && data.length > 0) {
        setSelectedKb((prev: any) => {
          if (prev && data.some((kb: any) => kb.id === prev.id)) {
            return prev;
          }
          return data[0];
        });
      } else {
        setSelectedKb(null);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to load Knowledge Bases.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocs = async (kbId: number) => {
    setDocsLoading(true);
    setDocError(null);
    setSelectedDocIds([]);
    try {
      const data = await api.getKnowledgeBaseDocuments(kbId);
      setDocList(data || []);
    } catch (err: any) {
      console.error(err);
      setDocError('Failed to load documents.');
    } finally {
      setDocsLoading(false);
    }
  };

  const refreshDocStatus = async (docId: number | string) => {
    if (!selectedKb) return;
    setFetchingDocIds((prev) => ({ ...prev, [docId]: true }));
    try {
      const updatedDoc = await api.getDocumentStatus(String(selectedKb.id), String(docId));
      setDocList((prev) => prev.map((d) => (d.id === docId ? updatedDoc : d)));
    } catch (err) {
      console.error('Failed to refresh document status', err);
    } finally {
      setFetchingDocIds((prev) => ({ ...prev, [docId]: false }));
    }
  };

  const fetchLlmProfiles = async (targetCustId?: string) => {
    try {
      const custToFetch = targetCustId !== undefined ? targetCustId : selectedCustomerFilter;
      const data = await api.getLlmProfiles(custToFetch !== 'all' ? custToFetch : undefined);
      setLlmProfiles(data || []);
    } catch (err) {
      console.error('Failed to load LLM profiles', err);
    }
  };

  const targetCustomerProfiles = useMemo(() => {
    if (!isSystemAdmin) return llmProfiles;
    const targetCust = createKbTargetCustomer || (selectedCustomerFilter !== 'all' ? selectedCustomerFilter : null);
    if (targetCust) {
      return llmProfiles.filter((p) => String(p.customer_id) === String(targetCust));
    }
    return llmProfiles;
  }, [llmProfiles, isSystemAdmin, createKbTargetCustomer, selectedCustomerFilter]);

  const llmProfilesMap = useMemo(() => {
    const map: Record<string, any> = {};
    llmProfiles.forEach((p) => {
      map[String(p.id)] = p;
    });
    return map;
  }, [llmProfiles]);

  useEffect(() => {
    if (isSystemAdmin) {
      api.getCustomers()
        .then((list: any[]) => {
          setCustomers(list || []);
          const map: Record<number, string> = {};
          (list || []).forEach((c: any) => {
            map[c.id] = c.name || c.domain || `Tenant #${c.id}`;
          });
          setCustomersMap(map);
        })
        .catch((err) => console.error('Failed to fetch customers list', err));
    }
    fetchKBs(selectedCustomerFilter);
    fetchLlmProfiles(selectedCustomerFilter);
    fetchDocTypes();
    api.getUsers()
      .then((users: any[]) => {
        const map: Record<number, string> = {};
        (users || []).forEach((u: any) => {
          map[u.id] = u.name || u.username || u.email || `User #${u.id}`;
        });
        setUsersMap(map);
      })
      .catch(() => { });
  }, [userRole]);

  useEffect(() => {
    fetchKBs(selectedCustomerFilter);
    fetchLlmProfiles(selectedCustomerFilter);
    fetchDocTypes();
  }, [selectedCustomerFilter]);

  useEffect(() => {
    if (selectedKb) {
      fetchDocs(selectedKb.id);
    } else {
      setDocList([]);
    }
  }, [selectedKb]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const hasProcessingDocs = docList.some((d) =>
      ['processing', 'pending', 'chunking', 'embedding', 'queued'].includes(d.status?.toLowerCase())
    );
    if ((autoRefresh || hasProcessingDocs) && selectedKb) {
      interval = setInterval(() => {
        fetchDocs(selectedKb.id);
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, selectedKb, docList]);

  const getProfileEmbeddingSettings = (profile: any) => {
    if (!profile) {
      return {
        provider: 'ollama',
        model: 'nomic-embed-text',
        dimension: 768,
        chunk_size: 1000,
        chunk_overlap: 200,
      };
    }
    const s = profile.settings || {};
    const emb = s.embedding || {};

    const provider =
      emb.provider ||
      s.embedding_provider ||
      s.provider ||
      profile.provider ||
      'ollama';

    const model =
      emb.model ||
      s.embedding_model ||
      s.model_name ||
      profile.model ||
      profile.embedding_model ||
      'nomic-embed-text';

    const dimension =
      emb.dimension ||
      s.vector_dimension ||
      s.dimension ||
      profile.dimension ||
      profile.vector_dimension ||
      768;

    const chunkSize =
      s.chunk_size ||
      profile.chunk_size ||
      1000;

    const chunkOverlap =
      s.chunk_overlap ||
      profile.chunk_overlap ||
      200;

    return {
      provider,
      model,
      dimension: Number(dimension),
      chunk_size: Number(chunkSize),
      chunk_overlap: Number(chunkOverlap),
    };
  };

  const activeCreateProfile = useMemo(() => {
    if (newKbLlmProfileId) {
      return targetCustomerProfiles.find((p) => String(p.id) === String(newKbLlmProfileId));
    }
    return targetCustomerProfiles.find((p) => p.is_default) || targetCustomerProfiles[0] || null;
  }, [newKbLlmProfileId, targetCustomerProfiles]);

  const activeCreateEmbeddingSettings = useMemo(() => {
    return getProfileEmbeddingSettings(activeCreateProfile);
  }, [activeCreateProfile]);

  const activeEditProfile = useMemo(() => {
    if (editKbLlmProfileId) {
      return targetCustomerProfiles.find((p) => String(p.id) === String(editKbLlmProfileId));
    }
    return targetCustomerProfiles.find((p) => p.is_default) || targetCustomerProfiles[0] || null;
  }, [editKbLlmProfileId, targetCustomerProfiles]);

  const activeEditEmbeddingSettings = useMemo(() => {
    if (activeEditProfile) {
      return getProfileEmbeddingSettings(activeEditProfile);
    }
    return {
      provider: selectedKb?.settings?.embedding_provider || 'ollama',
      model: editKbEmbeddingModel || selectedKb?.settings?.embedding_model || 'nomic-embed-text',
      dimension: editKbVectorDimension || selectedKb?.settings?.vector_dimension || 768,
      chunk_size: editKbChunkSize || selectedKb?.settings?.chunk_size || 1000,
      chunk_overlap: editKbChunkOverlap || selectedKb?.settings?.chunk_overlap || 200,
    };
  }, [activeEditProfile, selectedKb, editKbEmbeddingModel, editKbVectorDimension, editKbChunkSize, editKbChunkOverlap]);

  // =====================================================================
  // BLOCK COMMENT: KB PROFILE & VECTOR DIMENSION CHANGE GUARDRAILS
  // Prevents saving profile changes that alter vector dimension for KBs with indexed docs.
  // Flags warnings when profile changes require document re-processing.
  // =====================================================================
  const isDimensionMismatch = useMemo(() => {
    if (!selectedKb || docList.length === 0) return false;
    const existingDim = selectedKb.settings?.vector_dimension;
    if (!existingDim) return false;
    return Number(activeEditEmbeddingSettings.dimension) !== Number(existingDim);
  }, [selectedKb, docList.length, activeEditEmbeddingSettings.dimension]);

  const isProfileChanged = useMemo(() => {
    if (!selectedKb || docList.length === 0 || isDimensionMismatch) return false;
    const originalProfId = selectedKb.settings?.llm_profile_id || '';
    const currentProfId = editKbLlmProfileId || '';
    return originalProfId !== currentProfId;
  }, [selectedKb, docList.length, isDimensionMismatch, editKbLlmProfileId]);

  const handleCreateKB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKbName.trim()) return;

    setCreating(true);
    setError(null);
    try {
      const formattedName = toSentenceCase(newKbName.trim());
      const tagsList = newKbTags
        .split(',')
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean);

      const targetProf = newKbLlmProfileId
        ? targetCustomerProfiles.find((p) => String(p.id) === String(newKbLlmProfileId))
        : targetCustomerProfiles.find((p) => p.is_default) || targetCustomerProfiles[0];
      const resolved = getProfileEmbeddingSettings(targetProf);

      const settingsPayload: any = {
        tags: tagsList,
        chunk_size: Number(resolved.chunk_size),
        chunk_overlap: Number(resolved.chunk_overlap),
        llm_profile_id: newKbLlmProfileId || undefined,
        embedding_model: resolved.model,
        embedding_provider: resolved.provider,
        vector_dimension: Number(resolved.dimension),
        enable_docling: newKbEnableDocling,
        enable_opendataloader: newKbEnableOpenDataLoader,
        enable_dedup: newKbEnableDedup,
        parser_strategy: (newKbEnableDocling && newKbEnableOpenDataLoader) ? 'dual' : (newKbEnableDocling ? 'docling_only' : 'opendataloader_only'),
        extraction_prompt: newKbExtractionPrompt.trim() || undefined,
      };

      if (isSystemAdmin && createKbTargetCustomer) {
        settingsPayload.customer_id = Number(createKbTargetCustomer);
      }

      const newKb = await api.createKnowledgeBase({
        name: formattedName,
        description: newKbPurpose,
        domain_id: newKbDomainId || undefined,
        settings: settingsPayload,
      });
      setKbList((prev) => [...prev, newKb]);
      setSelectedKb(newKb);
      setShowCreateModal(false);
      setNewKbName('');
      setNewKbPurpose('');
      setNewKbTags('');
      setNewKbDomainId('');
      setNewKbLlmProfileId('');
      setNewKbChunkSize(1000);
      setNewKbChunkOverlap(200);
      setNewKbEnableDocling(true);
      setNewKbEnableOpenDataLoader(true);
      setNewKbEnableDedup(false);
      setNewKbExtractionPrompt('');
    } catch (err: any) {
      console.error(err);
      setError('Failed to create Knowledge Base.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKB = async (id: number) => {
    if (
      !confirm(
        'Are you sure you want to delete this Knowledge Base? This will permanently drop its physical Qdrant vector collection and clean up all metadata, database chunks, and documents.',
      )
    ) {
      return;
    }

    setError(null);
    try {
      await api.deleteKnowledgeBase(id);
      const updatedList = kbList.filter((kb) => kb.id !== id);
      setKbList(updatedList);
      if (selectedKb?.id === id) {
        setSelectedKb(updatedList.length > 0 ? updatedList[0] : null);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to delete Knowledge Base.');
    }
  };

  const handleAddFilesToQueue = (files: FileList | File[] | null) => {
    if (!files) return;
    const allowed = ['.txt', '.pdf', '.doc', '.docx', '.md'];
    const newItems: UploadItem[] = [];
    Array.from(files).forEach((f) => {
      if (f.size > 50 * 1024 * 1024) {
        alert(`File ${f.name} exceeds 50MB limit.`);
        return;
      }
      const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
      if (!allowed.includes(ext)) {
        alert(`File ${f.name} has invalid extension.`);
        return;
      }
      newItems.push({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file: f,
        status: 'pending',
        progress: 0,
      });
    });
    setUploadQueue((prev) => [...prev, ...newItems]);
  };

  const handleRemoveFileFromQueue = (id: string) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUploadAllFiles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKb || uploadQueue.length === 0) return;

    setUploading(true);
    setDocError(null);
    let successCount = 0;

    for (let i = 0; i < uploadQueue.length; i++) {
      const item = uploadQueue[i];
      if (item.status === 'completed') {
        successCount++;
        continue;
      }

      setUploadQueue((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, status: 'uploading', progress: 40 } : it)),
      );
      setUploadProgress(
        `Uploading document ${i + 1} of ${uploadQueue.length}: ${item.file.name}...`,
      );

      try {
        await api.uploadDocument(selectedKb.id, item.file, {
          description: docDescription,
          tags: docTags,
          doc_type: docType,
          parser_strategy: docParserStrategy,
          enable_dedup: docEnableDedup,
        });
        setUploadQueue((prev) =>
          prev.map((it) =>
            it.id === item.id ? { ...it, status: 'completed', progress: 100 } : it,
          ),
        );
        successCount++;
        fetchDocs(selectedKb.id);
      } catch (err: any) {
        console.error(`Failed to upload ${item.file.name}`, err);
        setUploadQueue((prev) =>
          prev.map((it) =>
            it.id === item.id ? { ...it, status: 'failed', error: err.message } : it,
          ),
        );
      }
    }

    setUploading(false);
    setUploadProgress(null);

    if (successCount === uploadQueue.length) {
      setUploadQueue([]);
      setShowUploadModal(false);
    }
  };

  const handleDeleteDoc = async (docId: number | string, docName?: string) => {
    if (!selectedKb) return;
    const displayName = docName || `document #${docId}`;
    if (
      !confirm(
        `Are you sure you want to delete "${displayName}"? This will remove all chunks and Qdrant points.`,
      )
    ) {
      return;
    }

    const idStr = String(docId);
    setDeletingDocIds((prev) => ({ ...prev, [idStr]: true }));
    setDocError(null);
    try {
      await api.deleteDocument(String(selectedKb.id), idStr);
      setDocList((prev) => prev.filter((doc) => String(doc.id) !== idStr));
      setSelectedDocIds((prev) => prev.filter((id) => id !== idStr));
      triggerSnackbar(`Document "${displayName}" deleted successfully.`, 'success');
    } catch (err: any) {
      console.error(err);
      triggerSnackbar(err.message || `Failed to delete "${displayName}".`, 'error');
    } finally {
      setDeletingDocIds((prev) => {
        const next = { ...prev };
        delete next[idStr];
        return next;
      });
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedKb || selectedDocIds.length === 0) return;
    const totalCount = selectedDocIds.length;
    if (
      !confirm(
        `Are you sure you want to delete ${totalCount} selected document${totalCount > 1 ? 's' : ''}? This will remove all chunks and Qdrant points.`,
      )
    ) {
      return;
    }

    setIsBulkDeleting(true);
    let successCount = 0;
    let failCount = 0;
    const idsToDelete = [...selectedDocIds];

    for (const docId of idsToDelete) {
      setDeletingDocIds((prev) => ({ ...prev, [docId]: true }));
      try {
        await api.deleteDocument(String(selectedKb.id), String(docId));
        setDocList((prev) => prev.filter((doc) => String(doc.id) !== String(docId)));
        setSelectedDocIds((prev) => prev.filter((id) => id !== String(docId)));
        successCount++;
      } catch (err: any) {
        console.error(`Failed to delete document ${docId}`, err);
        failCount++;
      } finally {
        setDeletingDocIds((prev) => {
          const next = { ...prev };
          delete next[docId];
          return next;
        });
      }
    }

    setIsBulkDeleting(false);

    if (successCount > 0 && failCount === 0) {
      triggerSnackbar(`Successfully deleted ${successCount} document${successCount > 1 ? 's' : ''}.`, 'success');
    } else if (successCount > 0 && failCount > 0) {
      triggerSnackbar(`Deleted ${successCount} document${successCount > 1 ? 's' : ''}. Failed to delete ${failCount} document${failCount > 1 ? 's' : ''}.`, 'error');
    } else if (failCount > 0) {
      triggerSnackbar(`Failed to delete ${failCount} document${failCount > 1 ? 's' : ''}.`, 'error');
    }
  };

  const handleUploadNewVersion = (doc: any) => {
    setSelectedKb(kbList.find((kb) => kb.id === doc.knowledge_base_id));
    setDocDescription(doc.metadata_json?.description || '');
    setDocTags(Array.isArray(doc.metadata_json?.tags) ? doc.metadata_json.tags.join(', ') : '');
    setDocType(doc.metadata_json?.type || 'general');
    setUploadQueue([]);
    setShowUploadModal(true);
  };

  // ── KB Edit Handlers ─────────────────────────────────────────────────────

  const openEditKbModal = (kb: any) => {
    setEditKbName(toSentenceCase(kb.name));
    setEditKbDesc(kb.description || '');
    setEditKbPurpose(kb.settings?.purpose || '');
    setEditKbTags(Array.isArray(kb.settings?.tags) ? kb.settings.tags.map((t: string) => (t || '').trim().toUpperCase()).filter(Boolean) : []);
    setEditKbEmbeddingModel(kb.settings?.embedding_model || 'nomic-embed-text');
    setEditKbVectorDimension(kb.settings?.vector_dimension || 768);
    setEditKbChunkSize(kb.settings?.chunk_size || 1000);
    setEditKbChunkOverlap(kb.settings?.chunk_overlap || 200);
    setEditKbLlmProfileId(kb.settings?.llm_profile_id ? String(kb.settings.llm_profile_id) : '');
    setEditKbEnableDocling(
      kb.settings?.enable_docling !== undefined
        ? Boolean(kb.settings.enable_docling)
        : kb.settings?.parser_strategy !== 'opendataloader_only'
    );
    setEditKbEnableOpenDataLoader(
      kb.settings?.enable_opendataloader !== undefined
        ? Boolean(kb.settings.enable_opendataloader)
        : kb.settings?.parser_strategy !== 'docling_only'
    );
    setEditKbEnableDedup(Boolean(kb.settings?.enable_dedup));
    setEditKbExtractionPrompt(kb.settings?.extraction_prompt || kb.settings?.system_prompt || '');
    setShowEditKbModal(true);
  };

  const handleSaveKb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKb || !editKbName.trim()) return;

    setSavingKb(true);
    setError(null);

    const targetProf = editKbLlmProfileId
      ? targetCustomerProfiles.find((p) => String(p.id) === String(editKbLlmProfileId))
      : targetCustomerProfiles.find((p) => p.is_default) || targetCustomerProfiles[0];
    const resolved = getProfileEmbeddingSettings(targetProf);
    const upperTags = editKbTags.map((t) => (t || '').trim().toUpperCase()).filter(Boolean);

    try {
      const updatedKb = await api.updateKnowledgeBase(selectedKb.id, {
        name: toSentenceCase(editKbName.trim()),
        description: editKbDesc || undefined,
        settings: {
          ...(selectedKb.settings || {}),
          purpose: editKbPurpose || undefined,
          tags: upperTags.length > 0 ? upperTags : undefined,
          chunk_size: Number(resolved.chunk_size),
          chunk_overlap: Number(resolved.chunk_overlap),
          llm_profile_id: editKbLlmProfileId || undefined,
          embedding_model: resolved.model,
          embedding_provider: resolved.provider,
          vector_dimension: Number(resolved.dimension),
          enable_docling: editKbEnableDocling,
          enable_opendataloader: editKbEnableOpenDataLoader,
          enable_dedup: editKbEnableDedup,
          parser_strategy: (editKbEnableDocling && editKbEnableOpenDataLoader) ? 'dual' : (editKbEnableDocling ? 'docling_only' : 'opendataloader_only'),
          extraction_prompt: editKbExtractionPrompt.trim() || undefined,
        },
      });
      setKbList((prev) => prev.map((kb) => (kb.id === updatedKb.id ? updatedKb : kb)));
      setSelectedKb(updatedKb);
      setShowEditKbModal(false);
    } catch (err: any) {
      console.error(err);
      setError('Failed to update Knowledge Base.');
    } finally {
      setSavingKb(false);
    }
  };

  // ── Doc Edit Handlers ────────────────────────────────────────────────────

  const openEditDocModal = (doc: any) => {
    setEditDoc(doc);
    setEditDocName(doc.name);
    setEditDocDesc(doc.metadata_json?.description || '');
    const initialTags = Array.isArray(doc.tags) && doc.tags.length > 0
      ? doc.tags.map((t: any) => typeof t === 'string' ? t : (t.value || t.canonical_name || '')).filter(Boolean)
      : (Array.isArray(doc.metadata_json?.tags) ? doc.metadata_json.tags : []);
    setEditDocTags(initialTags.map((t: string) => (t || '').trim().toUpperCase()).filter(Boolean));
    setEditDocType(doc.metadata_json?.type || doc.metadata_json?.doc_type || '');
    setShowEditDocModal(true);
  };

  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKb || !editDoc || !editDocName.trim()) return;

    setSavingDoc(true);
    setDocError(null);
    try {
      await api.updateDocument(selectedKb.id, editDoc.id, {
        name: editDocName,
        tags: editDocTags,
        metadata: {
          ...(editDoc.metadata_json || {}),
          description: editDocDesc || undefined,
          doc_type: editDocType || undefined,
        },
      });
      fetchDocs(selectedKb.id);
      setShowEditDocModal(false);
      setEditDoc(null);
    } catch (err: any) {
      console.error(err);
      setDocError('Failed to update document.');
    } finally {
      setSavingDoc(false);
    }
  };

  const handleUpdateDocType = async (doc: any, newType: string) => {
    if (!selectedKb) return;
    setUpdatingDocTypeIds((prev) => ({ ...prev, [doc.id]: true }));
    try {
      await api.updateDocument(selectedKb.id, doc.id, {
        name: doc.name,
        metadata: {
          ...(doc.metadata_json || {}),
          type: newType || undefined,
          doc_type: newType || undefined,
        },
      });
      setDocList((prev) =>
        prev.map((d) => {
          if (d.id === doc.id) {
            return {
              ...d,
              metadata_json: {
                ...(d.metadata_json || {}),
                type: newType,
                doc_type: newType,
              },
            };
          }
          return d;
        }),
      );
    } catch (err: any) {
      console.error(err);
      alert('Failed to update document type.');
    } finally {
      setUpdatingDocTypeIds((prev) => ({ ...prev, [doc.id]: false }));
    }
  };

  const formatBytes = (bytes?: number) => {
    if (bytes === undefined || bytes === null) return '-';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <div className="flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-[820px] font-sans text-gray-800">
        {/* SUB-TAB NAVIGATION BAR */}
        <div className="bg-slate-100/90 border-b border-gray-200 px-6 py-2.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveMainTab('kb')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${activeMainTab === 'kb'
                ? 'bg-white text-indigo-700 shadow-xs border border-gray-200'
                : 'text-gray-600 hover:bg-slate-200/60'
                }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Knowledge Bases</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px]">
                {kbList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveMainTab('domains')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${activeMainTab === 'domains'
                ? 'bg-white text-indigo-700 shadow-xs border border-gray-200'
                : 'text-gray-600 hover:bg-slate-200/60'
                }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Domain Schemas</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px]">
                {domainSchemas.length}
              </span>
            </button>
          </div>

          {/* Global Action Bar */}
          <div className="flex items-center gap-2">
            {activeMainTab === 'kb' && (
              <>
                <button
                  onClick={handleRefreshAllStatus}
                  className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Refresh Status"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Status</span>
                </button>
                <button
                  onClick={() => {
                    setNewDocType('');
                    if (!docTypes || docTypes.length === 0) {
                      setDocTypes(['General', 'Policy', 'FAQ', 'Technical', 'Contract']);
                    }
                    setShowDocTypesModal(true);
                  }}
                  className="p-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-all cursor-pointer shadow-2xs"
                  title="Manage Document Types"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (selectedCustomerFilter !== 'all') {
                      setCreateKbTargetCustomer(selectedCustomerFilter);
                    }
                    setShowCreateModal(true);
                  }}
                  className="px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-blue-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Knowledge Base</span>
                </button>
              </>
            )}

            {activeMainTab === 'domains' && (
              <button
                onClick={handleOpenCreateDomain}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>Create Domain Schema</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: KNOWLEDGE BASES LAYOUT */}
        {activeMainTab === 'kb' && (
          <div className="flex-1 flex overflow-hidden">
            <div className="w-1/4 border-r border-gray-200 flex flex-col h-full bg-slate-50/20">

              {/* BLOCK: Customer Filter Dropdown for System Admin */}
              {isSystemAdmin && (
                <div className="p-3 bg-slate-100 border-b border-gray-200 space-y-1">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                    Customer / Tenant Filter
                  </label>
                  <select
                    value={selectedCustomerFilter}
                    onChange={(e) => setSelectedCustomerFilter(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-900 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="all">All Customers (Tenants)</option>
                    {customers.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name} ({c.domain})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {/* END BLOCK */}

              <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {loading ? (
                  <div className="p-6 text-center text-gray-400 text-sm">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading...
                  </div>
                ) : kbList.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    No knowledge bases found.
                  </div>
                ) : (
                  kbList.map((kb) => {
                    const isSelected = selectedKb?.id === kb.id;
                    const tags = Array.isArray(kb.settings?.tags) ? kb.settings.tags : [];
                    const uploaderName = usersMap[kb.created_by] || `User #${kb.created_by}`;
                    const createdDate = kb.created_at
                      ? new Date(kb.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                      : '-';
                    return (
                      <div
                        key={kb.id}
                        onClick={() => {
                          setSelectedKb(kb);

                        }}
                        className={`p-4 flex items-start justify-between cursor-pointer transition-all hover:bg-slate-50/80 ${isSelected ? 'bg-blue-50/40 border-l-4 border-l-primary' : ''
                          }`}
                      >
                        <div className="space-y-1.5 pr-2 min-w-0 flex-1">
                          <h4
                            className={`font-bold text-sm ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}
                          >
                            {kb.name}
                          </h4>
                          {kb.description && (
                            <p className="text-xs text-gray-555 line-clamp-2 leading-relaxed">
                              {kb.description}
                            </p>
                          )}
                          {/* BLOCK: Tenant badge for system_admin */}
                          {isSystemAdmin && kb.customer_id && (
                            <div className="pt-0.5">
                              <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                                Tenant: {customersMap[kb.customer_id] || `Tenant #${kb.customer_id}`}
                              </span>
                            </div>
                          )}
                          {/* END BLOCK */}

                          {/* Linked Domain Schema Badge */}
                          {kb.domain_id && domainSchemasMap[kb.domain_id] && (
                            <div className="pt-0.5">
                              <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold inline-flex items-center gap-1">
                                🏷️ {domainSchemasMap[kb.domain_id].name} ({domainSchemasMap[kb.domain_id].scope})
                              </span>
                            </div>
                          )}

                          {/* Linked LLM Profile Badge */}
                          {kb.settings?.llm_profile_id && llmProfilesMap[kb.settings.llm_profile_id] && (
                            <div className="pt-0.5">
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold inline-flex items-center gap-1">
                                {llmProfilesMap[kb.settings.llm_profile_id].name}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-gray-400">
                            <span className="inline-flex items-center gap-1">
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                              </svg>
                              <span className="font-medium text-gray-550">{uploaderName}</span>
                            </span>
                            <span className="text-gray-300">·</span>
                            <span className="inline-flex items-center gap-1">
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                              </svg>
                              <span>{createdDate}</span>
                            </span>
                          </div>

                          {/* {tags.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap pt-1">
                              {tags.map((t: string) => (
                                <span
                                  key={t}
                                  style={{
                                    backgroundColor: getColor(t).bg,
                                    border: getColor(t).border,
                                    color: getColor(t).text,
                                  }}
                                  className="px-1.5 py-0.5 rounded text-xs font-medium"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )} */}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditKbModal(kb);
                            }}
                            className="p-1 text-gray-400 hover:text-bg-primary rounded hover:bg-blue-50 transition-all cursor-pointer"
                            title="KB Settings"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteKB(kb.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-all cursor-pointer"
                            title="Delete Knowledge Base"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Main Document / Retrieval Area */}
            {selectedKb ? (
              <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
                {/* Header Row */}
                <div className="p-4 border-b border-gray-200 bg-gray-50/30 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-gray-800">{selectedKb.name}</h3>
                      <button
                        onClick={() => openEditKbModal(selectedKb)}
                        className="p-1 text-gray-400 hover:text-bg-primary rounded transition-colors cursor-pointer"
                        title="Edit Settings"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {selectedKb.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{selectedKb.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() =>
                          onSwitchToPlayground && onSwitchToPlayground(String(selectedKb.id))
                        }
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-violet-750 bg-white rounded-md shadow-xs hover:bg-violet-50 transition-colors cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        Test Retrieval
                      </button>
                    </div>

                    <label className="flex items-center gap-1.5 text-xs text-gray-600 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoRefresh}
                        onChange={(e) => setAutoRefresh(e.target.checked)}
                        className="rounded border-gray-350 text-bg-primary focus:ring-blue-500 w-3.5 h-3.5"
                      />
                      Auto-Refresh Status
                    </label>

                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-sm transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload Document
                    </button>
                  </div>
                </div>

                {/* Error alerts */}
                {error && (
                  <div className="mx-4 mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-xs font-semibold">
                    {error}
                  </div>
                )}
                {docError && (
                  <div className="mx-4 mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-xs font-semibold">
                    {docError}
                  </div>
                )}

                {/* Documents Search & Status Filter Toolbar */}
                <div className="px-4 py-2.5 border-b border-gray-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
                  {/* Search input */}
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search documents by name, type, tags..."
                      value={docSearchQuery}
                      onChange={(e) => setDocSearchQuery(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-8 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 shadow-2xs"
                    />
                    {docSearchQuery && (
                      <button
                        onClick={() => setDocSearchQuery('')}
                        className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Status Filter Tabs */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                      <Filter className="w-3 h-3 text-gray-400" />
                      Status:
                    </span>
                    {[
                      { key: 'all', label: 'All', count: statusCounts.all, activeClass: 'bg-indigo-600 text-white' },
                      { key: 'ready', label: 'Ready', count: statusCounts.ready, activeClass: 'bg-emerald-600 text-white' },
                      { key: 'processing', label: 'Processing', count: statusCounts.processing, activeClass: 'bg-amber-600 text-white' },
                      { key: 'failed', label: 'Failed', count: statusCounts.failed, activeClass: 'bg-rose-600 text-white' },
                    ].map((tab) => {
                      const isActive = docStatusFilter === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setDocStatusFilter(tab.key as any)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${isActive
                            ? `${tab.activeClass} border-transparent shadow-xs`
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                        >
                          <span>{tab.label}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${isActive
                              ? 'bg-white/25 text-white'
                              : 'bg-gray-100 text-gray-600'
                              }`}
                          >
                            {tab.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Multi-Select & Bulk Action Bar */}
                {filteredDocList.length > 0 && (
                  <div className="px-4 py-2 border-b border-gray-200 bg-white flex items-center justify-between gap-3 text-xs shrink-0">
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 font-medium text-gray-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          ref={(input) => {
                            if (input) {
                              input.indeterminate = someFilteredSelected;
                            }
                          }}
                          disabled={isBulkDeleting}
                          onChange={toggleSelectAllFiltered}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <span>
                          {allFilteredSelected
                            ? 'Deselect all'
                            : someFilteredSelected
                              ? 'Select all'
                              : `Select all (${filteredDocList.length})`}
                        </span>
                      </label>

                      {selectedDocIds.length > 0 && (
                        <>
                          <span className="text-gray-400 text-xs">·</span>
                          <span className="text-indigo-600 font-semibold text-xs">
                            {selectedDocIds.length} of {docList.length} selected
                          </span>
                        </>
                      )}
                    </div>

                    {selectedDocIds.length > 0 && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleClearSelection}
                          disabled={isBulkDeleting}
                          className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 font-medium cursor-pointer disabled:opacity-50"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={handleBulkDelete}
                          disabled={isBulkDeleting}
                          className="flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                          {isBulkDeleting ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Deleting ({selectedDocIds.length} remaining)...</span>
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Selected ({selectedDocIds.length})</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Doc List Container */}
                <div className="flex-1 overflow-y-auto p-4">
                  {docsLoading && docList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-sm">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mb-2" />
                      Loading documents...
                    </div>
                  ) : docList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                      <Upload className="w-10 h-10 text-gray-300 mb-3" />
                      <p className="font-semibold text-gray-655">
                        No documents uploaded in this knowledge base.
                      </p>
                      <p className="text-xs text-gray-400 mt-1 max-w-xs text-center">
                        Click the "Upload Document" button above to ingest your text, PDF, or Word files.
                      </p>
                    </div>
                  ) : filteredDocList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl bg-slate-50/50">
                      <Search className="w-8 h-8 text-gray-300 mb-2" />
                      <p className="font-semibold text-gray-700 text-xs">
                        No documents match the current filter or search.
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Try selecting another status tab or clearing the search query.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setDocStatusFilter('all');
                          setDocSearchQuery('');
                        }}
                        className="mt-3 px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer shadow-2xs"
                      >
                        Reset Filters
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredDocList.map((doc) => {
                        const isSelected = selectedDocIds.includes(String(doc.id));
                        const isDeleting = Boolean(deletingDocIds[String(doc.id)]);
                        const status = doc.status?.toLowerCase();
                        const isProcessing = ['processing', 'pending', 'chunking', 'embedding', 'queued'].includes(
                          status,
                        );
                        const isError = ['error', 'failed'].includes(status);
                        const isSuccess = ['ready', 'completed', 'active', 'indexed'].includes(status);
                        const docTags = Array.isArray(doc.tags) && doc.tags.length > 0
                          ? doc.tags.map((t: any) => typeof t === 'string' ? t : (t.value || t.canonical_name || '')).filter(Boolean)
                          : (Array.isArray(doc.metadata_json?.tags) ? doc.metadata_json.tags : []);
                        const docDescription = doc.metadata_json?.description || '';
                        const docType =
                          doc.metadata_json?.type || doc.metadata_json?.doc_type || 'general';
                        return (
                          <div
                            key={doc.id}
                            className={`border rounded-xl p-4 transition-all shadow-xs ${isSelected
                              ? 'border-indigo-300 bg-indigo-50/25 ring-1 ring-indigo-200'
                              : 'border-gray-150 hover:bg-slate-50/30 bg-white'
                              } ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                          >
                            {/* Top Row: Checkbox, Title/Badges/Meta on Left, Operations on Right */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0 flex-1">
                                {/* Checkbox */}
                                <div className="pt-0.5 shrink-0">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={isBulkDeleting || isDeleting}
                                    onChange={() => toggleSelectDoc(doc.id)}
                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed"
                                  />
                                </div>

                                <div className="space-y-1.5 min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-sm text-gray-800 truncate">
                                      {doc.name}
                                    </span>
                                    <div className="relative group inline-flex items-center">
                                      <select
                                        value={docType.toLowerCase()}
                                        disabled={updatingDocTypeIds[doc.id] || isDeleting}
                                        onChange={(e) => handleUpdateDocType(doc, e.target.value)}
                                        className="appearance-none pl-2 pr-5 py-0.5 bg-blue-50 hover:bg-blue-100 disabled:bg-blue-50 text-bg-primary rounded text-xs font-bold uppercase tracking-wider border-none focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed outline-none transition-colors duration-150"
                                        title="Change Document Type"
                                      >
                                        {(docTypes && docTypes.length > 0
                                          ? docTypes
                                          : ['General', 'Policy', 'FAQ', 'Technical', 'Contract']
                                        ).map((type) => (
                                          <option
                                            key={type}
                                            value={type.toLowerCase()}
                                            className="bg-white text-gray-800 normal-case font-normal text-xs"
                                          >
                                            {type.toUpperCase()}
                                          </option>
                                        ))}
                                      </select>
                                      <span className="absolute right-1.5 pointer-events-none text-bg-primary flex items-center justify-center">
                                        {updatingDocTypeIds[doc.id] ? (
                                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                        ) : (
                                          <ChevronDown className="w-2.5 h-2.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                                        )}
                                      </span>
                                    </div>
                                    <span
                                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${isSuccess
                                        ? 'bg-green-100 text-green-800 border border-green-200'
                                        : isProcessing
                                          ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                                          : 'bg-red-100 text-red-800 border border-red-200'
                                        }`}
                                    >
                                      {isProcessing ? 'PROCESSING' : isSuccess ? (doc.status === 'ready' ? 'READY' : doc.status.toUpperCase()) : (doc.status || 'UNKNOWN').toUpperCase()}
                                    </span>
                                  </div>

                                  {/* Live Processing Progress Bar & DB Message */}
                                  {isProcessing && (
                                    <div className="w-full bg-amber-50/80 border border-amber-200 rounded-lg p-2.5 space-y-1.5 my-1.5">
                                      <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
                                        <span className="flex items-center gap-1.5 font-mono">
                                          <RefreshCw className="w-3 h-3 animate-spin text-amber-600 shrink-0" />
                                          {doc.job_message || 'Processing document...'}
                                        </span>
                                        <span className="font-bold font-mono">
                                          {doc.job_progress !== undefined && doc.job_progress !== null
                                            ? `${doc.job_progress}%`
                                            : '10%'}
                                        </span>
                                      </div>
                                      <div className="w-full bg-amber-200/60 rounded-full h-1.5 overflow-hidden">
                                        <div
                                          className="bg-amber-600 h-1.5 rounded-full transition-all duration-300"
                                          style={{ width: `${doc.job_progress ?? 10}%` }}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Metadata Details Row: Size · Chunks · Created */}
                                  <div className="flex items-center gap-3 text-xs text-gray-450 font-medium flex-wrap">
                                    {docDescription && (
                                      <p className="text-xs text-gray-550 leading-relaxed">
                                        {docDescription}
                                      </p>
                                    )}
                                    {/* {docTags.length > 0 && (
                                      <div className="flex items-center gap-1 flex-wrap">
                                        {docTags.map((t: string, tagIdx: number) => (
                                          <span
                                            key={`doc-${doc.id}-tag-${t}-${tagIdx}`}
                                            id={`doc-${doc.id}-tag-${t}-${tagIdx}`}
                                            style={{
                                              backgroundColor: getColor(t).bg,
                                              border: getColor(t).border,
                                              color: getColor(t).text,
                                            }}
                                            className="px-2 py-0.5 rounded text-[11px] font-semibold"
                                          >
                                            #{t}
                                          </span>
                                        ))}
                                      </div>
                                    )} */}
                                    <span>Size: {formatBytes(doc.file_size)}</span>
                                    <span>·</span>
                                    <span>Chunks: {doc.chunk_count ?? 0}</span>
                                    <span>·</span>
                                    <span>
                                      Created:{' '}
                                      {doc.created_at
                                        ? new Date(doc.created_at).toLocaleString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })
                                        : '-'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Operations */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => fetchEkpDocDetails(doc)}
                                  className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                  title="Inspect 3-Way Extracted Data (Text, JSON Metadata, Entities)"
                                >
                                  <Eye className="w-3.5 h-3.5 text-purple-600" />
                                  <span>Inspect</span>
                                </button>
                                {(() => {
                                  const isReprocessable = ['completed', 'active', 'ready', 'failed', 'error'].includes(status);
                                  const isProcessingDoc = ['processing', 'pending', 'chunking', 'embedding'].includes(status) || reprocessingDocIds[doc.id];
                                  return (
                                    <button
                                      onClick={() => handleReprocessDocument(doc.id)}
                                      disabled={!isReprocessable || isProcessingDoc || isDeleting || isBulkDeleting}
                                      className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 border ${isProcessingDoc
                                        ? 'bg-amber-50 text-amber-800 border-amber-200 cursor-not-allowed opacity-75'
                                        : isReprocessable
                                          ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-2xs'
                                          : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                        }`}
                                      title={
                                        isProcessingDoc
                                          ? 'Document processing currently in progress...'
                                          : isReprocessable
                                            ? 'Reprocess Document (Re-run domain extraction & vector embedding)'
                                            : 'Reprocess is available once document processing completes'
                                      }
                                    >
                                      <RefreshCw
                                        className={`w-3.5 h-3.5 ${isProcessingDoc ? 'animate-spin' : ''}`}
                                      />
                                      <span>{isProcessingDoc ? 'Processing...' : 'Reprocess'}</span>
                                    </button>
                                  );
                                })()}
                                <button
                                  onClick={() => openEditDocModal(doc)}
                                  disabled={isDeleting || isBulkDeleting}
                                  className="p-1.5 text-gray-400 hover:text-bg-primary hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all cursor-pointer"
                                  title="Edit Document Meta"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleUploadNewVersion(doc)}
                                  disabled={isDeleting || isBulkDeleting}
                                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all cursor-pointer"
                                  title="Upload New Version"
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteDoc(doc.id, doc.name)}
                                  disabled={isDeleting || isBulkDeleting}
                                  className="p-1.5 text-gray-400 hover:text-red-650 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all cursor-pointer"
                                  title="Delete Document"
                                >
                                  {isDeleting ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-500" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Second Row / Extended Extracted JSON Box (Full Width) */}
                            {renderDynamicExtractedJson(doc.extracted_json || doc.metadata_json?.extracted_json || doc.metadata_json?.domain_info)}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/10">
                <BookOpen className="w-12 h-12 text-gray-300 mb-3" />
                <h3 className="font-semibold text-gray-700 text-sm mb-1">No Knowledge Base Selected</h3>
                <p className="text-xs text-gray-400 text-center max-w-sm">
                  Select or create a knowledge base on the left to start uploading and managing documents.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-sm transition-colors cursor-pointer"
                >
                  New Knowledge Base
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: 2-FRAME DOMAIN SCHEMAS MANAGEMENT LAYOUT */}
        {activeMainTab === 'domains' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Frame: Master Domain List */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col h-full bg-slate-50/20">
              {/* Search & Scope Filter Bar */}
              <div className="p-3 border-b border-gray-200 bg-gray-50/50 space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search domains..."
                    value={domainSearchQuery}
                    onChange={(e) => setDomainSearchQuery(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Scope:</span>
                  {(['ALL', 'SYSTEM', 'TENANT'] as const).map((sc) => (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => setDomainScopeFilter(sc)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${domainScopeFilter === sc
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                        }`}
                    >
                      {sc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Master List of Domains */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100 p-2 space-y-1">
                {domainSchemas
                  .filter((d) => {
                    if (domainScopeFilter !== 'ALL' && d.scope !== domainScopeFilter) return false;
                    if (
                      domainSearchQuery &&
                      !d.name.toLowerCase().includes(domainSearchQuery.toLowerCase()) &&
                      !d.domain_key.toLowerCase().includes(domainSearchQuery.toLowerCase())
                    )
                      return false;
                    return true;
                  })
                  .map((d) => {
                    const isSelected = selectedDomainId === d.id;
                    const fieldsCount = d.schema_json?.fields?.length || 0;
                    return (
                      <div
                        key={d.id}
                        onClick={() => {
                          setSelectedDomainId(d.id);
                          handleOpenEditDomain(d);
                        }}
                        className={`p-3 rounded-xl cursor-pointer transition-all border ${isSelected
                          ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-200 shadow-xs'
                          : 'bg-white border-gray-200 hover:border-indigo-200 hover:bg-slate-50'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-gray-900 truncate">{d.name}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${d.scope === 'SYSTEM' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                              }`}
                          >
                            {d.scope}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono">
                          <span>key: {d.domain_key}</span>
                          <span>{fieldsCount} Fields</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Right Frame: Detailed View & Editor Panel */}
            <div className="w-2/3 flex flex-col h-full bg-white overflow-y-auto p-6 space-y-5">
              {selectedDomainId && domainSchemasMap[selectedDomainId] ? (
                <form onSubmit={handleSaveDomain} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-gray-900">
                        {domainName || 'Domain Schema Details'}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${domainScope === 'SYSTEM' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}
                      >
                        {domainScope} Scope
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {(isSystemAdmin || domainScope === 'TENANT') && (
                        <button
                          type="button"
                          onClick={() => handleDeleteDomainSchema(selectedDomainId)}
                          className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Delete Schema
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={savingDomain}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        {savingDomain && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </div>

                  {domainError && (
                    <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">
                      {domainError}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-700">Schema Name *</label>
                      <input
                        type="text"
                        required
                        value={domainName}
                        disabled={!isSystemAdmin && domainScope === 'SYSTEM'}
                        onChange={(e) => setDomainName(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-gray-900 focus:border-indigo-500 focus:outline-none disabled:bg-gray-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-700">Domain Key *</label>
                      <input
                        type="text"
                        required
                        value={domainKey}
                        disabled={!isSystemAdmin && domainScope === 'SYSTEM'}
                        onChange={(e) => setDomainKey(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono bg-white text-gray-900 focus:border-indigo-500 focus:outline-none disabled:bg-gray-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-700">Scope</label>
                      <input
                        type="text"
                        disabled
                        value={`${domainScope} (${domainScope === 'SYSTEM' ? 'Global System' : 'Tenant'})`}
                        className="w-full border border-gray-200 bg-gray-100 rounded-lg px-3 py-2 text-xs text-gray-700 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">Description</label>
                    <input
                      type="text"
                      value={domainDescription}
                      disabled={!isSystemAdmin && domainScope === 'SYSTEM'}
                      onChange={(e) => setDomainDescription(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-gray-900 focus:border-indigo-500 focus:outline-none disabled:bg-gray-100"
                    />
                  </div>

                  {/* Schema Fields Builder Table */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                        Schema Fields ({domainFields.length})
                      </label>
                      <button
                        type="button"
                        onClick={handleAddField}
                        className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Tenant Field</span>
                      </button>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1 border border-gray-200 rounded-xl p-2 bg-slate-50/50">
                      {domainFields.map((field, idx) => {
                        const isSystemField = domainScope === 'SYSTEM' && !isSystemAdmin;
                        return (
                          <div
                            key={idx}
                            className="grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-lg border border-gray-200 text-xs shadow-2xs"
                          >
                            <div className="col-span-3">
                              <input
                                type="text"
                                disabled={isSystemField}
                                placeholder="Key"
                                value={field.key}
                                onChange={(e) =>
                                  handleUpdateField(idx, 'key', e.target.value.toLowerCase().replace(/\s+/g, '_'))
                                }
                                className="w-full border border-gray-300 rounded px-2 py-1 font-mono text-xs bg-white disabled:bg-gray-100"
                              />
                            </div>

                            <div className="col-span-3">
                              <input
                                type="text"
                                disabled={isSystemField}
                                placeholder="Label"
                                value={field.label}
                                onChange={(e) => handleUpdateField(idx, 'label', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-white disabled:bg-gray-100"
                              />
                            </div>

                            <div className="col-span-3">
                              <input
                                type="text"
                                disabled={isSystemField}
                                placeholder="Directive (e.g. Extract name & role)"
                                value={field.description || ''}
                                onChange={(e) => handleUpdateField(idx, 'description', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-white disabled:bg-gray-100"
                              />
                            </div>

                            <div className="col-span-2">
                              <select
                                value={field.importance}
                                disabled={isSystemField}
                                onChange={(e) => handleUpdateField(idx, 'importance', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-white disabled:bg-gray-100"
                              >
                                <option value="low">low (1.0x)</option>
                                <option value="medium">medium (1.5x)</option>
                                <option value="high">high (2.0x)</option>
                                <option value="critical">critical (3.0x)</option>
                              </select>
                            </div>

                            <div className="col-span-2 flex items-center justify-end">
                              {isSystemField ? (
                                <span className="text-[10px] font-bold text-gray-400 flex items-center gap-0.5">
                                  🔒 System Field
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveField(idx)}
                                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Extraction Prompts Panel */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-700">Domain System Prompt</label>
                      <textarea
                        rows={4}
                        value={domainSystemPrompt}
                        disabled={!isSystemAdmin && domainScope === 'SYSTEM'}
                        onChange={(e) => setDomainSystemPrompt(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-xs font-mono bg-slate-900 text-slate-100 focus:outline-none focus:border-indigo-500 resize-none disabled:opacity-80"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-700">Domain User Prompt Template</label>
                      <textarea
                        rows={4}
                        value={domainUserPrompt}
                        disabled={!isSystemAdmin && domainScope === 'SYSTEM'}
                        onChange={(e) => setDomainUserPrompt(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-xs font-mono bg-slate-900 text-slate-100 focus:outline-none focus:border-indigo-500 resize-none disabled:opacity-80"
                      />
                    </div>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <SlidersHorizontal className="w-10 h-10 mb-2 text-gray-300" />
                  <p className="text-sm font-semibold">Select a Domain Schema on the left to edit or define fields.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CREATE KB MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">
                Create Knowledge Base
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xs p-1 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateKB} className="p-6 space-y-4">
              {/* BLOCK: Customer selector for system_admin */}
              {isSystemAdmin && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Target Customer Tenant
                  </label>
                  <select
                    value={createKbTargetCustomer}
                    onChange={(e) => setCreateKbTargetCustomer(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
                  >
                    <option value="">Select Customer Tenant...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name} ({c.domain})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {/* END BLOCK */}

              {/* ROW 1: NAME & LINKED DOMAIN SCHEMA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Knowledge Base Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Employee handbook"
                    value={newKbName}
                    onChange={(e) => setNewKbName(toSentenceCase(e.target.value))}
                    onBlur={() => setNewKbName(toSentenceCase(newKbName))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Linked Domain Schema (Optional)
                  </label>
                  <select
                    value={newKbDomainId}
                    onChange={(e) => setNewKbDomainId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
                  >
                    <option value="">None (General KB)</option>
                    {domainSchemas.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.domain_key} - {d.scope})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ROW 2: PURPOSE & TAGS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Purpose / Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe the domain contents..."
                    value={newKbPurpose}
                    onChange={(e) => setNewKbPurpose(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-900 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HR, POLICY, INTERNAL"
                    value={newKbTags}
                    onChange={(e) => setNewKbTags(e.target.value.toUpperCase())}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-900 focus:outline-none focus:border-blue-500 uppercase placeholder:normal-case font-medium"
                  />
                  <p className="text-[10px] text-gray-400 pt-0.5">
                    Categorize documents and search filters across collections (auto-uppercased).
                  </p>
                </div>
              </div>

              {/* ROW 3: LLM PROFILE & QDRANT VECTOR INDEX SPECS SIDE-BY-SIDE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-gray-700">
                      LLM Profile (Doc Extraction & Reasoning)
                    </label>
                    {targetCustomerProfiles.length > 1 && (
                      <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded font-bold">
                        {targetCustomerProfiles.length} profiles
                      </span>
                    )}
                  </div>
                  <select
                    value={newKbLlmProfileId}
                    onChange={(e) => setNewKbLlmProfileId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
                  >
                    <option value="">Default (Tenant Active Profile)</option>
                    {targetCustomerProfiles.map((prof) => (
                      <option key={prof.id} value={String(prof.id)}>
                        {prof.name || prof.profile_name || `Profile #${prof.id}`}
                        {prof.provider || prof.provider_name ? ` (${prof.provider || prof.provider_name})` : ''}
                        {prof.is_default ? ' ★ Default' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-blue-600" />
                      <span>Qdrant Vector Index Specs</span>
                    </label>
                    <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Immutable
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 px-2.5 rounded-lg border border-blue-150 bg-blue-50/70 h-[38px] overflow-hidden">
                    <span
                      className="px-2 py-0.5 bg-white border border-blue-200 rounded text-xs font-mono font-bold text-slate-800 truncate max-w-[190px]"
                      title={activeCreateEmbeddingSettings.model}
                    >
                      {activeCreateEmbeddingSettings.model}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-100/90 border border-blue-200 rounded text-xs font-mono font-semibold text-blue-800 shrink-0">
                      {activeCreateEmbeddingSettings.dimension} dims ({activeCreateEmbeddingSettings.provider})
                    </span>
                  </div>
                </div>
              </div>

              {/* ROW 4: PDF PARSER ENGINES & DEDUPLICATION CONFIGURATION */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    PDF Parser Engines & Deduplication
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">
                    {newKbEnableDocling && newKbEnableOpenDataLoader ? 'Dual Sequential + Compare' : 'Single Parser Mode'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer ${newKbEnableDocling ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 shadow-xs' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}>
                    <input
                      type="checkbox"
                      checked={newKbEnableDocling}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        if (!checked && !newKbEnableOpenDataLoader) return;
                        setNewKbEnableDocling(checked);
                        if (!checked || !newKbEnableOpenDataLoader) {
                          setNewKbEnableDedup(false);
                        }
                      }}
                      className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                    />
                    <div className="flex-1">
                      <strong className="block text-gray-900 text-xs font-semibold">1. IBM Docling</strong>
                      <span className="text-[10px] text-gray-500">Primary structural parser</span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer ${newKbEnableOpenDataLoader ? 'bg-blue-50/70 border-blue-300 text-blue-950 shadow-xs' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}>
                    <input
                      type="checkbox"
                      checked={newKbEnableOpenDataLoader}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        if (!checked && !newKbEnableDocling) return;
                        setNewKbEnableOpenDataLoader(checked);
                        if (!checked || !newKbEnableDocling) {
                          setNewKbEnableDedup(false);
                        }
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4"
                    />
                    <div className="flex-1">
                      <strong className="block text-gray-900 text-xs font-semibold">2. OpenDataLoader</strong>
                      <span className="text-[10px] text-gray-500">Layout & PyMuPDF engine</span>
                    </div>
                  </label>
                </div>

                <div className={`flex items-center justify-between pt-2 border-t border-slate-200/80 transition-opacity ${newKbEnableDocling && newKbEnableOpenDataLoader ? 'opacity-100' : 'opacity-50'
                  }`}>
                  <div>
                    <span className="block text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      Enable Paragraph & Boilerplate Deduplication
                      {!(newKbEnableDocling && newKbEnableOpenDataLoader) && (
                        <span className="px-1.5 py-0.5 bg-gray-150 text-gray-500 rounded text-[9px] font-medium">
                          Requires Both Parsers
                        </span>
                      )}
                    </span>
                    <span className="block text-[10px] text-gray-400">
                      Filters duplicate boilerplate & cross-parser redundant blocks (disabled by default)
                    </span>
                  </div>
                  <label className={`relative inline-flex items-center ${newKbEnableDocling && newKbEnableOpenDataLoader ? 'cursor-pointer' : 'cursor-not-allowed'
                    }`}>
                    <input
                      type="checkbox"
                      disabled={!(newKbEnableDocling && newKbEnableOpenDataLoader)}
                      checked={newKbEnableDocling && newKbEnableOpenDataLoader && newKbEnableDedup}
                      onChange={(e) => setNewKbEnableDedup(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
                  </label>
                </div>
              </div>

              {/* ROW 5: METADATA EXTRACTION PROMPT */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Metadata Extraction Prompt <span className="text-[10px] text-gray-400 font-normal">(Optional Override)</span>
                </label>
                <textarea
                  value={newKbExtractionPrompt}
                  onChange={(e) => setNewKbExtractionPrompt(e.target.value)}
                  placeholder="e.g. You are a precise entity extractor. Extract invoice number, total amount, vendor, and dates into JSON..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-900 bg-white font-mono placeholder:text-gray-400"
                />
                <p className="mt-1 text-[10px] text-gray-400">
                  Used when Knowledge Base is linked to a Domain to customize or override JSON metadata extraction instructions.
                </p>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-gray-150 hover:bg-gray-200 text-gray-755 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newKbName.trim()}
                  className="flex-1 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {creating ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  Create Knowledge Base
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      {showUploadModal && selectedKb && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-255 flex items-center justify-between">
              <h3 className="font-bold text-gray-850 text-sm uppercase tracking-wider">
                Upload Documents to {selectedKb.name}
              </h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadQueue([]);
                  setUploadProgress(null);
                }}
                className="text-gray-400 hover:text-gray-600 font-bold text-xs"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUploadAllFiles} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-655">Select Files</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-5 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors relative cursor-pointer">
                  <Upload className="w-7 h-7 text-blue-500 mb-1.5" />
                  <span className="text-xs text-gray-700 font-semibold">
                    Drag & Drop or click to choose multiple documents
                  </span>
                  <span className="text-[10px] text-gray-400 mt-1">
                    Supported: .txt, .pdf, .doc, .docx, .md (Max 50MB per file)
                  </span>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => handleAddFilesToQueue(e.target.files)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    accept=".txt,.pdf,.doc,.docx,.md"
                  />
                </div>
              </div>

              {/* Document Queue Lineup */}
              {uploadQueue.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-655 flex justify-between items-center">
                    <span>Selected Documents ({uploadQueue.length})</span>
                    <button
                      type="button"
                      onClick={() => setUploadQueue([])}
                      className="text-[10px] text-red-500 hover:underline font-bold"
                    >
                      Clear All
                    </button>
                  </label>
                  <div className="max-h-44 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2 bg-slate-50/50">
                    {uploadQueue.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 bg-white rounded-lg border border-gray-200 shadow-2xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 truncate pr-2 flex-1">
                            <FileText className="w-4 h-4 text-bg-primary shrink-0" />
                            <span className="font-semibold text-gray-800 truncate">
                              {item.file.name}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium shrink-0">
                              {formatBytes(item.file.size)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${item.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : item.status === 'uploading'
                                  ? 'bg-amber-100 text-amber-700 animate-pulse'
                                  : item.status === 'failed'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                            >
                              {item.status}
                            </span>
                            {item.status === 'pending' && !uploading && (
                              <button
                                type="button"
                                onClick={() => handleRemoveFileFromQueue(item.id)}
                                className="text-gray-400 hover:text-red-500 font-bold text-xs p-0.5"
                                title="Remove file"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>

                        {item.status === 'uploading' && (
                          <div className="w-full bg-gray-150 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-primary h-full transition-all duration-300 animate-pulse"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        )}
                        {item.error && (
                          <div className="text-[10px] text-red-600 font-semibold">{item.error}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-655">Document Type</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {(docTypes && docTypes.length > 0
                      ? docTypes
                      : ['General', 'Policy', 'FAQ', 'Technical', 'Contract']
                    ).map((type) => (
                      <option key={type} value={type.toLowerCase()}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-655">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Q3, PRODUCT, REPORT"
                    value={docTags}
                    onChange={(e) => setDocTags(e.target.value.toUpperCase())}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500 uppercase placeholder:normal-case font-medium"
                  />
                </div>
              </div>

              {/* PDF PARSER STRATEGY & DEDUPLICATION OPTIONS */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700 flex items-center justify-between">
                    <span>PDF Parser Strategy</span>
                    <span className="text-[10px] text-gray-400 font-normal">Choose parsing pipeline</span>
                  </label>
                  <select
                    value={docParserStrategy}
                    onChange={(e: any) => {
                      const strat = e.target.value;
                      setDocParserStrategy(strat);
                      if (strat !== 'dual') {
                        setDocEnableDedup(false);
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
                  >
                    <option value="dual">Dual Parser (Docling + OpenDataLoader Reconciliation - High Assurance)</option>
                    <option value="docling_only">Docling Only (Fast Primary Structural Extraction)</option>
                    <option value="opendataloader_only">OpenDataLoader Only (Fast Secondary Layout Parser - Recommended for Books & Textbooks)</option>
                  </select>
                </div>

                <div className={`flex items-center justify-between pt-1 border-t border-slate-200/80 transition-opacity ${docParserStrategy === 'dual' ? 'opacity-100' : 'opacity-50'
                  }`}>
                  <div>
                    <span className="block text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      Enable Paragraph & Boilerplate Deduplication
                      {docParserStrategy !== 'dual' && (
                        <span className="px-1.5 py-0.5 bg-gray-150 text-gray-500 rounded text-[9px] font-medium">
                          Requires Dual Parser
                        </span>
                      )}
                    </span>
                    <span className="block text-[10px] text-gray-400">Filters duplicate boilerplate & cross-parser redundant blocks (disabled by default)</span>
                  </div>
                  <label className={`relative inline-flex items-center ${docParserStrategy === 'dual' ? 'cursor-pointer' : 'cursor-not-allowed'
                    }`}>
                    <input
                      type="checkbox"
                      disabled={docParserStrategy !== 'dual'}
                      checked={docParserStrategy === 'dual' && docEnableDedup}
                      onChange={(e) => setDocEnableDedup(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-655">Description</label>
                <textarea
                  placeholder="Describe what these documents represent..."
                  value={docDescription}
                  onChange={(e) => setDocDescription(e.target.value)}
                  className="h-16 w-full border border-gray-300 rounded-lg px-4 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {uploadProgress && (
                <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  {uploadProgress}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadQueue([]);
                    setUploadProgress(null);
                  }}
                  className="flex-1 py-2.5 bg-gray-150 hover:bg-gray-200 text-gray-755 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || uploadQueue.length === 0}
                  className="flex-1 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {uploading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  Ingest All Documents ({uploadQueue.length})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT TYPES CONFIG MODAL */}
      {showDocTypesModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-255 flex items-center justify-between">
              <h3 className="font-bold text-gray-850 text-sm uppercase tracking-wider">
                Document Types
              </h3>
              <button
                onClick={() => setShowDocTypesModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xs"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveDocTypes} className="p-6 space-y-4">
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {docTypes.map((type, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-150"
                  >
                    <span className="text-xs text-gray-700 font-bold flex-1">{type}</span>
                    <button
                      type="button"
                      onClick={() => setDocTypes((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-gray-400 hover:text-red-500 cursor-pointer font-semibold text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New type name..."
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const clean = newDocType.trim();
                    if (clean && !docTypes.includes(clean)) {
                      setDocTypes((prev) => [...prev, clean]);
                      setNewDocType('');
                    }
                  }}
                  className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 transition-all cursor-pointer"
                >
                  Add
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDocTypesModal(false)}
                  className="flex-1 py-2 bg-gray-150 hover:bg-gray-200 text-gray-755 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDocTypes}
                  className="flex-1 py-2 bg-primary hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {savingDocTypes ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  Save Document Types
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KB Edit Modal */}
      {showEditKbModal && selectedKb && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">
                KB Settings: {editKbName}
              </h3>
              <button
                onClick={() => setShowEditKbModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xs p-1 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveKb} className="p-6 space-y-4">
              {/* ROW 1: NAME & PURPOSE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={editKbName}
                    onChange={(e) => setEditKbName(toSentenceCase(e.target.value))}
                    onBlur={() => setEditKbName(toSentenceCase(editKbName))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">Purpose</label>
                  <input
                    type="text"
                    value={editKbPurpose}
                    onChange={(e) => setEditKbPurpose(e.target.value)}
                    placeholder="e.g. Customer support FAQs"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* ROW 2: DESCRIPTION & TAGS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">Description</label>
                  <textarea
                    rows={2}
                    value={editKbDesc}
                    onChange={(e) => setEditKbDesc(e.target.value)}
                    placeholder="Describe the contents..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-900 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">Tags</label>
                  <TagInput tags={editKbTags} onChange={setEditKbTags} />
                </div>
              </div>

              {/* ROW 3: LLM PROFILE & QDRANT VECTOR INDEX SPECS SIDE-BY-SIDE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-gray-700">
                      LLM Profile (Document Extraction)
                    </label>
                    {targetCustomerProfiles.length > 1 && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded font-bold">
                        {targetCustomerProfiles.length} profiles
                      </span>
                    )}
                  </div>
                  <select
                    value={editKbLlmProfileId}
                    onChange={(e) => setEditKbLlmProfileId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
                  >
                    <option value="">Default (Tenant Active Profile)</option>
                    {targetCustomerProfiles.map((prof) => (
                      <option key={prof.id} value={String(prof.id)}>
                        {prof.name || prof.profile_name || `Profile #${prof.id}`}
                        {prof.provider || prof.provider_name ? ` (${prof.provider || prof.provider_name})` : ''}
                        {prof.is_default ? ' ★ Default' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-blue-600" />
                      <span>Qdrant Vector Index Specs</span>
                    </label>
                    <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Immutable
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 px-2.5 rounded-lg border border-blue-150 bg-blue-50/70 h-[38px] overflow-hidden">
                    <span
                      className="px-2 py-0.5 bg-white border border-blue-200 rounded text-xs font-mono font-bold text-slate-800 truncate max-w-[190px]"
                      title={activeEditEmbeddingSettings.model}
                    >
                      {activeEditEmbeddingSettings.model}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-100/90 border border-blue-200 rounded text-xs font-mono font-semibold text-blue-800 shrink-0">
                      {activeEditEmbeddingSettings.dimension} dims ({activeEditEmbeddingSettings.provider})
                    </span>
                  </div>
                </div>
              </div>

              {/* ===================================================================== */}
              {/* BLOCK COMMENT: VECTOR DIMENSION MISMATCH & RE-PROCESS WARNING BANNERS */}
              {/* ===================================================================== */}
              {isDimensionMismatch && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-red-800 font-bold">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Vector Dimension Conflict ({docList.length} documents indexed)</span>
                  </div>
                  <p className="text-red-700 text-xs leading-relaxed">
                    Selected profile uses <strong>{activeEditEmbeddingSettings.dimension} dimensions</strong> ({activeEditEmbeddingSettings.model}), but this Knowledge Base has {docList.length} documents indexed with <strong>{selectedKb?.settings?.vector_dimension} dimensions</strong>. Changing dimension is restricted to prevent Qdrant vector index corruption.
                  </p>
                </div>
              )}

              {isProfileChanged && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Profile Change Notice</span>
                  </div>
                  <p className="text-amber-700 text-xs leading-relaxed">
                    Switching LLM profile will apply to future document ingestion. To update metadata extractions for existing documents ({docList.length} docs), please re-process them after saving.
                  </p>
                </div>
              )}

              {/* ROW 4: PDF PARSER ENGINES & DEDUPLICATION CONFIGURATION */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    PDF Parser Engines & Deduplication
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">
                    {editKbEnableDocling && editKbEnableOpenDataLoader ? 'Dual Sequential + Compare' : 'Single Parser Mode'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer ${editKbEnableDocling ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 shadow-xs' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}>
                    <input
                      type="checkbox"
                      checked={editKbEnableDocling}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        if (!checked && !editKbEnableOpenDataLoader) return;
                        setEditKbEnableDocling(checked);
                        if (!checked || !editKbEnableOpenDataLoader) {
                          setEditKbEnableDedup(false);
                        }
                      }}
                      className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                    />
                    <div className="flex-1">
                      <strong className="block text-gray-900 text-xs font-semibold">1. IBM Docling</strong>
                      <span className="text-[10px] text-gray-500">Primary structural parser</span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer ${editKbEnableOpenDataLoader ? 'bg-blue-50/70 border-blue-300 text-blue-950 shadow-xs' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}>
                    <input
                      type="checkbox"
                      checked={editKbEnableOpenDataLoader}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        if (!checked && !editKbEnableDocling) return;
                        setEditKbEnableOpenDataLoader(checked);
                        if (!checked || !editKbEnableDocling) {
                          setEditKbEnableDedup(false);
                        }
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4"
                    />
                    <div className="flex-1">
                      <strong className="block text-gray-900 text-xs font-semibold">2. OpenDataLoader</strong>
                      <span className="text-[10px] text-gray-500">Layout & PyMuPDF engine</span>
                    </div>
                  </label>
                </div>

                <div className={`flex items-center justify-between pt-2 border-t border-slate-200/80 transition-opacity ${editKbEnableDocling && editKbEnableOpenDataLoader ? 'opacity-100' : 'opacity-50'
                  }`}>
                  <div>
                    <span className="block text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      Enable Paragraph & Boilerplate Deduplication
                      {!(editKbEnableDocling && editKbEnableOpenDataLoader) && (
                        <span className="px-1.5 py-0.5 bg-gray-150 text-gray-500 rounded text-[9px] font-medium">
                          Requires Both Parsers
                        </span>
                      )}
                    </span>
                    <span className="block text-[10px] text-gray-400">
                      Filters duplicate boilerplate & cross-parser redundant blocks (disabled by default)
                    </span>
                  </div>
                  <label className={`relative inline-flex items-center ${editKbEnableDocling && editKbEnableOpenDataLoader ? 'cursor-pointer' : 'cursor-not-allowed'
                    }`}>
                    <input
                      type="checkbox"
                      disabled={!(editKbEnableDocling && editKbEnableOpenDataLoader)}
                      checked={editKbEnableDocling && editKbEnableOpenDataLoader && editKbEnableDedup}
                      onChange={(e) => setEditKbEnableDedup(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
                  </label>
                </div>
              </div>

              {/* METADATA EXTRACTION PROMPT */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Metadata Extraction Prompt <span className="text-[10px] text-gray-400 font-normal">(Optional Override)</span>
                </label>
                <textarea
                  value={editKbExtractionPrompt}
                  onChange={(e) => setEditKbExtractionPrompt(e.target.value)}
                  placeholder="e.g. You are a precise entity extractor. Extract invoice number, total amount, vendor, and dates into JSON..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-900 bg-white font-mono placeholder:text-gray-400"
                />
                <p className="mt-1 text-[10px] text-gray-400">
                  Used when Knowledge Base is linked to a Domain to customize or override JSON metadata extraction instructions.
                </p>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditKbModal(false)}
                  className="flex-1 py-2.5 bg-gray-150 hover:bg-gray-200 text-gray-755 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingKb || !editKbName.trim() || isDimensionMismatch}
                  className="flex-1 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {savingKb ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Edit Modal */}
      {showEditDocModal && editDoc && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-255 flex items-center justify-between">
              <h3 className="font-bold text-gray-850 text-sm uppercase tracking-wider">
                Edit Document
              </h3>
              <button
                onClick={() => {
                  setShowEditDocModal(false);
                  setEditDoc(null);
                }}
                className="text-gray-400 hover:text-gray-600 font-bold text-xs"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveDoc} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-655">File Name</label>
                <input
                  type="text"
                  required
                  value={editDocName}
                  onChange={(e) => setEditDocName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-655">Description</label>
                <textarea
                  value={editDocDesc}
                  onChange={(e) => setEditDocDesc(e.target.value)}
                  placeholder="Describe the document contents..."
                  className="h-20 w-full border border-gray-300 rounded-lg px-4 py-2.5 text-xs bg-white text-black focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-655">Document Type</label>
                <select
                  value={editDocType}
                  onChange={(e) => setEditDocType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-xs bg-white text-black focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {(docTypes && docTypes.length > 0
                    ? docTypes
                    : ['General', 'Policy', 'FAQ', 'Technical', 'Contract']
                  ).map((type) => (
                    <option key={type} value={type.toLowerCase()}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-655">Tags</label>
                <TagInput tags={editDocTags} onChange={setEditDocTags} />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditDocModal(false);
                    setEditDoc(null);
                  }}
                  className="flex-1 py-2.5 bg-gray-150 hover:bg-gray-200 text-gray-755 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDoc || !editDocName.trim()}
                  className="flex-1 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {savingDoc ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Pencil className="w-3.5 h-3.5" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* EXPANDED SLIDER WINDOW: 3 SECTIONS (Dockling, OpenDataLoader, Extracted JSON) */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* UNIFIED 3-WAY SPLIT VIEW INSPECTOR (Text Extracted, JSON Metadata, Entities) */}
      {/* ========================================================================= */}
      {showEkpInspectModal && selectedEkpDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-end z-[120] animate-fade-in">
          <div className="bg-white h-full shadow-2xl flex flex-col border-l border-gray-200 overflow-hidden animate-in slide-in-from-right duration-200 w-full max-w-[96vw]">
            {/* DRAWER HEADER */}
            <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-purple-500/20 text-purple-300 rounded-lg shrink-0">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-white truncate max-w-md">
                      {selectedEkpDoc.file_name || selectedEkpDoc.name || 'Document Details'}
                    </h3>
                    <span className="text-[10px] font-mono bg-purple-900/80 text-purple-200 px-2 py-0.5 rounded uppercase font-semibold border border-purple-700/50">
                      3-Way Extraction Inspector
                    </span>
                    <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                      {selectedEkpDoc.status || 'ready'}
                    </span>
                    {ekpViewsData?.comparison_report && (
                      <span className="text-[10px] font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800 font-semibold">
                        {((ekpViewsData.comparison_report.jaccard_overlap_ratio || 0.95) * 100).toFixed(1)}% Cross-Match
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                    ID: {selectedEkpDoc.id} · Size: {formatBytes(selectedEkpDoc.file_size)} · Chunks: {selectedEkpDoc.chunk_count ?? 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {ekpLoading && (
                  <span className="text-xs text-purple-300 flex items-center gap-1.5 font-medium">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading Extraction...
                  </span>
                )}
                <button
                  onClick={() => {
                    setShowEkpInspectModal(false);
                    setSelectedEkpDoc(null);
                    setEditingEntityId(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Close Inspector"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* DRAWER MAIN CONTENT: 3-WAY SPLIT VIEW */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 overflow-hidden bg-slate-100/50">
                {/* ========================================================================= */}
                {/* COLUMN 1: TEXT EXTRACTED (Both Parsers or Single) */}
                {/* ========================================================================= */}
                {(() => {
                  const currentParserData = activeTextParser === 'docling' ? doclingData : openDataLoaderData;
                  const currentRawText = currentParserData.rawText;
                  const currentSpans = currentParserData.spans || [];
                  const filteredSpans = currentSpans.filter((s: any) => {
                    if (!textSearch) return true;
                    const t = (s.text || s.text_content || '').toLowerCase();
                    return t.includes(textSearch.toLowerCase());
                  });

                  return (
                    <div className="flex flex-col h-full overflow-hidden bg-white">
                      {/* Column 1 Header */}
                      <div className="p-3 border-b border-gray-200 bg-emerald-50/50 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded bg-emerald-600 text-white">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-slate-900">1. Text Extracted</h4>
                            <p className="text-[10px] text-emerald-800 font-medium">Dual/Single Parser Text Stream</p>
                          </div>
                        </div>

                        {/* Parser Selectors & Copy */}
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center bg-white p-0.5 rounded-lg border border-emerald-200 text-[10px] font-semibold shadow-2xs">
                            <button
                              onClick={() => setActiveTextParser('docling')}
                              className={`px-2 py-0.5 rounded cursor-pointer transition-all ${activeTextParser === 'docling'
                                ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                                : 'text-gray-600 hover:text-emerald-800'
                                }`}
                              title="IBM Docling Parser"
                            >
                              Docling ({doclingData.spans.length})
                            </button>
                            <button
                              onClick={() => setActiveTextParser('opendataloader')}
                              className={`px-2 py-0.5 rounded cursor-pointer transition-all ${activeTextParser === 'opendataloader'
                                ? 'bg-blue-600 text-white font-bold shadow-2xs'
                                : 'text-gray-600 hover:text-blue-800'
                                }`}
                              title="OpenDataLoader / PyMuPDF Secondary Parser"
                            >
                              OpenDataLoader ({openDataLoaderData.spans.length})
                            </button>
                          </div>

                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(currentRawText);
                              setCopiedText(true);
                              setTimeout(() => setCopiedText(false), 2000);
                            }}
                            className="p-1.5 rounded text-slate-400 hover:text-emerald-700 hover:bg-white transition-colors cursor-pointer"
                            title="Copy Extracted Text"
                          >
                            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Column 1 Search & Subview Toggle */}
                      <div className="p-2 border-b border-gray-100 bg-white flex items-center gap-2 shrink-0">
                        <div className="relative flex-1">
                          <Search className="w-3 h-3 text-gray-400 absolute left-2 top-2" />
                          <input
                            type="text"
                            placeholder="Search extracted text..."
                            value={textSearch}
                            onChange={(e) => setTextSearch(e.target.value)}
                            className="w-full pl-7 pr-2 py-1 text-xs border border-gray-200 rounded-md bg-gray-50 focus:bg-white text-slate-900 focus:outline-hidden"
                          />
                        </div>
                        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-gray-200 text-[10px] font-semibold shrink-0">
                          <button
                            onClick={() => setTextSubView('spans')}
                            className={`px-2 py-0.5 rounded cursor-pointer ${textSubView === 'spans' ? 'bg-white text-emerald-700 font-bold shadow-2xs' : 'text-gray-500'
                              }`}
                          >
                            Spans ({currentSpans.length})
                          </button>
                          <button
                            onClick={() => setTextSubView('text')}
                            className={`px-2 py-0.5 rounded cursor-pointer ${textSubView === 'text' ? 'bg-white text-emerald-700 font-bold shadow-2xs' : 'text-gray-500'
                              }`}
                          >
                            Raw Text
                          </button>
                        </div>
                      </div>

                      {/* Column 1 Body */}
                      <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {textSubView === 'text' ? (
                          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-200 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                            {currentRawText || `No raw text stream recorded from ${activeTextParser === 'docling' ? 'Docling' : 'OpenDataLoader'}.`}
                          </div>
                        ) : (
                          filteredSpans.length === 0 ? (
                            <div className="p-8 text-center text-xs border border-dashed border-gray-300 rounded-xl text-gray-400">
                              {currentSpans.length === 0
                                ? `No spans recorded for ${activeTextParser === 'docling' ? 'Docling' : 'OpenDataLoader'} parser.`
                                : 'No spans matched your search.'}
                            </div>
                          ) : (
                            filteredSpans.map((s: any, idx: number) => {
                              const isRecovered = s.source_parser?.includes('recovered');
                              return (
                                <div
                                  key={s.span_id || `span_${activeTextParser}_${idx}`}
                                  className={`p-2.5 rounded-lg border transition-colors text-xs space-y-1 shadow-2xs ${isRecovered
                                    ? 'border-amber-300 bg-amber-50/50'
                                    : 'border-gray-200 bg-white hover:border-emerald-300'
                                    }`}
                                >
                                  <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono text-emerald-700 font-bold">
                                        {s.span_id || `P${s.page_number || 1}-S${s.paragraph_index || idx}`}
                                      </span>
                                      {isRecovered && (
                                        <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-bold text-[9px] uppercase">
                                          Recovered
                                        </span>
                                      )}
                                    </div>
                                    <span>
                                      Page {s.page_number || 1} {s.block_type && `· ${s.block_type}`}
                                    </span>
                                  </div>
                                  <p className="text-gray-800 leading-relaxed font-sans text-xs">
                                    {s.text || s.text_content}
                                  </p>
                                  {s.bbox && (
                                    <span className="text-[9px] font-mono text-gray-400 block pt-0.5">
                                      bbox: [{s.bbox.map((n: number) => n.toFixed(1)).join(', ')}]
                                    </span>
                                  )}
                                </div>
                              );
                            })
                          )
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* ========================================================================= */}
                {/* COLUMN 2: JSON METADATA (Structured JSON Code) */}
                {/* ========================================================================= */}
                <div className="flex flex-col h-full overflow-hidden bg-white">
                  {/* Column 2 Header */}
                  <div className="p-3 border-b border-gray-200 bg-purple-50/50 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-purple-600 text-white">
                        <FileJson className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">2. JSON Metadata</h4>
                        <p className="text-[10px] text-purple-800 font-medium">Structured Schema & Domain Data</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${jsonExtractedData.isExtracted
                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                        : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}>
                        {jsonExtractedData.isExtracted ? 'JSON Extracted' : 'Not Extracted'}
                      </span>
                      {jsonExtractedData.isExtracted && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(prettifiedEntitiesJson);
                            setCopiedJson(true);
                            setTimeout(() => setCopiedJson(false), 2000);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-purple-700 hover:bg-white transition-colors cursor-pointer"
                          title="Copy JSON Metadata"
                        >
                          {copiedJson ? <Check className="w-3.5 h-3.5 text-purple-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Column 2 Body */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {!jsonExtractedData.isExtracted ? (
                      <div className="p-6 text-center border border-dashed border-purple-200 rounded-xl bg-purple-50/20 space-y-3 my-auto">
                        <div className="w-10 h-10 mx-auto rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                          <FileJson className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-bold text-xs text-slate-800">No Structured JSON Metadata</h5>
                          <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                            Domain JSON extraction has not been executed yet for this document.
                          </p>
                        </div>
                        <button
                          onClick={() => handleReprocessDocument(selectedEkpDoc.id)}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Extract Domain JSON</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* ===================================================================== */}
                        {/* BLOCK COMMENT: MODAL EXTRACTED DOMAIN BADGE */}
                        {/* Only renders when a linked domain with valid domain_name is present */}
                        {/* ===================================================================== */}
                        {jsonExtractedData.domainInfo && jsonExtractedData.domainInfo.domain_name && (
                          <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-xs flex items-center justify-between">
                            <span className="font-bold text-indigo-900 text-xs">
                              🏷️ Domain: {jsonExtractedData.domainInfo.domain_name} ({jsonExtractedData.domainInfo.domain_key || ''})
                            </span>
                            {jsonExtractedData.domainInfo.status_note && (
                              <span className="text-xs text-amber-700 font-semibold">⚠️ {jsonExtractedData.domainInfo.status_note}</span>
                            )}
                          </div>
                        )}
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-emerald-400 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                          {prettifiedEntitiesJson}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* COLUMN 3: ENTITIES EXTRACTED */}
                {/* ========================================================================= */}
                {(() => {
                  const filteredEntities = (jsonExtractedData.entities || []).filter((ent: any) => {
                    if (!entitySearch) return true;
                    const q = entitySearch.toLowerCase();
                    const k = (ent.entity_key || '').toLowerCase();
                    const t = (ent.entity_type || '').toLowerCase();
                    const v = (typeof ent.value === 'object' ? JSON.stringify(ent.value) : String(ent.value || '')).toLowerCase();
                    return k.includes(q) || t.includes(q) || v.includes(q);
                  });

                  return (
                    <div className="flex flex-col h-full overflow-hidden bg-white">
                      {/* Column 3 Header */}
                      <div className="p-3 border-b border-gray-200 bg-indigo-50/50 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded bg-indigo-600 text-white">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-slate-900">3. Entities Extracted</h4>
                            <p className="text-[10px] text-indigo-800 font-medium">Domain Entities & Field Values</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 font-mono">
                            {jsonExtractedData.entities.length} Entities
                          </span>
                          {jsonExtractedData.entities.length > 0 && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify(jsonExtractedData.entities, null, 2));
                                setCopiedEntitiesJson(true);
                                setTimeout(() => setCopiedEntitiesJson(false), 2000);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-indigo-700 hover:bg-white transition-colors cursor-pointer"
                              title="Copy Entities JSON"
                            >
                              {copiedEntitiesJson ? <Check className="w-3.5 h-3.5 text-indigo-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Column 3 Search */}
                      <div className="p-2 border-b border-gray-100 bg-white flex items-center gap-2 shrink-0">
                        <div className="relative flex-1">
                          <Search className="w-3 h-3 text-gray-400 absolute left-2 top-2" />
                          <input
                            type="text"
                            placeholder="Search entities by key, type, or value..."
                            value={entitySearch}
                            onChange={(e) => setEntitySearch(e.target.value)}
                            className="w-full pl-7 pr-2 py-1 text-xs border border-gray-200 rounded-md bg-gray-50 focus:bg-white text-slate-900 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      {/* Column 3 Body */}
                      <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {filteredEntities.length === 0 ? (
                          <div className="p-8 text-center text-xs border border-dashed border-gray-300 rounded-xl text-gray-400">
                            {jsonExtractedData.entities.length === 0
                              ? 'No entities extracted for this document.'
                              : 'No entities match your search filter.'}
                          </div>
                        ) : (
                          filteredEntities.map((ent: any) => {
                            const isEditing = editingEntityId === ent.id;
                            return (
                              <div
                                key={ent.id}
                                className="p-2.5 rounded-lg border border-gray-200 bg-white hover:border-indigo-300 transition-colors text-xs space-y-1.5 shadow-2xs"
                              >
                                {isEditing ? (
                                  <div className="space-y-2 p-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-indigo-700">Editing Entity</span>
                                      <button
                                        onClick={() => setEditingEntityId(null)}
                                        className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                    <input
                                      type="text"
                                      value={editEntityForm.entity_key}
                                      onChange={(e) => setEditEntityForm((prev) => ({ ...prev, entity_key: e.target.value }))}
                                      className="w-full border rounded px-2 py-1 text-xs bg-white text-black"
                                      placeholder="Entity Key"
                                    />
                                    <textarea
                                      rows={2}
                                      value={editEntityForm.value}
                                      onChange={(e) => setEditEntityForm((prev) => ({ ...prev, value: e.target.value }))}
                                      className="w-full border rounded px-2 py-1 text-xs bg-white text-black resize-none"
                                    />
                                    <button
                                      onClick={() => handleSaveEntity(ent.id)}
                                      disabled={savingEntity}
                                      className="w-full py-1 rounded text-xs font-semibold bg-primary text-white cursor-pointer"
                                    >
                                      Save Entity
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] font-bold uppercase shrink-0">
                                          {ent.entity_type}
                                        </span>
                                        <span className="font-bold text-xs text-slate-900 truncate">
                                          {formatEntityKey(ent.entity_key, ent.entity_type)}
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => startEditEntity(ent)}
                                        className="p-1 rounded text-slate-400 hover:text-indigo-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                                        title="Edit Entity"
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <p className="text-xs text-slate-800 font-medium leading-relaxed bg-slate-50/70 p-2 rounded border border-slate-150 break-words">
                                      {typeof ent.value === 'object' ? JSON.stringify(ent.value) : String(ent.value)}
                                    </p>
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                                      <span>Confidence: <strong>{((ent.confidence ?? 1.0) * 100).toFixed(0)}%</strong></span>
                                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${ent.basis === 'FACT' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                                        }`}>
                                        {ent.basis || 'FACT'}
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* DRAWER FOOTER */}
            <div className="p-3.5 border-t border-gray-200 flex items-center justify-between shrink-0 bg-slate-50">
              <span className="text-xs font-medium text-slate-500">
                Dockling: {doclingData.spans.length} Spans · OpenDataLoader: {openDataLoaderData.spans.length} Spans · Entities: {jsonExtractedData.entities.length}
              </span>
              <button
                onClick={() => {
                  setShowEkpInspectModal(false);
                  setSelectedEkpDoc(null);
                  setEditingEntityId(null);
                }}
                className="px-4 py-1.5 bg-primary hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-opacity cursor-pointer shadow-2xs"
              >
                Done Viewing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4-SECOND NOTIFICATION SNACKBAR */}
      {snackbar && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-200 transition-all bg-white border-slate-200 text-slate-800">
          {snackbar.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : snackbar.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-blue-500 shrink-0" />
          )}
          <span className="font-medium text-slate-800 pr-1">{snackbar.message}</span>
          <button
            onClick={() => setSnackbar(null)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
}
