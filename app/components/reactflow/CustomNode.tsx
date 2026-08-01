import { type NodeProps, type Node, Handle, Position } from '@xyflow/react';
import { CustomNodeData } from './CustomNodeData';
import { IconMap } from '@/lib/icons';
import { Bot, Loader2, CheckCircle2, XCircle, Zap, Share2 } from 'lucide-react';

export const CustomNode = ({ data, selected }: NodeProps<Node<CustomNodeData>>) => {
  const {
    label,
    name,
    model,
    node_type,
    icon,
    color,
    category_color,
    executionStatus,
    description,
    readOnly,
  } = data;
  const title = label || name || 'Untitled Node';

  const outputContractRules =
    (data as any)?.output_contract?.rules || (data as any)?.outputContract?.rules || [];
  const sharesState =
    Array.isArray(outputContractRules) &&
    outputContractRules.some((r: any) => r && (r.stateable || r.state_required));

  const handleStyle = readOnly ? { opacity: 0, pointerEvents: 'none' as const } : undefined;

  const renderIcon = () => {
    if (!icon) return <Bot size={14} />;

    // Handle emoji icons (some built-in nodes use emojis)
    if (typeof icon === 'string' && icon.length <= 2 && /\p{Emoji}/u.test(icon)) {
      return <span className="text-sm">{icon}</span>;
    }

    const IconComponent = typeof icon === 'string' ? IconMap[icon.toLowerCase()] || Bot : Bot;
    return <IconComponent size={14} />;
  };

  const isConditionNode =
    node_type?.toLowerCase() === 'condition' ||
    name?.toLowerCase().includes('condition') ||
    (data as any).category?.toString().toLowerCase() === 'condition' ||
    (data as any).group?.toString().toLowerCase() === 'condition';

  // Determine status-specific styling
  const getStatusStyles = () => {
    switch (executionStatus) {
      case 'running':
        return {
          cardBorder: 'border-blue-500 shadow-md ring-1 ring-blue-500/20',
          badge: (
            <span className="flex items-center text-[8px] text-bg-primary animate-pulse bg-blue-50/50 px-1 rounded font-semibold border border-blue-200">
              <Loader2 size={8} className="animate-spin mr-0.5" /> Run
            </span>
          ),
        };
      case 'success':
        return {
          cardBorder: 'border-emerald-500 shadow-sm',
          badge: (
            <span className="flex items-center text-[8px] text-emerald-600 bg-emerald-50/50 px-1 rounded font-semibold border border-emerald-200">
              <CheckCircle2 size={8} className="mr-0.5" /> Done
            </span>
          ),
        };
      case 'error':
        return {
          cardBorder: 'border-rose-500 shadow-md ring-1 ring-rose-500/10',
          badge: (
            <span className="flex items-center text-[8px] text-rose-600 bg-rose-50/50 px-1 rounded font-semibold border border-rose-200 animate-bounce">
              <XCircle size={8} className="mr-0.5" /> Err
            </span>
          ),
        };
      default:
        return {
          cardBorder: selected ? 'border-slate-400' : 'border-slate-200 hover:border-slate-300',
          badge: null,
        };
    }
  };

  const statusStyles = getStatusStyles();
  const themeColor = category_color || color || '#3b82f6';
  const isTrigger =
    node_type?.toLowerCase() === 'trigger' ||
    (data as any).category?.toString().toLowerCase() === 'trigger' ||
    (data as any).group?.toString().toLowerCase() === 'trigger';

  const renderOutput = () => {
    if (executionStatus === 'error') {
      const errorMsg =
        typeof data.output === 'string'
          ? data.output
          : data.output?.error || data.error || 'Execution failed';
      return (
        <div className="mt-2.5 pt-2 border-t border-rose-100 w-full text-left animate-in fade-in duration-200">
          <span className="font-bold text-[8px] text-rose-500 uppercase tracking-wider block mb-1">
            Error
          </span>
          <pre className="bg-rose-50/50 border border-rose-100 rounded-lg p-1.5 font-mono text-[8px] text-rose-700 max-h-20 overflow-y-auto whitespace-pre-wrap break-all custom-scrollbar leading-normal">
            {errorMsg}
          </pre>
        </div>
      );
    }

    if (executionStatus !== 'success' || !data.output) return null;

    let outputData = data.output;
    if (typeof outputData === 'string') {
      try {
        outputData = JSON.parse(outputData);
      } catch (e) {
        // Raw string
      }
    }

    let displayContent = '';
    if (typeof outputData === 'string') {
      displayContent = outputData;
    } else if (typeof outputData === 'object' && outputData !== null) {
      const innerData = outputData.output || outputData.data || outputData;
      if (typeof innerData === 'string') {
        displayContent = innerData;
      } else {
        displayContent = JSON.stringify(innerData, null, 2);
      }
    }

    if (!displayContent || displayContent === '{}') return null;

    return (
      <div className="mt-2.5 pt-2 border-t border-slate-100 w-full text-left animate-in fade-in duration-200">
        <span className="font-bold text-[8px] text-slate-400 uppercase tracking-wider block mb-1">
          Output
        </span>
        <pre className="bg-slate-50 border border-slate-100 rounded-lg p-1.5 font-mono text-[8px] text-slate-600 max-h-20 overflow-y-auto whitespace-pre-wrap break-all custom-scrollbar leading-normal">
          {displayContent}
        </pre>
      </div>
    );
  };

  return (
    <div
      className={`relative w-[210px] bg-white border rounded-xl p-2.5 flex flex-col gap-1 transition-all duration-300 ${statusStyles.cardBorder}`}
      style={{
        borderLeft: `3px solid ${themeColor}`,
      }}
    >
      <div className="flex items-start gap-2.5 w-full">
        {/* Node Icon Container */}
        <div
          className="relative w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-white shadow-sm"
          style={{
            backgroundColor: themeColor,
          }}
        >
          {renderIcon()}

          {/* If it's a trigger node_type, show a tiny zap badge overlay in the bottom right corner */}
          {isTrigger && (
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full border border-white flex items-center justify-center shadow-sm">
              <Zap size={8} className="text-white fill-white" />
            </div>
          )}
        </div>

        {/* Node Description and Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <h4 className="text-[11px] font-bold text-slate-800 truncate" title={title}>
              {title}
            </h4>
            <div className="flex items-center gap-1 shrink-0">
              {sharesState && (
                <span
                  className="flex items-center text-[7px] text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded font-bold border border-emerald-250/70"
                  title="Shares state variables"
                >
                  <Share2 size={7} className="mr-0.5 text-emerald-500" /> State
                </span>
              )}
              {statusStyles.badge}
            </div>
          </div>

          {description && (
            <p
              className="text-[9px] text-slate-450 leading-tight truncate"
              title={String(description)}
            >
              {String(description)}
            </p>
          )}

          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {model && (
              <span className="inline-block text-[8px] font-mono text-slate-500 bg-slate-50 border border-slate-200 rounded px-1 py-0.2 leading-none">
                {model}
              </span>
            )}
            {!executionStatus && <span className="text-[8px] font-mono text-slate-400">Ready</span>}
          </div>
        </div>
      </div>

      {/* Render Output preview */}
      {renderOutput()}

      {/* React Flow Connection Handles */}
      {/* Left Target Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className="!-left-[4px] shadow-sm cursor-pointer"
        style={handleStyle}
      />

      {/* Top Target Handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        className="!-top-[4px] shadow-sm cursor-pointer"
        style={handleStyle}
      />

      {isConditionNode ? (
        <>
          {/* Success / True Branch */}
          <div className="absolute right-0 top-1/4 translate-x-1/2 flex items-center gap-1">
            <Handle
              type="source"
              position={Position.Right}
              id="success"
              className="cursor-pointer shadow-sm"
              style={handleStyle}
            />
            <span className="absolute right-2.5 text-[7px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-0.5 scale-90 pointer-events-none">
              True
            </span>
          </div>
          {/* Failure / False Branch */}
          <div className="absolute right-0 bottom-1/4 translate-x-1/2 flex items-center gap-1">
            <Handle
              type="source"
              position={Position.Right}
              id="failure"
              className="cursor-pointer shadow-sm"
              style={handleStyle}
            />
            <span className="absolute right-2.5 text-[7px] font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded px-0.5 scale-90 pointer-events-none">
              False
            </span>
          </div>
        </>
      ) : (
        <>
          {/* Standard Right Source Handle */}
          <Handle
            type="source"
            position={Position.Right}
            id="source-right"
            className="!-right-[4px] shadow-sm cursor-pointer"
            style={handleStyle}
          />
          {/* Bottom Source Handle */}
          <Handle
            type="source"
            position={Position.Bottom}
            id="source-bottom"
            className="!-bottom-[4px] shadow-sm cursor-pointer"
            style={handleStyle}
          />
        </>
      )}
    </div>
  );
};
