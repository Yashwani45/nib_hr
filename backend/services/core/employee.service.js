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

    // Auto-generate tamper-proof Employee QR attendance badge
    try {
      const employeeQrService = require('../operations/employeeQr.service');
      const companyCode = data.companyCode || data.company || 'NIB';
      await employeeQrService.generateEmployeeQr(employee.id, companyCode, { id: executorId });
    } catch (qrErr) {
      console.warn('[Employee QR Auto-Generate Notice]', qrErr.message);
    }

    return employee;
  }

  async getEmployeeById(id, requestingUser = null) {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      throw new ApiError(404, 'Employee not found.');
    }

    if (requestingUser) {
      const roleName = String(
        requestingUser.role?.roleName || 
        requestingUser.role?.name || 
        (typeof requestingUser.role === 'string' ? requestingUser.role : '') || 
        ''
      ).trim();

      const isElevated = ['Admin', 'SuperAdmin', 'DepartmentHR', 'HR', 'Finance', 'Payroll Approver'].includes(roleName);
      const isSelf = (requestingUser.employee?.id === employee.id || requestingUser.id === employee.userId || requestingUser.id === employee.id || requestingUser.email === employee.email);

      // If regular employee viewing another employee, mask sensitive financial/bank/statutory fields
      if (!isElevated && !isSelf) {
        const empJson = employee.toJSON ? employee.toJSON() : { ...employee };
        delete empJson.accountNumber;
        delete empJson.ifscCode;
        delete empJson.bankName;
        delete empJson.panNumber;
        delete empJson.uanNumber;
        delete empJson.esiNumber;
        delete empJson.aadhaarNumber;
        delete empJson.basicSalary;
        delete empJson.salary;
        delete empJson.password;
        if (empJson.profileData) {
          try {
            const p = typeof empJson.profileData === 'string' ? JSON.parse(empJson.profileData) : { ...empJson.profileData };
            delete p.accountNumber;
            delete p.ifscCode;
            delete p.panNumber;
            delete p.uanNumber;
            delete p.esiNumber;
            delete p.aadhaarNumber;
            delete p.salary;
            empJson.profileData = typeof empJson.profileData === 'string' ? JSON.stringify(p) : p;
          } catch (e) {}
        }
        return empJson;
      }
    }

    return employee;
  }

  async updateEmployee(id, data, executorUser) {
    const executorId = typeof executorUser === 'object' ? executorUser?.id : executorUser;
    
    // RBAC & IDOR check if executor is a regular Employee
    if (executorUser && typeof executorUser === 'object') {
      const roleName = String(
        executorUser.role?.roleName || 
        executorUser.role?.name || 
        (typeof executorUser.role === 'string' ? executorUser.role : '') || 
        ''
      ).trim();

      const isElevated = ['Admin', 'SuperAdmin', 'DepartmentHR', 'HR'].includes(roleName);
      if (!isElevated) {
        const isSelf = (executorUser.employee?.id === id || executorUser.id === id);
        if (!isSelf) {
          throw new ApiError(403, 'Access denied: Employees can only modify their own profile.');
        }
        // Disallow self-modification of privilege, department, or compensation fields
        delete data.roleId;
        delete data.role;
        delete data.department;
        delete data.departmentId;
        delete data.basicSalary;
        delete data.salary;
        delete data.employeeStatus;
        delete data.status;
      }
    }

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
      include: [],
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

    if (options.branchId && String(options.branchId).toUpperCase() !== 'ALL') {
      const branchConditions = [{ branchName: options.branchName || options.branchId }];
      if (options.branchId) {
        branchConditions.push({ branchId: options.branchId });
      }
      queryOptions.where[Op.and] = queryOptions.where[Op.and] || [];
      queryOptions.where[Op.and].push({ [Op.or]: branchConditions });
    }

    return await employeeRepository.findAndCountAll(queryOptions);
  }
}

module.exports = new EmployeeService();
