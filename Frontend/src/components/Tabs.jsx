import { useState } from "react";

const Tabs = ({ tabs = [] }) => {
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex flex-wrap gap-3">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg font-medium transition ${
              activeTab === tab
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-blue-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-5 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-bold text-gray-800">{activeTab}</h2>
        <p className="text-gray-600 mt-2">
          This is the {activeTab} section.
        </p>
      </div>
    </div>
  );
};

export default Tabs;