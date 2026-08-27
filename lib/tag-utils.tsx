'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Tag, X, Scale, Building2, User, CheckCircle2, Bookmark } from 'lucide-react';
import { COLOR_PALETTE } from './utils';
import { api } from './api';

// ── Tag Color Palette ──────────────────────────────────────────────────────────

// ── Hash Utility ───────────────────────────────────────────────────────────────

export function hashTag(tag: string): number {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = ((hash << 5) - hash + tag.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getColor(tag?: string) {
  if (tag) {
    const hash = hashTag(tag);
    return COLOR_PALETTE[hash % COLOR_PALETTE.length];
  }
  return COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
}

// ── Tag Components ─────────────────────────────────────────────────────────────

export function TagPill({ tag }: { tag: string }) {
  const upperTag = (tag || '').trim().toUpperCase();
  const color = getColor(upperTag);
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap transition-transform hover:scale-105"
      style={{ backgroundColor: color.bg, border: `1px solid ${color.border}`, color: color.text }}
    >
      <Tag className="w-2.5 h-2.5" />
      {upperTag}
    </span>
  );
}

export function TagList({ tags }: { tags?: string[] }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-0.5">
      {tags.map((t) => (
        <TagPill key={t} tag={t} />
      ))}
    </div>
  );
}

export function TagInput({
  tags,
  onChange,
  placeholder = 'Add tag or start typing to search taxonomy...',
  category,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  category?: string;
}) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ id: string; category: string; canonical_name: string; usage_count: number; is_auto_discovered: boolean }>>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!input.trim() || input.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.getTaxonomySuggestions(input.trim(), category, 8);
        setSuggestions(res.suggestions || []);
        setShowDropdown((res.suggestions || []).length > 0);
        setSelectedIndex(-1);
      } catch {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [input, category]);

  const addTag = (val?: string) => {
    const raw = (val !== undefined ? val : input).trim();
    if (!raw) return;
    const incoming = raw
      .split(',')
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);
    const existingUpper = tags.map((t) => (t || '').trim().toUpperCase());
    const next = [...existingUpper];
    for (const t of incoming) {
      if (!next.includes(t)) {
        next.push(t);
      }
    }
    onChange(next);
    setInput('');
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'court':
        return <Building2 className="w-3.5 h-3.5 text-blue-600" />;
      case 'judge':
      case 'coram':
        return <User className="w-3.5 h-3.5 text-purple-600" />;
      case 'statute':
      case 'section':
        return <Scale className="w-3.5 h-3.5 text-amber-600" />;
      case 'disposition':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <Bookmark className="w-3.5 h-3.5 text-indigo-600" />;
    }
  };

  return (
    <div ref={wrapperRef} className="relative space-y-2">
      <div className="flex flex-wrap gap-1">
        {tags.map((tag) => {
          const upperTag = (tag || '').trim().toUpperCase();
          const color = getColor(upperTag);
          return (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
              style={{
                backgroundColor: color.bg,
                border: `1px solid ${color.border}`,
                color: color.text,
              }}
            >
              {upperTag}
              <button
                type="button"
                onClick={() => onChange(tags.filter((t) => (t || '').trim().toUpperCase() !== upperTag))}
                className="ml-0.5 hover:opacity-70 cursor-pointer"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          );
        })}
      </div>
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
            } else if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                addTag(suggestions[selectedIndex].canonical_name);
              } else {
                addTag();
              }
            } else if (e.key === 'Escape') {
              setShowDropdown(false);
            }
          }}
          placeholder={placeholder}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500 placeholder:normal-case font-medium"
        />

        {showDropdown && suggestions.length > 0 && (
          <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-slate-50 flex items-center justify-between">
              <span>Canonical Taxonomy Suggestions</span>
              <span className="text-[9px] font-medium text-indigo-600">Click or Press Enter</span>
            </div>
            {suggestions.map((item, idx) => (
              <div
                key={item.id || `sugg_${idx}`}
                onClick={() => addTag(item.canonical_name)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                  selectedIndex === idx ? 'bg-indigo-50/80 text-indigo-900 font-semibold' : 'hover:bg-slate-50 text-gray-800'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {getCategoryIcon(item.category)}
                  <span className="truncate font-medium">{item.canonical_name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                    {item.category}
                  </span>
                  {item.usage_count > 1 && (
                    <span className="text-[10px] text-gray-400" title="Usage Count">
                      ×{item.usage_count}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

