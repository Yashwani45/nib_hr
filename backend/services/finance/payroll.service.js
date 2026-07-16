// backend/services/finance/payroll.service.js
const payrollRepository = require('../../repositories/finance/payroll.repository');
const employeeRepository = require('../../repositories/core/employee.repository');
const { Salary } = require('../../models');
const ApiError = require('../../utils/apiError');

class PayrollService {
  async processMonthlyPayroll(employeeId, month, year, executorId) {
    const employee = await employeeRepository.findById(employeeId, [{ model: Salary, as: 'salary' }]);
    if (!employee) {
      throw new ApiError(404, 'Employee not found.');
    }

    if (!employee.salary) {
      throw new ApiError(400, 'Employee does not have an active salary structure assigned.');
    }

    const { basic, hra = 0, conveyance = 0, medical = 0, specialAllowance = 0, pfEmployee = 0, esi = 0, tax = 0 } = employee.salary;

    const basicSalary = parseFloat(basic);
    const allowances = parseFloat(hra) + parseFloat(conveyance) + parseFloat(medical) + parseFloat(specialAllowance);
    const deductions = parseFloat(pfEmployee) + parseFloat(esi) + parseFloat(tax);
    const netPay = basicSalary + allowances - deductions;

    const payload = {
      employeeId,
      month,
      year,
      basicSalary,
      allowances,
      deductions,
      netPay,
      status: 'Processed',
      createdBy: executorId,
    };

    return await payrollRepository.create(payload);
  }

  async getEmployeePayrolls(employeeId) {
    return await payrollRepository.findAll({
      where: { employeeId },
      order: [['year', 'DESC'], ['month', 'DESC']],
    });
  }
}

module.exports = new PayrollService();
