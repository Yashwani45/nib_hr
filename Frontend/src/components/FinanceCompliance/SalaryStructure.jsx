import React, { useState, useEffect } from "react";
import { apiFetch } from "../../services/hrApi";
import {
  PlusIcon,
  TrashIcon,
  CalculatorIcon,
  CheckBadgeIcon,
  ArchiveBoxIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  EyeIcon,
  MagnifyingGlassIcon
} from "@heroicons/react/24/outline";

const DEFAULT_COMPONENTS = [
  { name: "Basic Salary", code: "BASIC", type: "Earning", category: "Earning", calculationType: "Percentage", value: "50", calculationBase: "Gross", referenceComponent: "Gross", frequency: "Monthly", isStatutory: false },
  { name: "HRA", code: "HRA", type: "Earning", category: "Earning", calculationType: "Percentage", value: "40", calculationBase: "Basic", referenceComponent: "Basic", frequency: "Monthly", isStatutory: false },
  { name: "Dearness Allowance (DA)", code: "DA", type: "Earning", category: "Earning", calculationType: "Fixed", value: "0", calculationBase: "Basic", referenceComponent: "Basic", frequency: "Monthly", isStatutory: false },
  { name: "Conveyance Allowance", code: "CONVEYANCE", type: "Earning", category: "Earning", calculationType: "Fixed", value: "0", calculationBase: "Gross", frequency: "Monthly", isStatutory: false },
  { name: "Medical Allowance", code: "MEDICAL", type: "Earning", category: "Earning", calculationType: "Fixed", value: "0", calculationBase: "Gross", frequency: "Monthly", isStatutory: false },
  { name: "Special Allowance", code: "SPECIAL", type: "Earning", category: "Earning", calculationType: "Fixed", value: "0", calculationBase: "Gross", frequency: "Monthly", isStatutory: false },
  { name: "Other Allowance", code: "OTHER_ALLOWANCE", type: "Earning", category: "Earning", calculationType: "Fixed", value: "0", calculationBase: "Gross", frequency: "Monthly", isStatutory: false }
];

const todayDateString = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const SalaryStructure = ({ onRefreshData, dbData }) => {
  const [structures, setStructures] = useState([]);
  const [employees, setEmployees] = useState(() => {
    if (dbData) {
      const initEmps = dbData["Employee List"] || dbData["employees"] || dbData["Employee Profile"] || [];
      if (Array.isArray(initEmps) && initEmps.length > 0) return initEmps;
    }
    return [];
  });
  const [departments, setDepartments] = useState(() => {
    if (dbData) {
      const initDepts = dbData["Department"] || dbData["departments"] || dbData["Departments"] || [];
      if (Array.isArray(initDepts) && initDepts.length > 0) return initDepts;
    }
    return [];
  });
  const [designations, setDesignations] = useState(() => {
    if (dbData) {
      const initDesigs = dbData["Designation"] || dbData["designations"] || dbData["Designation Master"] || [];
      if (Array.isArray(initDesigs) && initDesigs.length > 0) return initDesigs;
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortKey, setSortKey] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [activeView, setActiveView] = useState("list"); // 'list' | 'create' | 'edit' | 'assign'
  const [editingStructureId, setEditingStructureId] = useState(null);

  useEffect(() => {
    if (dbData) {
      const hubEmps = dbData["Employee List"] || dbData["employees"] || dbData["Employee Profile"] || [];
      if (Array.isArray(hubEmps) && hubEmps.length > 0 && employees.length === 0) {
        setEmployees(hubEmps);
      }
      const hubDepts = dbData["Department"] || dbData["departments"] || dbData["Departments"] || [];
      if (Array.isArray(hubDepts) && hubDepts.length > 0 && departments.length === 0) {
        setDepartments(hubDepts);
      }
      const hubDesigs = dbData["Designation"] || dbData["designations"] || dbData["Designation Master"] || [];
      if (Array.isArray(hubDesigs) && hubDesigs.length > 0 && designations.length === 0) {
        setDesignations(hubDesigs);
      }
    }
  }, [dbData]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState("active"); // 'all' | 'active' | 'archived'

  // Structure Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [departmentIds, setDepartmentIds] = useState([]);
  const [designationIds, setDesignationIds] = useState([]);
  const [grade, setGrade] = useState("Band A");
  const [employmentCategory, setEmploymentCategory] = useState("Full-Time");
  const [referenceSalaryType, setReferenceSalaryType] = useState("Monthly Gross");
  const [structureEffectiveFrom, setStructureEffectiveFrom] = useState(todayDateString());
  const [structureEffectiveTo, setStructureEffectiveTo] = useState("");
  const [components, setComponents] = useState(DEFAULT_COMPONENTS);

  // Instant Calculation Preview State
  const [previewGross, setPreviewGross] = useState("50000");
  const [previewEmployeeId, setPreviewEmployeeId] = useState("");
  const [previewResult, setPreviewResult] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  // Assignment Form State
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedStructure, setSelectedStructure] = useState("");
  const [applicableStructures, setApplicableStructures] = useState([]);
  const [applicableStructuresError, setApplicableStructuresError] = useState("");
  const [applicableStructuresLoading, setApplicableStructuresLoading] = useState(false);
  const [baseGross, setBaseGross] = useState("50000");
  const [effectiveFrom, setEffectiveFrom] = useState(todayDateString());
  const [revisionReason, setRevisionReason] = useState("");
  const [employeeSalaryHistory, setEmployeeSalaryHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const selectedStructureDetails = structures.find(structure => structure.id === selectedStructure);
  const sortedStructures = [...structures].sort((left, right) => {
    const a = String(left[sortKey] ?? "").toLowerCase();
    const b = String(right[sortKey] ?? "").toLowerCase();
    return a.localeCompare(b) * (sortDirection === "asc" ? 1 : -1);
  });
  const toggleSort = key => {
    if (sortKey === key) setSortDirection(direction => direction === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  // Selected structure details modal
  const [viewModalStructure, setViewModalStructure] = useState(null);

  // Quick Add Department State
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptCode, setNewDeptCode] = useState("");
  const [addingDept, setAddingDept] = useState(false);

  const handleQuickAddDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) {
      alert("Department Name is required");
      return;
    }
    setAddingDept(true);
    try {
      const code = newDeptCode.trim() || `DEP-${newDeptName.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)}`;
      const res = await apiFetch("/api/table/departments", {
        method: "POST",
        body: JSON.stringify({
          dept_name: newDeptName.trim(),
          dept_code: code,
          status: "Active"
        })
      });
      const created = res?.data || res;
      if (created) {
        const updated = [...departments, created];
        setDepartments(updated);
        setDepartmentIds([created.id || code]);
        setShowAddDeptModal(false);
        setNewDeptName("");
        setNewDeptCode("");
        alert(`Department "${newDeptName.trim()}" added and selected!`);
      }
    } catch (err) {
      alert("Failed to add department: " + err.message);
    } finally {
      setAddingDept(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const empRes = await apiFetch("/api/table/employees");
      const list = Array.isArray(empRes) ? empRes : (empRes?.data || []);
      if (Array.isArray(list) && list.length > 0) {
        setEmployees(list);
      }
    } catch (e) {
      console.warn("Error fetching employees for salary structure:", e);
    }
  };

  const loadDepartments = async () => {
    try {
      const deptRes = await apiFetch("/api/table/departments");
      const list = Array.isArray(deptRes) ? deptRes : (deptRes?.data || []);
      if (Array.isArray(list) && list.length > 0) {
        setDepartments(list);
      }
    } catch (e) {
      console.warn("Error fetching departments for salary structure:", e);
    }
  };

  const loadDesignations = async () => {
    try {
      const desigRes = await apiFetch("/api/table/designations");
      const list = Array.isArray(desigRes) ? desigRes : (desigRes?.data || []);
      if (Array.isArray(list) && list.length > 0) {
        setDesignations(list);
      }
    } catch (e) {
      console.warn("Error fetching designations for salary structure:", e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const q = new URLSearchParams({
        isActive: filterStatus === "all" ? "" : filterStatus === "active" ? "true" : "false",
        search: searchQuery,
        departmentId: filterDept,
        page: String(currentPage),
        limit: "20"
      }).toString();

      await Promise.allSettled([
        apiFetch(`/api/finance/salary-structures?${q}`).then(res => {
          if (res?.data) {
            setStructures(res.data.records || res.data || []);
            setTotalPages(res.data.totalPages || 1);
          }
        }).catch(err => {
          setLoadError(err.message || "Failed loading salary structures.");
          console.warn("Failed loading structures:", err);
        }),

        apiFetch("/api/table/employees").then(res => {
          const list = Array.isArray(res) ? res : (res?.data || []);
          if (Array.isArray(list) && list.length > 0) setEmployees(list);
        }).catch(err => console.warn("Failed loading employees:", err)),

        apiFetch("/api/table/departments").then(res => {
          const list = Array.isArray(res) ? res : (res?.data || []);
          if (Array.isArray(list) && list.length > 0) setDepartments(list);
        }).catch(err => console.warn("Failed loading departments:", err)),

        apiFetch("/api/table/designations").then(res => {
          const list = Array.isArray(res) ? res : (res?.data || []);
          if (Array.isArray(list) && list.length > 0) setDesignations(list);
        }).catch(err => console.warn("Failed loading designations:", err))
      ]);
    } catch (e) {
      console.error("Error loading salary structure data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterStatus, filterDept, currentPage]);

  useEffect(() => {
    if (activeView === "assign" && (!employees || employees.length === 0)) {
      loadEmployees();
    }
    if ((activeView === "create" || activeView === "edit") && (!departments || departments.length === 0)) {
      loadDepartments();
    }
    if ((activeView === "create" || activeView === "edit") && (!designations || designations.length === 0)) {
      loadDesignations();
    }
  }, [activeView]);

  // Use the server calculation engine so the preview matches assignments and payroll.
  useEffect(() => {
    const gross = Number(previewGross);
    if (!Number.isFinite(gross) || gross <= 0) {
      setPreviewResult(null);
      setPreviewError("");
      setPreviewLoading(false);
      return undefined;
    }

    let cancelled = false;
    setPreviewLoading(true);
    setPreviewError("");
    const timer = setTimeout(async () => {
      try {
        const response = await apiFetch("/api/finance/salary-structures/preview", {
          method: "POST",
          body: JSON.stringify({
            baseGross: gross,
            customComponents: components,
            referenceSalaryType,
            employeeId: previewEmployeeId || undefined
          })
        });
        if (!cancelled) setPreviewResult(response?.data || response);
      } catch (error) {
        if (!cancelled) {
          setPreviewResult(null);
          setPreviewError(error.message || "Unable to calculate preview.");
        }
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [components, previewGross, referenceSalaryType, previewEmployeeId]);

  // Load employee salary revision history when employee is selected in Assign tab
  useEffect(() => {
    if (!selectedEmployee) {
      setEmployeeSalaryHistory([]);
      return;
    }
    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const res = await apiFetch(`/api/finance/salary-structures/employee/${selectedEmployee}`);
        if (res?.data) {
          setEmployeeSalaryHistory(res.data);
        }
      } catch (e) {
        console.error("Error loading salary history:", e);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [selectedEmployee]);

  useEffect(() => {
    if (!selectedEmployee) {
      setApplicableStructures([]);
      setApplicableStructuresError("");
      return;
    }
    let cancelled = false;
    setApplicableStructuresLoading(true);
    setApplicableStructuresError("");
    apiFetch(`/api/finance/salary-structures/applicable/${encodeURIComponent(selectedEmployee)}?effectiveDate=${encodeURIComponent(effectiveFrom)}`)
      .then(response => {
        if (cancelled) return;
        const matches = response?.data || response || [];
        setApplicableStructures(matches);
        setSelectedStructure(matches.length === 1 ? matches[0].id : "");
        setApplicableStructuresError(matches.length > 1
          ? "Multiple structures match this employee. Select the applicable structure."
          : matches.length === 0
            ? "No structure matches this employee for this effective date."
            : "");
      })
      .catch(error => {
        if (!cancelled) {
          setApplicableStructures([]);
          setSelectedStructure("");
          setApplicableStructuresError(error.message || "Could not determine applicable structures.");
        }
      })
      .finally(() => {
        if (!cancelled) setApplicableStructuresLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedEmployee, effectiveFrom]);

  const handleAddComponent = () => {
    setComponents([
      ...components,
      { name: "", code: "", type: "Earning", category: "Earning", calculationType: "Percentage", value: "10", calculationBase: "Gross", referenceComponent: "Gross", frequency: "Monthly", isStatutory: false }
    ]);
  };

  const handleRemoveComponent = (idx) => {
    setComponents(components.filter((_, i) => i !== idx));
  };

  const handleMoveComponent = (idx, direction) => {
    const target = idx + direction;
    if (target < 0 || target >= components.length) return;
    setComponents(current => {
      const reordered = [...current];
      [reordered[idx], reordered[target]] = [reordered[target], reordered[idx]];
      return reordered;
    });
  };

  const handleComponentChange = (idx, field, val) => {
    setComponents(current => current.map((component, index) => {
      if (index !== idx) return component;
      if (field === "category") {
        return {
          ...component,
          category: val,
          type: val === "Employee Deduction" ? "Deduction" : "Earning"
        };
      }
      return { ...component, [field]: val };
    }));
  };

  const handleOpenCreate = () => {
    setEditingStructureId(null);
    setName("");
    setDescription("");
    setDepartmentIds([]);
    setDesignationIds([]);
    setGrade("Band A");
    setEmploymentCategory("Full-Time");
    setReferenceSalaryType("Monthly Gross");
    setStructureEffectiveFrom(todayDateString());
    setStructureEffectiveTo("");
    setComponents(DEFAULT_COMPONENTS);
    if (!departments || departments.length === 0) loadDepartments();
    if (!designations || designations.length === 0) loadDesignations();
    setActiveView("create");
  };

  const handleOpenEdit = (struct) => {
    setEditingStructureId(struct.id);
    setName(struct.name);
    setDescription(struct.description || "");
    setDepartmentIds(struct.departmentIds || (struct.departmentId ? [struct.departmentId] : []));
    setDesignationIds(struct.designationIds || (struct.designationId ? [struct.designationId] : []));
    setGrade(struct.grade || "Band A");
    setEmploymentCategory(struct.employmentCategory || "Full-Time");
    setReferenceSalaryType(struct.referenceSalaryType || "Monthly Gross");
    setStructureEffectiveFrom(struct.effectiveFrom || todayDateString());
    setStructureEffectiveTo(struct.effectiveTo || "");
    if (!departments || departments.length === 0) loadDepartments();
    if (!designations || designations.length === 0) loadDesignations();
    if (struct.components && struct.components.length > 0) {
      setComponents(struct.components.map(c => ({
        name: c.name,
        code: c.componentCode || c.code || "",
        type: c.type,
        category: c.category || (c.type === "Deduction" ? "Employee Deduction" : "Earning"),
        calculationType: c.calculationType,
        value: String(c.value),
        calculationBase: c.calculationBase || c.referenceComponent || "Gross",
        referenceComponent: c.referenceComponent || "",
        formula: c.formula || "",
        frequency: c.frequency || "Monthly",
        minimumAmount: c.minimumAmount ?? "",
        maximumAmount: c.maximumAmount ?? "",
        eligibilityCondition: typeof c.eligibilityCondition === "object"
          ? JSON.stringify(c.eligibilityCondition)
          : c.eligibilityCondition || "",
        displayOrder: c.displayOrder ?? 0,
        isStatutory: c.isStatutory || false,
        isTaxable: c.isTaxable !== false,
        isActive: c.isActive !== false
      })));
    } else {
      setComponents(DEFAULT_COMPONENTS);
    }
    setActiveView("edit");
  };

  const handleDuplicateStructure = (structure) => {
    handleOpenEdit(structure);
    setEditingStructureId(null);
    setName(`${structure.name} (Copy)`);
    setActiveView("create");
  };

  const handleSaveStructure = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Structure Name is required.");
      return;
    }

    let normalizedComponents;
    try {
      normalizedComponents = components.map((component, index) => {
        let eligibilityCondition = component.eligibilityCondition || null;
        if (typeof eligibilityCondition === "string" && eligibilityCondition.trim()) {
          eligibilityCondition = JSON.parse(eligibilityCondition);
          if (!eligibilityCondition || Array.isArray(eligibilityCondition) || typeof eligibilityCondition !== "object") {
            throw new Error(`${component.name}: eligibility must be a JSON object.`);
          }
        }
        const minimumAmount = component.minimumAmount === "" || component.minimumAmount == null
          ? null
          : Number(component.minimumAmount);
        const maximumAmount = component.maximumAmount === "" || component.maximumAmount == null
          ? null
          : Number(component.maximumAmount);
        if (minimumAmount !== null && (!Number.isFinite(minimumAmount) || minimumAmount < 0)) {
          throw new Error(`${component.name}: minimum must be a non-negative number.`);
        }
        if (maximumAmount !== null && (!Number.isFinite(maximumAmount) || maximumAmount < 0)) {
          throw new Error(`${component.name}: maximum must be a non-negative number.`);
        }
        if (minimumAmount !== null && maximumAmount !== null && minimumAmount > maximumAmount) {
          throw new Error(`${component.name}: minimum cannot exceed maximum.`);
        }
        return {
          ...component,
          category: component.category || (component.type === "Deduction" ? "Employee Deduction" : "Earning"),
          calculationBase: component.calculationBase || component.referenceComponent || "Gross",
          referenceComponent: component.calculationBase || component.referenceComponent || "Gross",
          value: component.calculationType === "Formula" ? 0 : Number(component.value),
          minimumAmount,
          maximumAmount,
          eligibilityCondition,
          displayOrder: index
        };
      });
    } catch (validationError) {
      alert(validationError.message || "Invalid component configuration.");
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        description,
        departmentIds,
        designationIds,
        departmentId: departmentIds[0] || null,
        designationId: designationIds[0] || null,
        grade,
        employmentCategory,
        referenceSalaryType,
        effectiveFrom: structureEffectiveFrom,
        effectiveTo: structureEffectiveTo || null,
        components: normalizedComponents
      };

      if (editingStructureId) {
        await apiFetch(`/api/finance/salary-structures/${editingStructureId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        alert("Salary Structure updated successfully!");
      } else {
        await apiFetch("/api/finance/salary-structures", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        alert("Salary Structure created successfully!");
      }

      setActiveView("list");
      loadData();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert(err.message || "Operation failed.");
    }
  };

  const handleToggleArchive = async (id) => {
    try {
      await apiFetch(`/api/finance/salary-structures/${id}/status`, { method: "PATCH" });
      loadData();
    } catch (err) {
      alert(err.message || "Failed to toggle status.");
    }
  };

  const handleAssignStructure = async (e) => {
    e.preventDefault();
    if (!selectedEmployee || !selectedStructure || !baseGross || !effectiveFrom) {
      alert("All fields are required.");
      return;
    }

    try {
      await apiFetch("/api/finance/salary-structures/assign", {
        method: "POST",
        body: JSON.stringify({
          employeeId: selectedEmployee,
          salaryStructureId: selectedStructure,
          effectiveFrom,
          baseGross: parseFloat(baseGross),
          revisionReason: revisionReason.trim() || null
        })
      });
      alert("Salary assignment submitted for approval. It will apply after approval.");
      setActiveView("list");
      loadData();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert(err.message || "Assignment failed.");
    }
  };

  const handleApproveSalaryAssignment = async (assignmentId) => {
    try {
      await apiFetch(`/api/finance/salary-structures/assignments/${assignmentId}/approve`, { method: "POST" });
      const response = await apiFetch(`/api/finance/salary-structures/employee/${selectedEmployee}`);
      setEmployeeSalaryHistory(response?.data || []);
      loadData();
    } catch (error) {
      alert(error.message || "Could not approve salary assignment.");
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Salary Structures & Bands</h2>
          <p className="text-xs text-slate-500">Configure salary formulas, earnings, statutory deductions, employer CTC costs, and assign revisions to employees.</p>
        </div>
        <div className="flex gap-2">
          {activeView !== "list" ? (
            <button
              onClick={() => setActiveView("list")}
              className="px-3.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 shadow-2xs"
            >
              Back to Structures List
            </button>
          ) : (
            <>
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-2xs"
              >
                <PlusIcon className="w-4 h-4" /> Define Structure
              </button>
              <button
                onClick={() => setActiveView("assign")}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-2xs"
              >
                <CheckBadgeIcon className="w-4 h-4" /> Assign to Employee
              </button>
            </>
          )}
        </div>
      </div>

      {/* VIEW: LIST OF STRUCTURES */}
      {activeView === "list" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 border rounded-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search structures..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setCurrentPage(1);
                      loadData();
                    }
                  }}
                  className="pl-9 pr-3 py-1.5 text-xs border rounded-xl bg-white focus:outline-indigo-500 w-48 md:w-64"
                />
              </div>

              <select
                value={filterDept}
                onChange={(e) => {
                  setCurrentPage(1);
                  setFilterDept(e.target.value);
                }}
                className="text-xs border rounded-xl p-1.5 bg-white text-slate-700"
              >
                <option value="">All Departments</option>
                {departments.map((d) => {
                  const deptId = d.id || d.deptId || d.departmentId || d.deptCode || d.dept_code;
                  const deptTitle = d.deptName || d.dept_name || d.departmentName || d.name || d.deptCode || d.dept_code || "Department";
                  return (
                    <option key={deptId} value={deptId}>{deptTitle}</option>
                  );
                })}
              </select>

              <div className="flex border rounded-xl overflow-hidden bg-white">
                {["active", "archived", "all"].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setCurrentPage(1);
                      setFilterStatus(st);
                    }}
                    className={`px-3 py-1.5 text-xs font-bold capitalize ${
                      filterStatus === st ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={loadData}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50"
            >
              <ArrowPathIcon className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {loadError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{loadError}</p>}

          {loading ? (
            <div className="text-center py-12 text-xs text-slate-400">Loading structures...</div>
          ) : structures.length === 0 ? (
            <div className="text-center py-12 bg-white border rounded-2xl p-8 space-y-3">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                <CalculatorIcon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-700 text-sm">No Salary Structures Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">Get started by defining salary bands and customizable compensation components.</p>
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 shadow-2xs"
              >
                Create First Structure
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="min-w-[1050px] w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3"><button onClick={() => toggleSort("name")}>Structure Name {sortKey === "name" ? (sortDirection === "asc" ? "↑" : "↓") : ""}</button></th>
                    <th className="px-4 py-3"><button onClick={() => toggleSort("grade")}>Grade / Band {sortKey === "grade" ? (sortDirection === "asc" ? "↑" : "↓") : ""}</button></th>
                    <th className="px-4 py-3">Department / Designation</th>
                    <th className="px-4 py-3">Employment</th>
                    <th className="px-4 py-3">Reference Type</th>
                    <th className="px-4 py-3">Assigned</th>
                    <th className="px-4 py-3"><button onClick={() => toggleSort("effectiveFrom")}>Effective From {sortKey === "effectiveFrom" ? (sortDirection === "asc" ? "↑" : "↓") : ""}</button></th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedStructures.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">{s.name}</div>
                        <div className="mt-0.5 text-[10px] text-slate-400">{s.components?.length || 0} components</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{s.grade || "All grades"}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <div>{s.departmentDetails?.dept_name || (s.departmentIds?.length ? `${s.departmentIds.length} departments` : "All departments")}</div>
                        <div className="text-[10px] text-slate-400">{s.designationDetails?.desig_name || (s.designationIds?.length ? `${s.designationIds.length} designations` : "All designations")}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{s.employmentCategory || "Full-Time"}</td>
                      <td className="px-4 py-3 text-slate-600">{s.referenceSalaryType || "Monthly Gross"}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{s.assignedEmployeeCount || 0}</td>
                      <td className="px-4 py-3 text-slate-600">{s.effectiveFrom || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${s.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {s.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <button onClick={() => setViewModalStructure(s)} className="font-semibold text-slate-600 hover:text-indigo-600" title="View structure"><EyeIcon className="h-4 w-4" /></button>
                          <button onClick={() => handleOpenEdit(s)} className="font-semibold text-slate-600 hover:text-indigo-600" title="Edit structure"><PencilSquareIcon className="h-4 w-4" /></button>
                          <button onClick={() => handleDuplicateStructure(s)} className="font-semibold text-slate-600 hover:text-emerald-600" title="Duplicate or create revision">Copy</button>
                          <button onClick={() => { setSelectedStructure(s.id); setActiveView("assign"); }} className="font-semibold text-emerald-700 hover:text-emerald-900" title="Assign employees">Assign</button>
                          <button onClick={() => handleToggleArchive(s.id)} className="font-semibold text-amber-700 hover:text-amber-900" title={s.isActive ? "Deactivate structure" : "Activate structure"}><ArchiveBoxIcon className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-slate-500">
                <span>Page {currentPage} of {totalPages}</span>
                <div className="flex gap-2">
                  <button disabled={currentPage <= 1} onClick={() => setCurrentPage(page => Math.max(1, page - 1))} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Previous</button>
                  <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Next</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: CREATE / EDIT SALARY STRUCTURE WITH INSTANT PREVIEW */}
      {(activeView === "create" || activeView === "edit") && (
        <form onSubmit={handleSaveStructure} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Fields and Component Config (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {activeView === "create" ? "Define New Salary Structure" : "Edit Salary Structure"}
              </h3>
              <p className="text-xs text-slate-400">Configure salary component formulas and reference associations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Structure Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard Band A - Engineering"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs border rounded-xl p-2.5 bg-slate-50/50 focus:bg-white focus:outline-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Employee Grade</label>
                <input
                  type="text"
                  placeholder="e.g. L1 / Band A / Senior"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full text-xs border rounded-xl p-2.5 bg-slate-50/50 focus:bg-white focus:outline-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Applicable Departments</label>
                  <div className="flex items-center gap-1.5">
                    {departments.length > 0 && (
                      <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {departments.length} available
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowAddDeptModal(true)}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition cursor-pointer"
                    >
                      + Add Dept
                    </button>
                  </div>
                </div>
                <select
                  multiple
                  value={departmentIds}
                  onChange={(e) => setDepartmentIds(Array.from(e.target.selectedOptions, option => option.value))}
                  className="w-full text-xs border rounded-xl p-2.5 bg-slate-50/50 focus:bg-white focus:outline-indigo-500 font-semibold text-slate-700"
                >
                  {departments.map((d) => {
                    const deptId = d.id || d.deptId || d.departmentId || d.deptCode || d.dept_code;
                    const deptTitle = d.deptName || d.dept_name || d.departmentName || d.name || d.deptCode || d.dept_code || "Department";
                    const deptCode = (d.deptCode || d.dept_code) && (d.deptCode || d.dept_code) !== deptTitle ? ` (${d.deptCode || d.dept_code})` : "";
                    return (
                      <option key={deptId} value={deptId}>
                        {deptTitle}{deptCode}
                      </option>
                    );
                  })}
                  {departments.length === 0 && (
                    <option disabled value="">No departments found for current company</option>
                  )}
                </select>
                <p className="mt-1 text-[10px] text-slate-400">Leave empty to apply to all departments. Use Ctrl/Cmd to select multiple.</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Applicable Designations</label>
                  {designations.length > 0 && (
                    <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                      {designations.length} available
                    </span>
                  )}
                </div>
                <select
                  multiple
                  value={designationIds}
                  onChange={(e) => setDesignationIds(Array.from(e.target.selectedOptions, option => option.value))}
                  className="w-full text-xs border rounded-xl p-2.5 bg-slate-50/50 focus:bg-white focus:outline-indigo-500 font-semibold text-slate-700"
                >
                  {designations.map((desig) => {
                    const desigVal = desig.id || desig.desigCode || desig.desig_code;
                    const desigTitle = desig.desigName || desig.desig_name || desig.name || desig.designationName || "Designation";
                    return (
                      <option key={desigVal} value={desigVal}>
                        {desigTitle}
                      </option>
                    );
                  })}
                </select>
                <p className="mt-1 text-[10px] text-slate-400">Leave empty to apply to all designations. Use Ctrl/Cmd to select multiple.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Employment Category</label>
                <select
                  value={employmentCategory}
                  onChange={(e) => setEmploymentCategory(e.target.value)}
                  className="w-full text-xs border rounded-xl p-2.5 bg-slate-50/50 focus:bg-white focus:outline-indigo-500"
                >
                  <option value="Full-Time">Full-Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Probation">Probation</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reference Salary Type</label>
                <select
                  value={referenceSalaryType}
                  onChange={(e) => setReferenceSalaryType(e.target.value)}
                  className="w-full text-xs border rounded-xl p-2.5 bg-slate-50/50 focus:bg-white focus:outline-indigo-500"
                >
                  <option value="Monthly Gross">Monthly Gross</option>
                  <option value="Annual CTC">Annual CTC</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Effective From *</label>
                <input
                  type="date"
                  required
                  value={structureEffectiveFrom}
                  onChange={(e) => setStructureEffectiveFrom(e.target.value)}
                  className="w-full text-xs border rounded-xl p-2.5 bg-slate-50/50 focus:bg-white focus:outline-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Effective To</label>
                <input
                  type="date"
                  min={structureEffectiveFrom}
                  value={structureEffectiveTo}
                  onChange={(e) => setStructureEffectiveTo(e.target.value)}
                  className="w-full text-xs border rounded-xl p-2.5 bg-slate-50/50 focus:bg-white focus:outline-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Describe salary band guidelines or applicability..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs border rounded-xl p-2.5 bg-slate-50/50 focus:bg-white focus:outline-indigo-500"
                />
              </div>
            </div>

            {/* Components Builder */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Salary Components</h4>
                  <p className="text-[11px] text-slate-400">Configure earnings, deductions, and statutory deductions.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddComponent}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg"
                >
                  <PlusIcon className="w-3.5 h-3.5" /> Add Component
                </button>
              </div>

              <div className="space-y-2.5">
                {components.map((comp, idx) => (
                  <div key={idx} className="p-3 bg-slate-50/80 border border-slate-100 rounded-xl grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 items-end">
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Component Name"
                        value={comp.name}
                        onChange={(e) => handleComponentChange(idx, "name", e.target.value)}
                        className="w-full text-xs border rounded-lg p-1.5 bg-white font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Code (e.g. BASIC)"
                        value={comp.code || ""}
                        onChange={(e) => handleComponentChange(idx, "code", e.target.value)}
                        className="w-full text-xs border rounded-lg p-1.5 bg-white text-slate-700"
                      />
                    </div>
                    <div>
                      <select
                        value={comp.category || (comp.type === "Deduction" ? "Employee Deduction" : "Earning")}
                        onChange={(e) => handleComponentChange(idx, "category", e.target.value)}
                        className="w-full text-xs border rounded-lg p-1.5 bg-white text-slate-700 font-bold"
                      >
                        <option value="Earning">Earning</option>
                        <option value="Employee Deduction">Employee Deduction</option>
                        <option value="Employer Contribution">Employer Contribution</option>
                      </select>
                    </div>
                    <div>
                      <select
                        value={comp.calculationType}
                        onChange={(e) => handleComponentChange(idx, "calculationType", e.target.value)}
                        className="w-full text-xs border rounded-lg p-1.5 bg-white text-slate-700"
                      >
                        <option value="Percentage">% of Ref</option>
                        <option value="Fixed">Fixed ₹</option>
                        <option value="Formula">Formula</option>
                      </select>
                    </div>
                    <div>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        required={comp.calculationType !== "Formula"}
                        disabled={comp.calculationType === "Formula"}
                        placeholder="Value"
                        value={comp.value}
                        onChange={(e) => handleComponentChange(idx, "value", e.target.value)}
                        className="w-full text-xs border rounded-lg p-1.5 bg-white text-right font-bold text-slate-800 disabled:bg-slate-100"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Calculation base (Gross, Basic, code)"
                        value={comp.calculationBase || comp.referenceComponent || "Gross"}
                        onChange={(e) => handleComponentChange(idx, "calculationBase", e.target.value)}
                        className="w-full text-xs border rounded-lg p-1.5 bg-white text-slate-700"
                      />
                    </div>
                    {comp.calculationType === "Formula" && (
                      <div className="sm:col-span-2 xl:col-span-3">
                        <input
                          type="text"
                          required
                          placeholder="Formula, e.g. BASIC * 0.1"
                          value={comp.formula || ""}
                          onChange={(e) => handleComponentChange(idx, "formula", e.target.value)}
                          className="w-full text-xs border rounded-lg p-1.5 bg-white text-slate-700"
                        />
                      </div>
                    )}
                    <div className="sm:col-span-2 xl:col-span-3">
                      <input
                        type="text"
                        placeholder='Eligibility JSON (optional), e.g. {"pfApplicable":true}'
                        value={typeof comp.eligibilityCondition === "string"
                          ? comp.eligibilityCondition
                          : comp.eligibilityCondition ? JSON.stringify(comp.eligibilityCondition) : ""}
                        onChange={(e) => handleComponentChange(idx, "eligibilityCondition", e.target.value)}
                        className="w-full text-xs border rounded-lg p-1.5 bg-white text-slate-700"
                      />
                    </div>
                    <div>
                      <select
                        value={comp.frequency || "Monthly"}
                        onChange={(e) => handleComponentChange(idx, "frequency", e.target.value)}
                        className="w-full text-xs border rounded-lg p-1.5 bg-white text-slate-700"
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="Annual">Annual</option>
                      </select>
                    </div>
                    <div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Minimum amount"
                        value={comp.minimumAmount ?? ""}
                        onChange={(e) => handleComponentChange(idx, "minimumAmount", e.target.value)}
                        className="w-full text-xs border rounded-lg p-1.5 bg-white text-slate-700"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Maximum amount"
                        value={comp.maximumAmount ?? ""}
                        onChange={(e) => handleComponentChange(idx, "maximumAmount", e.target.value)}
                        className="w-full text-xs border rounded-lg p-1.5 bg-white text-slate-700"
                      />
                    </div>
                    <div className="sm:col-span-2 xl:col-span-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-3">
                        <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                          <input
                            type="checkbox"
                            checked={Boolean(comp.isStatutory)}
                            onChange={(e) => handleComponentChange(idx, "isStatutory", e.target.checked)}
                          />
                          Statutory
                        </label>
                        <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                          <input
                            type="checkbox"
                            checked={comp.isTaxable !== false}
                            onChange={(e) => handleComponentChange(idx, "isTaxable", e.target.checked)}
                          />
                          Taxable
                        </label>
                        <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                          <input
                            type="checkbox"
                            checked={comp.isActive !== false}
                            onChange={(e) => handleComponentChange(idx, "isActive", e.target.checked)}
                          />
                          Active
                        </label>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveComponent(idx, -1)}
                          className="px-2 py-1 text-[10px] font-semibold border rounded disabled:opacity-40"
                          title="Move component up"
                        >
                          Up
                        </button>
                        <button
                          type="button"
                          disabled={idx === components.length - 1}
                          onClick={() => handleMoveComponent(idx, 1)}
                          className="px-2 py-1 text-[10px] font-semibold border rounded disabled:opacity-40"
                          title="Move component down"
                        >
                          Down
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveComponent(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                        title="Remove component"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveView("list")}
                className="px-4 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-2xs"
              >
                {editingStructureId ? "Update Structure" : "Save Salary Structure"}
              </button>
            </div>
          </div>

          {/* Right Panel: Instant Live Calculation Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-5 sticky top-6">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <CalculatorIcon className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-sm text-slate-800">Instant Calculation Preview</h3>
                </div>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                  Real-time Formula
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Test Reference Salary ({referenceSalaryType === "Annual CTC" ? "Annual CTC" : "Monthly Gross"} ₹)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-400">₹</span>
                  <input
                    type="number"
                    value={previewGross}
                    onChange={(e) => setPreviewGross(e.target.value)}
                    className="w-full text-sm font-extrabold text-indigo-700 border rounded-xl p-2 bg-indigo-50/30 focus:bg-white focus:outline-indigo-500"
                    placeholder="Enter monthly gross..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Eligibility Test Employee (optional)</label>
                <select
                  value={previewEmployeeId}
                  onChange={(e) => setPreviewEmployeeId(e.target.value)}
                  className="w-full text-xs border rounded-xl p-2 bg-white focus:outline-indigo-500"
                >
                  <option value="">No employee context</option>
                  {employees.map(employee => {
                    const id = employee.id || employee.employeeId || employee.employeeCode;
                    const name = employee.employeeName || `${employee.firstName || ""} ${employee.lastName || ""}`.trim() || employee.email || "Employee";
                    return <option key={id} value={id}>{name}</option>;
                  })}
                </select>
              </div>

              {previewLoading && <p className="text-[11px] text-slate-400">Calculating preview...</p>}
              {previewError && <p role="alert" className="text-[11px] text-red-600">{previewError}</p>}

              {previewResult && (
                <div className="space-y-4 text-xs">
                  {/* Earnings list */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Gross Earnings Breakdown
                    </span>
                    <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
                      {(previewResult.earnings || []).map((e, idx) => (
                        <div key={idx} className="flex justify-between text-slate-600">
                          <span>
                            {e.name}
                            <span className="block text-[10px] text-slate-400">{e.explanation}</span>
                          </span>
                          <span className="font-bold text-slate-800">₹{e.amount.toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                      <div className="border-t pt-1.5 flex justify-between font-extrabold text-indigo-700">
                        <span>Total Monthly Gross</span>
                        <span>₹{previewResult.totalGross.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions list */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Employee Deductions
                    </span>
                    <div className="bg-red-50/50 rounded-xl p-3 space-y-1.5 border border-red-100/50">
                      {(previewResult.deductions || []).map((d, idx) => (
                        <div key={idx} className="flex justify-between text-slate-600">
                          <span>
                            {d.name}
                            <span className="block text-[10px] text-slate-400">{d.explanation}</span>
                          </span>
                          <span className="font-bold text-red-600">-₹{d.amount.toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                      <div className="border-t border-red-100 pt-1.5 flex justify-between font-extrabold text-red-700">
                        <span>Total Deductions</span>
                        <span>-₹{previewResult.totalDeductions.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Employer contributions */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Employer Cost (Not deducted from salary)
                    </span>
                    <div className="bg-purple-50/50 rounded-xl p-3 space-y-1.5 border border-purple-100/50">
                      {(previewResult.employerContributions || []).map((contribution, idx) => (
                        <div key={idx} className="flex justify-between text-slate-600">
                          <span>
                            {contribution.name}
                            <span className="block text-[10px] text-slate-400">{contribution.explanation}</span>
                          </span>
                          <span className="font-bold text-purple-700">+₹{contribution.amount.toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                      <div className="border-t border-purple-100 pt-1.5 flex justify-between text-slate-600">
                        <span>Total Employer Contributions</span>
                        <span className="font-bold">₹{previewResult.totalEmployerContributions.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="border-t border-purple-100 pt-1.5 flex justify-between font-extrabold text-purple-800">
                        <span>Monthly Cost to Company (CTC)</span>
                        <span>₹{previewResult.monthlyCtc.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>

                  {previewResult.warnings?.length > 0 && (
                    <ul className="space-y-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                      {previewResult.warnings.map((warning, idx) => <li key={idx}>{warning}</li>)}
                    </ul>
                  )}

                  {/* Net Take-home pill */}
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-xl shadow-xs flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-90 block">Estimated Net Take-Home</span>
                      <span className="text-xl font-extrabold">₹{previewResult.netSalary.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-90 block">Annual CTC</span>
                      <span className="text-sm font-extrabold">₹{previewResult.annualCtc.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      )}

      {/* VIEW: ASSIGN SALARY STRUCTURE TO EMPLOYEE */}
      {activeView === "assign" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleAssignStructure} className="lg:col-span-7 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Assign Salary Structure to Employee</h3>
              <p className="text-xs text-slate-400">Apply a salary structure with effective dates and preserve historical revision records.</p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Select Employee *</label>
                  {employees.length > 0 && (
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {employees.length} available
                    </span>
                  )}
                </div>
                <select
                  required
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full text-xs border rounded-xl p-2.5 bg-slate-50/50 focus:bg-white focus:outline-indigo-500 font-semibold"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map((emp) => {
                    const empVal = emp.id || emp.employeeId || emp.employeeCode;
                    const empName = emp.employeeName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email || "Employee";
                    const empDept = emp.department || emp.departmentName || "";
                    const empCode = emp.employeeCode || emp.employeeId || "";
                    const subtitle = [empCode, empDept].filter(Boolean).join(" • ") || "Active";
                    return (
                      <option key={empVal} value={empVal}>
                        {empName} ({subtitle})
                      </option>
                    );
                  })}
                  {employees.length === 0 && (
                    <option disabled value="">No employees found for current company / branch</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Salary Structure *</label>
                <select
                  required
                  value={selectedStructure}
                  onChange={(e) => setSelectedStructure(e.target.value)}
                  className="w-full text-xs border rounded-xl p-2.5 bg-slate-50/50 focus:bg-white focus:outline-indigo-500 font-semibold"
                >
                  <option value="">-- Choose Structure --</option>
                  {applicableStructures.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Grade: {s.grade || 'Standard'})
                    </option>
                  ))}
                </select>
                {applicableStructuresLoading && <p className="mt-1 text-[10px] text-slate-400">Checking applicable structures...</p>}
                {applicableStructuresError && <p role="status" className="mt-1 text-[10px] text-amber-700">{applicableStructuresError}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {selectedStructureDetails?.referenceSalaryType === "Annual CTC" ? "Reference Annual CTC (₹) *" : "Base Gross Salary (Monthly ₹) *"}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 50000"
                    value={baseGross}
                    onChange={(e) => setBaseGross(e.target.value)}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50/50 focus:bg-white focus:outline-indigo-500 font-extrabold text-indigo-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Revision Reason</label>
                  <textarea
                    rows="2"
                    value={revisionReason}
                    onChange={(e) => setRevisionReason(e.target.value)}
                    placeholder="Reason for assigning or revising this salary"
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50/50 focus:bg-white focus:outline-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Effective From Date *</label>
                  <input
                    type="date"
                    required
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50/50 focus:bg-white focus:outline-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveView("list")}
                className="px-4 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-2xs"
              >
                Confirm Salary Assignment
              </button>
            </div>
          </form>

          {/* Revision History Panel */}
          <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Salary Revision History
            </h4>
            <p className="text-[11px] text-slate-400">Audited historical salary assignments for selected employee.</p>

            {!selectedEmployee ? (
              <div className="text-center py-10 text-xs text-slate-400">Select an employee to view their salary revision timeline.</div>
            ) : historyLoading ? (
              <div className="text-center py-10 text-xs text-slate-400">Loading revision history...</div>
            ) : employeeSalaryHistory.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">No previous salary structures assigned yet.</div>
            ) : (
              <div className="space-y-3">
                {employeeSalaryHistory.map((hist) => {
                  const today = todayDateString();
                  const current = hist.isActive && hist.effectiveFrom <= today && (!hist.effectiveTo || hist.effectiveTo >= today);
                  const scheduled = hist.isActive && hist.effectiveFrom > today;
                  const pending = hist.approvalStatus === "Pending";
                  const status = pending ? "Pending Approval" : current ? "Active Now" : scheduled ? "Scheduled" : "Historical";
                  return (
                    <div key={hist.id} className="p-3.5 border rounded-xl bg-slate-50 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-slate-800">{hist.structure?.name || "Standard Band"}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          pending ? "bg-amber-100 text-amber-800" : current ? "bg-emerald-100 text-emerald-800" : scheduled ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-600"
                        }`}>
                          {status}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>Monthly Gross: ₹{Number(hist.baseGross).toLocaleString("en-IN")}</span>
                        <span>Annual CTC: ₹{Number(hist.ctc).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold">
                        Effective: {hist.effectiveFrom} {hist.effectiveTo ? `to ${hist.effectiveTo}` : "onwards"}
                      </div>
                      {hist.revisionReason && <div className="text-[10px] text-slate-500">Reason: {hist.revisionReason}</div>}
                      {pending && (
                        <button
                          type="button"
                          onClick={() => handleApproveSalaryAssignment(hist.id)}
                          className="mt-1 px-2.5 py-1 text-[10px] font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
                        >
                          Approve Revision
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODAL FOR STRUCTURE DETAILS */}
      {viewModalStructure && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">{viewModalStructure.name}</h3>
                <p className="text-xs text-slate-400">{viewModalStructure.description || "No description."}</p>
              </div>
              <button
                onClick={() => setViewModalStructure(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 text-slate-600 bg-slate-50 p-3 rounded-xl">
                <div>Grade: <strong>{viewModalStructure.grade || "N/A"}</strong></div>
                <div>Category: <strong>{viewModalStructure.employmentCategory || "Full-Time"}</strong></div>
              </div>

              <div>
                <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block mb-2">Components</span>
                <div className="border rounded-xl divide-y text-xs">
                  {viewModalStructure.components?.map((c, i) => (
                    <div key={i} className="p-2.5 flex justify-between items-center">
                      <span className="font-semibold text-slate-700">{c.name} ({c.category || c.type})</span>
                      <span className="font-bold text-slate-900">
                        {c.calculationType === "Formula"
                          ? `ƒ ${c.formula}`
                          : c.calculationType === "Percentage" ? `${c.value}% of ${c.calculationBase || c.referenceComponent || 'Gross'}` : `₹${c.value}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t pt-3 flex justify-end">
              <button
                onClick={() => setViewModalStructure(null)}
                className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* QUICK ADD DEPARTMENT MODAL */}
      {showAddDeptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleQuickAddDepartment} className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-5 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold text-slate-800">Add New Department</h3>
              <button
                type="button"
                onClick={() => setShowAddDeptModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operations / Marketing"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-indigo-500 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Department Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. DEP-OPS"
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value)}
                  className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-indigo-500 font-semibold"
                />
              </div>
            </div>
            <div className="border-t pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddDeptModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addingDept}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50"
              >
                {addingDept ? "Saving..." : "Save & Select"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SalaryStructure;
