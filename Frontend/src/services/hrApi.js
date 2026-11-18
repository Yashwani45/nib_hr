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
export const getActiveCompanyContext = () => {
  // Auto-migrate legacy or stale "NIB Master Operations" session to "NIB Insurance"
  try {
    const currentName = localStorage.getItem("selected_company_name");
    if (currentName && (currentName === "NIB Master Operations" || currentName.toLowerCase().includes("master operations"))) {
      localStorage.setItem("selected_company_name", "NIB Insurance");
      localStorage.setItem("selected_company_code", "2731b266-27c4-483d-a699-382b022d6c50");
      localStorage.setItem("selected_tenant_db", "nib_insurance");
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      if (u) {
        u.companyName = "NIB Insurance";
        u.companyCode = "2731b266-27c4-483d-a699-382b022d6c50";
        u.tenantDb = "nib_insurance";
        localStorage.setItem("user", JSON.stringify(u));
      }
    }
  } catch (e) {}

  // 1. Explicit user selection has highest precedence
  const selectedDb = localStorage.getItem("selected_tenant_db");
  if (selectedDb && selectedDb.trim() && selectedDb !== "system_master_db") {
    return selectedDb.trim();
  }

  const selectedCode = localStorage.getItem("selected_company_code");
  if (selectedCode && selectedCode.trim() && selectedCode !== "system_master_db") {
    const norm = selectedCode.toUpperCase().replace(/[\s\-_()]+/g, '');
    if (norm === 'NIB' || norm === 'NIB01' || norm.includes('NIBMASTER') || norm === 'NIBINSURANCE') {
      return '2731b266-27c4-483d-a699-382b022d6c50';
    }
    if (norm.includes('NIBALT') || norm === 'NIBINSURANCEALT' || norm === 'NIBINSURANCEALT001') {
      return 'nib-insurance-alt-001';
    }
    if (norm.includes('YASHTECH')) {
      return '983b8e34-1df2-4f9b-af07-693be0b23681';
    }
    return selectedCode.trim();
  }

  // 2. User profile context
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      if (user.tenantDb && user.tenantDb.trim() && user.tenantDb !== "system_master_db") return user.tenantDb.trim();
      const rawCode = user.companyCode || user.company_code || user.companyId || user.company_id;
      if (rawCode && String(rawCode).trim()) {
        const norm = String(rawCode).toUpperCase().replace(/[\s\-_()]+/g, '');
        if (norm === 'NIB' || norm === 'NIB01' || norm.includes('NIBMASTER') || norm === 'NIBINSURANCE') {
          return '2731b266-27c4-483d-a699-382b022d6c50';
        }
        if (norm.includes('NIBALT') || norm === 'NIBINSURANCEALT') {
          return 'nib-insurance-alt-001';
        }
        if (norm.includes('YASHTECH')) {
          return '983b8e34-1df2-4f9b-af07-693be0b23681';
        }
        return String(rawCode).trim();
      }
      if (user.companyName || user.company) {
        const norm = String(user.companyName || user.company).toUpperCase().replace(/[\s\-_()]+/g, '');
        if (norm.includes('NIBMASTER') || norm.includes('NIBINSURANCE') || norm === 'NIB') {
          return '2731b266-27c4-483d-a699-382b022d6c50';
        }
        if (norm.includes('NIBALT')) return 'nib-insurance-alt-001';
        if (norm.includes('YASHTECH')) return '983b8e34-1df2-4f9b-af07-693be0b23681';
        return String(user.companyName || user.company).toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      }
    }
  } catch (e) {}

  const selectedName = localStorage.getItem("selected_company_name");
  if (selectedName && selectedName.trim()) {
    const norm = String(selectedName).toUpperCase().replace(/[\s\-_()]+/g, '');
    if (norm.includes('NIBMASTER') || norm.includes('NIBINSURANCE') || norm === 'NIB') {
      return '2731b266-27c4-483d-a699-382b022d6c50';
    }
    if (norm.includes('NIBALT')) return 'nib-insurance-alt-001';
    if (norm.includes('YASHTECH')) return '983b8e34-1df2-4f9b-af07-693be0b23681';
    return selectedName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  }

  return "2731b266-27c4-483d-a699-382b022d6c50";
};

// Concurrency limiter for browser requests to strictly prevent net::ERR_INSUFFICIENT_RESOURCES
let activeHttpRequests = 0;
const MAX_CONCURRENT_REQUESTS = 6;
const requestQueue = [];

const processQueue = () => {
  while (activeHttpRequests < MAX_CONCURRENT_REQUESTS && requestQueue.length > 0) {
    activeHttpRequests++;
    const next = requestQueue.shift();
    try {
      next();
    } catch (e) {
      activeHttpRequests = Math.max(0, activeHttpRequests - 1);
      processQueue();
    }
  }
};

const enqueueRequest = (fetcher) => {
  return new Promise((resolve, reject) => {
    requestQueue.push(() => {
      try {
        fetcher()
          .then(resolve)
          .catch(reject)
          .finally(() => {
            activeHttpRequests = Math.max(0, activeHttpRequests - 1);
            processQueue();
          });
      } catch (err) {
        activeHttpRequests = Math.max(0, activeHttpRequests - 1);
        processQueue();
        reject(err);
      }
    });
    processQueue();
  });
};

export const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem("token");
  const companyCode = getActiveCompanyContext();

  const headers = {
    "X-Company-Code": companyCode,
    ...(options.headers || {}),
  };

  const isBranchTable = path.includes('/table/branch') || path.includes('/table/branches') || path.includes('/super-admin') || path.includes('/auth');
  const activeBranchId = localStorage.getItem("selected_branch_id");
  const activeBranchName = localStorage.getItem("selected_branch_name");
  const activeBranchCode = localStorage.getItem("selected_branch_code");
  if (!isBranchTable) {
    if (!headers["X-Branch-Id"]) {
      if (activeBranchId && activeBranchId !== "ALL") {
        headers["X-Branch-Id"] = activeBranchId;
        if (activeBranchName) headers["X-Branch-Name"] = encodeURIComponent(activeBranchName);
        if (activeBranchCode) headers["X-Branch-Code"] = activeBranchCode;
      } else {
        headers["X-Branch-Id"] = "ALL";
      }
    }
  }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Prevent caching for GET requests
  let fetchUrl = `${API_BASE}${path}`;
  if (!options.method || options.method.toUpperCase() === 'GET') {
    headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
    fetchUrl += (fetchUrl.includes('?') ? '&' : '?') + '_t=' + Date.now();
  }

  let timeoutId = null;
  let signalToUse = options.signal;
  if (!signalToUse && typeof AbortController !== 'undefined') {
    const timeoutMs = options.timeout || 12000;
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs);
    signalToUse = controller.signal;
  }

  try {
    const response = await enqueueRequest(() => fetch(fetchUrl, {
      ...options,
      signal: signalToUse,
      headers,
    }));
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

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
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    console.error(`API Error (${path}):`, error);
    throw error;
  }
};

// In-memory caching & request deduplication to completely eliminate perceived loading times
const tableCache = new Map();
const tableInflight = new Map();
const TABLE_CACHE_TTL = 30000; // 30s cache TTL

export const invalidateTableCache = (tableName) => {
  if (tableName) {
    const currentCompany = getActiveCompanyContext();
    tableCache.delete(`${currentCompany}:${tableName}`);
    tableCache.delete(tableName);
    for (const key of tableCache.keys()) {
      if (key.endsWith(`:${tableName}`)) {
        tableCache.delete(key);
      }
    }
    for (const key of tableInflight.keys()) {
      if (key.endsWith(`:${tableName}`)) {
        tableInflight.delete(key);
      }
    }
  } else {
    tableCache.clear();
    tableInflight.clear();
  }
};

// Generic MySQL Table CRUD Operations (with Instant In-Memory SWR Caching & Deduping)
export const getTableData = async (tableName, bypassCache = false, branchScopeOverride = null) => {
  const isBranchTable = tableName === 'branch' || tableName === 'branches';
  const currentCompany = getActiveCompanyContext();
  const currentBranch = branchScopeOverride || (isBranchTable ? 'ALL' : (localStorage.getItem("selected_branch_id") || "ALL"));
  const cacheKey = `${currentCompany}:${currentBranch}:${tableName}`;
  const now = Date.now();

  if (!bypassCache) {
    const cached = tableCache.get(cacheKey);
    if (cached && (now - cached.time < TABLE_CACHE_TTL)) {
      return cached.data;
    }
  }

  const inflightKey = `${currentCompany}:${currentBranch}:${tableName}`;
  if (tableInflight.has(inflightKey)) {
    return tableInflight.get(inflightKey);
  }

  const fetchPromise = (async () => {
    try {
      const fetchHeaders = {};
      if (branchScopeOverride) {
        fetchHeaders["X-Branch-Id"] = branchScopeOverride;
      }
      const response = await apiFetch(`/api/table/${tableName}`, { headers: fetchHeaders });
      const data = response && response.success ? response.data : [];
      tableCache.set(cacheKey, { data, time: Date.now() });
      return data;
    } catch (err) {
      console.warn(`[hrApi] Warning loading table '${tableName}' for tenant '${currentCompany}':`, err.message);
      const cached = tableCache.get(cacheKey);
      return cached ? cached.data : [];
    } finally {
      tableInflight.delete(inflightKey);
    }
  })();

  tableInflight.set(inflightKey, fetchPromise);
  return fetchPromise;
};

export const fetchSuperAdminTenantLiveData = async (tenantIdentifier) => {
  return await apiFetch(`/api/super-admin/tenants/${encodeURIComponent(tenantIdentifier)}/live-data`);
};

export const createTableRecord = async (tableName, data) => {
  const response = await apiFetch(`/api/table/${tableName}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  invalidateTableCache(tableName);
  return response.success ? response.data : null;
};

export const updateTableRecord = async (tableName, id, data) => {
  const response = await apiFetch(`/api/table/${tableName}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  invalidateTableCache(tableName);
  return response.success ? response.data : null;
};

export const deleteTableRecord = async (tableName, id) => {
  const response = await apiFetch(`/api/table/${tableName}/${id}`, {
    method: "DELETE",
  });
  invalidateTableCache(tableName);
  return response.success;
};

// ==================== DEPARTMENT MASTER CORE APIS (INSTANT 0ms CACHED) ====================

let deptsCache = null;
let deptsCacheTime = 0;
const DEPTS_CACHE_TTL = 30000;

export const invalidateDepartmentsCache = () => {
  deptsCache = null;
  deptsCacheTime = 0;
  invalidateTableCache("department");
};

export const fetchDepartmentsApi = async (params = {}, bypassCache = false) => {
  const isDefaultQuery = !params.search && !params.branchId && !params.status && (!params.page || Number(params.page) === 1);
  const now = Date.now();
  if (!bypassCache && isDefaultQuery && deptsCache && (now - deptsCacheTime < DEPTS_CACHE_TTL)) {
    return deptsCache;
  }

  try {
    const query = new URLSearchParams(params).toString();
    const response = await apiFetch(`/api/core/departments?${query}`);
    if (response && response.data && Array.isArray(response.data.departments)) {
      if (isDefaultQuery) {
        deptsCache = response.data;
        deptsCacheTime = now;
      }
      return response.data;
    }
  } catch (e) {}

  // Resilient Fallback to direct table API
  const tableData = await getTableData("department", bypassCache);
  const depts = Array.isArray(tableData) ? tableData : [];
  const fallbackResult = {
    totalItems: depts.length,
    totalPages: 1,
    currentPage: 1,
    limit: 100,
    departments: depts
  };
  if (isDefaultQuery) {
    deptsCache = fallbackResult;
    deptsCacheTime = now;
  }
  return fallbackResult;
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
  invalidateDepartmentsCache();
  return response.data;
};

export const updateExistingDepartmentApi = async (id, data) => {
  const response = await apiFetch(`/api/core/departments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  invalidateDepartmentsCache();
  return response.data;
};

export const toggleDepartmentStatusApi = async (id, status) => {
  const response = await apiFetch(`/api/core/departments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
  invalidateDepartmentsCache();
  return response.data;
};

export const deleteDepartmentApi = async (id) => {
  const response = await apiFetch(`/api/core/departments/${id}`, {
    method: 'DELETE'
  });
  invalidateDepartmentsCache();
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

export const downloadFile = async (path, filename = "download.csv") => {
  const token = localStorage.getItem("token");
  let companyCode = localStorage.getItem("selected_company_code") || "NIB01";
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && (user.companyCode || user.company_code)) {
      companyCode = user.companyCode || user.company_code;
    }
  } catch (e) {}

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Company-Code": companyCode,
    },
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(err || "Failed to download file");
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

export const uploadEmployeeFile = async (formData) => {
  const response = await apiFetch(`/api/core/upload`, {
    method: "POST",
    body: formData,
  });
  return response.success ? response.data : null;
};

// Branch Management & Policy Helpers
export const toggleBranchStatus = async (branchId, status) => {
  const response = await apiFetch(`/api/core/branches/${branchId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
  return response.success ? response.data : null;
};

export const updateBranchPolicy = async (branchId, policyData) => {
  const response = await apiFetch(`/api/core/branches/${branchId}/policy`, {
    method: "PUT",
    body: JSON.stringify(policyData)
  });
  return response.success ? response.data : null;
};

export const transferEmployeeBranch = async (transferData) => {
  const response = await apiFetch(`/api/core/branches/transfer-employee`, {
    method: "POST",
    body: JSON.stringify(transferData)
  });
  return response.success ? response.data : null;
};

export const getEmployeeTransferHistory = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await apiFetch(`/api/core/branches/transfer-history?${query}`);
  return response.success ? response.data : [];
};

export const getBranchAnalytics = async () => {
  const response = await apiFetch(`/api/core/branches/analytics`);
  return response.success ? response.data : null;
};

export const getBranchHolidays = async (branchId) => {
  const query = branchId ? `?branchId=${encodeURIComponent(branchId)}` : "";
  const response = await apiFetch(`/api/core/branches/holidays${query}`);
  return response.success ? response.data : [];
};

export const addBranchHoliday = async (holidayData) => {
  const response = await apiFetch(`/api/core/branches/holidays`, {
    method: "POST",
    body: JSON.stringify(holidayData)
  });
  return response.success ? response.data : null;
};

export const deleteBranchHoliday = async (holidayId) => {
  const response = await apiFetch(`/api/core/branches/holidays/${holidayId}`, {
    method: "DELETE"
  });
  return response.success ? response.data : null;
};

export default {
  apiFetch,
  downloadFile,
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