import { Node, NodeProps } from '@xyflow/react';

// ✅ Only define the DATA shape (this is what you had before)
export type CustomNodeData = {
  label: string;
  model?: string;
  name?: string;
  node_type: string;
  color: string;
  category_color?: string;
  sub_label: string;
  icon?: string | React.ReactNode;
  variant?: 'start' | 'detector' | 'agent';
  executionStatus?: 'idle' | 'running' | 'success' | 'error';
  description?: string;
  output?: any;
  error?: string;
  readOnly?: boolean;
};

// ✅ Use this for your nodes array
export type CustomNode = Node<CustomNodeData>;
