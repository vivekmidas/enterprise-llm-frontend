import { api } from '../../lib/api';
import type { ComponentType } from 'react';
import type { CSSProperties } from 'react';

export interface Category {
  id: string;
  name: string; // Formerly group
  label: string; // Display name and tooltip
  icon: string;
  color: string; // Base color name (e.g. 'blue', 'emerald')
}

export type PropertyValue = string | number | boolean | string[];

export interface NodePropertyDefinition {
  key: string;
  label: string;
  type:
    | 'string'
    | 'boolean'
    | 'choice'
    | 'password'
    | 'textarea'
    | 'number'
    | 'oauth'
    | 'source'
    | 'path';
  placeholder?: string;
  options?: string[];
  multiple?: boolean;
  default?: PropertyValue;
  description?: string;
  source?: string;
  /** For type='path' — passed to HTML file input accept attribute e.g. ".pdf,.docx,application/pdf" */
  accept?: string;
}

export interface NodeDefinition {
  id: string;
  name: string;
  label?: string;
  description: string;
  version?: string;
  category: string; // Renamed from group
  nodeType?: 'trigger' | 'tool' | 'default';
  icon: string;
  color?: string;
  badge?: string;
  subLabel?: string;
  triggerType?: string;
  outcome?: string;
  propertySchema?: NodePropertyDefinition[];
  input_contract?: Record<string, any>;
  output_contract?: Record<string, any>;
  user_properties?: Record<string, PropertyValue>;
  system_properties?: Record<string, PropertyValue>;
}

export interface CategoryItem {
  group: string;
  label: string;
  icon: ComponentType<{ className?: string; style?: CSSProperties; color?: string }>;
  color: string;
  description?: string;
  id: string;
}

export interface NodeSidebarProps {
  onSelectAgent?: (id: string) => void;
  onNewAgent?: () => void;
  onAllAgentsLoaded?: (agentNames: string[]) => void;
}

export type AgentSidebarProps = NodeSidebarProps;

export interface NodeCategory {
  id?: string;
  name: string;
  group?: string;
  label?: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface AgentNode {
  id?: string;
  name: string;
  label: string;
  description: string;
  node_type: string;
  version: string;
  category: string;
  group: string;
  icon?: string;
  color?: string;
  badge?: string;
  sub_label?: string;
  user_properties: any[];
  system_properties: any[];
  input_contract: Record<string, any> | string;
  output_contract: Record<string, any> | string;
  is_enabled?: boolean;
  allow_node_testing?: boolean;
  customer_id?: number | null;
}

export interface NodeData {
  label?: string;
  properties: Record<string, any>;
  [key: string]: any;
}

export interface Node {
  id: string;
  type?: string; // Make type optional to align with ReactFlow's Node definition
  data: NodeData;
  position?: { x: number; y: number };
}

export interface AgentPayload {
  id: string;
  name: string;
  description?: string;
  nodes: Node[];
  edges: unknown[];
  user_id: string;
  category?: string;
  is_enabled?: boolean;
}

export const CATEGORIES: Record<string, Category> = {
  Start: { id: '1', name: 'Start', label: 'Agent Start', icon: 'play-circle', color: 'emerald' },
  Guardrails: {
    id: '2',
    name: 'Guardrails',
    label: 'Safety Guardrails',
    icon: 'fence',
    color: 'red',
  },
  Validation: {
    id: '3',
    name: 'Validation',
    label: 'Input Validation',
    icon: 'alert-triangle',
    color: 'amber',
  },
  Context: {
    id: '4',
    name: 'Context',
    label: 'Context Injection',
    icon: 'user-cog',
    color: 'blue',
  },
  LLM: { id: '5', name: 'LLM', label: 'LLM Processing', icon: 'bot', color: 'purple' },
  Output: {
    id: '6',
    name: 'Output',
    label: 'Output Generation',
    icon: 'check-circle',
    color: 'emerald',
  },
  Trigger: { id: '7', name: 'Trigger', label: 'Event Trigger', icon: 'play-circle', color: 'blue' },
  End: { id: '8', name: 'End', label: 'Agent End', icon: 'check-circle', color: 'gray' },
  Data: { id: '9', name: 'Data', label: 'Data Operations', icon: 'database', color: 'cyan' },
  Agent: { id: '10', name: 'Agent', label: 'AI Agent', icon: 'message-square', color: 'gray' },
  Custom: { id: '11', name: 'Custom', label: 'Custom Node', icon: 'message-square', color: 'gray' },
  Clock: { id: '12', name: 'Clock', label: 'Timer/Schedule', icon: 'clock', color: 'orange' },
  Workflow: {
    id: '13',
    name: 'Workflow',
    label: 'Sub-workflow',
    icon: 'workflow',
    color: 'indigo',
  },
  VectorDB: { id: '14', name: 'VectorDB', label: 'Vector DB', icon: 'blocks', color: 'emerald' },
  NLP: { id: '15', name: 'NLP', label: 'NLP & Analysis', icon: 'brain', color: 'violet' },
};

/* ============================================================================
   BLOCK COMMENT: THEME COLOR RESOLUTION & NORMALIZATION
   Maps Tailwind color names to CSS hex codes, normalizes 8-digit hex (#RRGGBBAA)
   to 6-digit hex (#RRGGBB), and filters out white / near-white / transparent
   values so node icons and borders always remain visible on white cards.
   ============================================================================ */
const TAILWIND_COLOR_HEX_MAP: Record<string, string> = {
  emerald: '#10b981',
  green: '#22c55e',
  amber: '#f59e0b',
  yellow: '#eab308',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  purple: '#8b5cf6',
  fuchsia: '#d946ef',
  pink: '#ec4899',
  rose: '#f43f5e',
  red: '#ef4444',
  orange: '#f97316',
  blue: '#3b82f6',
  sky: '#0ea5e9',
  cyan: '#06b6d4',
  teal: '#14b8a6',
  lime: '#84cc16',
  gray: '#64748b',
  slate: '#64748b',
  zinc: '#71717a',
  neutral: '#737373',
};

const isUsableThemeColor = (raw: string): string | null => {
  const trimmed = raw.trim().toLowerCase();
  if (
    !trimmed ||
    trimmed === 'none' ||
    trimmed === 'transparent' ||
    trimmed === 'white' ||
    trimmed === 'inherit' ||
    trimmed === 'initial' ||
    trimmed === 'unset'
  ) {
    return null;
  }

  if (TAILWIND_COLOR_HEX_MAP[trimmed]) {
    return TAILWIND_COLOR_HEX_MAP[trimmed];
  }

  // Handle #RGB or #RGBA
  const shortHexMatch = /^#([0-9a-f]{3,4})$/i.exec(trimmed);
  if (shortHexMatch) {
    const hex = shortHexMatch[1];
    if (hex.length === 4 && hex[3] === '0') return null;
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    if (r >= 240 && g >= 240 && b >= 240) return null;
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
  }

  // Handle #RRGGBB or #RRGGBBAA
  const fullHexMatch = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(trimmed);
  if (fullHexMatch) {
    const rgbHex = fullHexMatch[1];
    const alphaHex = fullHexMatch[2];
    if (alphaHex && parseInt(alphaHex, 16) < 20) return null;
    const r = parseInt(rgbHex.slice(0, 2), 16);
    const g = parseInt(rgbHex.slice(2, 4), 16);
    const b = parseInt(rgbHex.slice(4, 6), 16);
    if (r >= 240 && g >= 240 && b >= 240) return null;
    return `#${rgbHex}`;
  }

  // Handle rgb(...) / rgba(...)
  const rgbMatch = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(
    trimmed,
  );
  if (rgbMatch) {
    const r = Number(rgbMatch[1]);
    const g = Number(rgbMatch[2]);
    const b = Number(rgbMatch[3]);
    const a = rgbMatch[4] !== undefined ? Number(rgbMatch[4]) : 1;
    if (a < 0.1 || (r >= 240 && g >= 240 && b >= 240)) return null;
    return raw.trim();
  }

  return raw.trim();
};

export const resolveThemeColor = (
  ...candidates: Array<string | undefined | null>
): string => {
  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const resolved = isUsableThemeColor(candidate);
      if (resolved) return resolved;
    }
  }
  return '#3b82f6';
};

export const getCategory = (nameOrId?: string | number): Category => {
  if (nameOrId !== undefined && nameOrId !== null) {
    const key = String(nameOrId);
    if (CATEGORIES[key]) return CATEGORIES[key];
    const lower = key.toLowerCase();
    const matched = Object.values(CATEGORIES).find(
      (cat) => cat.id === key || cat.name.toLowerCase() === lower || cat.label.toLowerCase() === lower,
    );
    if (matched) return matched;
  }
  return CATEGORIES.Agent;
};

// ==============================================================================
// BLOCK COMMENT: NODE SCHEMA HYDRATION FOR WORKFLOW BUILDER
// Reference: EPIC-NODE-PROPS-UI-001 / STORY-CHOICE-TEXTAREA-VALUES-001
// Description:
//     GET /nodes/{name} returns `user_properties` / `system_properties` as schema
//     arrays. Build `propertySchema` (typed: choice/textarea/options/multiple) and
//     initial `properties` (value -> default -> first option) so dropped nodes
//     render choice + textarea fields with proper values.
// ==============================================================================
const toSchemaList = (raw: any, category: 'user' | 'system'): any[] => {
  let val = raw;
  if (typeof val === 'string') {
    try { val = JSON.parse(val); } catch { return []; }
  }
  if (!Array.isArray(val)) return [];
  return val
    .map((item: any) => {
      if (typeof item === 'string') {
        try { return JSON.parse(item); } catch { return null; }
      }
      return item;
    })
    .filter((item: any) => item && typeof item === 'object' && item.key)
    .map((item: any) => ({ ...item, category }));
};

export const resolveSchemaEntryValue = (entry: any): any => {
  const isEmpty = (v: any) => v === undefined || v === null || v === '';
  let val = !isEmpty(entry?.value) ? entry.value : entry?.default;
  const type = String(entry?.type || '').toLowerCase();
  if (isEmpty(val) && (type === 'choice' || type === 'select') && !entry?.multiple) {
    const opts = Array.isArray(entry?.options) ? entry.options : [];
    val = opts.length ? opts[0] : '';
  }
  return isEmpty(val) ? '' : val;
};

// retrieve node details from the backend api /nodes
export const fetchNodeDetails = async (nodeName: string): Promise<Partial<NodeDefinition>> => {
  try {
    const response = await api.getNodesByName(nodeName);

    const data = response.node;
    const schemaFromProps = [
      ...toSchemaList(data.user_properties, 'user'),
      ...toSchemaList(data.system_properties, 'system'),
    ];
    const propertySchema = data.propertySchema || data.property_schema || (schemaFromProps.length ? schemaFromProps : undefined);
    let properties = data.defaultProperties || data.properties;
    if (!properties && schemaFromProps.length) {
      properties = schemaFromProps
        .filter((e: any) => e.category === 'user' && e.key !== 'allow_node_testing')
        .reduce((acc: Record<string, any>, e: any) => {
          acc[e.key] = resolveSchemaEntryValue(e);
          return acc;
        }, {});
    }
    // Return the full data object to ensure properties like icon, category, and label are available
    return {
      ...data,
      description: data.description,
      propertySchema,
      properties,
      label: data.label,
      category: data.category,
    };
  } catch (error) {
    console.error(error);
    return {};
  }
};

const toDisplayName = (name: string) =>
  name
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

/**
 * Normalizes a node by fetching its full definition from the registry based on its name.
 */
export const normalizeAgent = async (name: string): Promise<NodeDefinition> => {
  const details = await fetchNodeDetails(name);
  return {
    name,
    label: details.label || toDisplayName(name),
    description: details.description || '',
    category: details.category ?? 1,
    icon: details.icon || 'bot',
    ...details,
  } as NodeDefinition;
};
