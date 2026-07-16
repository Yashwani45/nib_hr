import React, { useState } from 'react';

const Tooltip = ({
  children,
  content,
  placement = 'top', // top, bottom, left, right
  delay = 300,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  let timeoutId;

  const placements = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  const handleMouseEnter = () => {
    timeoutId = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutId);
    setIsVisible(false);
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-50 ${placements[placement]} ${className}`}>
          <div className="bg-gray-900 text-white text-sm rounded px-2 py-1 whitespace-nowrap">
            {content}
            <div className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
              placement === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1' :
              placement === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1' :
              placement === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1' :
              'right-full top-1/2 -translate-y-1/2 -mr-1'
            }`}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;