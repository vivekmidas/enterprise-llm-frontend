import React, { ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertProps {
  type: AlertType;
  title?: string;
  message: ReactNode;
  onClose?: () => void;
  dismissible?: boolean;
  className?: string;
}

const typeConfig = {
  success: {
    icon: CheckCircle,
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    iconColor: 'text-green-600',
  },
  error: {
    icon: AlertCircle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    iconColor: 'text-red-600',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    iconColor: 'text-yellow-600',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    iconColor: 'text-blue-600',
  },
};

export const Alert: React.FC<AlertProps> = ({
  type,
  title,
  message,
  onClose,
  dismissible = false,
  className = '',
}) => {
  const config = typeConfig[type];
  const IconComponent = config.icon;

  return (
    <div
      className={`animate-fade-in rounded-lg border ${config.bg} ${config.border} ${config.text} p-4 ${className}`}
    >
      <div className="flex gap-3">
        <IconComponent className={`h-5 w-5 flex-shrink-0 ${config.iconColor}`} />
        <div className="flex-1">
          {title && <h3 className="font-semibold text-sm mb-1">{title}</h3>}
          <p className="text-sm">{message}</p>
        </div>
        {dismissible && onClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 ${config.iconColor} hover:opacity-70 transition-opacity`}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export const AlertSuccess: React.FC<Omit<AlertProps, 'type'>> = (props) => (
  <Alert type="success" {...props} />
);

export const AlertError: React.FC<Omit<AlertProps, 'type'>> = (props) => (
  <Alert type="error" {...props} />
);

export const AlertWarning: React.FC<Omit<AlertProps, 'type'>> = (props) => (
  <Alert type="warning" {...props} />
);

export const AlertInfo: React.FC<Omit<AlertProps, 'type'>> = (props) => (
  <Alert type="info" {...props} />
);
