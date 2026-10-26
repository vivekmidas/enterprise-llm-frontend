'use client';

/**
 * ==============================================================================
 * BLOCK COMMENT: INLINE CHECKBOX LIST FOR MULTI-SELECT CHOICE PROPERTIES
 * Reference: EPIC-NODE-PROPS-UI-001 / STORY-CHOICE-TEXTAREA-VALUES-001
 * Description:
 *     Shared inline (non-popover) checkbox list rendered for `choice` / `select`
 *     properties with `multiple: true`. Used by the Workflow Builder Properties
 *     Panel and the Edit Node Registry modal. Matches Test Node modal styling.
 *     Uses relative/flow layout only (no absolute positioning).
 * ==============================================================================
 */
import React from 'react';

/** Normalizes array / comma-separated string / scalar into a string[] selection. */
export const toSelectedList = (val: any): string[] => {
  if (Array.isArray(val)) return val.map((v) => String(v).trim()).filter(Boolean);
  if (val === undefined || val === null || val === '') return [];
  return String(val)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
};

interface ChoiceCheckboxListProps {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  accent?: 'indigo' | 'purple';
}

const ChoiceCheckboxList: React.FC<ChoiceCheckboxListProps> = ({
  options,
  selected,
  onChange,
  disabled = false,
  accent = 'indigo',
}) => {
  const toggle = (opt: string) => {
    if (disabled) return;
    const next = selected.includes(opt)
      ? selected.filter((x) => x !== opt)
      : // keep option order stable
        options.filter((o) => o === opt || selected.includes(o));
    onChange(next);
  };

  const hoverCls = accent === 'purple' ? 'hover:bg-purple-50' : 'hover:bg-indigo-50';
  const accentCls = accent === 'purple' ? 'accent-purple-600' : 'accent-indigo-600';
  const textCls = accent === 'purple' ? 'text-purple-600' : 'text-indigo-600';

  return (
    <div className="space-y-1">
      <div
        className={`rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 max-h-40 overflow-y-auto ${
          disabled ? 'opacity-60' : ''
        }`}
      >
        {options.length === 0 ? (
          <p className="px-3 py-1.5 text-[11px] italic text-gray-400">No options configured.</p>
        ) : (
          options.map((opt) => (
            <label
              key={opt}
              className={`flex items-center gap-2 px-3 py-1.5 transition-colors ${
                disabled ? 'cursor-not-allowed' : `cursor-pointer ${hoverCls}`
              }`}
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                disabled={disabled}
                onChange={() => toggle(opt)}
                className={`${accentCls} h-3 w-3`}
              />
              <span className="text-xs text-black">{opt}</span>
            </label>
          ))
        )}
      </div>
      {selected.length > 0 && (
        <p className={`text-[10px] font-mono ${textCls}`}>Selected: [{selected.join(', ')}]</p>
      )}
    </div>
  );
};

export default ChoiceCheckboxList;

