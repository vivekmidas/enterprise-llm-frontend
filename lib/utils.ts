import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const COLOR_PALETTE = [
  { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)', text: '#6366f1' }, // Indigo
  { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', text: '#10b981' }, // Emerald
  { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', text: '#d97706' }, // Amber
  { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', text: '#ef4444' }, // Red
  { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.25)', text: '#a855f7' }, // Purple
  { bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.25)', text: '#0891b2' }, // Cyan
  { bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.25)', text: '#ec4899' }, // Pink
  { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)', text: '#16a34a' }, // Green
];

export function toSentenceCase(str: string): string {
  if (!str) return '';
  const trimmed = str.trimStart();
  if (!trimmed) return str;
  const leadingSpaces = str.slice(0, str.length - trimmed.length);
  return leadingSpaces + trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function formatIdentifierToSentenceCase(str: string): string {
  if (!str) return '';
  const cleaned = str.replace(/[_-]+/g, ' ').trim();
  if (!cleaned) return '';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function toIdCase(str: string, delimiter: '_' | '-' = '_'): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, delimiter)
    .replace(new RegExp(`^\\${delimiter}+|\\${delimiter}+$`, 'g'), '');
}

export function toTagCase(tag: string): string {
  return (tag || '').trim().toUpperCase();
}

export function parseTagsInput(tagsStr: string): string[] {
  if (!tagsStr) return [];
  return tagsStr
    .split(',')
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);
}

