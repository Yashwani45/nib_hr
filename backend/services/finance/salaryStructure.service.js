// backend/services/finance/salaryStructure.service.js
const { SalaryStructure, SalaryComponent, EmployeeSalaryAssignment, Employee, User } = require('../../models');
const ApiError = require('../../utils/apiError');
const auditLogService = require('../core/auditLog.service');
const { Op } = require('sequelize');

class SalaryStructureService {
  async logStructureAction(userId, action, recordId, status, oldValues = null, newValues = null) {
    try {
      const user = await User.findByPk(userId);
      await auditLogService.log({
        userId,
        username: user ? user.email : 'Admin',
        roleName: 'Admin',
        actionType: action,
        moduleName: 'Salary Structure',
        recordId,
        previousValues: oldValues,
        newValues,
        status
      });
    } catch (e) {}
  }

  async createSalaryStructure(payload, executorId) {
    const { name, description, components = [] } = payload;

    const structure = await SalaryStructure.create({
      name,
      description,
      isActive: true
    });

    for (const comp of components) {
      await SalaryComponent.create({
        salaryStructureId: structure.id,
        name: comp.name,
        type: comp.type, // 'Earning' or 'Deduction'
        calculationType: comp.calculationType, // 'Fixed' or 'Percentage'
        value: comp.value,
        referenceComponent: comp.referenceComponent || null
      });
    }

    await this.logStructureAction(executorId, 'Create', structure.id, 'Success', null, structure);
    return this.getStructureDetails(structure.id);
  }

  async getSalaryStructures(filters = {}) {
    const { isActive } = filters;
    const where = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';

    return await SalaryStructure.findAll({
      where,
      include: [{ model: SalaryComponent, as: 'components' }],
      order: [['created_at', 'DESC']]
    });
  }

  async getStructureDetails(id) {
    const structure = await SalaryStructure.findByPk(id, {
      include: [{ model: SalaryComponent, as: 'components' }]
    });
    if (!structure) {
      throw new ApiError(404, 'Salary structure not found.');
    }
    return structure;
  }

  async updateSalaryStructure(id, payload, executorId) {
    const structure = await SalaryStructure.findByPk(id);
    if (!structure) {
      throw new ApiError(404, 'Salary structure not found.');
    }

    const oldValues = { ...structure.toJSON() };
    const { name, description, components } = payload;
    
    if (name) structure.name = name;
    if (description) structure.description = description;
    await structure.save();

    if (components) {
      // Clear existing components
      await SalaryComponent.destroy({ where: { salaryStructureId: id } });
      for (const comp of components) {
        await SalaryComponent.create({
          salaryStructureId: id,
          name: comp.name,
          type: comp.type,
          calculationType: comp.calculationType,
          value: comp.value,
          referenceComponent: comp.referenceComponent || null
        });
      }
    }

    await this.logStructureAction(executorId, 'Update', id, 'Success', oldValues, structure);
    return this.getStructureDetails(id);
  }

  async assignSalaryStructure(payload, executorId) {
    const { employeeId, salaryStructureId, effectiveFrom, baseGross } = payload;

    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      throw new ApiError(404, 'Employee not found.');
    }

    const structure = await SalaryStructure.findByPk(salaryStructureId, {
      include: [{ model: SalaryComponent, as: 'components' }]
    });
    if (!structure) {
      throw new ApiError(404, 'Salary structure not found.');
    }

    // Deactivate previous active assignments (Preserve History with effectiveTo dates)
    const activeAssignments = await EmployeeSalaryAssignment.findAll({
      where: { employeeId, isActive: true }
    });

    const previousEffectiveTo = new Date(effectiveFrom);
    previousEffectiveTo.setDate(previousEffectiveTo.getDate() - 1);
    const effectiveToStr = previousEffectiveTo.toISOString().split('T')[0];

    for (const active of activeAssignments) {
      active.isActive = false;
      active.effectiveTo = effectiveToStr;
      await active.save();
    }

    // Estimate CTC: Gross * 12 + employer PF/ESI estimates
    const grossVal = parseFloat(baseGross);
    const comps = structure.components || [];
    let annualCtc = grossVal * 12;

    const cComponent = comps.find(c => c.name.toLowerCase() === 'basic') || comps[0];
    let basicVal = grossVal * 0.50; // standard fallback
    if (cComponent) {
      if (cComponent.calculationType === 'Fixed') {
        basicVal = parseFloat(cComponent.value);
      } else {
        basicVal = (grossVal * parseFloat(cComponent.value)) / 100;
      }
    }

    // Add employer contribution estimates to CTC
    let employerPf = 0;
    if (employee.pfApplicable) {
      employerPf = (basicVal * 12) / 100; // standard 12% employer contribution
    }

    let employerEsi = 0;
    if (employee.esiApplicable && grossVal <= 21000) {
      employerEsi = (grossVal * 3.25) / 100;
    }

    const ctc = annualCtc + (employerPf * 12) + (employerEsi * 12);

    const assignment = await EmployeeSalaryAssignment.create({
      employeeId,
      salaryStructureId,
      effectiveFrom,
      baseGross: grossVal,
      ctc,
      isActive: true
    });

    await this.logStructureAction(executorId, 'Create', assignment.id, 'Success', null, assignment);
    return assignment;
  }
}

module.exports = new SalaryStructureService();
