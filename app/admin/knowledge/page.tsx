'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Upload, 
  RefreshCw, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  ChevronRight,
  Database,
  ArrowLeft,
  Info
} from 'lucide-react';
import { api } from '@/lib/api';

type KnowledgeBase = {
  id: number;
  name: string;
  description?: string;
  status: string;
  embedding_model?: string;
  vector_dimension?: number;
  created_at: string;
};

type KnowledgeDocument = {
  id: number;
  name: string;
  status: string;
  file_size?: number;
  chunk_count: number;
  error_message?: string;
  created_at: string;
};

export default function KnowledgeBasePage() {
  const router = useRouter();
  const [kbList, setKbList] = useState<KnowledgeBase[]>([]);
  const [selectedKb, setSelectedKb] = useState<KnowledgeBase | null>(null);
  const [docList, setDocList] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [docsLoading, setDocsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docError, setDocError] = useState<string | null>(null);

  // KB Form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKbName, setNewKbName] = useState('');
  const [newKbDesc, setNewKbDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // File Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Auth checking
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    api.getCurrentUser()
      .then((user) => {
        if (user.role !== 'admin' && user.role !== 'system_admin') {
          router.push('/workflow-builder');
        }
      })
      .catch(() => {
        api.logout();
        router.push('/login');
      });
  }, [router]);

  // Load KBs on mount
  const fetchKBs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getKnowledgeBases();
      setKbList(data || []);
      if (data && data.length > 0 && !selectedKb) {
        setSelectedKb(data[0]);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to load Knowledge Bases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKBs();
  }, []);

  // Load Documents when KB selection changes
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

  useEffect(() => {
    if (selectedKb) {
      fetchDocs(selectedKb.id);
    } else {
      setDocList([]);
    }
  }, [selectedKb]);

  const handleCreateKB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKbName.trim()) return;

    setCreating(true);
    setError(null);
    try {
      const newKb = await api.createKnowledgeBase({
        name: newKbName,
        description: newKbDesc
      });
      setKbList(prev => [...pr
      setSelectedKb(newKb);
      setShowCreateModal(false);
      setNewKbName('');
      setNewKbDesc('');
    } catch (err: any) {
      console.error(err);
      setError('Failed to create Knowledge Base.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKB = async (id: number) => {
    if (!confirm('Are you sure you want to delete this Knowledge Base? This will permanently drop its physical Qdrant vector collection and clean up all metadata, database chunks, and documents.')) {
      return;
    }

    setError(null);
    try {
      await api.deleteKnowledgeBase(id);
      const updatedList = kbList.filter(kb => kb.id !== id);
      setKbList(updatedList);
      if (selectedKb?.id === id) {
        setSelectedKb(updatedList.length > 0 ? updatedList[0] : null);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to delete Knowledge Base.');
    }
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKb || !uploadFile) return;

    // Validate size (50MB check)
    if (uploadFile.size > 50 * 1024 * 1024) {
      alert('File size exceeds the 50 MB limit.');
      return;
    }

    // Validate extension
    const allowedExtensions = ['.txt', '.pdf', '.doc', '.docx'];
    const extension = uploadFile.name.substring(uploadFile.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      alert(`Invalid file extension. Allowed extensions: ${allowedExtensions.join(', ')}`);
      return;
    }

    setUploading(true);
    setUploadProgress('Uploading & chunking document...');
    setDocError(null);
    try {
      await api.uploadDocument(selectedKb.id, uploadFile);
      setUploadFile(null);
      // Reset input element
      const fileInput = document.getElementById('kb-file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Reload document list
      fetchDocs(selectedKb.id);
      setUploadProgress(null);
    } catch (err: any) {
      console.error(err);
      setDocError(err.message || 'Ingestion failed.');
      setUploadProgress(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (docId: number) => {
    if (!selectedKb) return;
    if (!confirm('Are you sure you want to delete this document? This will remove all chunks and Qdrant points.')) {
      return;
    }

    setDocError(null);
    try {
      await api.deleteDocument(selectedKb.id, docId);
      setDocList(prev => prev.filter(doc => doc.id !== docId));
    } catch (err: any) {
      console.error(err);
      setDocError('Failed to delete document.');
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/admin?tab=nodes" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="h-6 w-[1px] bg-slate-200" />
          <Database className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Knowledge Bases</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => selectedKb && fetchDocs(selectedKb.id)}
            disabled={docsLoading || !selectedKb}
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${docsLoading ? 'animate-spin' : ''}`} />
            Refresh status
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Knowledge Base
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Side: Knowledge Base List */}
        <section className="w-1/3 bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden">
          <div className="p-4 bg-slate-50/50 border-b border-slate-200">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Databases</h2>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                Loading knowledge bases...
              </div>
            ) : kbList.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No knowledge bases found. Create one to begin.
              </div>
            ) : (
              kbList.map((kb) => {
                const isSelected = selectedKb?.id === kb.id;
                return (
                  <div
                    key={kb.id}
                    onClick={() => setSelectedKb(kb)}
                    className={`p-4 flex items-start justify-between cursor-pointer transition-all hover:bg-slate-50/80 ${
                      isSelected ? 'bg-blue-50/40 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="space-y-1 pr-3">
                      <h3 className={`font-semibold text-sm ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                        {kb.name}
                      </h3>
                      {kb.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {kb.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          ID: {kb.id}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500 font-medium">
                          {kb.embedding_model || 'Standard Embeddings'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteKB(kb.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-100 transition-colors"
                      title="Delete Knowledge Base"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Right Side: Selected Knowledge Base Details & Documents */}
        <section className="flex-1 bg-slate-50 flex flex-col h-full overflow-hidden">
          {selectedKb ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* KB Meta Header */}
              <div className="bg-white border-b border-slate-200 p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{selectedKb.name}</h2>
                  {selectedKb.description && (
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">{selectedKb.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Collection Name</span>
                    <span className="text-xs font-semibold text-slate-700 font-mono">kb_collection_{selectedKb.id}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Embedding Model</span>
                    <span className="text-xs font-semibold text-slate-700">{selectedKb.embedding_model || 'text-embedding-3-small'}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Status</span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 capitalize mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      {selectedKb.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Documents Area */}
              <div className="flex-1 flex overflow-hidden">
                {/* Document Table (List View) */}
                <div className="flex-1 p-6 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ingested Documents</h3>
                    <span className="text-xs text-slate-500 font-medium bg-white px-2.5 py-1 rounded-full border border-slate-200">
                      {docList.length} total files
                    </span>
                  </div>

                  {docError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-xs font-medium flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      {docError}
                    </div>
                  )}

                  <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                    <div className="overflow-x-auto flex-1">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50 sticky top-0">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">File Name</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Size</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Chunks</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {docsLoading && docList.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                                Loading documents...
                              </td>
                            </tr>
                          ) : docList.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                No documents uploaded. Drag and drop a file on the right side.
                              </td>
                            </tr>
                          ) : (
                            docList.map((doc) => {
                              const isPending = doc.status === 'pending';
                              const isCompleted = doc.status === 'completed';
                              const isFailed = doc.status === 'failed';
                              const isArchived = doc.status === 'archived';

                              return (
                                <tr key={doc.id} className={isArchived ? 'bg-slate-50 opacity-60' : ''}>
                                  <td className="px-6 py-4 max-w-xs truncate font-medium text-xs text-slate-800" title={doc.name}>
                                    <div className="flex items-center gap-2">
                                      <FileText className={`w-4 h-4 shrink-0 ${isArchived ? 'text-slate-400' : 'text-blue-500'}`} />
                                      <span className="truncate">{doc.name}</span>
                                      {isArchived && <span className="text-[9px] bg-slate-200 px-1 py-0.5 rounded text-slate-500">Archived</span>}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                                    {formatBytes(doc.file_size)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                                    {doc.chunk_count}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-xs">
                                    {isCompleted && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 border border-green-200 text-green-700">
                                        <CheckCircle className="w-3 h-3 text-green-500" /> Completed
                                      </span>
                                    )}
                                    {isPending && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-700">
                                        <Clock className="w-3 h-3 text-amber-500 animate-pulse" /> Pending
                                      </span>
                                    )}
                                    {isFailed && (
                                      <span 
                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 border border-red-200 text-red-700 cursor-help"
                                        title={doc.error_message || 'Ingestion failed.'}
                                      >
                                        <AlertTriangle className="w-3 h-3 text-red-500" /> Failed
                                      </span>
                                    )}
                                    {isArchived && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-500">
                                        Archived
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                                    <button
                                      onClick={() => handleDeleteDoc(doc.id)}
                                      className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-50 transition-colors"
                                      title="Delete Document"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Upload Side Panel */}
                <div className="w-80 border-l border-slate-200 bg-white p-6 shrink-0 flex flex-col h-full justify-between">
                  <form onSubmit={handleUploadFile} className="space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Ingest Document</h4>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Upload text, markdown, or PDF files to index them inside the vector store.
                      </p>
                    </div>

                    <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-6 transition-colors relative flex flex-col items-center justify-center text-center cursor-pointer min-h-[160px]">
                      <input
                        type="file"
                        id="kb-file-upload"
                        disabled={uploading}
                        accept=".txt,.pdf,.doc,.docx"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload className="w-8 h-8 text-slate-350 mb-2" />
                      {uploadFile ? (
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-800 line-clamp-1">{uploadFile.name}</p>
                          <p className="text-[10px] text-slate-400">{formatBytes(uploadFile.size)}</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-600">Select file to upload</p>
                          <p className="text-[9px] text-slate-400 font-medium">PDF, TXT, DOC, DOCX up to 50MB</p>
                        </div>
                      )}
                    </div>

                    {uploadProgress && (
                      <div className="bg-blue-50 border border-blue-100 text-blue-700 p-3 rounded-lg text-[10px] font-medium flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0 text-blue-500" />
                        {uploadProgress}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={uploading || !uploadFile}
                      className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      Upload File
                    </button>
                  </form>

                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-2">
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-blue-500" />
                      Version control info
                    </h5>
                    <p className="text-[10px] text-slate-450 leading-normal">
                      Uploading a document with the exact same name will archive the old version and delete its indices, keeping only the latest version searchable.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <Database className="w-12 h-12 text-slate-200 mb-3" />
              <h3 className="font-semibold text-slate-700 text-sm mb-1">No Knowledge Base Selected</h3>
              <p className="text-xs text-slate-400 max-w-sm leading-normal">
                Select a knowledge base on the left or create a new one to start indexing files.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* KB Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">New Knowledge Base</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateKB} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600">Knowledge Base Name</label>
                <input
                  type="text"
                  required
                  value={newKbName}
                  onChange={(e) => setNewKbName(e.target.value)}
                  placeholder="e.g. Sales Documentation"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600">Description</label>
                <textarea
                  value={newKbDesc}
                  onChange={(e) => setNewKbDesc(e.target.value)}
                  placeholder="Summarize the files stored here (optional)..."
                  className="h-24 w-full border border-slate-300 rounded-lg px-4 py-2.5 text-xs bg-white text-black focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={creating || !newKbName.trim()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {creating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Create Database
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
