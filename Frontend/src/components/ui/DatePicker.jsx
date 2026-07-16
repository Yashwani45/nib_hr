import React, { useState, useRef, useEffect } from 'react';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const DatePicker = ({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  error,
  required = false,
  disabled = false,
  minDate,
  maxDate,
  format = 'YYYY-MM-DD',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const isDateDisabled = (date) => {
    if (minDate && date < new Date(minDate)) return true;
    if (maxDate && date > new Date(maxDate)) return true;
    return false;
  };

  const handleDateSelect = (date) => {
    if (!isDateDisabled(date)) {
      const formattedDate = date.toISOString().split('T')[0];
      onChange({ target: { value: formattedDate } });
      setIsOpen(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (format === 'DD/MM/YYYY') {
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    }
    return dateString;
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const days = getDaysInMonth(currentMonth);

  return (
    <div className="relative" ref={pickerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div
        className={`relative border rounded-lg ${error ? 'border-red-500' : 'border-gray-300'} ${disabled ? 'bg-gray-100' : 'bg-white'} cursor-pointer`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <input
          type="text"
          value={formatDate(value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-4 py-2 pr-10 focus:outline-none bg-transparent cursor-pointer"
          readOnly
        />
        <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      
      {isOpen && (
        <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <span className="font-semibold">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => (
              <button
                key={index}
                onClick={() => date && handleDateSelect(date)}
                disabled={!date || isDateDisabled(date)}
                className={`
                  text-center py-1 rounded text-sm transition-colors
                  ${!date ? 'invisible' : ''}
                  ${date && value && date.toISOString().split('T')[0] === value ? 'bg-blue-600 text-white' : ''}
                  ${date && !isDateDisabled(date) ? 'hover:bg-blue-50 cursor-pointer' : 'opacity-50 cursor-not-allowed'}
                `}
              >
                {date?.getDate()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;