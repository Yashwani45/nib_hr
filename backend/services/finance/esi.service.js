// backend/services/finance/esi.service.js
const { EsiContribution, Employee, Department } = require('../../models');
const { Op } = require('sequelize');

class EsiService {
  async getEsiContributions(filters = {}) {
    const { employeeId, month, year, departmentId } = filters;
    const where = {};
    if (employeeId) where.employeeId = employeeId;
    if (month) where.month = month;
    if (year) where.year = parseInt(year);

    const include = [{
      model: Employee,
      as: 'employee',
      include: departmentId ? [{ model: Department, as: 'departmentDetails', where: { id: departmentId } }] : []
    }];

    return await EsiContribution.findAll({
      where,
      include,
      order: [['year', 'DESC'], ['month', 'DESC']]
    });
  }

  async getEsiReport(filters = {}) {
    const contributions = await this.getEsiContributions(filters);
    
    // Aggregate data
    let totalEmployeeContribution = 0;
    let totalEmployerContribution = 0;
    let totalContribution = 0;
    const employeeBreakdown = {};

    contributions.forEach(c => {
      const empCont = parseFloat(c.employeeContribution || 0);
      const employerCont = parseFloat(c.employerContribution || 0);
      
      totalEmployeeContribution += empCont;
      totalEmployerContribution += employerCont;
      totalContribution += (empCont + employerCont);

      const name = c.employee ? c.employee.employeeName : 'Unknown Employee';
      if (!employeeBreakdown[c.employeeId]) {
        employeeBreakdown[c.employeeId] = {
          employeeName: name,
          esiNumber: c.esiNumber,
          employeeContribution: 0,
          employerContribution: 0,
          grossWages: 0
        };
      }
      employeeBreakdown[c.employeeId].employeeContribution += empCont;
      employeeBreakdown[c.employeeId].employerContribution += employerCont;
      employeeBreakdown[c.employeeId].grossWages += parseFloat(c.grossWages || 0);
    });

    return {
      summary: {
        totalEmployees: Object.keys(employeeBreakdown).length,
        totalEmployeeContribution,
        totalEmployerContribution,
        totalContribution
      },
      records: Object.values(employeeBreakdown)
    };
  }
}

module.exports = new EsiService();
