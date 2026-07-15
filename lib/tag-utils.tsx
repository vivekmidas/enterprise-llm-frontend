'use client';

import React, { useState } from 'react';
import { Tag, X } from 'lucide-react';

// ── Tag Color Palette ──────────────────────────────────────────────────────────

export const TAG_PALETTE = [
  { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)', text: '#6366f1' },   // Indigo
  { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', text: '#10b981' },   // Emerald
  { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', text: '#d97706' },   // Amber
  { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.25)',  text: '#ef4444' },   // Red
  { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.25)', text: '#a855f7' },   // Purple
  { bg: 'rgba(6,182,212,0.12)',  border: 'rgba(6,182,212,0.25)',  text: '#0891b2' },   // Cyan
  { bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.25)', text: '#ec4899' },   // Pink
  { bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.25)',  text: '#16a34a' },   // Green
];

// ── Hash Utility ───────────────────────────────────────────────────────────────

export function hashTag(tag: string): number {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = ((hash << 5) - hash + tag.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getTagColor(tag: string) {
  return TAG_PALETTE[hashTag(tag) % TAG_PALETTE.length];
}

// ── Tag Components ─────────────────────────────────────────────────────────────

export function TagPill({ tag }: { tag: string }) {
  const color = getTagColor(tag);
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-transform hover:scale-105"
      style={{ backgroundColor: color.bg, border: `1px solid ${color.border}`, color: color.text }}
    >
      <Tag className="w-2.5 h-2.5" />
      {tag}
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

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {tags.map((tag) => {
          const color = getTagColor(tag);
          return (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ backgroundColor: color.bg, border: `1px solid ${color.border}`, color: color.text }}
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(tags.filter((t) => t !== tag))}
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
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
          }
        }}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500"
      />
    </div>
  );
}
