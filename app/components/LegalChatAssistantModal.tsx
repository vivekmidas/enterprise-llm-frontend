/*
===============================================================================
BLOCK COMMENT: MULTILINGUAL VOICE LEGAL ASSISTANT FLOATING WIDGET
Epic: epic_system_tenant_common_knowledge_bases.md
Story: STORY-SYSKB-04 (Multilingual Voice Conversational Knowledge Assistant)
Description:
    Provides an uncluttered, responsive, relative-positioned conversational assistant:
    1. Welcomes user with multilingual guidance (English, Hindi, etc.).
    2. Free-flowing cross-KB queries (System Statutes: CrPC/BNS/IPC concordance + Tenant Matters).
    3. Direct URL redirection for internal cases with clickable case cards/links.
    4. Speech-to-Text (STT) mic integration via Web Speech API with live animation pulse.
    5. Inactivity Engine: n-second idle nudge + n-second farewell timeout closure.
    6. Window Controls: Minimize (_) to sleek bubble & Close (X).
    7. Future Reference: View past Q&A sessions and transcripts from persistent DB.
===============================================================================
*/

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot,
  Mic,
  MicOff,
  Minus,
  X,
  Send,
  Globe,
  Clock,
  ExternalLink,
  RotateCcw,
  History,
  Sparkles,
  Scale,
  FileText,
  Volume2,
  Maximize2,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';

interface CaseReference {
  case_id: string;
  title: string;
  matter_ref: string;
  forum: string;
  next_hearing: string;
  url: string;
  match_reason: string;
}

interface CitationItem {
  source_type: string;
  code: string;
  title: string;
  details: string;
  url?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  detected_language?: string;
  audio_used?: boolean;
  referenced_cases?: CaseReference[];
  citations?: CitationItem[];
  timestamp: string;
}

interface SessionRecord {
  session_id: string;
  title: string;
  language: string;
  status: string;
  created_at: string;
  messages: any[];
}

interface LegalChatAssistantModalProps {
  defaultOpen?: boolean;
  idleTimeoutSeconds?: number; // n seconds
  onNavigateToCase?: (matterId: string) => void;
}

export default function LegalChatAssistantModal({
  defaultOpen = false,
  idleTimeoutSeconds = 30,
  onNavigateToCase,
}: LegalChatAssistantModalProps) {
  const router = useRouter();

  // Widget States
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi' | 'mr'>('en');

  // Conversation States
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<'active' | 'idle_pinged' | 'closed_inactivity'>('active');

  // Voice STT States
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  // Inactivity Timers
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const byeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // History State
  const [pastSessions, setPastSessions] = useState<SessionRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Check speech recognition support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechSupported(false);
      }
    }
  }, []);

  // Initialize or resume assistant session
  const initSession = async (lang = language) => {
    try {
      setIsLoading(true);
      const res = await api.startAssistantSession('Legal Knowledge Assistant Session', lang);
      setSessionId(res.session_id);
      setSessionStatus('active');
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: res.welcome_message,
          detected_language: res.language,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      resetInactivityWatchers(res.session_id);
    } catch (err) {
      console.error('Failed to init assistant session', err);
      // Fallback greeting if offline
      setSessionId(`offline-${Date.now()}`);
      setMessages([
        {
          id: `welcome-fallback`,
          role: 'assistant',
          content:
            lang === 'hi'
              ? 'नमस्ते! मैं आपका कानूनी एआई सहायक हूँ। आप मुझसे CrPC से BNS रूपांतरण या अपने मामलों के बारे में पूछ सकते हैं।'
              : 'Welcome! I am your Legal AI Assistant. You can ask me anything about Indian statutes (e.g. CrPC to BNS concordance) or seek updates on active tenant cases.',
          detected_language: lang,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger init on first open
  useEffect(() => {
    if (isOpen && !sessionId) {
      initSession();
    }
  }, [isOpen]);

  // Inactivity Engine Watcher
  const resetInactivityWatchers = (currSessionId = sessionId) => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (byeTimerRef.current) clearTimeout(byeTimerRef.current);

    if (!currSessionId || sessionStatus === 'closed_inactivity') return;

    // First timer: n seconds idle -> ping nudge
    idleTimerRef.current = setTimeout(async () => {
      try {
        const res = await api.sendInactivityEvent(currSessionId, 'ping', language);
        setSessionStatus('idle_pinged');
        setMessages((prev) => [
          ...prev,
          {
            id: `ping-${Date.now()}`,
            role: 'assistant',
            content: res.bot_message,
            detected_language: language,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);

        // Second timer: another n seconds idle -> goodbye farewell
        byeTimerRef.current = setTimeout(async () => {
          try {
            const byeRes = await api.sendInactivityEvent(currSessionId, 'bye', language);
            setSessionStatus('closed_inactivity');
            setMessages((prev) => [
              ...prev,
              {
                id: `bye-${Date.now()}`,
                role: 'assistant',
                content: byeRes.bot_message,
                detected_language: language,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          } catch (e) {
            console.error('Failed to send bye event', e);
          }
        }, idleTimeoutSeconds * 1000);
      } catch (e) {
        console.error('Failed to send ping event', e);
      }
    }, idleTimeoutSeconds * 1000);
  };

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (byeTimerRef.current) clearTimeout(byeTimerRef.current);
    };
  }, []);

  // Send query
  const handleSendMessage = async (textToSend?: string, wasAudio = false) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    if (sessionStatus === 'closed_inactivity') {
      // Re-initialize session if already closed
      await initSession(language);
    }

    const currentSid = sessionId || `session-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: query,
      detected_language: language,
      audio_used: wasAudio,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    // Reset inactivity countdown
    resetInactivityWatchers(currentSid);

    try {
      const res = await api.sendAssistantMessage(currentSid, query, language, wasAudio);
      const botMsg: ChatMessage = {
        id: res.message_id || `bot-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        detected_language: res.detected_language,
        referenced_cases: res.referenced_cases,
        citations: res.citations,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setSessionStatus('active');
    } catch (err: any) {
      console.error('Failed to send message', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'system',
          content: 'Unable to connect to assistant service. Please verify network or try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
      resetInactivityWatchers(currentSid);
    }
  };

  // Web Speech API Voice Toggle
  const toggleListening = () => {
    if (!speechSupported) {
      alert('Speech Recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputQuery(transcript);
          handleSendMessage(transcript, true);
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error('Speech recognition exception', e);
      setIsListening(false);
    }
  };

  // Case Redirection click handler
  const handleCaseClick = (url: string, caseId: string) => {
    if (onNavigateToCase) {
      onNavigateToCase(caseId);
    } else {
      router.push(url);
    }
  };

  // Load Past Conversation History
  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.getAssistantHistory(15);
      setPastSessions(res.sessions || []);
      setShowHistory(true);
    } catch (e) {
      console.error('Failed to load history', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Quick Prompt pills
  const quickPrompts = [
    { label: 'CrPC 156(3) ➔ BNSS', query: 'What is the conversion for CrPC 156(3) in BNSS?' },
    { label: 'CrPC 302 / BNS 103 Cases', query: 'Show me cases related to crpc 302 and bns 103' },
    { label: 'Next Hearing Dates', query: 'What are the upcoming hearing dates for my active cases?' },
    { label: 'Sec 65B ➔ Sec 63 BSA', query: 'Explain Section 63 BSA electronic evidence certificate conversion from Section 65B' },
  ];

  // ---------------------------------------------------------------------------
  // MINIMIZED STATE: Sleek floating badge (Relative positioning inside wrapper)
  // ---------------------------------------------------------------------------
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="group flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
          title="Open Legal AI Assistant"
        >
          <div className="relative">
            <Bot className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white"></span>
          </div>
          <span className="text-sm font-semibold tracking-wide">Legal Assistant</span>
          <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">
            AI + Voice
          </span>
        </button>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="flex items-center gap-2 bg-slate-900/95 border border-slate-700 text-slate-100 px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-medium text-slate-200">Legal Assistant (Active)</span>
          </div>
          <div className="flex items-center gap-1 ml-3 border-l border-slate-700 pl-2">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
              title="Maximize"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // FULL CONVERSATIONAL WINDOW (RESPONSIVE, RELATIVE LAYOUT, NON-CLUTTERED)
  // ---------------------------------------------------------------------------
  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-lg sm:w-[480px] h-[640px] max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300">
      {/* 1. Header Bar with Minimize (_) and Close (X) */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white tracking-tight">Legal AI Assistant</h3>
              <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                Live
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Statutes • Cases • Concordance</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Language Selector */}
          <div className="flex items-center bg-slate-800/80 border border-slate-700/80 rounded-md p-0.5 text-xs text-slate-300 mr-1">
            <button
              onClick={() => {
                setLanguage('en');
                initSession('en');
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                language === 'en' ? 'bg-blue-600 text-white' : 'hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => {
                setLanguage('hi');
                initSession('hi');
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                language === 'hi' ? 'bg-blue-600 text-white' : 'hover:text-white'
              }`}
            >
              हिंदी
            </button>
          </div>

          {/* Past History Drawer Toggle */}
          <button
            onClick={loadHistory}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition"
            title="Stored Q&A History"
          >
            <History className="w-4 h-4" />
          </button>

          {/* New Session Refresh */}
          <button
            onClick={() => initSession(language)}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition"
            title="Reset Session"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Minimize Button */}
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition"
            title="Minimize Window"
          >
            <Minus className="w-4 h-4" />
          </button>

          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition"
            title="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Main Body: History Sheet or Messages Container */}
      {showHistory ? (
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-blue-500" /> Past Stored Conversations
            </h4>
            <button
              onClick={() => setShowHistory(false)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Back to Chat <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loadingHistory ? (
            <div className="py-8 text-center text-xs text-slate-500">Loading history...</div>
          ) : pastSessions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">No previous sessions found.</div>
          ) : (
            <div className="space-y-3 mt-3">
              {pastSessions.map((s) => (
                <div
                  key={s.session_id}
                  className="p-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-xl hover:border-blue-500/50 transition cursor-pointer"
                  onClick={() => {
                    setSessionId(s.session_id);
                    setMessages(
                      s.messages.map((m: any) => ({
                        id: m.id,
                        role: m.role,
                        content: m.content,
                        detected_language: m.detected_language,
                        referenced_cases: m.referenced_cases,
                        citations: m.citations,
                        timestamp: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                      }))
                    );
                    setShowHistory(false);
                  }}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span>{new Date(s.created_at).toLocaleDateString()}</span>
                    <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px]">
                      {s.language.toUpperCase()} • {s.status}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                    {s.title || 'Assistant Session'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {s.messages.find((m: any) => m.role === 'user')?.content || 'No user messages'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 dark:bg-slate-900/40">
          {/* Messages Stream */}
          {messages.map((msg) => {
            const isBot = msg.role === 'assistant';
            const isSystem = msg.role === 'system';

            if (isSystem) {
              return (
                <div key={msg.id} className="text-center my-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs rounded-full">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isBot ? 'items-start' : 'items-end'} space-y-1.5`}
              >
                <div className="flex items-end gap-2 max-w-[90%]">
                  {isBot && (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs mb-1">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isBot
                        ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 shadow-sm rounded-bl-sm'
                        : 'bg-blue-600 text-white shadow-md rounded-br-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* Direct Clickable Case Link Badges */}
                    {msg.referenced_cases && msg.referenced_cases.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-blue-500" /> Matched Case Dossiers:
                        </div>
                        {msg.referenced_cases.map((cs) => (
                          <div
                            key={cs.case_id}
                            className="p-2.5 bg-blue-50/70 dark:bg-slate-900/80 border border-blue-200 dark:border-blue-900/40 rounded-xl flex items-center justify-between hover:border-blue-400 transition group"
                          >
                            <div className="pr-2">
                              <p className="font-semibold text-blue-900 dark:text-blue-300 text-xs">
                                {cs.title}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                {cs.forum} • Hearing: {cs.next_hearing}
                              </p>
                            </div>
                            <button
                              onClick={() => handleCaseClick(cs.url, cs.case_id)}
                              className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium rounded-lg shadow-sm transition"
                            >
                              Open <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Citations Badges */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap gap-1">
                        {msg.citations.map((c, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 text-[10px] rounded-md font-mono"
                          >
                            <Scale className="w-2.5 h-2.5 text-blue-500" />
                            {c.code}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <span className="text-[10px] text-slate-400 px-1">{msg.timestamp}</span>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 p-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
              <span>Searching statutes and tenant records...</span>
            </div>
          )}

          {/* Closed Session Banner */}
          {sessionStatus === 'closed_inactivity' && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-xl text-center">
              <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                Session ended due to inactivity. All questions & answers saved.
              </p>
              <button
                onClick={() => initSession(language)}
                className="mt-2 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition"
              >
                Start New Session
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* 3. Quick Query Suggestion Pills */}
      {!showHistory && (
        <div className="px-3 py-1.5 bg-slate-100/80 dark:bg-slate-800/40 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
          <span className="text-slate-400 text-[10px] uppercase font-semibold shrink-0">Quick:</span>
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(p.query)}
              className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-full whitespace-nowrap hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* 4. Input Controls Bar with Voice STT (Mic) */}
      {!showHistory && (
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
          {/* STT Voice Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2 rounded-xl transition ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30 ring-2 ring-rose-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title={isListening ? 'Listening... Speak now' : 'Voice Chat / STT'}
          >
            {isListening ? <Mic className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder={
              isListening
                ? 'Listening... speak legal query now'
                : language === 'hi'
                ? 'कानून या केस के बारे में यहाँ पूछें...'
                : 'Ask about statutes, CrPC ➔ BNS, or cases...'
            }
            className="flex-1 px-3.5 py-2 text-xs bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />

          {/* Send Button */}
          <button
            type="button"
            disabled={!inputQuery.trim() || isLoading}
            onClick={() => handleSendMessage()}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-xl shadow-md transition"
            title="Send Query"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
