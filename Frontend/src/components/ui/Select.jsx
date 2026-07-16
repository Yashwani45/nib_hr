import React, { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const Select = ({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  error,
  required = false,
  disabled = false,
  size = 'medium', // small, medium, large
  fullWidth = true,
  helperText,
  className = '',
  selectClassName = '',
  multiple = false,
  searchable = false,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef(null);

  const sizes = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  };

  const baseStyles = 'block bg-white text-gray-900 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed';
  const errorStyles = error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300';
  const widthClass = fullWidth ? 'w-full' : '';
  const selectedValues = Array.isArray(value) ? value : [];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    if (multiple) {
      const newValue = selectedValues.includes(option.value)
        ? selectedValues.filter(v => v !== option.value)
        : [...selectedValues, option.value];
      onChange({ target: { value: newValue } });
    } else {
      onChange({ target: { value: option.value } });
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const getDisplayValue = () => {
    if (multiple) {
      const selected = options.filter(opt => selectedValues.includes(opt.value));
      return selected.length > 0 ? selected.map(s => s.label).join(', ') : placeholder;
    }
    const selected = options.find(opt => opt.value === value);
    return selected ? selected.label : placeholder;
  };

  if (multiple || searchable) {
    return (
      <div className={`${widthClass} ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className={`${widthClass} relative`} ref={selectRef}>
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={`${baseStyles} ${errorStyles} ${sizes[size]} ${widthClass} cursor-pointer pr-10 text-left ${selectClassName}`}
          >
            <span className={multiple ? selectedValues.length ? '' : 'text-gray-400' : value ? '' : 'text-gray-400'}>
              {getDisplayValue()}
            </span>
          </button>
          <ChevronDownIcon className={`pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          
          {isOpen && (
            <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-300 bg-white text-gray-900 shadow-lg">
              {searchable && (
                <input
                  type="text"
                  className="w-full border-b border-gray-200 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              )}
              {filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option)}
                  className={`cursor-pointer px-3 py-2 transition-colors hover:bg-blue-50 ${multiple && selectedValues.includes(option.value) ? 'bg-blue-50 text-blue-600' : ''}`}
                >
                  {multiple && (
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(option.value)}
                      onChange={() => {}}
                      className="mr-2"
                    />
                  )}
                  {option.label}
                </div>
              ))}
              {filteredOptions.length === 0 && (
                <div className="px-3 py-2 text-gray-500">No options found</div>
              )}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
      </div>
    );
  }

  return (
    <div className={`${widthClass} ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className={`${widthClass} relative`}>
        <select
          value={value ?? ''}
          onChange={onChange}
          disabled={disabled}
          className={`${baseStyles} ${errorStyles} ${sizes[size]} ${widthClass} cursor-pointer pr-10 ${value ? 'text-gray-900' : 'text-gray-400'} ${selectClassName}`}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
    </div>
  );
};

export default Select;
