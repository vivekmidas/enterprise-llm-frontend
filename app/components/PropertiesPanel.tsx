'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Node, Edge } from '@xyflow/react';
import {
  X,
  Settings,
  Save,
  Loader2,
  ArrowRightLeft,
  Wand2,
  Info,
  Trash2,
  Lock,
  Copy,
  Check,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  FileCode,
  Share2,
  Upload,
  FileText,
  XCircle,
} from 'lucide-react';
import { api, getHeaders } from '@/lib/api';
import { NodePropertyDefinition, PropertyValue } from './component-categoriees';
import JsonSchemaGeneratorModal from './JsonSchemaGeneratorModal';

/* Robust choice options parser supporting arrays, objects, comma-separated strings, and nested schemas */
const parseChoiceOptions = (rawOptions: any): string[] => {
  if (!rawOptions) return [];
  if (Array.isArray(rawOptions)) {
    const result: string[] = [];
    rawOptions.forEach((item) => {
      if (typeof item === 'string') {
        if (item.includes(',')) {
          item.split(',').forEach((s) => {
            const trimmed = s.trim();
            if (trimmed && !result.includes(trimmed)) result.push(trimmed);
          });
        } else {
          const trimmed = item.trim();
          if (trimmed && !result.includes(trimmed)) result.push(trimmed);
        }
      } else if (typeof item === 'number' || typeof item === 'boolean') {
        const str = String(item);
        if (!result.includes(str)) result.push(str);
      } else if (typeof item === 'object' && item !== null) {
        const val = item.key ?? item.value ?? item.id ?? item.name ?? item.label ?? '';
        const str = String(val).trim();
        if (str && !result.includes(str)) result.push(str);
      }
    });
    return result;
  }
  if (typeof rawOptions === 'object' && rawOptions !== null) {
    if (Array.isArray(rawOptions.options)) return parseChoiceOptions(rawOptions.options);
    if (Array.isArray(rawOptions.choices)) return parseChoiceOptions(rawOptions.choices);
    if (Array.isArray(rawOptions.values)) return parseChoiceOptions(rawOptions.values);
    if (Array.isArray(rawOptions.allowed_values))
      return parseChoiceOptions(rawOptions.allowed_values);
    if (Array.isArray(rawOptions.allowedValues))
      return parseChoiceOptions(rawOptions.allowedValues);
    if (Array.isArray(rawOptions.enum)) return parseChoiceOptions(rawOptions.enum);
    const keys = Object.keys(rawOptions);
    if (keys.length > 0) {
      return keys.map((k) => String(rawOptions[k] || k).trim()).filter(Boolean);
    }
  }
  if (typeof rawOptions === 'string' && rawOptions.trim()) {
    const trimmed = rawOptions.trim();
    if (
      (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
      (trimmed.startsWith('{') && trimmed.endsWith('}'))
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed) return parseChoiceOptions(parsed);
      } catch {
        // ignore non-JSON
      }
    }
    return trimmed
      .split(',')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);
  }
  return [];
};

/** Safely parses stringified JSON arrays or handles array/object inputs */
const ensureArray = (val: any): any[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.trim()) {
    try {
      const parsed = JSON.parse(val.trim());
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [];
    }
  }
  return [];
};

/* Extracts raw choice options supporting options, choices, values, allowed_values, enum */
const getRawChoiceOptions = (schema: any, key: string, sysProps: any, usrVal: any): any => {
  if (schema) {
    if (schema.options) return schema.options;
    if (schema.choices) return schema.choices;
    if (schema.configured_values) return schema.configured_values;
    if (schema.configuredValues) return schema.configuredValues;
    if (schema.allowed_values) return schema.allowed_values;
    if (schema.allowedValues) return schema.allowedValues;
    if (schema.enum) return schema.enum;
    if (schema.values) return schema.values;
    if (Array.isArray(schema.value)) return schema.value;
    if (
      typeof schema.value === 'string' &&
      (schema.value.includes(',') || schema.value.startsWith('['))
    ) {
      return schema.value;
    }
    if (Array.isArray(schema.default)) return schema.default;
    if (
      typeof schema.default === 'string' &&
      (schema.default.includes(',') || schema.default.startsWith('['))
    ) {
      return schema.default;
    }
  }

  const sysVal = sysProps?.[key];
  if (sysVal) {
    if (Array.isArray(sysVal)) return sysVal;
    if (typeof sysVal === 'string' && (sysVal.includes(',') || sysVal.startsWith('['))) {
      return sysVal;
    }
  }

  if (usrVal) {
    if (Array.isArray(usrVal)) return usrVal;
    if (typeof usrVal === 'string' && (usrVal.includes(',') || usrVal.startsWith('['))) {
      return usrVal;
    }
  }

  return undefined;
};

/** Compact dropdown with checkboxes for multi-select. Replaces tall <select multiple>. */
const MultiSelectDropdown = ({
  options,
  selected,
  onChange,
  disabled,
  placeholder = 'Select options...',
  className = '',
}: {
  options: { key: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as HTMLElement))
        setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (key: string) => {
    if (disabled) return;
    const next = selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key];
    onChange(next);
  };

  const selectedLabels = options.filter((o) => selected.includes(o.key)).map((o) => o.label);

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm text-left transition-all ${open ? 'border-blue-500 ring-1 ring-blue-100' : 'border-gray-300 hover:border-gray-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'bg-white cursor-pointer'}`}
      >
        <span className={`truncate ${selectedLabels.length ? 'text-gray-800' : 'text-gray-400'}`}>
          {selectedLabels.length ? selectedLabels.join(', ') : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-400 ml-2 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-400 italic">No options</div>
          ) : (
            options.map((opt, idx) => (
              <label
                key={`${opt.key}-${idx}`}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt.key)}
                  onChange={() => toggle(opt.key)}
                  className="h-3.5 w-3.5 rounded accent-bg-primary"
                />
                <span className="truncate">{opt.label}</span>
              </label>
            ))
          )}
        </div>
      )}
      {selected.length > 0 && (
        <div className="text-[10px] text-gray-400 mt-1">{selected.length} selected</div>
      )}
    </div>
  );
};

// ─── PathPropertyField ───────────────────────────────────────────────────────
/** Renders a styled file-picker for property type='path'.
 *  Stores comma-delimited absolute file paths as the property value.
 *  At execution time the node runtime resolves and reads each path.
 */
interface PathPropertyFieldProps {
  field: NodePropertyDefinition;
  isDisabled: boolean;
  value: string; // comma-delimited list of paths
  handlePropertyChange: (key: string, value: string) => void;
}

const PathPropertyField = ({
  field,
  isDisabled,
  value,
  handlePropertyChange,
}: PathPropertyFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Derive the current list of selected paths from the stored string
  const selectedPaths: string[] = value
    ? value
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
    : [];

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || isDisabled) return;
    const incoming = Array.from(e.target.files).map((f) => f.name);
    const merged = field.multiple
      ? [...new Set([...selectedPaths, ...incoming])]
      : incoming.slice(0, 1);
    handlePropertyChange(field.key, merged.join(','));
    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  const removePath = (path: string) => {
    if (isDisabled) return;
    const next = selectedPaths.filter((p) => p !== path);
    handlePropertyChange(field.key, next.join(','));
  };

  return (
    <div key={field.key} className="space-y-1.5">
      <label
        className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1.5 cursor-help"
        title={field.description}
      >
        {field.label}
        {field.description && (
          <span className="text-[9px] text-blue-500 font-bold bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full leading-none shadow-sm">
            i
          </span>
        )}
      </label>

      {/* Hidden native file input */}
      <input
        ref={inputRef}
        type="file"
        accept={field.accept}
        multiple={field.multiple}
        disabled={isDisabled}
        className="hidden"
        onChange={handleFiles}
      />

      {/* Trigger button */}
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => !isDisabled && inputRef.current?.click()}
        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all
          ${isDisabled
            ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
            : 'bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-600 cursor-pointer'
          }`}
      >
        <Upload className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate text-xs">
          {field.multiple ? 'Choose file(s)…' : 'Choose file…'}
        </span>
        {field.accept && (
          <span className="ml-auto text-[9px] text-gray-400 font-mono shrink-0">
            {field.accept}
          </span>
        )}
      </button>

      {/* Selected file chips */}
      {selectedPaths.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {selectedPaths.map((p) => (
            <div
              key={p}
              className="flex items-center gap-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-md px-2 py-1 text-[11px] font-medium max-w-full"
              title={p}
            >
              <FileText className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-[160px]">{p}</span>
              {!isDisabled && (
                <button
                  type="button"
                  onClick={() => removePath(p)}
                  className="ml-0.5 text-blue-400 hover:text-red-500 transition-colors cursor-pointer"
                  title="Remove"
                >
                  <XCircle className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Hint */}
      {!isDisabled && selectedPaths.length === 0 && (
        <p className="text-[10px] text-gray-400 italic">
          {field.multiple ? 'No files selected.' : 'No file selected.'}
          {field.accept && ` Accepted: ${field.accept}`}
        </p>
      )}
    </div>
  );
};
// ─────────────────────────────────────────────────────────────────────────────

interface JsonObjectPropertyFieldProps {
  label: string;
  fieldKey: string;
  value: any;
  isDisabled?: boolean;
  description?: string;
  handlePropertyChange: (key: string, value: any) => void;
}

const JsonObjectPropertyField = ({
  label,
  fieldKey,
  value,
  isDisabled,
  description,
  handlePropertyChange,
}: JsonObjectPropertyFieldProps) => {
  const [jsonText, setJsonText] = useState(() => {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (value === undefined || value === null) {
      setJsonText('');
    } else if (typeof value === 'string') {
      setJsonText(value);
    } else {
      try {
        setJsonText(JSON.stringify(value, null, 2));
      } catch {
        setJsonText(String(value));
      }
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setJsonText(text);
    if (!text.trim()) {
      setError(null);
      handlePropertyChange(fieldKey, {});
      return;
    }
    try {
      const parsed = JSON.parse(text);
      setError(null);
      handlePropertyChange(fieldKey, parsed);
    } catch {
      setError('Invalid JSON');
    }
  };

  return (
    <div key={fieldKey} className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label
          className="block text-[10px] font-bold text-slate-455 uppercase tracking-widest flex items-center gap-1.5 cursor-help"
          title={description}
        >
          {label}
          {description && (
            <span className="text-[9px] text-blue-500 font-bold bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full leading-none shadow-sm">
              i
            </span>
          )}
        </label>
        <span className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">
          JSON Object
        </span>
      </div>
      <textarea
        value={jsonText}
        disabled={isDisabled}
        onChange={handleChange}
        placeholder="{}"
        rows={4}
        className={`w-full border rounded-xl px-3 py-2 text-xs font-mono bg-white text-slate-900 outline-none focus:ring-2 transition-all resize-y min-h-20 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100 ${error
          ? 'border-amber-400 focus:ring-amber-100'
          : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100 shadow-inner-sm'
          }`}
      />
      {error && <p className="text-[10px] text-amber-600 font-medium italic mt-0.5">{error}</p>}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

interface SourcePropertyFieldProps {
  field: any;
  isDisabled?: boolean;
  propVal: any;
  handlePropertyChange: (key: string, value: any) => void;
}

const SourcePropertyField = ({
  field,
  isDisabled,
  propVal,
  handlePropertyChange,
}: SourcePropertyFieldProps) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveSourceUrl = field.source || '';

  useEffect(() => {
    if (!effectiveSourceUrl || !effectiveSourceUrl.trim()) {
      setData(null);
      return;
    }

    const isUrl = effectiveSourceUrl.startsWith('/') || effectiveSourceUrl.startsWith('http');
    if (!isUrl) {
      try {
        setData(JSON.parse(effectiveSourceUrl));
        setError(null);
      } catch {
        if (effectiveSourceUrl.includes(',')) {
          setData(
            effectiveSourceUrl
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean),
          );
        } else {
          setData(effectiveSourceUrl);
        }
        setError(null);
      }
      return;
    }

    let active = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
        const fullUrl = effectiveSourceUrl.startsWith('http')
          ? effectiveSourceUrl
          : `${BACKEND_URL}${effectiveSourceUrl.startsWith('/') ? '' : '/'}${effectiveSourceUrl}`;

        /* ==============================================================================
           BLOCK COMMENT: PROPERTY ENUM SOURCE FETCH WITH CREDENTIALS
           ============================================================================== */
        const res = await fetch(fullUrl, {
          credentials: 'include',
          headers: getHeaders({ 'Content-Type': 'application/json' }),
        });
        if (!res.ok) {
          throw new Error(`Fetch failed: ${res.statusText}`);
        }
        const json = await res.json();
        if (active) {
          setData(json);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Failed to fetch');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, [effectiveSourceUrl]);

  let resolvedData = data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const arrayKey = Object.keys(data).find((k) => Array.isArray(data[k]));
    if (arrayKey) {
      resolvedData = data[arrayKey];
    }
  }

  const isList = Array.isArray(resolvedData);
  const isDict = resolvedData !== null && typeof resolvedData === 'object' && !isList;
  const isMultiple = !!field.multiple;

  const getOptKeyLabel = (opt: any): { key: string; label: string } => {
    if (opt && typeof opt === 'object') {
      const key = String(opt.id ?? opt.key ?? opt.value ?? opt.name ?? '');
      const label = String(opt.name ?? opt.label ?? opt.title ?? opt.key ?? opt.id ?? '');
      return { key, label };
    }
    return { key: String(opt), label: String(opt) };
  };

  const selectValue = isMultiple
    ? Array.isArray(propVal)
      ? propVal.map((v) =>
        typeof v === 'object' && v !== null ? String(v.id ?? v.key ?? v.value ?? '') : String(v),
      )
      : typeof propVal === 'string' && propVal.trim()
        ? propVal.split(',')
        : []
    : typeof propVal === 'object' && propVal !== null
      ? String(propVal.id ?? propVal.key ?? propVal.value ?? propVal.name ?? '')
      : String(propVal ?? '');

  const handleChange = (newVal: any) => {
    if (isDisabled) return;
    handlePropertyChange(field.key, newVal);
  };

  // Extract selected item object to display key-value pair details
  const selectedItem = isList
    ? (resolvedData as any[])?.find((opt: any) => getOptKeyLabel(opt).key === String(selectValue))
    : isDict
      ? (resolvedData as Record<string, any>)?.[String(selectValue)]
      : null;

  const displayKeyValuePairs =
    selectedItem && typeof selectedItem === 'object' && !Array.isArray(selectedItem)
      ? Object.entries(selectedItem).filter(
        ([k]) =>
          !['id', 'created_at', 'updated_at', 'customer_id', 'tenant_id', 'created_by'].includes(
            k.toLowerCase(),
          ),
      )
      : [];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label
          className="block text-xs font-semibold text-gray-500 flex items-center gap-1.5 cursor-help"
          title={field.description}
        >
          {field.label}
          {field.description && (
            <span className="text-[9px] text-blue-500 font-bold bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full leading-none shadow-sm">
              i
            </span>
          )}
        </label>
        {loading && <span className="text-[10px] text-blue-500 animate-pulse">Loading...</span>}
        {error && (
          <span className="text-[10px] text-red-500" title={error}>
            Error loading
          </span>
        )}
      </div>

      {/* Element 1: Dropdown / MultiSelect selection */}
      {isList ? (
        isMultiple ? (
          <MultiSelectDropdown
            disabled={isDisabled}
            selected={Array.isArray(selectValue) ? selectValue : []}
            options={resolvedData.map((opt: any) => getOptKeyLabel(opt))}
            onChange={(values) => handleChange(values)}
            placeholder={`Select ${field.label || 'options'}...`}
          />
        ) : (
          <select
            disabled={isDisabled}
            value={selectValue}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:border-blue-500 bg-white text-black font-medium shadow-sm"
          >
            <option value="">Select {field.label || 'option'}...</option>
            {resolvedData.map((opt: any, idx: number) => {
              const { key, label } = getOptKeyLabel(opt);
              return (
                <option key={`${key}-${idx}`} value={key}>
                  {label}
                </option>
              );
            })}
          </select>
        )
      ) : isDict ? (
        isMultiple ? (
          <MultiSelectDropdown
            disabled={isDisabled}
            selected={Array.isArray(selectValue) ? selectValue : []}
            options={Object.entries(resolvedData).map(([k, v]) => ({ key: k, label: String(v) }))}
            onChange={(values) => handleChange(values)}
            placeholder={`Select ${field.label || 'options'}...`}
          />
        ) : (
          <select
            disabled={isDisabled}
            value={selectValue}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:border-blue-500 bg-white text-black font-medium shadow-sm"
          >
            <option value="">Select {field.label || 'option'}...</option>
            {Object.entries(resolvedData).map(([k, v], idx) => (
              <option key={`${k}-${idx}`} value={k}>
                {String(v)}
              </option>
            ))}
          </select>
        )
      ) : !loading && !error ? (
        <input
          type="text"
          disabled={isDisabled}
          value={String(propVal ?? '')}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white text-black focus:outline-none focus:border-blue-500 shadow-sm"
          placeholder={`Enter ${field.label || 'value'}...`}
        />
      ) : null}

      {/* Element 2: Key-value pair read-only values of the selected option */}
      {displayKeyValuePairs.length > 0 && (
        <div className="mt-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/80 space-y-1.5 shadow-inner">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Details (Read-Only)
          </div>
          {displayKeyValuePairs.map(([k, v]) => (
            <div
              key={k}
              className="flex justify-between items-center text-xs border-b border-slate-200/50 pb-1 last:border-0 last:pb-0"
            >
              <span className="font-semibold text-slate-600 capitalize text-[11px]">
                {k.replace(/_/g, ' ')}
              </span>
              <span
                className="font-mono text-[11px] text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 truncate max-w-[65%]"
                title={typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')}
              >
                {typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Helper to normalize and parse system properties from different database formats
const parseSystemProperties = (value: any): Record<string, any> => {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      return parseSystemProperties(JSON.parse(value));
    } catch {
      return {};
    }
  }
  if (Array.isArray(value)) {
    const result: Record<string, any> = {};
    value.forEach((item) => {
      let entry = item;
      if (typeof item === 'string') {
        try {
          entry = JSON.parse(item);
        } catch {
          return;
        }
      }
      if (entry && typeof entry === 'object' && entry.key) {
        result[entry.key] =
          entry.value !== undefined
            ? entry.value
            : entry.default !== undefined
              ? entry.default
              : '';
      }
    });
    return result;
  }
  if (typeof value === 'object') {
    const result: Record<string, any> = {};
    Object.entries(value).forEach(([k, v]) => {
      if (v && typeof v === 'object' && ('value' in v || 'default' in v)) {
        const obj = v as any;
        result[k] =
          obj.value !== undefined ? obj.value : obj.default !== undefined ? obj.default : '';
      } else {
        result[k] = v;
      }
    });
    return result;
  }
  return {};
};

interface ContractTreeNode {
  name: string;
  path: string;
  type: string;
  required: boolean;
  stateable: boolean;
  children?: ContractTreeNode[];
  isLeaf: boolean;
}

const normalizeContract = (contract: any): any => {
  if (!contract) return { type: 'object', properties: {} };
  let parsed = contract;
  if (typeof contract === 'string') {
    try {
      parsed = JSON.parse(contract);
    } catch {
      return { type: 'object', properties: {} };
    }
  }
  if (!parsed || typeof parsed !== 'object') {
    return { type: 'object', properties: {} };
  }

  // Convert rules array to standard schema
  if (Array.isArray(parsed.rules)) {
    const root: any = { type: 'object', properties: {}, required: [] };
    parsed.rules.forEach((rule: any) => {
      if (!rule || typeof rule !== 'object') return;
      const fieldName = rule.field_name || rule.field || rule.name || '';
      if (!fieldName) return;

      const fieldSchema: any = {
        type: rule.field_type || rule.type || 'string',
        required: rule.required || false,
        stateable: rule.stateable || rule.state_required || false,
        description: rule.description || '',
      };

      const parts = fieldName.split('.');
      let current = root;
      parts.forEach((part: string, idx: number) => {
        const isLeaf = idx === parts.length - 1;
        if (!current.properties) current.properties = {};

        const cleanPart = part.replace('[]', '');
        if (isLeaf) {
          current.properties[cleanPart] = {
            ...current.properties[cleanPart],
            ...fieldSchema,
          };
          if (fieldSchema.required) {
            if (!current.required) current.required = [];
            if (!current.required.includes(cleanPart)) {
              current.required.push(cleanPart);
            }
          }
        } else {
          if (!current.properties[cleanPart]) {
            current.properties[cleanPart] = {
              type: 'object',
              properties: {},
              required: [],
            };
          }
          current = current.properties[cleanPart];
        }
      });
    });
    return root;
  }

  // Standard JSON schema
  if (parsed.properties || parsed.type === 'object') {
    const root = { ...parsed };
    const normalizeNode = (node: any) => {
      if (!node || typeof node !== 'object') return;
      if (node.properties && typeof node.properties === 'object') {
        const reqList = Array.isArray(node.required) ? node.required : [];
        Object.entries(node.properties).forEach(([k, v]: [string, any]) => {
          if (v && typeof v === 'object') {
            if (reqList.includes(k)) {
              v.required = true;
            }
            normalizeNode(v);
          }
        });
      }
    };
    normalizeNode(root);
    return root;
  }

  // Legacy flat format (e.g. { symbol: "string" })
  const root: any = { type: 'object', properties: {}, required: [] };
  Object.entries(parsed).forEach(([key, val]: [string, any]) => {
    if (typeof val === 'string') {
      root.properties[key] = { type: val };
    } else if (val && typeof val === 'object') {
      root.properties[key] = {
        type: val.type || 'string',
        required: val.required || false,
        stateable: val.stateable || false,
      };
    }
  });
  return root;
};

const buildTreeFromSchema = (schema: any, prefix = ''): ContractTreeNode[] => {
  if (!schema || typeof schema !== 'object') return [];
  const props = schema.properties;
  if (!props || typeof props !== 'object') return [];

  return Object.keys(props).map((key) => {
    const val = props[key];
    const path = prefix ? `${prefix}.${key}` : key;
    const isLeaf = !(val.properties || val.type === 'object');

    return {
      name: key,
      path,
      type: val.type || 'string',
      required: Boolean(val.required),
      stateable: Boolean(val.stateable || val.state_required),
      isLeaf,
      children: isLeaf ? undefined : buildTreeFromSchema(val, path),
    };
  });
};

const ContractTreeRenderer: React.FC<{
  nodes: ContractTreeNode[];
  depth?: number;
  isOutput?: boolean;
  readOnly?: boolean;
  onToggleRequired?: (path: string, isReq: boolean) => void;
  onToggleStateable?: (path: string, isState: boolean) => void;
}> = ({
  nodes,
  depth = 0,
  isOutput = false,
  readOnly = false,
  onToggleRequired,
  onToggleStateable,
}) => {
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

    return (
      <div className="space-y-1 font-mono text-[11px] w-full">
        {nodes.map((node) => {
          const isExpanded = !collapsed[node.path];
          const hasChildren = node.children && node.children.length > 0;

          return (
            <div key={node.path} className="flex flex-col w-full">
              <div
                className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-100/80 gap-2 transition-colors w-full"
                style={{ paddingLeft: `${depth * 0.75 + 0.25}rem` }}
              >
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  {hasChildren ? (
                    <button
                      onClick={() =>
                        setCollapsed((prev) => ({ ...prev, [node.path]: !prev[node.path] }))
                      }
                      className="p-0.5 hover:bg-slate-200 rounded text-slate-500 transition-colors cursor-pointer shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </button>
                  ) : (
                    <span className="w-4 shrink-0" />
                  )}

                  {hasChildren ? (
                    isExpanded ? (
                      <FolderOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    ) : (
                      <Folder className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    )
                  ) : (
                    <FileCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}

                  <span className="text-slate-700 truncate font-semibold">
                    {node.name}
                    {node.required && (
                      <span className="text-red-500 ml-0.5 font-bold" title="Required">
                        *
                      </span>
                    )}
                  </span>

                  <span className="text-[8px] font-semibold text-slate-500 bg-slate-100 px-1 rounded border border-slate-250/70 uppercase shrink-0">
                    {node.type}
                  </span>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {isOutput ? (
                    <>
                      <button
                        onClick={() => onToggleRequired?.(node.path, !node.required)}
                        className={`text-[8px] font-bold px-1.5 py-0.5 rounded border transition-colors cursor-pointer shrink-0 uppercase tracking-wider ${node.required
                          ? 'text-amber-600 bg-amber-50 border-amber-250 hover:bg-amber-100/80'
                          : 'text-slate-400 bg-slate-50 border-slate-200 hover:bg-slate-100 hover:text-slate-600'
                          }`}
                        title={node.required ? 'Click to make optional' : 'Click to make required'}
                      >
                        Req
                      </button>
                      <button
                        onClick={() => onToggleStateable?.(node.path, !node.stateable)}
                        className={`flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded border transition-colors cursor-pointer shrink-0 uppercase tracking-wider ${node.stateable
                          ? 'text-emerald-600 bg-emerald-50 border-emerald-250 hover:bg-emerald-100/80'
                          : 'text-slate-400 bg-slate-50 border-slate-200 hover:bg-slate-100 hover:text-slate-600'
                          }`}
                        title={
                          node.stateable
                            ? 'Click to stop sharing state'
                            : 'Click to share value to workflow state'
                        }
                      >
                        <Share2
                          className={`w-2 h-2 ${node.stateable ? 'text-emerald-500' : 'text-slate-400'}`}
                        />
                        Shared
                      </button>
                    </>
                  ) : (
                    <>
                      {node.required && (
                        <span
                          className="text-[8px] font-bold text-amber-600 bg-amber-50 px-1 py-0.5 rounded border border-amber-250 tracking-wider uppercase shrink-0"
                          title="Required Parameter"
                        >
                          Req
                        </span>
                      )}
                      {node.stateable && (
                        <span
                          className="flex items-center gap-0.5 text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-250 tracking-wider uppercase shrink-0"
                          title="State Shared Variable"
                        >
                          <Share2 className="w-2 h-2 text-emerald-500" />
                          Shared
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {hasChildren && isExpanded && (
                <ContractTreeRenderer
                  nodes={node.children!}
                  depth={depth + 1}
                  isOutput={isOutput}
                  readOnly={readOnly}
                  onToggleRequired={onToggleRequired}
                  onToggleStateable={onToggleStateable}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

// Assuming AgentPropertyDefinition and PropertyValue are defined in component-categoriees.ts
// If not, you would define them here:
// export type PropertyValue = string | number | boolean | string[] | undefined;
// export interface AgentPropertyDefinition {
//   key: string;
//   label: string;
//   type: 'string' | 'number' | 'boolean' | 'choice' | 'textarea' | 'password' | 'credential';
//   placeholder?: string;
//   default?: PropertyValue;
//   options?: string[]; // For 'choice' type
//   multiple?: boolean; // For 'choice' type
//   description?: string;
//   credentialType?: string; // New field for 'credential' type
// }

/** Modal for visual field mapping between source and target nodes */
function FieldMapperModal({
  isOpen,
  onClose,
  sourceContract,
  targetContract,
  currentMapping,
  onSaveMapping,
}: {
  isOpen: boolean;
  onClose: () => void;
  sourceContract: any;
  targetContract: any;
  currentMapping: Record<string, string>;
  onSaveMapping: (mapping: Record<string, string>) => void;
}) {
  const [mapping, setMapping] = useState<Record<string, string>>(currentMapping);

  const sourceFields = useMemo(() => {
    const props = sourceContract?.properties || sourceContract || {};
    return Object.keys(props);
  }, [sourceContract]);

  const targetFields = useMemo(() => {
    const props = targetContract?.properties || targetContract || {};
    return Object.keys(props);
  }, [targetContract]);

  const handleAutoMap = () => {
    const newMapping = { ...mapping };
    targetFields.forEach((target) => {
      // Simple case-insensitive match
      const match = sourceFields.find((s) => s.toLowerCase() === target.toLowerCase());
      if (match) {
        newMapping[target] = `{{ input_data.${match} }}`;
      }
    });
    setMapping(newMapping);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-bg-primary" />
            <h2 className="text-lg font-bold text-gray-800">Field Mapper</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 bg-blue-50 border-b flex items-center justify-between">
          <p className="text-xs text-blue-700 flex items-center gap-2">
            <Info size={14} />
            Map fields from the previous node's output to the next node's input.
          </p>
          <button
            onClick={handleAutoMap}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all"
          >
            <Wand2 size={14} />
            Auto-map Fields
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b">
                <th className="pb-2 font-semibold">Target Field (Input)</th>
                <th className="pb-2 font-semibold text-center">→</th>
                <th className="pb-2 font-semibold">Source Data (Jinja2)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {targetFields.map((field) => (
                <tr key={field} className="group">
                  <td className="py-3 font-medium text-gray-700">{field}</td>
                  <td className="py-3 text-center text-gray-300">→</td>
                  <td className="py-3">
                    <input
                      type="text"
                      value={mapping[field] || ''}
                      onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                      placeholder="{{ input_data.field_name }}"
                      className="w-full border rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onSaveMapping(mapping)}
            className="px-6 py-2 bg-primary hover:bg-blue-700 text-white text-sm font-bold rounded-lg"
          >
            Apply Mapping
          </button>
        </div>
      </div>
    </div>
  );
}

/** Type representing agent-specific configuration values */
type NodeProperties = Record<string, PropertyValue>;
/** Type for the generic node data object stored in ReactFlow */
type NodeData = Record<string, PropertyValue | NodeProperties | undefined>;

interface PropertiesPanelProps {
  /** The ReactFlow node currently selected on the canvas */
  selectedNode: Node | null;
  /** The ReactFlow edge currently selected on the canvas */
  selectedEdge?: Edge | null;
  /** Callback fired when the close button is clicked (non-optional) */
  onClose: () => void;
  /** Callback to propagate data changes back to the workflow state (local ReactFlow update only) */
  onUpdateNode: (nodeId: string, newData: NodeData) => void;
  onUpdateEdge?: (edgeId: string, newEdge: Partial<Edge>) => void;
  /** Callback for global save action */
  onSave?: () => void;
  /** The ID of the current workflow (agent) */
  workflowId?: string;
  /** Callback to explicitly save instance-specific properties to the backend */
  onSaveInstanceProperties: (nodeId: string, properties: NodeProperties) => Promise<void>;
  /** Callback to delete node from canvas */
  onDeleteNode?: (nodeId: string) => void;
  onOpenMapper?: () => void;
  hasPredecessor?: boolean;
  userRole?: string;
}

/**
 * PropertiesPanel - Sidebar component for editing agent node configurations.
 *
 * It dynamically renders form fields
 * and allows editing basic metadata like name and description.
 */
export default function PropertiesPanel({
  selectedNode,
  selectedEdge,
  onClose,
  onUpdateNode, // Keep original name, but its behavior is now just local state update
  onUpdateEdge,
  onSaveInstanceProperties, // New prop for explicit instance property saving
  onSave,
  workflowId,
  onDeleteNode,
  onOpenMapper,
  hasPredecessor = false,
  userRole,
}: PropertiesPanelProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [showAuthForm, setShowAuthForm] = useState<string | null>(null);
  const [newConn, setNewConn] = useState({ name: '', clientId: '', clientSecret: '' });
  const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [viewMode, setViewMode] = useState<'config' | 'contract'>('config');
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
  const [generatorModalType, setGeneratorModalType] = useState<'input' | 'output'>('input');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    parameters: false,
    mapping: false,
    system: true,
  });

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Local state for fetched contracts and properties from API
  const [inputContract, setInputContract] = useState<any>({});
  const [outputContract, setOutputContract] = useState<any>({});
  const [properties, setProperties] = useState<NodeProperties>({});
  const [systemProperties, setSystemProperties] = useState<NodeProperties>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [kbList, setKbList] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    if (!selectedNode) return;
    const propertySchema = (selectedNode.data as any)?.propertySchema || [];
    const hasKbField = propertySchema.some((f: any) => f.key === 'knowledge_base_ids');
    if (hasKbField) {
      api
        .getKnowledgeBases()
        .then((res) => {
          setKbList(res || []);
        })
        .catch((err) => console.error('Failed to load KBs for properties panel:', err));
    }
  }, [selectedNode?.id]);

  const systemKeys = Object.keys(systemProperties);
  const userPropsArray = ensureArray((selectedNode?.data as any)?.user_properties);
  const systemPropsArray = ensureArray((selectedNode?.data as any)?.system_properties);
  const schemaArray = ensureArray(
    (selectedNode?.data as any)?.propertySchema || (selectedNode?.data as any)?.property_schema,
  );

  const allParamKeys = Array.from(
    new Set([
      ...schemaArray.map((f: any) => f?.key).filter(Boolean),
      ...userPropsArray.map((f: any) => f?.key).filter(Boolean),
      ...Object.keys(properties),
    ]),
  );

  const IGNORED_METADATA_KEYS = new Set([
    'created_at',
    'updated_at',
    'last_updated',
    'last_updated_at',
    'id',
    'customer_id',
    'node_type',
    'version',
    'created_by',
    'tenant_id',
  ]);

  const entries = allParamKeys
    .filter(
      (key) =>
        key.toLowerCase() !== 'mapping_template' &&
        !systemKeys.includes(key) &&
        !IGNORED_METADATA_KEYS.has(key.toLowerCase()),
    )
    .map((key) => [key, properties[key]] as [string, any]);

  const systemEntries = Object.entries(systemProperties).filter(
    ([key]) => !IGNORED_METADATA_KEYS.has(key.toLowerCase()),
  );

  const handleSaveContract = (type: 'input' | 'output', newSchema: any) => {
    if (!selectedNode) return;

    const updatedData = {
      ...(selectedNode.data as any),
      [type === 'input' ? 'input_contract' : 'output_contract']: newSchema,
    };

    if (type === 'input') {
      setInputContract(newSchema);
    } else {
      setOutputContract(newSchema);
    }

    onUpdateNode(selectedNode.id, updatedData);
  };

  const handleCopy = (key: string, value: any) => {
    const copyText =
      typeof value === 'object' && value !== null
        ? JSON.stringify(value, null, 2)
        : String(value ?? '');
    navigator.clipboard.writeText(copyText);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // Edge editor state
  const [edgeCondition, setEdgeCondition] = useState<string>('');
  const [edgeExpression, setEdgeExpression] = useState<string>('');
  const [sourceOutputPreview, setSourceOutputPreview] = useState<any>(null);
  const [allowedConditions, setAllowedConditions] = useState<string[]>([]);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const data = await api.getProviders();
        setProviders(data || []);
      } catch (err) {
        console.error('Failed to load OAuth providers', err);
      }
    };
    fetchProviders();
  }, []);

  const handleStartAuth = (provider: string) => {
    const providerKey = provider || selectedProvider;
    /* ==============================================================================
       BLOCK COMMENT: STRIP CLIENT SECRET FROM BROWSER QUERY URL
       Prevents secret leakage to browser history, logs, and referrers.
       ============================================================================== */
    const url = `/auth/${providerKey}/connect/?client_id=${encodeURIComponent(newConn.clientId)}&name=${encodeURIComponent(newConn.name)}`;
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(url, 'auth-popup', `width=${width},height=${height},left=${left},top=${top}`);
  };

  useEffect(() => {
    // Reset properties if nothing is selected
    if (!selectedNode && !selectedEdge) {
      setInputContract({});
      setOutputContract({});
      setProperties({});
      setSystemProperties({});
      setSourceOutputPreview(null);
      setAllowedConditions(['success', 'failure']);
      setEdgeCondition('');
      setEdgeExpression('');
      return;
    }

    // Load node properties if selected
    if (selectedNode) {
      const localData = selectedNode.data as NodeData;

      setInputContract(
        (localData.input_contract || localData.inputContract || {}) as Record<string, any>,
      );
      setOutputContract(
        (localData.output_contract || localData.outputContract || {}) as Record<string, any>,
      );
      setProperties((localData.properties || {}) as NodeProperties);
      setSystemProperties(
        parseSystemProperties(localData.system_properties || localData.systemProperties),
      );

      api
        .getAgentNodeProperties(workflowId || '', selectedNode.id)
        .then((res) => {
          if (!res) return;
          setInputContract(res?.input_contract || res?.inputContract || {});
          setOutputContract(res?.output_contract || res?.outputContract || {});
          setProperties(res?.properties || {});
          setSystemProperties(
            parseSystemProperties(res?.system_level_properties || res?.system_properties || {}),
          );
        })
        .catch((err) => console.error('Failed to fetch node contracts', err));
    }

    // Load edge properties if selected
    if (selectedEdge && workflowId) {
      const srcId = String((selectedEdge as any).source || '');
      api
        .getAgentNodeProperties(workflowId || '', srcId)
        .then((res) => {
          setSourceOutputPreview(
            res?.output_example || res?.output_contract || res?.outputContract || null,
          );
          const declared = (
            (res?.properties?.conditions ||
              res?.user_properties?.conditions ||
              res?.userProperties?.conditions ||
              []) as string[]
          ).filter((c) => c !== 'default');
          setAllowedConditions(declared.length ? declared : ['success', 'failure']);

          const edgeData = (selectedEdge as any).data || {};
          let currentCondition =
            edgeData.condition ||
            (selectedEdge as any).condition ||
            (selectedEdge as any).sourceHandle ||
            '';
          if (currentCondition === 'source-right' || currentCondition === 'source-bottom') {
            currentCondition = 'default';
          }
          const currentExpression = edgeData.expression || (selectedEdge as any).expression || '';

          setEdgeCondition(currentCondition);
          setEdgeExpression(currentExpression);
        })
        .catch((err) =>
          console.error('Failed to fetch source node properties for edge preview', err),
        );
    } else {
      setSourceOutputPreview(null);
      setAllowedConditions(['success', 'failure', 'default']);
      setEdgeCondition('');
      setEdgeExpression('');
    }
  }, [selectedNode?.id, selectedEdge?.id, workflowId]);

  // Sync properties from selectedNode if they change externally (e.g., from mapping controller or other modals)
  const stringifiedNodeProps = JSON.stringify((selectedNode?.data as any)?.properties || {});
  useEffect(() => {
    if (selectedNode) {
      const nodeProps = ((selectedNode.data as any)?.properties || {}) as NodeProperties;
      if (JSON.stringify(properties) !== JSON.stringify(nodeProps)) {
        setProperties(nodeProps);
      }
    }
  }, [stringifiedNodeProps, selectedNode?.id]);

  const stringifiedInputContract = JSON.stringify(
    (selectedNode?.data as any)?.input_contract || (selectedNode?.data as any)?.inputContract || {},
  );
  const stringifiedOutputContract = JSON.stringify(
    (selectedNode?.data as any)?.output_contract ||
    (selectedNode?.data as any)?.outputContract ||
    {},
  );
  useEffect(() => {
    if (selectedNode) {
      const localData = selectedNode.data as any;
      const nodeInput = localData.input_contract || localData.inputContract || {};
      const nodeOutput = localData.output_contract || localData.outputContract || {};

      if (JSON.stringify(inputContract) !== JSON.stringify(nodeInput)) {
        setInputContract(nodeInput);
      }
      if (JSON.stringify(outputContract) !== JSON.stringify(nodeOutput)) {
        setOutputContract(nodeOutput);
      }
    }
  }, [stringifiedInputContract, stringifiedOutputContract, selectedNode?.id]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'CREDENTIAL_CREATED') {
        const { credentialId, credentialName } = event.data;
        setCredentials((prev) => [
          ...prev,
          { id: credentialId, name: credentialName, type: showAuthForm },
        ]);
        if (activeFieldKey) {
          handlePropertyChange(activeFieldKey, credentialId);
        }
        setShowAuthForm(null);
        setSelectedProvider('');
        setNewConn({ name: '', clientId: '', clientSecret: '' });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [showAuthForm, activeFieldKey]);

  /**
   * Updates a nested property inside the 'properties' bag.
   * Used for agent-specific configurations like API keys, URLs, etc.
   */
  const handlePropertyChange = (key: string, value: PropertyValue) => {
    if (!selectedNode || !onUpdateNode) return;

    const updatedProps = {
      ...properties,
      [key]: value,
    };

    setProperties(updatedProps);

    const nodeData = selectedNode.data as NodeData;
    const newData = {
      ...nodeData,
      properties: updatedProps,
    };

    onUpdateNode(selectedNode.id, newData);
  };

  const handleMultiplePropertiesChange = (updates: Record<string, any>) => {
    if (!selectedNode || !onUpdateNode) return;

    const updatedProps = {
      ...properties,
      ...updates,
    };

    setProperties(updatedProps);

    const nodeData = selectedNode.data as NodeData;
    const newData = {
      ...nodeData,
      properties: updatedProps,
    };

    onUpdateNode(selectedNode.id, newData);
  };

  const handleToggleRequiredField = (fieldKey: string, isReq: boolean) => {
    if (!selectedNode || !onUpdateNode) return;

    // Update required in output_contract rules
    const currentContract = { ...(outputContract || {}) };
    const rules = Array.isArray(currentContract.rules) ? [...currentContract.rules] : [];

    const ruleIdx = rules.findIndex(
      (r: any) => r && (r.field_name === fieldKey || r.name === fieldKey),
    );
    if (ruleIdx >= 0) {
      rules[ruleIdx] = {
        ...rules[ruleIdx],
        required: isReq,
      };
    } else {
      rules.push({
        field_name: fieldKey,
        field_type: 'string',
        required: isReq,
        stateable: false,
      });
    }

    const updatedContract = {
      ...currentContract,
      rules,
    };

    setOutputContract(updatedContract);

    const nodeData = selectedNode.data as any;
    const newData = {
      ...nodeData,
      output_contract: updatedContract,
    };

    onUpdateNode(selectedNode.id, newData);
  };

  const handleToggleStateableField = (fieldKey: string, isState: boolean) => {
    if (!selectedNode || !onUpdateNode) return;

    // Update stateable in output_contract rules
    const currentContract = { ...(outputContract || {}) };
    const rules = Array.isArray(currentContract.rules) ? [...currentContract.rules] : [];

    const ruleIdx = rules.findIndex(
      (r: any) => r && (r.field_name === fieldKey || r.name === fieldKey),
    );
    if (ruleIdx >= 0) {
      rules[ruleIdx] = {
        ...rules[ruleIdx],
        stateable: isState,
      };
    } else {
      rules.push({
        field_name: fieldKey,
        field_type: 'string',
        required: false,
        stateable: isState,
      });
    }

    const updatedContract = {
      ...currentContract,
      rules,
    };

    setOutputContract(updatedContract);

    const nodeData = selectedNode.data as any;
    const newData = {
      ...nodeData,
      output_contract: updatedContract,
    };

    onUpdateNode(selectedNode.id, newData);
  };

  /**
   * Saves the current node's configuration to the global registry (catalog).
   * This updates the master definition for this node type in the database.
   */
  const handleSaveToRegistry = async () => {
    if (!selectedNode) return;
    // This function remains for saving the node type definition to the global registry
    setIsSaving(true);
    try {
      const nodeData = selectedNode.data as any;
      const payload = {
        ...nodeData,

        // Ensure properties are included for the registry update
        properties: nodeData.properties,
        input_contract: nodeData.input_contract,
        output_contract: nodeData.output_contract,
        // Also include other top-level fields that might be edited in AdminPage
        name: nodeData.name,
        label: nodeData.label,
        description: nodeData.description,
        node_type: nodeData.node_type,
        version: nodeData.version,
        category: nodeData.category,
        group: nodeData.group,
        icon: nodeData.icon,
        color: nodeData.color,
      };
      await api.updateNode(payload);
      if (onSave) onSave();
    } catch (error) {
      console.error('Failed to update node registry:', error);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Saves the current node's instance-specific configuration to the backend.
   * This updates the properties for this specific node within the current workflow.
   */
  const handleSaveInstanceProperties = async () => {
    if (!selectedNode || !onSaveInstanceProperties) return;
    setIsSaving(true);
    try {
      const localData = selectedNode.data as any;
      const userPropsArray = ensureArray(localData.user_properties);
      const systemPropsArray = ensureArray(localData.system_properties);
      const schemaArray = ensureArray(localData.propertySchema || localData.property_schema);

      const sanitizedProps = { ...properties };
      Object.keys(sanitizedProps).forEach((key) => {
        const catalogSchema = schemaArray.find((f: any) => f && f.key === key) || {};
        const userSchema = userPropsArray.find((f: any) => f && f.key === key) || {};
        const systemSchema = systemPropsArray.find((f: any) => f && f.key === key) || {};
        const fieldSchema = {
          ...catalogSchema,
          ...userSchema,
          ...systemSchema,
          options: catalogSchema.options || userSchema.options || systemSchema.options,
          choices: catalogSchema.choices || userSchema.choices || systemSchema.choices,
          configured_values:
            catalogSchema.configured_values ||
            userSchema.configured_values ||
            systemSchema.configured_values,
          values: catalogSchema.values || userSchema.values || systemSchema.values,
        };

        if (fieldSchema && fieldSchema.key) {
          const fieldType = fieldSchema.type || fieldSchema.field_type;
          if (fieldType === 'choice' && !fieldSchema.multiple) {
            const rawOptions = getRawChoiceOptions(
              fieldSchema,
              key,
              systemProperties,
              sanitizedProps[key],
            );
            const options = parseChoiceOptions(rawOptions);
            const valStr = String(sanitizedProps[key] ?? '').trim();
            if (valStr.includes(',')) {
              const opts = options.length > 0 ? options : parseChoiceOptions(valStr);
              if (opts.length > 0) {
                sanitizedProps[key] = opts[0];
              }
            } else if (!valStr && options.length > 0) {
              sanitizedProps[key] = options[0];
            }
          }
        }
      });

      const payload = {
        ...sanitizedProps,
        label: (selectedNode.data as any).label || (selectedNode.data as any).name || '',
        input_contract: inputContract,
        output_contract: outputContract,
      };
      await onSaveInstanceProperties(selectedNode.id, payload);

      // Refresh the panel's data from the backend to ensure consistency and resolve defaults
      const res = await api.getAgentNodeProperties(workflowId || '', selectedNode.id);
      if (res) {
        setInputContract(res?.input_contract || res?.inputContract || {});
        setOutputContract(res?.output_contract || res?.outputContract || {});
        setProperties(res?.properties || {});
        setSystemProperties(
          parseSystemProperties(res?.system_level_properties || res?.system_properties || {}),
        );

        // Also sync the resolved values back to the canvas/reactflow node data
        const nodeData = selectedNode.data as NodeData;
        const newData = {
          ...nodeData,
          properties: res?.properties || {},
          input_contract: res?.input_contract || res?.inputContract || {},
          output_contract: res?.output_contract || res?.outputContract || {},
          property_schema:
            res?.property_schema || res?.propertySchema || nodeData.property_schema || [],
          propertySchema:
            res?.property_schema || res?.propertySchema || nodeData.propertySchema || [],
        };
        onUpdateNode(selectedNode.id, newData);
      }
    } catch (error) {
      console.error('Failed to save node instance properties:', error);
    } finally {
      setIsSaving(false);
    }
  };

  /** Helper to safely retrieve current value or appropriate default for the field type */
  const getPropertyValue = (properties: NodeProperties, field: NodePropertyDefinition) => {
    if (properties[field.key] !== undefined) return properties[field.key];
    if (field.default !== undefined && field.default !== null) return field.default;
    const fieldType = field.type || (field as any).field_type;
    if (fieldType === 'boolean') return false;
    if (field.multiple) return [];
    return '';
  };

  /** Renders the appropriate UI input based on the field definition from the agent schema */
  const renderPropertyField = (
    field: NodePropertyDefinition,
    userProps: NodeProperties,
    systemProps: NodeProperties,
  ) => {
    const hasUserValue = userProps.hasOwnProperty(field.key);
    const isSystem = systemProps.hasOwnProperty(field.key) && !hasUserValue;
    const value = hasUserValue
      ? userProps[field.key]
      : systemProps.hasOwnProperty(field.key)
        ? systemProps[field.key]
        : getPropertyValue(userProps, field);
    const isDisabled = Boolean((field as any).readonly || (field as any).readOnly);
    const fieldType = field.type || (field as any).field_type;
    const displayValue =
      (isSystem || hasUserValue) && fieldType === 'password' && value
        ? '••••••••'
        : String(value ?? '');

    // Boolean Toggle
    if (fieldType === 'boolean') {
      return (
        <div key={field.key} className="flex flex-col gap-1.5">
          <label
            className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm text-black cursor-help"
            title={field.description}
          >
            <span className="font-medium flex items-center gap-1.5">
              {field.label}
              {field.description && (
                <span className="text-[9px] text-blue-500 font-bold bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full leading-none shadow-sm">
                  i
                </span>
              )}
            </span>
            <input
              type="checkbox"
              checked={Boolean(value)}
              disabled={isDisabled}
              onChange={(event) =>
                !isDisabled && handlePropertyChange(field.key, event.target.checked)
              }
              className="h-4 w-4 accent-bg-primary"
            />
          </label>
        </div>
      );
    }

    // OAuth Configuration and Connection Flow
    if (fieldType === 'oauth') {
      const clientIdKey = `${field.key}_client_id`;
      const clientSecretKey = `${field.key}_client_secret`;
      const credentialId = String(value || '');

      const clientId = String(isSystem ? systemProps[clientIdKey] : userProps[clientIdKey] || '');
      const clientSecret = String(
        isSystem ? systemProps[clientSecretKey] : userProps[clientSecretKey] || '',
      );

      return (
        <div
          key={field.key}
          className="space-y-4 p-4 border rounded-xl h-full overflow-hidden bg-slate-50 shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {field.label}
            </label>
            {credentialId && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                CONNECTED
              </span>
            )}
          </div>

          <div className="space-y-3">
            {providers && Array.isArray(providers) && providers.length > 0 && (
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                  Provider
                </label>
                <select
                  value={String(
                    selectedProvider ||
                    (isSystem
                      ? systemProps[`${field.key}_provider`]
                      : (userProps[`${field.key}_provider`] as string)) ||
                    '',
                  )}
                  disabled={isDisabled}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100"
                >
                  <option value="">Choose OAuth Provider...</option>
                  {providers.map((p: any) => (
                    <option key={p.id} value={p.name}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                  Client ID
                </label>
                <input
                  type="text"
                  value={clientId}
                  disabled={isDisabled}
                  onChange={(e) => !isDisabled && handlePropertyChange(clientIdKey, e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. 8234-abc..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                  Client Secret
                </label>
                <input
                  type="password"
                  value={clientSecret}
                  disabled={isDisabled}
                  onChange={(e) =>
                    !isDisabled && handlePropertyChange(clientSecretKey, e.target.value)
                  }
                  className="w-full border rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="••••••••••••"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={isDisabled || !clientId || !selectedProvider}
              onClick={() => {
                setActiveFieldKey(field.key);
                const providerKey = selectedProvider;
                /* ==============================================================================
                   BLOCK COMMENT: REMOVE CLIENT SECRET FROM BROWSER CONNECT URL
                   ============================================================================== */
                const url = `/api/oauth/google/connect?client_id=${encodeURIComponent(clientId)}&workflow_id=${encodeURIComponent(workflowId || '')}&node_id=${encodeURIComponent(selectedNode?.id || '')}`;

                const width = 600;
                const height = 700;
                const left = window.screenX + (window.outerWidth - width) / 2;
                const top = window.screenY + (window.outerHeight - height) / 2;
                window.open(
                  url,
                  'auth-popup',
                  `width=${width},height=${height},left=${left},top=${top}`,
                );
              }}
              className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 ${credentialId
                ? 'bg-white border border-blue-200 text-bg-primary hover:bg-blue-50'
                : 'bg-primary text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none'
                }`}
            >
              {credentialId ? 'Reconnect Account' : 'Authenticate & Connect'}
            </button>
          </div>

          {/* {field.description && (
            <p className="text-[10px] text-slate-400 leading-tight bg-slate-100 p-2 rounded-md border border-slate-200 italic">
              {field.description}
            </p>
          )} */}
        </div>
      );
    }

    // Source Configuration
    if (fieldType === 'source' || Boolean(field.source)) {
      const propVal = value !== undefined && value !== null ? value : '';

      return (
        <SourcePropertyField
          key={field.key}
          field={field}
          isDisabled={isDisabled}
          propVal={propVal}
          handlePropertyChange={handlePropertyChange}
        />
      );
    }

    // Choice Selection
    if (fieldType === 'choice') {
      const rawOptions = getRawChoiceOptions(field, field.key, systemProps, value);

      let options = parseChoiceOptions(rawOptions);
      const strVal = value !== undefined && value !== null ? String(value) : '';
      if (strVal && !strVal.includes(',') && !options.includes(strVal)) {
        options = [strVal, ...options];
      }
      const selectedValue = options.includes(strVal) ? strVal : options[0] || '';

      // Multi-select mode
      if (field.multiple) {
        return (
          <div key={field.key}>
            <label
              className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1.5 cursor-help"
              title={field.description}
            >
              {field.label}
              {field.description && (
                <span className="text-[9px] text-blue-500 font-bold bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full leading-none shadow-sm">
                  i
                </span>
              )}
            </label>
            <MultiSelectDropdown
              disabled={false}
              selected={Array.isArray(value) ? value.map(String) : []}
              options={options.map((o) => ({ key: o, label: o }))}
              onChange={(values) => handlePropertyChange(field.key, values)}
            />
          </div>
        );
      }

      // Single dropdown mode
      return (
        <div key={field.key}>
          <label
            className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1.5 cursor-help"
            title={field.description}
          >
            {field.label}
            {field.description && (
              <span className="text-[9px] text-blue-500 font-bold bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full leading-none shadow-sm">
                i
              </span>
            )}
          </label>
          <select
            disabled={false}
            value={selectedValue}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
              handlePropertyChange(field.key, event.target.value)
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {options.map((option, idx) => (
              <option key={`${option}-${idx}`} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );
    }

    // File path picker
    if (fieldType === 'path') {
      const propVal = value !== undefined && value !== null ? String(value) : '';
      return (
        <PathPropertyField
          key={field.key}
          field={field}
          isDisabled={isDisabled}
          value={propVal}
          handlePropertyChange={handlePropertyChange}
        />
      );
    }

    // Multiline text area
    if (fieldType === 'textarea') {
      return (
        <div key={field.key}>
          <label
            className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1.5 cursor-help"
            title={field.description}
          >
            {field.label}
            {field.description && (
              <span className="text-[9px] text-blue-500 font-bold bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full leading-none shadow-sm">
                i
              </span>
            )}
          </label>
          <textarea
            disabled={isDisabled}
            value={String(value)}
            placeholder={field.placeholder}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
              !isDisabled && handlePropertyChange(field.key, event.target.value)
            }
            className="h-28 w-full resize-y rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-sm bg-white text-black focus:outline-none focus:border-blue-500"
          />
        </div>
      );
    }

    // Standard inputs: text, password, number
    return (
      <div key={field.key}>
        <label
          className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1.5 cursor-help"
          title={field.description}
        >
          {field.label}
          {field.description && (
            <span className="text-[9px] text-blue-500 font-bold bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full leading-none shadow-sm">
              i
            </span>
          )}
        </label>
        <input
          type={fieldType === 'password' ? 'password' : fieldType === 'number' ? 'number' : 'text'}
          disabled={isDisabled}
          value={displayValue}
          placeholder={field.placeholder}
          onChange={(event) =>
            !isDisabled &&
            handlePropertyChange(
              field.key,
              fieldType === 'number' ? Number(event.target.value) : event.target.value,
            )
          }
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white text-black focus:outline-none focus:border-blue-500"
        />
      </div>
    );
  };

  // Placeholder state when no node is selected
  if (!selectedNode && !selectedEdge) {
    return (
      <div className="w-[340px] shrink-0 border-l border-properties-border bg-properties-bg text-properties-fg p-6 flex flex-col items-center justify-center h-full">
        <div className="text-center text-slate-400 max-w-[200px]">
          <div className="w-12 h-12 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Settings className="w-5 h-5 text-slate-500 animate-[spin_6s_linear_infinite]" />
          </div>
          <h3 className="font-semibold text-slate-700 text-sm mb-1">Properties</h3>
          <p className="text-xs text-slate-400 leading-normal">
            Select a canvas node or connection line to configure settings.
          </p>
        </div>
      </div>
    );
  }

  // If an edge is selected, render the Edge Editor
  if (selectedEdge) {
    return (
      <div className="w-[340px] shrink-0 border-l border-properties-border bg-properties-bg text-properties-fg flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="font-bold text-xs text-slate-700 flex items-center gap-2 uppercase tracking-wider">
            <ArrowRightLeft className="w-4 h-4 text-indigo-500" />
            Connection Settings
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
          <div className="space-y-1.5">
            <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest">
              Source Output Sample
            </label>
            <pre className="p-3 bg-slate-905 text-emerald-400 text-[10px] rounded-xl overflow-x-auto font-mono border border-slate-800 shadow-inner max-h-40 custom-scrollbar">
              {JSON.stringify(sourceOutputPreview || {}, null, 2)}
            </pre>
          </div>

          <div className="space-y-2">
            <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest">
              Branch Condition
            </label>
            <select
              value={allowedConditions.includes(edgeCondition) ? edgeCondition : 'custom'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'custom') {
                  setEdgeCondition('');
                } else {
                  setEdgeCondition(val);
                }
              }}
              className="w-full border border-slate-200 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs bg-slate-50/50 focus:bg-white text-slate-700 outline-none transition-all cursor-pointer"
            >
              {allowedConditions.map((c) => (
                <option key={c} value={c}>
                  {c.toUpperCase()}
                </option>
              ))}
              <option value="custom">Custom Condition Variable...</option>
            </select>

            {(!allowedConditions.includes(edgeCondition) || edgeCondition === '') && (
              <input
                type="text"
                value={edgeCondition}
                onChange={(e) => setEdgeCondition(e.target.value)}
                placeholder="Enter custom condition name (e.g. is_safe)"
                className="w-full border border-slate-250 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 bg-white outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            )}
            <p className="text-[10px] text-slate-400 leading-normal">
              Define when execution traverses this path.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest">
              Condition Expression (Optional)
            </label>
            <textarea
              value={edgeExpression}
              onChange={(e) => setEdgeExpression(e.target.value)}
              placeholder={'e.g. output.score > 0.5 or output.intent == "cancel"'}
              className="w-full border border-slate-200 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs font-mono h-28 bg-slate-50/50 focus:bg-white text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
            />
            <p className="text-[10px] text-slate-450 leading-normal">
              JavaScript expression evaluated against source node output. Prefix variables with{' '}
              <code className="bg-slate-100 px-1 rounded text-[9px] font-mono">output.</code>.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 shrink-0 flex gap-2">
          <button
            onClick={() => onClose()}
            className="flex-1 py-2 text-xs font-semibold text-slate-650 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (onUpdateEdge && selectedEdge) {
                const trimmedCondition = (edgeCondition || '').trim();
                const trimmedExpression = (edgeExpression || '').trim();

                if (trimmedExpression && !trimmedCondition) {
                  alert(
                    'Please specify a condition name/label for your custom expression (e.g. is_safe, high_profit).',
                  );
                  return;
                }

                onUpdateEdge(selectedEdge.id || `${selectedEdge.source}_${selectedEdge.target}`, {
                  condition: trimmedCondition,
                  expression: trimmedExpression,
                } as any);
              }
            }}
            className="flex-1 py-2 text-xs font-bold text-white bg-primary hover:bg-indigo-750 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            Save Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[340px] shrink-0 border-l border-properties-border bg-properties-bg text-properties-fg flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="font-bold text-xs text-slate-700 flex items-center gap-2 uppercase tracking-wider">
          <Settings className="w-4 h-4 text-indigo-500" />
          Configure Node
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Node Metadata (Label & Color) */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/20 space-y-4 shrink-0 shadow-sm">
        <div className="space-y-1.5">
          <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest">
            Node Label / Display Name
          </label>
          <input
            type="text"
            value={String(
              selectedNode
                ? (selectedNode.data as any).label || (selectedNode.data as any).name || ''
                : '',
            )}
            onChange={(e) => {
              if (!selectedNode) return;
              const val = e.target.value;
              onUpdateNode(selectedNode.id, {
                ...(selectedNode.data as any),
                label: val,
              });
            }}
            disabled={userRole === 'user'}
            placeholder="e.g. LLM Node"
            className="w-full border border-slate-200 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs bg-white text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-500 shrink-0">
        <button
          onClick={() => setViewMode('config')}
          className={`flex-1 py-3 text-center transition-all cursor-pointer ${viewMode === 'config'
            ? 'bg-white text-indigo-650 border-b-2 border-indigo-600 font-bold'
            : 'bg-slate-50/50 hover:bg-slate-50 hover:text-slate-700'
            }`}
        >
          Properties
        </button>
        <button
          onClick={() => setViewMode('contract')}
          className={`flex-1 py-3 text-center text-[10px] transition-all cursor-pointer ${viewMode === 'contract'
            ? 'bg-white text-indigo-650 border-b-2 border-indigo-600 font-bold'
            : 'bg-slate-50/50 hover:bg-slate-50 hover:text-slate-700'
            }`}
        >
          Data Contracts
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
        {(() => {
          if (viewMode === 'contract') {
            const inputTree = buildTreeFromSchema(normalizeContract(inputContract));
            const outputTree = buildTreeFromSchema(normalizeContract(outputContract));
            const nodeName = String((selectedNode?.data as any)?.name || '');
            const isWebhookNode =
              nodeName === 'api_webhook_agent' || nodeName.toLowerCase().includes('webhook');
            const canEditOutputContract = userRole !== 'user' || isWebhookNode;

            return (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">
                      Input Structure
                    </label>
                    <span className="flex items-center gap-1 text-[9px] font-bold text-slate-450 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 tracking-wide uppercase">
                      <Lock className="w-2.5 h-2.5" />
                      Read-only
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 shadow-inner max-h-56 overflow-y-auto custom-scrollbar flex">
                    {inputTree.length > 0 ? (
                      <ContractTreeRenderer nodes={inputTree} />
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">
                        No input fields defined.
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">
                      Output Structure
                    </label>
                    {canEditOutputContract ? (
                      <button
                        onClick={() => {
                          setGeneratorModalType('output');
                          setIsGeneratorModalOpen(true);
                        }}
                        className="flex items-center gap-1 text-[12px] font-bold text-emerald-650 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-2 py-1 rounded transition-colors cursor-pointer border border-emerald-150"
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                        Define from JSON
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-[9px] font-bold text-slate-450 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 tracking-wide uppercase">
                        <Lock className="w-2.5 h-2.5" />
                        Read-only
                      </span>
                    )}
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 shadow-inner max-h-56 overflow-y-auto custom-scrollbar flex">
                    {outputTree.length > 0 ? (
                      <ContractTreeRenderer
                        nodes={outputTree}
                        isOutput={true}
                        readOnly={!canEditOutputContract}
                        onToggleRequired={(path, isReq) =>
                          canEditOutputContract && handleToggleRequiredField(path, isReq)
                        }
                        onToggleStateable={(path, isState) =>
                          canEditOutputContract && handleToggleStateableField(path, isState)
                        }
                      />
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">
                        No output fields defined.
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-slate-450 leading-relaxed italic bg-indigo-50/40 p-3 rounded-xl border border-indigo-50">
                  Inject data values dynamically from upstream nodes using
                  <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[9px] font-mono text-indigo-700 mx-1 font-bold">
                    {'{{ node_id.output_key }}'}
                  </code>
                  syntax in text parameters.
                </p>
              </div>
            );
          }

          const formatLabel = (k: string) => {
            return k.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
          };

          const isTrigger =
            String(
              (selectedNode?.data as any)?.node_type || (selectedNode?.data as any)?.nodeType || '',
            ).toUpperCase() === 'TRIGGER';

          return (
            <div className="space-y-4">
              {/* Accordion Item: Parameters */}
              <div className="border border-slate-150 rounded-xl overflow-hidden shadow-sm bg-white">
                <button
                  type="button"
                  onClick={() => toggleSection('parameters')}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                      Parameters
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-450 transition-transform duration-200 ${collapsedSections.parameters ? '-rotate-90' : 'rotate-0'
                      }`}
                  />
                </button>
                {!collapsedSections.parameters && (
                  <div className="p-4 space-y-4 border-t border-slate-100 bg-white">
                    {entries.length > 0 ? (
                      <div className="space-y-4">
                        {entries.map(([key, value]) => {
                          const label = formatLabel(key);
                          const valueType =
                            typeof value === 'boolean'
                              ? 'boolean'
                              : typeof value === 'number'
                                ? 'number'
                                : typeof value === 'object' && value !== null
                                  ? 'object'
                                  : 'string';

                          const userPropsArray = ensureArray(
                            (selectedNode?.data as any)?.user_properties,
                          );
                          const systemPropsArray = ensureArray(
                            (selectedNode?.data as any)?.system_properties,
                          );
                          const schemaArray = ensureArray(
                            (selectedNode?.data as any)?.propertySchema ||
                            (selectedNode?.data as any)?.property_schema,
                          );

                          const catalogSchema =
                            schemaArray.find((f: any) => f && f.key === key) || {};
                          const userSchema =
                            userPropsArray.find((f: any) => f && f.key === key) || {};
                          const systemSchema =
                            systemPropsArray.find((f: any) => f && f.key === key) || {};

                          const fieldSchema = {
                            ...catalogSchema,
                            ...userSchema,
                            ...systemSchema,
                            options:
                              catalogSchema.options || userSchema.options || systemSchema.options,
                            choices:
                              catalogSchema.choices || userSchema.choices || systemSchema.choices,
                            configured_values:
                              catalogSchema.configured_values ||
                              userSchema.configured_values ||
                              systemSchema.configured_values,
                            values:
                              catalogSchema.values || userSchema.values || systemSchema.values,
                          };
                          const fieldType =
                            fieldSchema?.type || fieldSchema?.field_type || valueType;

                          // Source type: show label, save key
                          if (fieldType === 'source' || Boolean(fieldSchema?.source)) {
                            const propVal = value !== undefined && value !== null ? value : '';
                            return (
                              <SourcePropertyField
                                key={key}
                                field={{
                                  key,
                                  label: fieldSchema?.label || formatLabel(key),
                                  type: 'source',
                                  source: fieldSchema?.source || '',
                                  multiple: fieldSchema?.multiple,
                                  description: fieldSchema?.description,
                                }}
                                isDisabled={false}
                                propVal={propVal}
                                handlePropertyChange={handlePropertyChange}
                              />
                            );
                          }

                          // Object / JSON type
                          if (
                            fieldType === 'object' ||
                            fieldType === 'json' ||
                            fieldType === 'dict' ||
                            fieldType === 'record' ||
                            (typeof value === 'object' && value !== null && !Array.isArray(value))
                          ) {
                            return (
                              <JsonObjectPropertyField
                                key={key}
                                label={label}
                                fieldKey={key}
                                value={value}
                                isDisabled={false}
                                description={fieldSchema?.description}
                                handlePropertyChange={handlePropertyChange}
                              />
                            );
                          }

                          if (fieldType === 'choice') {
                            const rawOptions = getRawChoiceOptions(
                              fieldSchema,
                              key,
                              systemProperties,
                              value,
                            );

                            let options = parseChoiceOptions(rawOptions);
                            const extractValStr = (val: any): string => {
                              if (val === undefined || val === null) return '';
                              if (typeof val === 'object') {
                                return String(
                                  val.key ?? val.value ?? val.id ?? val.name ?? val.label ?? '',
                                );
                              }
                              return String(val);
                            };

                            const rawVal =
                              value !== undefined && value !== null ? value : fieldSchema?.default;
                            const strVal = extractValStr(rawVal);
                            if (
                              strVal &&
                              !strVal.includes(',') &&
                              !options.some((o) => o.toLowerCase() === strVal.toLowerCase())
                            ) {
                              options = [strVal, ...options];
                            }
                            const isMultiple = Boolean(fieldSchema?.multiple);
                            const matchedOption = options.find(
                              (o) => o.toLowerCase() === strVal.toLowerCase(),
                            );
                            const selectedVal =
                              matchedOption || (options.length > 0 ? options[0] : '');

                            if (isMultiple) {
                              return (
                                <div key={key} className="space-y-1.5">
                                  <label
                                    className="block text-[10px] font-bold text-slate-455 uppercase tracking-widest flex items-center gap-1.5 cursor-help"
                                    title={fieldSchema?.description}
                                  >
                                    {label}
                                    {fieldSchema?.description && (
                                      <span className="text-[9px] text-blue-500 font-bold bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full leading-none shadow-sm">
                                        i
                                      </span>
                                    )}
                                  </label>
                                  <MultiSelectDropdown
                                    disabled={false}
                                    selected={Array.isArray(value) ? value.map(String) : []}
                                    options={options.map((o) => ({ key: o, label: o }))}
                                    onChange={(values) => handlePropertyChange(key, values)}
                                  />
                                </div>
                              );
                            }

                            return (
                              <div key={key} className="space-y-1.5">
                                <label
                                  className="block text-[10px] font-bold text-slate-455 uppercase tracking-widest flex items-center gap-1.5 cursor-help"
                                  title={fieldSchema?.description}
                                >
                                  {label}
                                  {fieldSchema?.description && (
                                    <span className="text-[9px] text-blue-500 font-bold bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full leading-none shadow-sm">
                                      i
                                    </span>
                                  )}
                                </label>
                                <select
                                  value={selectedVal}
                                  disabled={false}
                                  onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                                    handlePropertyChange(key, event.target.value)
                                  }
                                  className="w-full border border-slate-200 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs bg-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-100 transition-all shadow-inner-sm cursor-pointer"
                                >
                                  {options.map((option) => (
                                    <option
                                      key={option}
                                      value={option}
                                      className="bg-white text-slate-900"
                                    >
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          }

                          if (fieldType === 'boolean') {
                            return (
                              <label
                                key={key}
                                className="flex items-center justify-between gap-3 rounded-xl border border-slate-150 bg-slate-50/30 px-3.5 py-2.5 text-xs text-slate-700 cursor-pointer shadow-sm hover:border-slate-250 transition-all hover:bg-slate-50"
                              >
                                <span className="font-semibold text-slate-655">{label}</span>
                                <input
                                  type="checkbox"
                                  checked={Boolean(value)}
                                  disabled={false}
                                  onChange={(e) => handlePropertyChange(key, e.target.checked)}
                                  className="h-4 w-4 accent-indigo-600 rounded cursor-pointer"
                                />
                              </label>
                            );
                          }

                          if (fieldType === 'number') {
                            return (
                              <div key={key} className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-widest">
                                  {label}
                                </label>
                                <input
                                  type="number"
                                  value={Number(value ?? 0)}
                                  disabled={false}
                                  onChange={(e) =>
                                    handlePropertyChange(key, Number(e.target.value))
                                  }
                                  placeholder="Value"
                                  className="w-full border border-slate-200 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs bg-white text-slate-900 outline-none transition-all shadow-inner-sm"
                                />
                              </div>
                            );
                          }

                          // Helper for stringifying values safely
                          const displayStr =
                            typeof value === 'object' && value !== null
                              ? JSON.stringify(value, null, 2)
                              : String(value ?? '');

                          // Multiline textarea for prompts/long strings
                          const isMultiline =
                            displayStr.length > 40 ||
                            key.toLowerCase().includes('prompt') ||
                            key.toLowerCase().includes('query');

                          return (
                            <div key={key} className="space-y-1.5">
                              <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-widest">
                                {label}
                              </label>
                              {isMultiline ? (
                                <textarea
                                  value={displayStr}
                                  disabled={false}
                                  onChange={(e) => handlePropertyChange(key, e.target.value)}
                                  placeholder="Enter text/variables..."
                                  rows={3}
                                  className="w-full border border-slate-200 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs font-mono bg-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-100 transition-all resize-y min-h-20"
                                />
                              ) : (
                                <input
                                  type={
                                    key.toLowerCase().includes('password') ||
                                      key.toLowerCase().includes('secret')
                                      ? 'password'
                                      : 'text'
                                  }
                                  value={displayStr}
                                  disabled={false}
                                  onChange={(e) => handlePropertyChange(key, e.target.value)}
                                  placeholder="Enter value..."
                                  className="w-full border border-slate-200 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs bg-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-100 transition-all shadow-inner-sm"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <p className="text-xs italic">No configurable parameters.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Accordion Item: Field Mapping */}
              {!isTrigger && (
                <div className="border border-slate-150 rounded-xl overflow-hidden shadow-sm bg-white">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleSection('mapping')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleSection('mapping');
                      }
                    }}
                    className="w-full flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                        Field Mapping
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasPredecessor && onOpenMapper && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation(); // prevent collapsing section
                            onOpenMapper();
                          }}
                          className="flex items-center gap-1 text-[11px] font-bold text-indigo-650 hover:text-indigo-850 transition-colors cursor-pointer bg-transparent border-0 p-0 mr-1"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          Modify Mapping
                        </button>
                      )}
                      <ChevronDown
                        className={`w-4 h-4 text-slate-450 transition-transform duration-200 ${collapsedSections.mapping ? '-rotate-90' : 'rotate-0'
                          }`}
                      />
                    </div>
                  </div>
                  {!collapsedSections.mapping && (
                    <div className="p-4 space-y-4 border-t border-slate-100 bg-white">
                      {hasPredecessor ? (
                        <div className="text-[10px] text-slate-655 bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-1.5 font-mono max-h-32 overflow-y-auto custom-scrollbar shadow-inner-sm">
                          {(() => {
                            let currentMapping: Record<string, string> = {};
                            try {
                              const value = properties.mapping_template;
                              currentMapping =
                                typeof value === 'string' ? JSON.parse(value) : value || {};
                            } catch {
                              currentMapping = {};
                            }

                            return Object.keys(currentMapping).length > 0 ? (
                              Object.entries(currentMapping).map(([tgt, src]) => (
                                <div
                                  key={tgt}
                                  className="truncate flex items-center justify-between gap-1.5 border-b border-slate-100/50 pb-1 last:border-0 last:pb-0"
                                >
                                  <span className="text-indigo-655 font-semibold">{tgt}</span>
                                  <span className="text-slate-450 font-normal truncate">
                                    &larr; {String(src)}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p className="text-[10px] text-slate-455 italic font-sans py-1 text-center">
                                {userRole === 'user'
                                  ? 'No fields mapped yet.'
                                  : 'No fields mapped yet. Click Modify Mapping to configure.'}
                              </p>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-slate-450 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                          <p className="text-[10px] italic">
                            Connect an upstream node to enable field mapping.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Accordion Item: Runtime System */}
              {systemEntries.length > 0 && (
                <div className="border border-slate-150 rounded-xl overflow-hidden shadow-sm bg-white">
                  <button
                    type="button"
                    onClick={() => toggleSection('system')}
                    className="w-full flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-slate-450" />
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                        Runtime System
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-bold text-slate-450 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-150 tracking-wide uppercase shrink-0">
                        READ ONLY
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-450 transition-transform duration-200 ${collapsedSections.system ? '-rotate-90' : 'rotate-0'
                          }`}
                      />
                    </div>
                  </button>
                  {!collapsedSections.system && (
                    <div className="p-4 space-y-4 border-t border-slate-100 bg-white">
                      <div className="bg-slate-50/75 rounded-xl p-3 border border-slate-150 space-y-2.5 shadow-sm">
                        {systemEntries.map(([key, value]) => {
                          const label = formatLabel(key);
                          const isCopied = copiedKey === key;
                          return (
                            <div
                              key={key}
                              className="flex justify-between items-center gap-2 py-0.5 group/row"
                            >
                              <span className="font-semibold text-[10px] text-slate-500 truncate">
                                {label}
                              </span>
                              <div className="flex items-center gap-1.5 max-w-[70%]">
                                <span
                                  className="font-mono text-[10px] text-slate-700 bg-white border border-slate-150 px-2 py-0.5 rounded shadow-inner-sm truncate"
                                  title={
                                    typeof value === 'object' && value !== null
                                      ? JSON.stringify(value)
                                      : String(value ?? '')
                                  }
                                >
                                  {typeof value === 'object' && value !== null
                                    ? JSON.stringify(value)
                                    : String(value ?? '')}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(key, value)}
                                  className="p-1 hover:bg-slate-150 rounded transition-colors shrink-0 opacity-0 group-hover/row:opacity-100 focus:opacity-100 text-slate-400 hover:text-slate-655 cursor-pointer"
                                  title="Copy to clipboard"
                                >
                                  {isCopied ? (
                                    <Check className="w-3 h-3 text-emerald-600 font-bold" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Footer - Save & Delete Buttons */}
      {(onSave || selectedNode) && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/30 shrink-0 flex flex-col gap-2">
          <button
            onClick={handleSaveInstanceProperties}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primay hover:bg-indigo-750 disabled:bg-indigo-400 rounded-xl text-xs font-bold text-white shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {isSaving ? 'Saving...' : entries.length > 0 ? 'Save Parameters' : 'Save'}
          </button>
          {userRole !== 'user' && onDeleteNode && selectedNode && (
            <button
              onClick={() => {
                const nodeName =
                  (selectedNode.data as any).label ||
                  (selectedNode.data as any).name ||
                  selectedNode.id;
                if (window.confirm(`Are you sure you want to delete the node "${nodeName}"?`)) {
                  onDeleteNode(selectedNode.id);
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-rose-200 hover:border-rose-350 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Node
            </button>
          )}
        </div>
      )}

      {/* Modal for defining input/output contracts from JSON sample */}
      <JsonSchemaGeneratorModal
        isOpen={isGeneratorModalOpen}
        onClose={() => setIsGeneratorModalOpen(false)}
        initialSchema={generatorModalType === 'input' ? inputContract : outputContract}
        onSave={(schema) => handleSaveContract(generatorModalType, schema)}
        title={
          generatorModalType === 'input'
            ? `Define Input Contract for ${(selectedNode?.data as any)?.label || 'Node'}`
            : `Define Output Contract for ${(selectedNode?.data as any)?.label || 'Node'}`
        }
      />
    </div>
  );
}
