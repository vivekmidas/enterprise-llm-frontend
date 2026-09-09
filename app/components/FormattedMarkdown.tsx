'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';

export interface FormattedMarkdownProps {
  content: string;
  variant?: 'bot' | 'user' | 'neutral';
  className?: string;
  onLinkClick?: (url: string) => void;
}

type InlineToken =
  | { type: 'text'; content: string }
  | { type: 'bold'; content: string }
  | { type: 'italic'; content: string }
  | { type: 'bold-italic'; content: string }
  | { type: 'strike'; content: string }
  | { type: 'code'; content: string }
  | { type: 'link'; text: string; href: string };

type BlockToken =
  | { type: 'heading'; level: number; text: string }
  | { type: 'codeblock'; language: string; code: string }
  | { type: 'blockquote'; text: string }
  | { type: 'hr' }
  | {
      type: 'table';
      headers: string[];
      rows: string[][];
    }
  | {
      type: 'list';
      items: { indent: number; isOrdered: boolean; index?: number; text: string }[];
    }
  | { type: 'paragraph'; text: string };

/**
 * Parses inline markdown tokens:
 * `code`, [link](url), raw https? urls, ***bold-italic***, **bold**, *italic*, _italic_, ~~strike~~
 */
function parseInline(text: string): InlineToken[] {
  if (!text) return [];

  const tokens: InlineToken[] = [];
  const inlineRegex =
    /(`[^`]+`)|(\[([^\]]+)\]\(([^)]+)\))|(\bhttps?:\/\/[^\s<]+[^<.,:;"')\]\s])|(\*\*\*([^\n]+?)\*\*\*)|(\*\*([^\n]+?)\*\*)|(\*([^\n*]+?)\*)|(_([^\n_]+?)_)|(~~([^\n~]+?)~~)/g;

  let match: RegExpExecArray | null;
  let lastIndex = 0;

  while ((match = inlineRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      // `inline code`
      tokens.push({ type: 'code', content: match[1].slice(1, -1) });
    } else if (match[2]) {
      // [text](href)
      tokens.push({ type: 'link', text: match[3], href: match[4] });
    } else if (match[5]) {
      // auto url
      tokens.push({ type: 'link', text: match[5], href: match[5] });
    } else if (match[6]) {
      // ***bold italic***
      tokens.push({ type: 'bold-italic', content: match[7] });
    } else if (match[8]) {
      // **bold**
      tokens.push({ type: 'bold', content: match[9] });
    } else if (match[10]) {
      // *italic*
      tokens.push({ type: 'italic', content: match[11] });
    } else if (match[12]) {
      // _italic_
      tokens.push({ type: 'italic', content: match[13] });
    } else if (match[14]) {
      // ~~strike~~
      tokens.push({ type: 'strike', content: match[15] });
    }

    lastIndex = inlineRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return tokens;
}

/**
 * Parses markdown text into structural block tokens.
 */
function parseBlocks(markdown: string): BlockToken[] {
  if (!markdown) return [];

  const lines = markdown.split(/\r?\n/);
  const blocks: BlockToken[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Code block
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing ```
      blocks.push({ type: 'codeblock', language: lang, code: codeLines.join('\n') });
      continue;
    }

    // Horizontal Rule (---, ___, ***)
    if (/^(---|___|\*\*\*)\s*$/.test(line.trim())) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // Headings (# to ######)
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2],
      });
      i++;
      continue;
    }

    // Blockquote (> )
    if (line.trim().startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      blocks.push({ type: 'blockquote', text: quoteLines.join('\n') });
      continue;
    }

    // Table detection: line contains | and next line is separator |---|
    if (
      line.trim().startsWith('|') &&
      i + 1 < lines.length &&
      /^\|?(\s*:?-+:?\s*\|)+(\s*:?-+:?\s*)?$/.test(lines[i + 1].trim())
    ) {
      const parseRow = (str: string) => {
        const cells = str.split('|').map((s) => s.trim());
        if (cells.length > 0 && cells[0] === '') cells.shift();
        if (cells.length > 0 && cells[cells.length - 1] === '') cells.pop();
        return cells;
      };

      const headers = parseRow(line);
      i += 2; // skip header and separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(parseRow(lines[i]));
        i++;
      }
      blocks.push({ type: 'table', headers, rows });
      continue;
    }

    // List items (unordered - / * or ordered 1.)
    const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
    if (listMatch) {
      const items: { indent: number; isOrdered: boolean; index?: number; text: string }[] = [];
      let orderCounter = 1;

      while (i < lines.length) {
        const currentLine = lines[i];
        const itemMatch = currentLine.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
        if (!itemMatch) break;

        const indent = itemMatch[1].length;
        const marker = itemMatch[2];
        const isOrdered = /^\d+\./.test(marker);
        const text = itemMatch[3];

        items.push({
          indent,
          isOrdered,
          index: isOrdered ? orderCounter++ : undefined,
          text,
        });
        i++;
      }
      blocks.push({ type: 'list', items });
      continue;
    }

    // Regular Paragraph
    const paraLines: string[] = [];
    while (i < lines.length) {
      const cur = lines[i];
      if (!cur.trim()) break;
      if (
        cur.trim().startsWith('```') ||
        cur.match(/^(#{1,6})\s+/) ||
        cur.match(/^(\s*)([-*+]|\d+\.)\s+/) ||
        cur.trim().startsWith('>') ||
        /^(---|___|\*\*\*)\s*$/.test(cur.trim()) ||
        (cur.trim().startsWith('|') &&
          i + 1 < lines.length &&
          /^\|?(\s*:?-+:?\s*\|)+(\s*:?-+:?\s*)?$/.test(lines[i + 1].trim()))
      ) {
        break;
      }
      paraLines.push(cur);
      i++;
    }

    blocks.push({ type: 'paragraph', text: paraLines.join('\n') });
  }

  return blocks;
}

export default function FormattedMarkdown({
  content,
  variant = 'bot',
  className = '',
  onLinkClick,
}: FormattedMarkdownProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const blocks = useMemo(() => parseBlocks(content), [content]);

  const handleCopyCode = useCallback((code: string, index: number) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      });
    }
  }, []);

  const renderInlineTokens = useCallback(
    (tokens: InlineToken[], parentKey: string) => {
      return tokens.map((token, idx) => {
        const key = `${parentKey}-${idx}`;

        switch (token.type) {
          case 'bold':
            return (
              <strong
                key={key}
                className={
                  variant === 'user'
                    ? 'font-bold text-white'
                    : 'font-bold text-slate-900 dark:text-white'
                }
              >
                {token.content}
              </strong>
            );

          case 'italic':
            return (
              <em key={key} className="italic">
                {token.content}
              </em>
            );

          case 'bold-italic':
            return (
              <strong
                key={key}
                className={`font-bold italic ${
                  variant === 'user' ? 'text-white' : 'text-slate-900 dark:text-white'
                }`}
              >
                {token.content}
              </strong>
            );

          case 'strike':
            return (
              <span key={key} className="line-through opacity-75">
                {token.content}
              </span>
            );

          case 'code':
            return (
              <code
                key={key}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                  variant === 'user'
                    ? 'bg-blue-700/80 text-blue-100 border border-blue-500/50'
                    : 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {token.content}
              </code>
            );

          case 'link': {
            const isExternal = token.href.startsWith('http');
            return (
              <a
                key={key}
                href={token.href}
                onClick={(e) => {
                  if (onLinkClick) {
                    e.preventDefault();
                    onLinkClick(token.href);
                  }
                }}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className={`inline-flex items-center gap-0.5 font-semibold transition underline underline-offset-2 hover:no-underline ${
                  variant === 'user'
                    ? 'text-sky-200 hover:text-white'
                    : 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
                }`}
                title={token.href}
              >
                <span>{token.text}</span>
                {isExternal && <ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />}
              </a>
            );
          }

          case 'text':
          default:
            return <span key={key}>{token.content}</span>;
        }
      });
    },
    [variant, onLinkClick]
  );

  const renderTextWithBreaks = useCallback(
    (text: string, baseKey: string) => {
      const lines = text.split('\n');
      return lines.map((line, lIdx) => (
        <React.Fragment key={`${baseKey}-l-${lIdx}`}>
          {lIdx > 0 && <br />}
          {renderInlineTokens(parseInline(line), `${baseKey}-l-${lIdx}`)}
        </React.Fragment>
      ));
    },
    [renderInlineTokens]
  );

  return (
    <div className={`space-y-2 leading-relaxed ${className}`}>
      {blocks.map((block, bIdx) => {
        const bKey = `block-${bIdx}`;

        switch (block.type) {
          case 'heading': {
            const headingContent = renderInlineTokens(parseInline(block.text), `${bKey}-h`);
            if (block.level === 1) {
              return (
                <h1
                  key={bKey}
                  className={`text-sm font-bold tracking-tight mt-3 mb-1.5 pb-1 border-b ${
                    variant === 'user'
                      ? 'text-white border-blue-400/40'
                      : 'text-slate-900 dark:text-white border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {headingContent}
                </h1>
              );
            }
            if (block.level === 2) {
              return (
                <h2
                  key={bKey}
                  className={`text-xs font-bold tracking-tight mt-2.5 mb-1 ${
                    variant === 'user' ? 'text-white' : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {headingContent}
                </h2>
              );
            }
            return (
              <h3
                key={bKey}
                className={`text-xs font-semibold tracking-tight mt-2 mb-1 flex items-center gap-1.5 ${
                  variant === 'user'
                    ? 'text-blue-100 font-bold'
                    : 'text-indigo-900 dark:text-indigo-300 font-bold'
                }`}
              >
                {headingContent}
              </h3>
            );
          }

          case 'list': {
            return (
              <div key={bKey} className="space-y-1.5 my-1.5">
                {block.items.map((item, itIdx) => {
                  const itemKey = `${bKey}-it-${itIdx}`;
                  const isNested = item.indent > 0;

                  return (
                    <div
                      key={itemKey}
                      className={`flex items-start gap-2 text-xs leading-relaxed ${
                        isNested
                          ? 'ml-4 pl-2 border-l-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          : ''
                      }`}
                    >
                      <span
                        className={`select-none shrink-0 font-bold ${
                          item.isOrdered
                            ? 'text-[11px] min-w-[18px] text-slate-500 dark:text-slate-400'
                            : isNested
                            ? 'text-slate-400 text-sm leading-none'
                            : 'text-blue-600 dark:text-blue-400 text-base leading-none'
                        } ${variant === 'user' ? '!text-white' : ''}`}
                      >
                        {item.isOrdered ? `${item.index}.` : isNested ? '◦' : '•'}
                      </span>
                      <div className="flex-1">
                        {renderInlineTokens(parseInline(item.text), itemKey)}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }

          case 'codeblock': {
            const isCopied = copiedIndex === bIdx;
            return (
              <div
                key={bKey}
                className="my-2.5 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 shadow-md overflow-hidden font-mono text-[11px]"
              >
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/90 border-b border-slate-700/80 text-slate-300 text-[10px]">
                  <span className="uppercase font-semibold tracking-wider">
                    {block.language || 'code'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(block.code, bIdx)}
                    className="flex items-center gap-1 text-slate-300 hover:text-white transition px-2 py-0.5 rounded hover:bg-slate-700/70"
                    title="Copy code"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 overflow-x-auto leading-relaxed text-slate-200 selection:bg-blue-600/40">
                  <code>{block.code}</code>
                </pre>
              </div>
            );
          }

          case 'blockquote': {
            return (
              <blockquote
                key={bKey}
                className={`border-l-3 pl-3 py-1 my-1.5 rounded-r text-xs italic leading-relaxed ${
                  variant === 'user'
                    ? 'border-white/60 bg-white/10 text-white'
                    : 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-slate-700 dark:text-slate-300'
                }`}
              >
                {renderTextWithBreaks(block.text, `${bKey}-q`)}
              </blockquote>
            );
          }

          case 'table': {
            return (
              <div
                key={bKey}
                className="my-2.5 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs"
              >
                <table className="w-full text-left text-[11px] border-collapse">
                  {block.headers.length > 0 && (
                    <thead className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200">
                      <tr>
                        {block.headers.map((h, hIdx) => (
                          <th key={`${bKey}-th-${hIdx}`} className="px-3 py-2">
                            {renderInlineTokens(parseInline(h), `${bKey}-th-${hIdx}`)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {block.rows.map((row, rIdx) => (
                      <tr
                        key={`${bKey}-tr-${rIdx}`}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                      >
                        {row.map((cell, cIdx) => (
                          <td key={`${bKey}-td-${rIdx}-${cIdx}`} className="px-3 py-1.5">
                            {renderInlineTokens(parseInline(cell), `${bKey}-td-${rIdx}-${cIdx}`)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          case 'hr': {
            return (
              <hr
                key={bKey}
                className={`my-2.5 border-t ${
                  variant === 'user'
                    ? 'border-white/30'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              />
            );
          }

          case 'paragraph':
          default: {
            return (
              <div
                key={bKey}
                className={`text-xs leading-relaxed ${
                  variant === 'user' ? 'text-white' : 'text-slate-800 dark:text-slate-100'
                }`}
              >
                {renderTextWithBreaks(block.text, bKey)}
              </div>
            );
          }
        }
      })}
    </div>
  );
}
