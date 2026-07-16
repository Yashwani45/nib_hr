    import React from 'react';

const Card = ({
  children,
  title,
  subtitle,
  icon,
  actions,
  variant = 'default', // default, bordered, elevated
  padding = 'medium', // none, small, medium, large
  className = '',
  onClick,
}) => {
  const variants = {
    default: 'bg-white shadow-sm',
    bordered: 'bg-white border border-gray-200',
    elevated: 'bg-white shadow-lg',
  };

  const paddings = {
    none: 'p-0',
    small: 'p-3',
    medium: 'p-4',
    large: 'p-4 sm:p-6',
  };

  return (
    <div
      className={`rounded-lg ${variants[variant]} ${className} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      {(title || subtitle || icon || actions) && (
        <div className={`flex items-start justify-between border-b border-gray-200 ${paddings[padding]}`}>
          <div className="flex items-center gap-3">
            {icon && <div className="text-gray-600">{icon}</div>}
            <div>
              {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
              {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}
      <div className={paddings[padding]}>{children}</div>
    </div>
  );
};

export default Card;
