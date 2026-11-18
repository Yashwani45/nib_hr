const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'services', 'core', 'employee.service.js');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

const oldGet = `  async getEmployeeById(id) {
    const employee = await employeeRepository.findById(id, ['companyDetails', 'branchDetails', 'departmentDetails']);
    if (!employee) {
      throw new ApiError(404, 'Employee not found.');
    }
    return employee;
  }`;

const newGet = `  async getEmployeeById(id, requestingUser = null) {
    const employee = await employeeRepository.findById(id, ['companyDetails', 'branchDetails', 'departmentDetails']);
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
  }`;

const oldUpdate = `  async updateEmployee(id, data, executorId) {
    const payload = {
      ...data,
      updatedBy: executorId,
    };
    const updated = await employeeRepository.update(id, payload);
    if (!updated) {
      throw new ApiError(404, 'Employee not found to update.');
    }
    return updated;
  }`;

const newUpdate = `  async updateEmployee(id, data, executorUser) {
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
  }`;

if (content.includes(oldGet) && content.includes(oldUpdate)) {
  content = content.replace(oldGet, newGet).replace(oldUpdate, newUpdate);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated employee.service.js with IDOR protection and field masking.');
} else {
  console.error('Could not locate old methods in employee.service.js');
}
process.exit(0);
