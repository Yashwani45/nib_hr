// backend/services/core/department.service.js
const departmentRepository = require('../../repositories/core/department.repository');
const auditLogService = require('./auditLog.service');
const ApiError = require('../../utils/apiError');
const bcrypt = require('bcryptjs');
const { QueryTypes } = require('sequelize');

class DepartmentService {
  /**
   * Helper to resolve company ID scope from user context
   */
  _resolveCompanyId(currentUser, overrideCompanyId = null) {
    if (overrideCompanyId) return overrideCompanyId;
    if (currentUser?.companyId) return currentUser.companyId;
    if (currentUser?.id) return currentUser.id;
    return null;
  }

  /**
   * Helper to safely extract audit request info
   */
  _extractReqInfo(currentUser, reqInfo = {}) {
    return {
      userId: currentUser?.id || currentUser?.userId,
      username: currentUser?.email || currentUser?.username || 'Admin',
      roleName: currentUser?.role || 'Admin',
      ipAddress: reqInfo.ipAddress || reqInfo.ip || '::1',
      userAgent: reqInfo.userAgent || 'Web Console'
    };
  }

  /**
   * List departments with server-side pagination, search, filters & sorting
   */
  async getDepartments(queryParams = {}, currentUser, tenantDb = null) {
    const { sequelize, tenantStorage } = require('../../config/database');
    const activeDb = tenantDb || tenantStorage.getStore() || sequelize;

    // Purge legacy default department rows from database if present
    try {
      await activeDb.query("DELETE FROM departments WHERE dept_code = 'DEPT-GEN' OR dept_name = 'General Administration' OR dept_code = 'ADMIN' OR dept_name = 'Administration'");
    } catch (e) {}

    const pageNum = Math.max(1, parseInt(queryParams.page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(queryParams.limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    let sqlWhere = "(d.dept_code IS NULL OR (d.dept_code != 'DEPT-GEN' AND d.dept_code != 'ADMIN' AND d.dept_name != 'Administration'))";
    const replacements = {};

    if (queryParams.search && queryParams.search.trim() !== '') {
      sqlWhere += " AND (d.dept_code LIKE :search OR d.dept_name LIKE :search OR d.description LIKE :search)";
      replacements.search = `%${queryParams.search.trim()}%`;
    }

    if (queryParams.status) {
      sqlWhere += " AND d.status = :status";
      replacements.status = queryParams.status;
    }

    // Query total count
    let totalItems = 0;
    try {
      const [countRows] = await activeDb.query(
        `SELECT COUNT(*) as total FROM departments d WHERE ${sqlWhere}`,
        { replacements, type: QueryTypes.SELECT }
      );
      totalItems = countRows ? (countRows.total || countRows['COUNT(*)'] || 0) : 0;
    } catch (e) {}

    // Query department rows with branch/head joins
    let rows = [];
    try {
      rows = await activeDb.query(
        `SELECT d.*, 
                b.branch_name, b.branch_code,
                e.employee_name
         FROM departments d
         LEFT JOIN branches b ON d.branch_id = b.id
         LEFT JOIN employees e ON d.head_employee_id = e.id
         WHERE ${sqlWhere}
         LIMIT ${limitNum} OFFSET ${offset}`,
        { replacements, type: QueryTypes.SELECT }
      );
    } catch (e) {
      try {
        rows = await activeDb.query(
          `SELECT d.* FROM departments d WHERE ${sqlWhere} LIMIT ${limitNum} OFFSET ${offset}`,
          { replacements, type: QueryTypes.SELECT }
        );
      } catch (err) {}
    }

    const formattedDepts = (rows || []).map(r => ({
      id: r.id,
      companyId: r.company_id,
      branchId: r.branch_id,
      deptCode: r.dept_code,
      deptName: r.dept_name,
      description: r.description,
      status: r.status || 'Active',
      hrEmail: r.hr_email,
      assignedModules: typeof r.assigned_modules === 'string' ? (JSON.parse(r.assigned_modules || '[]')) : (r.assigned_modules || []),
      branch: r.branch_name || '',
      head: r.employee_name || '',
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));

    return {
      totalItems,
      totalPages: Math.ceil(totalItems / limitNum) || 1,
      currentPage: pageNum,
      limit: limitNum,
      departments: formattedDepts
    };
  }

  /**
   * Get single department by ID
   */
  async getDepartmentById(id, currentUser) {
    const companyId = this._resolveCompanyId(currentUser);

    let department = null;
    try {
      department = await departmentRepository.findById(id, [
        { association: 'branchDetails', attributes: ['id', 'branchCode', 'branchName'] },
        { association: 'headEmployeeDetails', attributes: ['id', 'employeeName', 'email'] },
        { association: 'parentDeptDetails', attributes: ['id', 'deptCode', 'deptName'] }
      ]);
    } catch (e) {
      department = await departmentRepository.findById(id).catch(() => null);
    }

    if (!department) {
      throw new ApiError(404, 'Department record not found.');
    }

    if (companyId && department.companyId && department.companyId !== companyId) {
      throw new ApiError(403, 'Unauthorized access to department resource.');
    }

    // Attach active assigned employee count
    let assignedEmployeeCount = 0;
    try {
      assignedEmployeeCount = await departmentRepository.countAssignedEmployees(id).catch(() => 0);
    } catch (e) {}

    const result = department.toJSON ? department.toJSON() : department;
    result.assignedEmployeeCount = assignedEmployeeCount;

    return result;
  }

  /**
   * Create a new Department
   */
  async createDepartment(departmentData, currentUser, reqInfo = {}, tenantDb = null) {
    const { sequelize, tenantStorage, masterSequelize } = require('../../config/database');
    const activeDb = tenantDb || tenantStorage.getStore() || sequelize;

    const companyId = this._resolveCompanyId(currentUser, departmentData.companyId);

    const cleanCode = String(departmentData.deptCode || departmentData.dept_code || '').trim().toUpperCase();
    const cleanName = String(departmentData.deptName || departmentData.dept_name || '').trim();

    // Check code uniqueness per company
    const [existingCode] = await activeDb.query(
      "SELECT id FROM departments WHERE (company_id = ? OR company_id IS NULL) AND dept_code = ? AND deleted_at IS NULL LIMIT 1",
      { replacements: [companyId, cleanCode], type: QueryTypes.SELECT }
    );
    if (existingCode) {
      throw new ApiError(400, `Department Code '${cleanCode}' is already registered.`);
    }

    // Check name uniqueness per company
    const [existingName] = await activeDb.query(
      "SELECT id FROM departments WHERE (company_id = ? OR company_id IS NULL) AND dept_name = ? AND deleted_at IS NULL LIMIT 1",
      { replacements: [companyId, cleanName], type: QueryTypes.SELECT }
    );
    if (existingName) {
      throw new ApiError(400, `Department Name '${cleanName}' is already registered.`);
    }

    // Validate parent department
    const parentId = departmentData.parentDeptId || departmentData.parent_dept_id;
    if (parentId) {
      const [parentDept] = await activeDb.query(
        "SELECT id FROM departments WHERE id = ? AND deleted_at IS NULL LIMIT 1",
        { replacements: [parentId], type: QueryTypes.SELECT }
      );
      if (!parentDept) {
        throw new ApiError(400, 'Selected Parent Department does not exist.');
      }
    }

    const rawEmail = departmentData.hrEmail || departmentData.hr_email;
    const cleanHrEmail = rawEmail ? String(rawEmail).trim() : null;

    if (cleanHrEmail) {
      const authService = require('../auth.service');
      if (await authService.isEmailRegisteredGlobally(cleanHrEmail)) {
        throw new ApiError(400, 'This email is already exists.');
      }
    }

    const rawPassword = departmentData.hrPassword || departmentData.hr_password;
    let hashedPassword = null;
    if (rawPassword && String(rawPassword).trim() !== '') {
      const passStr = String(rawPassword).trim();
      hashedPassword = passStr.startsWith('$2') ? passStr : await bcrypt.hash(passStr, 10);
    }

    const id = departmentData.id || require('crypto').randomUUID();

    const payload = {
      id,
      companyId,
      branchId: departmentData.branchId || departmentData.branch_id || null,
      deptCode: cleanCode,
      deptName: cleanName,
      headEmployeeId: departmentData.headEmployeeId || departmentData.head_employee_id || null,
      parentDeptId: parentId || null,
      description: departmentData.description ? String(departmentData.description).trim() : null,
      hrEmail: cleanHrEmail,
      hrPassword: hashedPassword,
      assignedModules: Array.isArray(departmentData.assignedModules || departmentData.assigned_modules) ? (departmentData.assignedModules || departmentData.assigned_modules) : [],
      status: departmentData.status || 'Active'
    };

    // Direct raw SQL insert guarantee on active database & master database context
    const sqlReplacements = {
      id,
      companyId: companyId || null,
      branchId: departmentData.branchId || departmentData.branch_id || null,
      deptCode: cleanCode,
      deptName: cleanName,
      headEmployeeId: departmentData.headEmployeeId || departmentData.head_employee_id || null,
      parentDeptId: parentId || null,
      description: departmentData.description ? String(departmentData.description).trim() : null,
      hrEmail: cleanHrEmail,
      hrPassword: hashedPassword,
      assignedModules: JSON.stringify(Array.isArray(departmentData.assignedModules || departmentData.assigned_modules) ? (departmentData.assignedModules || departmentData.assigned_modules) : []),
      status: departmentData.status || 'Active'
    };

    const sqlQuery = `INSERT INTO departments (
      id, company_id, branch_id, dept_code, dept_name, 
      head_employee_id, parent_dept_id, description, hr_email, 
      hr_password, assigned_modules, status, created_at, updated_at
    ) VALUES (
      :id, :companyId, :branchId, :deptCode, :deptName, 
      :headEmployeeId, :parentDeptId, :description, :hrEmail, 
      :hrPassword, :assignedModules, :status, NOW(), NOW()
    ) ON DUPLICATE KEY UPDATE 
      dept_name = :deptName, 
      hr_email = :hrEmail, 
      hr_password = COALESCE(:hrPassword, hr_password), 
      assigned_modules = :assignedModules,
      status = :status, 
      updated_at = NOW()`;

    try {
      await activeDb.query(sqlQuery, { replacements: sqlReplacements });
    } catch (dbErr) {
      console.warn('[Department DB Sync Warning on departments table]', dbErr.message);
      try {
        const sqlQuerySingular = sqlQuery.replace("INSERT INTO departments", "INSERT INTO department");
        await activeDb.query(sqlQuerySingular, { replacements: sqlReplacements });
      } catch (err2) {
        console.error('[Department DB Insert Failed on both tables]', err2.message);
        throw new ApiError(500, `Failed to save department: ${err2.message}`);
      }
    }
    if (masterSequelize && masterSequelize !== activeDb) {
      try {
        await masterSequelize.query(sqlQuery, { replacements: sqlReplacements });
      } catch (masterErr) {
        try {
          const sqlQuerySingular = sqlQuery.replace("INSERT INTO departments", "INSERT INTO department");
          await masterSequelize.query(sqlQuerySingular, { replacements: sqlReplacements });
        } catch (mErr) {}
      }
    }

    // Auto-scaffold physical department folder: Frontend/src/Company/[CompanyName]/[DepartmentName]/
    try {
      const companyIdentifier = currentUser?.companyName || currentUser?.companyCode || 'NIB';
      const { scaffoldDepartmentFolder } = require('../../utils/companyFolderScaffolder');
      scaffoldDepartmentFolder(companyIdentifier, cleanName);
    } catch (scaffoldErr) {
      console.warn('[Department Scaffold Notice]', scaffoldErr.message);
    }

    // Record Audit Log
    const auditInfo = this._extractReqInfo(currentUser, reqInfo);
    await auditLogService.log({
      ...auditInfo,
      actionType: 'CREATE',
      moduleName: 'Department',
      recordId: id,
      newValues: payload,
      status: 'Success'
    });

    try {
      return await this.getDepartmentById(id, currentUser);
    } catch (e) {
      return payload;
    }

  }

  /**
   * Update an existing Department
   */
  async updateDepartment(id, updateData, currentUser, reqInfo = {}) {
    const companyId = this._resolveCompanyId(currentUser);
    const { sequelize } = require('../../config/database');

    const [rows] = await sequelize.query(
      "SELECT * FROM departments WHERE id = ? AND deleted_at IS NULL LIMIT 1",
      { replacements: [id], type: QueryTypes.SELECT }
    );
    const existing = rows;

    if (!existing) {
      throw new ApiError(404, 'Department record not found for update.');
    }

    const company_id = existing.company_id || existing.companyId;

    if (companyId && company_id && company_id !== companyId) {
      throw new ApiError(403, 'Unauthorized modification of department resource.');
    }

    // Prevent self-referential parent assignment
    const parentId = updateData.parentDeptId !== undefined ? updateData.parentDeptId : (updateData.parent_dept_id !== undefined ? updateData.parent_dept_id : existing.parent_dept_id);
    if (parentId && parentId === id) {
      throw new ApiError(400, 'A department cannot be assigned as its own Parent Department.');
    }

    const sqlUpdates = [];
    const replacements = { id };

    const existing_dept_code = existing.dept_code || existing.deptCode;
    const existing_dept_name = existing.dept_name || existing.deptName;

    // Validate code if changed
    if (updateData.deptCode && updateData.deptCode.trim().toUpperCase() !== existing_dept_code) {
      const cleanCode = updateData.deptCode.trim().toUpperCase();
      const [occupied] = await sequelize.query(
        "SELECT id FROM departments WHERE (company_id = ? OR company_id IS NULL) AND dept_code = ? AND id != ? AND deleted_at IS NULL LIMIT 1",
        { replacements: [companyId || company_id, cleanCode, id], type: QueryTypes.SELECT }
      );
      if (occupied) {
        throw new ApiError(400, `Department Code '${cleanCode}' is already registered.`);
      }
      sqlUpdates.push("dept_code = :deptCode");
      replacements.deptCode = cleanCode;
    }

    // Validate name if changed
    if (updateData.deptName && updateData.deptName.trim() !== existing_dept_name) {
      const cleanName = updateData.deptName.trim();
      const [occupied] = await sequelize.query(
        "SELECT id FROM departments WHERE (company_id = ? OR company_id IS NULL) AND dept_name = ? AND id != ? AND deleted_at IS NULL LIMIT 1",
        { replacements: [companyId || company_id, cleanName, id], type: QueryTypes.SELECT }
      );
      if (occupied) {
        throw new ApiError(400, `Department Name '${cleanName}' is already registered.`);
      }
      sqlUpdates.push("dept_name = :deptName");
      replacements.deptName = cleanName;

      // Rename physical folder on disk
      try {
        let companyName = currentUser?.companyName;
        const tenantId = currentUser?.companyCode;
        if (!companyName && tenantId && String(tenantId).toUpperCase() !== 'NIB') {
          const { masterSequelize } = require('../../config/database');
          const [tenantRows] = await masterSequelize.query(
            "SELECT company_name FROM tenants WHERE id = ? OR db_name = ? LIMIT 1",
            { replacements: [tenantId, `nib_hr_${String(tenantId).toLowerCase()}`], type: QueryTypes.SELECT }
          );
          if (tenantRows) companyName = tenantRows.company_name;
        }
        if (!companyName) companyName = 'NIB';
        const { sanitizeCompanyFolder } = require('../../utils/companyFolderScaffolder');
        const cleanCompanyFolder = sanitizeCompanyFolder(companyName);
        const fs = require('fs');
        const path = require('path');
        const oldDeptFolder = existing_dept_name.replace(/[^a-zA-Z0-9]/g, '');
        const newDeptFolder = cleanName.replace(/[^a-zA-Z0-9]/g, '');
        const oldPath = path.join(__dirname, '..', '..', 'Frontend', 'src', 'Company', cleanCompanyFolder, 'Department', oldDeptFolder);
        const newPath = path.join(__dirname, '..', '..', 'Frontend', 'src', 'Company', cleanCompanyFolder, 'Department', newDeptFolder);
        if (fs.existsSync(oldPath) && oldDeptFolder !== newDeptFolder) {
          fs.renameSync(oldPath, newPath);
        }
      } catch (err) {}
    }

    if (updateData.branchId !== undefined) {
      sqlUpdates.push("branch_id = :branchId");
      replacements.branchId = updateData.branchId || null;
    }
    if (updateData.headEmployeeId !== undefined) {
      sqlUpdates.push("head_employee_id = :headEmployeeId");
      replacements.headEmployeeId = updateData.headEmployeeId || null;
    }
    if (updateData.parentDeptId !== undefined || updateData.parent_dept_id !== undefined) {
      sqlUpdates.push("parent_dept_id = :parentDeptId");
      replacements.parentDeptId = (updateData.parentDeptId !== undefined ? updateData.parentDeptId : updateData.parent_dept_id) || null;
    }
    if (updateData.description !== undefined) {
      sqlUpdates.push("description = :description");
      replacements.description = updateData.description ? String(updateData.description).trim() : null;
    }
    if (updateData.hrEmail !== undefined || updateData.hr_email !== undefined) {
      const emailVal = (updateData.hrEmail || updateData.hr_email) ? String(updateData.hrEmail || updateData.hr_email).trim() : null;
      const existing_hr_email = existing.hr_email || existing.hrEmail;
      if (emailVal && emailVal.toLowerCase() !== (existing_hr_email || '').toLowerCase()) {
        const authService = require('../auth.service');
        if (await authService.isEmailRegisteredGlobally(emailVal)) {
          throw new ApiError(400, 'This email is already exists.');
        }
      }
      sqlUpdates.push("hr_email = :hrEmail");
      replacements.hrEmail = emailVal;
    }
    if (updateData.hrPassword !== undefined || updateData.hr_password !== undefined) {
      const pass = updateData.hrPassword || updateData.hr_password;
      if (pass && String(pass).trim() !== '') {
        let hashedPassword = pass;
        if (!String(pass).startsWith('$2')) {
          hashedPassword = await bcrypt.hash(String(pass), 10);
        }
        sqlUpdates.push("hr_password = :hrPassword");
        replacements.hrPassword = hashedPassword;
      }
    }
    if (updateData.assignedModules !== undefined || updateData.assigned_modules !== undefined) {
      const modules = Array.isArray(updateData.assignedModules || updateData.assigned_modules) ? (updateData.assignedModules || updateData.assigned_modules) : [];
      sqlUpdates.push("assigned_modules = :assignedModules");
      replacements.assignedModules = JSON.stringify(modules);
    }
    if (updateData.status !== undefined) {
      sqlUpdates.push("status = :status");
      replacements.status = updateData.status;
    }

    if (sqlUpdates.length > 0) {
      sqlUpdates.push("updated_at = NOW()");
      await sequelize.query(
        `UPDATE departments SET ${sqlUpdates.join(', ')} WHERE id = :id`,
        { replacements }
      );
    }

    // Retrieve updated record
    const updated = await this.getDepartmentById(id, currentUser);

    // Record Audit Log
    const auditInfo = this._extractReqInfo(currentUser, reqInfo);
    await auditLogService.log({
      ...auditInfo,
      actionType: 'UPDATE',
      moduleName: 'Department',
      recordId: id,
      previousValues: existing,
      newValues: updated,
      status: 'Success'
    });

    return updated;
  }

  /**
   * Toggle Department Status (Active <-> Inactive)
   */
  async toggleDepartmentStatus(id, status, currentUser, reqInfo = {}) {
    const companyId = this._resolveCompanyId(currentUser);
    const { sequelize } = require('../../config/database');

    const [rows] = await sequelize.query(
      "SELECT * FROM departments WHERE id = ? AND deleted_at IS NULL LIMIT 1",
      { replacements: [id], type: QueryTypes.SELECT }
    );
    const existing = rows;

    if (!existing) {
      throw new ApiError(404, 'Department record not found.');
    }

    const company_id = existing.company_id || existing.companyId;

    if (companyId && company_id && company_id !== companyId) {
      throw new ApiError(403, 'Unauthorized modification of department resource.');
    }

    await sequelize.query(
      "UPDATE departments SET status = ?, updated_at = NOW() WHERE id = ?",
      { replacements: [status, id] }
    );

    const updated = await this.getDepartmentById(id, currentUser);

    // Record Audit Log
    const auditInfo = this._extractReqInfo(currentUser, reqInfo);
    await auditLogService.log({
      ...auditInfo,
      actionType: 'STATUS_CHANGE',
      moduleName: 'Department',
      recordId: id,
      previousValues: existing,
      newValues: updated,
      status: 'Success'
    });

    return updated;
  }

  /**
   * Soft Delete Department (with assigned employee & sub-department safety guards)
   */
  async deleteDepartment(id, currentUser, reqInfo = {}) {
    const companyId = this._resolveCompanyId(currentUser);
    const { sequelize } = require('../../config/database');

    const [rows] = await sequelize.query(
      "SELECT * FROM departments WHERE id = ? LIMIT 1",
      { replacements: [id], type: QueryTypes.SELECT }
    );
    const existing = rows;

    if (!existing) {
      throw new ApiError(404, 'Department record not found for deletion.');
    }

    const company_id = existing.company_id || existing.companyId;
    const deptName = existing.dept_name || existing.deptName || existing.name;

    if (companyId && company_id && company_id !== companyId) {
      throw new ApiError(403, 'Unauthorized deletion of department resource.');
    }

    // Auto-unassign active employees and sub-departments linked to this department
    try {
      await sequelize.query(`UPDATE employees SET department_id = NULL WHERE department_id = ?`, { replacements: [id] });
      await sequelize.query(`UPDATE departments SET parent_dept_id = NULL WHERE parent_dept_id = ?`, { replacements: [id] });
    } catch (unassignErr) {
      console.warn('[Department Unassign Warning]', unassignErr.message);
    }

    const previousValues = existing;
    await sequelize.query(
      "DELETE FROM departments WHERE id = ?",
      { replacements: [id] }
    );

    // Auto-delete physical department folder and files from disk: Frontend/src/Company/[CompanyFolder]/Department/[DepartmentName]/
    try {
      let companyName = currentUser?.companyName;
      const tenantId = currentUser?.companyCode;
      
      if (!companyName && tenantId && String(tenantId).toUpperCase() !== 'NIB') {
        const { masterSequelize } = require('../../config/database');
        try {
          const [tenantRows] = await masterSequelize.query(
            "SELECT company_name FROM tenants WHERE id = ? OR db_name = ? LIMIT 1",
            { 
              replacements: [tenantId, `nib_hr_${String(tenantId).toLowerCase()}`], 
              type: QueryTypes.SELECT 
            }
          );
          if (tenantRows) {
            companyName = tenantRows.company_name;
          }
        } catch (e) {
          console.error('[deleteDepartment Folder Resolution] Error querying master DB:', e.message);
        }
      }

      if (!companyName) {
        companyName = 'NIB';
      }

      const { deleteDepartmentFolder } = require('../../utils/companyFolderScaffolder');
      deleteDepartmentFolder(companyName, deptName);
    } catch (delErr) {
      console.warn('[Department Folder Delete Notice]', delErr.message);
    }

    // Record Audit Log
    const auditInfo = this._extractReqInfo(currentUser, reqInfo);
    await auditLogService.log({
      ...auditInfo,
      actionType: 'DELETE',
      moduleName: 'Department',
      recordId: id,
      previousValues,
      status: 'Success'
    });

    return { success: true, message: `Department '${deptName}' deleted successfully.` };
  }
}

module.exports = new DepartmentService();
