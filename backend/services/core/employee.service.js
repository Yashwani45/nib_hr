// backend/services/core/employee.service.js
const employeeRepository = require('../../repositories/core/employee.repository');
const ApiError = require('../../utils/apiError');
const { Op } = require('sequelize');

class EmployeeService {
  async createEmployee(data, executorId) {
    if (data.email) {
      const existing = await employeeRepository.findOne({ email: data.email });
      if (existing) {
        throw new ApiError(400, `Email ${data.email} is already assigned.`);
      }
    }

    const payload = {
      ...data,
      createdBy: executorId,
    };
    const employee = await employeeRepository.create(payload);

    // Auto-scaffold employee record inside Company/[Company]/[Department]/Employee/index.js
    try {
      const { scaffoldEmployeeRecord } = require('../../utils/companyFolderScaffolder');
      const deptName = data.departmentName || data.department || 'General';
      const companyCode = data.companyCode || 'NIB';
      scaffoldEmployeeRecord(companyCode, deptName, employee);
    } catch (scaffoldErr) {
      console.warn('[Employee Scaffold Notice]', scaffoldErr.message);
    }

    return employee;
  }

  async getEmployeeById(id) {
    const employee = await employeeRepository.findById(id, ['companyDetails', 'branchDetails', 'departmentDetails']);
    if (!employee) {
      throw new ApiError(404, 'Employee not found.');
    }
    return employee;
  }

  async updateEmployee(id, data, executorId) {
    const payload = {
      ...data,
      updatedBy: executorId,
    };
    const updated = await employeeRepository.update(id, payload);
    if (!updated) {
      throw new ApiError(404, 'Employee not found to update.');
    }
    return updated;
  }

  async deleteEmployee(id, executorId) {
    // Soft delete support with updatedBy audit track before deletion
    await employeeRepository.update(id, { deletedBy: executorId });
    const success = await employeeRepository.delete(id);
    if (!success) {
      throw new ApiError(404, 'Employee not found to delete.');
    }
    return true;
  }

  async getAllEmployees(options = {}) {
    const { page = 1, limit = 10, search = '', sortBy = 'id', sortOrder = 'DESC' } = options;
    const offset = (page - 1) * limit;

    const queryOptions = {
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [[sortBy, sortOrder]],
      where: {},
      include: ['departmentDetails', 'companyDetails'],
    };

    if (search) {
      queryOptions.where = {
        [Op.or]: [
          { employeeName: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { department: { [Op.like]: `%${search}%` } },
        ],
      };
    }

    return await employeeRepository.findAndCountAll(queryOptions);
  }
}

module.exports = new EmployeeService();
