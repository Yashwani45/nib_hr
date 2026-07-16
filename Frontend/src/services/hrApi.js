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
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`API Error (${path}):`, error);
    throw error;
  }
};

// Generic MySQL Table CRUD Operations
export const getTableData = async (tableName) => {
  const response = await apiFetch(`/api/table/${tableName}`);
  return response.success ? response.data : [];
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

export default {
  apiFetch,
  formatDate,
  diffDays,
  
  // Generic CRUD
  getTableData,
  createTableRecord,
  updateTableRecord,
  deleteTableRecord,

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