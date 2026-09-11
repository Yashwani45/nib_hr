// backend/services/talent/performance.service.js
const {
  sequelize,
  PerformanceMaster,
  PerformanceGoal,
  PerformanceGoalHistory,
  PerformanceKpi,
  PerformanceKpiHistory,
  PerformanceAppraisal,
  EmployeePromotion,
  EmployeeIncrement,
  Employee,
  Department,
  Designation,
  EmployeeSalaryAssignment,
  SalaryStructure,
  SalaryComponent,
  User,
  Role
} = require('../../models');
const ApiError = require('../../utils/apiError');
const auditLogService = require('../core/auditLog.service');
const { Op } = require('sequelize');

class PerformanceService {
  /**
   * Helper to write audit logs
   */
  async logPerformanceAction(userId, action, moduleName, recordId, status, oldValues = null, newValues = null) {
    try {
      const user = await User.findByPk(userId, { include: [{ model: Role, as: 'role' }] });
      await auditLogService.log({
        userId,
        username: user ? user.email : 'System',
        roleName: user && user.role ? user.role.roleName : 'Admin',
        actionType: action,
        moduleName,
        recordId,
        previousValues: oldValues,
        newValues,
        status
      });
    } catch (e) {
      console.error('Audit log failed inside performance service:', e.message);
    }
  }

  // ==================== DASHBOARD ANALYTICS ====================
  async getPerformanceDashboard(currentUser) {
    const roleName = currentUser.role?.roleName || currentUser.role?.name || 'Employee';
    const employee = await Employee.findOne({ where: { userId: currentUser.id } });

    const goalWhere = {};
    const appraisalWhere = {};
    const kpiWhere = {};

    if (roleName === 'Employee') {
      if (!employee) throw new ApiError(403, 'No employee record linked.');
      goalWhere.employeeId = employee.id;
      appraisalWhere.employeeId = employee.id;
      kpiWhere.employeeId = employee.id;
    } else if (roleName === 'Manager') {
      if (!employee) throw new ApiError(403, 'No employee record linked.');
      // Find reporting employees
      const reportingEmps = await Employee.findAll({ where: { managerId: employee.id } });
      const empIds = reportingEmps.map(e => e.id);
      empIds.push(employee.id); // include manager themselves
      goalWhere.employeeId = { [Op.in]: empIds };
      appraisalWhere.employeeId = { [Op.in]: empIds };
      kpiWhere.employeeId = { [Op.in]: empIds };
    }

    const [totalGoals, completedGoals, pendingAppraisals, completedAppraisals, kpis, allAppraisals] = await Promise.all([
      PerformanceGoal.count({ where: goalWhere }),
      PerformanceGoal.count({ where: { ...goalWhere, status: 'Approved' } }),
      PerformanceAppraisal.count({ where: { ...appraisalWhere, status: { [Op.in]: ['Draft', 'Submitted', 'Manager_Reviewed', 'HR_Reviewed'] } } }),
      PerformanceAppraisal.count({ where: { ...appraisalWhere, status: 'Completed' } }),
      PerformanceKpi.findAll({ where: kpiWhere }),
      PerformanceAppraisal.findAll({
        where: { ...appraisalWhere, status: 'Completed' },
        include: [{ model: Employee, as: 'employee' }]
      })
    ]);

    // Average KPI achievement
    let totalKpiWeight = 0;
    let weightedKpiScore = 0;
    kpis.forEach(k => {
      const w = parseFloat(k.weight || 0);
      const score = parseFloat(k.calculatedScore || 0);
      weightedKpiScore += (score * w);
      totalKpiWeight += w;
    });
    const avgKpiAchievement = totalKpiWeight > 0 ? (weightedKpiScore / totalKpiWeight) : 0;

    // Average Rating
    const totalRatings = allAppraisals.reduce((sum, a) => sum + parseFloat(a.finalRating || 0), 0);
    const avgRating = allAppraisals.length > 0 ? (totalRatings / allAppraisals.length) : 0;

    // Top & Low Performers
    const topPerformers = allAppraisals.filter(a => parseFloat(a.finalRating) >= 4.0).map(a => ({
      employeeId: a.employeeId,
      employeeName: a.employee?.employeeName || 'Unknown',
      finalRating: a.finalRating
    }));

    const lowPerformers = allAppraisals.filter(a => parseFloat(a.finalRating) < 2.0).map(a => ({
      employeeId: a.employeeId,
      employeeName: a.employee?.employeeName || 'Unknown',
      finalRating: a.finalRating
    }));

    // Department-wise Rating
    const deptStats = {};
    allAppraisals.forEach(a => {
      const dept = a.employee?.department || 'Operations';
      if (!deptStats[dept]) {
        deptStats[dept] = { total: 0, count: 0 };
      }
      deptStats[dept].total += parseFloat(a.finalRating || 0);
      deptStats[dept].count += 1;
    });

    const departmentWiseRating = Object.entries(deptStats).map(([dept, data]) => ({
      department: dept,
      avgRating: (data.total / data.count).toFixed(2)
    }));

    return {
      totalGoals,
      completedGoals,
      pendingAppraisals,
      completedAppraisals,
      avgKpiAchievement: parseFloat(avgKpiAchievement.toFixed(2)),
      avgRating: parseFloat(avgRating.toFixed(2)),
      topPerformers,
      lowPerformers,
      departmentWiseRating
    };
  }

  // ==================== PERFORMANCE MASTER ====================
  async createReviewCycle(payload, executorId) {
    const cycle = await PerformanceMaster.create(payload);
    await this.logPerformanceAction(executorId, 'Create', 'Performance Master', cycle.id, 'Success', null, cycle);
    return cycle;
  }

  async getReviewCycles() {
    return await PerformanceMaster.findAll({ order: [['createdAt', 'DESC']] });
  }

  // ==================== KPI MANAGEMENT ====================
  async createKpi(payload, executorId) {
    const kpi = await PerformanceKpi.create(payload);
    await this.logPerformanceAction(executorId, 'Create', 'KPI Management', kpi.id, 'Success', null, kpi);
    return kpi;
  }

  async getKpis(filters = {}, currentUser) {
    const { employeeId, departmentId, performanceMasterId } = filters;
    const roleName = currentUser.role?.roleName || currentUser.role?.name || 'Employee';
    const where = {};

    if (employeeId) where.employeeId = employeeId;
    if (departmentId) where.departmentId = departmentId;
    if (performanceMasterId) where.performanceMasterId = performanceMasterId;

    if (roleName === 'Employee') {
      const emp = await Employee.findOne({ where: { userId: currentUser.id } });
      if (emp) {
        where[Op.or] = [{ employeeId: emp.id }, { departmentId: emp.departmentId }];
      }
    }

    return await PerformanceKpi.findAll({
      where,
      include: [
        { model: Employee, as: 'employee' },
        { model: Department, as: 'departmentDetails' },
        { model: PerformanceMaster, as: 'reviewCycle' }
      ]
    });
  }

  async updateKpiProgress(kpiId, actualAchievement, executorId, remarks = '') {
    const kpi = await PerformanceKpi.findByPk(kpiId);
    if (!kpi) throw new ApiError(404, 'KPI not found.');

    const oldValues = { ...kpi.toJSON() };
    const transaction = await sequelize.transaction();

    try {
      kpi.actualAchievement = parseFloat(actualAchievement);

      // Simple score calculation: ratio to target, scaled by target if numeric
      const targetVal = parseFloat(kpi.target) || 100;
      let rawScore = (kpi.actualAchievement / targetVal) * 100;
      kpi.calculatedScore = Math.min(100, Math.max(0, rawScore)); // bound score 0-100%

      if (kpi.calculatedScore >= 95) kpi.status = 'Achieved';
      else if (kpi.calculatedScore > 0) kpi.status = 'In Progress';
      else kpi.status = 'Pending';

      await kpi.save({ transaction });

      // Append KPI history log
      await PerformanceKpiHistory.create({
        kpiId,
        actualAchievement: kpi.actualAchievement,
        recordedDate: new Date().toISOString().split('T')[0],
        updatedBy: executorId,
        remarks
      }, { transaction });

      await transaction.commit();
      await this.logPerformanceAction(executorId, 'Update', 'KPI Management', kpiId, 'Success', oldValues, kpi);
      return kpi;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  // ==================== GOALS MANAGEMENT ====================
  async createGoal(payload, executorId) {
    const goal = await PerformanceGoal.create({
      ...payload,
      assignedBy: executorId,
      status: 'Not Started'
    });
    await this.logPerformanceAction(executorId, 'Create', 'Goals Management', goal.id, 'Success', null, goal);
    return goal;
  }

  async getGoals(filters = {}, currentUser) {
    const { employeeId, status } = filters;
    const roleName = currentUser.role?.roleName || currentUser.role?.name || 'Employee';
    const where = {};
    if (status) where.status = status;

    if (roleName === 'Employee') {
      const emp = await Employee.findOne({ where: { userId: currentUser.id } });
      if (emp) where.employeeId = emp.id;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    return await PerformanceGoal.findAll({
      where,
      include: [
        { model: Employee, as: 'employee' },
        { model: PerformanceMaster, as: 'reviewCycle' }
      ]
    });
  }

  async updateGoalProgress(goalId, progress, comments, supportingDocument, executorId) {
    const goal = await PerformanceGoal.findByPk(goalId);
    if (!goal) throw new ApiError(404, 'Goal not found.');

    const oldValues = { ...goal.toJSON() };
    const transaction = await sequelize.transaction();

    try {
      goal.progress = parseFloat(progress);
      if (goal.progress >= 100) {
        goal.status = 'Completed';
      } else if (goal.progress > 0) {
        goal.status = 'In Progress';
      }

      if (comments) goal.comments = comments;
      if (supportingDocument) goal.supportingDocument = supportingDocument;

      await goal.save({ transaction });

      // Append Goal history log
      await PerformanceGoalHistory.create({
        goalId,
        progress: goal.progress,
        comments,
        supportingDocument,
        updatedBy: executorId
      }, { transaction });

      await transaction.commit();
      await this.logPerformanceAction(executorId, 'Update', 'Goals Management', goalId, 'Success', oldValues, goal);
      return goal;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async approveGoal(goalId, status, comments, executorId) {
    const goal = await PerformanceGoal.findByPk(goalId);
    if (!goal) throw new ApiError(404, 'Goal not found.');

    const oldValues = { ...goal.toJSON() };
    goal.status = status; // 'Approved' or 'Rejected'
    if (comments) goal.comments = comments;

    await goal.save();
    await this.logPerformanceAction(executorId, 'Approve', 'Goals Management', goalId, 'Success', oldValues, goal);
    return goal;
  }

  // ==================== APPRAISAL WORKFLOW ====================
  async initiateAppraisal(employeeId, performanceMasterId, executorId) {
    const existing = await PerformanceAppraisal.findOne({ where: { employeeId, performanceMasterId } });
    if (existing) throw new ApiError(400, 'Appraisal already initiated for this employee in the cycle.');

    const appraisal = await PerformanceAppraisal.create({
      employeeId,
      performanceMasterId,
      status: 'Draft'
    });

    await this.logPerformanceAction(executorId, 'Create', 'Appraisal Workflow', appraisal.id, 'Success', null, appraisal);
    return appraisal;
  }

  async getAppraisals(filters = {}, currentUser) {
    const { employeeId, status } = filters;
    const roleName = currentUser.role?.roleName || currentUser.role?.name || 'Employee';
    const where = {};
    if (status) where.status = status;

    if (roleName === 'Employee') {
      const emp = await Employee.findOne({ where: { userId: currentUser.id } });
      if (emp) where.employeeId = emp.id;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    return await PerformanceAppraisal.findAll({
      where,
      include: [
        { model: Employee, as: 'employee' },
        { model: PerformanceMaster, as: 'reviewCycle' }
      ]
    });
  }

  async getAppraisalDetails(id) {
    const appraisal = await PerformanceAppraisal.findByPk(id, {
      include: [
        { model: Employee, as: 'employee' },
        { model: PerformanceMaster, as: 'reviewCycle' }
      ]
    });
    if (!appraisal) throw new ApiError(404, 'Appraisal record not found.');
    return appraisal;
  }

  async submitSelfAssessment(id, data, executorId) {
    const appraisal = await PerformanceAppraisal.findByPk(id);
    if (!appraisal) throw new ApiError(404, 'Appraisal not found.');
    if (appraisal.status !== 'Draft') throw new ApiError(400, 'Self assessment already submitted.');

    const oldValues = { ...appraisal.toJSON() };
    const { selfRating, selfComment, strengths, weaknesses, achievements } = data;

    appraisal.selfRating = selfRating;
    appraisal.selfComment = selfComment;
    if (strengths) appraisal.strengths = strengths;
    if (weaknesses) appraisal.weaknesses = weaknesses;
    if (achievements) appraisal.achievements = achievements;
    appraisal.status = 'Submitted';

    await appraisal.save();
    await this.logPerformanceAction(executorId, 'Update', 'Appraisal Workflow', id, 'Success', oldValues, appraisal);
    return appraisal;
  }

  async submitManagerReview(id, data, executorId) {
    const appraisal = await PerformanceAppraisal.findByPk(id);
    if (!appraisal) throw new ApiError(404, 'Appraisal not found.');
    if (appraisal.status !== 'Submitted') throw new ApiError(400, 'Appraisal must be in Submitted status.');

    const oldValues = { ...appraisal.toJSON() };
    const { managerRating, managerComment } = data;

    appraisal.managerRating = managerRating;
    appraisal.managerComment = managerComment;
    appraisal.status = 'Manager_Reviewed';

    await appraisal.save();
    await this.logPerformanceAction(executorId, 'Update', 'Appraisal Workflow', id, 'Success', oldValues, appraisal);
    return appraisal;
  }

  async submitHrReview(id, data, executorId) {
    const appraisal = await PerformanceAppraisal.findByPk(id, {
      include: [{ model: PerformanceMaster, as: 'reviewCycle' }]
    });
    if (!appraisal) throw new ApiError(404, 'Appraisal not found.');
    if (appraisal.status !== 'Manager_Reviewed') throw new ApiError(400, 'Appraisal must be Manager Reviewed.');

    const oldValues = { ...appraisal.toJSON() };
    const { hrRating, hrComment } = data;

    const cycle = appraisal.reviewCycle || {};
    const selfWeight = parseFloat(cycle.selfReviewWeight || 20) / 100;
    const managerWeight = parseFloat(cycle.managerReviewWeight || 80) / 100;

    // Calculate final rating based on weights
    const calculatedFinal = (parseFloat(appraisal.selfRating) * selfWeight) + (parseFloat(appraisal.managerRating) * managerWeight);

    const transaction = await sequelize.transaction();

    try {
      appraisal.hrRating = hrRating;
      appraisal.hrComment = hrComment;
      appraisal.finalRating = calculatedFinal.toFixed(2);
      appraisal.status = 'Completed';

      // Snapshots capture
      const [goals, kpis] = await Promise.all([
        PerformanceGoal.findAll({ where: { employeeId: appraisal.employeeId, performanceMasterId: appraisal.performanceMasterId }, transaction }),
        PerformanceKpi.findAll({ where: { employeeId: appraisal.employeeId, performanceMasterId: appraisal.performanceMasterId }, transaction })
      ]);

      appraisal.goalsSnapshot = goals;
      appraisal.kpisSnapshot = kpis;
      appraisal.competenciesSnapshot = {
        selfReviewWeight: cycle.selfReviewWeight,
        managerReviewWeight: cycle.managerReviewWeight,
        ratingScale: cycle.ratingScale
      };

      await appraisal.save({ transaction });
      await transaction.commit();

      await this.logPerformanceAction(executorId, 'Update', 'Appraisal Workflow', id, 'Success', oldValues, appraisal);
      return appraisal;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async acknowledgeAppraisal(id, executorId) {
    const appraisal = await PerformanceAppraisal.findByPk(id);
    if (!appraisal) throw new ApiError(404, 'Appraisal not found.');
    if (appraisal.status !== 'Completed') throw new ApiError(400, 'Appraisal not finalized yet.');

    const oldValues = { ...appraisal.toJSON() };
    appraisal.employeeAcknowledgement = true;
    appraisal.employeeAcknowledgedAt = new Date();
    appraisal.status = 'Acknowledged';

    await appraisal.save();
    await this.logPerformanceAction(executorId, 'Update', 'Appraisal Workflow', id, 'Success', oldValues, appraisal);
    return appraisal;
  }

  // ==================== PROMOTIONS & INCREMENTS ====================
  async recommendPromotion(payload, executorId) {
    const { employeeId, proposedDesignationId, reason, effectiveDate } = payload;

    const employee = await Employee.findByPk(employeeId);
    if (!employee) throw new ApiError(404, 'Employee not found.');

    const currentDesignationId = employee.designationId;

    const promotion = await EmployeePromotion.create({
      employeeId,
      currentDesignationId,
      proposedDesignationId,
      reason,
      effectiveDate,
      status: 'Pending'
    });

    await this.logPerformanceAction(executorId, 'Create', 'Promotion Recommendations', promotion.id, 'Success', null, promotion);
    return promotion;
  }

  async approvePromotion(id, executorId) {
    const promotion = await EmployeePromotion.findByPk(id);
    if (!promotion) throw new ApiError(404, 'Promotion recommendation not found.');
    if (promotion.status !== 'Pending') throw new ApiError(400, `Promotion is in ${promotion.status} state.`);

    const oldValues = { ...promotion.toJSON() };
    const transaction = await sequelize.transaction();

    try {
      promotion.status = 'Approved';
      promotion.approvedBy = executorId;
      await promotion.save({ transaction });

      // Apply Promotion designation update dynamically if effective date is today or passed
      const today = new Date().toISOString().split('T')[0];
      if (promotion.effectiveDate <= today) {
        await Employee.update(
          { designationId: promotion.proposedDesignationId },
          { where: { id: promotion.employeeId }, transaction }
        );
        promotion.status = 'Implemented';
        await promotion.save({ transaction });
      }

      await transaction.commit();
      await this.logPerformanceAction(executorId, 'Approve', 'Promotion Recommendations', id, 'Success', oldValues, promotion);
      return promotion;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async recommendIncrement(payload, executorId) {
    const { employeeId, incrementPercentage, incrementAmount, reason, effectiveDate, performanceScore } = payload;

    const currentAssignment = await EmployeeSalaryAssignment.findOne({
      where: { employeeId, isActive: true }
    });

    const currentSalary = currentAssignment ? parseFloat(currentAssignment.baseGross) : 0;
    let calculatedIncrement = parseFloat(incrementAmount || 0);
    if (parseFloat(incrementPercentage) > 0) {
      calculatedIncrement = (currentSalary * parseFloat(incrementPercentage)) / 100;
    }
    const newSalary = currentSalary + calculatedIncrement;

    const increment = await EmployeeIncrement.create({
      employeeId,
      currentSalaryAssignmentId: currentAssignment ? currentAssignment.id : null,
      currentSalary,
      incrementPercentage: parseFloat(incrementPercentage || 0),
      incrementAmount: calculatedIncrement,
      newSalary,
      reason,
      performanceScore,
      effectiveDate,
      status: 'Pending'
    });

    await this.logPerformanceAction(executorId, 'Create', 'Salary Increments', increment.id, 'Success', null, increment);
    return increment;
  }

  async approveIncrement(id, executorId) {
    const increment = await EmployeeIncrement.findByPk(id);
    if (!increment) throw new ApiError(404, 'Increment recommendation not found.');
    if (increment.status !== 'Pending') throw new ApiError(400, `Increment is in ${increment.status} state.`);

    const oldValues = { ...increment.toJSON() };
    const transaction = await sequelize.transaction();

    try {
      increment.status = 'Approved';
      increment.approvedBy = executorId;
      await increment.save({ transaction });

      // Apply salary assignment change dynamically if effective date is today or passed
      const today = new Date().toISOString().split('T')[0];
      if (increment.effectiveDate <= today) {
        // Fetch current active assignment
        const activeAssignment = await EmployeeSalaryAssignment.findOne({
          where: { employeeId: increment.employeeId, isActive: true },
          transaction
        });

        if (activeAssignment) {
          // Deactivate
          const yesterday = new Date(increment.effectiveDate);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          activeAssignment.isActive = false;
          activeAssignment.effectiveTo = yesterdayStr;
          await activeAssignment.save({ transaction });

          // Estimate CTC (baseGross * 12 + standard employer Pf / ESI)
          const newGross = parseFloat(increment.newSalary);
          const ctc = newGross * 12; // simplified

          // Create new salary assignment revision
          await EmployeeSalaryAssignment.create({
            employeeId: increment.employeeId,
            salaryStructureId: activeAssignment.salaryStructureId,
            effectiveFrom: increment.effectiveDate,
            baseGross: newGross,
            ctc,
            isActive: true
          }, { transaction });
        }

        increment.status = 'Implemented';
        await increment.save({ transaction });
      }

      await transaction.commit();
      await this.logPerformanceAction(executorId, 'Approve', 'Salary Increments', id, 'Success', oldValues, increment);
      return increment;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  // ==================== REPORTS ENGINE ====================
  async getPerformanceReport(type, filters = {}) {
    const { employeeId, departmentId, performanceMasterId, status } = filters;
    const empWhere = {};
    if (departmentId) empWhere.departmentId = departmentId;

    const include = [{
      model: Employee,
      as: 'employee',
      where: Object.keys(empWhere).length > 0 ? empWhere : undefined,
      include: [{ model: Department, as: 'departmentDetails' }]
    }];

    switch (type) {
      case 'goals': {
        const where = {};
        if (employeeId) where.employeeId = employeeId;
        if (status) where.status = status;
        if (performanceMasterId) where.performanceMasterId = performanceMasterId;

        return await PerformanceGoal.findAll({
          where,
          include: [...include, { model: PerformanceMaster, as: 'reviewCycle' }]
        });
      }

      case 'kpis': {
        const where = {};
        if (employeeId) where.employeeId = employeeId;
        if (status) where.status = status;
        if (performanceMasterId) where.performanceMasterId = performanceMasterId;

        return await PerformanceKpi.findAll({
          where,
          include: [...include, { model: PerformanceMaster, as: 'reviewCycle' }]
        });
      }

      case 'appraisal': {
        const where = {};
        if (employeeId) where.employeeId = employeeId;
        if (status) where.status = status;
        if (performanceMasterId) where.performanceMasterId = performanceMasterId;

        return await PerformanceAppraisal.findAll({
          where,
          include: [...include, { model: PerformanceMaster, as: 'reviewCycle' }]
        });
      }

      case 'promotions': {
        const where = {};
        if (employeeId) where.employeeId = employeeId;
        if (status) where.status = status;

        return await EmployeePromotion.findAll({
          where,
          include: [
            ...include,
            { model: Designation, as: 'proposedDesignation' }
          ]
        });
      }

      case 'increments': {
        const where = {};
        if (employeeId) where.employeeId = employeeId;
        if (status) where.status = status;

        return await EmployeeIncrement.findAll({
          where,
          include
        });
      }

      default:
        throw new ApiError(400, 'Unsupported performance report type.');
    }
  }

  async exportReportCsv(type, filters = {}) {
    const data = await this.getPerformanceReport(type, filters);
    let csv = '';

    if (type === 'goals') {
      csv = 'Goal ID,Employee,Cycle,Title,Weightage,Progress,Status,Start Date,End Date\n';
      data.forEach(g => {
        csv += `"${g.id}","${g.employee?.employeeName || ''}","${g.reviewCycle?.cycleName || ''}","${g.title}",${g.weightage},${g.progress},"${g.status}","${g.startDate}","${g.endDate}"\n`;
      });
    } else if (type === 'kpis') {
      csv = 'KPI ID,Employee,Cycle,Metric Name,Target,Actual,Weight,Score,Status\n';
      data.forEach(k => {
        csv += `"${k.id}","${k.employee?.employeeName || ''}","${k.reviewCycle?.cycleName || ''}","${k.name}","${k.target}",${k.actualAchievement},${k.weight},${k.calculatedScore},"${k.status}"\n`;
      });
    } else if (type === 'appraisal') {
      csv = 'Appraisal ID,Employee,Cycle,Self Rating,Manager Rating,HR Rating,Final Score,Status\n';
      data.forEach(a => {
        csv += `"${a.id}","${a.employee?.employeeName || ''}","${a.reviewCycle?.cycleName || ''}",${a.selfRating},${a.managerRating},${a.hrRating},${a.finalRating},"${a.status}"\n`;
      });
    } else if (type === 'promotions') {
      csv = 'Promotion ID,Employee,Proposed Designation,Effective Date,Status\n';
      data.forEach(p => {
        csv += `"${p.id}","${p.employee?.employeeName || ''}","${p.proposedDesignation?.desigName || ''}","${p.effectiveDate}","${p.status}"\n`;
      });
    } else if (type === 'increments') {
      csv = 'Increment ID,Employee,Current Salary,Increment Amt,New Salary,Score,Effective Date,Status\n';
      data.forEach(inc => {
        csv += `"${inc.id}","${inc.employee?.employeeName || ''}",${inc.currentSalary},${inc.incrementAmount},${inc.newSalary},${inc.performanceScore},"${inc.effectiveDate}","${inc.status}"\n`;
      });
    }

    return csv;
  }
}

module.exports = new PerformanceService();
