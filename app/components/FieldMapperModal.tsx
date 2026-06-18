'use client';
import { useState, useMemo, useEffect } from 'react';
import { X, ArrowRightLeft, Wand2, Info, Eye, EyeOff } from 'lucide-react';
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

  // Fetch standard contracts from NodesDB based on node names if provided
  useEffect(() => {
    if (!isOpen) return;

    const syncContracts = async () => {
      try {
        const nodesData = await api.getNodes();
        const nodesList = Array.isArray(nodesData) ? nodesData : (nodesData as any).nodes || (nodesData as any).agents || [];

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

  /**
   * Recursively flattens a JSON Schema-like properties object into dot-notation paths.
   * e.g., { data: { properties: { message: { type: 'string' } } } } -> ["data.message"]
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
        const hasMetadata = Object.keys(val).some(k => metadataKeys.includes(k.toLowerCase()));
        const isPlainObject = Object.keys(val).length > 0 && !val.type && !hasMetadata;

        if (isSchema || isPlainObject) {
          return [...acc, ...flattenSchema(val, currentPath)];
        }
      }
      return [...acc, currentPath];
    }, []);
  };

  /**
   * Retrieves metadata (type, required, description) for a specific flattened path.
   * Handles both JSON Schema style (with .properties) and plain object styles.
   */
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
    return flattenSchema(localSourceContract);
  }, [localSourceContract]);

  const targetFields = useMemo(() => {
    return flattenSchema(localTargetContract);
  }, [localTargetContract]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white full-width rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[200vh]">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-800">
              Mapping: {sourceNodeName || 'Source'} → {targetNodeName || 'Target'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 bg-blue-50 border-b flex items-center justify-between">
          <p className="text-xs text-blue-700 flex items-center gap-2">
            <Info size={14} />
            Map fields from the predecessor's output to the successor's input.
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all"
            >
              <Wand2 size={14} />
              Auto-map by Name
            </button>
          </div>
        </div>

        {showRawContracts && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 border-b animate-in fade-in slide-in-from-top-2 duration-200">
            <div>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">Source Contract ({sourceNodeName || 'Output'})</h4>
              <pre className="p-3 bg-gray-900 text-blue-400 text-[10px] rounded-lg border border-gray-800 font-mono max-h-48 overflow-auto shadow-inner">
                {JSON.stringify(localSourceContract || {}, null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">Target Contract ({targetNodeName || 'Input'})</h4>
              <pre className="p-3 bg-gray-900 text-green-400 text-[10px] rounded-lg border border-gray-800 font-mono max-h-48 overflow-auto shadow-inner">
                {JSON.stringify(localTargetContract || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b">
                <th className="pb-2 font-semibold">Source Field ({sourceNodeName || 'Output'})</th>
                <th className="pb-2 font-semibold text-center">←</th>
                <th className="pb-2 font-semibold">Target Field ({targetNodeName || 'Input'})</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {targetFields.map((field) => {
                const meta = getFieldMeta(localTargetContract, field);
                const isRequired = 
                  meta?.required === true || 
                  meta?.required === 'True' || 
                  meta?.mandatory === true || 
                  meta?.mandatory === 'True';

                return (
                  <tr key={field} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="py-3">
                    <select
                      value={mapping[field] || ''}
                      onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                      className={`w-full border rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                        isRequired && !mapping[field] 
                          ? 'border-amber-300 bg-amber-50 shadow-sm' 
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <option value="">-- Select Source Field --</option>
                      {sourceFields.map((s) => {
                        const sMeta = getFieldMeta(localSourceContract, s);
                        const sType = sMeta?.type || 'any';
                        return (
                          <option key={s} value={`{{ input_data.${s} }}`}>
                            {s} ({sType})
                          </option>
                        );
                      })}
                      {/* Preserve custom mapping if it doesn't match a source field */}
                      {mapping[field] && !sourceFields.some(s => `{{ input_data.${s} }}` === mapping[field]) && (
                        <option value={mapping[field]}>{mapping[field]} (Custom)</option>
                      )}
                    </select>
                  </td>
                  <td className="py-3 text-center text-gray-300">←</td>
                  <td className="py-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-sm ${isRequired ? 'text-gray-900' : 'text-gray-700'}`}>
                          {field}
                        </span>
                        {isRequired && (
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 uppercase tracking-tighter">
                            Required
                          </span>
                        )}
                      </div>
                      {(meta?.type || meta?.description) && (
                        <div className="mt-1 flex flex-col gap-0.5">
                          {meta?.type && (
                            <span className="text-[10px] text-gray-400 font-mono italic">type: {meta.type}</span>
                          )}
                          {meta?.description && (
                            <p className="text-[10px] text-gray-500 line-clamp-1 italic" title={meta.description}>{meta.description}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600">Cancel</button>
          <button onClick={() => onSaveMapping(mapping)} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm">Apply Mapping</button>
        </div>
      </div>
    </div>
  );
}