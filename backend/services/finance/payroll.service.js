// backend/services/finance/payroll.service.js
const {
  sequelize,
  PayrollRun,
  PayrollItem,
  PayrollRecord,
  PayrollEarning,
  PayrollDeduction,
  Payslip,
  Employee,
  Department,
  Designation,
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
  StatutoryConfiguration,
  PayrollPayment,
  PayrollAuditLog,
  User,
  Role
} = require('../../models');
const ApiError = require('../../utils/apiError');
const auditLogService = require('../core/auditLog.service');
const salaryStructureService = require('./salaryStructure.service');
const { Op } = require('sequelize');

const MONTH_MAP = {
  "January": 0, "February": 1, "March": 2, "April": 3,
  "May": 4, "June": 5, "July": 6, "August": 7,
  "September": 8, "October": 9, "November": 10, "December": 11
};

const isStatutorilyApplicable = value => {
  if (value === undefined || value === null || value === '') return true;
  return !['false', '0', 'no', 'off'].includes(String(value).trim().toLowerCase());
};

const applyStatutoryLimits = (amount, rule) => {
  let limited = Math.max(0, amount);
  if (rule?.minimumAmount != null) limited = Math.max(limited, Number(rule.minimumAmount));
  if (rule?.maximumAmount != null) limited = Math.min(limited, Number(rule.maximumAmount));
  return Math.round(limited * 100) / 100;
};

class PayrollService {
  /**
   * Helper to write to both system audit log and payroll_audit_logs table
   */
  async logPayrollAction(userId, action, entityType, entityId, status, oldValues = null, newValues = null, reason = null) {
    try {
      const user = await User.findByPk(userId, { include: [{ model: Role, as: 'role' }] }).catch(() => null);
      
      // Standard Audit Log
      await auditLogService.log({
        userId,
        username: user ? user.email : 'System',
        roleName: user && user.role ? user.role.roleName : 'Admin',
        actionType: action,
        moduleName: 'Payroll Management',
        recordId: String(entityId),
        previousValues: oldValues,
        newValues,
        status
      }).catch(() => {});

      // Dedicated Payroll Audit Log
      await PayrollAuditLog.create({
        actorUserId: userId ? String(userId) : 'system',
        action,
        entityType,
        entityId: String(entityId),
        oldValues: oldValues ? (typeof oldValues === 'object' ? oldValues : JSON.parse(oldValues)) : null,
        newValues: newValues ? (typeof newValues === 'object' ? newValues : JSON.parse(newValues)) : null,
        reason: reason || `${action} performed on ${entityType} ${entityId}`
      }).catch(e => console.warn('PayrollAuditLog write warning:', e.message));

    } catch (e) {
      console.error('Audit log failed inside payroll service:', e.message);
    }
  }

  /**
   * 1. Create a payroll run
   */
  async createPayrollRun(month, year, executorId, notes = null) {
    if (!month || !year) {
      throw new ApiError(400, 'Month and Year are required to initialize a payroll run.');
    }

    const yr = parseInt(year);
    const monthIndex = MONTH_MAP[month];
    if (monthIndex === undefined) {
      throw new ApiError(400, `Invalid payroll month: ${month}`);
    }

    // Prevent duplicate active payroll runs for the same period
    const existing = await PayrollRun.findOne({
      where: {
        [Op.or]: [{ month }, { payrollMonth: month }],
        [Op.or]: [{ year: yr }, { payrollYear: yr }],
        status: { [Op.ne]: 'Cancelled' }
      }
    });

    if (existing) {
      throw new ApiError(400, `A payroll run already exists for ${month} ${year} (Status: ${existing.status}).`);
    }

    const totalMonthDays = new Date(yr, monthIndex + 1, 0).getDate();
    const periodStart = `${yr}-${String(monthIndex + 1).padStart(2, '0')}-01`;
    const periodEnd = `${yr}-${String(monthIndex + 1).padStart(2, '0')}-${String(totalMonthDays).padStart(2, '0')}`;
    const payrollCode = `PR-${yr}-${String(monthIndex + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const run = await PayrollRun.create({
      payrollCode,
      payrollMonth: month,
      month,
      payrollYear: yr,
      year: yr,
      periodStart,
      periodEnd,
      status: 'Draft',
      paymentStatus: 'Unpaid',
      notes,
      processedBy: executorId
    });

    await this.logPayrollAction(executorId, 'CREATE_PAYROLL_RUN', 'PayrollRun', run.id, 'Success', null, run.toJSON());
    return run;
  }

  /**
   * 2. Get payroll runs
   */
  async getPayrollRuns(filters = {}) {
    const { status, year, month } = filters;
    const where = {};
    if (status) where.status = status;
    if (year) {
      where[Op.or] = [{ year: parseInt(year) }, { payrollYear: parseInt(year) }];
    }
    if (month) {
      where[Op.or] = [{ month }, { payrollMonth: month }];
    }

    return await PayrollRun.findAll({
      where,
      order: [
        ['year', 'DESC'],
        [sequelize.literal(`FIELD(COALESCE(payroll_month, month), 'December', 'November', 'October', 'September', 'August', 'July', 'June', 'May', 'April', 'March', 'February', 'January')`), 'ASC'],
        ['created_at', 'DESC']
      ]
    });
  }

  /**
   * 3. Get single payroll run details with itemized totals and exceptions
   */
  async getPayrollRunDetails(id) {
    const run = await PayrollRun.findByPk(id, {
      include: [
        {
          model: PayrollItem,
          as: 'items',
          include: [
            { model: Employee, as: 'employee' },
            { model: PayrollEarning, as: 'earnings' },
            { model: PayrollDeduction, as: 'deductions' }
          ]
        },
        {
          model: PayrollRecord,
          as: 'records',
          include: [
            { model: Employee, as: 'employeeDetails' },
            { model: PayrollEarning, as: 'recordEarnings' },
            { model: PayrollDeduction, as: 'recordDeductions' }
          ]
        }
      ]
    });

    if (!run) {
      throw new ApiError(404, 'Payroll run not found.');
    }

    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let totalEmployerPf = 0;
    let totalEmployerEsi = 0;
    let totalCtc = 0;

    const records = run.records?.length ? run.records : (run.items || []);
    records.forEach(item => {
      totalGross += parseFloat(item.grossSalary || item.grossEarnings) || 0;
      totalDeductions += parseFloat(item.totalDeductions) || 0;
      totalNet += parseFloat(item.netSalary) || 0;
      totalEmployerPf += parseFloat(item.employerPf) || 0;
      totalEmployerEsi += parseFloat(item.employerEsi) || 0;
      totalCtc += parseFloat(item.totalCtc) || ((parseFloat(item.grossSalary || item.grossEarnings) || 0) + (parseFloat(item.employerPf) || 0) + (parseFloat(item.employerEsi) || 0));
    });

    const runJson = run.toJSON();
    runJson.summary = {
      employeeCount: records.length,
      totalGross: Math.round(totalGross * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      totalNet: Math.round(totalNet * 100) / 100,
      totalEmployerPf: Math.round(totalEmployerPf * 100) / 100,
      totalEmployerEsi: Math.round(totalEmployerEsi * 100) / 100,
      totalCtc: Math.round(totalCtc * 100) / 100
    };

    return runJson;
  }

  /**
   * 4. Calculate / Recalculate payroll run (Transaction Safe & Idempotent)
   */
  async calculatePayrollRun(runId, executorId, options = {}) {
    await salaryStructureService.ensureSchema();
    const run = await PayrollRun.findByPk(runId);
    if (!run) {
      throw new ApiError(404, 'Payroll run not found.');
    }
    if (['Approved', 'Locked', 'Processed', 'paid', 'Cancelled'].includes(run.status)) {
      throw new ApiError(400, `Cannot recalculate payroll in "${run.status}" status.`);
    }

    const monthStr = run.payrollMonth || run.month;
    const monthIndex = MONTH_MAP[monthStr];
    if (monthIndex === undefined) {
      throw new ApiError(400, `Invalid payroll month: ${monthStr}`);
    }

    const year = parseInt(run.payrollYear || run.year);
    const totalMonthDays = new Date(year, monthIndex + 1, 0).getDate();
    const startDateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
    const endDateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(totalMonthDays).padStart(2, '0')}`;

    // Load statutory rules effective for this payroll period.
    const statutoryWindow = {
      effectiveFrom: { [Op.lte]: endDateStr },
      [Op.and]: [{
        [Op.or]: [
          { effectiveTo: null },
          { effectiveTo: { [Op.gte]: startDateStr } }
        ]
      }]
    };
    const pfRule = await StatutoryConfiguration.findOne({
      where: { ruleCode: 'PF_STANDARD', isActive: true, ...statutoryWindow },
      order: [['effectiveFrom', 'DESC']]
    });

    const esiRule = await StatutoryConfiguration.findOne({
      where: { ruleCode: 'ESI_DEFAULT', isActive: true, ...statutoryWindow },
      order: [['effectiveFrom', 'DESC']]
    });

    const transaction = await sequelize.transaction();
    const exceptions = [];

    try {
      // 1. Fetch eligible employees
      const empWhere = {
        [Op.or]: [
          { employeeStatus: 'Active' },
          { employeeStatus: 'active' },
          { employeeStatus: null }
        ]
      };
      if (options.departmentId) empWhere.department = options.departmentId;
      if (options.employeeId) empWhere.id = options.employeeId;

      const employees = await Employee.findAll({ where: empWhere, transaction });

      // 2. Clear existing items and records for this run (Idempotency)
      const existingItems = await PayrollItem.findAll({ where: { payrollRunId: runId }, transaction });
      for (const item of existingItems) {
        await PayrollEarning.destroy({ where: { payrollItemId: item.id }, transaction });
        await PayrollDeduction.destroy({ where: { payrollItemId: item.id }, transaction });
        await item.destroy({ transaction });
      }

      const existingRecords = await PayrollRecord.findAll({ where: { payrollRunId: runId }, transaction });
      for (const rec of existingRecords) {
        await PayrollEarning.destroy({ where: { payrollRecordId: rec.id }, transaction });
        await PayrollDeduction.destroy({ where: { payrollRecordId: rec.id }, transaction });
        await rec.destroy({ transaction });
      }

      let runTotalEarnings = 0;
      let runTotalDeductions = 0;
      let runTotalNetPay = 0;
      let processedCount = 0;

      for (const emp of employees) {
        const empName = emp.employeeName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email || 'Employee';

        // Check active salary structure assignment
        const assignment = await EmployeeSalaryAssignment.findOne({
          where: {
            employeeId: emp.id,
            isActive: true,
            approvalStatus: 'Approved',
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
          exceptions.push({
            employeeId: emp.id,
            employeeName: empName,
            employeeCode: emp.employeeCode || emp.employeeId,
            reason: 'Missing active Salary Structure assignment for this period'
          });
          continue;
        }

        // Validate bank details warning
        const profile = emp.profileData ? (typeof emp.profileData === 'object' ? emp.profileData : JSON.parse(emp.profileData || '{}')) : {};
        if (!emp.accountNumber && !profile.accountNumber && !profile.bankAccount) {
          exceptions.push({
            employeeId: emp.id,
            employeeName: empName,
            employeeCode: emp.employeeCode || emp.employeeId,
            reason: 'Missing Bank Account details'
          });
        }

        // Calculate proration for mid-month joining
        let employeeMonthDays = totalMonthDays;
        if (emp.dateOfJoining) {
          const joinDate = new Date(emp.dateOfJoining);
          if (!isNaN(joinDate.getTime())) {
            const joinYear = joinDate.getFullYear();
            const joinMonth = joinDate.getMonth();
            if (joinYear === year && joinMonth === monthIndex) {
              const joinDay = joinDate.getDate();
              employeeMonthDays = totalMonthDays - joinDay + 1;
            } else if (joinDate > new Date(year, monthIndex + 1, 0)) {
              // Joined in future month
              continue;
            }
          }
        }

        // Fetch attendance records in period
        const attendance = await Attendance.findAll({
          where: {
            employeeId: emp.id,
            date: { [Op.between]: [startDateStr, endDateStr] }
          },
          transaction
        });

        const absentCount = attendance.filter(a => a.status === 'Absent').length;
        const halfDayCount = attendance.filter(a => a.status === 'HalfDay').length;

        // Fetch approved leaves in period
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
          const s = new Date(l.fromDate > startDateStr ? l.fromDate : startDateStr);
          const e = new Date(l.toDate < endDateStr ? l.toDate : endDateStr);
          const diffTime = Math.abs(e - s);
          const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          if (l.leaveType && l.leaveType.toUpperCase().includes('LOP')) {
            lopLeaveDays += days;
          } else {
            paidLeaveDays += days;
          }
        });

        const lopDays = Math.min(employeeMonthDays, absentCount + lopLeaveDays + (halfDayCount * 0.5));
        const payableDays = Math.max(0, employeeMonthDays - lopDays);

        let otHours = 0;
        attendance.forEach(a => {
          if (a.overtime) {
            otHours += parseFloat(a.overtime) || 0;
          }
        });

        // Create PayrollItem record (backward compatibility)
        const payrollItem = await PayrollItem.create({
          payrollRunId: runId,
          employeeId: emp.id,
          workingDays: totalMonthDays,
          presentDays: Math.max(0, payableDays - paidLeaveDays),
          absentDays: absentCount,
          leaveDays: paidLeaveDays,
          lopDays,
          overtimeHours: otHours,
          status: 'Calculated'
        }, { transaction });

        // Create PayrollRecord record (enterprise schema)
        const payrollRecord = await PayrollRecord.create({
          payrollRunId: runId,
          employeeId: emp.id,
          salaryAssignmentId: assignment.id,
          attendanceDays: Math.max(0, payableDays - paidLeaveDays),
          payableDays,
          paidLeaveDays,
          unpaidLeaveDays: lopDays,
          lossOfPayDays: lopDays,
          overtimeHours: otHours,
          status: 'Calculated'
        }, { transaction });

        // Components calculation
        const getValidNum = (...candidates) => {
          for (const c of candidates) {
            if (c !== undefined && c !== null && c !== '') {
              const parsed = parseFloat(c);
              if (!isNaN(parsed) && parsed > 0) return parsed;
            }
          }
          return 0;
        };

        const components = assignment.structure.components || [];
        const categoryOf = component => component.category || component.componentCategory || component.component_category ||
          ((component.componentType || component.type) === 'Deduction' ? 'Employee Deduction' : 'Earning');
        const earningComponents = components.filter(component => categoryOf(component) === 'Earning');
        const deductionComponents = components.filter(component => categoryOf(component) === 'Employee Deduction');

        const baseGross = getValidNum(assignment.baseGross, assignment.grossSalary);
        const componentBreakdown = salaryStructureService.calculateBreakdown(baseGross, components, emp, {
          referenceSalaryType: 'Monthly Gross'
        });
        const normalizeComponentKey = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const calculatedComponentAmount = new Map();
        [...componentBreakdown.earnings, ...componentBreakdown.deductions, ...componentBreakdown.employerContributions]
          .forEach(component => {
            calculatedComponentAmount.set(normalizeComponentKey(component.name), component.amount);
            if (component.code) calculatedComponentAmount.set(normalizeComponentKey(component.code), component.amount);
          });
        let basicProrated = 0;
        let grossSalary = 0;
        let totalDeductions = 0;
        const earningsSnapshot = [];
        const deductionsSnapshot = [];

        // Prorate earnings based on payable days
        for (const comp of earningComponents) {
          const compName = comp.componentName || comp.name;
          const compCode = comp.componentCode || compName.toUpperCase().replace(/\s+/g, '_');
          const fullAmt = calculatedComponentAmount.get(normalizeComponentKey(comp.componentCode || compName)) || 0;

          const proratedAmt = totalMonthDays > 0 ? (fullAmt / totalMonthDays) * payableDays : 0;
          const finalEarning = Math.round(proratedAmt * 100) / 100;

          if (compName.toLowerCase().includes('basic') || normalizeComponentKey(compCode) === 'basic') {
            basicProrated = finalEarning;
          }

          await PayrollEarning.create({
            payrollRecordId: payrollRecord.id,
            payrollItemId: payrollItem.id,
            componentCode: compCode,
            componentName: compName,
            name: compName,
            calculationType: comp.calculationType,
            calculatedAmount: finalEarning,
            amount: finalEarning,
            description: `Payable days: ${payableDays}/${totalMonthDays}`
          }, { transaction });

          earningsSnapshot.push({ code: compCode, name: compName, amount: finalEarning });
          grossSalary += finalEarning;
        }

        // Overtime earnings
        let otEarnings = 0;
        if (otHours > 0) {
          const hourlyRate = (basicProrated > 0 ? basicProrated : (baseGross * 0.5)) / (totalMonthDays * 8);
          otEarnings = Math.round(hourlyRate * 1.5 * otHours * 100) / 100;
          grossSalary += otEarnings;
          payrollItem.overtimeEarnings = otEarnings;
          payrollRecord.overtimeEarnings = otEarnings;

          await PayrollEarning.create({
            payrollRecordId: payrollRecord.id,
            payrollItemId: payrollItem.id,
            componentCode: 'OVERTIME',
            componentName: 'Overtime Allowance',
            name: 'Overtime Allowance',
            calculationType: 'Formula',
            calculatedAmount: otEarnings,
            amount: otEarnings,
            description: `${otHours} hours @ 1.5x basic rate`
          }, { transaction });

          earningsSnapshot.push({ code: 'OVERTIME', name: 'Overtime Allowance', amount: otEarnings });
        }

        // Deductions calculation
        // 1. Employee PF (Dynamic Statutory Configuration)
        let pfDeducted = 0;
        const pfRate = pfRule?.employeeRate == null ? null : Number(pfRule.employeeRate);
        const pfCeiling = pfRule?.wageCeiling == null ? null : Number(pfRule.wageCeiling);

        if (isStatutorilyApplicable(emp.pfApplicable)) {
          const pfComp = deductionComponents.find(c => (c.componentName || c.name || '').toLowerCase().includes('pf') || (c.componentName || c.name || '').toLowerCase().includes('provident'));
          if (pfRate !== null && Number.isFinite(pfRate)) {
            const basis = String(pfRule.calculationBasis || 'Basic').toLowerCase();
            const configuredBase = /gross|eligible/.test(basis) ? grossSalary : basicProrated;
            const applicableBase = pfCeiling === null ? configuredBase : Math.min(configuredBase, pfCeiling);
            pfDeducted = applyStatutoryLimits(applicableBase * pfRate / 100, pfRule);
          } else if (pfComp) {
            const configuredAmount = calculatedComponentAmount.get(normalizeComponentKey(pfComp.componentCode || pfComp.componentName || pfComp.name)) || 0;
            pfDeducted = totalMonthDays > 0 ? (configuredAmount / totalMonthDays) * payableDays : 0;
            pfDeducted = applyStatutoryLimits(pfDeducted, pfComp);
          } else if (pfRule) {
            exceptions.push({
              employeeId: emp.id,
              employeeName: empName,
              employeeCode: emp.employeeCode || emp.employeeId,
              reason: 'PF rule has no employee rate or configured salary component'
            });
          } else {
            exceptions.push({
              employeeId: emp.id,
              employeeName: empName,
              employeeCode: emp.employeeCode || emp.employeeId,
              reason: 'No effective PF rule or employee PF component is configured'
            });
          }

          pfDeducted = Math.round(pfDeducted * 100) / 100;
          if (pfDeducted > 0) {
            await PayrollDeduction.create({
              payrollRecordId: payrollRecord.id,
              payrollItemId: payrollItem.id,
              deductionCode: 'PF_EMP',
              deductionName: 'Provident Fund (PF - Employee)',
              name: 'Provident Fund (PF - Employee)',
              deductionCategory: 'Statutory',
              calculatedAmount: pfDeducted,
              amount: pfDeducted,
              ruleSnapshot: JSON.stringify({ rate: pfRate, wageCeiling: pfCeiling, ruleId: pfRule?.id || null, base: basicProrated }),
              description: pfRate == null ? 'Configured PF deduction' : `PF Employee contribution @ ${pfRate}%`
            }, { transaction });

            deductionsSnapshot.push({ code: 'PF_EMP', name: 'PF Employee', amount: pfDeducted });
            totalDeductions += pfDeducted;
          }
        }

        // 2. Employee ESI (Dynamic Statutory Configuration)
        let esiDeducted = 0;
        const esiRate = esiRule?.employeeRate == null ? null : Number(esiRule.employeeRate);
        const esiCeiling = esiRule?.wageCeiling == null ? null : Number(esiRule.wageCeiling);

        if (isStatutorilyApplicable(emp.esiApplicable)) {
          const esiComp = deductionComponents.find(c => (c.componentName || c.name || '').toLowerCase().includes('esi') || (c.componentName || c.name || '').toLowerCase().includes('state insurance'));
          const withinEsiLimit = esiCeiling === null || grossSalary <= esiCeiling;
          if (esiRate !== null && Number.isFinite(esiRate) && withinEsiLimit) {
            const basis = String(esiRule.calculationBasis || 'Gross Earnings').toLowerCase();
            const configuredBase = /basic/.test(basis) ? basicProrated : grossSalary;
            esiDeducted = applyStatutoryLimits(configuredBase * esiRate / 100, esiRule);
          } else if (esiComp && (esiRule ? withinEsiLimit : true)) {
            const configuredAmount = calculatedComponentAmount.get(normalizeComponentKey(esiComp.componentCode || esiComp.componentName || esiComp.name)) || 0;
            esiDeducted = totalMonthDays > 0 ? Math.round((configuredAmount / totalMonthDays) * payableDays * 100) / 100 : 0;
            esiDeducted = applyStatutoryLimits(esiDeducted, esiComp);
          } else if (!esiRule && !esiComp) {
            exceptions.push({
              employeeId: emp.id,
              employeeName: empName,
              employeeCode: emp.employeeCode || emp.employeeId,
              reason: 'No effective ESI rule or employee ESI component is configured'
            });
          }

          if (esiDeducted > 0) {
            await PayrollDeduction.create({
              payrollRecordId: payrollRecord.id,
              payrollItemId: payrollItem.id,
              deductionCode: 'ESI_EMP',
              deductionName: 'ESI Contribution (Employee)',
              name: 'ESI Contribution (Employee)',
              deductionCategory: 'Statutory',
              calculatedAmount: esiDeducted,
              amount: esiDeducted,
              ruleSnapshot: JSON.stringify({ rate, ceiling: esiCeiling, gross: grossSalary }),
              description: `ESIC Employee contribution @ ${rate}%`
            }, { transaction });

            deductionsSnapshot.push({ code: 'ESI_EMP', name: 'ESI Employee', amount: esiDeducted });
            totalDeductions += esiDeducted;
          }
        }

        // 3. Professional Tax (PT)
        let ptDeducted = 0;
        const empState = emp.state || emp.workLocationState || null;
        const ptStatConfig = await StatutoryConfiguration.findOne({
          where: {
            isActive: true,
            ruleCode: { [Op.like]: `PT_%` },
            ...(empState ? {
              [Op.or]: [
                { applicableRegion: empState },
                { applicableRegion: 'All India' }
              ]
            } : { applicableRegion: 'All India' }),
            ...statutoryWindow
          },
          order: [['effectiveFrom', 'DESC']],
          transaction
        });

        if (ptStatConfig && ptStatConfig.configurationJson) {
          const config = typeof ptStatConfig.configurationJson === 'object' ? ptStatConfig.configurationJson : JSON.parse(ptStatConfig.configurationJson);
          if (Array.isArray(config.slabs)) {
            for (const slab of config.slabs) {
              if (grossSalary >= slab.min && grossSalary <= slab.max) {
                ptDeducted = monthStr === 'March' && slab.marchTax ? slab.marchTax : (monthStr === 'February' && slab.febTax ? slab.febTax : slab.tax);
                break;
              }
            }
          }
          ptDeducted = applyStatutoryLimits(ptDeducted, ptStatConfig);
        } else if (empState) {
          const ptRule = await ProfessionalTaxRule.findOne({
            where: {
              state: empState,
              minSalary: { [Op.lte]: grossSalary },
              maxSalary: { [Op.gte]: grossSalary },
              effectiveFrom: { [Op.lte]: endDateStr }
            },
            order: [['effectiveFrom', 'DESC']],
            transaction
          });

          if (ptRule && parseFloat(ptRule.taxAmount) > 0) {
            ptDeducted = parseFloat(ptRule.taxAmount);
          } else if (!ptRule) {
            const configuredPt = componentBreakdown.deductions.find(component => /professional tax|\bpt\b/i.test(component.name));
            if (configuredPt) {
              ptDeducted = totalMonthDays > 0 ? (configuredPt.amount / totalMonthDays) * payableDays : 0;
              ptDeducted = applyStatutoryLimits(ptDeducted, configuredPt);
            } else {
              exceptions.push({
                employeeId: emp.id,
                employeeName: empName,
                employeeCode: emp.employeeCode || emp.employeeId,
                reason: `No effective Professional Tax rule is configured for ${empState}`
              });
            }
          }
        } else {
          exceptions.push({
            employeeId: emp.id,
            employeeName: empName,
            employeeCode: emp.employeeCode || emp.employeeId,
            reason: 'Employee work state is required to determine Professional Tax'
          });
        }

        if (ptDeducted > 0) {
          ptDeducted = Math.round(ptDeducted * 100) / 100;
          await PayrollDeduction.create({
            payrollRecordId: payrollRecord.id,
            payrollItemId: payrollItem.id,
            deductionCode: 'PT_STATE',
            deductionName: `Professional Tax (${empState})`,
            name: `Professional Tax (${empState})`,
            deductionCategory: 'Statutory',
            calculatedAmount: ptDeducted,
            amount: ptDeducted,
            ruleSnapshot: JSON.stringify({ state: empState, grossSalary }),
            description: `Professional Tax applicable in ${empState}`
          }, { transaction });

          deductionsSnapshot.push({ code: 'PT_STATE', name: `PT (${empState})`, amount: ptDeducted });
          totalDeductions += ptDeducted;
        }

        // 4. Other custom deductions
        for (const comp of deductionComponents) {
          const compName = comp.componentName || comp.name;
          const lower = compName.toLowerCase();
          if (!lower.includes('pf') && !lower.includes('esi') && !lower.includes('pt') && !lower.includes('provident')) {
            const fullAmount = calculatedComponentAmount.get(normalizeComponentKey(comp.componentCode || compName)) || 0;
            let amt = totalMonthDays > 0 ? (fullAmount / totalMonthDays) * payableDays : 0;
            amt = Math.round(amt * 100) / 100;
            if (amt > 0) {
              const compCode = comp.componentCode || compName.toUpperCase().replace(/\s+/g, '_');
              await PayrollDeduction.create({
                payrollRecordId: payrollRecord.id,
                payrollItemId: payrollItem.id,
                deductionCode: compCode,
                deductionName: compName,
                name: compName,
                deductionCategory: 'Other',
                calculatedAmount: amt,
                amount: amt,
                description: `Configured deduction`
              }, { transaction });

              deductionsSnapshot.push({ code: compCode, name: compName, amount: amt });
              totalDeductions += amt;
            }
          }
        }

        // 5. Loan EMI deduction
        const activeLoan = await EmployeeLoan.findOne({
          where: {
            employeeId: emp.id,
            status: { [Op.in]: ['Approved', 'approved'] },
            outstandingBalance: { [Op.gt]: 0 }
          },
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

          const scheduledEmi = emiSchedule ? parseFloat(emiSchedule.emiAmount) : parseFloat(activeLoan.installmentAmount || 0);
          const emiToDeduct = Math.min(scheduledEmi, parseFloat(activeLoan.outstandingBalance));

          if (emiToDeduct > 0) {
            await PayrollDeduction.create({
              payrollRecordId: payrollRecord.id,
              payrollItemId: payrollItem.id,
              deductionCode: 'LOAN_EMI',
              deductionName: `Loan EMI (${activeLoan.loanType})`,
              name: `Loan EMI (${activeLoan.loanType})`,
              deductionCategory: 'Loan Recovery',
              calculatedAmount: emiToDeduct,
              amount: emiToDeduct,
              ruleSnapshot: JSON.stringify({ loanId: activeLoan.id, loanType: activeLoan.loanType, outstanding: activeLoan.outstandingBalance }),
              description: `Monthly loan recovery installment`
            }, { transaction });

            deductionsSnapshot.push({ code: 'LOAN_EMI', name: `Loan EMI (${activeLoan.loanType})`, amount: emiToDeduct });
            totalDeductions += emiToDeduct;
          }
        }

        // Employer Contributions
        const configuredPf = componentBreakdown.employerContributions.filter(component => /pf|provident/i.test(component.name));
        const employerPfRate = pfRule?.employerRate == null ? null : Number(pfRule.employerRate);
        let employerPf = 0;
        if (isStatutorilyApplicable(emp.pfApplicable) && employerPfRate !== null && Number.isFinite(employerPfRate)) {
          const basis = String(pfRule.calculationBasis || 'Basic').toLowerCase();
          const configuredBase = /gross|eligible/.test(basis) ? grossSalary : basicProrated;
          const applicableBase = pfCeiling === null ? configuredBase : Math.min(configuredBase, pfCeiling);
          employerPf = applyStatutoryLimits(applicableBase * employerPfRate / 100, pfRule);
        } else if (configuredPf.length) {
          employerPf = Math.round(configuredPf.reduce((sum, component) => sum + component.amount, 0) * (payableDays / totalMonthDays) * 100) / 100;
        }
        const configuredEsi = componentBreakdown.employerContributions.filter(component => /esi|insurance/i.test(component.name));
        const employerEsiRate = esiRule?.employerRate == null ? null : Number(esiRule.employerRate);
        let employerEsi = 0;
        const withinEsiLimit = esiCeiling === null || grossSalary <= esiCeiling;
        if (isStatutorilyApplicable(emp.esiApplicable) && employerEsiRate !== null &&
          Number.isFinite(employerEsiRate) && withinEsiLimit) {
          const basis = String(esiRule.calculationBasis || 'Gross Earnings').toLowerCase();
          const configuredBase = /basic/.test(basis) ? basicProrated : grossSalary;
          employerEsi = applyStatutoryLimits(configuredBase * employerEsiRate / 100, esiRule);
        } else if (configuredEsi.length && (!esiRule || withinEsiLimit)) {
          employerEsi = Math.round(configuredEsi.reduce((sum, component) => sum + component.amount, 0) * (payableDays / totalMonthDays) * 100) / 100;
        }
        const otherEmployerContributions = Math.round(componentBreakdown.employerContributions
          .filter(component => !/pf|provident|esi|insurance/i.test(component.name))
          .reduce((sum, component) => sum + component.amount, 0) * (payableDays / totalMonthDays) * 100) / 100;
        const totalCtc = grossSalary + employerPf + employerEsi + otherEmployerContributions;
        const netSalary = Math.max(0, Math.round((grossSalary - totalDeductions) * 100) / 100);

        // Calculation Snapshot (Frozen History)
        const snapshot = {
          calculatedAt: new Date().toISOString(),
          employee: { id: emp.id, name: empName, code: emp.employeeCode || emp.employeeId, designation: emp.designation, department: emp.department },
          salaryAssignmentId: assignment.id,
          structureName: assignment.structure.structureName || assignment.structure.name,
          baseGross,
          periodDays: totalMonthDays,
          employeeMonthDays,
          payableDays,
          lopDays,
          overtimeHours: otHours,
          earnings: earningsSnapshot,
          deductions: deductionsSnapshot,
          grossSalary: Math.round(grossSalary * 100) / 100,
          totalDeductions: Math.round(totalDeductions * 100) / 100,
          netSalary,
          employerContributions: { pf: employerPf, esi: employerEsi, other: otherEmployerContributions },
          totalCtc: Math.round(totalCtc * 100) / 100
        };

        // Update PayrollItem
        payrollItem.grossSalary = Math.round(grossSalary * 100) / 100;
        payrollItem.totalAllowances = Math.round((grossSalary - basicProrated - otEarnings) * 100) / 100;
        payrollItem.totalDeductions = Math.round(totalDeductions * 100) / 100;
        payrollItem.netSalary = netSalary;
        payrollItem.employerPf = employerPf;
        payrollItem.employerEsi = employerEsi;
        payrollItem.totalCtc = Math.round(totalCtc * 100) / 100;
        await payrollItem.save({ transaction });

        // Update PayrollRecord
        payrollRecord.grossEarnings = Math.round(grossSalary * 100) / 100;
        payrollRecord.totalDeductions = Math.round(totalDeductions * 100) / 100;
        payrollRecord.netSalary = netSalary;
        payrollRecord.employerPf = employerPf;
        payrollRecord.employerEsi = employerEsi;
        payrollRecord.totalCtc = Math.round(totalCtc * 100) / 100;
        payrollRecord.calculationSnapshot = JSON.stringify(snapshot);
        await payrollRecord.save({ transaction });

        runTotalEarnings += payrollRecord.grossEarnings;
        runTotalDeductions += payrollRecord.totalDeductions;
        runTotalNetPay += payrollRecord.netSalary;
        processedCount++;
      }

      // Update PayrollRun header totals
      run.status = 'Calculated';
      run.totalEmployees = processedCount;
      run.totalEarnings = Math.round(runTotalEarnings * 100) / 100;
      run.totalDeductions = Math.round(runTotalDeductions * 100) / 100;
      run.totalNetPay = Math.round(runTotalNetPay * 100) / 100;
      await run.save({ transaction });

      await transaction.commit();
      await this.logPayrollAction(executorId, 'CALCULATE_PAYROLL', 'PayrollRun', runId, 'Success', null, {
        totalEmployees: processedCount,
        totalEarnings: run.totalEarnings,
        totalNetPay: run.totalNetPay
      });

      const details = await this.getPayrollRunDetails(runId);
      details.exceptions = exceptions;
      return details;

    } catch (err) {
      await transaction.rollback();
      await this.logPayrollAction(executorId, 'CALCULATE_PAYROLL', 'PayrollRun', runId, 'Failed', null, { error: err.message });
      throw err;
    }
  }

  /**
   * 5. Approve payroll run
   */
  async approvePayrollRun(runId, executorId) {
    const run = await PayrollRun.findByPk(runId);
    if (!run) {
      throw new ApiError(404, 'Payroll run not found.');
    }
    if (['Approved', 'Processed', 'Locked'].includes(run.status)) {
      throw new ApiError(400, `Payroll run is already ${run.status}.`);
    }

    const oldValues = { ...run.toJSON() };
    run.status = 'Approved';
    run.approvedBy = executorId;
    run.approvedAt = new Date();
    await run.save();

    await PayrollItem.update({ status: 'Approved' }, { where: { payrollRunId: runId } });
    await PayrollRecord.update({ status: 'Approved' }, { where: { payrollRunId: runId } });
    
    await this.logPayrollAction(executorId, 'APPROVE_PAYROLL_RUN', 'PayrollRun', runId, 'Success', oldValues, run.toJSON());
    return run;
  }

  /**
   * 6. Process payroll run (Creates immutable payslips, logs loan repayments, statutory records)
   */
  async processPayrollRun(runId, executorId) {
    const run = await PayrollRun.findByPk(runId);
    if (!run) {
      throw new ApiError(404, 'Payroll run not found.');
    }
    if (run.status !== 'Approved') {
      throw new ApiError(400, `Cannot process payroll runs in ${run.status} status. Approval is required first.`);
    }

    const monthStr = run.payrollMonth || run.month;
    const monthIndex = MONTH_MAP[monthStr];
    const year = parseInt(run.payrollYear || run.year);
    const startDateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
    const totalMonthDays = new Date(year, monthIndex + 1, 0).getDate();
    const endDateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(totalMonthDays).padStart(2, '0')}`;

    const transaction = await sequelize.transaction();
    try {
      const payrollRecords = await PayrollRecord.findAll({
        where: { payrollRunId: runId },
        include: [
          { model: PayrollEarning, as: 'recordEarnings' },
          { model: PayrollDeduction, as: 'recordDeductions' },
          { model: Employee, as: 'employeeDetails' }
        ],
        transaction
      });

      for (const record of payrollRecords) {
        const emp = record.employeeDetails || {};

        // Parse breakdown amounts
        const earningsObj = {};
        (record.recordEarnings || []).forEach(e => {
          earningsObj[(e.componentName || e.name).toLowerCase()] = parseFloat(e.amount);
        });

        const basicVal = earningsObj['basic'] || earningsObj['basic salary'] || 0;
        const hraVal = earningsObj['hra'] || earningsObj['house rent allowance'] || 0;
        const conveyanceVal = earningsObj['conveyance'] || earningsObj['conveyance allowance'] || 0;
        const medicalVal = earningsObj['medical'] || earningsObj['medical allowance'] || 0;
        const specialVal = earningsObj['special'] || earningsObj['special allowance'] || 0;
        const bonusVal = earningsObj['bonus'] || 0;
        const incentiveVal = earningsObj['incentive'] || 0;

        let otherAllowances = 0;
        (record.recordEarnings || []).forEach(e => {
          const lower = (e.componentName || e.name).toLowerCase();
          if (!['basic', 'basic salary', 'hra', 'house rent allowance', 'conveyance', 'conveyance allowance', 'medical', 'special', 'bonus', 'incentive'].includes(lower)) {
            otherAllowances += parseFloat(e.amount);
          }
        });

        let pfVal = 0;
        let esiVal = 0;
        let ptVal = 0;
        let tdsVal = 0;
        let loanVal = 0;

        (record.recordDeductions || []).forEach(d => {
          const lower = (d.deductionName || d.name).toLowerCase();
          if (lower.includes('pf') || lower.includes('provident')) {
            pfVal += parseFloat(d.amount);
          } else if (lower.includes('esi') || lower.includes('state insurance')) {
            esiVal += parseFloat(d.amount);
          } else if (lower.includes('pt') || lower.includes('professional tax')) {
            ptVal += parseFloat(d.amount);
          } else if (lower.includes('tds') || lower.includes('tax')) {
            tdsVal += parseFloat(d.amount);
          } else if (lower.includes('loan')) {
            loanVal += parseFloat(d.amount);
          }
        });

        const empCodeClean = (emp.employeeCode || emp.employeeId || record.employeeId.slice(0, 6)).replace(/[^a-zA-Z0-9]/g, '');
        const payslipNumber = `PS-${year}-${String(monthIndex + 1).padStart(2, '0')}-${empCodeClean}`;

        // Create immutable Payslip snapshot
        await Payslip.destroy({
          where: { employeeId: record.employeeId, month: monthStr, year },
          transaction
        });

        const payslip = await Payslip.create({
          payslipNumber,
          payrollRecordId: record.id,
          employeeId: record.employeeId,
          month: monthStr,
          year,
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
          grossSalary: record.grossEarnings,
          grossEarnings: record.grossEarnings,
          totalDeductions: record.totalDeductions,
          netSalary: record.netSalary,
          employerPf: record.employerPf,
          employerEsi: record.employerEsi,
          workingDays: totalMonthDays,
          paidDays: (parseFloat(record.attendanceDays) || 0) + (parseFloat(record.paidLeaveDays) || 0),
          payableDays: record.payableDays,
          lopDays: record.lossOfPayDays,
          status: 'Generated',
          generatedBy: executorId,
          generatedAt: new Date(),
          paymentDate: new Date(),
          paymentStatus: 'Paid',
          paymentMode: run.paymentMethod || 'Bank Transfer',
          filePath: `/api/finance/payslips/${record.id}/pdf`,
          pdfUrl: `/api/finance/payslips/${record.id}/pdf`
        }, { transaction });

        // Loan installment repayment execution
        if (loanVal > 0) {
          const activeLoan = await EmployeeLoan.findOne({
            where: { employeeId: record.employeeId, status: { [Op.in]: ['Approved', 'approved'] } },
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

            const currentBalance = parseFloat(activeLoan.outstandingBalance || 0);
            const remainingBalance = Math.max(0, currentBalance - loanVal);

            await LoanRepayment.create({
              employeeLoanId: activeLoan.id,
              loanId: activeLoan.id,
              payrollRecordId: record.id,
              emiScheduleId: emiSchedule ? emiSchedule.id : null,
              installmentNumber: (emiSchedule?.installmentNumber) || 1,
              dueAmount: emiSchedule ? emiSchedule.emiAmount : loanVal,
              paidAmount: loanVal,
              amount: loanVal,
              outstandingAfterPayment: remainingBalance,
              paymentDate: new Date(),
              paymentMode: 'Payroll Deduction',
              status: 'deducted',
              remarks: `Payroll deduction for ${monthStr} ${year}`
            }, { transaction });

            activeLoan.totalPaid = parseFloat(activeLoan.totalPaid || 0) + loanVal;
            activeLoan.outstandingBalance = remainingBalance;
            if (activeLoan.outstandingBalance <= 0) {
              activeLoan.status = 'Closed';
            }
            await activeLoan.save({ transaction });
          }
        }

        // ESI statutory record
        if (esiVal > 0) {
          await EsiContribution.create({
            employeeId: record.employeeId,
            payrollItemId: record.id,
            esiNumber: emp.esicNumber || emp.esiNumber || null,
            employeeContribution: esiVal,
            employerContribution: record.employerEsi || (parseFloat(record.grossEarnings) * 0.0325),
            grossWages: record.grossEarnings,
            month: monthStr,
            year,
            status: 'Filed'
          }, { transaction });
        }

        // PT statutory record
        if (ptVal > 0) {
          await ProfessionalTaxContribution.create({
            employeeId: record.employeeId,
            payrollItemId: record.id,
            state: emp.state || 'Madhya Pradesh',
            ptAmount: ptVal,
            month: monthStr,
            year,
            status: 'Filed'
          }, { transaction });
        }

        record.status = 'Processed';
        await record.save({ transaction });
      }

      await PayrollItem.update({ status: 'Processed' }, { where: { payrollRunId: runId }, transaction });

      run.status = 'Processed';
      run.processedBy = executorId;
      run.processedAt = new Date();
      run.paymentStatus = 'Paid';
      run.paymentDate = new Date();
      await run.save({ transaction });

      await transaction.commit();
      await this.logPayrollAction(executorId, 'PROCESS_PAYROLL_RUN', 'PayrollRun', runId, 'Success');
      return run;

    } catch (err) {
      await transaction.rollback();
      await this.logPayrollAction(executorId, 'PROCESS_PAYROLL_RUN', 'PayrollRun', runId, 'Failed', null, { error: err.message });
      throw err;
    }
  }

  /**
   * 7. Lock payroll run
   */
  async lockPayrollRun(runId, executorId) {
    const run = await PayrollRun.findByPk(runId);
    if (!run) {
      throw new ApiError(404, 'Payroll run not found.');
    }
    if (run.status !== 'Processed') {
      throw new ApiError(400, `Cannot lock payroll runs in status: ${run.status}. Needs to be Processed first.`);
    }

    const oldValues = { ...run.toJSON() };
    run.status = 'Locked';
    run.lockedBy = executorId;
    run.lockedAt = new Date();
    await run.save();

    await PayrollItem.update({ status: 'Locked' }, { where: { payrollRunId: runId } });
    await PayrollRecord.update({ status: 'Locked' }, { where: { payrollRunId: runId } });
    
    await this.logPayrollAction(executorId, 'LOCK_PAYROLL_RUN', 'PayrollRun', runId, 'Success', oldValues, run.toJSON());
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
    if (['Locked', 'Processed'].includes(run.status)) {
      throw new ApiError(400, `Cannot cancel a processed or locked payroll run.`);
    }

    const oldValues = { ...run.toJSON() };
    run.status = 'Cancelled';
    await run.save();

    await PayrollItem.update({ status: 'Cancelled' }, { where: { payrollRunId: runId } });
    await PayrollRecord.update({ status: 'Cancelled' }, { where: { payrollRunId: runId } });
    
    await this.logPayrollAction(executorId, 'CANCEL_PAYROLL_RUN', 'PayrollRun', runId, 'Success', oldValues, run.toJSON());
    return run;
  }

  /**
   * 9. Record payment transaction reference and method
   */
  async recordPayment(runId, payload, executorId) {
    const run = await PayrollRun.findByPk(runId, {
      include: [{ model: PayrollRecord, as: 'records' }]
    });
    if (!run) {
      throw new ApiError(404, 'Payroll run not found.');
    }

    const { paymentDate, paymentMethod = 'Bank Transfer (NEFT/RTGS)', paymentReference, paymentStatus = 'Paid' } = payload;
    run.paymentDate = paymentDate || new Date();
    run.paymentMethod = paymentMethod;
    run.paymentReference = paymentReference || null;
    run.paymentStatus = paymentStatus;
    await run.save();

    // Create individual disbursement records in payroll_payments
    const records = run.records || [];
    for (const rec of records) {
      await PayrollPayment.create({
        payrollRecordId: rec.id,
        payrollRunId: run.id,
        employeeId: rec.employeeId,
        paymentReference: paymentReference || `PAY-${run.payrollCode}-${rec.employeeId.slice(0, 6)}`,
        paymentMethod,
        amount: rec.netSalary,
        paymentDate: run.paymentDate,
        status: paymentStatus === 'Paid' ? 'successful' : 'pending',
        recordedBy: executorId
      }).catch(e => console.warn('Payment record warning:', e.message));
    }

    // Update payslips payment status
    await Payslip.update(
      {
        paymentStatus: paymentStatus === 'Paid' ? 'Paid' : 'Pending',
        paymentDate: run.paymentDate,
        paymentMode: run.paymentMethod
      },
      { where: { month: run.payrollMonth || run.month, year: run.payrollYear || run.year } }
    );

    await this.logPayrollAction(executorId, 'RECORD_PAYMENT', 'PayrollRun', runId, 'Success', null, payload);
    return run;
  }

  /**
   * 10. Generate bank payment statement / export instructions (NEFT/RTGS)
   */
  async exportBankPaymentInstructions(runId) {
    const run = await PayrollRun.findByPk(runId, {
      include: [
        {
          model: PayrollRecord,
          as: 'records',
          include: [{ model: Employee, as: 'employeeDetails' }]
        },
        {
          model: PayrollItem,
          as: 'items',
          include: [{ model: Employee, as: 'employee' }]
        }
      ]
    });

    if (!run) {
      throw new ApiError(404, 'Payroll run not found.');
    }

    let csvContent = 'Beneficiary Account No,Beneficiary Name,Amount,IFSC Code,Payment Mode,Reference Remarks,Employee Code\n';
    const list = run.records?.length ? run.records : (run.items || []);

    for (const item of list) {
      const emp = item.employeeDetails || item.employee || {};
      const profile = emp.profileData ? (typeof emp.profileData === 'object' ? emp.profileData : JSON.parse(emp.profileData || '{}')) : {};
      const accountNo = emp.accountNumber || profile.accountNumber || profile.bankAccount || '';
      const ifsc = emp.ifscCode || profile.ifscCode || profile.ifsc || '';
      const name = emp.employeeName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';
      const code = emp.employeeCode || emp.employeeId || '';
      const remarks = `Salary for ${run.payrollMonth || run.month} ${run.payrollYear || run.year}`;

      csvContent += `"${accountNo}","${name}",${item.netSalary},"${ifsc}","NEFT","${remarks}","${code}"\n`;
    }

    return csvContent;
  }

  /**
   * 11. Get enterprise payroll records
   */
  async getPayrollRecords(filters = {}) {
    const where = {};
    if (filters.payrollRunId) where.payrollRunId = filters.payrollRunId;
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.status) where.status = filters.status;

    return await PayrollRecord.findAll({
      where,
      include: [
        { model: Employee, as: 'employeeDetails' },
        { model: PayrollEarning, as: 'recordEarnings' },
        { model: PayrollDeduction, as: 'recordDeductions' },
        { model: Payslip, as: 'recordPayslip' }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  /**
   * 12. Get single payroll record by ID with snapshot
   */
  async getPayrollRecordById(id) {
    const record = await PayrollRecord.findByPk(id, {
      include: [
        { model: Employee, as: 'employeeDetails' },
        { model: PayrollRun, as: 'run' },
        { model: PayrollEarning, as: 'recordEarnings' },
        { model: PayrollDeduction, as: 'recordDeductions' },
        { model: Payslip, as: 'recordPayslip' },
        { model: PayrollPayment, as: 'payments' }
      ]
    });

    if (!record) {
      throw new ApiError(404, 'Payroll record not found.');
    }
    return record;
  }

  /**
   * 13. Get Payroll Audit Logs
   */
  async getPayrollAuditLogs(filters = {}) {
    const where = {};
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.action) where.action = filters.action;

    return await PayrollAuditLog.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: filters.limit ? parseInt(filters.limit) : 100
    });
  }

  /**
   * 14. Get Payroll Payments
   */
  async getPayrollPayments(filters = {}) {
    const where = {};
    if (filters.payrollRunId) where.payrollRunId = filters.payrollRunId;
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.status) where.status = filters.status;

    return await PayrollPayment.findAll({
      where,
      order: [['payment_date', 'DESC'], ['created_at', 'DESC']]
    });
  }
}

module.exports = new PayrollService();
