'use client';

import React, { useState } from 'react';
import { Tag, X } from 'lucide-react';
import { COLOR_PALETTE } from './utils';

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
  placeholder = 'Add tag and press Enter...',
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

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
  };

  return (
    <div className="space-y-2">
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
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value.toUpperCase())}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag();
          }
        }}
        onBlur={() => {
          if (input.trim()) {
            addTag();
          }
        }}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500 uppercase placeholder:normal-case font-medium"
      />
    </div>
  );
}

