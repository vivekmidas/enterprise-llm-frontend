'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { TagInput, getColor } from '@/lib/tag-utils';
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

  const [kbList, setKbList] = useState<any[]>([]);
  const [selectedKb, setSelectedKb] = useState<any>(null);
  const [docList, setDocList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [docsLoading, setDocsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docError, setDocError] = useState<string | null>(null);

  // KB Form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKbName, setNewKbName] = useState('');
  const [newKbPurpose, setNewKbPurpose] = useState('');
  const [newKbTags, setNewKbTags] = useState('');
  const [creating, setCreating] = useState(false);

  // Doc Form state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [docDescription, setDocDescription] = useState('');
  const [docTags, setDocTags] = useState('');
  const [docType, setDocType] = useState('general');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Custom Doc Types state
  const [showDocTypesModal, setShowDocTypesModal] = useState(false);
  const [docTypes, setDocTypes] = useState<string[]>([]);
  const [newDocType, setNewDocType] = useState('');
  const [savingDocTypes, setSavingDocTypes] = useState(false);

  // EKP Inspect Modal state
  const [ekpLoading, setEkpLoading] = useState(false);
  const [selectedEkpDoc, setSelectedEkpDoc] = useState<any>(null);
  const [showEkpInspectModal, setShowEkpInspectModal] = useState(false);
  const [ekpParagraphs, setEkpParagraphs] = useState<any[]>([]);
  const [ekpEntities, setEkpEntities] = useState<any[]>([]);
  const [activeInspectTab, setActiveInspectTab] = useState<'paragraphs' | 'entities'>('paragraphs');
  const [entityDisplayMode, setEntityDisplayMode] = useState<'cards' | 'json'>('cards');
  const [copiedJson, setCopiedJson] = useState(false);

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

  // Reconstruct prettified structured JSON object from extracted entities
  const prettifiedEntitiesJson = useMemo(() => {
    if (!ekpEntities || ekpEntities.length === 0) return '{}';
    const result: Record<string, any> = {};

    ekpEntities.forEach((ent) => {
      let parsedVal = ent.value;
      if (typeof parsedVal === 'string' && (parsedVal.trim().startsWith('{') || parsedVal.trim().startsWith('['))) {
        try {
          parsedVal = JSON.parse(parsedVal);
        } catch (_) {}
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
  }, [ekpEntities]);

  const fetchEkpDocDetails = async (doc: any) => {
    setSelectedEkpDoc(doc);
    setEkpLoading(true);
    setShowEkpInspectModal(true);
    try {
      const [pRes, eRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/v3/knowledge/documents/${doc.id}/paragraphs`, { headers: getHeaders() }),
        fetch(`${BACKEND_URL}/api/v3/knowledge/documents/${doc.id}/entities`, { headers: getHeaders() }),
      ]);
      if (pRes.ok) {
        const pData = await pRes.json();
        setEkpParagraphs(pData);
      } else {
        setEkpParagraphs([]);
      }
      if (eRes.ok) {
        const eData = await eRes.json();
        setEkpEntities(eData);
      } else {
        setEkpEntities([]);
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
      } catch (_) {}

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
  const [newKbEmbeddingModel, setNewKbEmbeddingModel] = useState('nomic-embed-text');
  const [newKbChunkSize, setNewKbChunkSize] = useState<number>(1000);
  const [newKbChunkOverlap, setNewKbChunkOverlap] = useState<number>(200);

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

  const refreshDocStatus = async (docId: number) => {
    if (!selectedKb) return;
    setFetchingDocIds((prev) => ({ ...prev, [docId]: true }));
    try {
      const updatedDoc = await api.getDocumentStatus(selectedKb.id, docId);
      setDocList((prev) => prev.map((d) => (d.id === docId ? updatedDoc : d)));
    } catch (err) {
      console.error('Failed to refresh document status', err);
    } finally {
      setFetchingDocIds((prev) => ({ ...prev, [docId]: false }));
    }
  };

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
    fetchDocTypes();
    api.getUsers()
      .then((users: any[]) => {
        const map: Record<number, string> = {};
        (users || []).forEach((u: any) => {
          map[u.id] = u.name || u.username || u.email || `User #${u.id}`;
        });
        setUsersMap(map);
      })
      .catch(() => {});
  }, [userRole]);

  useEffect(() => {
    fetchKBs(selectedCustomerFilter);
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
    if (autoRefresh && selectedKb) {
      interval = setInterval(() => {
        fetchDocs(selectedKb.id);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, selectedKb]);

  const handleCreateKB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKbName.trim()) return;

    setCreating(true);
    setError(null);
    try {
      const tagsList = newKbTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const selectedModel = EMBEDDING_MODELS.find((m) => m.value === newKbEmbeddingModel);

      const settingsPayload: any = {
        tags: tagsList,
        embedding_model: selectedModel?.value || 'nomic-embed-text',
        vector_dimension: selectedModel?.dimension || 768,
        chunk_size: Number(newKbChunkSize) || 1000,
        chunk_overlap: Number(newKbChunkOverlap) || 200,
      };
      if (isSystemAdmin && createKbTargetCustomer) {
        settingsPayload.customer_id = Number(createKbTargetCustomer);
      }

      const newKb = await api.createKnowledgeBase({
        name: newKbName,
        description: newKbPurpose,
        settings: settingsPayload,
      });
      setKbList((prev) => [...prev, newKb]);
      setSelectedKb(newKb);
      setShowCreateModal(false);
      setNewKbName('');
      setNewKbPurpose('');
      setNewKbTags('');
      setNewKbEmbeddingModel('nomic-embed-text');
      setNewKbChunkSize(1000);
      setNewKbChunkOverlap(200);
    } catch (err: any) {
      console.error(err);
      setError('Failed to create Knowledge Base.');
    } finally {
      setCreating(false);
    }
  };
/* END BLOCK */

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
    const allowed = ['.txt', '.pdf', '.doc', '.docx'];
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

  const handleDeleteDoc = async (docId: number) => {
    if (!selectedKb) return;
    if (
      !confirm(
        'Are you sure you want to delete this document? This will remove all chunks and Qdrant points.',
      )
    ) {
      return;
    }

    setDocError(null);
    try {
      await api.deleteDocument(selectedKb.id, docId);
      setDocList((prev) => prev.filter((doc) => doc.id !== docId));
    } catch (err: any) {
      console.error(err);
      setDocError('Failed to delete document.');
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
    setEditKbName(kb.name);
    setEditKbDesc(kb.description || '');
    setEditKbPurpose(kb.settings?.purpose || '');
    setEditKbTags(Array.isArray(kb.settings?.tags) ? kb.settings.tags : []);
    setEditKbEmbeddingModel(kb.settings?.embedding_model || 'nomic-embed-text');
    setEditKbVectorDimension(kb.settings?.vector_dimension || 768);
    setEditKbChunkSize(kb.settings?.chunk_size || 1000);
    setEditKbChunkOverlap(kb.settings?.chunk_overlap || 200);
    setShowEditKbModal(true);
  };

  const handleSaveKb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKb || !editKbName.trim()) return;

    setSavingKb(true);
    setError(null);
    try {
      const updatedKb = await api.updateKnowledgeBase(selectedKb.id, {
        name: editKbName,
        description: editKbDesc || undefined,
        settings: {
          ...(selectedKb.settings || {}),
          purpose: editKbPurpose || undefined,
          tags: editKbTags.length > 0 ? editKbTags : undefined,
          chunk_size: Number(editKbChunkSize),
          chunk_overlap: Number(editKbChunkOverlap),
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
    setEditDocTags(Array.isArray(doc.metadata_json?.tags) ? doc.metadata_json.tags : []);
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
        metadata: {
          ...(editDoc.metadata_json || {}),
          description: editDocDesc || undefined,
          tags: editDocTags.length > 0 ? editDocTags : undefined,
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
    <div className="flex bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-[750px] font-sans text-gray-800">
      {/* Left KB Sidebar */}
      <div className="w-1/4 border-r border-gray-200 flex flex-col h-full bg-slate-50/20">
        <div className="p-4 border-b border-gray-250 bg-gray-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Knowledge Bases
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setNewDocType('');
                if (!docTypes || docTypes.length === 0) {
                  setDocTypes(['General', 'Policy', 'FAQ', 'Technical', 'Contract']);
                }
                setShowDocTypesModal(true);
              }}
              className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-750 rounded-md transition-colors cursor-pointer"
              title="Manage Document Types"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (selectedCustomerFilter !== 'all') {
                  setCreateKbTargetCustomer(selectedCustomerFilter);
                }
                setShowCreateModal(true);
              }}
              className="p-1.5 bg-primary text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
              title="Create Knowledge Base"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

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
                  className={`p-4 flex items-start justify-between cursor-pointer transition-all hover:bg-slate-50/80 ${
                    isSelected ? 'bg-blue-50/40 border-l-4 border-bg-primary' : ''
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

                    {tags.length > 0 && (
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
                    )}
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
            ) : (
              <div className="space-y-3">
                {docList.map((doc) => {
                  const status = doc.status?.toLowerCase();
                  const isProcessing = ['processing', 'pending', 'chunking', 'embedding'].includes(
                    status,
                  );
                  const isError = ['error', 'failed'].includes(status);
                  const isSuccess = status === 'completed' || status === 'active';
                  const docTags = Array.isArray(doc.metadata_json?.tags)
                    ? doc.metadata_json.tags
                    : [];
                  const docDescription = doc.metadata_json?.description || '';
                  const docType =
                    doc.metadata_json?.type || doc.metadata_json?.doc_type || 'general';

                  return (
                    <div
                      key={doc.id}
                      className="border border-gray-150 rounded-xl p-4 flex items-start justify-between hover:bg-slate-50/30 transition-all shadow-xs"
                    >
                      <div className="space-y-2 flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-gray-800 truncate">
                            {doc.name}
                          </span>
                          <div className="relative group inline-flex items-center">
                            <select
                              value={docType.toLowerCase()}
                              disabled={updatingDocTypeIds[doc.id]}
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
                            className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                              isSuccess
                                ? 'bg-green-50 text-green-700'
                                : isProcessing
                                  ? 'bg-amber-50 text-amber-705 animate-pulse'
                                  : 'bg-red-50 text-red-750'
                            }`}
                          >
                            {doc.status || 'Unknown'}
                          </span>
                        </div>

                        {/* Metadata Details Row */}
                        <div className="flex items-center gap-3 text-xs text-gray-450 font-medium flex-wrap">
                          {docDescription && (
                            <p className="text-xs text-gray-550 leading-relaxed">
                              {docDescription}
                            </p>
                          )}
                          {docTags.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              {docTags.map((t: string) => (
                                <span
                                  key={t}
                                  style={{
                                    backgroundColor: getColor(t).bg,
                                    border: getColor(t).border,
                                    color: getColor(t).text,
                                  }}
                                  className="px-1.5 py-0.5 bg-slate-100 text-slate-655 rounded text-xs font-medium"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
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

                      {/* Operations */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => fetchEkpDocDetails(doc)}
                          className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
                          title="Inspect EKP Spans & Entities"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600" />
                        </button>
                        <button
                          onClick={() => refreshDocStatus(doc.id)}
                          disabled={fetchingDocIds[doc.id]}
                          className="p-1.5 text-gray-400 hover:text-bg-primary hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-all cursor-pointer"
                          title="Refresh Status"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 ${fetchingDocIds[doc.id] ? 'animate-spin' : ''}`}
                          />
                        </button>
                        <button
                          onClick={() => openEditDocModal(doc)}
                          className="p-1.5 text-gray-400 hover:text-bg-primary hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
                          title="Edit Document Meta"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleUploadNewVersion(doc)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
                          title="Upload New Version"
                        >
                          <Upload className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="p-1.5 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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

      {/* CREATE KB MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-155">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-255 flex items-center justify-between">
              <h3 className="font-bold text-gray-850 text-sm uppercase tracking-wider">
                Create Knowledge Base
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xs"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateKB} className="p-6 space-y-4">
              {/* BLOCK: Customer selector for system_admin */}
              {isSystemAdmin && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700">
                    Target Customer Tenant
                  </label>
                  <select
                    value={createKbTargetCustomer}
                    onChange={(e) => setCreateKbTargetCustomer(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-xs bg-white text-black focus:outline-none focus:border-blue-500 cursor-pointer"
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

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-655">
                  Knowledge Base Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Employee Handbook"
                  value={newKbName}
                  onChange={(e) => setNewKbName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-655">
                  Purpose / Description
                </label>
                <textarea
                  placeholder="Describe the domain contents..."
                  value={newKbPurpose}
                  onChange={(e) => setNewKbPurpose(e.target.value)}
                  className="h-20 w-full border border-gray-300 rounded-lg px-4 py-2.5 text-xs bg-white text-black focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-655">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. hr, policy, internal"
                  value={newKbTags}
                  onChange={(e) => setNewKbTags(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-655">Embedding Model</label>
                <select
                  value={newKbEmbeddingModel}
                  onChange={(e) => setNewKbEmbeddingModel(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-xs bg-white text-black focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {EMBEDDING_MODELS.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-655">
                    Chunk Size (Tokens)
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="4000"
                    value={newKbChunkSize}
                    onChange={(e) => setNewKbChunkSize(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-655">Chunk Overlap</label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    value={newKbChunkOverlap}
                    onChange={(e) => setNewKbChunkOverlap(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

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
                  className="flex-1 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {creating ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  Create Base
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
                    Supported: .txt, .pdf, .doc, .docx (Max 50MB per file)
                  </span>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => handleAddFilesToQueue(e.target.files)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    accept=".txt,.pdf,.doc,.docx"
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
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                item.status === 'completed'
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
                    placeholder="e.g. Q3, product"
                    value={docTags}
                    onChange={(e) => setDocTags(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
                  />
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-255 flex items-center justify-between">
              <h3 className="font-bold text-gray-850 text-sm uppercase tracking-wider">
                KB Settings: {editKbName}
              </h3>
              <button
                onClick={() => setShowEditKbModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xs"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveKb} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-655">Name</label>
                <input
                  type="text"
                  required
                  value={editKbName}
                  onChange={(e) => setEditKbName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-655">Description</label>
                <textarea
                  value={editKbDesc}
                  onChange={(e) => setEditKbDesc(e.target.value)}
                  placeholder="Describe the contents..."
                  className="h-20 w-full border border-gray-300 rounded-lg px-4 py-2.5 text-xs bg-white text-black focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-655">Purpose</label>
                <input
                  type="text"
                  value={editKbPurpose}
                  onChange={(e) => setEditKbPurpose(e.target.value)}
                  placeholder="e.g. Customer support FAQs"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Vector Store Configuration
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400 font-medium block text-[10px]">
                      Embedding Model
                    </span>
                    <span
                      className="font-semibold text-slate-800 bg-white px-2 py-1 rounded border border-slate-200 block truncate"
                      title={editKbEmbeddingModel}
                    >
                      🔒 {editKbEmbeddingModel}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block text-[10px]">
                      Vector Dimension
                    </span>
                    <span className="font-semibold text-slate-800 bg-white px-2 py-1 rounded border border-slate-200 block">
                      {editKbVectorDimension}d
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-655">Chunk Size</label>
                  <input
                    type="number"
                    min="100"
                    max="4000"
                    value={editKbChunkSize}
                    onChange={(e) => setEditKbChunkSize(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-655">Chunk Overlap</label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    value={editKbChunkOverlap}
                    onChange={(e) => setEditKbChunkOverlap(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-655">Tags</label>
                <TagInput tags={editKbTags} onChange={setEditKbTags} />
              </div>

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
                  disabled={savingKb || !editKbName.trim()}
                  className="flex-1 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {savingKb ? (
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
      {/* EKP DOCUMENT INSPECT DRAWER */}
      {showEkpInspectModal && selectedEkpDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-end z-[120] animate-fade-in">
          <div className="bg-white w-full max-w-5xl h-full shadow-2xl flex flex-col border-l border-gray-200 overflow-hidden animate-in slide-in-from-right duration-200">
            {/* DRAWER HEADER */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 text-purple-300 rounded-lg">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <span>{selectedEkpDoc.file_name || selectedEkpDoc.name || 'Document Details'}</span>
                    <span className="text-[10px] font-mono bg-purple-900/80 text-purple-200 px-2 py-0.5 rounded uppercase">
                      EKP V3 Active
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">ID: {selectedEkpDoc.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {ekpLoading && (
                  <span className="text-xs text-purple-300 flex items-center gap-1.5 font-medium">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading Spans...
                  </span>
                )}
                <button
                  onClick={() => {
                    setShowEkpInspectModal(false);
                    setSelectedEkpDoc(null);
                    setEditingEntityId(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* DRAWER MAIN CONTENT */}
            <div className="flex-1 grid grid-cols-2 divide-x overflow-hidden divide-gray-200">
              {/* LEFT VERTICAL SECTION: PARAGRAPH SPANS */}
              <div className="flex flex-col h-full overflow-hidden p-4 space-y-3 bg-slate-50/50">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <h4 className="font-bold text-xs uppercase tracking-wider flex items-center gap-2 text-slate-800">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    Original CDM Paragraph Spans ({ekpParagraphs.length})
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Source Document
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {ekpParagraphs.length === 0 ? (
                    <div className="p-8 text-center text-xs border border-dashed border-gray-300 rounded-xl text-gray-400">
                      No original document paragraph spans loaded yet.
                    </div>
                  ) : (
                    ekpParagraphs.map((p) => (
                      <div
                        key={p.span_id}
                        className="p-3 rounded-lg border space-y-1.5 hover:bg-slate-50 transition-colors text-xs bg-white border-gray-200"
                      >
                        <div className="flex items-center justify-between text-[10px] font-semibold text-gray-500">
                          <span className="font-mono text-emerald-700 font-bold">{p.span_id}</span>
                          <span>
                            Page {p.page_number} · Para {p.paragraph_number}
                          </span>
                        </div>
                        <p className="leading-relaxed font-sans text-xs text-gray-800">
                          {p.text_content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* RIGHT VERTICAL SECTION: EXTRACTED INFORMATION & ENTITIES */}
              <div className="flex flex-col h-full overflow-hidden p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <h4 className="font-bold text-xs uppercase tracking-wider flex items-center gap-2 text-slate-800">
                    <SlidersHorizontal className="w-4 h-4 text-purple-600" />
                    Extracted Information ({ekpEntities.length})
                  </h4>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      onClick={() => setEntityDisplayMode('cards')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        entityDisplayMode === 'cards'
                          ? 'bg-white text-purple-700 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <LayoutGrid className="w-3 h-3" />
                      Cards
                    </button>
                    <button
                      onClick={() => setEntityDisplayMode('json')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        entityDisplayMode === 'json'
                          ? 'bg-white text-purple-700 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Code2 className="w-3 h-3" />
                      Prettified JSON
                    </button>
                  </div>
                </div>

                {entityDisplayMode === 'json' ? (
                  <div className="flex-1 flex flex-col min-h-0 bg-slate-950 rounded-xl border border-slate-800 p-3 shadow-inner overflow-hidden">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 shrink-0">
                      <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <FileJson className="w-3.5 h-3.5 text-purple-400" />
                        Prettified LLM JSON Output
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(prettifiedEntitiesJson);
                          setCopiedJson(true);
                          setTimeout(() => setCopiedJson(false), 2000);
                        }}
                        className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-purple-300 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition-colors cursor-pointer"
                      >
                        {copiedJson ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy JSON</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="flex-1 overflow-auto text-[11px] font-mono text-emerald-400 leading-relaxed pr-2 select-text font-medium whitespace-pre-wrap">
                      {prettifiedEntitiesJson}
                    </pre>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {ekpEntities.length === 0 ? (
                      <div className="p-8 text-center text-xs border border-dashed border-gray-300 rounded-xl text-gray-400">
                        No extracted domain entities available for this document.
                      </div>
                    ) : (
                      ekpEntities.map((ent) => {
                        const isEditing = editingEntityId === ent.id;
                        return (
                          <div
                            key={ent.id}
                            className="p-3.5 rounded-xl border space-y-2 transition-all shadow-2xs bg-white border-gray-200"
                          >
                            {isEditing ? (
                              <div className="space-y-3 p-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                                    Editing Entity
                                  </span>
                                  <button
                                    onClick={() => setEditingEntityId(null)}
                                    className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                                  >
                                    Cancel
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                                      Entity Type
                                    </label>
                                    <input
                                      type="text"
                                      value={editEntityForm.entity_type}
                                      onChange={(e) =>
                                        setEditEntityForm((prev) => ({ ...prev, entity_type: e.target.value }))
                                      }
                                      className="w-full border rounded px-2 py-1 text-xs bg-white text-black mt-0.5"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                                      Entity Key
                                    </label>
                                    <input
                                      type="text"
                                      value={editEntityForm.entity_key}
                                      onChange={(e) =>
                                        setEditEntityForm((prev) => ({ ...prev, entity_key: e.target.value }))
                                      }
                                      className="w-full border rounded px-2 py-1 text-xs bg-white text-black mt-0.5"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase">
                                    Extracted Value
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={editEntityForm.value}
                                    onChange={(e) =>
                                      setEditEntityForm((prev) => ({ ...prev, value: e.target.value }))
                                    }
                                    className="w-full border rounded px-2 py-1 text-xs bg-white text-black mt-0.5 resize-none"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                                      Confidence (0.0 - 1.0)
                                    </label>
                                    <input
                                      type="number"
                                      step="0.05"
                                      min="0"
                                      max="1"
                                      value={editEntityForm.confidence}
                                      onChange={(e) =>
                                        setEditEntityForm((prev) => ({
                                          ...prev,
                                          confidence: parseFloat(e.target.value),
                                        }))
                                      }
                                      className="w-full border rounded px-2 py-1 text-xs bg-white text-black mt-0.5"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                                      Basis
                                    </label>
                                    <select
                                      value={editEntityForm.basis}
                                      onChange={(e) =>
                                        setEditEntityForm((prev) => ({ ...prev, basis: e.target.value }))
                                      }
                                      className="w-full border rounded px-2 py-1 text-xs bg-white text-black mt-0.5 cursor-pointer"
                                    >
                                      <option value="FACT">FACT</option>
                                      <option value="INFERENCE">INFERENCE</option>
                                      <option value="UNKNOWN">UNKNOWN</option>
                                    </select>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleSaveEntity(ent.id)}
                                  disabled={savingEntity}
                                  className="w-full py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-opacity bg-primary text-white"
                                >
                                  {savingEntity ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                                  Save Entity Changes
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold uppercase">
                                      {ent.entity_type}
                                    </span>
                                    <span className="font-bold text-xs text-slate-900">
                                      {formatEntityKey(ent.entity_key, ent.entity_type)}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => startEditEntity(ent)}
                                    className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                    title="Edit Entity"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <p className="text-xs text-slate-800 font-medium leading-relaxed bg-slate-50/70 p-2 rounded border border-slate-150">
                                  {typeof ent.value === 'object' ? JSON.stringify(ent.value) : String(ent.value)}
                                </p>

                                <div className="flex items-center justify-between text-[10px] font-medium text-slate-500 pt-0.5">
                                  <div className="flex items-center gap-2">
                                    <span>
                                      Confidence: <strong>{(ent.confidence * 100).toFixed(0)}%</strong>
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                        ent.basis === 'FACT'
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {ent.basis}
                                    </span>
                                  </div>
                                  {ent.provenance_span_id && (
                                    <span className="font-mono text-emerald-700 font-semibold text-[10px]">
                                      Span: {ent.provenance_span_id}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* DRAWER FOOTER */}
            <div className="p-4 border-t border-gray-200 flex items-center justify-between shrink-0 bg-slate-50">
              <span className="text-xs font-medium text-slate-500">
                {ekpParagraphs.length} Paragraph Spans · {ekpEntities.length} Domain Entities
              </span>
              <button
                onClick={() => {
                  setShowEkpInspectModal(false);
                  setSelectedEkpDoc(null);
                  setEditingEntityId(null);
                }}
                className="px-4 py-2 bg-primary hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-opacity cursor-pointer"
              >
                Done Viewing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
