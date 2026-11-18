// backend/services/finance/report.service.js
const {
  PayrollRun,
  PayrollItem,
  PayrollEarning,
  PayrollDeduction,
  Payslip,
  EmployeeLoan,
  LoanRepayment,
  LoanEmiSchedule,
  EsiContribution,
  ProfessionalTaxContribution,
  EmployeeSalaryAssignment,
  Employee,
  Department,
  AuditLog,
  User,
  sequelize
} = require('../../models');
const { Op } = require('sequelize');

class ReportService {
  async getReportData(type, filters = {}) {
    const {
      month = 'January',
      year = '2026',
      employeeId,
      department,
      status,
      startDate,
      endDate,
      search
    } = filters;

    const yr = parseInt(year);
    const empWhere = {};
    if (department) empWhere.department = department;
    if (employeeId) empWhere.id = employeeId;
    if (search && search.trim().length > 0) {
      empWhere[Op.or] = [
        { employeeName: { [Op.like]: `%${search.trim()}%` } },
        { employeeCode: { [Op.like]: `%${search.trim()}%` } },
        { email: { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    switch (type) {
      // 1. Monthly Payroll Summary
      case 'monthly_summary':
      case 'payroll': {
        const runWhere = { month, year: yr };
        if (status) runWhere.status = status;

        const items = await PayrollItem.findAll({
          include: [
            {
              model: Employee,
              as: 'employee',
              where: Object.keys(empWhere).length > 0 ? empWhere : undefined
            },
            {
              model: PayrollRun,
              as: 'run',
              where: runWhere
            }
          ],
          order: [['created_at', 'DESC']]
        });

        let totalGross = 0, totalDeductions = 0, totalNet = 0, totalEmployerPf = 0, totalEmployerEsi = 0, totalCtc = 0;
        items.forEach(i => {
          totalGross += parseFloat(i.grossSalary || 0);
          totalDeductions += parseFloat(i.totalDeductions || 0);
          totalNet += parseFloat(i.netSalary || 0);
          totalEmployerPf += parseFloat(i.employerPf || 0);
          totalEmployerEsi += parseFloat(i.employerEsi || 0);
          totalCtc += parseFloat(i.totalCtc || (parseFloat(i.grossSalary) + parseFloat(i.employerPf) + parseFloat(i.employerEsi)));
        });

        return {
          reportName: 'Monthly Payroll Summary',
          period: `${month} ${year}`,
          summary: {
            employeeCount: items.length,
            totalGross: Math.round(totalGross * 100) / 100,
            totalDeductions: Math.round(totalDeductions * 100) / 100,
            totalNet: Math.round(totalNet * 100) / 100,
            totalEmployerPf: Math.round(totalEmployerPf * 100) / 100,
            totalEmployerEsi: Math.round(totalEmployerEsi * 100) / 100,
            totalCtc: Math.round(totalCtc * 100) / 100
          },
          records: items
        };
      }

      // 2. Employee Salary Register
      case 'salary_register': {
        const items = await PayrollItem.findAll({
          include: [
            {
              model: Employee,
              as: 'employee',
              where: Object.keys(empWhere).length > 0 ? empWhere : undefined
            },
            {
              model: PayrollRun,
              as: 'run',
              where: { month, year: yr }
            },
            { model: PayrollEarning, as: 'earnings' },
            { model: PayrollDeduction, as: 'deductions' }
          ],
          order: [['employee_id', 'ASC']]
        });
        return { reportName: 'Employee Salary Register', period: `${month} ${year}`, records: items };
      }

      // 3. Department-wise Payroll Cost
      case 'department_cost': {
        const items = await PayrollItem.findAll({
          include: [
            {
              model: Employee,
              as: 'employee',
              where: Object.keys(empWhere).length > 0 ? empWhere : undefined
            },
            {
              model: PayrollRun,
              as: 'run',
              where: { month, year: yr }
            }
          ]
        });

        const deptMap = {};
        items.forEach(i => {
          const d = i.employee?.department || 'Unassigned';
          if (!deptMap[d]) {
            deptMap[d] = {
              department: d,
              headcount: 0,
              grossCost: 0,
              totalDeductions: 0,
              netPayout: 0,
              employerCost: 0,
              totalCtc: 0
            };
          }
          const gross = parseFloat(i.grossSalary || 0);
          const ded = parseFloat(i.totalDeductions || 0);
          const net = parseFloat(i.netSalary || 0);
          const empPf = parseFloat(i.employerPf || 0);
          const empEsi = parseFloat(i.employerEsi || 0);
          const ctc = parseFloat(i.totalCtc || (gross + empPf + empEsi));

          deptMap[d].headcount += 1;
          deptMap[d].grossCost += gross;
          deptMap[d].totalDeductions += ded;
          deptMap[d].netPayout += net;
          deptMap[d].employerCost += (empPf + empEsi);
          deptMap[d].totalCtc += ctc;
        });

        const records = Object.values(deptMap).map(row => ({
          ...row,
          grossCost: Math.round(row.grossCost * 100) / 100,
          totalDeductions: Math.round(row.totalDeductions * 100) / 100,
          netPayout: Math.round(row.netPayout * 100) / 100,
          employerCost: Math.round(row.employerCost * 100) / 100,
          totalCtc: Math.round(row.totalCtc * 100) / 100
        }));

        return { reportName: 'Department-wise Payroll Cost', period: `${month} ${year}`, records };
      }

      // 4. Earnings and Deductions Register
      case 'earnings_deductions': {
        const items = await PayrollItem.findAll({
          include: [
            { model: Employee, as: 'employee', where: Object.keys(empWhere).length > 0 ? empWhere : undefined },
            { model: PayrollRun, as: 'run', where: { month, year: yr } },
            { model: PayrollEarning, as: 'earnings' },
            { model: PayrollDeduction, as: 'deductions' }
          ]
        });
        return { reportName: 'Earnings and Deductions Register', period: `${month} ${year}`, records: items };
      }

      // 5. Attendance and LOP Report
      case 'attendance_lop': {
        const items = await PayrollItem.findAll({
          include: [
            { model: Employee, as: 'employee', where: Object.keys(empWhere).length > 0 ? empWhere : undefined },
            { model: PayrollRun, as: 'run', where: { month, year: yr } }
          ],
          order: [['employee_id', 'ASC']]
        });
        return { reportName: 'Attendance and LOP Report', period: `${month} ${year}`, records: items };
      }

      // 6. Payslip Generation and Delivery Status
      case 'payslip_status':
      case 'payslip': {
        const payslipWhere = { month, year: yr };
        if (status) payslipWhere.paymentStatus = status;

        const slips = await Payslip.findAll({
          where: payslipWhere,
          include: [{
            model: Employee,
            as: 'employee',
            where: Object.keys(empWhere).length > 0 ? empWhere : undefined
          }],
          order: [['created_at', 'DESC']]
        });
        return { reportName: 'Payslip Generation & Delivery Status', period: `${month} ${year}`, records: slips };
      }

      // 7. Loan Disbursement and Repayment Report
      case 'loan_disbursement_repayment':
      case 'loan_emi': {
        const repayWhere = {};
        if (startDate && endDate) {
          repayWhere.paymentDate = { [Op.between]: [startDate, endDate] };
        }

        const repayments = await LoanRepayment.findAll({
          where: repayWhere,
          include: [{
            model: EmployeeLoan,
            as: 'loan',
            include: [{
              model: Employee,
              as: 'employee',
              where: Object.keys(empWhere).length > 0 ? empWhere : undefined
            }]
          }],
          order: [['payment_date', 'DESC']]
        });
        return { reportName: 'Loan Disbursement and Repayment Report', records: repayments };
      }

      // 8. Outstanding Loan Report
      case 'outstanding_loans':
      case 'loan': {
        const loans = await EmployeeLoan.findAll({
          where: {
            status: { [Op.in]: ['Approved', 'Pending'] },
            outstandingBalance: { [Op.gt]: 0 }
          },
          include: [{
            model: Employee,
            as: 'employee',
            where: Object.keys(empWhere).length > 0 ? empWhere : undefined
          }],
          order: [['outstanding_balance', 'DESC']]
        });
        return { reportName: 'Outstanding Loan Report', records: loans };
      }

      // 9. ESI Contribution Report
      case 'esi_report':
      case 'esi': {
        const esiWhere = { month, year: yr };
        if (status) esiWhere.status = status;

        const contributions = await EsiContribution.findAll({
          where: esiWhere,
          include: [{
            model: Employee,
            as: 'employee',
            where: Object.keys(empWhere).length > 0 ? empWhere : undefined
          }],
          order: [['created_at', 'DESC']]
        });
        return { reportName: 'ESI Contribution Register', period: `${month} ${year}`, records: contributions };
      }

      // 10. Professional Tax Report
      case 'pt_report':
      case 'pt': {
        const ptWhere = { month, year: yr };
        if (status) ptWhere.status = status;

        const ptList = await ProfessionalTaxContribution.findAll({
          where: ptWhere,
          include: [{
            model: Employee,
            as: 'employee',
            where: Object.keys(empWhere).length > 0 ? empWhere : undefined
          }],
          order: [['state', 'ASC']]
        });
        return { reportName: 'Professional Tax Report', period: `${month} ${year}`, records: ptList };
      }

      // 11. PF Contribution Report
      case 'pf_report': {
        const slips = await Payslip.findAll({
          where: {
            month,
            year: yr,
            pf: { [Op.gt]: 0 }
          },
          include: [{
            model: Employee,
            as: 'employee',
            where: Object.keys(empWhere).length > 0 ? empWhere : undefined
          }],
          order: [['employee_id', 'ASC']]
        });

        const records = slips.map(s => {
          const empPf = parseFloat(s.pf || 0);
          const employerPf = parseFloat(s.employerPf || empPf);
          const totalPf = empPf + employerPf;
          return {
            id: s.id,
            employeeName: s.employee?.employeeName || s.employee?.firstName || 'Employee',
            employeeCode: s.employee?.employeeCode || s.employee?.employeeId || '--',
            department: s.employee?.department || '--',
            basicSalary: s.basic,
            employeePf: empPf,
            employerPf: employerPf,
            totalPf: Math.round(totalPf * 100) / 100,
            status: s.paymentStatus
          };
        });

        return { reportName: 'PF Contribution Report', period: `${month} ${year}`, records };
      }

      // 12. TDS Report
      case 'tds_report': {
        const slips = await Payslip.findAll({
          where: {
            month,
            year: yr,
            tds: { [Op.gt]: 0 }
          },
          include: [{
            model: Employee,
            as: 'employee',
            where: Object.keys(empWhere).length > 0 ? empWhere : undefined
          }]
        });

        const records = slips.map(s => ({
          id: s.id,
          employeeName: s.employee?.employeeName || 'Employee',
          employeeCode: s.employee?.employeeCode || '--',
          grossSalary: s.grossSalary,
          tdsDeduction: s.tds,
          paymentStatus: s.paymentStatus
        }));

        return { reportName: 'TDS Deduction Report', period: `${month} ${year}`, records };
      }

      // 13. Bank Payment and Transaction Status Report
      case 'bank_payment_report': {
        const slips = await Payslip.findAll({
          where: { month, year: yr },
          include: [{
            model: Employee,
            as: 'employee',
            where: Object.keys(empWhere).length > 0 ? empWhere : undefined
          }]
        });

        const records = slips.map(s => {
          const emp = s.employee || {};
          const profile = emp.profileData ? (typeof emp.profileData === 'object' ? emp.profileData : JSON.parse(emp.profileData || '{}')) : {};
          return {
            id: s.id,
            employeeName: emp.employeeName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee',
            employeeCode: emp.employeeCode || emp.employeeId || '--',
            bankAccount: emp.accountNumber || profile.accountNumber || profile.bankAccount || '--',
            ifscCode: emp.ifscCode || profile.ifscCode || profile.ifsc || '--',
            netSalary: s.netSalary,
            paymentMode: s.paymentMode || 'Bank Transfer',
            paymentStatus: s.paymentStatus,
            paymentDate: s.paymentDate || '--'
          };
        });

        return { reportName: 'Bank Payment & Transaction Report', period: `${month} ${year}`, records };
      }

      // 14. Payroll Exceptions and Failed Calculations Report
      case 'exceptions_report': {
        const employees = await Employee.findAll({
          where: {
            [Op.or]: [
              { employeeStatus: 'Active' },
              { employeeStatus: 'active' },
              { employeeStatus: null }
            ],
            ...empWhere
          }
        });

        const exceptions = [];
        for (const emp of employees) {
          const profile = emp.profileData ? (typeof emp.profileData === 'object' ? emp.profileData : JSON.parse(emp.profileData || '{}')) : {};
          const hasAccount = emp.accountNumber || profile.accountNumber || profile.bankAccount;
          const hasPan = emp.panNumber || profile.panNumber || profile.pan;

          // Check if active salary structure assignment exists
          const assignment = await EmployeeSalaryAssignment.findOne({
            where: { employeeId: emp.id, isActive: true }
          });

          if (!assignment) {
            exceptions.push({
              employeeName: emp.employeeName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee',
              employeeCode: emp.employeeCode || emp.employeeId || '--',
              department: emp.department || '--',
              issueType: 'Missing Salary Structure',
              severity: 'High',
              details: 'No active salary structure assigned. Payroll calculation will be skipped.'
            });
          }

          if (!hasAccount) {
            exceptions.push({
              employeeName: emp.employeeName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee',
              employeeCode: emp.employeeCode || emp.employeeId || '--',
              department: emp.department || '--',
              issueType: 'Missing Bank Details',
              severity: 'Medium',
              details: 'Bank account number not configured.'
            });
          }

          if (!hasPan) {
            exceptions.push({
              employeeName: emp.employeeName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee',
              employeeCode: emp.employeeCode || emp.employeeId || '--',
              department: emp.department || '--',
              issueType: 'Missing PAN Number',
              severity: 'Low',
              details: 'PAN not submitted; higher tax withholding may apply.'
            });
          }
        }

        return { reportName: 'Payroll Exceptions and Compliance Warnings', records: exceptions };
      }

      // 15. Payroll Approval and Audit Report
      case 'audit_report': {
        const logs = await AuditLog.findAll({
          where: {
            moduleName: { [Op.in]: ['Payroll Process', 'Salary Structure', 'Loan Management', 'Statutory & Tax', 'ESI Management', 'Professional Tax'] }
          },
          order: [['created_at', 'DESC']],
          limit: 100
        });
        return { reportName: 'Payroll Approval & Audit Trail', records: logs };
      }

      // 16. Employer Contribution and CTC Report
      case 'employer_ctc': {
        const items = await PayrollItem.findAll({
          include: [
            { model: Employee, as: 'employee', where: Object.keys(empWhere).length > 0 ? empWhere : undefined },
            { model: PayrollRun, as: 'run', where: { month, year: yr } }
          ],
          order: [['employee_id', 'ASC']]
        });

        const records = items.map(i => {
          const gross = parseFloat(i.grossSalary || 0);
          const pf = parseFloat(i.employerPf || 0);
          const esi = parseFloat(i.employerEsi || 0);
          const monthlyCtc = parseFloat(i.totalCtc || (gross + pf + esi));
          return {
            id: i.id,
            employeeName: i.employee?.employeeName || 'Employee',
            employeeCode: i.employee?.employeeCode || '--',
            department: i.employee?.department || '--',
            grossSalary: gross,
            employerPf: pf,
            employerEsi: esi,
            monthlyCtc,
            annualCtc: Math.round(monthlyCtc * 12 * 100) / 100
          };
        });

        return { reportName: 'Employer Contribution and CTC Report', period: `${month} ${year}`, records };
      }

      default:
        throw new Error(`Unsupported report type: ${type}`);
    }
  }

  async exportToCsv(type, filters = {}) {
    const data = await this.getReportData(type, filters);
    const records = Array.isArray(data.records) ? data.records : (data.records || []);
    let csv = '';

    if (records.length === 0) {
      return 'No records found for the selected criteria.\n';
    }

    // Dynamic CSV generation from object keys
    const sample = records[0];
    const flatSample = {};

    for (const [k, v] of Object.entries(sample.toJSON ? sample.toJSON() : sample)) {
      if (typeof v !== 'object' || v === null) {
        flatSample[k] = v;
      } else if (k === 'employee') {
        flatSample['employeeName'] = v.employeeName || v.firstName || '';
        flatSample['employeeCode'] = v.employeeCode || v.employeeId || '';
        flatSample['department'] = v.department || '';
      }
    }

    const headers = Object.keys(flatSample);
    csv += headers.map(h => `"${h}"`).join(',') + '\n';

    records.forEach(row => {
      const obj = row.toJSON ? row.toJSON() : row;
      const rowVals = headers.map(h => {
        let val = obj[h];
        if (val === undefined && obj.employee) {
          if (h === 'employeeName') val = obj.employee.employeeName || obj.employee.firstName || '';
          if (h === 'employeeCode') val = obj.employee.employeeCode || obj.employee.employeeId || '';
          if (h === 'department') val = obj.employee.department || '';
        }
        if (val === null || val === undefined) val = '';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csv += rowVals.join(',') + '\n';
    });

    return csv;
  }
}

module.exports = new ReportService();
