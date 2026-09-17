import React from "react";
import {
  BuildingOffice2Icon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  PencilSquareIcon,
  TrashIcon,
  UserIcon,
  CalendarDaysIcon
} from "@heroicons/react/24/outline";

const Branch = ({ records = [], onOpenEdit, onDelete, openCreateTrigger }) => {
  if (!records || records.length === 0) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-sm">
        <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
          <BuildingOffice2Icon className="h-8 w-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No Branch Records Found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto mb-6">
          No active branches are currently configured in this organization's database table.
        </p>
        {openCreateTrigger && (
          <button
            onClick={openCreateTrigger}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
          >
            <span>+ Add New Branch</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {records.map(br => {
        const branchName = br.branchName || br.branch_name || "Branch";
        const branchCode = br.branchCode || br.branch_code || br.id?.slice(0, 8);
        const branchType = br.branchType || br.branch_type || "Branch";
        const status = br.status || "Active";
        const manager = br.manager || "Not Assigned";
        const workingDays = br.workingDays || br.working_days || "Mon - Fri";
        const email = br.email || "N/A";
        const phone = br.phone || "N/A";
        const address = br.address || "";
        const city = br.city || "";
        const state = br.state || "";
        const pincode = br.pincode || "";

        return (
          <div 
            key={br.id} 
            className="border border-slate-200/80 rounded-2xl p-5 bg-white shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between"
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex justify-between items-start gap-3 border-b border-slate-100 pb-3.5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-100">
                    <BuildingOffice2Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 tracking-tight leading-snug">
                      {branchName}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-semibold">
                        Code: {branchCode}
                      </span>
                      <span className="text-[10px] text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded font-bold">
                        {branchType}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                    status === "Active" 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}>
                    {status}
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50/70 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <UserIcon className="w-3 h-3" />
                    Manager
                  </span>
                  <p className="font-bold text-slate-800 text-xs mt-1 truncate">
                    {manager}
                  </p>
                </div>

                <div className="p-2.5 bg-slate-50/70 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <CalendarDaysIcon className="w-3 h-3" />
                    Working Days
                  </span>
                  <p className="font-bold text-slate-800 text-xs mt-1 truncate">
                    {workingDays}
                  </p>
                </div>

                <div className="col-span-2 p-2.5 bg-slate-50/70 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Contact Information
                  </span>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-1">
                      <EnvelopeIcon className="w-3.5 h-3.5 text-slate-400" />
                      {email}
                    </span>
                    <span className="flex items-center gap-1">
                      <PhoneIcon className="w-3.5 h-3.5 text-slate-400" />
                      {phone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="text-xs pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                  <MapPinIcon className="w-3 h-3" />
                  Address
                </span>
                <p className="text-xs text-slate-600 font-medium">
                  {address ? `${address}, ` : ""}{city ? `${city}, ` : ""}{state}{pincode ? ` - ${pincode}` : ""}
                  {!address && !city && !state && "No address specified"}
                </p>
              </div>
            </div>

            {/* Actions */}
            {(onOpenEdit || onDelete) && (
              <div className="border-t border-slate-100 pt-3 mt-4 flex justify-end items-center gap-2">
                {onOpenEdit && (
                  <button
                    onClick={() => onOpenEdit(br)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 text-xs font-bold transition cursor-pointer"
                  >
                    <PencilSquareIcon className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(br.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-100 text-rose-600 hover:bg-rose-50 text-xs font-bold transition cursor-pointer"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Branch;
