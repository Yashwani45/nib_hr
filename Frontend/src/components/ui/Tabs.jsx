import React, { useState } from 'react';

const Tabs = ({
  tabs = [],
  activeTab,
  onChange,
  variant = 'underline', // underline, pills, buttons
  className = '',
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(activeTab || tabs[0]?.key);

  const handleTabClick = (tabKey) => {
    setInternalActiveTab(tabKey);
    if (onChange) onChange(tabKey);
  };

  const currentActiveTab = activeTab !== undefined ? activeTab : internalActiveTab;

  const variants = {
    underline: {
      container: 'border-b border-gray-200',
      tab: (isActive) => `
        px-4 py-2 text-sm font-medium transition-all duration-200
        ${isActive 
          ? 'text-blue-600 border-b-2 border-blue-600 -mb-px' 
          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}
      `,
    },
    pills: {
      container: 'flex gap-2',
      tab: (isActive) => `
        px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
        ${isActive 
          ? 'bg-blue-600 text-white' 
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}
      `,
    },
    buttons: {
      container: 'flex gap-2 bg-gray-100 p-1 rounded-lg',
      tab: (isActive) => `
        px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
        ${isActive 
          ? 'bg-white text-gray-900 shadow-sm' 
          : 'text-gray-500 hover:text-gray-700'}
      `,
    },
  };

  const currentVariant = variants[variant];

  return (
    <div className={className}>
      <div className={currentVariant.container}>
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={currentVariant.tab(currentActiveTab === tab.key)}
              disabled={tab.disabled}
            >
              {tab.icon && <span className="mr-2 inline-block">{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4">
        {tabs.find(tab => tab.key === currentActiveTab)?.content}
      </div>
    </div>
  );
};

export default Tabs;