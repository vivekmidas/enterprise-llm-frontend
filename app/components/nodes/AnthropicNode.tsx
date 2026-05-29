// src/components/nodes/AnthropicChatNode.tsx
import { Bot } from 'lucide-react';
import { BaseNode, BaseNodeData } from './BaseNode';

const anthropicData: BaseNodeData = {
  label: 'Anthropic Chat Model',
  group: 'Anthropic',
  badge: 'Model',
  icon: Bot,
  color: '#FF6B6B', // or #7C3AED for purple
  subLabel: 'Claude 3.5 Sonnet',
  description: 'High-intelligence conversational model',
};

export const AnthropicChatNode = (props: any) => <BaseNode {...props} data={anthropicData} />;
