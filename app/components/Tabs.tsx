import React, { ReactNode, useState } from 'react';

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'pill' | 'underline';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  defaultTab = items[0]?.id,
  onChange,
  variant = 'default',
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const variantClasses = {
    default:
      'border-b border-gray-200 gap-0',
    pill:
      'gap-2 bg-gray-100 p-1 rounded-lg inline-flex',
    underline:
      'border-b border-gray-200 gap-4',
  };

  const tabButtonClasses = {
    default:
      'px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200',
    pill:
      'px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
    underline:
      'px-0 py-2 text-sm font-medium border-b-2 transition-colors duration-200',
  };

  const activeClasses = {
    default:
      'text-gray-900 border-b-blue-600',
    pill:
      'bg-white text-gray-900 shadow-sm',
    underline:
      'text-gray-900 border-b-blue-600',
  };

  const inactiveClasses = {
    default:
      'text-gray-600 border-b-transparent hover:text-gray-900 hover:border-b-gray-300',
    pill:
      'text-gray-600 hover:text-gray-900',
    underline:
      'text-gray-600 border-b-transparent hover:text-gray-900 hover:border-b-gray-300',
  };

  return (
    <div className={className}>
      <div className={`flex ${variantClasses[variant]} overflow-x-auto`}>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => !item.disabled && handleTabChange(item.id)}
            disabled={item.disabled}
            className={`
              ${tabButtonClasses[variant]}
              ${activeTab === item.id ? activeClasses[variant] : inactiveClasses[variant]}
              ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              flex items-center gap-2 whitespace-nowrap
            `}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      <div className="animate-fade-in">
        {items.map(
          (item) =>
            activeTab === item.id && (
              <div key={item.id} className="py-4">
                {item.content}
              </div>
            )
        )}
      </div>
    </div>
  );
};
