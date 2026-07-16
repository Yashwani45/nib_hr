import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const Dropdown = ({
  trigger,
  items = [],
  placement = 'bottom', // top, bottom, left, right
  className = '',
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const placements = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  const handleItemClick = (item) => {
    if (item.onClick) {
      item.onClick();
    }
    if (onSelect) {
      onSelect(item);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      
      {isOpen && (
        <div className={`absolute z-10 ${placements[placement]} min-w-[160px] bg-white rounded-lg shadow-lg border border-gray-200 py-1 ${className}`}>
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              className={`
                w-full text-left px-4 py-2 text-sm transition-colors
                ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
                ${item.danger ? 'text-red-600' : 'text-gray-700'}
              `}
            >
              {item.icon && <span className="mr-2 inline-block">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;