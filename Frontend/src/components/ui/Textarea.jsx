import React from 'react';

const Textarea = ({
  label,
  placeholder,
  value,
  onChange,
  rows = 4,
  error,
  required = false,
  disabled = false,
  size = 'medium', // small, medium, large
  fullWidth = true,
  helperText,
  resizable = true,
  maxLength,
  showCount = false,
  className = '',
  ...props
}) => {
  const sizes = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  };

  const baseStyles = 'border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed';
  const errorStyles = error ? 'border-red-500' : 'border-gray-300';
  const resizeClass = resizable ? 'resize-y' : 'resize-none';
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <div className={`${widthClass} ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {showCount && maxLength && (
            <span className="text-xs text-gray-500 float-right">
              {value?.length || 0}/{maxLength}
            </span>
          )}
        </label>
      )}
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        disabled={disabled}
        maxLength={maxLength}
        className={`${baseStyles} ${errorStyles} ${sizes[size]} ${resizeClass} ${widthClass}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
    </div>
  );
};

export default Textarea;