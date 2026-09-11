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
  ArrowPathIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";
import { createTableRecord, updateTableRecord, deleteTableRecord } from "../../services/hrApi";

// Job Level configuration mapping
const JOB_LEVELS = [
  { id: "L1", label: "L1 – Entry Level", rank: 1 },
  { id: "L2", label: "L2 – Junior", rank: 2 },
  { id: "L3", label: "L3 – Mid Level", rank: 3 },
  { id: "L4", label: "L4 – Senior", rank: 4 },
  { id: "L5", label: "L5 – Lead", rank: 5 },
  { id: "L6", label: "L6 – Manager", rank: 6 },
  { id: "L7", label: "L7 – Director", rank: 7 }
];

const GRADES = ["G1", "G2", "G3", "G4", "G5", "G6", "G7"];
const EMPLOYMENT_TYPES = ["Full Time", "Part Time", "Contract", "Internship"];
const JOB_CATEGORIES = ["Technical", "Administrative", "Executive", "Management", "Operations", "Sales"];

const Designation = ({ records = [], dbData = {}, onRefreshData }) => {
  // Lists extracted from dbData
  const departmentsList = useMemo(() => dbData["Department"] || dbData["departments"] || dbData["department"] || [], [dbData]);
  const employeesList = useMemo(() => dbData["Employee Profile"] || dbData["employee_profile"] || dbData["employees"] || [], [dbData]);

  // Sync state with records from backend
  const dataList = useMemo(() => {
    return records.map((r) => {
      // Find department name if missing
      const deptObj = departmentsList.find(d => String(d.id) === String(r.departmentId || r.department_id));
      const deptName = deptObj ? (deptObj.deptName || deptObj.dept_name || deptObj.name) : (r.department || "General");

      // Count assigned employees
      const assignedCount = employeesList.filter(emp => 
        String(emp.designationId || emp.designation_id) === String(r.id) ||
        String(emp.designation || "").toLowerCase().trim() === String(r.desigName || r.desig_name || "").toLowerCase().trim()
      ).length;

      return {
        id: r.id,
        desigCode: r.desigCode || r.desig_code || "",
        desigName: r.desigName || r.desig_name || r.title || "",
        departmentId: r.departmentId || r.department_id || "",
        department: deptName,
        grade: r.grade || "G1",
        jobLevel: r.jobLevel || r.job_level || "L1",
        reportingTo: r.reportingTo || r.reporting_to || "",
        minExperience: r.minExperience || r.min_experience || "",
        maxExperience: r.maxExperience || r.max_experience || "",
        jobCategory: r.jobCategory || r.job_category || "",
        employmentType: r.employmentType || r.employment_type || "",
        description: r.description || "",
        status: r.status || "Active",
        assignedEmployeesCount: assignedCount
      };
    });
  }, [records, departmentsList, employeesList]);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("ALL");
  const [filterLevel, setFilterLevel] = useState("ALL");
  const [filterGrade, setFilterGrade] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal / Drawer state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [statusConfirmRecord, setStatusConfirmRecord] = useState(null);

  // Form State
  const initialForm = {
    desigCode: "",
    desigName: "",
    departmentId: "",
    jobLevel: "L1",
    grade: "G1",
    reportingTo: "",
    minExperience: "",
    maxExperience: "",
    jobCategory: "Technical",
    employmentType: "Full Time",
    description: "",
    status: "Active"
  };
  const [formData, setFormData] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});

  // Filtered List
  const filteredRecords = useMemo(() => {
    return dataList.filter(item => {
      const matchSearch =
        (item.desigName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.desigCode || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = filterDept === "ALL" || String(item.departmentId) === String(filterDept);
      const matchLevel = filterLevel === "ALL" || item.jobLevel === filterLevel;
      const matchGrade = filterGrade === "ALL" || item.grade === filterGrade;
      const matchStatus = filterStatus === "ALL" || item.status === filterStatus;

      return matchSearch && matchDept && matchLevel && matchGrade && matchStatus;
    });
  }, [dataList, searchTerm, filterDept, filterLevel, filterGrade, filterStatus]);

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
    const mapped = employeesList.length;
    const deptsCount = new Set(dataList.map(d => d.departmentId).filter(Boolean)).size;
    return { total, active, mapped, deptsCount };
  }, [dataList, employeesList]);

  // Reporting To list calculation: Valid higher levels only
  const validReportingOptions = useMemo(() => {
    const selectedLevel = JOB_LEVELS.find(l => l.id === formData.jobLevel);
    if (!selectedLevel) return [];

    return dataList.filter(d => {
      // Cannot report to self
      if (editingRecord && d.id === editingRecord.id) return false;

      // Active designations only
      if (d.status !== "Active") return false;

      // Reporting level rank must be higher than current level rank
      const optLevel = JOB_LEVELS.find(l => l.id === d.jobLevel);
      return optLevel && optLevel.rank > selectedLevel.rank;
    });
  }, [dataList, formData.jobLevel, editingRecord]);

  // Open Form Handlers
  const handleOpenAdd = () => {
    setEditingRecord(null);
    setFormErrors({});
    setFormData({
      ...initialForm,
      desigCode: `DES-${Math.floor(100 + Math.random() * 900)}`
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingRecord(item);
    setFormErrors({});
    setFormData({
      desigCode: item.desigCode,
      desigName: item.desigName,
      departmentId: item.departmentId,
      jobLevel: item.jobLevel,
      grade: item.grade,
      reportingTo: item.reportingTo,
      minExperience: item.minExperience,
      maxExperience: item.maxExperience,
      jobCategory: item.jobCategory || "Technical",
      employmentType: item.employmentType || "Full Time",
      description: item.description,
      status: item.status
    });
    setShowAddModal(true);
  };

  // Form Submissions
  const validateForm = () => {
    const errors = {};
    if (!formData.desigCode || !formData.desigCode.trim()) {
      errors.desigCode = "Designation Code is required.";
    } else {
      // Unique check
      const duplicate = dataList.find(d => 
        d.desigCode.toLowerCase().trim() === formData.desigCode.toLowerCase().trim() &&
        (!editingRecord || d.id !== editingRecord.id)
      );
      if (duplicate) errors.desigCode = "Designation Code must be unique.";
    }

    if (!formData.desigName || !formData.desigName.trim()) {
      errors.desigName = "Designation Name is required.";
    }

    if (!formData.departmentId) {
      errors.departmentId = "Department is required.";
    }

    if (!formData.jobLevel) {
      errors.jobLevel = "Job Level is required.";
    }

    // Reporting To Validation
    if (formData.reportingTo) {
      const selectedLevel = JOB_LEVELS.find(l => l.id === formData.jobLevel);
      const repObj = dataList.find(d => d.desigName === formData.reportingTo || d.desigCode === formData.reportingTo);
      if (repObj) {
        const repLevel = JOB_LEVELS.find(l => l.id === repObj.jobLevel);
        if (selectedLevel && repLevel && repLevel.rank <= selectedLevel.rank) {
          errors.reportingTo = `Invalid Reporting Relationship: Target designation (${repObj.desigName}) must be at a higher level than ${selectedLevel.id}.`;
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Find dept Name to store
    const deptObj = departmentsList.find(d => String(d.id) === String(formData.departmentId));
    const deptName = deptObj ? (deptObj.deptName || deptObj.dept_name || deptObj.name) : "";

    const payload = {
      desigCode: formData.desigCode,
      desigName: formData.desigName,
      departmentId: formData.departmentId,
      department: deptName,
      jobLevel: formData.jobLevel,
      grade: formData.grade,
      reportingTo: formData.reportingTo,
      minExperience: formData.minExperience,
      maxExperience: formData.maxExperience,
      jobCategory: formData.jobCategory,
      employmentType: formData.employmentType,
      description: formData.description,
      status: formData.status
    };

    try {
      if (editingRecord) {
        await updateTableRecord("designation", editingRecord.id, payload);
      } else {
        await createTableRecord("designation", payload);
      }
      setShowAddModal(false);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setFormErrors({ submit: err.message || "Failed to save designation record." });
    }
  };

  const handleToggleStatusConfirm = async () => {
    if (!statusConfirmRecord) return;
    const newStatus = statusConfirmRecord.status === "Active" ? "Inactive" : "Active";
    
    try {
      await updateTableRecord("designation", statusConfirmRecord.id, {
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
      await deleteTableRecord("designation", deletingRecord.id);
      setDeletingRecord(null);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Error deleting record: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs gap-4 font-sans">
        <div>
          <span className="text-[10px] text-indigo-600 block font-bold uppercase tracking-wider">Organization Setup &gt; Designation Master</span>
          <h2 className="text-lg font-black text-slate-900 mt-1">Designation Master</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Manage organizational designations, job levels, grades, departments, and reporting relationships.</p>
        </div>
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <button 
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Designation</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Designations</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <BriefcaseIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Active Designations</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{stats.active}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircleIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Mapped Employees</span>
            <p className="text-2xl font-black text-indigo-600 mt-1">{stats.mapped}</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <UserGroupIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Covered Depts</span>
            <p className="text-2xl font-black text-purple-600 mt-1">{stats.deptsCount}</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <UserGroupIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar Console */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <FunnelIcon className="h-4 w-4 text-slate-400" />
          Filter Configuration
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-1">
          {/* Text Search */}
          <div className="space-y-1.5 md:col-span-1">
            <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Search Designation</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
              </span>
              <input 
                type="text"
                placeholder="Search by code / title..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Filter Department */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Department</label>
            <select
              value={filterDept}
              onChange={(e) => {
                setFilterDept(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">All Departments</option>
              {departmentsList.map(d => (
                <option key={d.id} value={d.id}>{d.deptName || d.dept_name || d.name}</option>
              ))}
            </select>
          </div>

          {/* Filter Job Level */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Job Level</label>
            <select
              value={filterLevel}
              onChange={(e) => {
                setFilterLevel(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">All Job Levels</option>
              {JOB_LEVELS.map(l => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </div>

          {/* Filter Grade */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Grade</label>
            <select
              value={filterGrade}
              onChange={(e) => {
                setFilterGrade(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">All Grades</option>
              {GRADES.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
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

      {/* 4. Designation Table Board */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
        
        {/* Table Title */}
        <div className="flex border-b pb-4 items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <span>📋</span> Designation Master Table
          </h3>
          <span className="text-[11px] font-bold text-slate-400">Total matched: {filteredRecords.length} records</span>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-150 text-left">
            <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4 w-12 text-center">S.No</th>
                <th scope="col" className="px-6 py-4">Designation Code</th>
                <th scope="col" className="px-6 py-4">Designation Name</th>
                <th scope="col" className="px-6 py-4">Department</th>
                <th scope="col" className="px-6 py-4 text-center">Job Level</th>
                <th scope="col" className="px-6 py-4 text-center">Grade</th>
                <th scope="col" className="px-6 py-4">Reporting To</th>
                <th scope="col" className="px-6 py-4 text-center">Employees</th>
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
                  <td className="px-6 py-4 font-mono font-bold text-slate-500">{item.desigCode}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{item.desigName}</td>
                  <td className="px-6 py-4">{item.department}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-extrabold rounded-md text-[10px]">
                      {item.jobLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-mono">{item.grade}</td>
                  <td className="px-6 py-4 text-slate-500 font-medium">{item.reportingTo || "--"}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-black rounded-md border border-indigo-150">
                      {item.assignedEmployeesCount}
                    </span>
                  </td>
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
                        title="Edit Designation"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      {item.assignedEmployeesCount === 0 && (
                        <button
                          onClick={() => setDeletingRecord(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                          title="Delete Designation"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400 font-medium">
                    No designation records matched the selected filters.
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

      {/* 5. Add / Edit Modal Drawer */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingRecord ? "Edit Designation Record" : "Add New Designation Master"}
                </h3>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5 tracking-wider">Configure job structure parameters</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message banner */}
            {formErrors.submit && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs p-3.5 rounded-xl font-bold">
                ⚠️ {formErrors.submit}
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Code */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Designation Code <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.desigCode}
                    onChange={(e) => setFormData({ ...formData, desigCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                  {formErrors.desigCode && <p className="text-[10px] text-rose-500 mt-1 font-bold">{formErrors.desigCode}</p>}
                </div>
                {/* Name */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Designation Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Software Engineer"
                    value={formData.desigName}
                    onChange={(e) => setFormData({ ...formData, desigName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                  {formErrors.desigName && <p className="text-[10px] text-rose-500 mt-1 font-bold">{formErrors.desigName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Department Dropdown */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Department <span className="text-rose-500">*</span></label>
                  <select
                    required
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  >
                    <option value="">Select Department</option>
                    {departmentsList.map(d => (
                      <option key={d.id} value={d.id}>{d.deptName || d.dept_name || d.name}</option>
                    ))}
                  </select>
                  {formErrors.departmentId && <p className="text-[10px] text-rose-500 mt-1 font-bold">{formErrors.departmentId}</p>}
                </div>
                {/* Job Level */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Job Level <span className="text-rose-500">*</span></label>
                  <select
                    required
                    value={formData.jobLevel}
                    onChange={(e) => setFormData({ ...formData, jobLevel: e.target.value, reportingTo: "" })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  >
                    {JOB_LEVELS.map(l => (
                      <option key={l.id} value={l.id}>{l.label}</option>
                    ))}
                  </select>
                  {formErrors.jobLevel && <p className="text-[10px] text-rose-500 mt-1 font-bold">{formErrors.jobLevel}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Grade */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Grade</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  >
                    {GRADES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                {/* Reporting To */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Reporting To</label>
                  <select
                    value={formData.reportingTo}
                    onChange={(e) => setFormData({ ...formData, reportingTo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  >
                    <option value="">None (Reporting Manager / Executive)</option>
                    {validReportingOptions.map(o => (
                      <option key={o.id} value={o.desigName}>{o.desigName} ({o.desigCode} - {o.jobLevel})</option>
                    ))}
                  </select>
                  {formErrors.reportingTo && <p className="text-[10px] text-rose-550 mt-1 font-semibold">{formErrors.reportingTo}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Min Experience */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Minimum Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.minExperience}
                    onChange={(e) => setFormData({ ...formData, minExperience: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
                {/* Max Experience */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Maximum Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="15"
                    value={formData.maxExperience}
                    onChange={(e) => setFormData({ ...formData, maxExperience: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Job Category */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Job Category</label>
                  <select
                    value={formData.jobCategory}
                    onChange={(e) => setFormData({ ...formData, jobCategory: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  >
                    {JOB_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {/* Employment Type */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Employment Type</label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  >
                    {EMPLOYMENT_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Description / Key Responsibilities</label>
                <textarea
                  rows="3"
                  placeholder="Describe the job roles, activities, and operational key responsibilities..."
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
                  {editingRecord ? "Save Changes" : "Create Designation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. View Details Modal Popup */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-150 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] font-black text-slate-400 uppercase tracking-wider">Designation Master Ledger</span>
                <h4 className="text-sm font-black text-slate-900 mt-0.5">{viewingRecord.desigName} ({viewingRecord.desigCode})</h4>
              </div>
              <button 
                onClick={() => setViewingRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-750 transition"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Designation Code</span>
                  <p className="font-mono font-bold text-slate-800 text-sm">{viewingRecord.desigCode}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Designation Name</span>
                  <p className="font-black text-slate-800 text-sm">{viewingRecord.desigName}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Department</span>
                  <p className="text-slate-700 font-bold">{viewingRecord.department}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Job Level</span>
                  <p className="text-slate-750 font-bold">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 text-[10px] font-extrabold">
                      {viewingRecord.jobLevel} - {JOB_LEVELS.find(l => l.id === viewingRecord.jobLevel)?.label?.split(" – ")?.[1] || ""}
                    </span>
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Grade Level</span>
                  <p className="text-slate-700 font-bold font-mono">{viewingRecord.grade}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Reporting To</span>
                  <p className="text-slate-700 font-bold">{viewingRecord.reportingTo || "--"}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Experience Range</span>
                  <p className="text-slate-700 font-bold">
                    {viewingRecord.minExperience || "0"} - {viewingRecord.maxExperience || "Any"} Years
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Job Category</span>
                  <p className="text-slate-700 font-bold">{viewingRecord.jobCategory || "--"}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Employment Type</span>
                  <p className="text-slate-700 font-bold">{viewingRecord.employmentType || "--"}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Mapped Staff Count</span>
                  <p className="text-indigo-600 font-black text-sm">{viewingRecord.assignedEmployeesCount} Employees</p>
                </div>

                <div className="col-span-2 space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase">Job Description / Responsibilities</span>
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

            {/* Modal Footer */}
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

      {/* 7. Status Confirmation Modal (Deactivate/Activate) */}
      {statusConfirmRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <ExclamationTriangleIcon className="w-6 h-6 animate-bounce" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {statusConfirmRecord.status === "Active" ? "Deactivate Designation?" : "Activate Designation?"}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to change the status of <strong>{statusConfirmRecord.desigName}</strong> to{" "}
              <span className="font-extrabold text-slate-700">
                {statusConfirmRecord.status === "Active" ? "Inactive" : "Active"}
              </span>?
              {statusConfirmRecord.status === "Active" && statusConfirmRecord.assignedEmployeesCount > 0 && (
                <span className="block mt-2 text-rose-500 font-bold">
                  ⚠️ Note: There are {statusConfirmRecord.assignedEmployeesCount} employee(s) currently assigned to this designation. They will retain it historically.
                </span>
              )}
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

      {/* 8. Delete Confirmation Modal */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <TrashIcon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Designation permanently?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete <strong>{deletingRecord.desigName}</strong>? This action cannot be undone.
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
                className="px-5 py-2 bg-rose-650 hover:bg-rose-750 text-white rounded-xl text-xs font-bold shadow-md"
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

export default Designation;
