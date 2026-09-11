// backend/controllers/core/department.controller.js
const departmentService = require('../../services/core/department.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * Get paginated, searchable, filterable department list
 */
const getDepartments = asyncHandler(async (req, res) => {
  const result = await departmentService.getDepartments(req.query, req.user, req.tenantDb);
  res.status(200).json(new ApiResponse(200, result, 'Departments retrieved successfully.'));
});

/**
 * Get department by ID
 */
const getDepartmentById = asyncHandler(async (req, res) => {
  const department = await departmentService.getDepartmentById(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, department, 'Department details retrieved successfully.'));
});

const fs = require('fs');
const path = require('path');

/**
 * Create new department
 */
const createDepartment = asyncHandler(async (req, res) => {
  const reqInfo = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
  const department = await departmentService.createDepartment(req.body, req.user, reqInfo, req.tenantDb);

  // Auto-generate React component file inside Company/[CompanyName]/[DepartmentName]/
  try {
    const deptName = department.deptName || department.dept_name || req.body.deptName;
    if (deptName) {
      const compName = deptName
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');

      let companyName = null;
      const tenantId = req.headers['x-company-code'] || req.user?.companyCode;
      
      if (tenantId && String(tenantId).toUpperCase() !== 'NIB') {
        const { masterSequelize } = require('../../config/database');
        try {
          const { QueryTypes } = require('sequelize');
          const tenantRows = await masterSequelize.query(
            "SELECT company_name FROM tenants WHERE id = ? OR db_name = ? LIMIT 1",
            { 
              replacements: [tenantId, String(tenantId).toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')], 
              type: QueryTypes.SELECT 
            }
          );
          if (tenantRows && tenantRows.length > 0) {
            companyName = tenantRows[0].company_name;
          }
        } catch (e) {
          console.error('[Department Folder Resolution] Error querying master DB:', e.message);
        }
      }

      const { sanitizeCompanyFolder } = require('../../utils/companyFolderScaffolder');
      const cleanCompanyFolder = sanitizeCompanyFolder(companyName);
      const cleanDeptName = deptName.replace(/[^a-zA-Z0-9]/g, '');

      const folderPath = path.join(__dirname, '../../../Frontend/src/Company', cleanCompanyFolder, 'Department', cleanDeptName);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const filePath = path.join(folderPath, `${compName}.jsx`);
      if (!fs.existsSync(filePath)) {
        const deptCode = department.deptCode || department.dept_code || req.body.deptCode || 'DEPT';
        const description = department.description || req.body.description || '';
        
        const compContent = `import React from "react";
import { 
  UserGroupIcon, 
  EnvelopeIcon, 
  PhoneIcon 
} from "@heroicons/react/24/outline";

const ${compName} = ({ records, dbData }) => {
  // Filter employees belonging to this department
  const employees = dbData?.["Employee Profile"] || [];
  const deptEmployees = employees.filter(
    emp => emp.department?.toLowerCase() === "${deptName.toLowerCase()}"
  );

  // Get department details from records if available
  const deptDetail = records?.[0] || {
    deptCode: "${deptCode}",
    deptName: "${deptName}",
    head: "Department Lead",
    description: "${description.replace(/"/g, '\\"') || 'Enterprise department workspace.'}",
    status: "Active"
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-700 text-white p-6 shadow-xl">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-inner">
              <UserGroupIcon className="h-10 w-10 text-purple-200" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">{deptDetail.deptName}</h2>
              <p className="text-sm text-purple-100/90 font-medium max-w-xl mt-1">
                {deptDetail.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 shadow-sm min-w-[120px]">
              <span className="block text-[10px] uppercase font-bold tracking-wider text-purple-200">Headcount</span>
              <span className="text-3xl font-extrabold text-white mt-0.5 block">{deptEmployees.length}</span>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 shadow-sm min-w-[120px]">
              <span className="block text-[10px] uppercase font-bold tracking-wider text-purple-200">Code</span>
              <span className="text-sm font-mono font-bold text-white mt-2 block">{deptDetail.deptCode}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Card */}
        <div className="lg:col-span-1 border border-slate-200/80 rounded-2xl p-6 bg-gradient-to-b from-white to-slate-50/50 shadow-sm space-y-6">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b pb-3">Department Details</h3>
          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Head of Department</span>
              <p className="font-bold text-slate-800 text-sm">{deptDetail.head || "Unassigned"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Parent Department</span>
              <p className="font-semibold text-slate-700">{deptDetail.parentDept || "None"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Company / branch</span>
              <p className="font-semibold text-slate-700">
                {deptDetail.company || "NIB Technologies"} {deptDetail.branch ? \`(\${deptDetail.branch})\` : ""}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Status</span>
              <div>
                <span className={\`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border \${
                  deptDetail.status === "Active" 
                    ? "bg-green-50 text-green-700 border-green-200" 
                    : "bg-red-50 text-red-700 border-red-200"
                }\`}>
                  <span className={\`h-1.5 w-1.5 rounded-full \${deptDetail.status === "Active" ? "bg-green-500 animate-pulse" : "bg-red-500"}\`}></span>
                  {deptDetail.status || "Active"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Directory */}
        <div className="lg:col-span-2 border border-slate-200/80 rounded-2xl p-6 bg-white shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Employee Directory</h3>
            <span className="px-2 py-0.5 bg-purple-50 border border-purple-100 text-purple-700 text-[10px] font-bold rounded-full">
              {deptEmployees.length} Members
            </span>
          </div>

          {deptEmployees.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-3">
              <UserGroupIcon className="h-12 w-12 mx-auto text-slate-300" />
              <p className="text-xs font-medium">No employees currently assigned to this department.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {deptEmployees.map(emp => (
                <div key={emp.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-slate-50/50 px-2 rounded-xl transition">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
                      {emp.firstName?.[0]}{emp.lastName?.[0]}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">
                        {emp.firstName} {emp.lastName}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {emp.designation || "Staff Member"} | <span className="font-mono text-[10px] text-purple-600">{emp.empCode}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    {emp.companyEmail && (
                      <div className="flex items-center gap-1" title="Email">
                        <EnvelopeIcon className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-medium">{emp.companyEmail}</span>
                      </div>
                    )}
                    {emp.phone && (
                      <div className="flex items-center gap-1" title="Mobile">
                        <PhoneIcon className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-medium font-mono">{emp.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ${compName};
`;
        fs.writeFileSync(filePath, compContent, 'utf8');
      }
    }
  } catch (err) {
    console.error('Failed to auto-create department component file:', err.message);
  }

  res.status(201).json(new ApiResponse(201, department, 'Department created successfully.'));
});

/**
 * Update department
 */
const updateDepartment = asyncHandler(async (req, res) => {
  const reqInfo = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
  const department = await departmentService.updateDepartment(req.params.id, req.body, req.user, reqInfo);
  res.status(200).json(new ApiResponse(200, department, 'Department updated successfully.'));
});

/**
 * Toggle department status (Active / Inactive)
 */
const toggleDepartmentStatus = asyncHandler(async (req, res) => {
  const reqInfo = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
  const department = await departmentService.toggleDepartmentStatus(req.params.id, req.body.status, req.user, reqInfo);
  res.status(200).json(new ApiResponse(200, department, `Department status updated to ${req.body.status}.`));
});

/**
 * Soft delete department
 */
const deleteDepartment = asyncHandler(async (req, res) => {
  const reqInfo = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
  const result = await departmentService.deleteDepartment(req.params.id, req.user, reqInfo);
  res.status(200).json(new ApiResponse(200, result, 'Department deleted successfully.'));
});

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  toggleDepartmentStatus,
  deleteDepartment
};
