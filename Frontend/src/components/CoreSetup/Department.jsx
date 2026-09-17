import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setDbData } from "../../redux/hrSlice";
import {
  fetchDepartmentsApi,
  createNewDepartmentApi,
  updateExistingDepartmentApi,
  toggleDepartmentStatusApi,
  deleteDepartmentApi,
  getTableData
} from "../../services/hrApi";
import {
  BuildingOffice2Icon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  InformationCircleIcon,
  ArrowsUpDownIcon
} from "@heroicons/react/24/outline";

const PREDEFINED_MODULES = [
  "Dashboard",
  "Organization Setup",
  "Employee Management",
  "Attendance",
  "Leave Management",
  "Payroll",
  "Exit Management",
  "Helpdesk",
  "Reports",
  "Settings"
];

const Department = ({ records: legacyRecords, openCreateTrigger }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const dbData = useSelector((state) => state.hr.dbData) || {};
  const token = useSelector((state) => state.auth.token);

  // State Management
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10
  });

  const [filters, setFilters] = useState({
    search: "",
    branchId: "",
    status: "",
    sortBy: "created_at",
    sortOrder: "DESC"
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modals & UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  const [editingDept, setEditingDept] = useState(null);
  const [deletingDept, setDeletingDept] = useState(null);
  const [viewingDept, setViewingDept] = useState(null);

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [validationError, setValidationError] = useState("");

  // Centralized Master Modules State (strictly synced with Admin Dashboard Sidebar sections + custom modules)
  const [masterModules, setMasterModules] = useState(() => {
    try {
      const savedCustom = localStorage.getItem("hrms_custom_modules");
      if (savedCustom) {
        const parsed = JSON.parse(savedCustom);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return Array.from(new Set([...PREDEFINED_MODULES, ...parsed]));
        }
      }
    } catch (e) {}
    return [...PREDEFINED_MODULES];
  });

  const [customModulesList, setCustomModulesList] = useState(() => {
    try {
      const savedCustom = localStorage.getItem("hrms_custom_modules");
      if (savedCustom) {
        const parsed = JSON.parse(savedCustom);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [moduleSearchQuery, setModuleSearchQuery] = useState("");

  // Persist master modules to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("hrms_master_modules", JSON.stringify(masterModules));
      localStorage.setItem("hrms_custom_modules", JSON.stringify(customModulesList));
    } catch (e) {}
  }, [masterModules, customModulesList]);

  // Handler to Create & Assign a New Custom Module
  const handleCreateCustomModule = (newModuleName) => {
    const cleanName = String(newModuleName).trim();
    if (!cleanName) return;

    // Check duplicate case-insensitively
    const exists = masterModules.some(
      m => m.toLowerCase().trim() === cleanName.toLowerCase().trim()
    );

    if (exists) {
      showToast(`Module '${cleanName}' already exists in the Master Modules list.`, "error");
      return;
    }

    const updatedMaster = [...masterModules, cleanName];
    const updatedCustom = [...customModulesList, cleanName];

    setMasterModules(updatedMaster);
    setCustomModulesList(updatedCustom);

    // Auto-assign to current department form data
    setFormData(prev => ({
      ...prev,
      assignedModules: prev.assignedModules.includes(cleanName)
        ? prev.assignedModules
        : [...prev.assignedModules, cleanName]
    }));

    showToast(`New custom module '${cleanName}' created & assigned to department!`, "success");
    setModuleSearchQuery("");
  };

  // Move Module Up / Down (Drag & Drop Reordering Support)
  const handleMoveModule = (index, direction) => {
    const current = [...(formData.assignedModules || [])];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= current.length) return;
    
    const temp = current[index];
    current[index] = current[targetIndex];
    current[targetIndex] = temp;

    setFormData(prev => ({ ...prev, assignedModules: current }));
  };

  const [formData, setFormData] = useState({
    deptCode: "",
    deptName: "",
    branchId: "",
    headEmployeeId: "",
    parentDeptId: "",
    hrEmail: "",
    hrPassword: "",
    assignedModules: [...PREDEFINED_MODULES],
    status: "Active",
    description: ""
  });

  // Show floating toast notification
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  // Helper to sync departments with Redux dbData
  const syncReduxDepartments = useCallback(async () => {
    if (!token) return;
    try {
      const allDepts = await getTableData("department");
      if (allDepts && Array.isArray(allDepts)) {
        dispatch(setDbData({ ...dbData, Department: allDepts }));
      }
    } catch (e) {
      console.error("Redux department sync error:", e);
    }
  }, [dispatch, dbData, token]);

  // Fetch paginated departments from server
  const loadDepartments = useCallback(async (isSilent = false) => {
    const activeToken = token || localStorage.getItem("token") || "active";
    if (!isSilent) setLoading(true);
    try {
      const data = await fetchDepartmentsApi({
        search: filters.search,
        branchId: filters.branchId,
        status: filters.status,
        page: pagination.currentPage,
        limit: pagination.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      const rawDepts = data.departments || [];
      const cleanDepts = rawDepts.filter(
        d => d.deptCode !== "DEPT-GEN" && d.dept_code !== "DEPT-GEN" && d.deptName !== "General Administration" && d.deptCode !== "ADMIN" && d.dept_code !== "ADMIN" && d.deptName !== "Administration" && d.dept_name !== "Administration"
      );
      setDepartments(cleanDepts);
      setPagination({
        totalItems: data.totalItems !== undefined ? data.totalItems : cleanDepts.length,
        totalPages: data.totalPages || 1,
        currentPage: data.currentPage || 1,
        limit: data.limit || 10
      });
    } catch (err) {
      console.error("Failed to load departments:", err);
      // Fallback to legacy props if API is initializing
      if (legacyRecords && legacyRecords.length > 0) {
        setDepartments(legacyRecords);
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [filters, pagination.currentPage, pagination.limit, legacyRecords, token]);

  // Load auxiliary data for dropdowns (Branches & Employees)
  useEffect(() => {
    const loadAuxiliaryData = async () => {
      try {
        const [branchData, empData] = await Promise.all([
          getTableData("branch").catch(() => []),
          getTableData("employee_profile").catch(() => [])
        ]);
        setBranches(Array.isArray(branchData) ? branchData : []);
        setEmployees(Array.isArray(empData) ? empData : []);
      } catch (err) {
        console.error("Failed to load dropdown options:", err);
      }
    };
    loadAuxiliaryData();
  }, [token]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  // Poll for external database modifications silently in the background
  useEffect(() => {
    const pollInterval = setInterval(() => {
      loadDepartments(true);
    }, 4000);
    return () => clearInterval(pollInterval);
  }, [loadDepartments]);

  // Open Create Modal
  const handleOpenCreateModal = useCallback(() => {
    setEditingDept(null);
    setValidationError("");
    setFormData({
      deptCode: "",
      deptName: "",
      branchId: "",
      branch: "",
      headEmployeeId: "",
      head: "",
      parentDeptId: "",
      parentDept: "",
      hrEmail: "",
      hrPassword: "",
      assignedModules: [...PREDEFINED_MODULES], // Predefined master modules selected by default
      status: "Active",
      description: ""
    });
    setIsModalOpen(true);
  }, [masterModules]);

  useEffect(() => {
    if (openCreateTrigger && openCreateTrigger > 0) {
      handleOpenCreateModal();
    }
  }, [openCreateTrigger, handleOpenCreateModal]);

  // Filter change handlers
  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleBranchFilterChange = (e) => {
    setFilters(prev => ({ ...prev, branchId: e.target.value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleStatusFilterChange = (e) => {
    setFilters(prev => ({ ...prev, status: e.target.value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleSort = (field) => {
    setFilters(prev => {
      const isSameField = prev.sortBy === field;
      return {
        ...prev,
        sortBy: field,
        sortOrder: isSameField && prev.sortOrder === "ASC" ? "DESC" : "ASC"
      };
    });
  };



  // Open Edit Modal
  const handleOpenEditModal = (dept) => {
    setEditingDept(dept);
    setValidationError("");

    const headStr = dept.head || (dept.headEmployeeDetails ? `${dept.headEmployeeDetails.firstName || ''} ${dept.headEmployeeDetails.lastName || ''}`.trim() : "");
    const parentStr = dept.parentDept || dept.parentDeptDetails?.deptName || "";
    const branchStr = dept.branch || dept.branchDetails?.branchName || "";

    setFormData({
      deptCode: dept.deptCode || dept.dept_code || "",
      deptName: dept.deptName || dept.dept_name || "",
      branchId: dept.branchId || dept.branchDetails?.id || "",
      branch: branchStr,
      headEmployeeId: dept.headEmployeeId || dept.headEmployeeDetails?.id || "",
      head: headStr,
      parentDeptId: dept.parentDeptId || dept.parentDeptDetails?.id || "",
      parentDept: parentStr,
      hrEmail: dept.hrEmail || dept.hr_email || "",
      hrPassword: dept.hrPassword || dept.hr_password || "",
      assignedModules: Array.isArray(dept.assignedModules) ? dept.assignedModules : (Array.isArray(dept.assigned_modules) ? dept.assigned_modules : []),
      status: dept.status || "Active",
      description: dept.description || ""
    });
    setIsModalOpen(true);
  };

  // Open View Modal
  const handleOpenViewModal = (dept) => {
    setViewingDept(dept);
    setIsViewModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (dept) => {
    setDeletingDept(dept);
    setIsDeleteModalOpen(true);
  };

  // Submit Form (Create / Update)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setValidationError("");
    setSubmitting(true);

    const payload = {
      ...formData,
      branchId: formData.branchId || null,
      headEmployeeId: formData.headEmployeeId || null,
      parentDeptId: formData.parentDeptId || null,
      hrEmail: formData.hrEmail ? formData.hrEmail.trim() : null,
      hrPassword: formData.hrPassword || null,
    };

    try {
      if (editingDept) {
        await updateExistingDepartmentApi(editingDept.id, payload);
        showToast(`Department '${formData.deptName}' updated successfully!`, "success");
      } else {
        const createdObj = await createNewDepartmentApi(payload);
        showToast(`Department '${formData.deptName}' created successfully!`, "success");
        if (createdObj) {
          setDepartments(prev => {
            const exists = prev.some(d => d.id === createdObj.id || d.deptCode === (createdObj.deptCode || createdObj.dept_code));
            if (!exists) return [createdObj, ...prev];
            return prev;
          });
          setPagination(prev => ({
            ...prev,
            totalItems: (prev.totalItems || 0) + 1
          }));
        }
      }
      setIsModalOpen(false);
      await loadDepartments();
      await syncReduxDepartments();
    } catch (err) {
      setValidationError(err.message || "Failed to save department details.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Quick Status Toggle
  const handleToggleStatus = async (dept) => {
    const newStatus = dept.status === "Active" ? "Inactive" : "Active";
    try {
      await toggleDepartmentStatusApi(dept.id, newStatus);
      showToast(`Status updated to ${newStatus} for '${dept.deptName}'.`, "success");
      await loadDepartments();
      await syncReduxDepartments();
    } catch (err) {
      showToast(err.message || "Failed to update status.", "error");
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingDept) return;
    setSubmitting(true);
    try {
      await deleteDepartmentApi(deletingDept.id);
      showToast(`Department '${deletingDept.deptName}' deleted successfully!`, "success");
      setIsDeleteModalOpen(false);
      setDeletingDept(null);
      await loadDepartments();
      await syncReduxDepartments();
    } catch (err) {
      showToast(err.message || "Failed to delete department.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate Metrics
  const totalCount = pagination.totalItems || departments.length;
  const activeCount = departments.filter(d => d.status === "Active").length;
  const inactiveCount = departments.filter(d => d.status === "Inactive").length;

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toast.show && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center space-x-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all transform translate-y-0 ${
            toast.type === "error"
              ? "bg-rose-50 text-rose-800 border-rose-200"
              : "bg-emerald-50 text-emerald-800 border-emerald-200"
          }`}
        >
          {toast.type === "error" ? (
            <ExclamationTriangleIcon className="w-5 h-5 text-rose-600" />
          ) : (
            <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <BuildingOffice2Icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Departments</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{totalCount}</h3>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircleIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Status</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{activeCount}</h3>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <XCircleIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inactive Status</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{inactiveCount}</h3>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <UserGroupIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Branches Covered</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{branches.length || 1}</h3>
          </div>
        </div>
      </div>

      {/* Toolbar & Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Left: Search & Filter controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search code, name..."
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>

          {/* Branch Filter */}
          <select
            value={filters.branchId}
            onChange={handleBranchFilterChange}
            className="w-full sm:w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          >
            <option value="">All Branches</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.branchName || b.branch_name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={handleStatusFilterChange}
            className="w-full sm:w-36 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          >
            <option value="">All Status</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={loadDepartments}
            title="Refresh Data"
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th
                  onClick={() => handleSort("deptCode")}
                  className="py-3.5 px-4 cursor-pointer hover:text-indigo-600 transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>Code</span>
                    <ArrowsUpDownIcon className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("deptName")}
                  className="py-3.5 px-4 cursor-pointer hover:text-indigo-600 transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>Department Name</span>
                    <ArrowsUpDownIcon className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Branch Location</th>
                <th className="py-3.5 px-4">Department Head</th>
                <th className="py-3.5 px-4">Parent Dept</th>
                <th
                  onClick={() => handleSort("status")}
                  className="py-3.5 px-4 cursor-pointer hover:text-indigo-600 transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    <ArrowsUpDownIcon className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">Staff Count</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center space-x-2">
                      <ArrowPathIcon className="w-5 h-5 animate-spin text-indigo-600" />
                      <span>Loading company department records...</span>
                    </div>
                  </td>
                </tr>
              ) : departments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400 space-y-2">
                    <BuildingOffice2Icon className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-medium text-slate-600">No departments found.</p>
                    <p className="text-[11px] text-slate-400">Try adjusting your filters or add a new department.</p>
                  </td>
                </tr>
              ) : (
                departments.map((dept) => {
                  const branchName = dept.branchDetails?.branchName || dept.branch || "--";
                  const headName = dept.headEmployeeDetails
                    ? `${dept.headEmployeeDetails.firstName} ${dept.headEmployeeDetails.lastName}`
                    : dept.head || "--";
                  const parentName = dept.parentDeptDetails?.deptName || dept.parentDept || "None";
                  const staffCount = dept.assignedEmployeeCount || 0;

                  return (
                    <tr key={dept.id} className="hover:bg-slate-50/60 transition group">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                        <span className="bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-[11px]">
                          {dept.deptCode || dept.dept_code || dept.code || "DEPT"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {dept.deptName || dept.dept_name || dept.name}
                        {dept.description && (
                          <p className="text-[10px] font-normal text-slate-400 line-clamp-1">{dept.description}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-600">{branchName}</td>
                      <td className="py-3.5 px-4 text-slate-600">{headName}</td>
                      <td className="py-3.5 px-4 text-slate-500">{parentName}</td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatus(dept)}
                          title="Click to toggle status"
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition ${
                            dept.status === "Active"
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${dept.status === "Active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                          <span>{dept.status}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-700">
                          {staffCount}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenViewModal(dept)}
                          title="View Details"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(dept)}
                          title="Edit Department"
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(dept)}
                          title="Soft Delete Department"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Footer */}
        <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing <span className="font-semibold text-slate-800">{departments.length}</span> of{" "}
            <span className="font-semibold text-slate-800">{pagination.totalItems}</span> departments
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Page {pagination.currentPage} of {pagination.totalPages}</span>
            <div className="inline-flex items-center space-x-1">
              <button
                disabled={pagination.currentPage <= 1 || loading}
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.currentPage >= pagination.totalPages || loading}
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden space-y-0">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingDept ? "Edit Department Master" : "Create New Department"}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingDept ? "Update company department metadata & assignment" : "Define a new department within your company scope"}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Validation Error Alert */}
            {validationError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleSubmitForm} className="space-y-0">
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Dept Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DEP-ENG"
                    value={formData.deptCode}
                    onChange={(e) => setFormData({ ...formData, deptCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono font-bold uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>

                {/* Dept Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Engineering"
                    value={formData.deptName}
                    onChange={(e) => setFormData({ ...formData, deptName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Branch Selection / Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Location</label>
                  <input
                    type="text"
                    list="branch-list"
                    placeholder="Select or enter Branch Location..."
                    value={formData.branch || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const matched = branches.find(b => (b.branchName || b.branch_name || b.name) === val);
                      setFormData({
                        ...formData,
                        branch: val,
                        branchId: matched ? matched.id : ""
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                  <datalist id="branch-list">
                    {branches.map((b, idx) => (
                      <option key={b.id || idx} value={b.branchName || b.branch_name || b.name} />
                    ))}
                  </datalist>
                </div>

                {/* Department Head Selection / Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department Head</label>
                  <input
                    type="text"
                    list="head-list"
                    placeholder="Select or enter Department Head..."
                    value={formData.head || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const matched = employees.find(emp => {
                        const name = `${emp.firstName || emp.first_name || ''} ${emp.lastName || emp.last_name || ''}`.trim();
                        return name === val || emp.empCode === val || emp.emp_code === val;
                      });
                      setFormData({
                        ...formData,
                        head: val,
                        headEmployeeId: matched ? matched.id : ""
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                  <datalist id="head-list">
                    {employees.map((e, idx) => {
                      const name = `${e.firstName || e.first_name || ''} ${e.lastName || e.last_name || ''}`.trim();
                      return (
                        <option key={e.id || idx} value={name || e.empCode || e.emp_code} />
                      );
                    })}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Parent Department Selection / Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Department</label>
                  <input
                    type="text"
                    list="parent-dept-list"
                    placeholder="Select or enter Parent Department..."
                    value={formData.parentDept || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const matched = departments.find(d => (d.deptName || d.dept_name || d.name) === val);
                      setFormData({
                        ...formData,
                        parentDept: val,
                        parentDeptId: matched ? matched.id : ""
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                  <datalist id="parent-dept-list">
                    {departments
                      .filter(d => !editingDept || d.id !== editingDept.id)
                      .map((d, idx) => (
                        <option key={d.id || idx} value={d.deptName || d.dept_name || d.name} />
                      ))}
                  </datalist>
                </div>

                {/* Status Toggle */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Department HR Credentials */}
              <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <span>🔐</span> Department HR Credentials
                  </h4>
                  <span className="text-[10px] text-blue-600 font-medium">Dedicated login for this department</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">HR Email / Login ID</label>
                    <input
                      type="email"
                      placeholder="e.g. hr.engineering@company.com"
                      value={formData.hrEmail || ""}
                      onChange={(e) => setFormData({ ...formData, hrEmail: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">HR Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={formData.hrPassword || ""}
                      onChange={(e) => setFormData({ ...formData, hrPassword: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Centralized Master Modules Assignment & Custom Module Creation Section */}
              <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/70 space-y-2.5">
                {/* Header & Quick Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-sm">📦</span>
                    <span className="text-xs font-bold text-slate-800">
                      Assign Sidebar Modules
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-extrabold rounded-full">
                      {(formData.assignedModules || []).length} / {masterModules.length} Selected
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, assignedModules: Array.from(new Set([...PREDEFINED_MODULES, ...masterModules])) })}
                      className="text-indigo-600 font-bold hover:text-indigo-800 hover:underline transition"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, assignedModules: [] })}
                      className="text-slate-500 font-semibold hover:text-slate-700 hover:underline transition"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Module Search Bar & Add Custom Module Trigger */}
                <div className="space-y-2">
                  <div className="relative flex items-center">
                    <MagnifyingGlassIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search existing or type custom module name..."
                      value={moduleSearchQuery}
                      onChange={(e) => setModuleSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (moduleSearchQuery.trim()) {
                            handleCreateCustomModule(moduleSearchQuery);
                          }
                        }
                      }}
                      className="w-full pl-8 pr-24 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                    />
                    {moduleSearchQuery.trim() && (
                      <button
                        type="button"
                        onClick={() => handleCreateCustomModule(moduleSearchQuery)}
                        className="absolute right-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-[10px] font-bold rounded-lg shadow-xs transition flex items-center gap-1"
                      >
                        <PlusIcon className="w-3 h-3" />
                        <span>Add Custom</span>
                      </button>
                    )}
                  </div>

                  {/* Create New Module Banner Option (when search query matches no existing module) */}
                  {moduleSearchQuery.trim() && !masterModules.some(m => m.toLowerCase().trim() === moduleSearchQuery.trim().toLowerCase()) && (
                    <div className="p-2 bg-indigo-50/90 border border-indigo-200 rounded-xl flex items-center justify-between animate-fadeIn">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs">✨</span>
                        <span className="text-[11px] font-semibold text-indigo-950">
                          Create New Module: <strong className="font-bold underline decoration-indigo-300">"{moduleSearchQuery.trim()}"</strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCreateCustomModule(moduleSearchQuery)}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg shadow-xs transition"
                      >
                        + Create & Assign
                      </button>
                    </div>
                  )}
                </div>

                {/* Filtered Master Modules Grid with Custom Badges and Reordering */}
                <div className="max-h-44 overflow-y-auto pr-1 scrollbar-thin">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 pt-0.5">
                    {masterModules
                      .filter(mod => mod.toLowerCase().includes(moduleSearchQuery.toLowerCase().trim()))
                      .map((modName) => {
                        const isChecked = (formData.assignedModules || []).includes(modName);
                        const isCustom = customModulesList.includes(modName);
                        const assignedIndex = (formData.assignedModules || []).indexOf(modName);

                        return (
                          <div
                            key={modName}
                            className={`flex items-center justify-between p-1.5 rounded-xl border text-[11px] transition select-none ${
                              isChecked
                                ? "bg-indigo-50/80 border-indigo-200 text-indigo-950 font-bold shadow-2xs"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100/80"
                            }`}
                          >
                            <div
                              onClick={() => {
                                const current = formData.assignedModules || [];
                                if (current.includes(modName)) {
                                  setFormData({ ...formData, assignedModules: current.filter(m => m !== modName) });
                                } else {
                                  setFormData({ ...formData, assignedModules: [...current, modName] });
                                }
                              }}
                              className="flex items-center space-x-1.5 cursor-pointer flex-1 min-w-0"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                readOnly
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 pointer-events-none shrink-0"
                              />
                              <span className="truncate">{modName}</span>
                              {isCustom && (
                                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-extrabold rounded-md uppercase tracking-wider shrink-0 border border-amber-200">
                                  Custom
                                </span>
                              )}
                            </div>

                            {/* Up/Down Arrow Reordering Controls */}
                            {isChecked && (
                              <div className="flex items-center space-x-0.5 ml-1 shrink-0 text-[10px]">
                                <button
                                  type="button"
                                  title="Move Up"
                                  onClick={() => handleMoveModule(assignedIndex, "up")}
                                  disabled={assignedIndex <= 0}
                                  className="px-0.5 text-slate-400 hover:text-indigo-600 disabled:opacity-25 transition"
                                >
                                  ▲
                                </button>
                                <button
                                  type="button"
                                  title="Move Down"
                                  onClick={() => handleMoveModule(assignedIndex, "down")}
                                  disabled={assignedIndex >= (formData.assignedModules || []).length - 1}
                                  className="px-0.5 text-slate-400 hover:text-indigo-600 disabled:opacity-25 transition"
                                >
                                  ▼
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows="2"
                  placeholder="Provide brief notes on responsibilities..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition resize-none"
                />
              </div>
            </div>

            {/* Action Controls */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/10 transition disabled:opacity-50"
                >
                  {submitting && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingDept ? "Save Changes" : "Create Department"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Deactivate Confirmation Modal */}
      {isDeleteModalOpen && deletingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <TrashIcon className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Department?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete department <span className="font-bold text-slate-800">"{deletingDept.deptName}"</span> ({deletingDept.deptCode})?
              </p>
            </div>

            {deletingDept.assignedEmployeeCount > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2 text-left">
                <InformationCircleIcon className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong className="font-bold">{deletingDept.assignedEmployeeCount} active employee(s)</strong> are currently assigned to this department. Deletion will be blocked until staff are reassigned.
                </span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-center space-x-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-semibold rounded-xl shadow-md shadow-rose-600/10 transition disabled:opacity-50 inline-flex items-center space-x-1.5"
              >
                {submitting && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Department Details Modal */}
      {isViewModalOpen && viewingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold bg-indigo-50 border border-indigo-100 text-indigo-600 px-2 py-0.5 rounded">
                  {viewingDept.deptCode}
                </span>
                <h3 className="text-base font-bold text-slate-900">{viewingDept.deptName}</h3>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="text-slate-400 font-medium">Status</p>
                  <p className="font-bold text-slate-800 mt-0.5">{viewingDept.status}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Branch Location</p>
                  <p className="font-bold text-slate-800 mt-0.5">{viewingDept.branchDetails?.branchName || viewingDept.branch || "--"}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Head of Department</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {viewingDept.headEmployeeDetails
                      ? `${viewingDept.headEmployeeDetails.firstName} ${viewingDept.headEmployeeDetails.lastName}`
                      : viewingDept.head || "--"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Parent Department</p>
                  <p className="font-bold text-slate-800 mt-0.5">{viewingDept.parentDeptDetails?.deptName || viewingDept.parentDept || "None"}</p>
                </div>
              </div>

              <div>
                <p className="text-slate-400 font-medium mb-1">Description / Notes</p>
                <p className="text-slate-700 bg-white border border-slate-200 p-3 rounded-xl">
                  {viewingDept.description || "No detailed description registered for this department."}
                </p>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsViewModalOpen(false);
                  navigate(`/hr-hub?category=DEPARTMENT&tab=${encodeURIComponent(viewingDept.deptName || viewingDept.dept_name || viewingDept.name)}`);
                }}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>📊 Open {viewingDept.deptName || "Department"} Dashboard</span>
              </button>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Department;
