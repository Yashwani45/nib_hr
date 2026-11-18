// backend/services/finance/loan.service.js
const {
  EmployeeLoan,
  LoanEmiSchedule,
  LoanRepayment,
  Employee,
  User,
  sequelize
} = require('../../models');
const ApiError = require('../../utils/apiError');
const auditLogService = require('../core/auditLog.service');
const { Op } = require('sequelize');

class LoanService {
  async logLoanAction(userId, action, recordId, status, oldValues = null, newValues = null) {
    try {
      const user = await User.findByPk(userId);
      await auditLogService.log({
        userId,
        username: user ? user.email : 'System',
        roleName: 'HR/Admin',
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
   * 1. Create a loan request (Employee self-service or HR on behalf)
   */
  async createLoanRequest(payload, currentUser) {
    const {
      loanType = 'Personal',
      requestedAmount,
      reason,
      tenureMonths = 12,
      supportingDocument,
      employeeId
    } = payload;

    const reqAmt = parseFloat(requestedAmount);
    if (isNaN(reqAmt) || reqAmt <= 0) {
      throw new ApiError(400, 'Requested loan amount must be greater than zero.');
    }

    const tenure = parseInt(tenureMonths);
    if (isNaN(tenure) || tenure < 1 || tenure > 120) {
      throw new ApiError(400, 'Tenure must be between 1 and 120 months.');
    }

    const roleName = String(currentUser.role?.roleName || currentUser.role?.name || 'Employee').trim();
    let targetEmpId = employeeId;

    if (roleName === 'Employee' || !targetEmpId) {
      const currentEmp = await Employee.findOne({
        where: {
          [Op.or]: [
            { userId: currentUser.id },
            { id: currentUser.id },
            { email: currentUser.email || '' }
          ]
        }
      });
      if (!currentEmp) {
        throw new ApiError(403, 'No employee record linked to user account.');
      }
      targetEmpId = currentEmp.id;
    }

    const employee = await Employee.findByPk(targetEmpId);
    if (!employee) {
      throw new ApiError(404, 'Employee not found.');
    }

    // Check if employee already has an active unpaid loan
    const existingActive = await EmployeeLoan.findOne({
      where: {
        employeeId: targetEmpId,
        status: { [Op.in]: ['Pending', 'Approved'] },
        outstandingBalance: { [Op.gt]: 0 }
      }
    });

    if (existingActive) {
      throw new ApiError(400, `Employee already has an active loan (${existingActive.loanType} - Outstanding: ₹${existingActive.outstandingBalance}).`);
    }

    const loan = await EmployeeLoan.create({
      employeeId: targetEmpId,
      loanType,
      requestedAmount: reqAmt,
      tenureMonths: tenure,
      reason: reason || null,
      supportingDocument: supportingDocument || null,
      status: 'Pending',
      outstandingBalance: 0,
      totalPaid: 0
    });

    await this.logLoanAction(currentUser.id, 'Create', loan.id, 'Success', null, loan);
    return loan;
  }

  /**
   * 2. View loans list (HR views all, employee views own)
   */
  async getLoans(filters = {}, currentUser) {
    const { employeeId, status, search } = filters;
    const roleName = String(currentUser.role?.roleName || currentUser.role?.name || 'Employee').trim();

    const where = {};
    if (status) where.status = status;

    const currentEmp = await Employee.findOne({
      where: {
        [Op.or]: [
          { userId: currentUser.id },
          { id: currentUser.id },
          { email: currentUser.email || '' }
        ]
      }
    });

    if (roleName === 'Employee') {
      if (!currentEmp) {
        throw new ApiError(403, 'No employee record associated.');
      }
      where.employeeId = currentEmp.id;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    const empIncludeWhere = {};
    if (search && search.trim().length > 0) {
      empIncludeWhere[Op.or] = [
        { employeeName: { [Op.like]: `%${search.trim()}%` } },
        { employeeCode: { [Op.like]: `%${search.trim()}%` } },
        { email: { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    return await EmployeeLoan.findAll({
      where,
      include: [{
        model: Employee,
        as: 'employee',
        where: Object.keys(empIncludeWhere).length > 0 ? empIncludeWhere : undefined
      }],
      order: [['created_at', 'DESC']]
    });
  }

  /**
   * 3. View loan details with complete EMI schedule and repayment ledger
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

    const roleName = String(currentUser.role?.roleName || currentUser.role?.name || 'Employee').trim();
    if (roleName === 'Employee') {
      const currentEmp = await Employee.findOne({
        where: {
          [Op.or]: [
            { userId: currentUser.id },
            { id: currentUser.id },
            { email: currentUser.email || '' }
          ]
        }
      });
      if (!currentEmp || loan.employeeId !== currentEmp.id) {
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

    const {
      approvedAmount,
      interestRate = 0,
      tenureMonths,
      startDate
    } = approvalData;

    const p = parseFloat(approvedAmount || loan.requestedAmount);
    if (isNaN(p) || p <= 0) {
      throw new ApiError(400, 'Approved amount must be greater than zero.');
    }

    const n = parseInt(tenureMonths || loan.tenureMonths);
    if (isNaN(n) || n < 1) {
      throw new ApiError(400, 'Tenure must be at least 1 month.');
    }

    const annualRate = parseFloat(interestRate) || 0;
    if (annualRate < 0) {
      throw new ApiError(400, 'Interest rate cannot be negative.');
    }

    const stDate = startDate ? new Date(startDate) : new Date();
    if (isNaN(stDate.getTime())) {
      throw new ApiError(400, 'Invalid start date format.');
    }

    // Amortization calculation: EMI = [P x R x (1+R)^N]/[(1+R)^N - 1]
    let monthlyEmi = p / n;
    if (annualRate > 0) {
      const r = annualRate / 12 / 100;
      monthlyEmi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }
    monthlyEmi = Math.round(monthlyEmi * 100) / 100;

    const transaction = await sequelize.transaction();
    try {
      const oldValues = { ...loan.toJSON() };

      loan.approvedAmount = p;
      loan.interestRate = annualRate;
      loan.tenureMonths = n;
      loan.startDate = stDate.toISOString().split('T')[0];
      loan.status = 'Approved';
      loan.outstandingBalance = p;
      loan.totalPaid = 0;
      loan.approvedBy = executorId;
      loan.approvalDate = new Date().toISOString().split('T')[0];
      await loan.save({ transaction });

      // Generate EMI installments
      const scheduleEntries = [];
      let remainingPrincipal = p;

      for (let i = 1; i <= n; i++) {
        const dueDate = new Date(stDate.getFullYear(), stDate.getMonth() + i - 1, 1);
        let interestPart = 0;
        if (annualRate > 0) {
          interestPart = Math.round((remainingPrincipal * (annualRate / 12 / 100)) * 100) / 100;
        }
        let principalPart = Math.round((monthlyEmi - interestPart) * 100) / 100;
        if (i === n || principalPart > remainingPrincipal) {
          principalPart = remainingPrincipal;
        }
        remainingPrincipal = Math.max(0, remainingPrincipal - principalPart);

        scheduleEntries.push({
          loanId: loan.id,
          installmentNumber: i,
          dueDate: dueDate.toISOString().split('T')[0],
          emiAmount: monthlyEmi,
          principalAmount: principalPart,
          interestAmount: interestPart,
          status: 'Pending'
        });
      }

      await LoanEmiSchedule.bulkCreate(scheduleEntries, { transaction });
      await transaction.commit();

      await this.logLoanAction(executorId, 'Approve', loan.id, 'Success', oldValues, loan);
      return await this.getLoanDetails(loan.id, { role: { roleName: 'Admin' } });

    } catch (err) {
      await transaction.rollback();
      throw err;
    }
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
   * 6. Record Manual / Ad-hoc / Early Repayment
   */
  async recordRepayment(id, payload, executorId) {
    const loan = await EmployeeLoan.findByPk(id);
    if (!loan) {
      throw new ApiError(404, 'Loan not found.');
    }
    if (loan.status !== 'Approved') {
      throw new ApiError(400, `Cannot record repayments for loan in ${loan.status} status.`);
    }

    const { amount, paymentDate, paymentMode = 'Bank Transfer', remarks } = payload;
    const payAmt = parseFloat(amount);
    if (isNaN(payAmt) || payAmt <= 0) {
      throw new ApiError(400, 'Repayment amount must be greater than zero.');
    }

    const transaction = await sequelize.transaction();
    try {
      const oldValues = { ...loan.toJSON() };
      const currentOutstanding = parseFloat(loan.outstandingBalance) || 0;
      const actualDeducted = Math.min(payAmt, currentOutstanding);

      // Create repayment entry
      const repayment = await LoanRepayment.create({
        loanId: loan.id,
        amount: actualDeducted,
        paymentDate: paymentDate || new Date(),
        paymentMode,
        remarks: remarks || 'Manual Ad-hoc Repayment'
      }, { transaction });

      // Update next pending EMI schedule installment if applicable
      const nextPendingEmi = await LoanEmiSchedule.findOne({
        where: { loanId: loan.id, status: 'Pending' },
        order: [['installment_number', 'ASC']],
        transaction
      });
      if (nextPendingEmi && actualDeducted >= parseFloat(nextPendingEmi.emiAmount)) {
        nextPendingEmi.status = 'Paid';
        await nextPendingEmi.save({ transaction });
      }

      // Update loan balance
      loan.totalPaid = Math.round((parseFloat(loan.totalPaid || 0) + actualDeducted) * 100) / 100;
      loan.outstandingBalance = Math.max(0, Math.round((currentOutstanding - actualDeducted) * 100) / 100);

      if (loan.outstandingBalance <= 0) {
        loan.status = 'Closed';
        // Mark all remaining pending schedules as Skipped
        await LoanEmiSchedule.update(
          { status: 'Skipped' },
          { where: { loanId: loan.id, status: 'Pending' }, transaction }
        );
      }

      await loan.save({ transaction });
      await transaction.commit();

      await this.logLoanAction(executorId, 'Repayment', loan.id, 'Success', oldValues, loan);
      return { loan, repayment };

    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * 7. Close loan manually
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

    await LoanEmiSchedule.update({ status: 'Skipped' }, { where: { loanId: loan.id, status: 'Pending' } });
    await this.logLoanAction(executorId, 'Close', loan.id, 'Success', oldValues, loan);
    return loan;
  }

  /**
   * 8. Fetch repayment ledger
   */
  async getRepayments(loanId, currentUser) {
    const loan = await EmployeeLoan.findByPk(loanId);
    if (!loan) {
      throw new ApiError(404, 'Loan not found.');
    }

    const roleName = String(currentUser.role?.roleName || currentUser.role?.name || 'Employee').trim();
    if (roleName === 'Employee') {
      const currentEmp = await Employee.findOne({
        where: {
          [Op.or]: [
            { userId: currentUser.id },
            { id: currentUser.id },
            { email: currentUser.email || '' }
          ]
        }
      });
      if (!currentEmp || loan.employeeId !== currentEmp.id) {
        throw new ApiError(403, 'Access denied.');
      }
    }

    return await LoanRepayment.findAll({
      where: { loanId },
      include: [{ model: LoanEmiSchedule, as: 'emiSchedule' }],
      order: [['payment_date', 'DESC']]
    });
  }
}

module.exports = new LoanService();
