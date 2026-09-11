// backend/services/finance/payslip.service.js
const { Payslip, Employee, User, Department } = require('../../models');
const ApiError = require('../../utils/apiError');
const auditLogService = require('../core/auditLog.service');
const { Op } = require('sequelize');

class PayslipService {
  /**
   * Helper to verify if user has access to a specific employee's records
   */
  async verifyEmployeeAccess(currentUser, targetEmployeeId) {
    const roleName = currentUser.role?.roleName || currentUser.role?.name || 'Employee';
    
    // Admin/SuperAdmin bypass
    if (['Admin', 'SuperAdmin'].includes(roleName)) {
      return true;
    }

    // Resolve current user's employee profile
    const currentEmp = await Employee.findOne({ where: { userId: currentUser.id } });
    if (!currentEmp) {
      throw new ApiError(403, 'Access denied: Logged in user does not have an employee profile.');
    }

    if (roleName === 'Employee') {
      if (currentEmp.id !== targetEmployeeId) {
        throw new ApiError(403, 'Access denied: Employees can only access their own payslips.');
      }
      return true;
    }

    if (roleName === 'Manager') {
      // Manager can access their own or their direct reports / department employees
      if (currentEmp.id === targetEmployeeId) {
        return true;
      }
      const targetEmp = await Employee.findByPk(targetEmployeeId);
      if (!targetEmp) {
        throw new ApiError(404, 'Target employee not found.');
      }

      // Check department or reporting manager
      if (targetEmp.managerId === currentEmp.id || targetEmp.departmentId === currentEmp.departmentId) {
        return true;
      }
      throw new ApiError(403, 'Access denied: Managers can only view department/reporting employees.');
    }

    throw new ApiError(403, 'Access denied: Insufficient role permissions.');
  }

  /**
   * Fetch payslips with role-based filtering
   */
  async getPayslips(filters = {}, currentUser) {
    const { employeeId, month, year, departmentId, status } = filters;
    const roleName = currentUser.role?.roleName || currentUser.role?.name || 'Employee';
    
    const where = {};
    if (month) where.month = month;
    if (year) where.year = parseInt(year);
    if (status) where.paymentStatus = status;

    // Resolve employee scope boundaries
    const currentEmp = await Employee.findOne({ where: { userId: currentUser.id } });

    if (roleName === 'Employee') {
      if (!currentEmp) {
        throw new ApiError(403, 'No employee record linked to user account.');
      }
      where.employeeId = currentEmp.id;
    } else if (roleName === 'Manager') {
      if (!currentEmp) {
        throw new ApiError(403, 'No employee record linked to user account.');
      }
      // Manager filter logic: either specific allowed employeeId, or limit by manager's department/hierarchy
      if (employeeId) {
        await this.verifyEmployeeAccess(currentUser, employeeId);
        where.employeeId = employeeId;
      } else {
        const teamEmployees = await Employee.findAll({
          where: {
            [Op.or]: [
              { id: currentEmp.id },
              { managerId: currentEmp.id },
              { departmentId: currentEmp.departmentId }
            ]
          }
        });
        const teamIds = teamEmployees.map(e => e.id);
        where.employeeId = { [Op.in]: teamIds };
      }
    } else {
      // HR/Admin: Filter by specific employeeId or departmentId if requested
      if (employeeId) {
        where.employeeId = employeeId;
      } else if (departmentId) {
        const deptEmployees = await Employee.findAll({ where: { departmentId } });
        const deptEmpIds = deptEmployees.map(e => e.id);
        where.employeeId = { [Op.in]: deptEmpIds };
      }
    }

    return await Payslip.findAll({
      where,
      include: [{ model: Employee, as: 'employee' }],
      order: [['year', 'DESC'], ['month', 'DESC']]
    });
  }

  /**
   * Get single payslip details
   */
  async getPayslipDetails(id, currentUser) {
    const payslip = await Payslip.findByPk(id, {
      include: [{ model: Employee, as: 'employee' }]
    });
    if (!payslip) {
      throw new ApiError(404, 'Payslip not found.');
    }

    await this.verifyEmployeeAccess(currentUser, payslip.employeeId);
    return payslip;
  }

  /**
   * Generate simple print layout PDF payload / response
   */
  async getPayslipPdf(id, currentUser) {
    const payslip = await Payslip.findByPk(id, {
      include: [{ model: Employee, as: 'employee' }]
    });
    if (!payslip) {
      throw new ApiError(404, 'Payslip not found.');
    }

    await this.verifyEmployeeAccess(currentUser, payslip.employeeId);

    // Logs the audit download event
    await auditLogService.log({
      userId: currentUser.id,
      username: currentUser.email,
      roleName: currentUser.role?.roleName || 'Admin',
      actionType: 'Download',
      moduleName: 'Payslip',
      recordId: id,
      status: 'Success'
    });

    // Return HTML representation that can be printed / rendered directly as PDF
    const emp = payslip.employee || {};
    const htmlTemplate = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            .header { border-bottom: 2px solid #ddd; padding-bottom: 10px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .section { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
            .section-title { font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
            .total { font-weight: bold; border-top: 1px solid #eee; padding-top: 5px; margin-top: 10px; }
            .net-pay { font-size: 18px; font-weight: bold; color: #1e3a8a; text-align: right; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">NIB Technologies Pvt Ltd</div>
            <div style="color: #666; font-size: 12px;">Okhla Phase III, New Delhi, Delhi 110020</div>
            <div style="font-size: 16px; font-weight: bold; margin-top: 10px;">Payslip for ${payslip.month} ${payslip.year}</div>
          </div>
          <div class="grid">
            <div class="section">
              <div class="section-title">Employee Details</div>
              <div class="row"><span>Name:</span> <span>${emp.employeeName || 'Employee'}</span></div>
              <div class="row"><span>Email:</span> <span>${emp.email || '--'}</span></div>
              <div class="row"><span>Department:</span> <span>${emp.department || '--'}</span></div>
              <div class="row"><span>Bank A/C No:</span> <span>${emp.accountNumber || '--'}</span></div>
              <div class="row"><span>IFSC:</span> <span>${emp.ifscCode || '--'}</span></div>
            </div>
            <div class="section">
              <div class="section-title">Salary Summary</div>
              <div class="row"><span>Gross Salary:</span> <span>₹${payslip.grossSalary}</span></div>
              <div class="row"><span>Total Deductions:</span> <span>₹${payslip.totalDeductions}</span></div>
              <div class="row"><span>Net Salary:</span> <span>₹${payslip.netSalary}</span></div>
              <div class="row"><span>Payment Status:</span> <span>${payslip.paymentStatus}</span></div>
              <div class="row"><span>Date:</span> <span>${payslip.paymentDate || '--'}</span></div>
            </div>
          </div>
          <div class="grid">
            <div class="section">
              <div class="section-title">Earnings Breakdown</div>
              <div class="row"><span>Basic Salary:</span> <span>₹${payslip.basic}</span></div>
              <div class="row"><span>HRA:</span> <span>₹${payslip.hra}</span></div>
              <div class="row"><span>Conveyance Allowance:</span> <span>₹${payslip.conveyance}</span></div>
              <div class="row"><span>Medical Allowance:</span> <span>₹${payslip.medical}</span></div>
              <div class="row"><span>Special Allowance:</span> <span>₹${payslip.special}</span></div>
              <div class="row"><span>Other Allowances:</span> <span>₹${payslip.otherAllowances}</span></div>
              <div class="row"><span>Bonus:</span> <span>₹${payslip.bonus}</span></div>
              <div class="row"><span>Incentive:</span> <span>₹${payslip.incentive}</span></div>
              <div class="row total"><span>Total Gross:</span> <span>₹${payslip.grossSalary}</span></div>
            </div>
            <div class="section">
              <div class="section-title">Deductions Breakdown</div>
              <div class="row"><span>PF Contribution:</span> <span>₹${payslip.pf}</span></div>
              <div class="row"><span>ESI Contribution:</span> <span>₹${payslip.esi}</span></div>
              <div class="row"><span>Professional Tax (PT):</span> <span>₹${payslip.pt}</span></div>
              <div class="row"><span>TDS:</span> <span>₹${payslip.tds}</span></div>
              <div class="row"><span>Loan Deductions:</span> <span>₹${payslip.loanDeduction}</span></div>
              <div class="row total"><span>Total Deductions:</span> <span>₹${payslip.totalDeductions}</span></div>
            </div>
          </div>
          <div class="net-pay">Net Take Home Pay: ₹${payslip.netSalary}</div>
        </body>
      </html>
    `;
    return htmlTemplate;
  }
}

module.exports = new PayslipService();
