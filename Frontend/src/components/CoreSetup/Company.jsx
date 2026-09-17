import React from "react";
import {
  BuildingOffice2Icon,
  PencilSquareIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  IdentificationIcon,
  DocumentCheckIcon,
  CalendarDaysIcon,
  CurrencyRupeeIcon,
  ShieldCheckIcon,
  CheckBadgeIcon
} from "@heroicons/react/24/outline";

const Company = ({ records = [], onOpenEdit, openCreateTrigger }) => {
  const [selectedId, setSelectedId] = React.useState(null);

  // Identify the primary active company
  const selectedCode = localStorage.getItem("selected_company_code") || "";
  const comp = (selectedId ? records.find(c => String(c.id) === String(selectedId)) : null) ||
    (records || []).find(c => 
      (c.companyCode && c.companyCode.toLowerCase() === selectedCode.toLowerCase()) || 
      (c.company_code && c.company_code.toLowerCase() === selectedCode.toLowerCase())
    ) || (records || []).find(c => c.phone || c.panNumber || c.cinNumber || c.gstNumber || c.gst_number) || (records || [])[0];

  if (!comp) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-sm">
        <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
          <BuildingOffice2Icon className="h-8 w-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No Company Profile Configured</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto mb-4">
          No active company entity record was found in the database. Please initialize your organization profile.
        </p>
        {openCreateTrigger && (
          <button
            onClick={openCreateTrigger}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
          >
            + Add Company Profile
          </button>
        )}
      </div>
    );
  }

  // Generate initials for company avatar
  const initials = (comp.companyName || comp.company_name || "HR")
    .split(" ")
    .slice(0, 3)
    .map(w => w[0])
    .join("")
    .toUpperCase();

  const handleEditClick = () => {
    if (onOpenEdit) {
      onOpenEdit(comp);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner / Primary Profile Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-blue-50/60 via-indigo-50/30 to-transparent pointer-events-none rounded-bl-full" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          {/* Left: Avatar & Identity */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-xl flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0 border-2 border-white">
              {initials}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {comp.companyName || comp.company_name || "Aarogya Homeopathy Clinic"}
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckBadgeIcon className="h-3.5 w-3.5" />
                  {comp.status || "Active"}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {comp.type || "Registered Entity"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold text-[11px]">
                  Code: {comp.companyCode || comp.company_code || "ARGY001"}
                </span>
                {comp.shortName && (
                  <span>Short Name: <strong className="text-slate-700">{comp.shortName}</strong></span>
                )}
                <span>•</span>
                <span>Financial Year: <strong className="text-slate-700">{comp.financialYear || "2026-27"}</strong></span>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={handleEditClick}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <PencilSquareIcon className="h-4 w-4" />
              <span>Edit Details</span>
            </button>
            {openCreateTrigger && (
              <button
                onClick={openCreateTrigger}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <span>+ Add Company</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Entity Switcher if multiple companies exist */}
      {records.length > 1 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700">Registered Entities ({records.length}):</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {records.map((r, idx) => {
                const isActive = (r.id && comp.id && String(r.id) === String(comp.id)) ||
                                 (r.companyCode && comp.companyCode && r.companyCode.toLowerCase() === comp.companyCode.toLowerCase());
                return (
                  <button
                    key={r.id || idx}
                    onClick={() => setSelectedId(r.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    <span>{r.companyName || r.company_name || `Company #${idx + 1}`}</span>
                    <span className="text-[10px] opacity-80 font-mono">({r.companyCode || r.company_code || "Code"})</span>
                  </button>
                );
              })}
            </div>
          </div>
          {openCreateTrigger && (
            <button
              onClick={openCreateTrigger}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>+ Add Another Entity</span>
            </button>
          )}
        </div>
      )}

      {/* 2. Structured Information Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Legal & Statutory Registrations */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <IdentificationIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Statutory & Legal Identifiers</h3>
              <p className="text-[11px] text-slate-400">Government registrations and compliance numbers</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company Type</span>
              <p className="font-bold text-slate-800">{comp.type || "Proprietorship"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registration Number</span>
              <p className="font-bold text-slate-800 font-mono">{comp.regNumber || comp.reg_number || "--"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CIN (Corporate ID)</span>
              <p className="font-bold text-slate-800 font-mono">{comp.cinNumber || comp.cin_number || "--"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PAN Number</span>
              <p className="font-bold text-slate-800 font-mono">{comp.panNumber || comp.pan_number || "--"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TAN Number</span>
              <p className="font-bold text-slate-800 font-mono">{comp.tanNumber || comp.tan_number || "--"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">GSTIN / Tax ID</span>
              <p className="font-bold text-blue-600 font-mono">{comp.gstNumber || comp.gst_number || "--"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PF Registry Code</span>
              <p className="font-bold text-slate-800 font-mono">{comp.pfNumber || comp.pf_number || "--"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ESI Code</span>
              <p className="font-bold text-slate-800 font-mono">{comp.esiNumber || comp.esi_number || "--"}</p>
            </div>
          </div>
        </div>

        {/* Card 2: Registered Headquarters Address */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <MapPinIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Registered Office Address</h3>
              <p className="text-[11px] text-slate-400">Official legal communication headquarters</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
              <p className="font-bold text-slate-800">
                {comp.address1 || "Headquarters Building"}
                {comp.address2 ? `, ${comp.address2}` : ""}
              </p>
              <p className="text-slate-600 font-medium">
                {[comp.city, comp.district, comp.state, comp.pincode].filter(Boolean).join(", ")}
              </p>
              <p className="text-slate-500 font-semibold">{comp.country || "India"}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">City / District</span>
                <p className="font-bold text-slate-800">{comp.city || comp.district || "--"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">State & Pincode</span>
                <p className="font-bold text-slate-800">{comp.state || "--"} {comp.pincode ? `(${comp.pincode})` : ""}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Contact & Communication */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <EnvelopeIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Contact & Official Web</h3>
              <p className="text-[11px] text-slate-400">Corporate communication channels</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 font-medium flex items-center gap-2">
                <EnvelopeIcon className="h-4 w-4 text-slate-400" />
                Official Email:
              </span>
              <a 
                href={`mailto:${comp.email || "contact@company.com"}`} 
                className="font-bold text-blue-600 hover:underline"
              >
                {comp.email || "--"}
              </a>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 font-medium flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 text-slate-400" />
                Office Phone:
              </span>
              <a 
                href={`tel:${comp.phone || ""}`} 
                className="font-bold text-slate-800 hover:text-blue-600"
              >
                {comp.phone || "--"}
              </a>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 font-medium flex items-center gap-2">
                <GlobeAltIcon className="h-4 w-4 text-slate-400" />
                Website URL:
              </span>
              {comp.website ? (
                <a 
                  href={comp.website.startsWith("http") ? comp.website : `https://${comp.website}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="font-bold text-blue-600 hover:underline truncate max-w-[200px]"
                >
                  {comp.website}
                </a>
              ) : (
                <span className="font-bold text-slate-400">--</span>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Operational & Fiscal Parameters */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <CalendarDaysIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Fiscal & Localization Settings</h3>
              <p className="text-[11px] text-slate-400">Financial period and currency preferences</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Financial Year Cycle</span>
              <p className="font-bold text-slate-800">{comp.financialYear || "2026-27"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Primary Currency</span>
              <p className="font-bold text-slate-800">{comp.currency || "INR (₹)"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Standard Time Zone</span>
              <p className="font-bold text-slate-800">{comp.timezone || "Asia/Kolkata (IST)"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Compliance Status</span>
              <p className="font-bold text-emerald-600 flex items-center gap-1">
                <ShieldCheckIcon className="h-4 w-4" />
                Verified & Compliant
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Footer Note */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <DocumentCheckIcon className="h-4 w-4 text-slate-400" />
          <span>This legal profile governs statutory tax invoices, payroll deductions, and compliance certificates for this HRMS instance.</span>
        </div>
        <button
          onClick={handleEditClick}
          className="text-blue-600 font-bold hover:underline shrink-0 flex items-center gap-1 cursor-pointer"
        >
          <span>Update Organization Info</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};

export default Company;
