import { type NodeProps, type Node, Handle, Position } from '@xyflow/react';
import { CustomNodeData } from './CustomNodeData';
import {
  Zap,
  Bot,
  Database,
  Mail,
  Globe,
  Shield,
  MessageSquare,
  Workflow,
  Clock,
  AlertTriangle,
  Settings,
  PhoneCall,
  Send,
  MessageCircle,
  PlayCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const iconMap: Record<string, any> = {
  'play-circle': PlayCircle,
  zap: Zap,
  'message-square': MessageSquare,
  database: Database,
  mail: Mail,
  globe: Globe,
  shield: Shield,
  workflow: Workflow,
  clock: Clock,
  'alert-triangle': AlertTriangle,
  settings: Settings,
  'phone-call': PhoneCall,
  send: Send,
  'message-circle': MessageCircle,
  'check-circle': CheckCircle,
  'x-circle': XCircle,
  bot: Bot,
};

export const CustomNode = ({ data, selected }: NodeProps<Node<CustomNodeData>>) => {
  const { label, name, model, node_type, icon, color } = data;
  const title = label || name || 'Untitled Node';

  const renderIcon = () => {
    if (!icon) return <Bot size={20} />;

    // Handle emoji icons (some built-in nodes use emojis)
    if (typeof icon === 'string' && icon.length <= 2 && /\p{Emoji}/u.test(icon)) {
      return <span className="text-xl">{icon}</span>;
    }

    const IconComponent = iconMap[icon.toLowerCase()] || Bot;
    return <IconComponent size={20} />;
  };

  // Start Node
  if (node_type?.toLowerCase() === 'trigger') {
    return (
      <div
        className="px-1 py-1 rounded-2xl shadow-xl border text-white flex items-center gap-3 min-w-[150px]"
        style={{
          backgroundColor: color || '#10b981',
          borderColor: color ? `${color}cc` : '#34d399',
        }}
      >
        <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
          {renderIcon()}
        </div>
        <div className="font-normal text-m">{label}</div>
        <Handle type="source" position={Position.Right} className="w-4 h-4 bg-white !-right-2" />
      </div>
    );
  }

  // Condition / Detector Node
  if (node_type?.toLowerCase() !== 'trigger') {
    return (
      <div
        className="px-1 py-1 rounded-2xl shadow-xl border text-white flex items-center gap-3 min-w-[150px]"
        style={{
          backgroundColor: color || '#10b981',
          borderColor: color ? `${color}cc` : '#34d399',
        }}
      >
        <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
          {renderIcon()}
        </div>
        <div className="font-normal text-m">{label}</div>

        <Handle type="target" position={Position.Left} className="w-6 h-6 bg-pink-500" />
        {/* Success / True Branch */}
        <div className="absolute right-0 top-1/4 translate-x-1/2 flex items-center gap-1">
          <Handle
            type="source"
            position={Position.Right}
            id="success"
            className="w-4 h-4 bg-green-500"
          />
        </div>
        {/* Failure / False Branch */}
        <div className="absolute right-0 bottom-1/4 translate-x-1/2 flex items-center gap-1">
          <Handle
            type="source"
            position={Position.Right}
            id="failure"
            className="w-4 h-4 bg-red-500"
          />
        </div>
      </div>
    );
  }
};
