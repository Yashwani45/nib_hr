import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium', // small, medium, large, xl, 2xl, 3xl, fullscreen
  showCloseButton = true,
  closeOnOverlayClick = true,
  footer = null,
  className = '',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    small: 'max-w-md',
    medium: 'max-w-lg',
    large: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
    '3xl': 'max-w-6xl',
    fullscreen: 'max-w-full mx-4',
  };

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4 backdrop-blur-xs"
      onClick={handleOverlayClick}
    >
      <div className={`${sizes[size] || sizes.medium} w-full bg-white rounded-2xl shadow-2xl transform transition-all border border-slate-200/80 ${className}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{title}</h3>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-xl transition cursor-pointer"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="p-6 overflow-y-auto max-h-[82vh]">{children}</div>
        {footer && <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
