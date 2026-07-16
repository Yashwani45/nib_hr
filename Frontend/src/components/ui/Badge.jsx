import React from 'react';

const Badge = ({
  children,
  variant = 'default', // default, primary, success, warning, danger, info
  size = 'medium', // small, medium
  rounded = false,
  className = '',
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-cyan-100 text-cyan-800',
  };

  const sizes = {
    small: 'px-2 py-0.5 text-xs',
    medium: 'px-2.5 py-1 text-sm',
  };

  const roundedClass = rounded ? 'rounded-full' : 'rounded';

  return (
    <span className={`inline-flex items-center font-medium ${variants[variant]} ${sizes[size]} ${roundedClass} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;