'use client';
import { useState, useMemo, useEffect } from 'react';
import {
  X,
  ArrowRightLeft,
  Wand2,
  Info,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Folder,
  FileCode,
  Search,
  Brackets,
} from 'lucide-react';
import { api } from '@/lib/api';

interface FieldMapperModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceContract?: any;
  targetContract?: any;
  sourceNodeName?: string;
  targetNodeName?: string;
  currentMapping: Record<string, string>;
  onSaveMapping: (mapping: Record<string, string>) => void;
}

interface TreeNode {
  name: string;
  path: string;
  type: string;
  required: boolean;
  description?: string;
  children?: TreeNode[];
  isLeaf: boolean;
}

// Convert flat rules contract to JSON schema
const convertRulesToSchema = (parsed: any): any => {
  const root: any = {
    type: 'object',
    properties: {},
    required: [],
    additionalProperties: parsed.additional_fields ?? parsed.additionalProperties ?? true,
  };

  const rules = Array.isArray(parsed.rules) ? parsed.rules : [];
  rules.forEach((rule: any) => {
    if (!rule || typeof rule !== 'object') return;
    const fieldName = rule.field_name || rule.field || rule.key || '';
    if (!fieldName) return;

    const fieldSchema: any = {
      type: rule.field_type || rule.type || 'string',
      description: rule.description || '',
      required: rule.required || rule.mandatory || false,
    };

    if (rule.allowed_values) fieldSchema.enum = rule.allowed_values;
    else if (rule.enum) fieldSchema.enum = rule.enum;

    // split dots for nested paths
    const parts = fieldName.split('.');
    let current = root;
    parts.forEach((part: string, idx: number) => {
      const isLeaf = idx === parts.length - 1;
      if (!current.properties) current.properties = {};

      if (isLeaf) {
        current.properties[part] = {
          ...current.properties[part],
          ...fieldSchema,
        };
        if (fieldSchema.required) {
          if (!current.required) current.required = [];
          if (!current.required.includes(part)) {
            current.required.push(part);
          }
        }
      } else {
        if (!current.properties[part]) {
          current.properties[part] = {
            type: 'object',
            properties: {},
            required: [],
          };
        }
        current = current.properties[part];
      }
    });
  });

  return root;
};

// Convert legacy format to JSON schema
const convertLegacyToSchema = (parsed: any): any => {
  const root: any = {
    type: 'object',
    properties: {},
    required: [],
  };

  const metadataKeys = ['type', 'properties', 'required', 'additionalProperties', 'additional_fields', 'version', 'rules'];

  Object.entries(parsed).forEach(([key, val]: [string, any]) => {
    if (metadataKeys.includes(key)) return;
    if (typeof val === 'string') {
      root.properties[key] = { type: val };
    } else if (val && typeof val === 'object') {
      root.properties[key] = {
        type: val.type || 'string',
        description: val.description || '',
        required: val.required || val.mandatory || false,
        properties: val.properties,
      };
      if (val.required || val.mandatory) {
        root.required.push(key);
      }
    }
  });

  return root;
};

// Ensure standard JSON schema structure has required metadata at leaf property level
const normalizeJsonSchema = (schema: any): any => {
  if (!schema || typeof schema !== 'object') return schema;
  const normalized = { ...schema };

  if (normalized.properties && typeof normalized.properties === 'object') {
    const requiredList = Array.isArray(normalized.required) ? normalized.required : [];
    const newProperties: any = {};
    for (const [key, value] of Object.entries(normalized.properties)) {
      let valSchema = typeof value === 'string' ? { type: value } : { ...(value as any) };
      if (requiredList.includes(key)) {
        valSchema.required = true;
      }
      if (valSchema.properties || valSchema.type === 'object') {
        valSchema = normalizeJsonSchema(valSchema);
      }
      newProperties[key] = valSchema;
    }
    normalized.properties = newProperties;
  }
  return normalized;
};

// Main entry point for contract normalization
const normalizeContract = (contract: any): any => {
  if (!contract) return { type: 'object', properties: {} };
  let parsed = contract;
  if (typeof contract === 'string') {
    try {
      parsed = JSON.parse(contract);
    } catch (e) {
      return { type: 'object', properties: {} };
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return { type: 'object', properties: {} };
  }

  if (Array.isArray(parsed.rules)) {
    return normalizeJsonSchema(convertRulesToSchema(parsed));
  }

  if (parsed.properties || parsed.type === 'object') {
    return normalizeJsonSchema(parsed);
  }

  return normalizeJsonSchema(convertLegacyToSchema(parsed));
};

// Build tree from schema
const buildTreeFromSchema = (schema: any, prefix = ''): TreeNode[] => {
  if (!schema || typeof schema !== 'object') return [];
  const props = schema.properties;
  if (!props || typeof props !== 'object') return [];

  const requiredList = Array.isArray(schema.required) ? schema.required : [];

  return Object.keys(props).map((key) => {
    const val = props[key];
    const path = prefix ? `${prefix}.${key}` : key;
    const isRequired = requiredList.includes(key) || val.required === true;

    const children = (val.type === 'object' || val.properties)
      ? buildTreeFromSchema(val, path)
      : undefined;

    return {
      name: key,
      path,
      type: val.type || 'any',
      required: isRequired,
      description: val.description,
      children,
      isLeaf: !children || children.length === 0,
    };
  });
};

interface SourceTreePopoverProps {
  sourceTree: TreeNode[];
  targetPath: string;
  onSelect: (path: string) => void;
  onClose: () => void;
}

function SourceTreePopover({ sourceTree, targetPath, onSelect, onClose }: SourceTreePopoverProps) {
  const [search, setSearch] = useState('');
  const [popoverExpanded, setPopoverExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const popoverEl = document.getElementById(`popover-${targetPath}`);
      const triggerEl = document.getElementById(`trigger-${targetPath}`);
      if (
        popoverEl &&
        !popoverEl.contains(e.target as Node) &&
        triggerEl &&
        !triggerEl.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [targetPath, onClose]);

  const filterTree = (nodes: TreeNode[], query: string): TreeNode[] => {
    if (!query) return nodes;
    const lowerQuery = query.toLowerCase();

    return nodes
      .map((node) => {
        if (node.isLeaf) {
          return node.name.toLowerCase().includes(lowerQuery) || node.path.toLowerCase().includes(lowerQuery)
            ? node
            : null;
        }
        const filteredChildren = node.children ? filterTree(node.children, query) : [];
        if (filteredChildren.length > 0 || node.name.toLowerCase().includes(lowerQuery)) {
          return { ...node, children: filteredChildren };
        }
        return null;
      })
      .filter((n): n is TreeNode => n !== null);
  };

  const filteredSourceTree = useMemo(() => {
    return filterTree(sourceTree, search);
  }, [sourceTree, search]);

  const toggleExpand = (path: string) => {
    setPopoverExpanded((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const renderSourceTree = (nodes: TreeNode[], depth = 0) => {
    return nodes.map((node) => {
      const isLeaf = node.isLeaf;
      const isExpanded = popoverExpanded[node.path] !== false;

      return (
        <div key={node.path} className="flex flex-col">
          <div
            onClick={() => {
              if (isLeaf) {
                onSelect(node.path);
              } else {
                toggleExpand(node.path);
              }
            }}
            className={`flex items-center gap-1.5 py-1 px-2 text-[11px] rounded-md cursor-pointer transition-colors ${
              isLeaf
                ? 'hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-mono pl-4'
                : 'hover:bg-slate-100 text-slate-600 font-medium'
            }`}
            style={{ paddingLeft: `${depth * 0.75 + (isLeaf ? 1.25 : 0.25)}rem` }}
          >
            {!isLeaf && (
              <span className="text-slate-400">
                {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              </span>
            )}
            {!isLeaf ? (
              <Folder size={11} className="text-blue-500 fill-blue-500/10" />
            ) : (
              <FileCode size={11} className="text-slate-400" />
            )}
            <span className="flex-1 truncate">{node.name}</span>
            {isLeaf && (
              <span className="text-[9px] px-1 text-slate-400 bg-slate-50 border border-slate-100 rounded font-mono">
                {node.type}
              </span>
            )}
          </div>

          {!isLeaf && isExpanded && node.children && (
            <div className="flex flex-col">
              {renderSourceTree(node.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div
      id={`popover-${targetPath}`}
      className="absolute top-full right-0 mt-1 z-50 w-160 h-50% bg-white border border-slate-200 rounded-xl shadow-xl flex flex-col max-h-64 animate-in fade-in slide-in-from-top-1 duration-100"
    >
      <div className="p-2 border-b border-slate-100 flex items-center bg-slate-50/50 rounded-t-xl">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search source fields..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-7 pr-2 py-1 text-xs border border-slate-200 rounded-md outline-none focus:border-blue-500 transition-all bg-white"
            autoFocus
          />
          <Search size={12} className="absolute left-2.5 top-2 text-slate-400" />
        </div>
      </div>
      <div className="p-2 overflow-auto flex-1 flex flex-col gap-0.5 min-h-0">
        {filteredSourceTree.length === 0 ? (
          <span className="text-[11px] text-slate-400 text-center py-4">No matching fields</span>
        ) : (
          renderSourceTree(filteredSourceTree)
        )}
      </div>
    </div>
  );
}

export default function FieldMapperModal({
  isOpen,
  onClose,
  sourceContract,
  targetContract,
  sourceNodeName,
  targetNodeName,
  currentMapping,
  onSaveMapping,
}: FieldMapperModalProps) {
  const [mapping, setMapping] = useState<Record<string, string>>(currentMapping);
  const [localSourceContract, setLocalSourceContract] = useState(sourceContract);
  const [localTargetContract, setLocalTargetContract] = useState(targetContract);
  const [showRawContracts, setShowRawContracts] = useState(false);
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>({});

  // Sync state with currentMapping when open
  useEffect(() => {
    if (isOpen) {
      setMapping(currentMapping);
    }
  }, [isOpen, currentMapping]);

  // Fetch standard contracts from NodesDB based on node names if provided
  useEffect(() => {
    if (!isOpen) return;

    const syncContracts = async () => {
      try {
        const nodesData = await api.getNodes();
        const nodesList = Array.isArray(nodesData)
          ? nodesData
          : (nodesData as any).nodes || (nodesData as any).agents || [];

        if (sourceNodeName) {
          const match = nodesList.find((n: any) => n.name === sourceNodeName);
          if (match) setLocalSourceContract(match.output_contract || {});
        } else {
          setLocalSourceContract(sourceContract || {});
        }

        if (targetNodeName) {
          const match = nodesList.find((n: any) => n.name === targetNodeName);
          if (match) setLocalTargetContract(match.input_contract || {});
        } else {
          setLocalTargetContract(targetContract || {});
        }
      } catch (err) {
        console.error('Failed to sync node contracts from NodesDB:', err);
      }
    };

    syncContracts();
  }, [isOpen, sourceNodeName, targetNodeName, sourceContract, targetContract]);

  const normalizedSourceContract = useMemo(() => {
    return normalizeContract(localSourceContract);
  }, [localSourceContract]);

  const normalizedTargetContract = useMemo(() => {
    return normalizeContract(localTargetContract);
  }, [localTargetContract]);

  /**
   * Flatten schema is preserved to allow auto-map functions and simple array filtering
   */
  const flattenSchema = (obj: any, prefix = ''): string[] => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [];
    const props = obj.properties || obj;
    if (typeof props !== 'object' || Array.isArray(props)) return [];

    const metadataKeys = ['mandatory', 'required', 'type', 'values', 'description'];

    return Object.keys(props).reduce((acc: string[], key: string) => {
      if (metadataKeys.includes(key.toLowerCase())) return acc;

      const currentPath = prefix ? `${prefix}.${key}` : key;
      const val = props[key];

      if (val && typeof val === 'object' && !Array.isArray(val)) {
        const isSchema = !!val.properties;
        const hasMetadata = Object.keys(val).some((k) => metadataKeys.includes(k.toLowerCase()));
        const isPlainObject = Object.keys(val).length > 0 && !val.type && !hasMetadata;

        if (isSchema || isPlainObject) {
          return [...acc, ...flattenSchema(val, currentPath)];
        }
      }
      return [...acc, currentPath];
    }, []);
  };

  const getFieldMeta = (obj: any, path: string) => {
    if (!obj) return null;
    const parts = path.split('.');
    let current = obj.properties || obj;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!current || typeof current !== 'object' || Array.isArray(current)) return null;
      const field = current[part];
      if (field === undefined) return null;
      if (i === parts.length - 1) {
        return typeof field === 'string' ? { type: field } : field;
      }
      current = field.properties || field;
    }
    return null;
  };

  const sourceFields = useMemo(() => {
    return flattenSchema(normalizedSourceContract);
  }, [normalizedSourceContract]);

  const targetFields = useMemo(() => {
    return flattenSchema(normalizedTargetContract);
  }, [normalizedTargetContract]);

  const sourceTree = useMemo(() => {
    return buildTreeFromSchema(normalizedSourceContract);
  }, [normalizedSourceContract]);

  const targetTree = useMemo(() => {
    return buildTreeFromSchema(normalizedTargetContract);
  }, [normalizedTargetContract]);

  const handleAutoMap = () => {
    const newMapping = { ...mapping };
    targetFields.forEach((target) => {
      const match = sourceFields.find((s) => s.toLowerCase() === target.toLowerCase());
      if (match) {
        newMapping[target] = `{{ input_data.${match} }}`;
      }
    });
    setMapping(newMapping);
  };

  const toggleCollapse = (path: string) => {
    setExpandedPaths((prev) => ({
      ...prev,
      [path]: prev[path] === false ? true : false,
    }));
  };

  const updateMapping = (path: string, value: string) => {
    const newMapping = { ...mapping };
    if (!value) {
      delete newMapping[path];
    } else {
      newMapping[path] = value;
    }
    setMapping(newMapping);
  };

  if (!isOpen) return null;

  const renderTargetTree = (nodes: TreeNode[], depth = 0) => {
    return nodes.map((node) => {
      const isLeaf = node.isLeaf;
      const isRequired = node.required;
      const isExpanded = expandedPaths[node.path] !== false;

      return (
        <div key={node.path} className="flex flex-col">
          {/* Node Row */}
          <div
            className={`flex items-center justify-between py-2.5 px-3 border-b border-slate-100 hover:bg-slate-50/50 transition-colors gap-4`}
            style={{ paddingLeft: `${depth * 1.5 + 0.75}rem` }}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {!isLeaf ? (
                <button
                  onClick={() => toggleCollapse(node.path)}
                  className="p-1 hover:bg-slate-200/60 rounded text-slate-500 transition-colors"
                >
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              ) : (
                <span className="w-6 flex-shrink-0" />
              )}

              <span className={`text-xs font-semibold ${isLeaf ? 'text-slate-800 font-mono' : 'text-slate-600'}`}>
                {node.name}
              </span>

              {isLeaf ? (
                <>
                  <span className="text-[10px] text-slate-400 font-mono italic">
                    {node.type}
                  </span>
                  {isRequired && (
                    <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 uppercase tracking-tighter">
                      Required
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                  object
                </span>
              )}
            </div>

            {/* Mapping Input (Only for Leaf Nodes) */}
            {isLeaf && (
              <div className="flex items-center gap-1.5 relative w-[320px] flex-shrink-0">
                <div className="flex-1 flex items-center bg-white border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 shadow-sm transition-all overflow-hidden">
                  <input
                    type="text"
                    value={mapping[node.path] || ''}
                    onChange={(e) => updateMapping(node.path, e.target.value)}
                    placeholder="Enter expression or choose field"
                    className="w-full px-2.5 py-1.5 text-xs outline-none bg-transparent"
                  />
                  {mapping[node.path] && (
                    <button
                      onClick={() => updateMapping(node.path, '')}
                      className="p-1 mr-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
                      title="Clear mapping"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Popover trigger button */}
                <button
                  id={`trigger-${node.path}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePopover(activePopover === node.path ? null : node.path);
                  }}
                  className={`p-1.5 border rounded-lg flex items-center justify-center transition-all ${
                    activePopover === node.path
                      ? 'bg-blue-50 border-blue-300 text-blue-600 shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
                  title="Select field from source"
                >
                  <Brackets size={14} />
                </button>

                {/* Popover */}
                {activePopover === node.path && (
                  <SourceTreePopover
                    sourceTree={sourceTree}
                    targetPath={node.path}
                    onSelect={(selectedPath) => {
                      updateMapping(node.path, `{{ input_data.${selectedPath} }}`);
                      setActivePopover(null);
                    }}
                    onClose={() => setActivePopover(null)}
                  />
                )}
              </div>
            )}
          </div>

          {/* Children nodes */}
          {!isLeaf && isExpanded && node.children && (
            <div className="flex flex-col">
              {renderTargetTree(node.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-[75vw] min-w-[75vw] max-w-[95vw] h-[80vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-800">
              Mapping: {sourceNodeName || 'Source'} → {targetNodeName || 'Target'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-4 bg-blue-50/50 border-b flex items-center justify-between">
          <p className="text-xs text-blue-700 flex items-center gap-2">
            <Info size={14} />
            Map fields from the predecessor's output to the successor's input. Use {} to browse the source tree.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRawContracts(!showRawContracts)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-bold rounded-lg transition-all"
            >
              {showRawContracts ? <EyeOff size={14} /> : <Eye size={14} />}
              {showRawContracts ? 'Hide Contracts' : 'View Contracts'}
            </button>
            <button
              onClick={handleAutoMap}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm shadow-blue-500/20"
            >
              <Wand2 size={14} />
              Auto-map by Name
            </button>
          </div>
        </div>

        {showRawContracts && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border-b animate-in fade-in slide-in-from-top-2 duration-200">
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                Source Contract ({sourceNodeName || 'Output'})
              </h4>
              <pre className="p-3 bg-slate-900 text-blue-400 text-[10px] rounded-lg border border-slate-800 font-mono max-h-48 overflow-auto shadow-inner">
                {JSON.stringify(localSourceContract || {}, null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                Target Contract ({targetNodeName || 'Input'})
              </h4>
              <pre className="p-3 bg-slate-900 text-green-400 text-[10px] rounded-lg border border-slate-800 font-mono max-h-48 overflow-auto shadow-inner">
                {JSON.stringify(localTargetContract || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto p-4 h-full w-full min-h-0">
          <div className="border border-slate-200 rounded-xl overflow-hidden h-full shadow-sm bg-slate-50/20">
            {/* Headers */}
            <div className="flex justify-between py-2 px-3 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Target Fields & Structure ({targetNodeName || 'Input'})</span>
              <span className="w-[320px] pl-3">Source Mapping Expression</span>
            </div>
            <div className="flex flex-col bg-white">
              {targetTree.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No input properties defined in contract
                </div>
              ) : (
                renderTargetTree(targetTree)
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-slate-50 rounded-b-xl flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onSaveMapping(mapping)}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm shadow-blue-500/20"
          >
            Apply Mapping
          </button>
        </div>
      </div>
    </div>
  );
}
