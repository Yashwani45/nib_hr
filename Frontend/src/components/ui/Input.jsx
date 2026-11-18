import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  size = 'medium', // small, medium, large
  fullWidth = true,
  icon = null,
  iconPosition = 'left',
  helperText,
  className = '',
  inputClassName = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === 'password' ? (showPassword ? 'text' : 'password') : type;

  const sizes = {
    small: 'px-2.5 py-1.5 text-xs',
    medium: 'px-3.5 py-2 text-xs font-medium',
    large: 'px-4 py-2.5 text-sm font-medium',
  };

  const baseStyles = 'block bg-white text-slate-900 placeholder:text-slate-400 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150 disabled:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs';
  const errorStyles = error ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-200/90 hover:border-slate-300';
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <div className={`${widthClass} ${className} space-y-1`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700">
          {label}
          {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
        </label>
      )}
      <div className={`${widthClass} relative`}>
        {icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`
            ${baseStyles}
            ${errorStyles}
            ${sizes[size] || sizes.medium}
            ${icon && iconPosition === 'left' ? 'pl-9' : ''}
            ${type === 'password' || (icon && iconPosition === 'right') ? 'pr-9' : ''}
            ${widthClass}
            ${inputClassName}
          `}
          {...props}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          </button>
        )}
        {type !== 'password' && icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
      </div>
      {error && <p className="text-[11px] font-medium text-rose-500 mt-0.5">{error}</p>}
      {helperText && !error && <p className="text-[11px] font-medium text-slate-400 mt-0.5">{helperText}</p>}
    </div>
  );
};

export default Input;
