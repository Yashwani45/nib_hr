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
    default: 'bg-white border border-slate-200/80 shadow-xs rounded-2xl',
    bordered: 'bg-white border border-slate-200/90 shadow-2xs rounded-2xl',
    elevated: 'bg-white border border-slate-200/80 shadow-md rounded-2xl',
  };

  const paddings = {
    none: 'p-0',
    small: 'p-3.5',
    medium: 'p-5',
    large: 'p-6 sm:p-7',
  };

  return (
    <div
      className={`${variants[variant] || variants.default} ${className} ${onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-sm transition-all duration-150' : ''}`}
      onClick={onClick}
    >
      {(title || subtitle || icon || actions) && (
        <div className={`flex items-start justify-between border-b border-slate-100 ${paddings[padding]}`}>
          <div className="flex items-center gap-3">
            {icon && <div className="text-slate-500 shrink-0">{icon}</div>}
            <div>
              {title && <h3 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={paddings[padding]}>{children}</div>
    </div>
  );
};

export default Card;
