import React, { useState, useMemo } from "react";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  MinusIcon,
  ArrowPathIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  EyeIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { createTableRecord, updateTableRecord } from "../../services/hrApi";

// Custom Searchable Dropdown Select Component
const SearchableSelect = ({ label, options, value, onChange, placeholder, disabled, required, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  const filtered = options.filter(opt =>
    String(opt.label || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative space-y-1">
      <label className="block text-[10px] font-black uppercase text-slate-500">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-left flex justify-between items-center focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white disabled:bg-slate-100 disabled:opacity-60"
        >
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
          <span className="text-slate-400 text-[9px] ml-2">▼</span>
        </button>
        {isOpen && !disabled && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg p-2 space-y-2 max-h-60 overflow-y-auto">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="space-y-1">
              {filtered.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-50 transition ${
                    String(opt.value) === String(value) ? 'bg-indigo-50 text-indigo-755 font-bold' : 'text-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-[10px] text-slate-400 text-center py-2 font-medium">No matching options found</p>
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-[10px] text-rose-500 mt-1 font-bold">{error}</p>}
    </div>
  );
};

const OrganizationalChart = ({ dbData = {}, onRefreshData }) => {
  const employeesList = useMemo(() => dbData["Employee Profile"] || dbData["employee_profile"] || dbData["employees"] || [], [dbData]);
  const departmentsList = useMemo(() => dbData["Department"] || dbData["departments"] || dbData["department"] || [], [dbData]);
  const designationsList = useMemo(() => dbData["Designation"] || dbData["designations"] || dbData["designation"] || [], [dbData]);
  const businessUnitsList = useMemo(() => dbData["Business Unit"] || dbData["business_units"] || dbData["business_unit"] || [], [dbData]);

  // Controls State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("ALL");
  const [filterBu, setFilterBu] = useState("ALL");
  const [zoomScale, setZoomScale] = useState(1);
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());
  const [viewingEmployee, setViewingEmployee] = useState(null);
  
  // Custom Modal & Success banner states
  const [showAddRelationModal, setShowAddRelationModal] = useState(false);
  const [successBanner, setSuccessBanner] = useState("");
  
  // Modal Form State
  const initialForm = {
    employeeId: "",
    designation: "",
    department: "",
    reportingManagerId: "",
    businessUnitId: "",
    effectiveFrom: new Date().toISOString().split("T")[0],
    status: "Active"
  };
  const [formData, setFormData] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});

  // Compute node structures mapping manager relationships
  const nodes = useMemo(() => {
    return employeesList.map(emp => {
      const manager = employeesList.find(m => String(m.id) === String(emp.managerId || emp.manager_id));
      
      // Look up department details
      const deptObj = departmentsList.find(d => String(d.id) === String(emp.departmentId || emp.department_id));
      const deptName = deptObj ? (deptObj.deptName || deptObj.dept_name || deptObj.name) : (emp.department || "General");

      // Look up business unit details
      const buId = deptObj?.businessUnitId || deptObj?.business_unit_id || emp.businessUnitId || emp.business_unit_id || "";
      const buObj = businessUnitsList.find(b => String(b.id) === String(buId));
      const buName = buObj ? (buObj.buName || buObj.bu_name) : "";

      return {
        id: emp.id,
        name: emp.employeeName || emp.employee_name || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "Employee",
        designation: emp.designation || "Staff",
        departmentId: emp.departmentId || emp.department_id || "",
        department: deptName,
        businessUnitId: buId,
        businessUnit: buName,
        managerId: emp.managerId || emp.manager_id || null,
        managerName: manager ? (manager.employeeName || manager.employee_name) : "None",
        email: emp.email || "",
        phone: emp.phone || emp.mobile || "--",
        status: emp.status || "Active",
        employeeCode: emp.employeeCode || emp.empCode || "EMP-NIB"
      };
    });
  }, [employeesList, departmentsList, businessUnitsList]);

  // Traces tree data from root employees (managers without active supervisor nodes)
  const treeData = useMemo(() => {
    const nodeMap = new Map();
    const roots = [];

    nodes.forEach(node => {
      nodeMap.set(node.id, { ...node, children: [] });
    });

    nodes.forEach(node => {
      const mappedNode = nodeMap.get(node.id);
      const parentId = node.managerId;
      if (parentId && nodeMap.has(parentId)) {
        nodeMap.get(parentId).children.push(mappedNode);
      } else {
        roots.push(mappedNode);
      }
    });

    return roots;
  }, [nodes]);

  // Searches matches set for card highlights
  const searchMatches = useMemo(() => {
    if (!searchTerm.trim()) return new Set();
    const matched = new Set();
    nodes.forEach(node => {
      if (
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.department.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        matched.add(node.id);
      }
    });
    return matched;
  }, [nodes, searchTerm]);

  // Zoom controls
  const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.1, 1.5));
  const handleZoomOut = () => setZoomScale(prev => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => {
    setZoomScale(1);
    setCollapsedNodes(new Set());
  };

  const handleToggleCollapse = (nodeId) => {
    setCollapsedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setCollapsedNodes(new Set());
  };

  const handleCollapseAll = () => {
    const allParentIds = new Set();
    nodes.forEach(node => {
      if (node.managerId) {
        allParentIds.add(node.managerId);
      }
    });
    setCollapsedNodes(allParentIds);
  };

  const passesFilter = (node) => {
    const deptMatch = filterDept === "ALL" || String(node.departmentId) === String(filterDept);
    const buMatch = filterBu === "ALL" || String(node.businessUnitId) === String(filterBu);
    return deptMatch && buMatch;
  };

  // Open "Add Reporting Relationship" Modal
  const handleOpenAddRelationship = () => {
    setFormErrors({});
    setFormData(initialForm);
    setShowAddRelationModal(true);
  };

  // Auto-population logic when Employee is selected
  const handleSelectEmployee = (empId) => {
    const emp = nodes.find(n => String(n.id) === String(empId));
    if (emp) {
      setFormData({
        ...formData,
        employeeId: empId,
        designation: emp.designation,
        department: emp.department,
        businessUnitId: emp.businessUnitId
      });
    } else {
      setFormData({
        ...formData,
        employeeId: "",
        designation: "",
        department: "",
        businessUnitId: ""
      });
    }
  };

  // Validation Check
  const validateForm = () => {
    const errors = {};
    if (!formData.employeeId) {
      errors.employeeId = "Employee selection is required.";
    }
    if (!formData.reportingManagerId) {
      errors.reportingManagerId = "Reporting Manager selection is required.";
    }
    if (formData.employeeId && formData.reportingManagerId && String(formData.employeeId) === String(formData.reportingManagerId)) {
      errors.reportingManagerId = "An employee cannot report to themselves.";
    }
    if (!formData.effectiveFrom) {
      errors.effectiveFrom = "Effective From date is required.";
    }

    // Check manager active status
    const managerObj = nodes.find(n => String(n.id) === String(formData.reportingManagerId));
    if (managerObj && managerObj.status !== "Active") {
      errors.reportingManagerId = "Reporting Manager must be an active employee.";
    }

    // Validate that employee has only one active primary supervisor
    if (formData.employeeId && formData.status === "Active") {
      const activeDupe = nodes.find(n =>
        String(n.id) === String(formData.employeeId) &&
        n.managerId &&
        n.status === "Active"
      );
      if (activeDupe && activeDupe.managerId !== formData.reportingManagerId) {
        errors.employeeId = `This employee already reports to ${activeDupe.managerName}. Deactivate or edit their reporting details instead.`;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveRelationship = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const empObj = nodes.find(n => String(n.id) === String(formData.employeeId));
    const mgrObj = nodes.find(n => String(n.id) === String(formData.reportingManagerId));
    const buObj = businessUnitsList.find(b => String(b.id) === String(formData.businessUnitId));

    const payload = {
      employeeId: formData.employeeId,
      employee: empObj ? empObj.name : "",
      designationId: empObj ? employeesList.find(x => String(x.id) === String(empObj.id))?.designationId : "",
      designation: empObj ? empObj.designation : "",
      reportingManagerId: formData.reportingManagerId,
      reportingManager: mgrObj ? mgrObj.name : "",
      departmentId: empObj ? employeesList.find(x => String(x.id) === String(empObj.id))?.departmentId : "",
      department: empObj ? empObj.department : "",
      businessUnitId: formData.businessUnitId || null,
      businessUnit: buObj ? (buObj.buName || buObj.bu_name) : "",
      effectiveFrom: formData.effectiveFrom,
      status: formData.status
    };

    try {
      await createTableRecord("reporting_hierarchy", payload);
      
      // Sync local status message
      setSuccessBanner(`Successfully established reporting relationship: ${empObj.name} now reports to ${mgrObj.name}.`);
      setShowAddRelationModal(false);
      
      // Auto-hide success banner
      setTimeout(() => {
        setSuccessBanner("");
      }, 5000);

      // Refresh parent dataset
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setFormErrors({ submit: err.message || "Failed to create reporting relationship." });
    }
  };

  // Map employee options
  const employeeOptions = useMemo(() => {
    return nodes
      .filter(n => n.status === "Active")
      .map(n => ({
        value: n.id,
        label: `${n.name} (${n.employeeCode})`
      }));
  }, [nodes]);

  // Map manager options (cannot select themselves)
  const managerOptions = useMemo(() => {
    return nodes
      .filter(n => n.status === "Active" && String(n.id) !== String(formData.employeeId))
      .map(n => ({
        value: n.id,
        label: `${n.name} - ${n.designation} (${n.department})`
      }));
  }, [nodes, formData.employeeId]);

  // Recursive tree component node renderer
  const renderVisualNode = (node) => {
    const isCollapsed = collapsedNodes.has(node.id);
    const isMatch = searchMatches.has(node.id);
    const meetsFilter = passesFilter(node);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="flex flex-col items-center relative select-none">
        
        {/* Connector line above node */}
        <div className="h-4 w-0.5 bg-slate-350"></div>

        {/* Node card */}
        <div 
          className={`px-4 py-3 rounded-2xl border bg-white shadow-sm flex flex-col justify-between items-center text-center min-w-[210px] max-w-[240px] relative transition-all ${
            isMatch 
              ? "ring-2 ring-indigo-650 ring-offset-2 border-indigo-400" 
              : meetsFilter 
                ? "border-slate-200 hover:border-indigo-400 hover:shadow-md" 
                : "border-slate-200 opacity-40 hover:opacity-100"
          }`}
        >
          {/* Top colored badge */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-t-2xl"></div>

          {/* Node details */}
          <div className="flex flex-col items-center mt-1">
            {/* Avatar bubble */}
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs mb-2">
              {node.name.substring(0, 2).toUpperCase()}
            </div>
            
            <h5 className="font-extrabold text-[12px] text-slate-900 leading-tight">{node.name}</h5>
            <span className="text-[10px] font-black text-indigo-600 uppercase block mt-0.5 tracking-wider">
              {node.designation}
            </span>
            <span className="text-[9px] font-bold text-slate-450 uppercase mt-0.5 tracking-tight font-sans">
              {node.department}
            </span>
            
            {node.managerName && node.managerName !== "None" && (
              <span className="text-[8px] font-semibold text-slate-400 block mt-1.5">
                Reports to: <strong className="text-slate-500">{node.managerName}</strong>
              </span>
            )}
          </div>

          {/* Node Actions Row */}
          <div className="flex gap-2 justify-center border-t border-slate-100 mt-2.5 pt-2 w-full text-[10px] font-bold">
            <button 
              onClick={() => setViewingEmployee(node)}
              className="text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition"
              title="View Employee details"
            >
              <EyeIcon className="h-3.5 w-3.5" />
              <span>View Details</span>
            </button>
          </div>

          {/* Expand/Collapse Toggle Bubble */}
          {hasChildren && (
            <button 
              onClick={() => handleToggleCollapse(node.id)}
              className="absolute -bottom-2 w-4 h-4 bg-white border border-slate-300 rounded-full flex items-center justify-center hover:bg-slate-50 hover:border-slate-400 shadow-xs cursor-pointer focus:outline-none"
            >
              <span className="text-[9px] font-black text-slate-655 leading-none">
                {isCollapsed ? "+" : "-"}
              </span>
            </button>
          )}
        </div>

        {/* Connector line below node & children list */}
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col items-center">
            {/* Stem line down */}
            <div className="h-4 w-0.5 bg-slate-350"></div>
            
            {/* Horizontal line mapping width of children */}
            {node.children.length > 1 && (
              <div className="h-0.5 bg-slate-350 w-full relative" style={{ width: `calc(100% - ${240 / node.children.length}px)` }}></div>
            )}
            
            {/* Children grid row */}
            <div className="flex gap-6 justify-center items-start pt-0">
              {node.children.map(child => renderVisualNode(child))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Success Banner */}
      {successBanner && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-4 rounded-2xl font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircleIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs gap-4 font-sans">
        <div>
          <span className="text-[10px] text-indigo-600 block font-bold uppercase tracking-wider">Organization Setup &gt; Organizational Chart</span>
          <h2 className="text-lg font-black text-slate-900 mt-1">Organizational Chart</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">View the organization's structure and employee reporting relationships.</p>
        </div>
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <button 
            onClick={handleOpenAddRelationship}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Reporting Relationship</span>
          </button>
        </div>
      </div>

      {/* 2. Control Toolbar Panel */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/85 shadow-xs space-y-4">
        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <FunnelIcon className="h-4 w-4 text-slate-400" />
          Interactive Navigation Toolbar
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end pt-1">
          {/* Search Box */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Highlight Employee</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
              </span>
              <input 
                type="text"
                placeholder="Highlight by name, designation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Department Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Department</label>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">All Departments</option>
              {departmentsList.map(d => (
                <option key={d.id} value={d.id}>{d.deptName || d.dept_name || d.name}</option>
              ))}
            </select>
          </div>

          {/* Business Unit Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Business Unit</label>
            <select
              value={filterBu}
              onChange={(e) => setFilterBu(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">All Business Units</option>
              {businessUnitsList.map(b => (
                <option key={b.id} value={b.id}>{b.buName || b.bu_name}</option>
              ))}
            </select>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1.5 h-9 justify-end pb-0.5">
            <button 
              onClick={handleZoomOut}
              className="p-2 border rounded-xl hover:bg-slate-50 transition"
              title="Zoom Out"
            >
              <MinusIcon className="w-4 h-4 text-slate-650" />
            </button>
            <span className="text-xs font-mono font-bold text-slate-500 min-w-[40px] text-center">
              {Math.round(zoomScale * 100)}%
            </span>
            <button 
              onClick={handleZoomIn}
              className="p-2 border rounded-xl hover:bg-slate-50 transition"
              title="Zoom In"
            >
              <PlusIcon className="w-4 h-4 text-slate-650" />
            </button>
            <button 
              onClick={handleResetZoom}
              className="p-2 border rounded-xl hover:bg-slate-50 text-indigo-600 transition"
              title="Reset View"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global tree actions */}
        <div className="flex gap-2 pt-1 border-t border-slate-100 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
          <button onClick={handleExpandAll} className="hover:text-indigo-650 flex items-center gap-1">
            <ArrowsPointingOutIcon className="w-4 h-4" />
            <span>Expand All Nodes</span>
          </button>
          <span className="text-slate-300">|</span>
          <button onClick={handleCollapseAll} className="hover:text-indigo-650 flex items-center gap-1">
            <ArrowsPointingInIcon className="w-4 h-4" />
            <span>Collapse All Nodes</span>
          </button>
        </div>
      </div>

      {/* 3. Visual Tree Workspace Board */}
      <div className="bg-slate-50/50 border border-slate-200 rounded-3xl p-6 shadow-inner overflow-auto min-h-[550px] flex items-start justify-center relative">
        <div 
          className="origin-top transition-transform duration-150 flex flex-col items-center gap-2"
          style={{ transform: `scale(${zoomScale})` }}
        >
          {treeData.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-medium">
              No employee relationships defined. Set reporting relations inside the popup form.
            </div>
          ) : (
            <div className="flex gap-16 justify-center items-start pt-4">
              {treeData.map(root => (
                <div key={root.id} className="flex flex-col items-center">
                  {/* Root Node card */}
                  <div className="px-4 py-3 rounded-2xl border bg-slate-900 text-white shadow flex flex-col justify-between items-center text-center min-w-[210px] max-w-[240px] relative border-slate-800">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 font-bold flex items-center justify-center text-xs mb-2">
                      {root.name.substring(0, 2).toUpperCase()}
                    </div>
                    <h5 className="font-extrabold text-[12px] text-white leading-tight">{root.name}</h5>
                    <span className="text-[10px] font-black text-indigo-400 uppercase block mt-0.5 tracking-wider">
                      {root.designation}
                    </span>
                    <span className="text-[9px] font-bold text-slate-450 uppercase mt-0.5 tracking-tight font-sans">
                      {root.department}
                    </span>
                    <div className="flex gap-2 justify-center border-t border-slate-800 mt-2.5 pt-2 w-full text-[10px] font-bold">
                      <button 
                        onClick={() => setViewingEmployee(root)}
                        className="text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition"
                      >
                        <EyeIcon className="h-3.5 w-3.5" />
                        <span>Details</span>
                      </button>
                    </div>
                    {root.children && root.children.length > 0 && (
                      <button 
                        onClick={() => handleToggleCollapse(root.id)}
                        className="absolute -bottom-2 w-4 h-4 bg-slate-900 border border-slate-700 rounded-full flex items-center justify-center hover:bg-slate-850 shadow-xs cursor-pointer focus:outline-none"
                      >
                        <span className="text-[9px] font-black text-indigo-400 leading-none">
                          {collapsedNodes.has(root.id) ? "+" : "-"}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Render children of root */}
                  {root.children && root.children.length > 0 && !collapsedNodes.has(root.id) && (
                    <div className="flex flex-col items-center">
                      <div className="h-4 w-0.5 bg-slate-350"></div>
                      {root.children.length > 1 && (
                        <div className="h-0.5 bg-slate-350 w-full relative" style={{ width: `calc(100% - ${240 / root.children.length}px)` }}></div>
                      )}
                      <div className="flex gap-8 justify-center items-start">
                        {root.children.map(child => renderVisualNode(child))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Add Reporting Relationship Modal Popup */}
      {showAddRelationModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Add Reporting Relationship</h3>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5 tracking-wider">Define who the employee reports to in the organization.</p>
              </div>
              <button onClick={() => setShowAddRelationModal(false)} className="p-1 text-slate-400 hover:text-slate-650 rounded-lg">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {formErrors.submit && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs p-3.5 rounded-xl font-bold">
                ⚠️ {formErrors.submit}
              </div>
            )}

            <form onSubmit={handleSaveRelationship} className="space-y-4 font-sans">
              
              {/* 1. Searchable Employee Dropdown */}
              <SearchableSelect
                label="Employee"
                required={true}
                placeholder="Search and select employee..."
                options={employeeOptions}
                value={formData.employeeId}
                onChange={handleSelectEmployee}
                error={formErrors.employeeId}
              />

              <div className="grid grid-cols-2 gap-4">
                {/* 2. Designation (Read Only) */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Designation</label>
                  <input
                    type="text"
                    readOnly
                    placeholder="Auto-populated"
                    value={formData.designation}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 focus:outline-none"
                  />
                </div>

                {/* 3. Department (Read Only) */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Department</label>
                  <input
                    type="text"
                    readOnly
                    placeholder="Auto-populated"
                    value={formData.department}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* 4. Searchable Reporting Manager Dropdown */}
              <SearchableSelect
                label="Reporting Manager"
                required={true}
                placeholder="Search and select manager..."
                options={managerOptions}
                value={formData.reportingManagerId}
                onChange={(val) => setFormData({ ...formData, reportingManagerId: val })}
                error={formErrors.reportingManagerId}
              />

              {/* 5. Business Unit selection */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Business Unit</label>
                <select
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

              <div className="grid grid-cols-2 gap-4">
                {/* 6. Effective From */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Effective From <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={formData.effectiveFrom}
                    onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-855 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                  {formErrors.effectiveFrom && <p className="text-[10px] text-rose-550 mt-1 font-bold">{formErrors.effectiveFrom}</p>}
                </div>

                {/* 7. Status */}
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
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddRelationModal(false)}
                  className="px-4 py-2 text-xs font-black border rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition rounded-xl"
                >
                  Save Relationship
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Employee View Details Modal */}
      {viewingEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-150 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in-95 duration-200 font-sans">
            
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] font-black text-slate-400 uppercase tracking-wider">Employee details node</span>
                <h4 className="text-sm font-black text-slate-900 mt-0.5">{viewingEmployee.name}</h4>
              </div>
              <button 
                onClick={() => setViewingEmployee(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-750 transition"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 border-b pb-4">
                <div className="w-14 h-14 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center text-lg font-black">
                  {viewingEmployee.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-slate-900 leading-tight">{viewingEmployee.name}</h4>
                  <span className="text-xs font-black text-indigo-600 uppercase block mt-0.5 tracking-wider">{viewingEmployee.designation}</span>
                  <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{viewingEmployee.employeeCode}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Department</span>
                  <p className="text-slate-800 font-bold text-sm">{viewingEmployee.department}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Reporting Manager</span>
                  <p className="text-indigo-750 font-bold text-sm">{viewingEmployee.managerName || "None"}</p>
                </div>
                {viewingEmployee.businessUnit && (
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Business Unit</span>
                    <p className="text-slate-800 font-bold text-sm">{viewingEmployee.businessUnit}</p>
                  </div>
                )}
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Email Address</span>
                  <p className="text-slate-800 font-bold font-mono">{viewingEmployee.email || "--"}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Phone Number</span>
                  <p className="text-slate-800 font-bold font-mono">{viewingEmployee.phone}</p>
                </div>
                <div className="col-span-2 space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Status</span>
                  <div className="mt-1">
                    <span className="px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-[9px] font-black border uppercase tracking-wider">
                      {viewingEmployee.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex justify-end">
              <button
                onClick={() => setViewingEmployee(null)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-black transition"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationalChart;
