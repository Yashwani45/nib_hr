// backend/services/finance/payroll.service.js
const {
  sequelize,
  PayrollRun,
  PayrollItem,
  PayrollEarning,
  PayrollDeduction,
  Payslip,
  Employee,
  EmployeeSalaryAssignment,
  SalaryStructure,
  SalaryComponent,
  Attendance,
  Leave,
  EmployeeLoan,
  LoanEmiSchedule,
  LoanRepayment,
  EsiContribution,
  ProfessionalTaxRule,
  ProfessionalTaxContribution,
  User,
  Role
} = require('../../models');
const ApiError = require('../../utils/apiError');
const auditLogService = require('../core/auditLog.service');
const { Op } = require('sequelize');

const MONTH_MAP = {
  "January": 0, "February": 1, "March": 2, "April": 3,
  "May": 4, "June": 5, "July": 6, "August": 7,
  "September": 8, "October": 9, "November": 10, "December": 11
};

class PayrollService {
  /**
   * Helper to write an audit log
   */
  async logPayrollAction(userId, action, moduleName, entityId, status, oldValues = null, newValues = null) {
    try {
      const user = await User.findByPk(userId, { include: [{ model: Role, as: 'role' }] });
      await auditLogService.log({
        userId,
        username: user ? user.email : 'System',
        roleName: user && user.role ? user.role.roleName : 'Admin',
        actionType: action,
        moduleName,
        recordId: entityId,
        previousValues: oldValues,
        newValues,
        status
      });
    } catch (e) {
      console.error('Audit log failed inside payroll service:', e.message);
    }
  }

  /**
   * 1. Create a payroll run
   */
  async createPayrollRun(month, year, executorId) {
    // Prevent duplicate payroll runs for same period
    const existing = await PayrollRun.findOne({ where: { month, year, status: { [Op.ne]: 'Cancelled' } } });
    if (existing) {
      throw new ApiError(400, `A payroll run already exists for ${month} ${year}.`);
    }

    const run = await PayrollRun.create({
      month,
      year,
      status: 'Draft'
    });

    await this.logPayrollAction(executorId, 'Create', 'Payroll Process', run.id, 'Success', null, run);
    return run;
  }

  /**
   * 2. Get payroll runs
   */
  async getPayrollRuns(filters = {}) {
    const { status, year, month } = filters;
    const where = {};
    if (status) where.status = status;
    if (year) where.year = year;
    if (month) where.month = month;

    return await PayrollRun.findAll({
      where,
      order: [['year', 'DESC'], [sequelize.literal(`FIELD(month, 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December')`), 'DESC']]
    });
  }

  /**
   * 3. Get single payroll run details
   */
  async getPayrollRunDetails(id) {
    const run = await PayrollRun.findByPk(id, {
      include: [{
        model: PayrollItem,
        as: 'items',
        include: [
          { model: Employee, as: 'employee' },
          { model: PayrollEarning, as: 'earnings' },
          { model: PayrollDeduction, as: 'deductions' }
        ]
      }]
    });
    if (!run) {
      throw new ApiError(404, 'Payroll run not found.');
    }
    return run;
  }

  /**
   * 4. Calculate / Recalculate payroll run
   */
  async calculatePayrollRun(runId, executorId) {
    const run = await PayrollRun.findByPk(runId);
    if (!run) {
      throw new ApiError(404, 'Payroll run not found.');
    }
    if (['Processed', 'Locked', 'Cancelled'].includes(run.status)) {
      throw new ApiError(400, `Cannot recalculate payroll in ${run.status} status.`);
    }

    const monthIndex = MONTH_MAP[run.month];
    if (monthIndex === undefined) {
      throw new ApiError(400, `Invalid payroll month: ${run.month}`);
    }

    const year = parseInt(run.year);
    const totalMonthDays = new Date(year, monthIndex + 1, 0).getDate();
    const startDateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
    const endDateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${totalMonthDays}`;

    // Start Transaction
    const transaction = await sequelize.transaction();

    try {
      // Fetch active employees
      const employees = await Employee.findAll({ where: { status: 'Active' }, transaction });

      // Clear existing payroll items for this run
      const existingItems = await PayrollItem.findAll({ where: { payrollRunId: runId }, transaction });
      for (const item of existingItems) {
        await PayrollEarning.destroy({ where: { payrollItemId: item.id }, transaction });
        await PayrollDeduction.destroy({ where: { payrollItemId: item.id }, transaction });
        await item.destroy({ transaction });
      }

      for (const emp of employees) {
        // Find active salary structure assignment
        const assignment = await EmployeeSalaryAssignment.findOne({
          where: {
            employeeId: emp.id,
            isActive: true,
            effectiveFrom: { [Op.lte]: endDateStr },
            [Op.or]: [
              { effectiveTo: { [Op.gte]: startDateStr } },
              { effectiveTo: null }
            ]
          },
          include: [{
            model: SalaryStructure,
            as: 'structure',
            include: [{ model: SalaryComponent, as: 'components' }]
          }],
          transaction
        });

        if (!assignment || !assignment.structure) {
          throw new ApiError(400, `Employee ${emp.employeeName || emp.email} does not have an active salary structure assigned for this period.`);
        }

        // Fetch attendance records for proration and OT
        const attendance = await Attendance.findAll({
          where: {
            employeeId: emp.id,
            date: { [Op.between]: [startDateStr, endDateStr] }
          },
          transaction
        });

        // Calculate days
        const absentCount = attendance.filter(a => a.status === 'Absent').length;
        const halfDayCount = attendance.filter(a => a.status === 'HalfDay').length;
        
        // Fetch approved leave requests
        const leaves = await Leave.findAll({
          where: {
            employeeId: emp.id,
            status: { [Op.in]: ['Approved', 'APPROVED'] },
            [Op.or]: [
              { fromDate: { [Op.between]: [startDateStr, endDateStr] } },
              { toDate: { [Op.between]: [startDateStr, endDateStr] } },
              {
                fromDate: { [Op.lte]: startDateStr },
                toDate: { [Op.gte]: endDateStr }
              }
            ]
          },
          transaction
        });

        let lopLeaveDays = 0;
        let paidLeaveDays = 0;
        
        leaves.forEach(l => {
          // Estimate overlapping days in target month
          const start = new Date(l.fromDate > startDateStr ? l.fromDate : startDateStr);
          const end = new Date(l.toDate < endDateStr ? l.toDate : endDateStr);
          const diffTime = Math.abs(end - start);
          const overlapDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

          if (l.leaveType && l.leaveType.toUpperCase().includes('LOP')) {
            lopLeaveDays += overlapDays;
          } else {
            paidLeaveDays += overlapDays;
          }
        });

        // LOP Days = Absent days + LOP leave days + halfDay contributions
        const lopDays = absentCount + lopLeaveDays + (halfDayCount * 0.5);
        const payableDays = Math.max(0, totalMonthDays - lopDays);

        // Sum Overtime hours
        let otHours = 0;
        attendance.forEach(a => {
          if (a.overtime) {
            otHours += parseFloat(a.overtime) || 0;
          }
        });

        // 1. Create payroll item
        const payrollItem = await PayrollItem.create({
          payrollRunId: runId,
          employeeId: emp.id,
          workingDays: totalMonthDays,
          presentDays: payableDays - paidLeaveDays,
          absentDays: absentCount,
          leaveDays: paidLeaveDays,
          lopDays,
          overtimeHours: otHours,
          status: 'Draft'
        }, { transaction });

        // Let's compute earnings & deductions
        const components = assignment.structure.components || [];
        const earnings = [];
        const deductions = [];

        let basicProrated = 0;
        let grossSalary = 0;
        let totalDeductions = 0;

        // First pass: Calculate fixed earnings
        const earningComponents = components.filter(c => c.type === 'Earning');
        const basicComponent = earningComponents.find(c => c.name.toLowerCase() === 'basic') || earningComponents[0];
        
        // Calculate basic component value
        let basicVal = 0;
        if (basicComponent) {
          basicVal = parseFloat(basicComponent.value);
          if (basicComponent.calculationType === 'Percentage') {
            basicVal = (parseFloat(assignment.baseGross) * basicVal) / 100;
          }
        }
        
        // Prorate all earnings based on payable days
        for (const comp of earningComponents) {
          let compAmount = parseFloat(comp.value);
          if (comp.calculationType === 'Percentage') {
            const refComponent = comp.referenceComponent || 'Gross';
            if (refComponent.toLowerCase() === 'basic') {
              compAmount = (basicVal * compAmount) / 100;
            } else {
              compAmount = (parseFloat(assignment.baseGross) * compAmount) / 100;
            }
          }
          // Prorate
          const proratedAmount = (compAmount / totalMonthDays) * payableDays;
          if (comp.name.toLowerCase() === 'basic') {
            basicProrated = proratedAmount;
          }

          await PayrollEarning.create({
            payrollItemId: payrollItem.id,
            name: comp.name,
            amount: proratedAmount
          }, { transaction });

          grossSalary += proratedAmount;
        }

        // Overtime earnings calculation
        let otEarnings = 0;
        if (emp.overtimeEligible && otHours > 0) {
          // Standard Overtime multiplier: 1.5 of hourly rate based on basic
          const hourlyRate = basicProrated / (totalMonthDays * 8);
          otEarnings = hourlyRate * 1.5 * otHours;
          grossSalary += otEarnings;

          // Update payroll item overtime earnings
          payrollItem.overtimeEarnings = otEarnings;

          await PayrollEarning.create({
            payrollItemId: payrollItem.id,
            name: 'Overtime Allowance',
            amount: otEarnings
          }, { transaction });
        }

        // Deductions Pass
        const deductionComponents = components.filter(c => c.type === 'Deduction');
        for (const comp of deductionComponents) {
          let compAmount = parseFloat(comp.value);
          if (comp.calculationType === 'Percentage') {
            const refComponent = comp.referenceComponent || 'Basic';
            if (refComponent.toLowerCase() === 'basic') {
              compAmount = (basicProrated * compAmount) / 100;
            } else {
              compAmount = (grossSalary * compAmount) / 100;
            }
          }

          // If PF applicable check
          if (comp.name.toLowerCase().includes('pf') && !emp.pfApplicable) {
            continue;
          }
          // ESI applicability: ESI is only applicable if gross wages <= 21000
          if (comp.name.toLowerCase().includes('esi')) {
            if (!emp.esiApplicable || grossSalary > 21000) {
              continue;
            }
          }
          // TDS applicability
          if (comp.name.toLowerCase().includes('tds') && !emp.tdsApplicable) {
            continue;
          }

          await PayrollDeduction.create({
            payrollItemId: payrollItem.id,
            name: comp.name,
            amount: compAmount
          }, { transaction });

          totalDeductions += compAmount;
        }

        // Professional Tax (PT) configuration rule
        if (emp.state || assignment.structure.components.some(c => c.name.toLowerCase().includes('tax') || c.name.toLowerCase().includes('pt'))) {
          const empState = emp.state || 'Maharashtra';
          const ptRule = await ProfessionalTaxRule.findOne({
            where: {
              state: empState,
              minSalary: { [Op.lte]: grossSalary },
              maxSalary: { [Op.gte]: grossSalary }
            },
            transaction
          });
          if (ptRule && ptRule.taxAmount > 0) {
            const ptDeducted = parseFloat(ptRule.taxAmount);
            await PayrollDeduction.create({
              payrollItemId: payrollItem.id,
              name: 'Professional Tax (PT)',
              amount: ptDeducted
            }, { transaction });
            totalDeductions += ptDeducted;
          }
        }

        // Loan EMI Deduction
        const activeLoan = await EmployeeLoan.findOne({
          where: { employeeId: emp.id, status: 'Approved' },
          transaction
        });

        if (activeLoan && activeLoan.outstandingBalance > 0) {
          // Find due EMI schedule for this month
          const emiSchedule = await LoanEmiSchedule.findOne({
            where: {
              loanId: activeLoan.id,
              status: 'Pending',
              dueDate: { [Op.between]: [startDateStr, endDateStr] }
            },
            transaction
          });

          if (emiSchedule) {
            const emiDeducted = Math.min(parseFloat(emiSchedule.emiAmount), parseFloat(activeLoan.outstandingBalance));
            await PayrollDeduction.create({
              payrollItemId: payrollItem.id,
              name: `Loan EMI (${activeLoan.loanType})`,
              amount: emiDeducted
            }, { transaction });
            totalDeductions += emiDeducted;
          }
        }

        // Update PayrollItem summary
        payrollItem.grossSalary = grossSalary;
        payrollItem.totalAllowances = grossSalary - basicProrated - otEarnings;
        payrollItem.totalDeductions = totalDeductions;
        payrollItem.netSalary = Math.max(0, grossSalary - totalDeductions);
        await payrollItem.save({ transaction });
      }

      await transaction.commit();
      await this.logPayrollAction(executorId, 'Calculate', 'Payroll Process', runId, 'Success');
      return await this.getPayrollRunDetails(runId);

    } catch (err) {
      await transaction.rollback();
      await this.logPayrollAction(executorId, 'Calculate', 'Payroll Process', runId, 'Failed', null, { error: err.message });
      throw err;
    }
  }

  /**
   * 5. Submit / Approve payroll
   */
  async approvePayrollRun(runId, executorId) {
    const run = await PayrollRun.findByPk(runId);
    if (!run) {
      throw new ApiError(404, 'Payroll run not found.');
    }
    if (run.status !== 'Draft' && run.status !== 'Pending_Approval') {
      throw new ApiError(400, `Cannot approve payroll in ${run.status} status.`);
    }

    const oldValues = { ...run.toJSON() };
    run.status = 'Approved';
    run.approvedBy = executorId;
    run.approvedAt = new Date();
    await run.save();

    // Update payroll items status to Approved
    await PayrollItem.update({ status: 'Approved' }, { where: { payrollRunId: runId } });

    await this.logPayrollAction(executorId, 'Approve', 'Payroll Process', runId, 'Success', oldValues, run);
    return run;
  }

  /**
   * 6. Process payroll run (payslips generation, update loan outstanding, ESI contributions, PT contributions)
   */
  async processPayrollRun(runId, executorId) {
    const run = await PayrollRun.findByPk(runId);
    if (!run) {
      throw new ApiError(404, 'Payroll run not found.');
    }
    if (run.status !== 'Approved') {
      throw new ApiError(400, `Cannot process payroll runs that are not in Approved status. Current status: ${run.status}`);
    }

    const monthIndex = MONTH_MAP[run.month];
    const year = parseInt(run.year);
    const startDateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
    const endDateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${new Date(year, monthIndex + 1, 0).getDate()}`;

    const transaction = await sequelize.transaction();

    try {
      const payrollItems = await PayrollItem.findAll({
        where: { payrollRunId: runId },
        include: [
          { model: PayrollEarning, as: 'earnings' },
          { model: PayrollDeduction, as: 'deductions' },
          { model: Employee, as: 'employee' }
        ],
        transaction
      });

      for (const item of payrollItems) {
        // a. Create immutable Payslip snapshot
        const earningsObj = {};
        item.earnings.forEach(e => {
          earningsObj[e.name.toLowerCase()] = parseFloat(e.amount);
        });

        const deductionsObj = {};
        item.deductions.forEach(d => {
          deductionsObj[d.name.toLowerCase()] = parseFloat(d.amount);
        });

        const basicVal = earningsObj['basic'] || 0;
        const hraVal = earningsObj['hra'] || 0;
        const conveyanceVal = earningsObj['conveyance'] || 0;
        const medicalVal = earningsObj['medical'] || 0;
        const specialVal = earningsObj['special'] || 0;
        const bonusVal = earningsObj['bonus'] || 0;
        const incentiveVal = earningsObj['incentive'] || 0;

        let otherAllowances = 0;
        item.earnings.forEach(e => {
          const lower = e.name.toLowerCase();
          if (!['basic', 'hra', 'conveyance', 'medical', 'special', 'bonus', 'incentive'].includes(lower)) {
            otherAllowances += parseFloat(e.amount);
          }
        });

        // Deductions matching
        let pfVal = 0;
        let esiVal = 0;
        let ptVal = 0;
        let tdsVal = 0;
        let loanVal = 0;

        item.deductions.forEach(d => {
          const lower = d.name.toLowerCase();
          if (lower.includes('pf') || lower.includes('provident')) {
            pfVal = parseFloat(d.amount);
          } else if (lower.includes('esi') || lower.includes('state insurance')) {
            esiVal = parseFloat(d.amount);
          } else if (lower.includes('pt') || lower.includes('professional tax')) {
            ptVal = parseFloat(d.amount);
          } else if (lower.includes('tds') || lower.includes('tax deduction')) {
            tdsVal = parseFloat(d.amount);
          } else if (lower.includes('loan emi') || lower.includes('loan')) {
            loanVal = parseFloat(d.amount);
          }
        });

        const payslip = await Payslip.create({
          payrollItemId: item.id,
          employeeId: item.employeeId,
          month: run.month,
          year: run.year,
          basic: basicVal,
          hra: hraVal,
          conveyance: conveyanceVal,
          medical: medicalVal,
          special: specialVal,
          otherAllowances,
          bonus: bonusVal,
          incentive: incentiveVal,
          pf: pfVal,
          esi: esiVal,
          pt: ptVal,
          tds: tdsVal,
          loanDeduction: loanVal,
          grossSalary: item.grossSalary,
          totalDeductions: item.totalDeductions,
          netSalary: item.netSalary,
          paymentDate: new Date(),
          paymentStatus: 'Paid',
          paymentMode: 'Bank Transfer',
          pdfUrl: `/api/finance/payslips/${item.id}/pdf`
        }, { transaction });

        // b. Loan repayments updates
        if (loanVal > 0) {
          const activeLoan = await EmployeeLoan.findOne({
            where: { employeeId: item.employeeId, status: 'Approved' },
            transaction
          });

          if (activeLoan) {
            const emiSchedule = await LoanEmiSchedule.findOne({
              where: {
                loanId: activeLoan.id,
                status: 'Pending',
                dueDate: { [Op.between]: [startDateStr, endDateStr] }
              },
              transaction
            });

            if (emiSchedule) {
              emiSchedule.status = 'Paid';
              await emiSchedule.save({ transaction });
            }

            // Create repayment entry
            await LoanRepayment.create({
              loanId: activeLoan.id,
              payrollItemId: item.id,
              emiScheduleId: emiSchedule ? emiSchedule.id : null,
              amount: loanVal,
              paymentDate: new Date(),
              paymentMode: 'Payroll Deduction'
            }, { transaction });

            // Reduce outstanding balance
            activeLoan.totalPaid = parseFloat(activeLoan.totalPaid) + loanVal;
            activeLoan.outstandingBalance = Math.max(0, parseFloat(activeLoan.outstandingBalance) - loanVal);
            if (activeLoan.outstandingBalance <= 0) {
              activeLoan.status = 'Closed';
            }
            await activeLoan.save({ transaction });
          }
        }

        // c. ESI statutory contributions log
        if (esiVal > 0) {
          // Employer ESI Contribution: 3.25% of gross wages
          const employerContribution = (parseFloat(item.grossSalary) * 3.25) / 100;
          await EsiContribution.create({
            employeeId: item.employeeId,
            payrollItemId: item.id,
            esiNumber: item.employee ? item.employee.esicNumber : null,
            employeeContribution: esiVal,
            employerContribution,
            grossWages: item.grossSalary,
            month: run.month,
            year: run.year
          }, { transaction });
        }

        // d. PT statutory contributions log
        if (ptVal > 0) {
          await ProfessionalTaxContribution.create({
            employeeId: item.employeeId,
            payrollItemId: item.id,
            state: item.employee ? item.employee.state || 'Maharashtra' : 'Maharashtra',
            ptAmount: ptVal,
            month: run.month,
            year: run.year
          }, { transaction });
        }

        // Update PayrollItem status
        item.status = 'Processed';
        await item.save({ transaction });
      }

      run.status = 'Processed';
      run.processedBy = executorId;
      run.processedAt = new Date();
      await run.save({ transaction });

      await transaction.commit();
      await this.logPayrollAction(executorId, 'Process', 'Payroll Process', runId, 'Success');
      return run;

    } catch (err) {
      await transaction.rollback();
      await this.logPayrollAction(executorId, 'Process', 'Payroll Process', runId, 'Failed', null, { error: err.message });
      throw err;
    }
  }

  /**
   * 7. Lock payroll runs after processing
   */
  async lockPayrollRun(runId, executorId) {
    const run = await PayrollRun.findByPk(runId);
    if (!run) {
      throw new ApiError(404, 'Payroll run not found.');
    }
    if (run.status !== 'Processed') {
      throw new ApiError(400, `Cannot lock payroll runs in status: ${run.status}. Needs to be processed first.`);
    }

    const oldValues = { ...run.toJSON() };
    run.status = 'Locked';
    run.lockedBy = executorId;
    run.lockedAt = new Date();
    await run.save();

    await PayrollItem.update({ status: 'Locked' }, { where: { payrollRunId: runId } });

    await this.logPayrollAction(executorId, 'Lock', 'Payroll Process', runId, 'Success', oldValues, run);
    return run;
  }

  /**
   * 8. Cancel payroll run
   */
  async cancelPayrollRun(runId, executorId) {
    const run = await PayrollRun.findByPk(runId);
    if (!run) {
      throw new ApiError(404, 'Payroll run not found.');
    }
    if (run.status === 'Locked' || run.status === 'Processed') {
      throw new ApiError(400, `Cannot cancel a processed or locked payroll run.`);
    }

    const oldValues = { ...run.toJSON() };
    run.status = 'Cancelled';
    await run.save();

    await PayrollItem.update({ status: 'Cancelled' }, { where: { payrollRunId: runId } });

    await this.logPayrollAction(executorId, 'Cancel', 'Payroll Process', runId, 'Success', oldValues, run);
    return run;
  }
}

module.exports = new PayrollService();
