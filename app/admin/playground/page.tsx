'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  SlidersHorizontal, 
  Search, 
  Settings, 
  Sparkles, 
  Clock, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  FolderOpen,
  Bookmark,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { Tooltip } from '@/app/components/Tooltip';

export interface PlaygroundTabProps {
  initialKbId?: string | null;
}

export default function PlaygroundTab({ initialKbId }: PlaygroundTabProps = {}) {
  const [kbList, setKbList] = useState<any[]>([]);
  const [selectedKbId, setSelectedKbId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingKbs, setLoadingKbs] = useState(true);
  const [runningSearch, setRunningSearch] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Metadata filter inputs
  const [metaType, setMetaType] = useState('');
  const [metaTags, setMetaTags] = useState('');

  // Configurations list
  const [savedConfigs, setSavedConfigs] = useState<any[]>([]);
  const [selectedPresetAId, setSelectedPresetAId] = useState('custom');
  const [selectedPresetBId, setSelectedPresetBId] = useState('custom');

  // Config A parameters
  const [approachA, setApproachA] = useState('hybrid');
  const [enableRrfA, setEnableRrfA] = useState(true);
  const [topKA, setTopKA] = useState(5);
  const [minScoreA, setMinScoreA] = useState(0.65);
  const [enableRerankingA, setEnableRerankingA] = useState(true);
  const [rerankModelA, setRerankModelA] = useState('qwen3.5:0.8b');
  const [rerankLimitA, setRerankLimitA] = useState(15);
  const [temperatureA, setTemperatureA] = useState<number>(0.7);

  // Config B parameters
  const [approachB, setApproachB] = useState('vector');
  const [enableRrfB, setEnableRrfB] = useState(false);
  const [topKB, setTopKB] = useState(5);
  const [minScoreB, setMinScoreB] = useState(0.65);
  const [enableRerankingB, setEnableRerankingB] = useState(false);
  const [rerankModelB, setRerankModelB] = useState('qwen3.5:0.8b');
  const [rerankLimitB, setRerankLimitB] = useState(15);
  const [temperatureB, setTemperatureB] = useState<number>(0.7);

  // Outputs
  const [resultsA, setResultsA] = useState<any[]>([]);
  const [responseA, setResponseA] = useState<any>(null);
  const [latencyA, setLatencyA] = useState<number | null>(null);
  const [resultsB, setResultsB] = useState<any[]>([]);
  const [responseB, setResponseB] = useState<any>(null);
  const [latencyB, setLatencyB] = useState<number | null>(null);

  // LLM Generation States
  const [answerA, setAnswerA] = useState<string>('');
  const [answerB, setAnswerB] = useState<string>('');
  const [generatingA, setGeneratingA] = useState<boolean>(false);
  const [generatingB, setGeneratingB] = useState<boolean>(false);

  // Accordion expanded panel states (defaults to showing the llm stage)
  const [expandedPanelsA, setExpandedPanelsA] = useState<Record<string, boolean>>({
    raw: false,
    dedup: false,
    rerank: false,
    final: false,
    llm: true,
  });
  const [expandedPanelsB, setExpandedPanelsB] = useState<Record<string, boolean>>({
    raw: false,
    dedup: false,
    rerank: false,
    final: false,
    llm: true,
  });

  const togglePanelA = (key: string) => {
    setExpandedPanelsA((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const togglePanelB = (key: string) => {
    setExpandedPanelsB((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Modal to save config as preset
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [targetPresetSlot, setTargetPresetSlot] = useState<'A' | 'B'>('A');
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDesc, setNewPresetDesc] = useState('');
  const [savingPreset, setSavingPreset] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [kbs, configs] = await Promise.all([
          api.getKnowledgeBases(),
          api.getRetrievalConfigs()
        ]);
        setKbList(kbs || []);
        if (initialKbId) {
          setSelectedKbId(initialKbId);
        } else if (kbs && kbs.length > 0) {
          setSelectedKbId(String(kbs[0].id));
        }
        setSavedConfigs(configs || []);
      } catch (err) {
        console.error('Failed to initialize playground', err);
        setError('Failed to load knowledge bases or presets.');
      } finally {
        setLoadingKbs(false);
      }
    }
    loadData();
  }, [initialKbId]);

  useEffect(() => {
    if (initialKbId) {
      setSelectedKbId(initialKbId);
    }
  }, [initialKbId]);

  const applyPreset = (slot: 'A' | 'B', presetId: string) => {
    if (slot === 'A') {
      setSelectedPresetAId(presetId);
      if (presetId === 'custom') return;
      const config = savedConfigs.find((c) => String(c.id) === presetId);
      if (config && config.settings) {
        const s = config.settings;
        if (s.approach !== undefined) setApproachA(s.approach);
        if (s.enable_rrf !== undefined) setEnableRrfA(!!s.enable_rrf);
        if (s.top_k !== undefined) setTopKA(Number(s.top_k));
        if (s.min_score !== undefined) setMinScoreA(Number(s.min_score));
        if (s.enable_reranking !== undefined) setEnableRerankingA(!!s.enable_reranking);
        if (s.rerank_model !== undefined) setRerankModelA(s.rerank_model);
        if (s.rerank_candidate_limit !== undefined) setRerankLimitA(Number(s.rerank_candidate_limit));
        if (s.temperature !== undefined) setTemperatureA(Number(s.temperature));
      }
    } else {
      setSelectedPresetBId(presetId);
      if (presetId === 'custom') return;
      const config = savedConfigs.find((c) => String(c.id) === presetId);
      if (config && config.settings) {
        const s = config.settings;
        if (s.approach !== undefined) setApproachB(s.approach);
        if (s.enable_rrf !== undefined) setEnableRrfB(!!s.enable_rrf);
        if (s.top_k !== undefined) setTopKB(Number(s.top_k));
        if (s.min_score !== undefined) setMinScoreB(Number(s.min_score));
        if (s.enable_reranking !== undefined) setEnableRerankingB(!!s.enable_reranking);
        if (s.rerank_model !== undefined) setRerankModelB(s.rerank_model);
        if (s.rerank_candidate_limit !== undefined) setRerankLimitB(Number(s.rerank_candidate_limit));
        if (s.temperature !== undefined) setTemperatureB(Number(s.temperature));
      }
    }
  };

  const handleSavePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    setSavingPreset(true);
    const settingsObj = targetPresetSlot === 'A' ? {
      approach: approachA,
      enable_rrf: enableRrfA,
      top_k: topKA,
      min_score: minScoreA,
      enable_reranking: enableRerankingA,
      rerank_model: rerankModelA,
      rerank_candidate_limit: rerankLimitA,
      temperature: temperatureA,
    } : {
      approach: approachB,
      enable_rrf: enableRrfB,
      top_k: topKB,
      min_score: minScoreB,
      enable_reranking: enableRerankingB,
      rerank_model: rerankModelB,
      rerank_candidate_limit: rerankLimitB,
      temperature: temperatureB,
    };

    try {
      const newConfig = await api.createRetrievalConfig({
        name: newPresetName,
        description: newPresetDesc || undefined,
        settings: settingsObj
      });
      const updatedList = await api.getRetrievalConfigs();
      setSavedConfigs(updatedList || []);
      
      if (targetPresetSlot === 'A') {
        setSelectedPresetAId(String(newConfig.id));
      } else {
        setSelectedPresetBId(String(newConfig.id));
      }
      setShowSavePresetModal(false);
      setNewPresetName('');
      setNewPresetDesc('');
    } catch (err: any) {
      alert(err.message || 'Failed to save configuration.');
    } finally {
      setSavingPreset(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKbId || !searchQuery.trim()) return;

    setRunningSearch(true);
    setResultsA([]);
    setResultsB([]);
    setLatencyA(null);
    setLatencyB(null);
    setAnswerA('');
    setAnswerB('');
    setGeneratingA(false);
    setGeneratingB(false);

    // Build metadata query filter
    const metadataFilter: Record<string, any> = {};
    if (metaType.trim()) {
      metadataFilter['type'] = metaType.toLowerCase().trim();
    }
    if (metaTags.trim()) {
      metadataFilter['tags'] = metaTags.trim();
    }

    try {
      // Config A Execution
      const startA = performance.now();
      const resA = await api.retrieveKnowledge({
        query: searchQuery,
        knowledge_base_ids: [Number(selectedKbId)],
        approach: approachA,
        enable_rrf: enableRrfA,
        top_k: topKA,
        min_score: minScoreA,
        enable_reranking: enableRerankingA,
        rerank_model: rerankModelA,
        rerank_limit: rerankLimitA,
        metadata: Object.keys(metadataFilter).length > 0 ? metadataFilter : undefined,
      });
      setLatencyA(Math.round(performance.now() - startA));
      setResultsA(resA.context?.chunks || []);
      setResponseA(resA);

      // Config B Execution
      const startB = performance.now();
      const resB = await api.retrieveKnowledge({
        query: searchQuery,
        knowledge_base_ids: [Number(selectedKbId)],
        approach: approachB,
        enable_rrf: enableRrfB,
        top_k: topKB,
        min_score: minScoreB,
        enable_reranking: enableRerankingB,
        rerank_model: rerankModelB,
        rerank_limit: rerankLimitB,
        metadata: Object.keys(metadataFilter).length > 0 ? metadataFilter : undefined,
      });
      setLatencyB(Math.round(performance.now() - startB));
      setResultsB(resB.context?.chunks || []);
      setResponseB(resB);

      // Trigger LLM Generation for Config A
      if (resA && resA.context) {
        setGeneratingA(true);
        api.generateResponse({
          query: searchQuery,
          context: resA.context,
          temperature: temperatureA,
        }).then((gen) => {
          setAnswerA(gen.answer || '');
        }).catch((err) => {
          setAnswerA(`Error generating response: ${err.message}`);
        }).finally(() => {
          setGeneratingA(false);
        });
      }

      // Trigger LLM Generation for Config B
      if (resB && resB.context) {
        setGeneratingB(true);
        api.generateResponse({
          query: searchQuery,
          context: resB.context,
          temperature: temperatureB,
        }).then((gen) => {
          setAnswerB(gen.answer || '');
        }).catch((err) => {
          setAnswerB(`Error generating response: ${err.message}`);
        }).finally(() => {
          setGeneratingB(false);
        });
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'RAG Search execution failed.');
    } finally {
      setRunningSearch(false);
    }
  };

  if (loadingKbs) {
    return (
      <div className="p-8 text-center text-gray-500 text-sm">
        Loading Playground registry...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="border-b border-gray-200 pb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-black flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
            RAG Retrieval Playground
          </h2>
          <p className="text-xs text-gray-500">
            Compare search configurations, BM25 keywords, and vector models side-by-side.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          {error}
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-4 gap-6 items-start">
        
        {/* Sidebar inputs */}
        <form onSubmit={handleSearch} className="col-span-1 bg-white border border-gray-250 p-5 rounded-xl shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b pb-1.5 border-gray-150">
            Query & Target Settings
          </h3>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-655 uppercase">Target KB</label>
            <select
              value={selectedKbId}
              onChange={(e) => setSelectedKbId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {kbList.map((kb) => (
                <option key={kb.id} value={String(kb.id)}>
                  {kb.name} (#{kb.id})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-655 uppercase">Search Query</label>
            <textarea
              required
              rows={3}
              placeholder="Type query to test retrieval defaults..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-xs bg-white text-black focus:outline-none focus:border-blue-500 resize-none font-sans"
            />
          </div>

          <div className="bg-gray-50/50 p-3.5 rounded-lg border border-gray-150 space-y-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Ingestion Metadata Filters
            </h4>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-400 font-bold uppercase mb-0.5">Doc Type</label>
                <input
                  type="text"
                  placeholder="e.g. policy, faq"
                  value={metaType}
                  onChange={(e) => setMetaType(e.target.value)}
                  className="w-full border border-gray-350 rounded px-2 py-1 text-xs bg-white text-black focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 font-bold uppercase mb-0.5">Tags</label>
                <input
                  type="text"
                  placeholder="e.g. Q3"
                  value={metaTags}
                  onChange={(e) => setMetaTags(e.target.value)}
                  className="w-full border border-gray-350 rounded px-2 py-1 text-xs bg-white text-black focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={runningSearch || !searchQuery.trim()}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            {runningSearch ? 'Searching Pipeline...' : 'Run Benchmarking'}
          </button>
        </form>

        {/* Side-by-side comparison workspace */}
        <div className="col-span-3 grid grid-cols-2 gap-6">
          
          {/* Config A Box */}
          <div className="bg-white border border-gray-250 rounded-xl overflow-hidden shadow-xs flex flex-col min-h-[500px]">
            <div className="bg-slate-50 border-b border-gray-200 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-violet-700 uppercase tracking-wider flex items-center gap-1">
                  <Bookmark className="w-3.5 h-3.5" />
                  Configuration A
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setTargetPresetSlot('A');
                    setShowSavePresetModal(true);
                  }}
                  className="text-xs uppercase text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  Save Preset
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="block text-xs text-gray-400 font-bold uppercase mb-0.5">Preset</label>
                  <select
                    value={selectedPresetAId}
                    onChange={(e) => applyPreset('A', e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-white text-black focus:outline-none cursor-pointer"
                  >
                    <option value="custom">Custom Settings</option>
                    {savedConfigs.map((cfg) => (
                      <option key={cfg.id} value={String(cfg.id)}>
                        {cfg.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 font-bold uppercase mb-0.5">Approach</label>
                  <select
                    value={approachA}
                    onChange={(e) => {
                      setApproachA(e.target.value);
                      setSelectedPresetAId('custom');
                    }}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-white text-black cursor-pointer"
                  >
                    <option value="hybrid">Hybrid</option>
                    <option value="vector">Vector Only</option>
                    <option value="keyword">Keyword Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 font-bold uppercase mb-0.5">Temp</label>
                  <input
                    type="number"
                    min="0.0"
                    max="1.0"
                    step="0.1"
                    value={temperatureA}
                    onChange={(e) => {
                      setTemperatureA(parseFloat(e.target.value) || 0.7);
                      setSelectedPresetAId('custom');
                    }}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-white text-black focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-1 border-t border-gray-200/80 text-xs text-gray-500">
                <label className="flex items-center gap-1 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableRrfA}
                    onChange={(e) => {
                      setEnableRrfA(e.target.checked);
                      setSelectedPresetAId('custom');
                    }}
                    disabled={approachA !== 'hybrid'}
                    className="rounded border-gray-350 w-3 h-3 text-blue-600 cursor-pointer"
                  />
                  Enable RRF
                </label>

                <label className="flex items-center gap-1 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableRerankingA}
                    onChange={(e) => {
                      setEnableRerankingA(e.target.checked);
                      setSelectedPresetAId('custom');
                    }}
                    className="rounded border-gray-350 w-3 h-3 text-blue-600 cursor-pointer"
                  />
                  Rerank
                </label>

                <div className="ml-auto flex items-center gap-1">
                  <span>Top K:</span>
                  <input
                    type="number"
                    value={topKA}
                    onChange={(e) => {
                      setTopKA(Number(e.target.value));
                      setSelectedPresetAId('custom');
                    }}
                    className="border border-gray-300 rounded w-8 px-1 py-0.5 text-center bg-white text-black"
                  />
                </div>
              </div>
            </div>

            {/* Results list A */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              <div className="flex justify-between items-center text-xs text-gray-400 font-bold uppercase tracking-wider pb-2 border-b border-gray-100">
                <span>Pipeline Emulation (Config A)</span>
                {latencyA !== null && (
                  <span className="text-violet-600 flex items-center gap-0.5 font-semibold normal-case">
                    <Clock className="w-3 h-3" />
                    {latencyA} ms
                  </span>
                )}
              </div>

              {!responseA ? (
                <div className="h-48 flex flex-col items-center justify-center text-gray-400 text-xs">
                  <FolderOpen className="w-8 h-8 text-gray-300 mb-1" />
                  No retrieved nodes loaded. Run Search!
                </div>
              ) : (
                <div className="space-y-2">
                  {/* STEP 1: RAW MATCHES ACCORDION */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => togglePanelA('raw')}
                      className="w-full bg-slate-50 hover:bg-slate-100/80 px-3 py-2 flex items-center justify-between text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[9px]">1</span>
                        Raw Matches Retrieved
                      </span>
                      <span className="flex items-center gap-2 text-gray-400">
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono font-normal">
                          {(responseA.raw_candidates || []).length} items
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedPanelsA.raw ? 'rotate-180' : ''}`} />
                      </span>
                    </button>
                    {expandedPanelsA.raw && (
                      <div className="p-3 bg-white border-t border-gray-150 space-y-2 max-h-60 overflow-y-auto">
                        {(responseA.raw_candidates || []).length === 0 ? (
                          <p className="text-[10px] text-gray-400 text-center py-2">No raw candidates found.</p>
                        ) : (
                          (responseA.raw_candidates || []).map((c: any, idx: number) => (
                            <div key={idx} className="text-[11px] p-2 bg-slate-50 rounded border border-slate-100 space-y-1">
                              <div className="flex justify-between font-semibold text-gray-600">
                                <span>{c.document_name} (chunk {c.chunk_index})</span>
                                <span className="text-blue-600 font-mono">Score: {c.score?.toFixed(4)}</span>
                              </div>
                              <p className="text-gray-500 font-normal line-clamp-2">{c.content}</p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* STEP 2: DEDUPLICATION ACCORDION */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => togglePanelA('dedup')}
                      className="w-full bg-slate-50 hover:bg-slate-100/80 px-3 py-2 flex items-center justify-between text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[9px]">2</span>
                        Content Deduplication
                      </span>
                      <span className="flex items-center gap-2 text-gray-400">
                        <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-mono font-normal">
                          -{(responseA.discarded_duplicates || []).length} duplicate
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedPanelsA.dedup ? 'rotate-180' : ''}`} />
                      </span>
                    </button>
                    {expandedPanelsA.dedup && (
                      <div className="p-3 bg-white border-t border-gray-150 space-y-2 max-h-60 overflow-y-auto">
                        {(responseA.discarded_duplicates || []).length === 0 ? (
                          <p className="text-[10px] text-gray-400 text-center py-2">No duplicates removed in this run.</p>
                        ) : (
                          (responseA.discarded_duplicates || []).map((c: any, idx: number) => (
                            <div key={idx} className="text-[11px] p-2 bg-red-50/50 rounded border border-red-100 space-y-1 opacity-70">
                              <div className="flex justify-between font-semibold text-red-800">
                                <span>{c.document_name} (chunk {c.chunk_index})</span>
                                <span className="bg-red-100 text-red-700 text-[9px] px-1 rounded">Duplicate - Removed</span>
                              </div>
                              <p className="text-gray-500 font-normal line-through line-clamp-1">{c.content}</p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* STEP 3: RERANKING STAGE ACCORDION */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => togglePanelA('rerank')}
                      className="w-full bg-slate-50 hover:bg-slate-100/80 px-3 py-2 flex items-center justify-between text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[9px]">3</span>
                        Reranker Stage
                      </span>
                      <span className="flex items-center gap-2 text-gray-400">
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono font-normal">
                          {responseA.rerank_info ? `${responseA.rerank_info.technique}` : 'Skipped'}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedPanelsA.rerank ? 'rotate-180' : ''}`} />
                      </span>
                    </button>
                    {expandedPanelsA.rerank && (
                      <div className="p-3 bg-white border-t border-gray-150 space-y-2 max-h-60 overflow-y-auto">
                        {!responseA.rerank_info ? (
                          <p className="text-[10px] text-gray-400 text-center py-2">Reranker not enabled. Candidates bypassed this stage.</p>
                        ) : (
                          <>
                            <div className="text-[10px] text-gray-500 bg-amber-50/50 p-2 rounded border border-amber-100 mb-2 font-mono">
                              Model: {responseA.rerank_info.model}<br />
                              Candidate Limit: {responseA.rerank_info.candidate_limit}
                            </div>
                            {(responseA.discarded_reranked || []).length === 0 ? (
                              <p className="text-[10px] text-gray-400 text-center py-2">No candidates filtered out by reranker.</p>
                            ) : (
                              (responseA.discarded_reranked || []).map((c: any, idx: number) => (
                                <div key={idx} className="text-[11px] p-2 bg-orange-50/30 rounded border border-orange-100 space-y-1 opacity-70">
                                  <div className="flex justify-between font-semibold text-orange-800">
                                    <span>{c.document_name} (chunk {c.chunk_index})</span>
                                    <span className="bg-orange-100 text-orange-700 text-[9px] px-1 rounded">Filtered (Score / limit)</span>
                                  </div>
                                  <p className="text-gray-500 font-normal line-clamp-1">{c.content}</p>
                                </div>
                              ))
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* STEP 4: FINAL CONTEXT OUTPUT */}
                  <div className="border border-violet-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => togglePanelA('final')}
                      className="w-full bg-violet-50 hover:bg-violet-100/50 px-3 py-2.5 flex items-center justify-between text-xs font-extrabold text-violet-900 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-violet-600 text-white flex items-center justify-center text-[9px]">4</span>
                        Final Context Chunks
                      </span>
                      <span className="flex items-center gap-2 text-violet-500">
                        <span className="text-[10px] bg-violet-650 text-white px-1.5 py-0.5 rounded font-mono font-normal">
                          {resultsA.length} selected
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedPanelsA.final ? 'rotate-180' : ''}`} />
                      </span>
                    </button>
                    {expandedPanelsA.final && (
                      <div className="p-3 bg-white border-t border-violet-100 space-y-3">
                        {resultsA.length === 0 ? (
                          <div className="h-24 flex items-center justify-center text-gray-400 text-xs">
                            No retrieved nodes qualified.
                          </div>
                        ) : (
                          resultsA.map((chunk, idx) => (
                            <div key={idx} className="border border-gray-150 p-3 rounded-lg bg-gray-50/50 hover:bg-slate-50 transition-all space-y-2 shadow-3xs">
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] font-bold text-gray-600 flex items-center gap-1">
                                  <FileText className="w-3.5 h-3.5 text-violet-550" />
                                  {chunk.metadata?.document_name || `Doc #${chunk.document_id}`} (chunk {chunk.chunk_index})
                                </span>
                                <span className="text-xs font-extrabold text-violet-750 bg-violet-50 border border-violet-150 rounded px-1.5 py-0.5 font-mono">
                                  Score: {chunk.score?.toFixed(4)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 leading-relaxed font-sans font-normal whitespace-pre-line bg-white p-2 rounded border border-gray-100">
                                {chunk.content}
                              </p>
                              
                              {/* Chunk diagnostic badges */}
                              <div className="flex flex-wrap items-center gap-2 pt-1 text-[9px] text-gray-400">
                                <span className="bg-slate-100 px-1 py-0.5 rounded text-gray-600 font-mono">
                                  {chunk.content.length} chars
                                </span>
                                <span className="bg-slate-100 px-1 py-0.5 rounded text-gray-600 font-mono">
                                  {chunk.content.split(/\s+/).filter(Boolean).length} words
                                </span>
                                {chunk.metadata && Object.keys(chunk.metadata).filter(k => k !== 'document_name').length > 0 && (
                                  Object.entries(chunk.metadata).filter(([k]) => k !== 'document_name').map(([k, v]) => (
                                    <span key={k} className="bg-slate-150 text-slate-750 px-1 py-0.2 rounded font-mono">
                                      {k}: {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                    </span>
                                  ))
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* STEP 5: FINAL LLM RESPONSE */}
                  <div className="border border-indigo-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => togglePanelA('llm')}
                      className="w-full bg-indigo-50 hover:bg-indigo-100/50 px-3 py-2.5 flex items-center justify-between text-xs font-extrabold text-indigo-900 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px]">5</span>
                        LLM Synthesis Response
                      </span>
                      <span className="flex items-center gap-2 text-indigo-500">
                        {generatingA && <span className="text-[10px] text-indigo-650 flex items-center gap-1 font-normal"><RefreshCw className="w-3 h-3 animate-spin" /> Generating...</span>}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedPanelsA.llm ? 'rotate-180' : ''}`} />
                      </span>
                    </button>
                    {expandedPanelsA.llm && (
                      <div className="p-3 bg-white border-t border-indigo-100 space-y-3">
                        {generatingA ? (
                          <div className="h-24 flex flex-col items-center justify-center text-gray-400 text-xs gap-2">
                            <RefreshCw className="w-6 h-6 animate-spin text-indigo-650" />
                            Synthesizing retrieved context...
                          </div>
                        ) : answerA ? (
                          <div className="border border-indigo-100 p-3 rounded-lg bg-indigo-50/20 space-y-2">
                            <p className="text-xs text-gray-700 leading-relaxed font-sans font-normal whitespace-pre-wrap">
                              {answerA}
                            </p>
                          </div>
                        ) : (
                          <div className="h-24 flex items-center justify-center text-gray-400 text-xs">
                            No response generated yet. Run Search to retrieve context & synthesize.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          </div>

          {/* Config B Box */}
          <div className="bg-white border border-gray-255 rounded-xl overflow-hidden shadow-xs flex flex-col min-h-[500px]">
            <div className="bg-slate-50 border-b border-gray-200 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-teal-700 uppercase tracking-wider flex items-center gap-1">
                  <Bookmark className="w-3.5 h-3.5" />
                  Configuration B
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setTargetPresetSlot('B');
                    setShowSavePresetModal(true);
                  }}
                  className="text-xs uppercase text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  Save Preset
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="block text-xs text-gray-400 font-bold uppercase mb-0.5">Preset</label>
                  <select
                    value={selectedPresetBId}
                    onChange={(e) => applyPreset('B', e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-white text-black focus:outline-none cursor-pointer"
                  >
                    <option value="custom">Custom Settings</option>
                    {savedConfigs.map((cfg) => (
                      <option key={cfg.id} value={String(cfg.id)}>
                        {cfg.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 font-bold uppercase mb-0.5">Approach</label>
                  <select
                    value={approachB}
                    onChange={(e) => {
                      setApproachB(e.target.value);
                      setSelectedPresetBId('custom');
                    }}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-white text-black cursor-pointer"
                  >
                    <option value="hybrid">Hybrid</option>
                    <option value="vector">Vector Only</option>
                    <option value="keyword">Keyword Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 font-bold uppercase mb-0.5">Temp</label>
                  <input
                    type="number"
                    min="0.0"
                    max="1.0"
                    step="0.1"
                    value={temperatureB}
                    onChange={(e) => {
                      setTemperatureB(parseFloat(e.target.value) || 0.7);
                      setSelectedPresetBId('custom');
                    }}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-white text-black focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-1 border-t border-gray-200/80 text-xs text-gray-500">
                <label className="flex items-center gap-1 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableRrfB}
                    onChange={(e) => {
                      setEnableRrfB(e.target.checked);
                      setSelectedPresetBId('custom');
                    }}
                    disabled={approachB !== 'hybrid'}
                    className="rounded border-gray-350 w-3 h-3 text-blue-600 cursor-pointer"
                  />
                  Enable RRF
                </label>

                <label className="flex items-center gap-1 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableRerankingB}
                    onChange={(e) => {
                      setEnableRerankingB(e.target.checked);
                      setSelectedPresetBId('custom');
                    }}
                    className="rounded border-gray-350 w-3 h-3 text-blue-600 cursor-pointer"
                  />
                  Rerank
                </label>

                <div className="ml-auto flex items-center gap-1">
                  <span>Top K:</span>
                  <input
                    type="number"
                    value={topKB}
                    onChange={(e) => {
                      setTopKB(Number(e.target.value));
                      setSelectedPresetBId('custom');
                    }}
                    className="border border-gray-300 rounded w-8 px-1 py-0.5 text-center bg-white text-black"
                  />
                </div>
              </div>
            </div>

            {/* Results list B */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              <div className="flex justify-between items-center text-xs text-gray-400 font-bold uppercase tracking-wider pb-2 border-b border-gray-100">
                <span>Pipeline Emulation (Config B)</span>
                {latencyB !== null && (
                  <span className="text-teal-600 flex items-center gap-0.5 font-semibold normal-case">
                    <Clock className="w-3 h-3" />
                    {latencyB} ms
                  </span>
                )}
              </div>

              {!responseB ? (
                <div className="h-48 flex flex-col items-center justify-center text-gray-400 text-xs">
                  <FolderOpen className="w-8 h-8 text-gray-300 mb-1" />
                  No retrieved nodes loaded. Run Search!
                </div>
              ) : (
                <div className="space-y-2">
                  {/* STEP 1: RAW MATCHES ACCORDION */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => togglePanelB('raw')}
                      className="w-full bg-slate-50 hover:bg-slate-100/80 px-3 py-2 flex items-center justify-between text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[9px]">1</span>
                        Raw Matches Retrieved
                      </span>
                      <span className="flex items-center gap-2 text-gray-400">
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono font-normal">
                          {(responseB.raw_candidates || []).length} items
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedPanelsB.raw ? 'rotate-180' : ''}`} />
                      </span>
                    </button>
                    {expandedPanelsB.raw && (
                      <div className="p-3 bg-white border-t border-gray-150 space-y-2 max-h-60 overflow-y-auto">
                        {(responseB.raw_candidates || []).length === 0 ? (
                          <p className="text-[10px] text-gray-400 text-center py-2">No raw candidates found.</p>
                        ) : (
                          (responseB.raw_candidates || []).map((c: any, idx: number) => (
                            <div key={idx} className="text-[11px] p-2 bg-slate-50 rounded border border-slate-100 space-y-1">
                              <div className="flex justify-between font-semibold text-gray-600">
                                <span>{c.document_name} (chunk {c.chunk_index})</span>
                                <span className="text-blue-600 font-mono">Score: {c.score?.toFixed(4)}</span>
                              </div>
                              <p className="text-gray-500 font-normal line-clamp-2">{c.content}</p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* STEP 2: DEDUPLICATION ACCORDION */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => togglePanelB('dedup')}
                      className="w-full bg-slate-50 hover:bg-slate-100/80 px-3 py-2 flex items-center justify-between text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[9px]">2</span>
                        Content Deduplication
                      </span>
                      <span className="flex items-center gap-2 text-gray-400">
                        <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-mono font-normal">
                          -{(responseB.discarded_duplicates || []).length} duplicate
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedPanelsB.dedup ? 'rotate-180' : ''}`} />
                      </span>
                    </button>
                    {expandedPanelsB.dedup && (
                      <div className="p-3 bg-white border-t border-gray-150 space-y-2 max-h-60 overflow-y-auto">
                        {(responseB.discarded_duplicates || []).length === 0 ? (
                          <p className="text-[10px] text-gray-400 text-center py-2">No duplicates removed in this run.</p>
                        ) : (
                          (responseB.discarded_duplicates || []).map((c: any, idx: number) => (
                            <div key={idx} className="text-[11px] p-2 bg-red-50/50 rounded border border-red-100 space-y-1 opacity-70">
                              <div className="flex justify-between font-semibold text-red-800">
                                <span>{c.document_name} (chunk {c.chunk_index})</span>
                                <span className="bg-red-100 text-red-700 text-[9px] px-1 rounded">Duplicate - Removed</span>
                              </div>
                              <p className="text-gray-500 font-normal line-through line-clamp-1">{c.content}</p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* STEP 3: RERANKING STAGE ACCORDION */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => togglePanelB('rerank')}
                      className="w-full bg-slate-50 hover:bg-slate-100/80 px-3 py-2 flex items-center justify-between text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[9px]">3</span>
                        Reranker Stage
                      </span>
                      <span className="flex items-center gap-2 text-gray-400">
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono font-normal">
                          {responseB.rerank_info ? `${responseB.rerank_info.technique}` : 'Skipped'}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedPanelsB.rerank ? 'rotate-180' : ''}`} />
                      </span>
                    </button>
                    {expandedPanelsB.rerank && (
                      <div className="p-3 bg-white border-t border-gray-150 space-y-2 max-h-60 overflow-y-auto">
                        {!responseB.rerank_info ? (
                          <p className="text-[10px] text-gray-400 text-center py-2">Reranker not enabled. Candidates bypassed this stage.</p>
                        ) : (
                          <>
                            <div className="text-[10px] text-gray-500 bg-amber-50/50 p-2 rounded border border-amber-100 mb-2 font-mono">
                              Model: {responseB.rerank_info.model}<br />
                              Candidate Limit: {responseB.rerank_info.candidate_limit}
                            </div>
                            {(responseB.discarded_reranked || []).length === 0 ? (
                              <p className="text-[10px] text-gray-400 text-center py-2">No candidates filtered out by reranker.</p>
                            ) : (
                              (responseB.discarded_reranked || []).map((c: any, idx: number) => (
                                <div key={idx} className="text-[11px] p-2 bg-orange-50/30 rounded border border-orange-100 space-y-1 opacity-70">
                                  <div className="flex justify-between font-semibold text-orange-800">
                                    <span>{c.document_name} (chunk {c.chunk_index})</span>
                                    <span className="bg-orange-100 text-orange-700 text-[9px] px-1 rounded">Filtered (Score / limit)</span>
                                  </div>
                                  <p className="text-gray-500 font-normal line-clamp-1">{c.content}</p>
                                </div>
                              ))
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* STEP 4: FINAL CONTEXT OUTPUT */}
                  <div className="border border-teal-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => togglePanelB('final')}
                      className="w-full bg-teal-50 hover:bg-teal-100/50 px-3 py-2.5 flex items-center justify-between text-xs font-extrabold text-teal-900 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center text-[9px]">4</span>
                        Final Context Chunks
                      </span>
                      <span className="flex items-center gap-2 text-teal-500">
                        <span className="text-[10px] bg-teal-600 text-white px-1.5 py-0.5 rounded font-mono font-normal">
                          {resultsB.length} selected
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedPanelsB.final ? 'rotate-180' : ''}`} />
                      </span>
                    </button>
                    {expandedPanelsB.final && (
                      <div className="p-3 bg-white border-t border-teal-100 space-y-3">
                        {resultsB.length === 0 ? (
                          <div className="h-24 flex items-center justify-center text-gray-400 text-xs">
                            No retrieved nodes qualified.
                          </div>
                        ) : (
                          resultsB.map((chunk, idx) => (
                            <div key={idx} className="border border-gray-150 p-3 rounded-lg bg-gray-50/50 hover:bg-slate-50 transition-all space-y-2 shadow-3xs">
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] font-bold text-gray-600 flex items-center gap-1">
                                  <FileText className="w-3.5 h-3.5 text-teal-550" />
                                  {chunk.metadata?.document_name || `Doc #${chunk.document_id}`} (chunk {chunk.chunk_index})
                                </span>
                                <span className="text-xs font-extrabold text-teal-750 bg-teal-50 border border-teal-150 rounded px-1.5 py-0.5 font-mono">
                                  Score: {chunk.score?.toFixed(4)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 leading-relaxed font-sans font-normal whitespace-pre-line bg-white p-2 rounded border border-gray-100">
                                {chunk.content}
                              </p>
                              
                              {/* Chunk diagnostic badges */}
                              <div className="flex flex-wrap items-center gap-2 pt-1 text-[9px] text-gray-400">
                                <span className="bg-slate-100 px-1 py-0.5 rounded text-gray-600 font-mono">
                                  {chunk.content.length} chars
                                </span>
                                <span className="bg-slate-100 px-1 py-0.5 rounded text-gray-600 font-mono">
                                  {chunk.content.split(/\s+/).filter(Boolean).length} words
                                </span>
                                {chunk.metadata && Object.keys(chunk.metadata).filter(k => k !== 'document_name').length > 0 && (
                                  Object.entries(chunk.metadata).filter(([k]) => k !== 'document_name').map(([k, v]) => (
                                    <span key={k} className="bg-slate-150 text-slate-750 px-1 py-0.2 rounded font-mono">
                                      {k}: {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                    </span>
                                  ))
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* STEP 5: FINAL LLM RESPONSE */}
                  <div className="border border-teal-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => togglePanelB('llm')}
                      className="w-full bg-teal-50 hover:bg-teal-100/50 px-3 py-2.5 flex items-center justify-between text-xs font-extrabold text-teal-900 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center text-[9px]">5</span>
                        LLM Synthesis Response
                      </span>
                      <span className="flex items-center gap-2 text-teal-500">
                        {generatingB && <span className="text-[10px] text-teal-650 flex items-center gap-1 font-normal"><RefreshCw className="w-3 h-3 animate-spin" /> Generating...</span>}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedPanelsB.llm ? 'rotate-180' : ''}`} />
                      </span>
                    </button>
                    {expandedPanelsB.llm && (
                      <div className="p-3 bg-white border-t border-teal-100 space-y-3">
                        {generatingB ? (
                          <div className="h-24 flex flex-col items-center justify-center text-gray-400 text-xs gap-2">
                            <RefreshCw className="w-6 h-6 animate-spin text-teal-650" />
                            Synthesizing retrieved context...
                          </div>
                        ) : answerB ? (
                          <div className="border border-teal-100 p-3 rounded-lg bg-teal-50/20 space-y-2">
                            <p className="text-xs text-gray-700 leading-relaxed font-sans font-normal whitespace-pre-wrap">
                              {answerB}
                            </p>
                          </div>
                        ) : (
                          <div className="h-24 flex items-center justify-center text-gray-400 text-xs">
                            No response generated yet. Run Search to retrieve context & synthesize.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Save Preset Dialog Modal */}
      {showSavePresetModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">
                Save Config {targetPresetSlot} as Preset
              </h3>
              <button
                type="button"
                onClick={() => setShowSavePresetModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSavePreset} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-655">Preset Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GPT-4o Hybrid"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-655">Description</label>
                <textarea
                  placeholder="Describe the search usecase..."
                  value={newPresetDesc}
                  onChange={(e) => setNewPresetDesc(e.target.value)}
                  className="h-16 w-full border border-gray-300 rounded-lg px-4 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500 resize-none font-sans"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSavePresetModal(false)}
                  className="flex-1 py-2 bg-gray-150 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPreset || !newPresetName.trim()}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {savingPreset ? 'Saving...' : 'Save Preset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
