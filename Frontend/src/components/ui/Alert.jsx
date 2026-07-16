import React, { useState } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const Alert = ({
  type = 'info', // success, error, warning, info
  title,
  message,
  dismissible = false,
  onDismiss,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const types = {
    success: {
      icon: CheckCircleIcon,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-400',
      textColor: 'text-green-800',
      iconColor: 'text-green-400',
    },
    error: {
      icon: XCircleIcon,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-400',
      textColor: 'text-red-800',
      iconColor: 'text-red-400',
    },
    warning: {
      icon: ExclamationTriangleIcon,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-400',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-400',
    },
    info: {
      icon: InformationCircleIcon,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-400',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-400',
    },
  };

  const currentType = types[type];
  const Icon = currentType.icon;

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) onDismiss();
  };

  if (!isVisible) return null;

  return (
    <div className={`border-l-4 ${currentType.borderColor} ${currentType.bgColor} p-4 rounded-lg ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${currentType.iconColor}`} />
        </div>
        <div className="ml-3 flex-1">
          {title && <h3 className={`text-sm font-medium ${currentType.textColor}`}>{title}</h3>}
          {message && <div className={`text-sm ${currentType.textColor} ${title ? 'mt-1' : ''}`}>{message}</div>}
        </div>
        {dismissible && (
          <button onClick={handleDismiss} className={`ml-auto ${currentType.textColor}`}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;