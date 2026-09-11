import React from "react";

const Inventory = ({ records, onOpenEdit, onDelete }) => {
  return (
    <div className="space-y-3 font-sans">
      {records.map((item) => {
        const categoryColors = {
          Laptop: "bg-blue-50 text-blue-600 border-blue-100",
          Mobile: "bg-purple-50 text-purple-600 border-purple-100",
          "SIM Card": "bg-amber-50 text-amber-600 border-amber-100",
          "Access Card": "bg-emerald-50 text-emerald-600 border-emerald-100",
          "Software License": "bg-indigo-50 text-indigo-600 border-indigo-100"
        };
        const catClass = categoryColors[item.category] || "bg-slate-50 text-slate-600 border-slate-100";

        const displayName = item.brand || item.model
          ? `${item.brand || ''} ${item.model || ''}`.trim()
          : item.assetCode || "Unnamed Asset";

        return (
          <div 
            key={item.id} 
            className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md hover:border-slate-200/80 transition-all duration-200"
          >
            {/* Left: Icon & Asset Info */}
            <div className="flex items-center gap-3 min-w-[200px]">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 border ${catClass}`}>
                {String(item.category || 'A').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  {displayName}
                </h4>
                <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5 mt-0.5">
                  <span>{item.category || "General"}</span>
                  <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                  <span>Code: {item.assetCode || "N/A"}</span>
                </p>
              </div>
            </div>

            {/* Middle: Allocated Employee Details */}
            <div className="min-w-[150px]">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Allocated To</span>
              {item.employee ? (
                <>
                  <h5 className="font-extrabold text-slate-700 text-xs mt-0.5">
                    {item.employee}
                  </h5>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    ID: {item.empId || "N/A"} • {item.department || "General"}
                  </p>
                </>
              ) : (
                <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-100 inline-block mt-0.5">
                  Available (Unallocated)
                </span>
              )}
            </div>

            {/* Middle: Hardware Serial Number */}
            <div className="min-w-[140px]">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Hardware S/N</span>
              <p className="text-xs text-slate-600 font-bold mt-0.5">
                {item.serialNo || item.serialNumber || "N/A"}
              </p>
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-2 min-w-[100px]">
              <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] border ${
                item.status === "Available" 
                  ? "bg-green-50 text-green-700 border-green-200" 
                  : item.status === "Assigned"
                  ? "bg-blue-50 text-blue-700 border-blue-200" 
                  : item.status === "Under Repair"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}>
                {item.status || "Available"}
              </span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                onClick={() => onOpenEdit && onOpenEdit(item)}
                className="p-1.5 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition"
                title="Edit Record"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </button>
              <button
                onClick={() => onDelete && onDelete(item.id)}
                className="p-1.5 rounded-lg border border-slate-100 hover:border-red-200 hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
                title="Delete Record"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}

      {records.length === 0 && (
        <div className="text-center py-10 text-gray-400 border border-dashed rounded-xl bg-gray-50/50">
          No inventory items found. Add a record to start.
        </div>
      )}
    </div>
  );
};

export default Inventory;
