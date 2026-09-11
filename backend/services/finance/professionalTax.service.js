// backend/services/finance/professionalTax.service.js
const { ProfessionalTaxRule, ProfessionalTaxContribution, Employee, Department, User } = require('../../models');
const { Op } = require('sequelize');
const auditLogService = require('../core/auditLog.service');

class ProfessionalTaxService {
  async getPtRules(filters = {}) {
    const { state } = filters;
    const where = {};
    if (state) where.state = state;
    return await ProfessionalTaxRule.findAll({ where, order: [['state', 'ASC'], ['minSalary', 'ASC']] });
  }

  async createPtRule(payload, executorId) {
    const { state, minSalary, maxSalary, taxAmount, effectiveFrom } = payload;
    
    // Check if duplicate rule exists
    const rule = await ProfessionalTaxRule.create({
      state,
      minSalary,
      maxSalary,
      taxAmount,
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

  async getPtContributions(filters = {}) {
    const { employeeId, month, year, state } = filters;
    const where = {};
    if (employeeId) where.employeeId = employeeId;
    if (month) where.month = month;
    if (year) where.year = parseInt(year);
    if (state) where.state = state;

    return await ProfessionalTaxContribution.findAll({
      where,
      include: [{ model: Employee, as: 'employee' }],
      order: [['year', 'DESC'], ['month', 'DESC']]
    });
  }

  async getPtReport(filters = {}) {
    const contributions = await this.getPtContributions(filters);

    let totalPtAmount = 0;
    const stateBreakdown = {};
    const employeeBreakdown = {};

    contributions.forEach(c => {
      const amount = parseFloat(c.ptAmount || 0);
      totalPtAmount += amount;

      // State breakdown
      if (!stateBreakdown[c.state]) {
        stateBreakdown[c.state] = 0;
      }
      stateBreakdown[c.state] += amount;

      // Employee breakdown
      const name = c.employee ? c.employee.employeeName : 'Unknown Employee';
      if (!employeeBreakdown[c.employeeId]) {
        employeeBreakdown[c.employeeId] = {
          employeeName: name,
          employeeCode: c.employee ? c.employee.employeeCode : '',
          state: c.state,
          ptAmount: 0
        };
      }
      employeeBreakdown[c.employeeId].ptAmount += amount;
    });

    return {
      summary: {
        totalEmployees: Object.keys(employeeBreakdown).length,
        totalPtAmount,
        stateBreakdown
      },
      records: Object.values(employeeBreakdown)
    };
  }
}

module.exports = new ProfessionalTaxService();
