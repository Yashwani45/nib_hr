// backend/services/finance/report.service.js
const {
  PayrollRun,
  PayrollItem,
  Payslip,
  EmployeeLoan,
  LoanRepayment,
  EsiContribution,
  ProfessionalTaxContribution,
  Employee,
  Department
} = require('../../models');
const { Op } = require('sequelize');

class ReportService {
  async getReportData(type, filters = {}) {
    const { month, year, employeeId, departmentId, status, startDate, endDate } = filters;
    const itemWhere = {};
    const empWhere = {};

    if (employeeId) itemWhere.employeeId = employeeId;
    if (status) itemWhere.status = status;

    if (departmentId) {
      empWhere.departmentId = departmentId;
    }

    const itemInclude = [{
      model: Employee,
      as: 'employee',
      where: Object.keys(empWhere).length > 0 ? empWhere : undefined,
      include: [{ model: Department, as: 'departmentDetails' }]
    }];

    switch (type) {
      case 'payroll': {
        const runWhere = {};
        if (month) runWhere.month = month;
        if (year) runWhere.year = parseInt(year);

        return await PayrollItem.findAll({
          where: itemWhere,
          include: [
            ...itemInclude,
            { model: PayrollRun, as: 'run', where: Object.keys(runWhere).length > 0 ? runWhere : undefined }
          ],
          order: [['created_at', 'DESC']]
        });
      }

      case 'payslip': {
        const payslipWhere = {};
        if (employeeId) payslipWhere.employeeId = employeeId;
        if (month) payslipWhere.month = month;
        if (year) payslipWhere.year = parseInt(year);
        if (status) payslipWhere.paymentStatus = status;

        return await Payslip.findAll({
          where: payslipWhere,
          include: [{
            model: Employee,
            as: 'employee',
            where: Object.keys(empWhere).length > 0 ? empWhere : undefined
          }],
          order: [['year', 'DESC'], ['month', 'DESC']]
        });
      }

      case 'loan': {
        const loanWhere = {};
        if (employeeId) loanWhere.employeeId = employeeId;
        if (status) loanWhere.status = status;

        return await EmployeeLoan.findAll({
          where: loanWhere,
          include: [{
            model: Employee,
            as: 'employee',
            where: Object.keys(empWhere).length > 0 ? empWhere : undefined
          }],
          order: [['created_at', 'DESC']]
        });
      }

      case 'loan_emi': {
        const repayWhere = {};
        if (startDate && endDate) {
          repayWhere.paymentDate = { [Op.between]: [startDate, endDate] };
        }

        return await LoanRepayment.findAll({
          where: repayWhere,
          include: [{
            model: EmployeeLoan,
            as: 'loan',
            where: employeeId ? { employeeId } : undefined,
            include: [{
              model: Employee,
              as: 'employee',
              where: Object.keys(empWhere).length > 0 ? empWhere : undefined
            }]
          }],
          order: [['payment_date', 'DESC']]
        });
      }

      case 'esi': {
        const esiWhere = {};
        if (employeeId) esiWhere.employeeId = employeeId;
        if (month) esiWhere.month = month;
        if (year) esiWhere.year = parseInt(year);

        return await EsiContribution.findAll({
          where: esiWhere,
          include: [{
            model: Employee,
            as: 'employee',
            where: Object.keys(empWhere).length > 0 ? empWhere : undefined
          }],
          order: [['year', 'DESC'], ['month', 'DESC']]
        });
      }

      case 'pt': {
        const ptWhere = {};
        if (employeeId) ptWhere.employeeId = employeeId;
        if (month) ptWhere.month = month;
        if (year) ptWhere.year = parseInt(year);

        return await ProfessionalTaxContribution.findAll({
          where: ptWhere,
          include: [{
            model: Employee,
            as: 'employee',
            where: Object.keys(empWhere).length > 0 ? empWhere : undefined
          }],
          order: [['year', 'DESC'], ['month', 'DESC']]
        });
      }

      default:
        throw new Error('Unsupported report type.');
    }
  }

  async exportToCsv(type, filters = {}) {
    const data = await this.getReportData(type, filters);
    let csvContent = '';

    if (type === 'payroll') {
      csvContent = 'Payroll ID,Employee Name,Employee Code,Department,Gross Salary,Allowances,Deductions,Net Salary,Status\n';
      data.forEach(item => {
        const emp = item.employee || {};
        csvContent += `"${item.id}","${emp.employeeName || ''}","${emp.employeeCode || ''}","${emp.department || ''}",${item.grossSalary},${item.totalAllowances},${item.totalDeductions},${item.netSalary},"${item.status}"\n`;
      });
    } else if (type === 'payslip') {
      csvContent = 'Payslip ID,Employee Name,Month,Year,Basic,HRA,Gross Salary,Deductions,Net Salary,Payment Status\n';
      data.forEach(item => {
        const emp = item.employee || {};
        csvContent += `"${item.id}","${emp.employeeName || ''}","${item.month}",${item.year},${item.basic},${item.hra},${item.grossSalary},${item.totalDeductions},${item.netSalary},"${item.paymentStatus}"\n`;
      });
    } else if (type === 'loan') {
      csvContent = 'Loan ID,Employee Name,Loan Type,Requested Amount,Approved Amount,Tenure (Months),Outstanding Balance,Status\n';
      data.forEach(item => {
        const emp = item.employee || {};
        csvContent += `"${item.id}","${emp.employeeName || ''}","${item.loanType}",${item.requestedAmount},${item.approvedAmount || 0},${item.tenureMonths},${item.outstandingBalance},"${item.status}"\n`;
      });
    } else if (type === 'esi') {
      csvContent = 'Employee Name,ESI Number,Gross Wages,Employee Contrib (0.75%),Employer Contrib (3.25%),Total ESI,Month,Year\n';
      data.forEach(item => {
        const emp = item.employee || {};
        const total = parseFloat(item.employeeContribution) + parseFloat(item.employerContribution);
        csvContent += `"${emp.employeeName || ''}","${item.esiNumber}",${item.grossWages},${item.employeeContribution},${item.employerContribution},${total},"${item.month}",${item.year}\n`;
      });
    } else if (type === 'pt') {
      csvContent = 'Employee Name,State,Gross Salary,PT Amount,Month,Year\n';
      data.forEach(item => {
        const emp = item.employee || {};
        csvContent += `"${emp.employeeName || ''}","${item.state}",${item.ptAmount * 100},${item.ptAmount},"${item.month}",${item.year}\n`; // placeholder gross estimation
      });
    }

    return csvContent;
  }
}

module.exports = new ReportService();
