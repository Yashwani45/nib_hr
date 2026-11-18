import React from 'react';

const Badge = ({
  children,
  variant = 'default', // default, primary, success, warning, danger, info, indigo, purple, neutral
  size = 'medium', // small, medium, large
  rounded = false,
  className = '',
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200/90',
    neutral: 'bg-slate-50 text-slate-600 border border-slate-200',
    primary: 'bg-blue-50 text-blue-700 border border-blue-200/80',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200/80',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200/80',
    info: 'bg-sky-50 text-sky-700 border border-sky-200/80',
    indigo: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200/80',
  };

  const sizes = {
    small: 'px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase',
    medium: 'px-2.5 py-0.5 text-xs font-semibold',
    large: 'px-3 py-1 text-xs font-bold tracking-wide',
  };

  const roundedClass = rounded ? 'rounded-full' : 'rounded-lg';
  const selectedVariant = variants[variant] || variants.default;
  const selectedSize = sizes[size] || sizes.medium;

  return (
    <span className={`inline-flex items-center gap-1 leading-none shadow-2xs ${selectedVariant} ${selectedSize} ${roundedClass} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
