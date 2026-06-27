'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';

interface JsonNodeProps {
  name: string | number;
  value: any;
  isLast: boolean;
  depth: number;
}

const JsonNode: React.FC<JsonNodeProps> = ({ name, value, isLast, depth }) => {
  const [isExpanded, setIsExpanded] = useState(depth < 2); // expand root level by default

  const type = typeof value;
  const isObject = value !== null && type === 'object';

  if (isObject) {
    const isArray = Array.isArray(value);
    const keys = Object.keys(value);
    const isEmpty = keys.length === 0;

    if (isEmpty) {
      return (
        <div style={{ paddingLeft: `${depth * 16}px` }} className="font-mono text-xs text-gray-400 py-0.5">
          <span className="text-blue-400 font-semibold">{name}</span>: {isArray ? '[]' : '{}'}
          {!isLast && ','}
        </div>
      );
    }

    return (
      <div className="font-mono text-xs py-0.5" style={{ paddingLeft: `${depth * 16}px` }}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center hover:bg-gray-800 rounded px-1 -ml-1 text-left select-none text-gray-400 focus:outline-none transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 mr-0.5 shrink-0 text-gray-500" />
          ) : (
            <ChevronRight className="h-3 w-3 mr-0.5 shrink-0 text-gray-500" />
          )}
          <span className="text-blue-300 font-semibold">{name}</span>: {isArray ? '[' : '{'}
        </button>
        
        {isExpanded ? (
          <div className="border-l border-gray-800 ml-1.5 pl-3.5 my-0.5">
            {keys.map((key, index) => (
              <JsonNode
                key={key}
                name={isArray ? index : key}
                value={value[key]}
                isLast={index === keys.length - 1}
                depth={depth + 1}
              />
            ))}
          </div>
        ) : (
          <span className="text-gray-500 text-[10px] italic select-none ml-1">
            {isArray ? `${keys.length} items` : `${keys.length} keys`}
          </span>
        )}
        <div className="text-gray-400 select-none pl-3.5">
          {isArray ? ']' : '}'}
          {!isLast && ','}
        </div>
      </div>
    );
  }

  // Primitive values
  let valElement;
  if (value === null) {
    valElement = <span className="text-gray-500 italic">null</span>;
  } else if (type === 'string') {
    valElement = <span className="text-emerald-400 break-all">"{value}"</span>;
  } else if (type === 'number') {
    valElement = <span className="text-amber-400">{value}</span>;
  } else if (type === 'boolean') {
    valElement = <span className="text-purple-400 font-semibold">{value ? 'true' : 'false'}</span>;
  } else {
    valElement = <span className="text-gray-300">{String(value)}</span>;
  }

  return (
    <div style={{ paddingLeft: `${depth * 16}px` }} className="font-mono text-xs py-0.5 hover:bg-gray-800/40 rounded pr-2">
      <span className="text-blue-400 font-semibold">{name}</span>: {valElement}
      {!isLast && ','}
    </div>
  );
};

interface JsonTreeViewProps {
  data: any;
}

export function JsonTreeView({ data }: JsonTreeViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isObject = data !== null && typeof data === 'object';
  
  return (
    <div className="relative border border-gray-800 rounded-lg bg-gray-950 p-4 max-h-[500px] overflow-auto select-text text-gray-300 shadow-inner">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-lg border border-gray-800 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-all flex items-center gap-1.5 text-xs shadow-sm z-10"
        title="Copy JSON"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-emerald-500 font-medium">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            <span>Copy</span>
          </>
        )}
      </button>
      <div className="pt-2">
        {isObject ? (
          <div>
            <div className="font-mono text-xs text-gray-400 select-none">
              {Array.isArray(data) ? '[' : '{'}
            </div>
            <div className="border-l border-gray-800 ml-1.5 pl-3.5">
              {Object.keys(data).map((key, index, arr) => (
                <JsonNode
                  key={key}
                  name={Array.isArray(data) ? index : key}
                  value={data[key]}
                  isLast={index === arr.length - 1}
                  depth={1}
                />
              ))}
            </div>
            <div className="font-mono text-xs text-gray-400 select-none">
              {Array.isArray(data) ? ']' : '}'}
            </div>
          </div>
        ) : (
          <div className="font-mono text-xs">
            {String(data)}
          </div>
        )}
      </div>
    </div>
  );
}
