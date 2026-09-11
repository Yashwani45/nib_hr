// backend/services/core/exit.service.js
const { QueryTypes } = require('sequelize');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const ApiError = require('../../utils/apiError');
const auditLogService = require('./auditLog.service');

class ExitService {
  async getExitDashboardStats(tenantDb) {
    const stats = {};
    const executeCount = async (sql, replacements = []) => {
      const res = await tenantDb.query(sql, { replacements, type: QueryTypes.SELECT });
      return res && res[0] ? Object.values(res[0])[0] : 0;
    };

    stats.totalActive = await executeCount("SELECT COUNT(*) FROM \`exit_requests\` WHERE status NOT IN ('Completed', 'Rejected', 'Cancelled', 'Withdrawn') AND deleted_at IS NULL");
    stats.pendingResignations = await executeCount("SELECT COUNT(*) FROM \`exit_requests\` WHERE status = 'Submitted' AND deleted_at IS NULL");
    stats.noticePeriodCount = await executeCount("SELECT COUNT(*) FROM \`exit_requests\` WHERE stage = 'Notice Period' AND deleted_at IS NULL");
    stats.pendingClearance = await executeCount("SELECT COUNT(*) FROM \`exit_clearances\` WHERE status = 'Pending'");
    stats.pendingAssetReturns = await executeCount("SELECT COUNT(*) FROM \`asset_returns\` WHERE status = 'Return Pending'");
    stats.pendingNoDues = await executeCount("SELECT COUNT(*) FROM \`no_dues\` WHERE status = 'Pending'");
    stats.pendingFnf = await executeCount("SELECT COUNT(*) FROM \`fnf_settlements\` WHERE status = 'Pending'");
    stats.pendingInterviews = await executeCount("SELECT COUNT(*) FROM \`exit_requests\` WHERE stage = 'Exit Interview' AND deleted_at IS NULL");
    stats.exitsThisMonth = await executeCount(`
      SELECT COUNT(*) FROM \`exit_requests\` 
      WHERE (status = 'Completed' OR stage = 'Completed')
        AND STR_TO_DATE(proposed_lwd, '%Y-%m-%d') BETWEEN DATE_FORMAT(CURDATE(), '%Y-%m-01') AND LAST_DAY(CURDATE())
        AND deleted_at IS NULL
    `);

    // Fetch exit reasons analytics
    stats.reasons = await tenantDb.query(`
      SELECT reason, COUNT(*) as count 
      FROM \`exit_requests\` 
      WHERE deleted_at IS NULL 
      GROUP BY reason
    `, { type: QueryTypes.SELECT });

    // Fetch monthly attrition trend (last 6 months)
    stats.attritionTrend = await tenantDb.query(`
      SELECT DATE_FORMAT(STR_TO_DATE(proposed_lwd, '%Y-%m-%d'), '%Y-%m') as month, COUNT(*) as count 
      FROM \`exit_requests\` 
      WHERE proposed_lwd IS NOT NULL AND deleted_at IS NULL
      GROUP BY month 
      ORDER BY month DESC 
      LIMIT 6
    `, { type: QueryTypes.SELECT });

    // Department-wise exits
    stats.departmentExits = await tenantDb.query(`
      SELECT e.department, COUNT(*) as count 
      FROM \`exit_requests\` er
      JOIN \`employees\` e ON er.employee_id = e.employeeCode OR er.employee_id = e.id
      WHERE er.deleted_at IS NULL
      GROUP BY e.department
    `, { type: QueryTypes.SELECT });

    return stats;
  }

  async getResignations(tenantDb, user) {
    const userRole = String(user.role?.roleName || user.role?.name || user.role || '').toLowerCase();
    const empCode = user.employee?.employeeCode || user.employee?.id || user.username;

    let query = `
      SELECT er.*, e.employeeName, e.department, e.reportingManager, e.dateOfJoining
      FROM \`exit_requests\` er
      LEFT JOIN \`employees\` e ON er.employee_id = e.employeeCode OR er.employee_id = e.id
      WHERE er.deleted_at IS NULL
    `;
    const replacements = [];

    if (userRole === 'employee') {
      query += ` AND er.employee_id = ?`;
      replacements.push(empCode);
    } else if (userRole === 'manager') {
      // Return resignations of reportees
      query += ` AND (e.manager_id = ? OR e.reportingManager = ?)`;
      replacements.push(user.employee?.id || empCode, user.employee?.employeeName || '');
    }

    query += ' ORDER BY er.created_at DESC';
    return await tenantDb.query(query, { replacements, type: QueryTypes.SELECT });
  }

  async createResignation(tenantDb, data, user) {
    const empCode = user.employee?.employeeCode || user.employee?.id || user.username;
    
    // Check for active exit request
    const [existing] = await tenantDb.query(`
      SELECT id FROM \`exit_requests\` 
      WHERE employee_id = ? 
        AND status NOT IN ('Rejected', 'Cancelled', 'Withdrawn', 'Completed') 
        AND deleted_at IS NULL 
      LIMIT 1
    `, { replacements: [empCode], type: QueryTypes.SELECT });

    if (existing) {
      throw new ApiError(400, 'You already have an active resignation request.');
    }

    const id = crypto.randomUUID();
    await tenantDb.query(`
      INSERT INTO \`exit_requests\` (id, employee_id, resignation_date, proposed_lwd, reason, remarks, status, stage, progress_percent, created_by)
      VALUES (?, ?, ?, ?, ?, ?, 'Submitted', 'Resignation', 10, ?)
    `, {
      replacements: [id, empCode, data.resignation_date, data.proposed_lwd, data.reason, data.remarks || '', user.email || user.username]
    });

    await auditLogService.log({
      userId: user.id,
      username: user.email || user.username,
      roleName: user.role?.name || user.role,
      actionType: 'Create',
      moduleName: 'ExitManagement',
      recordId: id,
      newValues: { employee_id: empCode, proposed_lwd: data.proposed_lwd },
      status: 'Success'
    });

    return { id };
  }

  async approveResignation(tenantDb, id, approvedLwd, remarks, user) {
    const [exit] = await tenantDb.query('SELECT * FROM `exit_requests` WHERE id = ? LIMIT 1', {
      replacements: [id],
      type: QueryTypes.SELECT
    });
    if (!exit) throw new ApiError(404, 'Exit request not found.');

    const finalLwd = approvedLwd || exit.proposed_lwd;

    // Start database transaction
    const transaction = await tenantDb.transaction();
    try {
      // 1. Update exit request
      await tenantDb.query(`
        UPDATE \`exit_requests\` 
        SET status = 'Approved', stage = 'Notice Period', approved_lwd = ?, hr_remarks = ?, progress_percent = 25, updated_by = ?
        WHERE id = ?
      `, {
        replacements: [finalLwd, remarks || 'Approved by HR', user.email || user.username, id],
        transaction
      });

      // 2. Initialize Notice Period
      const npId = crypto.randomUUID();
      const noticeDays = this.calculateDaysBetween(exit.resignation_date, finalLwd);
      await tenantDb.query(`
        INSERT INTO \`notice_periods\` (id, exit_request_id, employee_id, notice_start_date, original_lwd, revised_lwd, notice_days, completed_days, remaining_days, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 'Active')
      `, {
        replacements: [npId, id, exit.employee_id, exit.resignation_date, exit.proposed_lwd, finalLwd, noticeDays, noticeDays],
        transaction
      });

      // 3. Initialize Department Clearances
      const clearanceDeps = ['HR', 'Finance', 'IT', 'Admin', 'Manager', 'Department'];
      for (const dep of clearanceDeps) {
        await tenantDb.query(`
          INSERT INTO \`exit_clearances\` (id, exit_request_id, employee_id, department, status, due_date)
          VALUES (?, ?, ?, ?, 'Pending', ?)
        `, {
          replacements: [crypto.randomUUID(), id, exit.employee_id, dep, finalLwd],
          transaction
        });
      }

      // 4. Retrieve and Initialize Asset Returns
      // Check from asset_allocation first, fallback to employee assets list
      let allocatedAssets = [];
      try {
        allocatedAssets = await tenantDb.query(`
          SELECT * FROM \`asset_allocation\` 
          WHERE employee_id = ? AND status = 'Allocated'
        `, { replacements: [exit.employee_id], type: QueryTypes.SELECT, transaction });
      } catch (err) {
        // Fallback or ignore
      }

      if (allocatedAssets.length > 0) {
        for (const asset of allocatedAssets) {
          await tenantDb.query(`
            INSERT INTO \`asset_returns\` (id, exit_request_id, employee_id, asset_id, asset_name, category, serial_number, assigned_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Return Pending')
          `, {
            replacements: [
              crypto.randomUUID(), id, exit.employee_id, asset.asset_id || asset.id, asset.asset_name || 'Device', asset.category || 'IT Hardware', asset.serial_number || 'N/A', asset.allocated_date || asset.created_at
            ],
            transaction
          });
        }
      } else {
        // Insert dummy/placeholder for clearance demo if empty
        await tenantDb.query(`
          INSERT INTO \`asset_returns\` (id, exit_request_id, employee_id, asset_id, asset_name, category, status)
          VALUES (?, ?, ?, 'DEV-IT-001', 'Official Laptop & Access ID Card', 'IT Hardware', 'Return Pending')
        `, [crypto.randomUUID(), id, exit.employee_id], { transaction });
      }

      // 5. Initialize No Dues Header record
      await tenantDb.query(`
        INSERT INTO \`no_dues\` (id, exit_request_id, employee_id, status)
        VALUES (?, ?, ?, 'Pending')
      `, [crypto.randomUUID(), id, exit.employee_id], { transaction });

      // 6. Log workflow history
      await tenantDb.query(`
        INSERT INTO \`exit_workflow_history\` (id, exit_request_id, stage, status, updated_by, remarks)
        VALUES (?, ?, 'Notice Period', 'Active', ?, ?)
      `, [crypto.randomUUID(), id, user.email || user.username, 'Notice period initialized'], { transaction });

      await transaction.commit();
      return true;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async rejectResignation(tenantDb, id, remarks, user) {
    await tenantDb.query(`
      UPDATE \`exit_requests\` 
      SET status = 'Rejected', hr_remarks = ?, updated_by = ?
      WHERE id = ?
    `, {
      replacements: [remarks || 'Rejected by HR', user.email || user.username, id]
    });
    return true;
  }

  async getNoticePeriods(tenantDb, user) {
    const userRole = String(user.role?.roleName || user.role?.name || user.role || '').toLowerCase();
    const empCode = user.employee?.employeeCode || user.employee?.id || user.username;

    let query = `
      SELECT np.*, e.employeeName, e.department, er.resignation_date, er.proposed_lwd, er.status as exit_status
      FROM \`notice_periods\` np
      JOIN \`exit_requests\` er ON np.exit_request_id = er.id
      LEFT JOIN \`employees\` e ON np.employee_id = e.employeeCode OR np.employee_id = e.id
    `;
    const replacements = [];

    if (userRole === 'employee') {
      query += ` WHERE np.employee_id = ?`;
      replacements.push(empCode);
    }

    return await tenantDb.query(query, { replacements, type: QueryTypes.SELECT });
  }

  async updateNoticePeriod(tenantDb, id, data, user) {
    const [np] = await tenantDb.query('SELECT * FROM `notice_periods` WHERE id = ? LIMIT 1', {
      replacements: [id],
      type: QueryTypes.SELECT
    });
    if (!np) throw new ApiError(404, 'Notice period record not found.');

    const transaction = await tenantDb.transaction();
    try {
      const updates = [];
      const replacements = { id };

      if (data.revised_lwd) {
        updates.push('revised_lwd = :revised_lwd');
        replacements.revised_lwd = data.revised_lwd;
        
        // Recalculate notice days
        const noticeDays = this.calculateDaysBetween(np.notice_start_date, data.revised_lwd);
        updates.push('notice_days = :notice_days');
        updates.push('remaining_days = :remaining_days');
        replacements.notice_days = noticeDays;
        replacements.remaining_days = Math.max(0, noticeDays - np.completed_days);

        // Update exit request LWD as well
        await tenantDb.query('UPDATE `exit_requests` SET approved_lwd = ? WHERE id = ?', {
          replacements: [data.revised_lwd, np.exit_request_id],
          transaction
        });
      }

      if (data.early_release !== undefined) {
        updates.push('early_release = :early_release');
        replacements.early_release = data.early_release ? 1 : 0;
      }

      if (data.notice_buyout !== undefined) {
        updates.push('notice_buyout = :notice_buyout');
        replacements.notice_buyout = data.notice_buyout ? 1 : 0;
        if (data.buyout_amount) {
          updates.push('buyout_amount = :buyout_amount');
          replacements.buyout_amount = data.buyout_amount;
        }
      }

      if (data.extension_days) {
        updates.push('extension_days = :extension_days');
        replacements.extension_days = data.extension_days;
      }

      if (updates.length > 0) {
        await tenantDb.query(`
          UPDATE \`notice_periods\` SET ${updates.join(', ')} WHERE id = :id
        `, { replacements, transaction });
      }

      await transaction.commit();
      return true;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async getClearances(tenantDb, user) {
    const userRole = String(user.role?.roleName || user.role?.name || user.role || '').toLowerCase();
    const empCode = user.employee?.employeeCode || user.employee?.id || user.username;

    let query = `
      SELECT ec.*, e.employeeName, e.department as employee_dept, er.status as exit_status
      FROM \`exit_clearances\` ec
      JOIN \`exit_requests\` er ON ec.exit_request_id = er.id
      LEFT JOIN \`employees\` e ON ec.employee_id = e.employeeCode OR ec.employee_id = e.id
    `;
    const replacements = [];

    if (userRole === 'employee') {
      query += ` WHERE ec.employee_id = ?`;
      replacements.push(empCode);
    } else if (userRole === 'manager') {
      query += ` WHERE ec.department = 'Manager' AND (e.manager_id = ? OR e.reportingManager = ?)`;
      replacements.push(user.employee?.id || empCode, user.employee?.employeeName || '');
    }

    return await tenantDb.query(query, { replacements, type: QueryTypes.SELECT });
  }

  async updateClearance(tenantDb, id, status, remarks, rejectionReason, user) {
    const [clearance] = await tenantDb.query('SELECT * FROM `exit_clearances` WHERE id = ? LIMIT 1', {
      replacements: [id],
      type: QueryTypes.SELECT
    });
    if (!clearance) throw new ApiError(404, 'Clearance record not found.');

    const transaction = await tenantDb.transaction();
    try {
      await tenantDb.query(`
        UPDATE \`exit_clearances\` 
        SET status = ?, remarks = ?, rejection_reason = ?, cleared_date = IF(? = 'Cleared', NOW(), NULL), assigned_to = ?
        WHERE id = ?
      `, {
        replacements: [status, remarks || '', rejectionReason || '', status, user.email || user.username, id],
        transaction
      });

      // Recalculate overall clearance stage progress
      const exitId = clearance.exit_request_id;
      const clearances = await tenantDb.query('SELECT status FROM `exit_clearances` WHERE exit_request_id = ?', {
        replacements: [exitId],
        type: QueryTypes.SELECT,
        transaction
      });

      const total = clearances.length;
      const cleared = clearances.filter(c => c.status === 'Cleared').length;
      const progressPercent = Math.min(100, 25 + Math.floor((cleared / total) * 35)); // Notice period to No Dues range (25% - 60%)

      await tenantDb.query('UPDATE `exit_requests` SET progress_percent = ? WHERE id = ?', {
        replacements: [progressPercent, exitId],
        transaction
      });

      // If all cleared, auto-advance to "Asset Return" / "No Dues" stage!
      if (cleared === total) {
        await tenantDb.query(`
          UPDATE \`exit_requests\` SET stage = 'Asset Return', progress_percent = 60 WHERE id = ?
        `, [exitId], { transaction });

        await tenantDb.query(`
          UPDATE \`no_dues\` SET status = 'Cleared', cleared_date = NOW(), approved_by = ? WHERE exit_request_id = ?
        `, [user.email || user.username, exitId], { transaction });
      }

      await transaction.commit();
      return true;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async getAssetReturns(tenantDb, user) {
    const userRole = String(user.role?.roleName || user.role?.name || user.role || '').toLowerCase();
    const empCode = user.employee?.employeeCode || user.employee?.id || user.username;

    let query = `
      SELECT ar.*, e.employeeName, e.department
      FROM \`asset_returns\` ar
      LEFT JOIN \`employees\` e ON ar.employee_id = e.employeeCode OR ar.employee_id = e.id
    `;
    const replacements = [];

    if (userRole === 'employee') {
      query += ` WHERE ar.employee_id = ?`;
      replacements.push(empCode);
    }

    return await tenantDb.query(query, { replacements, type: QueryTypes.SELECT });
  }

  async updateAssetReturn(tenantDb, id, status, remarks, condition, user) {
    const [asset] = await tenantDb.query('SELECT * FROM `asset_returns` WHERE id = ? LIMIT 1', {
      replacements: [id],
      type: QueryTypes.SELECT
    });
    if (!asset) throw new ApiError(404, 'Asset return record not found.');

    const transaction = await tenantDb.transaction();
    try {
      await tenantDb.query(`
        UPDATE \`asset_returns\` 
        SET status = ?, remarks = ?, condition_after = ?, verified_at = NOW(), verified_by = ?
        WHERE id = ?
      `, {
        replacements: [status, remarks || '', condition || 'Good', user.email || user.username, id],
        transaction
      });

      // Check if all assets returned
      const exitId = asset.exit_request_id;
      const returns = await tenantDb.query('SELECT status FROM `asset_returns` WHERE exit_request_id = ?', {
        replacements: [exitId],
        type: QueryTypes.SELECT,
        transaction
      });

      const allReturned = returns.every(r => ['Returned', 'Waived'].includes(r.status));
      if (allReturned) {
        await tenantDb.query(`
          UPDATE \`exit_requests\` SET stage = 'No Dues', progress_percent = 70 WHERE id = ?
        `, [exitId], { transaction });
      }

      await transaction.commit();
      return true;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async getNoDuesList(tenantDb, user) {
    const userRole = String(user.role?.roleName || user.role?.name || user.role || '').toLowerCase();
    const empCode = user.employee?.employeeCode || user.employee?.id || user.username;

    let query = `
      SELECT nd.*, e.employeeName, e.department, er.approved_lwd, er.status as exit_status
      FROM \`no_dues\` nd
      JOIN \`exit_requests\` er ON nd.exit_request_id = er.id
      LEFT JOIN \`employees\` e ON nd.employee_id = e.employeeCode OR nd.employee_id = e.id
    `;
    const replacements = [];

    if (userRole === 'employee') {
      query += ` WHERE nd.employee_id = ?`;
      replacements.push(empCode);
    }

    return await tenantDb.query(query, { replacements, type: QueryTypes.SELECT });
  }

  async approveNoDues(tenantDb, id, remarks, user) {
    const [nd] = await tenantDb.query('SELECT * FROM `no_dues` WHERE id = ? LIMIT 1', {
      replacements: [id],
      type: QueryTypes.SELECT
    });
    if (!nd) throw new ApiError(404, 'No dues record not found.');

    const transaction = await tenantDb.transaction();
    try {
      await tenantDb.query(`
        UPDATE \`no_dues\` 
        SET status = 'Cleared', cleared_date = NOW(), approved_by = ?, remarks = ?
        WHERE id = ?
      `, {
        replacements: [user.email || user.username, remarks || 'All clearances verified', id],
        transaction
      });

      await tenantDb.query(`
        UPDATE \`exit_requests\` SET stage = 'F&F Settlement', progress_percent = 80 WHERE id = ?
      `, [nd.exit_request_id], { transaction });

      // Automatically create a pending F&F record
      const [exit] = await tenantDb.query('SELECT approved_lwd FROM `exit_requests` WHERE id = ? LIMIT 1', {
        replacements: [nd.exit_request_id],
        type: QueryTypes.SELECT,
        transaction
      });

      await tenantDb.query(`
        INSERT INTO \`fnf_settlements\` (id, exit_request_id, employee_id, last_working_date, status)
        VALUES (?, ?, ?, ?, 'Pending')
        ON DUPLICATE KEY UPDATE last_working_date = ?
      `, [crypto.randomUUID(), nd.exit_request_id, nd.employee_id, exit?.approved_lwd, exit?.approved_lwd], { transaction });

      await transaction.commit();
      return true;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async getFnfList(tenantDb, user) {
    const userRole = String(user.role?.roleName || user.role?.name || user.role || '').toLowerCase();
    const empCode = user.employee?.employeeCode || user.employee?.id || user.username;

    let query = `
      SELECT fnf.*, e.employeeName, e.department
      FROM \`fnf_settlements\` fnf
      LEFT JOIN \`employees\` e ON fnf.employee_id = e.employeeCode OR fnf.employee_id = e.id
    `;
    const replacements = [];

    if (userRole === 'employee') {
      query += ` WHERE fnf.employee_id = ?`;
      replacements.push(empCode);
    }

    return await tenantDb.query(query, { replacements, type: QueryTypes.SELECT });
  }

  async saveFnf(tenantDb, id, data, user) {
    const gross = Number(data.salary_due || 0) + Number(data.leave_encashment || 0) + Number(data.bonus || 0) + Number(data.incentives || 0) + Number(data.reimbursements || 0);
    const deductions = Number(data.notice_recovery || 0) + Number(data.loan_recovery || 0) + Number(data.asset_recovery || 0) + Number(data.other_deductions || 0);
    const net = gross - deductions;

    await tenantDb.query(`
      UPDATE \`fnf_settlements\` 
      SET settlement_date = ?, salary_due = ?, leave_encashment = ?, bonus = ?, incentives = ?, reimbursements = ?, 
          notice_recovery = ?, loan_recovery = ?, asset_recovery = ?, other_deductions = ?, 
          gross_amount = ?, total_deductions = ?, net_payable = ?, status = 'Under Review', remarks = ?
      WHERE id = ?
    `, {
      replacements: [
        data.settlement_date, data.salary_due || 0, data.leave_encashment || 0, data.bonus || 0, data.incentives || 0, data.reimbursements || 0,
        data.notice_recovery || 0, data.loan_recovery || 0, data.asset_recovery || 0, data.other_deductions || 0,
        gross, deductions, net, data.remarks || '', id
      ]
    });
    return true;
  }

  async approveFnf(tenantDb, id, user) {
    const [fnf] = await tenantDb.query('SELECT * FROM `fnf_settlements` WHERE id = ? LIMIT 1', {
      replacements: [id],
      type: QueryTypes.SELECT
    });
    if (!fnf) throw new ApiError(404, 'F&F settlement not found.');

    const transaction = await tenantDb.transaction();
    try {
      await tenantDb.query("UPDATE `fnf_settlements` SET status = 'Approved' WHERE id = ?", {
        replacements: [id],
        transaction
      });

      await tenantDb.query(`
        UPDATE \`exit_requests\` SET stage = 'Exit Interview', progress_percent = 90 WHERE id = ?
      `, [fnf.exit_request_id], { transaction });

      await transaction.commit();
      return true;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async payFnf(tenantDb, id, user) {
    await tenantDb.query("UPDATE `fnf_settlements` SET status = 'Paid', payment_date = CURDATE() WHERE id = ?", {
      replacements: [id]
    });
    return true;
  }

  async submitInterview(tenantDb, data, user) {
    const empCode = user.employee?.employeeCode || user.employee?.id || user.username;
    
    const [exit] = await tenantDb.query("SELECT id FROM `exit_requests` WHERE employee_id = ? AND status = 'Approved' LIMIT 1", {
      replacements: [empCode],
      type: QueryTypes.SELECT
    });
    if (!exit) throw new ApiError(400, 'No active approved exit request found to submit an interview.');

    const transaction = await tenantDb.transaction();
    try {
      const id = crypto.randomUUID();
      await tenantDb.query(`
        INSERT INTO \`exit_interviews\` 
        (id, exit_request_id, employee_id, reason_for_leaving, job_satisfaction, manager_feedback, team_experience, work_environment, compensation_feedback, career_growth, learning_opportunities, work_life_balance, improvement_suggestions, recommend_company, rejoin_company, additional_comments)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, {
        replacements: [
          id, exit.id, empCode, data.reason_for_leaving, data.job_satisfaction || 3, data.manager_feedback || '', data.team_experience || '', data.work_environment || '',
          data.compensation_feedback || '', data.career_growth || '', data.learning_opportunities || '', data.work_life_balance || '', data.improvement_suggestions || '',
          data.recommend_company || 'Maybe', data.rejoin_company || 'Maybe', data.additional_comments || ''
        ],
        transaction
      });

      // Advance to "Experience Letter" stage
      await tenantDb.query(`
        UPDATE \`exit_requests\` SET stage = 'Experience Letter', progress_percent = 95 WHERE id = ?
      `, [exit.id], { transaction });

      // Automatically create an experience letter draft
      await tenantDb.query(`
        INSERT INTO \`experience_letters\` (id, exit_request_id, employee_id, status)
        VALUES (?, ?, ?, 'Draft')
        ON DUPLICATE KEY UPDATE status = 'Draft'
      `, [crypto.randomUUID(), exit.id, empCode], { transaction });

      await transaction.commit();
      return true;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async getInterviews(tenantDb, user) {
    return await tenantDb.query(`
      SELECT ei.*, e.employeeName, e.department
      FROM \`exit_interviews\` ei
      LEFT JOIN \`employees\` e ON ei.employee_id = e.employeeCode OR ei.employee_id = e.id
      ORDER BY ei.created_at DESC
    `, { type: QueryTypes.SELECT });
  }

  async getExperienceLetters(tenantDb, user) {
    const userRole = String(user.role?.roleName || user.role?.name || user.role || '').toLowerCase();
    const empCode = user.employee?.employeeCode || user.employee?.id || user.username;

    let query = `
      SELECT el.*, e.employeeName, e.department as employee_dept, e.dateOfJoining, er.approved_lwd
      FROM \`experience_letters\` el
      JOIN \`exit_requests\` er ON el.exit_request_id = er.id
      LEFT JOIN \`employees\` e ON el.employee_id = e.employeeCode OR el.employee_id = e.id
    `;
    const replacements = [];

    if (userRole === 'employee') {
      query += ` WHERE el.employee_id = ?`;
      replacements.push(empCode);
    }

    return await tenantDb.query(query, { replacements, type: QueryTypes.SELECT });
  }

  async generateExperienceLetter(tenantDb, id, user) {
    const [letter] = await tenantDb.query('SELECT el.*, e.employeeName, e.department, e.dateOfJoining, er.approved_lwd FROM `experience_letters` el JOIN `exit_requests` er ON el.exit_request_id = er.id LEFT JOIN `employees` e ON el.employee_id = e.employeeCode OR el.employee_id = e.id WHERE el.id = ? LIMIT 1', {
      replacements: [id],
      type: QueryTypes.SELECT
    });
    if (!letter) throw new ApiError(404, 'Experience letter record not found.');

    const doj = letter.dateOfJoining || 'N/A';
    const lwd = letter.approved_lwd || 'N/A';
    const duration = this.calculateEmploymentDuration(doj, lwd);

    const docId = crypto.randomUUID();
    const storageKey = `letters/experience-${letter.employee_id}-${Date.now()}.html`;
    const fullPath = path.join(__dirname, '../../uploads', storageKey);

    const secureDir = path.dirname(fullPath);
    if (!fs.existsSync(secureDir)) {
      fs.mkdirSync(secureDir, { recursive: true });
    }

    // Dynamic Experience Letter Template
    const templateHtml = `
      <div style="font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; color: #333;">
        <div style="text-align: center; border-bottom: 2px solid #e11d48; padding-bottom: 10px; margin-bottom: 30px;">
          <h2 style="color: #e11d48; margin: 0;">YASHTECH PVT LTD</h2>
          <p style="font-size: 10px; margin: 5px 0 0 0; color: #666;">Corporate Exit clearance Registry & Experience Letter System</p>
        </div>
        <p style="text-align: right; font-weight: bold;">Date: ${new Date().toLocaleDateString()}</p>
        <h3 style="text-align: center; text-transform: uppercase; margin-bottom: 40px; color: #1e293b;">To Whom It May Concern</h3>
        <p>This is to certify that <strong>${letter.employeeName}</strong> was employed with Yashtech Pvt Ltd.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f8fafc;">Employee Code</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${letter.employee_id}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f8fafc;">Department</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${letter.department || 'Software Engineering'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f8fafc;">Date of Joining</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${doj}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f8fafc;">Date of Relieving</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${lwd}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f8fafc;">Employment Duration</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${duration}</td>
          </tr>
        </table>
        <p>During their tenure, we found ${letter.employeeName} to be dedicated, hard-working, and highly professional in their role. Their contributions to team delivery and projects have been valuable.</p>
        <p>We wish them all success and the very best in their future professional endeavors.</p>
        <div style="margin-top: 60px;">
          <p>For <strong>Yashtech Pvt Ltd</strong></p>
          <div style="margin-top: 30px; border-top: 1px solid #333; width: 200px; padding-top: 5px;">
            <p style="margin: 0; font-weight: bold;">Authorized HR Signatory</p>
            <p style="margin: 0; font-size: 11px; color: #666;">Corporate Human Resources</p>
          </div>
        </div>
      </div>
    `;

    fs.writeFileSync(fullPath, templateHtml);

    const transaction = await tenantDb.transaction();
    try {
      await tenantDb.query(`
        UPDATE \`experience_letters\` 
        SET status = 'Generated', designation = ?, department = ?, joining_date = ?, last_working_date = ?, duration = ?, storage_key = ?
        WHERE id = ?
      `, {
        replacements: [letter.designation || 'Software Engineer', letter.department || 'General', doj, lwd, duration, storageKey, id],
        transaction
      });

      // Complete the exit workflow entirely!
      await tenantDb.query(`
        UPDATE \`exit_requests\` SET stage = 'Completed', progress_percent = 100, status = 'Completed' WHERE id = ?
      `, [letter.exit_request_id], { transaction });

      // Update employee status in database to exited
      await tenantDb.query("UPDATE `employees` SET employeeStatus = 'Exited' WHERE employeeCode = ? OR id = ?", {
        replacements: [letter.employee_id, letter.employee_id],
        transaction
      });

      await transaction.commit();
      return true;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async getExitHistory(tenantDb, user) {
    const userRole = String(user.role?.roleName || user.role?.name || user.role || '').toLowerCase();
    const empCode = user.employee?.employeeCode || user.employee?.id || user.username;

    let query = `
      SELECT er.*, e.employeeName, e.department, fnf.status as fnf_status, nd.status as nd_status
      FROM \`exit_requests\` er
      LEFT JOIN \`employees\` e ON er.employee_id = e.employeeCode OR er.employee_id = e.id
      LEFT JOIN \`fnf_settlements\` fnf ON er.id = fnf.exit_request_id
      LEFT JOIN \`no_dues\` nd ON er.id = nd.exit_request_id
      WHERE er.status = 'Completed' AND er.deleted_at IS NULL
    `;
    const replacements = [];

    if (userRole === 'employee') {
      query += ` AND er.employee_id = ?`;
      replacements.push(empCode);
    }

    return await tenantDb.query(query, { replacements, type: QueryTypes.SELECT });
  }

  // Utility Date Calculations
  calculateDaysBetween(startDateStr, endDateStr) {
    try {
      const s = new Date(startDateStr);
      const e = new Date(endDateStr);
      const diffTime = Math.abs(e - s);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return isNaN(diffDays) ? 0 : diffDays;
    } catch (err) {
      return 0;
    }
  }

  calculateEmploymentDuration(dojStr, lwdStr) {
    try {
      const s = new Date(dojStr);
      const e = new Date(lwdStr);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) return 'N/A';
      
      let years = e.getFullYear() - s.getFullYear();
      let months = e.getMonth() - s.getMonth();
      if (months < 0) {
        years--;
        months += 12;
      }
      return `${years} Years, ${months} Months`;
    } catch (err) {
      return 'N/A';
    }
  }
}

module.exports = new ExitService();
