// backend/controllers/core/branch.controller.js
const { QueryTypes } = require('sequelize');
const crypto = require('crypto');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');
const ApiError = require('../../utils/apiError');

/**
 * Helper to get the tenant sequelize connection
 */
const getTenantDb = (req) => {
  const db = req.tenantDb || req.sequelize;
  if (!db) {
    throw new ApiError(500, 'Tenant database context missing for branch operations.');
  }
  return db;
};

/**
 * 1. Toggle Branch Activation / Deactivation
 */
const toggleBranchStatus = asyncHandler(async (req, res) => {
  const tenantDb = getTenantDb(req);
  const { id } = req.params;
  const { status } = req.body;

  const [branches] = await tenantDb.query(
    `SELECT id, branch_name, branchName, status FROM branches WHERE id = :id LIMIT 1`,
    { replacements: { id }, type: QueryTypes.SELECT }
  );

  if (!branches) {
    throw new ApiError(404, 'Branch not found.');
  }

  const currentStatus = branches.status || 'Active';
  const newStatus = status ? status : (currentStatus === 'Active' ? 'Inactive' : 'Active');

  await tenantDb.query(
    `UPDATE branches SET status = :status, updated_at = NOW() WHERE id = :id`,
    { replacements: { id, status: newStatus } }
  );

  res.status(200).json(new ApiResponse(200, {
    id,
    branchName: branches.branchName || branches.branch_name,
    previousStatus: currentStatus,
    status: newStatus
  }, `Branch status successfully updated to ${newStatus}.`));
});

/**
 * 2. Update Branch Policy (Working Hours, Attendance, Payroll, Manager)
 */
const updateBranchPolicy = asyncHandler(async (req, res) => {
  const tenantDb = getTenantDb(req);
  const { id } = req.params;
  const {
    manager,
    manager_id,
    opening_time,
    closing_time,
    working_days,
    workingDays,
    weekly_off,
    grace_period_mins,
    half_day_hours,
    full_day_hours,
    pt_state,
    cost_center,
    geo_fencing,
    geo_radius,
    attendance_policy,
    payroll_config,
    status,
    phone,
    email,
    address,
    city,
    state,
    pincode
  } = req.body;

  const [existing] = await tenantDb.query(
    `SELECT id, branch_name, branchName FROM branches WHERE id = :id LIMIT 1`,
    { replacements: { id }, type: QueryTypes.SELECT }
  );

  if (!existing) {
    throw new ApiError(404, 'Branch not found.');
  }

  const updates = [];
  const replacements = { id };

  if (manager !== undefined) {
    updates.push('manager = :manager');
    replacements.manager = manager;
  }
  if (manager_id !== undefined) {
    updates.push('manager_id = :manager_id');
    replacements.manager_id = manager_id;
  }
  if (opening_time !== undefined) {
    updates.push('opening_time = :opening_time');
    replacements.opening_time = opening_time;
  }
  if (closing_time !== undefined) {
    updates.push('closing_time = :closing_time');
    replacements.closing_time = closing_time;
  }
  if (working_days !== undefined || workingDays !== undefined) {
    const wd = working_days || workingDays;
    updates.push('working_days = :working_days, workingDays = :working_days');
    replacements.working_days = wd;
  }
  if (weekly_off !== undefined) {
    updates.push('weekly_off = :weekly_off');
    replacements.weekly_off = weekly_off;
  }
  if (grace_period_mins !== undefined) {
    updates.push('grace_period_mins = :grace_period_mins');
    replacements.grace_period_mins = parseInt(grace_period_mins, 10) || 15;
  }
  if (half_day_hours !== undefined) {
    updates.push('half_day_hours = :half_day_hours');
    replacements.half_day_hours = parseFloat(half_day_hours) || 4.5;
  }
  if (full_day_hours !== undefined) {
    updates.push('full_day_hours = :full_day_hours');
    replacements.full_day_hours = parseFloat(full_day_hours) || 8.5;
  }
  if (pt_state !== undefined) {
    updates.push('pt_state = :pt_state');
    replacements.pt_state = pt_state;
  }
  if (cost_center !== undefined) {
    updates.push('cost_center = :cost_center');
    replacements.cost_center = cost_center;
  }
  if (geo_fencing !== undefined) {
    updates.push('geo_fencing = :geo_fencing');
    replacements.geo_fencing = geo_fencing ? 1 : 0;
  }
  if (geo_radius !== undefined) {
    updates.push('geo_radius = :geo_radius');
    replacements.geo_radius = parseInt(geo_radius, 10) || 200;
  }
  if (attendance_policy !== undefined) {
    updates.push('attendance_policy = :attendance_policy');
    replacements.attendance_policy = typeof attendance_policy === 'object' ? JSON.stringify(attendance_policy) : attendance_policy;
  }
  if (payroll_config !== undefined) {
    updates.push('payroll_config = :payroll_config');
    replacements.payroll_config = typeof payroll_config === 'object' ? JSON.stringify(payroll_config) : payroll_config;
  }
  if (status !== undefined) {
    updates.push('status = :status');
    replacements.status = status;
  }
  if (phone !== undefined) {
    updates.push('phone = :phone');
    replacements.phone = phone;
  }
  if (email !== undefined) {
    updates.push('email = :email');
    replacements.email = email;
  }
  if (address !== undefined) {
    updates.push('address = :address');
    replacements.address = address;
  }
  if (city !== undefined) {
    updates.push('city = :city');
    replacements.city = city;
  }
  if (state !== undefined) {
    updates.push('state = :state');
    replacements.state = state;
  }
  if (pincode !== undefined) {
    updates.push('pincode = :pincode');
    replacements.pincode = pincode;
  }

  if (updates.length > 0) {
    updates.push('updated_at = NOW()');
    await tenantDb.query(
      `UPDATE branches SET ${updates.join(', ')} WHERE id = :id`,
      { replacements }
    );
  }

  const [updated] = await tenantDb.query(
    `SELECT * FROM branches WHERE id = :id LIMIT 1`,
    { replacements: { id }, type: QueryTypes.SELECT }
  );

  res.status(200).json(new ApiResponse(200, updated, 'Branch policies and configuration updated successfully.'));
});

/**
 * 3. Transfer Employee to Another Branch
 */
const transferEmployee = asyncHandler(async (req, res) => {
  const tenantDb = getTenantDb(req);
  const {
    employeeId,
    targetBranchId,
    effectiveDate,
    reason,
    transferredBy
  } = req.body;

  if (!employeeId || !targetBranchId) {
    throw new ApiError(400, 'employeeId and targetBranchId are required for branch transfer.');
  }

  // Find Employee
  const [empRows] = await tenantDb.query(
    `SELECT id, 
            COALESCE(employee_name, employeeName) as name, 
            COALESCE(employeeCode, emp_code, employeeId) as code,
            branch_id,
            COALESCE(branchName, branch) as current_branch
     FROM employees 
     WHERE id = :empId LIMIT 1`,
    { replacements: { empId: employeeId }, type: QueryTypes.SELECT }
  );

  if (!empRows) {
    throw new ApiError(404, 'Employee record not found.');
  }

  // Find Target Branch
  const [branchRows] = await tenantDb.query(
    `SELECT id, 
            COALESCE(branch_name, branchName) as name, 
            status 
     FROM branches 
     WHERE id = :branchId LIMIT 1`,
    { replacements: { branchId: targetBranchId }, type: QueryTypes.SELECT }
  );

  if (!branchRows) {
    throw new ApiError(404, 'Target branch not found.');
  }

  if (branchRows.status === 'Inactive') {
    throw new ApiError(400, `Cannot transfer employee to '${branchRows.name}' because this branch is currently Inactive.`);
  }

  const fromBranchId = empRows.branch_id || null;
  const fromBranchName = empRows.current_branch || 'Headquarters';
  const toBranchId = branchRows.id;
  const toBranchName = branchRows.name;

  if (fromBranchId === toBranchId) {
    throw new ApiError(400, `Employee is already assigned to '${toBranchName}'.`);
  }

  const transferId = crypto.randomUUID();
  const dateEffective = effectiveDate || new Date().toISOString().slice(0, 10);
  const initiatedBy = req.user?.employee_name || req.user?.email || transferredBy || 'Admin User';

  // 1. Update Employee record
  await tenantDb.query(
    `UPDATE employees 
     SET branch_id = :toBranchId, branchName = :toBranchName, branch = :toBranchName, updated_at = NOW() 
     WHERE id = :empId`,
    { replacements: { toBranchId, toBranchName, empId: employeeId } }
  );

  // 2. Insert Transfer History Log
  await tenantDb.query(
    `INSERT INTO employee_transfers (
       id, employee_id, employee_name, employee_code, 
       from_branch_id, from_branch_name, to_branch_id, to_branch_name, 
       transfer_date, effective_date, reason, transferred_by, status, created_at, updated_at
     ) VALUES (
       :id, :empId, :empName, :empCode,
       :fromBranchId, :fromBranchName, :toBranchId, :toBranchName,
       CURRENT_DATE(), :effectiveDate, :reason, :transferredBy, 'Completed', NOW(), NOW()
     )`,
    {
      replacements: {
        id: transferId,
        empId: employeeId,
        empName: empRows.name || 'Employee',
        empCode: empRows.code || '',
        fromBranchId,
        fromBranchName,
        toBranchId,
        toBranchName,
        effectiveDate: dateEffective,
        reason: reason || 'Departmental operational transfer',
        transferredBy: initiatedBy
      }
    }
  );

  res.status(200).json(new ApiResponse(200, {
    transferId,
    employeeId,
    employeeName: empRows.name,
    fromBranch: fromBranchName,
    toBranch: toBranchName,
    effectiveDate: dateEffective,
    status: 'Completed'
  }, `Successfully transferred ${empRows.name} from ${fromBranchName} to ${toBranchName}.`));
});

/**
 * 4. Get Employee Transfer History
 */
const getTransferHistory = asyncHandler(async (req, res) => {
  const tenantDb = getTenantDb(req);
  const { employeeId, branchId, limit = 100 } = req.query;

  let whereClauses = [];
  const replacements = { limit: parseInt(limit, 10) || 100 };

  if (employeeId) {
    whereClauses.push('(employee_id = :employeeId)');
    replacements.employeeId = employeeId;
  }
  if (branchId) {
    whereClauses.push('(from_branch_id = :branchId OR to_branch_id = :branchId)');
    replacements.branchId = branchId;
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  let transfers = [];
  try {
    transfers = await tenantDb.query(
      `SELECT * FROM employee_transfers ${whereStr} ORDER BY created_at DESC LIMIT :limit`,
      { replacements, type: QueryTypes.SELECT }
    );
  } catch (e) {
    transfers = [];
  }

  res.status(200).json(new ApiResponse(200, transfers, 'Transfer history retrieved successfully.'));
});

/**
 * 5. Get Branch-Wise Reporting & Analytics
 */
const getBranchAnalytics = asyncHandler(async (req, res) => {
  const tenantDb = getTenantDb(req);

  // 1. All Branches with Headcount & Details
  let branchesWithHeadcount = [];
  try {
    branchesWithHeadcount = await tenantDb.query(
      `SELECT 
         b.id,
         COALESCE(b.branch_name, b.branchName, 'Branch') as branchName,
         COALESCE(b.branch_code, b.branchCode, '') as branchCode,
         COALESCE(b.status, 'Active') as status,
         b.city,
         b.state,
         b.manager,
         b.manager_id,
         b.opening_time,
         b.closing_time,
         b.weekly_off,
         b.grace_period_mins,
         b.pt_state,
         b.cost_center,
         b.geo_fencing,
         b.geo_radius,
         COUNT(e.id) as totalHeadcount,
         SUM(CASE WHEN e.employeeStatus = 'Active' OR e.employeeStatus IS NULL THEN 1 ELSE 0 END) as activeHeadcount,
         SUM(CASE WHEN e.employeeStatus = 'Inactive' THEN 1 ELSE 0 END) as inactiveHeadcount
       FROM branches b
       LEFT JOIN employees e ON (e.branch_id = b.id OR e.branchName = b.branch_name OR e.branch = b.branch_name)
       WHERE b.deleted_at IS NULL
       GROUP BY b.id
       ORDER BY b.created_at ASC`,
      { type: QueryTypes.SELECT }
    );
  } catch (err) {
    branchesWithHeadcount = [];
  }

  // 2. Total Company Headcount
  let totalHeadcount = 0;
  let unassignedHeadcount = 0;
  try {
    const [totRows] = await tenantDb.query(`SELECT COUNT(*) as total FROM employees`, { type: QueryTypes.SELECT });
    totalHeadcount = totRows?.total || 0;
    const [unRows] = await tenantDb.query(
      `SELECT COUNT(*) as unassigned FROM employees WHERE branch_id IS NULL AND (branchName IS NULL OR branchName = '')`,
      { type: QueryTypes.SELECT }
    );
    unassignedHeadcount = unRows?.unassigned || 0;
  } catch (e) {}

  // 3. Transfer count
  let totalTransfers = 0;
  try {
    const [trRows] = await tenantDb.query(`SELECT COUNT(*) as total FROM employee_transfers`, { type: QueryTypes.SELECT });
    totalTransfers = trRows?.total || 0;
  } catch (e) {}

  res.status(200).json(new ApiResponse(200, {
    branches: branchesWithHeadcount,
    totalBranches: branchesWithHeadcount.length,
    activeBranchesCount: branchesWithHeadcount.filter(b => b.status === 'Active').length,
    inactiveBranchesCount: branchesWithHeadcount.filter(b => b.status === 'Inactive').length,
    totalHeadcount,
    unassignedHeadcount,
    totalTransfers
  }, 'Branch-wise reporting analytics retrieved successfully.'));
});

/**
 * 6. Branch Holidays Management
 */
const getBranchHolidays = asyncHandler(async (req, res) => {
  const tenantDb = getTenantDb(req);
  const { branchId } = req.query;

  let query = `SELECT * FROM branch_holidays`;
  const replacements = {};

  if (branchId && branchId !== 'ALL') {
    query += ` WHERE branch_id = :branchId OR branch_id IS NULL ORDER BY holiday_date ASC`;
    replacements.branchId = branchId;
  } else {
    query += ` ORDER BY holiday_date ASC`;
  }

  let holidays = [];
  try {
    holidays = await tenantDb.query(query, { replacements, type: QueryTypes.SELECT });
  } catch (e) {
    holidays = [];
  }

  res.status(200).json(new ApiResponse(200, holidays, 'Branch holidays retrieved successfully.'));
});

const addBranchHoliday = asyncHandler(async (req, res) => {
  const tenantDb = getTenantDb(req);
  const {
    branchId,
    branchName,
    holidayName,
    holidayDate,
    holidayType = 'Regional',
    description,
    isMandatory = 1
  } = req.body;

  if (!holidayName || !holidayDate) {
    throw new ApiError(400, 'holidayName and holidayDate are required.');
  }

  const holidayId = crypto.randomUUID();

  await tenantDb.query(
    `INSERT INTO branch_holidays (id, branch_id, branch_name, holiday_name, holiday_date, holiday_type, description, is_mandatory, created_at, updated_at)
     VALUES (:id, :branchId, :branchName, :holidayName, :holidayDate, :holidayType, :description, :isMandatory, NOW(), NOW())`,
    {
      replacements: {
        id: holidayId,
        branchId: branchId || null,
        branchName: branchName || (branchId ? 'Specific Branch' : 'All Branches (Company-Wide)'),
        holidayName,
        holidayDate,
        holidayType,
        description: description || '',
        isMandatory: isMandatory ? 1 : 0
      }
    }
  );

  res.status(201).json(new ApiResponse(201, {
    id: holidayId,
    branchId,
    holidayName,
    holidayDate,
    holidayType
  }, 'Branch holiday added successfully.'));
});

const deleteBranchHoliday = asyncHandler(async (req, res) => {
  const tenantDb = getTenantDb(req);
  const { id } = req.params;

  await tenantDb.query(`DELETE FROM branch_holidays WHERE id = :id`, { replacements: { id } });
  res.status(200).json(new ApiResponse(200, { id }, 'Branch holiday deleted successfully.'));
});

module.exports = {
  toggleBranchStatus,
  updateBranchPolicy,
  transferEmployee,
  getTransferHistory,
  getBranchAnalytics,
  getBranchHolidays,
  addBranchHoliday,
  deleteBranchHoliday
};
