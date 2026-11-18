// backend/services/finance/esi.service.js
const { EsiContribution, Employee, Department, User } = require('../../models');
const { Op } = require('sequelize');
const auditLogService = require('../core/auditLog.service');

class EsiService {
  async getEsiContributions(filters = {}) {
    const { employeeId, month, year, department, status, search } = filters;
    const where = {};
    if (employeeId) where.employeeId = employeeId;
    if (month) where.month = month;
    if (year) where.year = parseInt(year);
    if (status) where.status = status;

    const empWhere = {};
    if (department) empWhere.department = department;
    if (search && search.trim().length > 0) {
      empWhere[Op.or] = [
        { employeeName: { [Op.like]: `%${search.trim()}%` } },
        { employeeCode: { [Op.like]: `%${search.trim()}%` } },
        { email: { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    return await EsiContribution.findAll({
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

  async getEsiReport(filters = {}) {
    const contributions = await this.getEsiContributions(filters);

    let totalEmployeeContribution = 0;
    let totalEmployerContribution = 0;
    let totalContribution = 0;
    let totalGrossWages = 0;
    const missingEsiNumbers = [];
    const records = [];

    contributions.forEach(c => {
      const empCont = parseFloat(c.employeeContribution || 0);
      const employerCont = parseFloat(c.employerContribution || 0);
      const gross = parseFloat(c.grossWages || 0);

      totalEmployeeContribution += empCont;
      totalEmployerContribution += employerCont;
      totalContribution += (empCont + employerCont);
      totalGrossWages += gross;

      const emp = c.employee || {};
      const empName = emp.employeeName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';
      const esiNum = c.esiNumber || emp.esicNumber || emp.esiNumber || '';

      if (!esiNum || esiNum.trim() === '') {
        missingEsiNumbers.push({
          employeeId: c.employeeId,
          employeeName: empName,
          employeeCode: emp.employeeCode || emp.employeeId,
          grossWages: gross
        });
      }

      records.push({
        id: c.id,
        employeeId: c.employeeId,
        employeeName: empName,
        employeeCode: emp.employeeCode || emp.employeeId || '--',
        department: emp.department || '--',
        esiNumber: esiNum || 'Missing IP Number',
        grossWages: gross,
        employeeContribution: empCont,
        employerContribution: employerCont,
        totalContribution: Math.round((empCont + employerCont) * 100) / 100,
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
        totalGrossWages: Math.round(totalGrossWages * 100) / 100,
        totalEmployeeContribution: Math.round(totalEmployeeContribution * 100) / 100,
        totalEmployerContribution: Math.round(totalEmployerContribution * 100) / 100,
        totalContribution: Math.round(totalContribution * 100) / 100,
        missingIdentifiersCount: missingEsiNumbers.length
      },
      missingIdentifiers: missingEsiNumbers,
      records
    };
  }

  async updateEsiChallan(payload, executorId) {
    const { month, year, challanNumber, paymentDate, status = 'Filed' } = payload;
    if (!month || !year) {
      throw new Error('Month and Year are required to update ESI challan status.');
    }

    const [updatedCount] = await EsiContribution.update(
      {
        challanNumber: challanNumber || null,
        paymentDate: paymentDate || new Date(),
        status
      },
      {
        where: {
          month,
          year: parseInt(year)
        }
      }
    );

    try {
      const user = await User.findByPk(executorId);
      await auditLogService.log({
        userId: executorId,
        username: user ? user.email : 'Admin',
        roleName: 'Admin',
        actionType: 'Update Challan',
        moduleName: 'ESI Management',
        recordId: `${month}-${year}`,
        newValues: payload,
        status: 'Success'
      });
    } catch (e) {}

    return { updatedCount, month, year, challanNumber, status };
  }

  async exportEsiCsv(filters = {}) {
    const report = await this.getEsiReport(filters);
    let csv = 'Employee Code,Employee Name,Department,IP / ESI Number,Gross Wages,Employee Contrib (0.75%),Employer Contrib (3.25%),Total Contribution,Challan No,Payment Date,Status\n';

    report.records.forEach(r => {
      csv += `"${r.employeeCode}","${r.employeeName}","${r.department}","${r.esiNumber}",${r.grossWages},${r.employeeContribution},${r.employerContribution},${r.totalContribution},"${r.challanNumber}","${r.paymentDate}","${r.status}"\n`;
    });

    return csv;
  }
}

module.exports = new EsiService();
