// Frontend/src/services/hrApi.js

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// Helper functions
export const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString();
};

export const diffDays = (fromDate, toDate) => {
  if (!fromDate || !toDate) return 0;
  const from = new Date(fromDate);
  const to = new Date(toDate);
  return Math.round((to - from) / 86400000) + 1;
};

// Base API fetch function
export const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem("token");
  let companyCode = "NIB01";
  
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.companyCode) {
      companyCode = user.companyCode;
    }
  } catch (e) {}

  const selectedCode = localStorage.getItem("selected_company_code");
  if (selectedCode) {
    companyCode = selectedCode;
  }

  const headers = {
    "X-Company-Code": companyCode,
    ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || `Request failed: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error (${path}):`, error);
    throw error;
  }
};

// Generic MySQL Table CRUD Operations
export const getTableData = async (tableName) => {
  try {
    const response = await apiFetch(`/api/table/${tableName}`);
    return response && response.success ? response.data : [];
  } catch (err) {
    console.warn(`[hrApi] Warning loading table '${tableName}' from backend:`, err.message);
    return [];
  }
};

export const createTableRecord = async (tableName, data) => {
  const response = await apiFetch(`/api/table/${tableName}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return response.success ? response.data : null;
};

export const updateTableRecord = async (tableName, id, data) => {
  const response = await apiFetch(`/api/table/${tableName}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return response.success ? response.data : null;
};

export const deleteTableRecord = async (tableName, id) => {
  const response = await apiFetch(`/api/table/${tableName}/${id}`, {
    method: "DELETE",
  });
  return response.success;
};

// ==================== DEPARTMENT MASTER CORE APIS ====================

export const fetchDepartmentsApi = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await apiFetch(`/api/core/departments?${query}`);
    if (response && response.data && Array.isArray(response.data.departments) && response.data.departments.length > 0) {
      return response.data;
    }
  } catch (e) {}

  // Resilient Fallback to direct table API
  const tableData = await getTableData("department");
  const depts = Array.isArray(tableData) ? tableData : [];
  return {
    totalItems: depts.length,
    totalPages: 1,
    currentPage: 1,
    limit: 100,
    departments: depts
  };
};

export const fetchDepartmentByIdApi = async (id) => {
  const response = await apiFetch(`/api/core/departments/${id}`);
  return response.data;
};

export const createNewDepartmentApi = async (data) => {
  const response = await apiFetch('/api/core/departments', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return response.data;
};

export const updateExistingDepartmentApi = async (id, data) => {
  const response = await apiFetch(`/api/core/departments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  return response.data;
};

export const toggleDepartmentStatusApi = async (id, status) => {
  const response = await apiFetch(`/api/core/departments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
  return response.data;
};

export const deleteDepartmentApi = async (id) => {
  const response = await apiFetch(`/api/core/departments/${id}`, {
    method: 'DELETE'
  });
  return response.data;
};

// ==================== COMPATIBILITY ALIASES ====================

export const getAllDepartments = () => getTableData("department");
export const createDepartment = (data) => createTableRecord("department", data);
export const updateDepartment = (id, data) => updateTableRecord("department", id, data);
export const deleteDepartment = (id) => deleteTableRecord("department", id);

export const getAllEmployees = () => getTableData("employee_profile");
export const createEmployee = (data) => createTableRecord("employee_profile", data);
export const updateEmployee = (id, data) => updateTableRecord("employee_profile", id, data);
export const deleteEmployee = (id) => deleteTableRecord("employee_profile", id);

export const getAllLeaves = () => getTableData("leave_requests");
export const createLeave = (data) => createTableRecord("leave_requests", data);
export const updateLeaveStatus = async (id, status) => {
  return updateTableRecord("leave_requests", id, { status });
};

export const getAllPasses = () => getTableData("daily_attendance");
export const createPass = (data) => createTableRecord("daily_attendance", data);
export const updatePass = (id, data) => updateTableRecord("daily_attendance", id, data);
export const deletePass = (id) => deleteTableRecord("daily_attendance", id);

// Mapping adapters for compatibility
export const mapEmployee = (employee) => ({
  id: employee.id,
  employeeId: employee.empCode || `EMP${String(employee.id).padStart(3, "0")}`,
  employeeName: `${employee.firstName || ""} ${employee.lastName || ""}`.trim(),
  email: employee.companyEmail || employee.personalEmail || "",
  department: employee.department || "",
  designation: employee.designation || "",
  joiningDate: employee.joiningDate || formatDate(employee.created_at),
  contactNo: employee.phone || "",
  panNo: employee.pan || "",
  aadharNo: employee.aadhaar || "",
  status: employee.employmentStatus || "Active",
  bankName: employee.bankName || "",
  accountNo: employee.accountNo || "",
  ifscCode: employee.ifscCode || "",
});

export const mapLeave = (leave) => ({
  id: leave.id,
  employeeId: leave.empName || "",
  employeeName: leave.empName || "",
  department: "",
  leaveType: leave.leaveType || "",
  fromDate: leave.fromDate || "",
  toDate: leave.toDate || "",
  totalDays: leave.totalDays || 0,
  reason: leave.reason || "",
  status: leave.status || "Pending",
});

export const mapPass = (pass) => ({
  id: pass.id,
  employeeName: pass.name || "",
  employeeId: pass.empId || "",
  email: "",
  department: "",
  passType: pass.status || "",
  status: pass.status || "",
  validFrom: pass.checkIn || "",
  validTo: pass.checkOut || "",
});

export const uploadEmployeeFile = async (formData) => {
  const response = await apiFetch(`/api/core/upload`, {
    method: "POST",
    body: formData,
  });
  return response.success ? response.data : null;
};

export default {
  apiFetch,
  formatDate,
  diffDays,
  
  // Generic CRUD
  getTableData,
  createTableRecord,
  updateTableRecord,
  deleteTableRecord,
  uploadEmployeeFile,

  // Compatibility
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getAllEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getAllLeaves,
  createLeave,
  updateLeaveStatus,
  getAllPasses,
  createPass,
  updatePass,
  deletePass,
  mapEmployee,
  mapLeave,
  mapPass
};