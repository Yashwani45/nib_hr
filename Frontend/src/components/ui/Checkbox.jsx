import React from 'react';

const Checkbox = ({
  label,
  checked,
  onChange,
  disabled = false,
  indeterminate = false,
  size = 'medium', // small, medium, large
  error,
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

  const checkboxRef = React.useRef(null);

  React.useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <label className={`inline-flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <input
        ref={checkboxRef}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={`${sizes[size]} rounded border-gray-300 text-blue-600 focus:ring-blue-500`}
      />
      {label && <span className={`${labelSizes[size]} text-gray-700 ${error ? 'text-red-600' : ''}`}>{label}</span>}
    </label>
  );
};

export default Checkbox;