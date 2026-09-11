import React, { useState, useMemo } from "react";
import {
  BriefcaseIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TrashIcon,
  PencilSquareIcon,
  EyeIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";
import { createTableRecord, updateTableRecord, deleteTableRecord } from "../../services/hrApi";

const BusinessUnit = ({ records = [], dbData = {}, onRefreshData }) => {
  const employeesList = useMemo(() => dbData["Employee Profile"] || dbData["employee_profile"] || dbData["employees"] || [], [dbData]);

  // Sync state with records from backend
  const dataList = useMemo(() => {
    return records.map((r) => ({
      id: r.id,
      buCode: r.buCode || r.bu_code || "",
      buName: r.buName || r.bu_name || "",
      description: r.description || "",
      head: r.head || "",
      status: r.status || "Active"
    }));
  }, [records]);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [statusConfirmRecord, setStatusConfirmRecord] = useState(null);

  // Form State
  const initialForm = {
    buCode: "",
    buName: "",
    description: "",
    head: "",
    status: "Active"
  };
  const [formData, setFormData] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});

  // Filtered List
  const filteredRecords = useMemo(() => {
    return dataList.filter(item => {
      const matchSearch =
        (item.buName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.buCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = filterStatus === "ALL" || item.status === filterStatus;

      return matchSearch && matchStatus;
    });
  }, [dataList, searchTerm, filterStatus]);

  // Pagination Logic
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = dataList.length;
    const active = dataList.filter(d => d.status === "Active").length;
    return { total, active };
  }, [dataList]);

  // Open Handlers
  const handleOpenAdd = () => {
    setEditingRecord(null);
    setFormErrors({});
    setFormData({
      ...initialForm,
      buCode: `BU${Math.floor(100 + Math.random() * 900)}`
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingRecord(item);
    setFormErrors({});
    setFormData({
      buCode: item.buCode,
      buName: item.buName,
      description: item.description,
      head: item.head,
      status: item.status
    });
    setShowAddModal(true);
  };

  // Form Submissions
  const validateForm = () => {
    const errors = {};
    if (!formData.buCode || !formData.buCode.trim()) {
      errors.buCode = "Business Unit Code is required.";
    } else {
      // Unique check
      const duplicate = dataList.find(d => 
        d.buCode.toLowerCase().trim() === formData.buCode.toLowerCase().trim() &&
        (!editingRecord || d.id !== editingRecord.id)
      );
      if (duplicate) errors.buCode = "Business Unit Code must be unique.";
    }

    if (!formData.buName || !formData.buName.trim()) {
      errors.buName = "Business Unit Name is required.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      buCode: formData.buCode,
      buName: formData.buName,
      description: formData.description,
      head: formData.head,
      status: formData.status
    };

    try {
      if (editingRecord) {
        await updateTableRecord("business_unit", editingRecord.id, payload);
      } else {
        await createTableRecord("business_unit", payload);
      }
      setShowAddModal(false);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setFormErrors({ submit: err.message || "Failed to save business unit." });
    }
  };

  const handleToggleStatusConfirm = async () => {
    if (!statusConfirmRecord) return;
    const newStatus = statusConfirmRecord.status === "Active" ? "Inactive" : "Active";
    
    try {
      await updateTableRecord("business_unit", statusConfirmRecord.id, {
        ...statusConfirmRecord,
        status: newStatus
      });
      setStatusConfirmRecord(null);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Error toggling status: " + err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRecord) return;
    try {
      await deleteTableRecord("business_unit", deletingRecord.id);
      setDeletingRecord(null);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Error deleting record: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs gap-4 font-sans">
        <div>
          <span className="text-[10px] text-indigo-600 block font-bold uppercase tracking-wider">Organization Setup &gt; Business Unit</span>
          <h2 className="text-lg font-black text-slate-900 mt-1">Business Unit</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Manage business divisions and organizational business units.</p>
        </div>
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <button 
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Business Unit</span>
          </button>
        </div>
      </div>

      {/* 2. Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Business Units</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <BriefcaseIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Active Business Divisions</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{stats.active}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircleIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Search & Filter console */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <FunnelIcon className="h-4 w-4 text-slate-400" />
          Filter Configuration
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Search Box */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Search Business Unit</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
              </span>
              <input 
                type="text"
                placeholder="Search by code, name, description..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Table view */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex border-b pb-4 items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
            🏢 Business Unit List Table
          </h3>
          <span className="text-[11px] font-bold text-slate-400">Total matched: {filteredRecords.length} records</span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-150 text-left">
            <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4 w-12 text-center">S.No</th>
                <th scope="col" className="px-6 py-4">Business Unit Code</th>
                <th scope="col" className="px-6 py-4">Business Unit Name</th>
                <th scope="col" className="px-6 py-4">Head</th>
                <th scope="col" className="px-6 py-4">Description</th>
                <th scope="col" className="px-6 py-4 text-center">Status</th>
                <th scope="col" className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700 bg-white">
              {paginatedRecords.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50/40 transition">
                  <td className="px-6 py-4 text-center font-mono font-bold text-slate-400">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-500">{item.buCode}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{item.buName}</td>
                  <td className="px-6 py-4 text-slate-650">{item.head || "--"}</td>
                  <td className="px-6 py-4 text-slate-400 font-medium line-clamp-1">{item.description || "No description."}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setStatusConfirmRecord(item)}
                      className={`px-2.5 py-1 rounded-full text-[9px] font-black border uppercase tracking-wider transition ${
                        item.status === "Active"
                          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          : "bg-slate-100 text-slate-650 border-slate-300 hover:bg-slate-200"
                      }`}
                    >
                      {item.status}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setViewingRecord(item)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition"
                        title="Edit Business Unit"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeletingRecord(item)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="Delete Business Unit"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                    No business units matched the search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        {filteredRecords.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white py-3 gap-4 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-semibold">
              Showing <strong className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</strong> to{" "}
              <strong className="text-slate-800">
                {Math.min(currentPage * itemsPerPage, filteredRecords.length)}
              </strong>{" "}
              of <strong className="text-slate-800">{filteredRecords.length}</strong> entries
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-650 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-black border transition ${
                    currentPage === idx + 1
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "border-slate-200 text-slate-650 hover:bg-slate-50"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-650 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Add / Edit Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingRecord ? "Edit Business Unit" : "Add New Business Unit"}
                </h3>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5 tracking-wider">Configure division parameters</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {formErrors.submit && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs p-3.5 rounded-xl font-bold">
                ⚠️ {formErrors.submit}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Code */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Business Unit Code <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.buCode}
                    onChange={(e) => setFormData({ ...formData, buCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                  {formErrors.buCode && <p className="text-[10px] text-rose-500 mt-1 font-bold">{formErrors.buCode}</p>}
                </div>
                {/* Name */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Business Unit Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Development"
                    value={formData.buName}
                    onChange={(e) => setFormData({ ...formData, buName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                  {formErrors.buName && <p className="text-[10px] text-rose-500 mt-1 font-bold">{formErrors.buName}</p>}
                </div>
              </div>

              {/* Head of BU */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Head of Business Unit</label>
                <select
                  value={formData.head}
                  onChange={(e) => setFormData({ ...formData, head: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                >
                  <option value="">Select Head / Manager</option>
                  {employeesList.map(e => (
                    <option key={e.id} value={e.employeeName || e.employee_name}>{e.employeeName || e.employee_name} ({e.email})</option>
                  ))}
                  <option value="CTO">CTO (Executive Division)</option>
                  <option value="Director">Director (Executive Division)</option>
                  <option value="Operations Head">Operations Head</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Description</label>
                <textarea
                  rows="3"
                  placeholder="Describe operations details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white leading-relaxed"
                ></textarea>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-black border rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition rounded-xl"
                >
                  {editingRecord ? "Save Changes" : "Create Business Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. View Details Modal */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-150 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] font-black text-slate-400 uppercase tracking-wider">Business Unit Details</span>
                <h4 className="text-sm font-black text-slate-900 mt-0.5">{viewingRecord.buName} ({viewingRecord.buCode})</h4>
              </div>
              <button 
                onClick={() => setViewingRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-750 transition"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Business Unit Code</span>
                  <p className="font-mono font-bold text-slate-800 text-sm">{viewingRecord.buCode}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Business Unit Name</span>
                  <p className="font-black text-slate-800 text-sm">{viewingRecord.buName}</p>
                </div>
                <div className="space-y-0.5 col-span-2">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Head of Business Unit</span>
                  <p className="text-slate-750 font-bold text-sm">{viewingRecord.head || "--"}</p>
                </div>
                <div className="col-span-2 space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase">Description</span>
                  <p className="font-medium text-slate-650 bg-slate-50 border border-slate-100 p-3 rounded-xl mt-1 leading-relaxed">
                    {viewingRecord.description || "No description provided."}
                  </p>
                </div>
                <div className="col-span-2 space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Status</span>
                  <div className="mt-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                      viewingRecord.status === "Active"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-slate-50 text-slate-650 border-slate-200"
                    }`}>
                      {viewingRecord.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex justify-end">
              <button
                onClick={() => setViewingRecord(null)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-black transition"
              >
                Close details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Status Confirm Modal */}
      {statusConfirmRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <ExclamationTriangleIcon className="w-6 h-6 animate-bounce" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {statusConfirmRecord.status === "Active" ? "Deactivate Business Unit?" : "Activate Business Unit?"}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to change the status of <strong>{statusConfirmRecord.buName}</strong> to{" "}
              <span className="font-extrabold text-slate-700">
                {statusConfirmRecord.status === "Active" ? "Inactive" : "Active"}
              </span>?
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setStatusConfirmRecord(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleStatusConfirm}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Delete Confirm Modal */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <TrashIcon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Business Unit?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete <strong>{deletingRecord.buName}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingRecord(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessUnit;
