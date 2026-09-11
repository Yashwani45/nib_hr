// backend/services/finance/loan.service.js
const { EmployeeLoan, LoanEmiSchedule, LoanRepayment, Employee, User } = require('../../models');
const ApiError = require('../../utils/apiError');
const auditLogService = require('../core/auditLog.service');
const { Op } = require('sequelize');

class LoanService {
  /**
   * Helper to write audit logs
   */
  async logLoanAction(userId, action, recordId, status, oldValues = null, newValues = null) {
    try {
      const user = await User.findByPk(userId);
      await auditLogService.log({
        userId,
        username: user ? user.email : 'System',
        roleName: 'HR/Manager',
        actionType: action,
        moduleName: 'Loan Management',
        recordId,
        previousValues: oldValues,
        newValues,
        status
      });
    } catch (e) {
      console.error('Audit log failed inside loan service:', e.message);
    }
  }

  /**
   * 1. Create a loan request (Employee self)
   */
  async createLoanRequest(payload, currentUser) {
    const { loanType, requestedAmount, reason, tenureMonths, supportingDocument } = payload;

    // Resolve employee id linked to user
    const employee = await Employee.findOne({ where: { userId: currentUser.id } });
    if (!employee) {
      throw new ApiError(404, 'Employee profile not associated with this account.');
    }

    const loan = await EmployeeLoan.create({
      employeeId: employee.id,
      loanType,
      requestedAmount,
      tenureMonths,
      reason,
      supportingDocument,
      status: 'Pending',
      outstandingBalance: 0,
      totalPaid: 0
    });

    await this.logLoanAction(currentUser.id, 'Create', loan.id, 'Success', null, loan);
    return loan;
  }

  /**
   * 2. View loan requests (HR views all, employee views own)
   */
  async getLoans(filters = {}, currentUser) {
    const { employeeId, status } = filters;
    const roleName = currentUser.role?.roleName || currentUser.role?.name || 'Employee';

    const where = {};
    if (status) where.status = status;

    if (roleName === 'Employee') {
      const employee = await Employee.findOne({ where: { userId: currentUser.id } });
      if (!employee) {
        throw new ApiError(403, 'No employee record associated.');
      }
      where.employeeId = employee.id;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    return await EmployeeLoan.findAll({
      where,
      include: [{ model: Employee, as: 'employee' }],
      order: [['created_at', 'DESC']]
    });
  }

  /**
   * 3. View loan details (with schedule and repayments)
   */
  async getLoanDetails(id, currentUser) {
    const loan = await EmployeeLoan.findByPk(id, {
      include: [
        { model: Employee, as: 'employee' },
        { model: LoanEmiSchedule, as: 'emiSchedules' },
        { model: LoanRepayment, as: 'repayments' }
      ]
    });
    if (!loan) {
      throw new ApiError(404, 'Loan not found.');
    }

    // Role-based restrictions check
    const roleName = currentUser.role?.roleName || currentUser.role?.name || 'Employee';
    if (roleName === 'Employee') {
      const employee = await Employee.findOne({ where: { userId: currentUser.id } });
      if (!employee || loan.employeeId !== employee.id) {
        throw new ApiError(403, 'Access denied: Employees can only view their own loans.');
      }
    }

    return loan;
  }

  /**
   * 4. Approve loan request and generate EMI schedule
   */
  async approveLoan(id, approvalData, executorId) {
    const loan = await EmployeeLoan.findByPk(id);
    if (!loan) {
      throw new ApiError(404, 'Loan request not found.');
    }
    if (loan.status !== 'Pending') {
      throw new ApiError(400, `Cannot approve a loan in status: ${loan.status}`);
    }

    const { approvedAmount, interestRate = 0, tenureMonths, startDate } = approvalData;

    const oldValues = { ...loan.toJSON() };

    loan.approvedAmount = approvedAmount;
    loan.interestRate = interestRate;
    loan.tenureMonths = tenureMonths;
    loan.startDate = startDate;
    loan.status = 'Approved';
    loan.outstandingBalance = approvedAmount;
    loan.approvedBy = executorId;
    loan.approvalDate = new Date().toISOString().split('T')[0];

    await loan.save();

    // EMI Amortization Calculation
    // EMI = [P x R x (1+R)^N]/[(1+R)^N - 1]
    const p = parseFloat(approvedAmount);
    const n = parseInt(tenureMonths);
    let monthlyEmi = p / n; // default for 0% interest

    const annualRate = parseFloat(interestRate);
    if (annualRate > 0) {
      const r = annualRate / 12 / 100;
      monthlyEmi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }

    // Generate EMI Schedule installments
    const scheduleEntries = [];
    const dateObj = new Date(startDate);

    for (let i = 1; i <= n; i++) {
      const installmentDueDate = new Date(dateObj.getFullYear(), dateObj.getMonth() + i - 1, 1);
      
      let interestPart = 0;
      if (annualRate > 0) {
        // Interest component = Outstanding balance * monthly interest rate
        // For simplicity of schedules, we can assume a flat amortized split or standard balance reduction
        interestPart = (p * (annualRate / 12 / 100)); // simple placeholder
      }
      const principalPart = monthlyEmi - interestPart;

      scheduleEntries.push({
        loanId: loan.id,
        installmentNumber: i,
        dueDate: installmentDueDate.toISOString().split('T')[0],
        emiAmount: monthlyEmi.toFixed(2),
        principalAmount: principalPart.toFixed(2),
        interestAmount: interestPart.toFixed(2),
        status: 'Pending'
      });
    }

    await LoanEmiSchedule.bulkCreate(scheduleEntries);

    await this.logLoanAction(executorId, 'Approve', loan.id, 'Success', oldValues, loan);
    return await this.getLoanDetails(loan.id, { role: { roleName: 'Admin' } });
  }

  /**
   * 5. Reject loan request
   */
  async rejectLoan(id, executorId) {
    const loan = await EmployeeLoan.findByPk(id);
    if (!loan) {
      throw new ApiError(404, 'Loan request not found.');
    }
    if (loan.status !== 'Pending') {
      throw new ApiError(400, `Cannot reject a loan in status: ${loan.status}`);
    }

    const oldValues = { ...loan.toJSON() };
    loan.status = 'Rejected';
    await loan.save();

    await this.logLoanAction(executorId, 'Reject', loan.id, 'Success', oldValues, loan);
    return loan;
  }

  /**
   * 6. Close loan manually
   */
  async closeLoan(id, executorId) {
    const loan = await EmployeeLoan.findByPk(id);
    if (!loan) {
      throw new ApiError(404, 'Loan not found.');
    }
    if (loan.status !== 'Approved') {
      throw new ApiError(400, `Cannot close loan in status: ${loan.status}`);
    }

    const oldValues = { ...loan.toJSON() };
    loan.status = 'Closed';
    loan.outstandingBalance = 0;
    await loan.save();

    // Mark remaining schedules as skipped/paid
    await LoanEmiSchedule.update({ status: 'Skipped' }, { where: { loanId: loan.id, status: 'Pending' } });

    await this.logLoanAction(executorId, 'Update', loan.id, 'Success', oldValues, loan);
    return loan;
  }

  /**
   * 7. Fetch repayments list
   */
  async getRepayments(loanId, currentUser) {
    const loan = await EmployeeLoan.findByPk(loanId);
    if (!loan) {
      throw new ApiError(404, 'Loan not found.');
    }
    
    // Check permission
    const roleName = currentUser.role?.roleName || currentUser.role?.name || 'Employee';
    if (roleName === 'Employee') {
      const employee = await Employee.findOne({ where: { userId: currentUser.id } });
      if (!employee || loan.employeeId !== employee.id) {
        throw new ApiError(403, 'Access denied.');
      }
    }

    return await LoanRepayment.findAll({
      where: { loanId },
      order: [['payment_date', 'DESC']]
    });
  }
}

module.exports = new LoanService();
