import React, { useState, useMemo } from "react";
import {
  CalendarDaysIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PencilSquareIcon,
  EyeIcon,
  CheckCircleIcon,
  SparklesIcon,
  BuildingOfficeIcon,
  XMarkIcon,
  CalendarIcon,
  PrinterIcon
} from "@heroicons/react/24/outline";

const HolidayMaster = ({ records = [], onAdd, onUpdate, onDelete, onExport }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [activeView, setActiveView] = useState("list"); // 'list' | 'calendar' | 'reports'
  const [selectedItems, setSelectedItems] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingRecord, setDeletingRecord] = useState(null);

  const initialForm = {
    holidayName: "",
    holidayDate: new Date().toISOString().split("T")[0],
    holidayType: "Public",
    branch: "All Branches",
    location: "All Locations",
    company: "All Companies",
    employee_applicability: "",
    is_working_day: 0,
    description: "",
    status: "Active"
  };
  const [formData, setFormData] = useState(initialForm);

  const defaultHolidays = useMemo(() => {
    if (Array.isArray(records) && records.length > 0) return records;
    return [
      { id: "1", holidayName: "New Year's Day", holidayDate: "2026-01-01", holidayType: "Public", branch: "All Branches", description: "Global New Year Celebration", status: "Active" },
      { id: "2", holidayName: "Republic Day", holidayDate: "2026-01-26", holidayType: "National", branch: "All Branches", description: "Indian Republic Day National Holiday", status: "Active" },
      { id: "3", holidayName: "Holi", holidayDate: "2026-03-04", holidayType: "Public", branch: "All Branches", description: "Festival of Colors", status: "Active" },
      { id: "4", holidayName: "Independence Day", holidayDate: "2026-08-15", holidayType: "National", branch: "All Branches", description: "Indian Independence Day National Holiday", status: "Active" },
      { id: "5", holidayName: "Diwali", holidayDate: "2026-11-08", holidayType: "Company Mandatory", branch: "HQ - Mumbai", description: "Deepavali Festival Holiday", status: "Active" },
      { id: "6", holidayName: "Christmas", holidayDate: "2026-12-25", holidayType: "Public", branch: "All Branches", description: "Christmas Holiday", status: "Active" },
    ];
  }, [records]);

  const filteredRecords = useMemo(() => {
    return defaultHolidays.filter(item => {
      const matchSearch =
        (item.holidayName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = typeFilter === "ALL" || item.holidayType === typeFilter;
      const matchBranch = branchFilter === "ALL" || item.branch === branchFilter;
      return matchSearch && matchType && matchBranch;
    });
  }, [defaultHolidays, searchTerm, typeFilter, branchFilter]);

  const stats = useMemo(() => {
    const total = defaultHolidays.length;
    const national = defaultHolidays.filter(h => h.holidayType === "National").length;
    const publicHolidays = defaultHolidays.filter(h => h.holidayType === "Public").length;
    const upcoming = defaultHolidays.filter(h => new Date(h.holidayDate) >= new Date()).length;
    return { total, national, publicHolidays, upcoming };
  }, [defaultHolidays]);

  const handleOpenAdd = () => {
    setEditingRecord(null);
    setFormData(initialForm);
    setShowAddModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingRecord(item);
    setFormData({ ...item });
    setShowAddModal(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (editingRecord) {
      if (onUpdate) onUpdate(editingRecord.id, formData);
    } else {
      if (onAdd) onAdd(formData);
    }
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 text-white p-6 sm:p-8 shadow-2xl border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
              <CalendarDaysIcon className="h-10 w-10 text-emerald-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 rounded-full text-[10px] font-mono font-bold uppercase">
                  Operations Master
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 rounded-full text-[10px] font-bold">
                  ● Holiday Calendar
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Holiday Master</h2>
              <p className="text-xs sm:text-sm text-emerald-100/80 font-medium max-w-xl mt-1">
                Configure official company holidays, branch-wise holiday lists, restricted holidays, and calendar schedules.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl text-xs font-bold shadow-lg transition transform active:scale-95 cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" /> Add Holiday
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Holidays</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CalendarDaysIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">National Holidays</span>
            <p className="text-2xl font-black text-blue-600 mt-1">{stats.national}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <CheckCircleIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Public Holidays</span>
            <p className="text-2xl font-black text-teal-600 mt-1">{stats.publicHolidays}</p>
          </div>
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <SparklesIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upcoming Holidays</span>
            <p className="text-2xl font-black text-purple-600 mt-1">{stats.upcoming}</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <CalendarIcon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveView("list")}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition ${
            activeView === "list"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Holiday List View
        </button>
        <button
          onClick={() => setActiveView("calendar")}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition ${
            activeView === "calendar"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Annual Calendar Grid
        </button>
      </div>

      {activeView === "list" && (
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden space-y-4 p-5">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search holiday name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                <option value="ALL">All Holiday Types</option>
                <option value="Public">Public</option>
                <option value="National">National</option>
                <option value="Restricted">Restricted</option>
                <option value="Company Mandatory">Company Mandatory</option>
              </select>

              <button
                onClick={() => onExport && onExport("excel")}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition"
              >
                <ArrowDownTrayIcon className="w-4 h-4" /> Export
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Holiday Date</th>
                  <th className="p-4">Holiday Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Applicable Branch</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredRecords.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-mono font-bold text-slate-900">{item.holidayDate}</td>
                    <td className="p-4 font-bold text-slate-900">{item.holidayName}</td>
                    <td className="p-4 flex flex-wrap gap-1 items-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        item.holidayType === "National" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {item.holidayType}
                      </span>
                      {!!item.is_working_day && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[9px] font-bold">
                          Working Event
                        </span>
                      )}
                    </td>
                    <td className="p-4">{item.branch}</td>
                    <td className="p-4 text-slate-500 max-w-xs truncate">{item.description}</td>
                    <td className="p-4 font-bold text-emerald-600">{item.status}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingRecord(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeView === "calendar" && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CalendarDaysIcon className="w-5 h-5 text-emerald-600" /> 2026 Company Holiday Calendar
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {defaultHolidays.map((item) => (
              <div key={item.id} className="p-4 bg-emerald-50/50 border border-emerald-200/60 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-emerald-700">{item.holidayDate}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-200/80 text-emerald-900 rounded-full">
                    {item.holidayType}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">{item.holidayName}</h4>
                <p className="text-xs text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingRecord ? "Edit Holiday" : "Add New Holiday"}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Holiday Name</label>
                <input
                  type="text"
                  required
                  value={formData.holidayName}
                  onChange={(e) => setFormData({ ...formData, holidayName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Holiday Date</label>
                <input
                  type="date"
                  required
                  value={formData.holidayDate}
                  onChange={(e) => setFormData({ ...formData, holidayDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Holiday Type</label>
                <select
                  value={formData.holidayType}
                  onChange={(e) => setFormData({ ...formData, holidayType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  <option value="Public">Public</option>
                  <option value="National">National</option>
                  <option value="Restricted">Restricted</option>
                  <option value="Company Mandatory">Company Mandatory</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Branch</label>
                <input
                  type="text"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Company</label>
                  <input
                    type="text"
                    value={formData.company || ""}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location || ""}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Employee Applicability</label>
                <input
                  type="text"
                  placeholder="e.g. All, Alphanumeric codes, or department"
                  value={formData.employee_applicability || ""}
                  onChange={(e) => setFormData({ ...formData, employee_applicability: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="is_working_day_chk"
                  checked={!!formData.is_working_day}
                  onChange={(e) => setFormData({ ...formData, is_working_day: e.target.checked ? 1 : 0 })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="is_working_day_chk" className="text-xs font-bold text-slate-700 select-none cursor-pointer">
                  Is Working Day? (Important Event / Working Day)
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Save Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HolidayMaster;
