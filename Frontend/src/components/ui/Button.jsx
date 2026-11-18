import React from 'react';

const Button = ({
  children,
  variant = 'primary', // primary, secondary, success, danger, warning, info, outline, ghost
  size = 'medium', // small, medium, large
  disabled = false,
  loading = false,
  fullWidth = false,
  icon = null,
  iconPosition = 'left',
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs focus:ring-blue-500/40 active:bg-blue-800',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs focus:ring-slate-300 active:bg-slate-100',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs focus:ring-emerald-500/40 active:bg-emerald-800',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus:ring-rose-500/40 active:bg-rose-800',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs focus:ring-amber-500/40 active:bg-amber-700',
    info: 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs focus:ring-sky-500/40 active:bg-sky-800',
    outline: 'border border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs focus:ring-slate-300',
    ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 focus:ring-slate-300',
  };

  const sizes = {
    small: 'px-2.5 py-1.5 text-xs gap-1.5',
    medium: 'px-3.5 py-2 text-xs font-bold gap-2',
    large: 'px-5 py-2.5 text-sm font-bold gap-2.5',
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const selectedVariant = variants[variant] || variants.primary;
  const selectedSize = sizes[size] || sizes.medium;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${selectedVariant} ${selectedSize} ${widthClass} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-3.5 w-3.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {icon && iconPosition === 'left' && !loading && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && !loading && <span className="inline-flex shrink-0">{icon}</span>}
    </button>
  );
};

export default Button;
