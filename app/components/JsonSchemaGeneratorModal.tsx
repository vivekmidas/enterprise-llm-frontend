'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  FileCode,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertCircle,
  Settings,
  Plus,
} from 'lucide-react';

interface JsonSchemaGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSchema: any;
  onSave: (schema: any) => void;
  title: string;
}

interface FlattenedField {
  key: string;      // short name
  path: string;     // dotted path e.g. "data.chunks"
  type: string;     // inferred type
  isLeaf: boolean;
  parentPath: string | null;
  children: string[]; // paths of children
  value: any;       // sample value
}

// Allowed types in the dropdown
const TYPE_OPTIONS = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number (Float)' },
  { value: 'integer', label: 'Integer' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'object', label: 'Object' },
  { value: 'array', label: 'Array' },
  { value: 'json', label: 'Generic JSON' },
  { value: 'email', label: 'Email Address' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'ip_address', label: 'IP Address' },
  { value: 'file', label: 'Generic File' },
  { value: 'pdf', label: 'PDF Document' },
  { value: 'doc', label: 'Word Document' },
  { value: 'image', label: 'Image File' },
];

export default function JsonSchemaGeneratorModal({
  isOpen,
  onClose,
  initialSchema,
  onSave,
  title,
}: JsonSchemaGeneratorModalProps) {
  const [rawJson, setRawJson] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({});
  const [fieldTypes, setFieldTypes] = useState<Record<string, string>>({});
  const [requiredFields, setRequiredFields] = useState<Record<string, boolean>>({});
  const [collapsedPaths, setCollapsedPaths] = useState<Record<string, boolean>>({});

  // Parse default structure from initial schema if possible to prepopulate raw JSON
  useEffect(() => {
    if (isOpen) {
      setJsonError(null);
      if (initialSchema && Object.keys(initialSchema).length > 0) {
        // Build dummy JSON from schema for raw JSON edit box
        try {
          if (Array.isArray(initialSchema.rules)) {
            const root: Record<string, any> = {};
            initialSchema.rules.forEach((rule: any) => {
              const parts = rule.field_name.split('.');
              let curr = root;
              parts.forEach((part: string, idx: number) => {
                const isLeaf = idx === parts.length - 1;
                const cleanPart = part.replace('[]', '');
                
                if (isLeaf) {
                  const type = rule.field_type || 'string';
                  let val: any = 'sample';
                  if (type === 'integer' || type === 'number') val = 1;
                  else if (type === 'boolean') val = true;
                  else if (type === 'array') val = ['sample'];
                  else if (type === 'object') val = {};
                  else if (type === 'email') val = 'user@example.com';
                  else if (type === 'ip_address') val = '192.168.1.1';
                  else if (type === 'pdf') val = 'report.pdf';
                  else if (type === 'image') val = 'photo.png';
                  curr[cleanPart] = val;
                } else {
                  if (curr[cleanPart] === undefined || typeof curr[cleanPart] !== 'object') {
                    curr[cleanPart] = {};
                  }
                  curr = curr[cleanPart];
                }
              });
            });
            setRawJson(JSON.stringify(root, null, 2));
          } else {
            const buildSample = (schema: any): any => {
              if (!schema) return '';
              const t = schema.type || 'string';
              if (t === 'object' && schema.properties) {
                const obj: Record<string, any> = {};
                Object.entries(schema.properties).forEach(([k, v]: [string, any]) => {
                  obj[k] = buildSample(v);
                });
                return obj;
              }
              if (t === 'array') {
                return [buildSample(schema.items)];
              }
              if (t === 'integer' || t === 'number') return 0;
              if (t === 'boolean') return true;
              if (schema.format === 'email') return 'user@example.com';
              if (schema.format === 'ip_address') return '192.168.1.1';
              if (schema.format === 'pdf') return 'report.pdf';
              if (schema.format === 'image') return 'photo.png';
              return 'sample';
            };
            const sample = buildSample(initialSchema);
            setRawJson(JSON.stringify(sample, null, 2));
          }
        } catch {
          setRawJson('{\n  "data": "value"\n}');
        }
      } else {
        setRawJson('{\n  "data": {\n    "chunks": [\n      "hello"\n    ],\n    "chunk_count": 1,\n    "strategy": "recursive",\n    "chunk_size": 1000,\n    "chunk_overlap": 200\n  },\n  "auth_token": "token",\n  "source_system": "localhost"\n}');
      }
    }
  }, [isOpen, initialSchema]);

  // Recursively flatten parsed object
  const flattenObject = (
    obj: any,
    prefix = '',
    parentPath: string | null = null,
    accumulator: Record<string, FlattenedField> = {},
  ): Record<string, FlattenedField> => {
    if (obj === null || obj === undefined) return accumulator;

    if (Array.isArray(obj)) {
      const currentPath = prefix || 'root';
      const childPaths: string[] = [];
      
      accumulator[currentPath] = {
        key: prefix.split('.').pop() || 'root',
        path: currentPath,
        type: 'array',
        isLeaf: false,
        parentPath,
        children: childPaths,
        value: obj,
      };

      if (obj.length > 0) {
        const itemPath = `${currentPath}[]`;
        childPaths.push(itemPath);
        flattenObject(obj[0], itemPath, currentPath, accumulator);
      }
      return accumulator;
    }

    if (typeof obj === 'object') {
      const currentPath = prefix || 'root';
      const childPaths: string[] = [];
      
      accumulator[currentPath] = {
        key: prefix.split('.').pop() || 'root',
        path: currentPath,
        type: 'object',
        isLeaf: false,
        parentPath,
        children: childPaths,
        value: obj,
      };

      Object.entries(obj).forEach(([k, v]) => {
        const childPath = prefix ? `${prefix}.${k}` : k;
        childPaths.push(childPath);
        flattenObject(v, childPath, currentPath, accumulator);
      });
      return accumulator;
    }

    // Leaf primitives
    const currentPath = prefix || 'root';
    let inferredType: string = typeof obj;
    if (inferredType === 'number') {
      inferredType = Number.isInteger(obj) ? 'integer' : 'number';
    }

    // Semantic helpers
    let typeOverride = inferredType;
    if (typeof obj === 'string') {
      const lower = obj.toLowerCase();
      if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(obj)) typeOverride = 'email';
      else if (/^\+?[0-9][0-9 .()-]{6,20}$/.test(obj)) typeOverride = 'phone';
      else if (/^((25[0-5]|2[0-4]\d|1?\d?\d)(\.|$)){4}$/.test(obj)) typeOverride = 'ip_address';
      else if (lower.endsWith('.pdf')) typeOverride = 'pdf';
      else if (lower.endsWith('.docx') || lower.endsWith('.doc')) typeOverride = 'doc';
      else if (lower.startsWith('data:image/') || lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) typeOverride = 'image';
    }

    accumulator[currentPath] = {
      key: prefix.split('.').pop() || 'root',
      path: currentPath,
      type: typeOverride,
      isLeaf: true,
      parentPath,
      children: [],
      value: obj,
    };

    return accumulator;
  };

  const [fieldsMap, setFieldsMap] = useState<Record<string, FlattenedField>>({});

  // Sync selection and type defaults whenever rawJson changes
  useEffect(() => {
    if (!rawJson) {
      setFieldsMap({});
      setJsonError(null);
      return;
    }
    try {
      const parsed = JSON.parse(rawJson);
      setJsonError(null);
      const flattened = flattenObject(parsed);
      setFieldsMap(flattened);
      
      // Rebuild selections and types to only contain keys present in the new structure
      setSelectedFields((prev) => {
        const next: Record<string, boolean> = {};
        Object.keys(flattened).forEach((path) => {
          next[path] = prev[path] !== undefined ? prev[path] : true;
        });
        return next;
      });

      setFieldTypes((prev) => {
        const next: Record<string, string> = {};
        Object.entries(flattened).forEach(([path, field]) => {
          const prevVal = prev[path];
          const isNewObject = field.type === 'object';
          const isNewArray = field.type === 'array';
          
          if (prevVal !== undefined) {
            const isPrevObject = prevVal === 'object';
            const isPrevArray = prevVal === 'array';
            const isPrevPrimitive = !isPrevObject && !isPrevArray;
            const isNewPrimitive = !isNewObject && !isNewArray;
            
            if (
              (isNewObject && isPrevObject) ||
              (isNewArray && isPrevArray) ||
              (isNewPrimitive && isPrevPrimitive)
            ) {
              next[path] = prevVal;
              return;
            }
          }
          next[path] = field.type;
        });
        return next;
      });

      setRequiredFields((prev) => {
        const next: Record<string, boolean> = {};
        Object.keys(flattened).forEach((path) => {
          next[path] = prev[path] !== undefined ? prev[path] : false;
        });
        return next;
      });
    } catch (e: any) {
      setJsonError(e.message || 'Invalid JSON format');
    }
  }, [rawJson]);

  // Build flat rules structure (expected by backend and admin panel)
  const generatedSchema = useMemo(() => {
    if (Object.keys(fieldsMap).length === 0) return {};

    const rules: any[] = [];

    Object.entries(fieldsMap).forEach(([path, field]) => {
      // Ignore root container itself and array item paths (e.g. data.chunks[])
      if (path === 'root' || path.endsWith('[]')) return;
      if (!selectedFields[path]) return;

      const type = fieldTypes[path] || 'string';
      const isRequired = requiredFields[path] || false;

      const rule: any = {
        field_name: path,
        field_type: type,
        required: isRequired,
      };

      // Array items support
      if (type === 'array') {
        let itemType = 'string';
        if (field.children.length > 0) {
          const childPath = field.children[0];
          if (selectedFields[childPath]) {
            itemType = fieldTypes[childPath] || 'string';
          }
        }
        rule.items = { field_type: itemType };
      }

      rules.push(rule);
    });

    return {
      version: '1.0',
      rules,
    };
  }, [fieldsMap, selectedFields, fieldTypes, requiredFields]);

  const toggleSelect = (path: string, val: boolean) => {
    setSelectedFields((prev) => {
      const next = { ...prev, [path]: val };
      // If parent is deselected, deselect all children recursively
      const deselectChildren = (p: string) => {
        const f = fieldsMap[p];
        if (f && f.children) {
          f.children.forEach((c) => {
            next[c] = val;
            deselectChildren(c);
          });
        }
      };
      deselectChildren(path);
      return next;
    });
  };

  const handleApply = () => {
    onSave(generatedSchema);
    onClose();
  };

  if (!isOpen) return null;

  // Render tree node component
  const renderTreeNode = (path: string, depth = 0) => {
    const field = fieldsMap[path];
    if (!field || path === 'root') return null;

    const isSelected = selectedFields[path] || false;
    const isExpanded = !collapsedPaths[path];
    const isRequired = requiredFields[path] || false;
    const currentType = fieldTypes[path] || 'string';
    const hasChildren = field.children && field.children.length > 0;

    return (
      <div key={path} className="flex flex-col">
        {/* Node selector row */}
        <div
          className={`flex items-center justify-between py-2 px-3 hover:bg-slate-50 border-b border-slate-100 gap-4 transition-colors ${
            isSelected ? 'bg-slate-50/30' : 'opacity-60'
          }`}
          style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Toggle collapse */}
            {hasChildren ? (
              <button
                onClick={() => setCollapsedPaths((prev) => ({ ...prev, [path]: !prev[path] }))}
                className="p-1 hover:bg-slate-200/50 rounded text-slate-500 transition-all"
              >
                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
            ) : (
              <span className="w-6 flex-shrink-0" />
            )}

            {/* Checkbox select */}
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => toggleSelect(path, e.target.checked)}
              className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 focus:ring-2"
            />

            {/* Icons */}
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen size={12} className="text-indigo-500" />
              ) : (
                <Folder size={12} className="text-indigo-400" />
              )
            ) : (
              <FileCode size={12} className="text-slate-400" />
            )}

            {/* Field Name */}
            <span className={`text-xs font-mono font-medium truncate ${isSelected ? 'text-slate-800' : 'text-slate-400'}`}>
              {field.key}
            </span>

            {/* Value Preview (only for leaf nodes) */}
            {field.isLeaf && (
              <span className="text-[10px] text-slate-500 truncate max-w-[120px] font-mono bg-slate-100/80 px-1 py-0.5 rounded">
                = {JSON.stringify(field.value)}
              </span>
            )}
          </div>

          {/* Configuration Inputs */}
          {isSelected && (
            <div className="flex items-center gap-2 shrink-0">
              {/* Required Toggle */}
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={(e) => setRequiredFields((prev) => ({ ...prev, [path]: e.target.checked }))}
                  className="w-3 h-3 text-amber-500 rounded border-slate-300 focus:ring-amber-500"
                />
                <span className="text-[9px] font-bold text-amber-700 uppercase tracking-tighter select-none">
                  Required
                </span>
              </label>

              {/* Type selector */}
              <select
                value={currentType}
                onChange={(e) => setFieldTypes((prev) => ({ ...prev, [path]: e.target.value }))}
                className="text-[11px] bg-white border border-slate-200 rounded px-1.5 py-1 outline-none focus:border-indigo-500 text-slate-700 font-medium"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Render children */}
        {hasChildren && isExpanded && (
          <div className="flex flex-col">
            {field.children.map((c) => renderTreeNode(c, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-[85vw] max-w-[1100px] h-[85vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-100/70">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">
              {title || 'Define Contract from Sample JSON'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Pane */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left panel: raw JSON textarea */}
          <div className="w-[40%] flex flex-col border-r border-slate-200 p-4 gap-3 bg-slate-50/30">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Paste Payload Sample JSON
              </label>
              {jsonError ? (
                <span className="flex items-center gap-1 text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200 animate-pulse">
                  <AlertCircle size={10} />
                  Syntax Error
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 size={10} />
                  Valid JSON
                </span>
              )}
            </div>

            <textarea
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
              className="flex-1 p-3  text-black text-xs rounded-xl font-mono border border-slate-800 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/25 resize-none overflow-auto custom-scrollbar"
              placeholder='{\n  "key": "value"\n}'
            />
            {jsonError && (
              <p className="text-[10px] text-red-600 bg-red-50/80 p-2.5 rounded-lg border border-red-100 font-mono break-words leading-normal shadow-sm">
                {jsonError}
              </p>
            )}
          </div>

          {/* Right panel: Visual tree builder & live schema preview */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Split tree / schema view */}
            <div className="flex-1 flex overflow-hidden min-h-0 border-b border-slate-200">
              
              {/* Tree view */}
              <div className="flex-1 flex flex-col overflow-auto custom-scrollbar p-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">
                  Select Input/Output Data Elements
                </label>
                <div className="border border-slate-200 rounded-lg overflow-hidden flex-1 bg-white">
                  {Object.keys(fieldsMap).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                      <p className="text-xs font-semibold text-slate-400">
                        {jsonError ? 'Correct JSON syntax errors to show schema' : 'Paste valid JSON to start'}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col divide-y divide-slate-50 overflow-auto">
                      {/* Render top level nodes */}
                      {Object.keys(fieldsMap).map((path) => {
                        const field = fieldsMap[path];
                        if (field && field.parentPath === null && path !== 'root') {
                          return renderTreeNode(path, 0);
                        }
                        if (field && path === 'root') {
                          return field.children.map((c) => renderTreeNode(c, 0));
                        }
                        return null;
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Live JSON Schema output preview */}
              <div className="w-[38%] border-l border-slate-200 p-4 flex flex-col gap-3 bg-slate-50/20">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Live Contract Schema Preview
                </label>
                <pre className="flex-1 p-3 bg-slate-white text-green-900 text-[10px] rounded-xl overflow-auto font-mono border border-slate-800 shadow-inner custom-scrollbar">
                  {JSON.stringify(generatedSchema, null, 2)}
                </pre>
              </div>
            </div>

            {/* Info Footer */}
            <div className="p-3 bg-indigo-50/40 px-5 flex items-center gap-2 border-b border-slate-200">
              <Info size={14} className="text-indigo-600" />
              <p className="text-[10px] text-indigo-700 leading-relaxed font-medium">
                Pasting a sample JSON auto-detects nesting structures, arrays, and standard type rules. Customize types to enforce file formats (PDF, DOC, Images) and strict validation rules.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 rounded-b-xl flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 bg-white"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={Object.keys(fieldsMap).length === 0}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-lg shadow-sm shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Apply & Save Schema
          </button>
        </div>

      </div>
    </div>
  );
}
