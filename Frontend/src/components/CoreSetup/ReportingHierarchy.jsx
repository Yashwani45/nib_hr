import React, { useState, useMemo } from "react";
import {
  ListBulletIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TrashIcon,
  PencilSquareIcon,
  EyeIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  UserIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";
import { createTableRecord, updateTableRecord, deleteTableRecord } from "../../services/hrApi";

const ReportingHierarchy = ({ records = [], dbData = {}, onRefreshData }) => {
  const employeesList = useMemo(() => dbData["Employee Profile"] || dbData["employee_profile"] || dbData["employees"] || [], [dbData]);
  const departmentsList = useMemo(() => dbData["Department"] || dbData["departments"] || dbData["department"] || [], [dbData]);
  const designationsList = useMemo(() => dbData["Designation"] || dbData["designations"] || dbData["designation"] || [], [dbData]);
  const businessUnitsList = useMemo(() => dbData["Business Unit"] || dbData["business_units"] || dbData["business_unit"] || [], [dbData]);

  // Sync state with records from backend
  const dataList = useMemo(() => {
    return records.map((r) => {
      const emp = employeesList.find(e => String(e.id) === String(r.employeeId || r.employee_id));
      const empName = emp ? (emp.employeeName || emp.employee_name) : (r.employeeName || r.employee || "Unknown");

      const mgr = employeesList.find(e => String(e.id) === String(r.reportingManagerId || r.reporting_manager_id));
      const mgrName = mgr ? (mgr.employeeName || mgr.employee_name) : (r.reportingManager || r.manager || "CEO / None");

      const dept = departmentsList.find(d => String(d.id) === String(r.departmentId || r.department_id));
      const deptName = dept ? (dept.deptName || dept.dept_name || dept.name) : (r.department || "--");

      const desig = designationsList.find(d => String(d.id) === String(r.designationId || r.designation_id));
      const desigName = desig ? (desig.desigName || desig.desig_name || desig.title) : (r.designation || "--");

      const bu = businessUnitsList.find(b => String(b.id) === String(r.businessUnitId || r.business_unit_id));
      const buName = bu ? (bu.buName || bu.bu_name) : (r.businessUnit || "--");

      return {
        id: r.id,
        employeeId: r.employeeId || r.employee_id || "",
        employee: empName,
        designationId: r.designationId || r.designation_id || "",
        designation: desigName,
        reportingManagerId: r.reportingManagerId || r.reporting_manager_id || "",
        manager: mgrName,
        departmentId: r.departmentId || r.department_id || "",
        department: deptName,
        businessUnitId: r.businessUnitId || r.business_unit_id || "",
        businessUnit: buName,
        effectiveFrom: r.effectiveFrom || r.effective_from || "",
        status: r.status || "Active"
      };
    });
  }, [records, employeesList, departmentsList, designationsList, businessUnitsList]);

  // Tab mode state: "table" or "tree"
  const [viewTab, setViewTab] = useState("table");

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("ALL");
  const [filterBu, setFilterBu] = useState("ALL");
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
    employeeId: "",
    designationId: "",
    reportingManagerId: "",
    departmentId: "",
    businessUnitId: "",
    effectiveFrom: new Date().toISOString().split("T")[0],
    status: "Active"
  };
  const [formData, setFormData] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});

  // Filtered List
  const filteredRecords = useMemo(() => {
    return dataList.filter(item => {
      const matchSearch =
        (item.employee || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.manager || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.designation || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = filterDept === "ALL" || String(item.departmentId) === String(filterDept);
      const matchBu = filterBu === "ALL" || String(item.businessUnitId) === String(filterBu);
      const matchStatus = filterStatus === "ALL" || item.status === filterStatus;

      return matchSearch && matchDept && matchBu && matchStatus;
    });
  }, [dataList, searchTerm, filterDept, filterBu, filterStatus]);

  // Tree View Computation: trace parent-child paths starting from CEO nodes
  const hierarchyTree = useMemo(() => {
    const activeReps = dataList.filter(d => d.status === "Active");
    const empMap = new Map();
    const roots = [];

    // Map all active employees
    activeReps.forEach(rep => {
      empMap.set(rep.employeeId, { ...rep, children: [] });
    });

    // Populate children lists and identify root nodes (nodes with no active manager in map)
    activeReps.forEach(rep => {
      const node = empMap.get(rep.employeeId);
      const managerId = rep.reportingManagerId;
      if (managerId && empMap.has(managerId)) {
        empMap.get(managerId).children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [dataList]);

  // Pagination Logic
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage]);

  // Open Handlers
  const handleOpenAdd = () => {
    setEditingRecord(null);
    setFormErrors({});
    setFormData(initialForm);
    setShowAddModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingRecord(item);
    setFormErrors({});
    setFormData({
      employeeId: item.employeeId,
      designationId: item.designationId,
      reportingManagerId: item.reportingManagerId,
      departmentId: item.departmentId,
      businessUnitId: item.businessUnitId,
      effectiveFrom: item.effectiveFrom,
      status: item.status
    });
    setShowAddModal(true);
  };

  // Form Submissions
  const validateForm = () => {
    const errors = {};
    if (!formData.employeeId) {
      errors.employeeId = "Employee is required.";
    }

    if (!formData.designationId) {
      errors.designationId = "Designation is required.";
    }

    if (!formData.departmentId) {
      errors.departmentId = "Department is required.";
    }

    if (!formData.businessUnitId) {
      errors.businessUnitId = "Business Unit is required.";
    }

    if (!formData.effectiveFrom) {
      errors.effectiveFrom = "Effective From date is required.";
    }

    // Rules:
    // 1. Employee cannot report to themselves
    if (formData.employeeId && formData.reportingManagerId && String(formData.employeeId) === String(formData.reportingManagerId)) {
      errors.reportingManagerId = "An employee cannot report to themselves.";
    }

    // 2. Primary reporting manager uniqueness: verify that they don't have another active record
    if (formData.employeeId && formData.status === "Active") {
      const activeDupe = dataList.find(d =>
        String(d.employeeId) === String(formData.employeeId) &&
        d.status === "Active" &&
        (!editingRecord || d.id !== editingRecord.id)
      );
      if (activeDupe) {
        errors.employeeId = `This employee already has an active primary reporting manager setup (${activeDupe.manager}). Deactivate the existing setup first.`;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const empObj = employeesList.find(e => String(e.id) === String(formData.employeeId));
    const mgrObj = employeesList.find(e => String(e.id) === String(formData.reportingManagerId));
    const deptObj = departmentsList.find(d => String(d.id) === String(formData.departmentId));
    const desigObj = designationsList.find(d => String(d.id) === String(formData.designationId));
    const buObj = businessUnitsList.find(b => String(b.id) === String(formData.businessUnitId));

    const payload = {
      employeeId: formData.employeeId,
      employee: empObj ? (empObj.employeeName || empObj.employee_name) : "",
      designationId: formData.designationId,
      designation: desigObj ? (desigObj.desigName || desigObj.desig_name || desigObj.title) : "",
      reportingManagerId: formData.reportingManagerId || null,
      reportingManager: mgrObj ? (mgrObj.employeeName || mgrObj.employee_name) : "None",
      departmentId: formData.departmentId,
      department: deptObj ? (deptObj.deptName || deptObj.dept_name || deptObj.name) : "",
      businessUnitId: formData.businessUnitId,
      businessUnit: buObj ? (buObj.buName || buObj.bu_name) : "",
      effectiveFrom: formData.effectiveFrom,
      status: formData.status
    };

    try {
      if (editingRecord) {
        await updateTableRecord("reporting_hierarchy", editingRecord.id, payload);
      } else {
        await createTableRecord("reporting_hierarchy", payload);
      }
      setShowAddModal(false);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setFormErrors({ submit: err.message || "Failed to save reporting hierarchy record." });
    }
  };

  const handleToggleStatusConfirm = async () => {
    if (!statusConfirmRecord) return;
    const newStatus = statusConfirmRecord.status === "Active" ? "Inactive" : "Active";
    
    try {
      await updateTableRecord("reporting_hierarchy", statusConfirmRecord.id, {
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
      await deleteTableRecord("reporting_hierarchy", deletingRecord.id);
      setDeletingRecord(null);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Error deleting record: " + err.message);
    }
  };

  // Helper to recursively render hierarchy node trees
  const renderTreeNode = (node, depth = 0) => {
    return (
      <div key={node.id} className="flex flex-col items-start pl-6 border-l border-indigo-100 mt-3 ml-2 relative">
        <div className="absolute top-3 left-0 w-4 border-t border-indigo-150"></div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-xs max-w-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold font-sans text-xs">
            {node.employee.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h5 className="font-extrabold text-[12px] text-slate-800">{node.employee}</h5>
            <span className="text-[10px] font-bold text-indigo-600 uppercase block mt-0.5 tracking-wider">
              {node.designation}
            </span>
            <span className="text-[9px] text-slate-400 font-medium block">
              {node.department} | {node.businessUnit}
            </span>
          </div>
        </div>
        {node.children && node.children.length > 0 && (
          <div className="space-y-1">
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs gap-4 font-sans">
        <div>
          <span className="text-[10px] text-indigo-600 block font-bold uppercase tracking-wider">Organization Setup &gt; Reporting Hierarchy</span>
          <h2 className="text-lg font-black text-slate-900 mt-1">Reporting Hierarchy</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Define employee reporting relationships and management structure.</p>
        </div>
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <button 
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Relationship</span>
          </button>
        </div>
      </div>

      {/* 2. Visual Toggle controls */}
      <div className="flex bg-slate-100/60 p-1 rounded-xl w-fit border border-slate-200/50">
        <button
          onClick={() => setViewTab("table")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
            viewTab === "table" ? "bg-white text-indigo-650 shadow-xs border" : "text-slate-650 hover:bg-slate-200/55"
          }`}
        >
          📋 Table View
        </button>
        <button
          onClick={() => setViewTab("tree")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
            viewTab === "tree" ? "bg-white text-indigo-650 shadow-xs border" : "text-slate-650 hover:bg-slate-200/55"
          }`}
        >
          🌲 Tree View
        </button>
      </div>

      {viewTab === "table" ? (
        <>
          {/* 3. Search & Filter box */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 font-sans">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <FunnelIcon className="h-4 w-4 text-slate-400" />
              Filter Configuration
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Search Employee</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
                  </span>
                  <input 
                    type="text"
                    placeholder="Search by name / title..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

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

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Business Unit</label>
                <select
                  value={filterBu}
                  onChange={(e) => {
                    setFilterBu(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="ALL">All Business Units</option>
                  {businessUnitsList.map(b => (
                    <option key={b.id} value={b.id}>{b.buName || b.bu_name}</option>
                  ))}
                </select>
              </div>

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

          {/* 4. Table Board */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex border-b pb-4 items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                📋 Hierarchy Records List
              </h3>
              <span className="text-[11px] font-bold text-slate-400">Total matched: {filteredRecords.length} records</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="min-w-full divide-y divide-slate-150 text-left">
                <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-4">Employee</th>
                    <th scope="col" className="px-6 py-4">Designation</th>
                    <th scope="col" className="px-6 py-4">Department</th>
                    <th scope="col" className="px-6 py-4">Reporting Manager</th>
                    <th scope="col" className="px-6 py-4">Business Unit</th>
                    <th scope="col" className="px-6 py-4">Effective From</th>
                    <th scope="col" className="px-6 py-4 text-center">Status</th>
                    <th scope="col" className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700 bg-white">
                  {paginatedRecords.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/40 transition">
                      <td className="px-6 py-4 font-bold text-slate-900">{item.employee}</td>
                      <td className="px-6 py-4 text-slate-650">{item.designation}</td>
                      <td className="px-6 py-4 text-slate-650">{item.department}</td>
                      <td className="px-6 py-4 text-indigo-700 font-bold">{item.manager || "CEO / None"}</td>
                      <td className="px-6 py-4 text-slate-650">{item.businessUnit}</td>
                      <td className="px-6 py-4 font-medium font-mono text-slate-450">{item.effectiveFrom}</td>
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
                            title="Edit Relationship"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingRecord(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                            title="Delete Relationship"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400 font-medium">
                        No hierarchy relationships matched the filters.
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
        </>
      ) : (
        /* Tree view rendering recursively */
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs min-h-[500px]">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b pb-3 mb-4">
            🌲 Interactive Reporting Tree Layout
          </h3>
          {hierarchyTree.length === 0 ? (
            <div className="text-center py-16 text-slate-400 font-medium">
              No active reporting relationships defined yet.
            </div>
          ) : (
            <div className="space-y-4">
              {hierarchyTree.map(root => renderTreeNode(root))}
            </div>
          )}
        </div>
      )}

      {/* 5. Add / Edit Modal Drawer */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingRecord ? "Edit Reporting Relationship" : "Add Reporting Relationship"}
                </h3>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5 tracking-wider">Configure organization managers</p>
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
                {/* Employee Selection */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Employee <span className="text-rose-500">*</span></label>
                  <select
                    required
                    disabled={!!editingRecord}
                    value={formData.employeeId}
                    onChange={(e) => {
                      const empId = e.target.value;
                      const empObj = employeesList.find(x => String(x.id) === String(empId));
                      // Prefill designation and department based on selected employee if available
                      setFormData({
                        ...formData,
                        employeeId: empId,
                        departmentId: empObj?.departmentId || empObj?.department_id || formData.departmentId,
                        designationId: empObj?.designationId || empObj?.designation_id || formData.designationId
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:outline-none disabled:bg-slate-100 disabled:opacity-60"
                  >
                    <option value="">Select Employee</option>
                    {employeesList.map(e => (
                      <option key={e.id} value={e.id}>{e.employeeName || e.employee_name} ({e.employeeCode || e.empCode || "No Code"})</option>
                    ))}
                  </select>
                  {formErrors.employeeId && <p className="text-[10px] text-rose-550 mt-1 font-bold">{formErrors.employeeId}</p>}
                </div>

                {/* Designation selection */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Designation <span className="text-rose-500">*</span></label>
                  <select
                    required
                    value={formData.designationId}
                    onChange={(e) => setFormData({ ...formData, designationId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  >
                    <option value="">Select Designation</option>
                    {designationsList.map(d => (
                      <option key={d.id} value={d.id}>{d.desigName || d.desig_name || d.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Department */}
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
                </div>

                {/* Business Unit */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Business Unit <span className="text-rose-500">*</span></label>
                  <select
                    required
                    value={formData.businessUnitId}
                    onChange={(e) => setFormData({ ...formData, businessUnitId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  >
                    <option value="">Select Business Unit</option>
                    {businessUnitsList.map(b => (
                      <option key={b.id} value={b.id}>{b.buName || b.bu_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Reporting Manager selection */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Reporting Manager</label>
                  <select
                    value={formData.reportingManagerId}
                    onChange={(e) => setFormData({ ...formData, reportingManagerId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  >
                    <option value="">None (CEO / Executive level)</option>
                    {employeesList
                      .filter(e => String(e.id) !== String(formData.employeeId)) // cannot report to self
                      .map(e => (
                        <option key={e.id} value={e.id}>{e.employeeName || e.employee_name} ({e.email})</option>
                      ))}
                  </select>
                  {formErrors.reportingManagerId && <p className="text-[10px] text-rose-550 mt-1 font-bold">{formErrors.reportingManagerId}</p>}
                </div>

                {/* Effective From */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Effective From <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={formData.effectiveFrom}
                    onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
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

              {/* Buttons */}
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
                  {editingRecord ? "Save Changes" : "Assign Manager"}
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
                <span className="font-mono text-[10px] font-black text-slate-400 uppercase tracking-wider">Hierarchy Record</span>
                <h4 className="text-sm font-black text-slate-900 mt-0.5">{viewingRecord.employee}</h4>
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
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Employee</span>
                  <p className="font-bold text-slate-800 text-sm">{viewingRecord.employee}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Designation</span>
                  <p className="font-black text-slate-800 text-sm">{viewingRecord.designation}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Reporting Manager</span>
                  <p className="text-indigo-750 font-bold text-sm">{viewingRecord.manager || "CEO / None"}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Department</span>
                  <p className="text-slate-700 font-bold">{viewingRecord.department}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Business Unit</span>
                  <p className="text-slate-700 font-bold">{viewingRecord.businessUnit}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Effective Date</span>
                  <p className="text-slate-700 font-bold font-mono">{viewingRecord.effectiveFrom}</p>
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
              {statusConfirmRecord.status === "Active" ? "Deactivate Hierarchy Record?" : "Activate Hierarchy Record?"}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to change the status of the relationship for <strong>{statusConfirmRecord.employee}</strong> to{" "}
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
            <h3 className="text-base font-bold text-slate-900">Delete Hierarchy Assignment?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete this manager assignment? This action cannot be undone.
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

export default ReportingHierarchy;
