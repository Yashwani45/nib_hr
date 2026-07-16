import React from 'react';

const RadioGroup = ({
  label,
  options = [],
  value,
  onChange,
  disabled = false,
  orientation = 'vertical', // horizontal, vertical
  size = 'medium', // small, medium, large
  error,
  required = false,
  className = '',
}) => {
  const sizes = {
    small: 'h-3 w-3',
    medium: 'h-4 w-4',
    large: 'h-5 w-5',
  };

  const labelSizes = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className={`flex ${orientation === 'vertical' ? 'flex-col gap-2' : 'flex-row gap-4'}`}>
        {options.map((option) => (
          <label key={option.value} className={`inline-flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input
              type="radio"
              value={option.value}
              checked={value === option.value}
              onChange={onChange}
              disabled={disabled || option.disabled}
              className={`${sizes[size]} border-gray-300 text-blue-600 focus:ring-blue-500`}
            />
            <span className={`${labelSizes[size]} text-gray-700`}>{option.label}</span>
            {option.description && <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>}
          </label>
        ))}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default RadioGroup;