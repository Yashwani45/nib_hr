import React from 'react';

const Switch = ({
  label,
  checked,
  onChange,
  disabled = false,
  size = 'medium', // small, medium, large
  className = '',
}) => {
  const sizes = {
    small: {
      switch: 'w-8 h-4',
      toggle: 'h-3 w-3',
      translate: 'translate-x-4',
    },
    medium: {
      switch: 'w-11 h-6',
      toggle: 'h-5 w-5',
      translate: 'translate-x-5',
    },
    large: {
      switch: 'w-14 h-7',
      toggle: 'h-6 w-6',
      translate: 'translate-x-7',
    },
  };

  const currentSize = sizes[size];

  return (
    <label className={`inline-flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only"
        />
        <div className={`${currentSize.switch} bg-gray-200 rounded-full transition-colors duration-200 ${checked ? 'bg-blue-600' : ''}`}></div>
        <div className={`absolute top-0.5 left-0.5 ${currentSize.toggle} bg-white rounded-full transition-transform duration-200 ${checked ? currentSize.translate : ''}`}></div>
      </div>
      {label && <span className="text-gray-700">{label}</span>}
    </label>
  );
};

export default Switch;