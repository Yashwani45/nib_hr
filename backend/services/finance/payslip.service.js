// backend/services/finance/payslip.service.js
const { sequelize, Payslip, Employee, User, Department, Designation, Company } = require('../../models');
const ApiError = require('../../utils/apiError');
const auditLogService = require('../core/auditLog.service');
const { Op } = require('sequelize');

// Helper to convert number to Indian currency words
function numberToWords(num) {
  if (!num || isNaN(num) || num === 0) return 'Zero Rupees Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = ('000000000' + Math.floor(num)).substr(-9);
  let str = '';
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = Math.floor((num % 1000) / 100);
  const tens = Math.floor(num % 100);

  if (crore > 0) str += (a[crore] || `${b[Math.floor(crore / 10)]} ${a[crore % 10]}`) + 'Crore ';
  if (lakh > 0) str += (a[lakh] || `${b[Math.floor(lakh / 10)]} ${a[lakh % 10]}`) + 'Lakh ';
  if (thousand > 0) str += (a[thousand] || `${b[Math.floor(thousand / 10)]} ${a[thousand % 10]}`) + 'Thousand ';
  if (hundred > 0) str += a[hundred] + 'Hundred ';
  if (tens > 0) {
    if (tens < 20) str += a[tens];
    else str += b[Math.floor(tens / 10)] + ' ' + a[tens % 10];
  }

  return `${str.trim()} Rupees Only`;
}

// Helper to mask sensitive strings like bank accounts and PANs
function maskString(str, visibleChars = 4) {
  if (!str) return '••••';
  const clean = String(str).trim();
  if (clean.length <= visibleChars) return clean;
  const maskedPart = '•'.repeat(Math.max(4, clean.length - visibleChars));
  return `${maskedPart} ${clean.slice(-visibleChars)}`;
}

class PayslipService {
  /**
   * Helper to verify if user has access to a specific employee's records
   */
  async verifyEmployeeAccess(currentUser, targetEmployeeId) {
    const roleName = String(
      currentUser.role?.roleName || 
      currentUser.role?.name || 
      (typeof currentUser.role === 'string' ? currentUser.role : '') || 
      ''
    ).trim();

    // Admins and SuperAdmins have system-wide access
    if (['Admin', 'SuperAdmin', 'DepartmentHR', 'HR'].includes(roleName)) {
      return true;
    }

    // Resolve current user's employee profile
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
      throw new ApiError(403, 'Access denied: No employee record associated with your user account.');
    }

    if (roleName === 'Employee') {
      if (currentEmp.id !== targetEmployeeId) {
        throw new ApiError(403, 'Access denied: Employees can only access their own payslips.');
      }
      return true;
    }

    if (roleName === 'Manager') {
      if (currentEmp.id === targetEmployeeId) return true;
      const targetEmp = await Employee.findByPk(targetEmployeeId);
      if (targetEmp && (targetEmp.manager_id === currentEmp.id || targetEmp.department === currentEmp.department)) {
        return true;
      }
      throw new ApiError(403, 'Access denied: Managers can only view their direct team payslips.');
    }

    throw new ApiError(403, 'Access denied: Insufficient permissions.');
  }

  /**
   * Fetch payslips with role-based filtering
   */
  async getPayslips(filters = {}, currentUser) {
    const { employeeId, month, year, department, status } = filters;
    const roleName = String(currentUser.role?.roleName || currentUser.role?.name || 'Employee').trim();

    const where = {};
    if (month) where.month = month;
    if (year) where.year = parseInt(year);
    if (status) where.paymentStatus = status;

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
        throw new ApiError(403, 'No employee record linked to user account.');
      }
      where.employeeId = currentEmp.id;
    } else if (roleName === 'Manager') {
      if (!currentEmp) {
        throw new ApiError(403, 'No employee record linked to user account.');
      }
      if (employeeId) {
        await this.verifyEmployeeAccess(currentUser, employeeId);
        where.employeeId = employeeId;
      } else {
        const teamEmployees = await Employee.findAll({
          where: {
            [Op.or]: [
              { id: currentEmp.id },
              { manager_id: currentEmp.id },
              { department: currentEmp.department }
            ]
          }
        });
        where.employeeId = { [Op.in]: teamEmployees.map(e => e.id) };
      }
    } else {
      // HR/Admin: Filter by employeeId or department if requested
      if (employeeId) {
        where.employeeId = employeeId;
      } else if (department) {
        const deptEmployees = await Employee.findAll({ where: { department } });
        where.employeeId = { [Op.in]: deptEmployees.map(e => e.id) };
      }
    }

    return await Payslip.findAll({
      where,
      include: [{ model: Employee, as: 'employee' }],
      order: [
        ['year', 'DESC'],
        [sequelize.literal(`FIELD(month, 'December', 'November', 'October', 'September', 'August', 'July', 'June', 'May', 'April', 'March', 'February', 'January')`), 'ASC'],
        ['created_at', 'DESC']
      ]
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
   * Generate professional printable / downloadable PDF HTML document
   */
  async getPayslipPdf(id, currentUser) {
    const payslip = await Payslip.findByPk(id, {
      include: [{ model: Employee, as: 'employee' }]
    });
    if (!payslip) {
      throw new ApiError(404, 'Payslip not found.');
    }

    await this.verifyEmployeeAccess(currentUser, payslip.employeeId);

    // Audit download
    await auditLogService.log({
      userId: currentUser.id,
      username: currentUser.email,
      roleName: currentUser.role?.roleName || 'User',
      actionType: 'Download',
      moduleName: 'Payslip',
      recordId: id,
      status: 'Success'
    });

    const emp = payslip.employee || {};
    const profile = emp.profileData ? (typeof emp.profileData === 'object' ? emp.profileData : JSON.parse(emp.profileData || '{}')) : {};

    const companyName = emp.company || 'Technovani HRMS';
    const empName = emp.employeeName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';
    const empCode = emp.employeeCode || emp.employeeId || '--';
    const designation = emp.designation || profile.designation || '--';
    const department = emp.department || profile.department || '--';
    const joiningDate = emp.dateOfJoining || profile.dateOfJoining || '--';
    const bankAccount = maskString(emp.accountNumber || profile.accountNumber || profile.bankAccount);
    const ifsc = emp.ifscCode || profile.ifscCode || profile.ifsc || '--';
    const pan = maskString(emp.panNumber || profile.panNumber || profile.pan);
    const uan = maskString(emp.uanNumber || profile.uanNumber || profile.uan);
    const esic = maskString(emp.esicNumber || profile.esicNumber || profile.esiNumber);

    const netSalaryVal = parseFloat(payslip.netSalary) || 0;
    const netInWords = numberToWords(netSalaryVal);

    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Payslip - ${empName} - ${payslip.month} ${payslip.year}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
            body { background: #f8fafc; color: #1e293b; padding: 24px; font-size: 13px; line-height: 1.5; }
            .payslip-container { max-width: 820px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
            
            /* Header */
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 24px; }
            .org-title { font-size: 22px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
            .org-address { font-size: 11px; color: #64748b; margin-top: 4px; line-height: 1.4; }
            .payslip-badge { background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; padding: 6px 14px; border-radius: 8px; text-align: right; }
            .payslip-badge h3 { font-size: 14px; font-weight: 700; }
            .payslip-badge p { font-size: 11px; color: #3b82f6; font-weight: 600; margin-top: 2px; }

            /* Employee Details Grid */
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
            .meta-item { display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px; }
            .meta-label { color: #64748b; font-weight: 600; }
            .meta-value { color: #0f172a; font-weight: 700; }

            /* Attendance summary strip */
            .attendance-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background: #f1f5f9; border-radius: 8px; padding: 12px; text-align: center; margin-bottom: 24px; }
            .att-box span { display: block; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; }
            .att-box strong { font-size: 16px; font-weight: 800; color: #0f172a; }

            /* Financials Breakdown Table */
            .salary-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            .salary-table th { background: #f1f5f9; color: #475569; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 14px; border: 1px solid #e2e8f0; }
            .salary-table td { padding: 8px 14px; border: 1px solid #e2e8f0; font-size: 12px; }
            .amount { text-align: right; font-variant-numeric: tabular-nums; }
            .total-row { font-weight: 800; background: #f8fafc; border-top: 2px solid #cbd5e1; }

            /* Net Pay Banner */
            .net-pay-banner { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: #ffffff; border-radius: 8px; padding: 18px 24px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
            .net-pay-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; opacity: 0.9; }
            .net-pay-words { font-size: 12px; margin-top: 4px; opacity: 0.95; font-style: italic; }
            .net-pay-val { font-size: 26px; font-weight: 900; }

            /* Employer Cost Section */
            .employer-section { background: #faf5ff; border: 1px dashed #d8b4fe; border-radius: 8px; padding: 14px; margin-bottom: 24px; font-size: 11px; }
            .employer-section h4 { color: #6b21a8; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; }
            .employer-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }

            /* Footer & Signatures */
            .footer { border-top: 1px solid #e2e8f0; padding-top: 24px; display: flex; justify-content: space-between; align-items: flex-end; margin-top: 32px; }
            .notes { font-size: 10px; color: #94a3b8; max-width: 440px; }
            .signature-box { text-align: center; font-size: 11px; color: #64748b; font-weight: 600; border-top: 1px dashed #cbd5e1; padding-top: 8px; width: 160px; }

            /* Print Controls */
            .no-print { text-align: center; margin-bottom: 20px; }
            .print-btn { background: #2563eb; color: #fff; border: none; padding: 10px 24px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .print-btn:hover { background: #1d4ed8; }

            @media print {
              body { background: #fff; padding: 0; }
              .payslip-container { border: none; box-shadow: none; padding: 0; max-width: 100%; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="no-print">
            <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
          </div>

          <div class="payslip-container">
            <!-- Header -->
            <div class="header">
              <div>
                <div class="org-title">${companyName}</div>
                <div class="org-address">Registered Office: Industrial Area, Okhla Phase III, New Delhi 110020<br>Corporate HRMS & Payroll Division</div>
              </div>
              <div class="payslip-badge">
                <h3>SALARY SLIP</h3>
                <p>${payslip.month.toUpperCase()} ${payslip.year}</p>
              </div>
            </div>

            <!-- Employee & Job Metadata -->
            <div class="meta-grid">
              <div>
                <div class="meta-item"><span class="meta-label">Employee Name:</span> <span class="meta-value">${empName}</span></div>
                <div class="meta-item"><span class="meta-label">Employee Code:</span> <span class="meta-value">${empCode}</span></div>
                <div class="meta-item"><span class="meta-label">Department:</span> <span class="meta-value">${department}</span></div>
                <div class="meta-item"><span class="meta-label">Designation:</span> <span class="meta-value">${designation}</span></div>
                <div class="meta-item"><span class="meta-label">Date of Joining:</span> <span class="meta-value">${joiningDate}</span></div>
              </div>
              <div>
                <div class="meta-item"><span class="meta-label">Payslip No:</span> <span class="meta-value">${payslip.payslipNumber || '--'}</span></div>
                <div class="meta-item"><span class="meta-label">Bank Account:</span> <span class="meta-value">${bankAccount}</span></div>
                <div class="meta-item"><span class="meta-label">Bank IFSC:</span> <span class="meta-value">${ifsc}</span></div>
                <div class="meta-item"><span class="meta-label">PAN Number:</span> <span class="meta-value">${pan}</span></div>
                <div class="meta-item"><span class="meta-label">PF UAN / ESIC:</span> <span class="meta-value">${uan} / ${esic}</span></div>
              </div>
            </div>

            <!-- Attendance Snapshot -->
            <div class="attendance-bar">
              <div class="att-box"><span>Calendar Days</span><strong>${payslip.workingDays || 30}</strong></div>
              <div class="att-box"><span>Paid Days</span><strong>${payslip.paidDays || 30}</strong></div>
              <div class="att-box"><span>LOP Days</span><strong>${payslip.lopDays || 0}</strong></div>
              <div class="att-box"><span>Payment Mode</span><strong>${payslip.paymentMode || 'NEFT'}</strong></div>
            </div>

            <!-- Earnings vs Deductions Table -->
            <table class="salary-table">
              <thead>
                <tr>
                  <th style="width: 32%;">Earnings Component</th>
                  <th style="width: 18%;" class="amount">Amount (₹)</th>
                  <th style="width: 32%;">Deductions Component</th>
                  <th style="width: 18%;" class="amount">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Basic Salary</td>
                  <td class="amount">${Number(payslip.basic || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td>Provident Fund (PF)</td>
                  <td class="amount">${Number(payslip.pf || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td>House Rent Allowance (HRA)</td>
                  <td class="amount">${Number(payslip.hra || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td>Employee State Insurance (ESI)</td>
                  <td class="amount">${Number(payslip.esi || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td>Conveyance Allowance</td>
                  <td class="amount">${Number(payslip.conveyance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td>Professional Tax (PT)</td>
                  <td class="amount">${Number(payslip.pt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td>Medical Allowance</td>
                  <td class="amount">${Number(payslip.medical || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td>Income Tax (TDS)</td>
                  <td class="amount">${Number(payslip.tds || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td>Special Allowance</td>
                  <td class="amount">${Number(payslip.special || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td>Loan / Advance Recovery</td>
                  <td class="amount">${Number(payslip.loanDeduction || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td>Other Allowances / Bonus</td>
                  <td class="amount">${Number((parseFloat(payslip.otherAllowances || 0) + parseFloat(payslip.bonus || 0) + parseFloat(payslip.incentive || 0))).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td>-</td>
                  <td class="amount">-</td>
                </tr>
                <tr class="total-row">
                  <td>Total Gross Earnings</td>
                  <td class="amount">₹${Number(payslip.grossSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td>Total Deductions</td>
                  <td class="amount">₹${Number(payslip.totalDeductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>

            <!-- Net Pay Box -->
            <div class="net-pay-banner">
              <div>
                <div class="net-pay-label">Net Take-Home Salary</div>
                <div class="net-pay-words">${netInWords}</div>
              </div>
              <div class="net-pay-val">₹${Number(netSalaryVal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>

            <!-- Employer Contributions / Total CTC -->
            <div class="employer-section">
              <h4>Employer Contributions (Not Deducted From Net Pay)</h4>
              <div class="employer-grid">
                <div><span>Employer PF (12%):</span> <strong>₹${Number(payslip.employerPf || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
                <div><span>Employer ESI (3.25%):</span> <strong>₹${Number(payslip.employerEsi || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
                <div><span>Total Monthly Cost to Company:</span> <strong>₹${Number((parseFloat(payslip.grossSalary || 0) + parseFloat(payslip.employerPf || 0) + parseFloat(payslip.employerEsi || 0))).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <div class="notes">
                * Note: This is a system-generated document authorized by Technovani HRMS. No physical signature is required. For inquiries, contact HR Payroll Division.
              </div>
              <div class="signature-box">
                Authorized Signatory<br>
                <span>Finance & Payroll</span>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    return htmlTemplate;
  }
}

module.exports = new PayslipService();
