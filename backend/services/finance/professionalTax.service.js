// backend/services/finance/professionalTax.service.js
const { ProfessionalTaxRule, ProfessionalTaxContribution, Employee, Department, User } = require('../../models');
const { Op } = require('sequelize');
const auditLogService = require('../core/auditLog.service');

class ProfessionalTaxService {
  async getPtRules(filters = {}) {
    const { state } = filters;
    const where = {};
    if (state) where.state = state;
    return await ProfessionalTaxRule.findAll({
      where,
      order: [['state', 'ASC'], ['min_salary', 'ASC']]
    });
  }

  async createPtRule(payload, executorId) {
    const { state, minSalary, maxSalary, taxAmount, effectiveFrom } = payload;

    const minSal = parseFloat(minSalary);
    const maxSal = parseFloat(maxSalary);
    const taxAmt = parseFloat(taxAmount);

    if (!state || isNaN(minSal) || isNaN(maxSal) || isNaN(taxAmt) || !effectiveFrom) {
      throw new Error('State, Min Salary, Max Salary, Tax Amount, and Effective From date are required.');
    }

    const rule = await ProfessionalTaxRule.create({
      state: state.trim(),
      minSalary: minSal,
      maxSalary: maxSal,
      taxAmount: taxAmt,
      effectiveFrom
    });

    try {
      const user = await User.findByPk(executorId);
      await auditLogService.log({
        userId: executorId,
        username: user ? user.email : 'Admin',
        roleName: 'Admin',
        actionType: 'Create',
        moduleName: 'Statutory & Tax',
        recordId: rule.id,
        newValues: rule,
        status: 'Success'
      });
    } catch (e) {}

    return rule;
  }

  async updatePtRule(id, payload, executorId) {
    const rule = await ProfessionalTaxRule.findByPk(id);
    if (!rule) {
      throw new Error('Professional tax rule not found.');
    }

    const oldValues = { ...rule.toJSON() };
    const { state, minSalary, maxSalary, taxAmount, effectiveFrom } = payload;

    if (state) rule.state = state.trim();
    if (minSalary !== undefined) rule.minSalary = parseFloat(minSalary);
    if (maxSalary !== undefined) rule.maxSalary = parseFloat(maxSalary);
    if (taxAmount !== undefined) rule.taxAmount = parseFloat(taxAmount);
    if (effectiveFrom) rule.effectiveFrom = effectiveFrom;
    await rule.save();

    try {
      const user = await User.findByPk(executorId);
      await auditLogService.log({
        userId: executorId,
        username: user ? user.email : 'Admin',
        roleName: 'Admin',
        actionType: 'Update',
        moduleName: 'Statutory & Tax',
        recordId: rule.id,
        previousValues: oldValues,
        newValues: rule,
        status: 'Success'
      });
    } catch (e) {}

    return rule;
  }

  async deletePtRule(id, executorId) {
    const rule = await ProfessionalTaxRule.findByPk(id);
    if (!rule) {
      throw new Error('Professional tax rule not found.');
    }

    const oldValues = { ...rule.toJSON() };
    await rule.destroy();

    try {
      const user = await User.findByPk(executorId);
      await auditLogService.log({
        userId: executorId,
        username: user ? user.email : 'Admin',
        roleName: 'Admin',
        actionType: 'Delete',
        moduleName: 'Statutory & Tax',
        recordId: id,
        previousValues: oldValues,
        status: 'Success'
      });
    } catch (e) {}

    return { success: true, message: 'PT rule deleted successfully.' };
  }

  async getPtContributions(filters = {}) {
    const { employeeId, month, year, state, status, search } = filters;
    const where = {};
    if (employeeId) where.employeeId = employeeId;
    if (month) where.month = month;
    if (year) where.year = parseInt(year);
    if (state) where.state = state;
    if (status) where.status = status;

    const empWhere = {};
    if (search && search.trim().length > 0) {
      empWhere[Op.or] = [
        { employeeName: { [Op.like]: `%${search.trim()}%` } },
        { employeeCode: { [Op.like]: `%${search.trim()}%` } },
        { email: { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    return await ProfessionalTaxContribution.findAll({
      where,
      include: [{
        model: Employee,
        as: 'employee',
        where: Object.keys(empWhere).length > 0 ? empWhere : undefined
      }],
      order: [
        ['year', 'DESC'],
        ['month', 'DESC'],
        ['created_at', 'DESC']
      ]
    });
  }

  async getPtReport(filters = {}) {
    const contributions = await this.getPtContributions(filters);

    let totalPtAmount = 0;
    const stateBreakdown = {};
    const records = [];

    contributions.forEach(c => {
      const amount = parseFloat(c.ptAmount || 0);
      totalPtAmount += amount;

      const st = c.state || 'Other';
      if (!stateBreakdown[st]) {
        stateBreakdown[st] = { state: st, count: 0, totalAmount: 0 };
      }
      stateBreakdown[st].count += 1;
      stateBreakdown[st].totalAmount += amount;

      const emp = c.employee || {};
      const name = emp.employeeName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';

      records.push({
        id: c.id,
        employeeId: c.employeeId,
        employeeName: name,
        employeeCode: emp.employeeCode || emp.employeeId || '--',
        department: emp.department || '--',
        state: c.state,
        ptAmount: amount,
        month: c.month,
        year: c.year,
        status: c.status || 'Draft',
        challanNumber: c.challanNumber || '--',
        paymentDate: c.paymentDate || '--'
      });
    });

    return {
      summary: {
        totalEmployees: records.length,
        totalPtAmount: Math.round(totalPtAmount * 100) / 100,
        stateBreakdown: Object.values(stateBreakdown)
      },
      records
    };
  }

  async updatePtChallan(payload, executorId) {
    const { month, year, state, challanNumber, paymentDate, status = 'Filed' } = payload;
    if (!month || !year) {
      throw new Error('Month and Year are required.');
    }

    const where = { month, year: parseInt(year) };
    if (state) where.state = state;

    const [updatedCount] = await ProfessionalTaxContribution.update(
      {
        challanNumber: challanNumber || null,
        paymentDate: paymentDate || new Date(),
        status
      },
      { where }
    );

    try {
      const user = await User.findByPk(executorId);
      await auditLogService.log({
        userId: executorId,
        username: user ? user.email : 'Admin',
        roleName: 'Admin',
        actionType: 'Update Challan',
        moduleName: 'Professional Tax',
        recordId: `${month}-${year}`,
        newValues: payload,
        status: 'Success'
      });
    } catch (e) {}

    return { updatedCount, month, year, challanNumber, status };
  }

  async exportPtCsv(filters = {}) {
    const report = await this.getPtReport(filters);
    let csv = 'Employee Code,Employee Name,Department,State Jurisdiction,PT Amount,Month,Year,Challan No,Payment Date,Status\n';

    report.records.forEach(r => {
      csv += `"${r.employeeCode}","${r.employeeName}","${r.department}","${r.state}",${r.ptAmount},"${r.month}",${r.year},"${r.challanNumber}","${r.paymentDate}","${r.status}"\n`;
    });

    return csv;
  }
}

module.exports = new ProfessionalTaxService();
