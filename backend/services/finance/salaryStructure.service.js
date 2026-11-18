// backend/services/finance/salaryStructure.service.js
const {
  SalaryStructure,
  SalaryComponent,
  EmployeeSalaryAssignment,
  Employee,
  Department,
  Designation,
  User,
  sequelize
} = require('../../models');
const { tenantStorage } = require('../../config/database');
const ApiError = require('../../utils/apiError');
const auditLogService = require('../core/auditLog.service');
const { Op } = require('sequelize');

const salarySchemaReady = new WeakMap();

const ensureTableColumns = async (db, tableName, columns) => {
  const [existingColumns] = await db.query(`SHOW COLUMNS FROM \`${tableName}\``);
  const existingNames = new Set(existingColumns.map(column => column.Field));

  for (const [columnName, definition] of columns) {
    if (!existingNames.has(columnName)) {
      await db.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`);
    }
  }
};

const ensureSalarySchema = async () => {
  const db = tenantStorage.getStore() || sequelize;
  let migration = salarySchemaReady.get(db);
  if (!migration) {
    migration = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS salary_structures (
          id CHAR(36) NOT NULL PRIMARY KEY,
          structure_name VARCHAR(150) NULL,
          name VARCHAR(150) NOT NULL,
          description TEXT NULL,
          pay_frequency VARCHAR(50) NOT NULL DEFAULT 'Monthly',
          currency VARCHAR(10) NOT NULL DEFAULT 'INR',
          department_id CHAR(36) NULL,
          designation_id CHAR(36) NULL,
          grade VARCHAR(50) NULL,
          employment_category VARCHAR(50) NOT NULL DEFAULT 'Full-Time',
          created_by VARCHAR(255) NULL,
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          deleted_at DATETIME NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      await ensureTableColumns(db, 'salary_structures', [
        ['structure_name', 'VARCHAR(150) NULL'],
        ['name', 'VARCHAR(150) NULL'],
        ['description', 'TEXT NULL'],
        ['pay_frequency', "VARCHAR(50) NOT NULL DEFAULT 'Monthly'"],
        ['currency', "VARCHAR(10) NOT NULL DEFAULT 'INR'"],
        ['created_by', 'VARCHAR(255) NULL'],
        ['department_id', 'CHAR(36) NULL'],
        ['designation_id', 'CHAR(36) NULL'],
        ['department_ids', 'JSON NULL'],
        ['designation_ids', 'JSON NULL'],
        ['grade', 'VARCHAR(50) NULL'],
        ['reference_salary_type', "VARCHAR(50) NOT NULL DEFAULT 'Monthly Gross'"],
        ['effective_from', 'DATE NULL'],
        ['effective_to', 'DATE NULL'],
        ['employment_category', "VARCHAR(50) NOT NULL DEFAULT 'Full-Time'"],
        ['is_active', 'TINYINT(1) NOT NULL DEFAULT 1'],
        ['created_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP'],
        ['updated_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'],
        ['deleted_at', 'DATETIME NULL']
      ]);
      await db.query("UPDATE salary_structures SET name = structure_name WHERE (name IS NULL OR name = '') AND structure_name IS NOT NULL");

      await db.query(`
        CREATE TABLE IF NOT EXISTS salary_components (
          id CHAR(36) NOT NULL PRIMARY KEY,
          salary_structure_id CHAR(36) NOT NULL,
          component_code VARCHAR(100) NULL,
          component_name VARCHAR(100) NULL,
          name VARCHAR(100) NOT NULL,
          component_type ENUM('Earning', 'Deduction') NULL,
          type ENUM('Earning', 'Deduction') NOT NULL,
          calculation_type ENUM('Fixed', 'Percentage') NOT NULL DEFAULT 'Fixed',
          amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          value DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          percentage_base VARCHAR(100) NULL,
          reference_component VARCHAR(100) NULL,
          is_taxable TINYINT(1) NOT NULL DEFAULT 1,
          is_statutory TINYINT(1) NOT NULL DEFAULT 0,
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          deleted_at DATETIME NULL,
          INDEX idx_struct_id (salary_structure_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      await ensureTableColumns(db, 'salary_components', [
        ['salary_structure_id', 'CHAR(36) NULL'],
        ['component_code', 'VARCHAR(100) NULL'],
        ['component_name', 'VARCHAR(100) NULL'],
        ['name', 'VARCHAR(100) NULL'],
        ['component_type', "ENUM('Earning', 'Deduction') NULL"],
        ['component_category', "VARCHAR(50) NOT NULL DEFAULT 'Earning'"],
        ['type', "ENUM('Earning', 'Deduction') NULL"],
        ['calculation_type', "ENUM('Fixed', 'Percentage') NOT NULL DEFAULT 'Fixed'"],
        ['calculation_base', 'VARCHAR(100) NULL'],
        ['formula', 'VARCHAR(500) NULL'],
        ['frequency', "VARCHAR(20) NOT NULL DEFAULT 'Monthly'"],
        ['amount', 'DECIMAL(12, 2) NOT NULL DEFAULT 0.00'],
        ['value', 'DECIMAL(12, 2) NOT NULL DEFAULT 0.00'],
        ['percentage_base', 'VARCHAR(100) NULL'],
        ['reference_component', 'VARCHAR(100) NULL'],
        ['minimum_amount', 'DECIMAL(12, 2) NULL'],
        ['maximum_amount', 'DECIMAL(12, 2) NULL'],
        ['eligibility_condition', 'TEXT NULL'],
        ['is_taxable', 'TINYINT(1) NOT NULL DEFAULT 1'],
        ['is_statutory', 'TINYINT(1) NOT NULL DEFAULT 0'],
        ['is_active', 'TINYINT(1) NOT NULL DEFAULT 1'],
        ['display_order', 'INT NOT NULL DEFAULT 0'],
        ['created_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP'],
        ['updated_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'],
        ['deleted_at', 'DATETIME NULL']
      ]);
      await db.query("ALTER TABLE salary_components MODIFY COLUMN calculation_type ENUM('Fixed', 'Percentage', 'Formula') NOT NULL DEFAULT 'Fixed'");
      await db.query("UPDATE salary_components SET name = component_name WHERE (name IS NULL OR name = '') AND component_name IS NOT NULL");
      await db.query("UPDATE salary_components SET type = component_type WHERE type IS NULL AND component_type IS NOT NULL");
      await db.query("UPDATE salary_components SET component_category = CASE WHEN type = 'Deduction' THEN 'Employee Deduction' ELSE component_category END WHERE component_category IS NULL OR component_category = '' OR (component_category = 'Earning' AND type = 'Deduction')");

      await db.query(`
        CREATE TABLE IF NOT EXISTS employee_salary_assignments (
          id CHAR(36) NOT NULL PRIMARY KEY,
          employee_id VARCHAR(255) NOT NULL,
          salary_structure_id CHAR(36) NOT NULL,
          effective_from DATE NOT NULL,
          effective_to DATE NULL,
          gross_salary DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          base_gross DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          annual_ctc DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          ctc DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          status VARCHAR(50) NOT NULL DEFAULT 'Active',
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          created_by VARCHAR(255) NULL,
          approved_by VARCHAR(255) NULL,
          revision_reason TEXT NULL,
          approval_status VARCHAR(50) NOT NULL DEFAULT 'Approved',
          component_overrides JSON NULL,
          salary_breakdown JSON NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          deleted_at DATETIME NULL,
          INDEX idx_emp_id (employee_id),
          INDEX idx_struct_id (salary_structure_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      await ensureTableColumns(db, 'employee_salary_assignments', [
        ['employee_id', 'VARCHAR(255) NOT NULL'],
        ['salary_structure_id', 'CHAR(36) NOT NULL'],
        ['effective_from', 'DATE NULL'],
        ['effective_to', 'DATE NULL'],
        ['gross_salary', 'DECIMAL(12, 2) NOT NULL DEFAULT 0.00'],
        ['base_gross', 'DECIMAL(12, 2) NOT NULL DEFAULT 0.00'],
        ['annual_ctc', 'DECIMAL(12, 2) NOT NULL DEFAULT 0.00'],
        ['ctc', 'DECIMAL(12, 2) NOT NULL DEFAULT 0.00'],
        ['status', "VARCHAR(50) NOT NULL DEFAULT 'Active'"],
        ['is_active', 'TINYINT(1) NOT NULL DEFAULT 1'],
        ['created_by', 'VARCHAR(255) NULL'],
        ['approved_by', 'VARCHAR(255) NULL'],
        ['revision_reason', 'TEXT NULL'],
        ['approval_status', "VARCHAR(50) NOT NULL DEFAULT 'Approved'"],
        ['component_overrides', 'JSON NULL'],
        ['salary_breakdown', 'JSON NULL'],
        ['created_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP'],
        ['updated_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'],
        ['deleted_at', 'DATETIME NULL']
      ]);
    })();

    salarySchemaReady.set(db, migration);
    migration.catch(() => salarySchemaReady.delete(db));
  }

  await migration;
};

const normalizeReference = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const isValidDateOnly = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};
const parseScopeIds = value => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [value];
};

const serializeEligibilityCondition = condition => {
  if (!condition) return null;
  const parsed = typeof condition === 'string' ? JSON.parse(condition) : condition;
  return JSON.stringify(parsed);
};

const evaluateFormula = (formula, values) => {
  const tokens = String(formula || '').match(/\d+(?:\.\d+)?|[A-Za-z_][A-Za-z0-9_]*|[()+\-*/]/g) || [];
  if (!tokens.length || tokens.join('') !== String(formula).replace(/\s+/g, '')) {
    throw new Error('Formula contains unsupported characters or syntax.');
  }

  let index = 0;
  const parseExpression = () => {
    let result = parseTerm();
    while (tokens[index] === '+' || tokens[index] === '-') {
      const operator = tokens[index++];
      const right = parseTerm();
      result = operator === '+' ? result + right : result - right;
    }
    return result;
  };
  const parseTerm = () => {
    let result = parseFactor();
    while (tokens[index] === '*' || tokens[index] === '/') {
      const operator = tokens[index++];
      const right = parseFactor();
      if (operator === '/' && right === 0) throw new Error('Formula cannot divide by zero.');
      result = operator === '*' ? result * right : result / right;
    }
    return result;
  };
  const parseFactor = () => {
    const token = tokens[index++];
    if (token === '+' || token === '-') {
      const value = parseFactor();
      return token === '-' ? -value : value;
    }
    if (token === '(') {
      const value = parseExpression();
      if (tokens[index++] !== ')') throw new Error('Formula has unbalanced parentheses.');
      return value;
    }
    if (/^\d/.test(token || '')) return Number(token);
    if (/^[A-Za-z_]/.test(token || '')) {
      const key = normalizeReference(token);
      if (!Object.prototype.hasOwnProperty.call(values, key)) {
        throw new Error(`Formula references unknown component "${token}".`);
      }
      return values[key];
    }
    throw new Error('Formula is incomplete or invalid.');
  };

  const result = parseExpression();
  if (index !== tokens.length || !Number.isFinite(result)) {
    throw new Error('Formula is incomplete or produced an invalid amount.');
  }
  return result;
};

const validateSalaryComponents = components => {
  if (!Array.isArray(components)) {
    throw new ApiError(400, 'Salary components must be provided as an array.');
  }
  const allowedCategories = new Set(['Earning', 'Employee Deduction', 'Employer Contribution']);
  const allowedCalculations = new Set(['Fixed', 'Percentage', 'Formula']);
  const allowedFrequencies = new Set(['Monthly', 'Annual']);
  const referenceValues = {};
  const codes = new Set();
  for (const component of components) {
    const name = String(component.name || '').trim();
    const code = normalizeReference(component.code || name);
    if (!name) throw new ApiError(400, 'All components must have a valid name.');
    if (codes.has(code)) throw new ApiError(400, `Component code/name "${component.code || name}" must be unique.`);
    codes.add(code);
    if (!allowedCategories.has(component.category || (component.type === 'Deduction' ? 'Employee Deduction' : 'Earning'))) {
      throw new ApiError(400, `${name}: unsupported component category.`);
    }
    if (!allowedCalculations.has(component.calculationType || 'Percentage')) {
      throw new ApiError(400, `${name}: unsupported calculation type.`);
    }
    if (!allowedFrequencies.has(component.frequency || 'Monthly')) {
      throw new ApiError(400, `${name}: unsupported frequency.`);
    }
    const calculationType = component.calculationType || 'Percentage';
    if (calculationType !== 'Formula') {
      const value = Number(component.value);
      if (!Number.isFinite(value) || value < 0) {
        throw new ApiError(400, `${name}: value must be a non-negative number.`);
      }
    } else if (!component.formula || !String(component.formula).trim()) {
      throw new ApiError(400, `${name}: formula is required.`);
    }
    const minimum = component.minimumAmount == null || component.minimumAmount === '' ? null : Number(component.minimumAmount);
    const maximum = component.maximumAmount == null || component.maximumAmount === '' ? null : Number(component.maximumAmount);
    if ((minimum !== null && (!Number.isFinite(minimum) || minimum < 0)) ||
      (maximum !== null && (!Number.isFinite(maximum) || maximum < 0)) ||
      (minimum !== null && maximum !== null && minimum > maximum)) {
      throw new ApiError(400, `${name}: minimum/maximum amounts are invalid.`);
    }
    if (component.eligibilityCondition) {
      try {
        const condition = typeof component.eligibilityCondition === 'string'
          ? JSON.parse(component.eligibilityCondition)
          : component.eligibilityCondition;
        if (!condition || Array.isArray(condition) || typeof condition !== 'object') {
          throw new Error('Eligibility condition must be a JSON object.');
        }
      } catch (error) {
        throw new ApiError(400, `${name}: ${error.message}`);
      }
    }
    referenceValues[code] = 1;
    referenceValues[normalizeReference(name)] = 1;
  }
  Object.assign(referenceValues, {
    gross: 1,
    grosssalary: 1,
    grossearnings: 1,
    eligiblewages: 1,
    basic: 1
  });
  for (const component of components.filter(item => item.calculationType === 'Formula')) {
    try {
      evaluateFormula(component.formula, referenceValues);
    } catch (error) {
      throw new ApiError(400, `${component.name}: ${error.message}`);
    }
  }

  const componentByReference = new Map();
  for (const component of components) {
    componentByReference.set(normalizeReference(component.name), component);
    if (component.code) componentByReference.set(normalizeReference(component.code), component);
  }
  const builtinReferences = new Set(['gross', 'grosssalary', 'grossearnings', 'eligiblewages']);
  const dependencies = new Map(components.map(component => [component, new Set()]));
  for (const component of components) {
    if ((component.calculationType || 'Percentage') === 'Percentage') {
      const base = normalizeReference(component.calculationBase || component.referenceComponent || 'Gross');
      const dependency = componentByReference.get(base);
      if (dependency) dependencies.get(component).add(dependency);
    }
    if (component.calculationType === 'Formula') {
      const formulaReferences = String(component.formula).match(/[A-Za-z_][A-Za-z0-9_]*/g) || [];
      for (const reference of formulaReferences) {
        const key = normalizeReference(reference);
        if (builtinReferences.has(key)) continue;
        const dependency = key === 'basic'
          ? components.find(item => normalizeReference(item.name).includes('basic') || normalizeReference(item.code) === 'basic')
          : componentByReference.get(key);
        if (dependency) dependencies.get(component).add(dependency);
      }
    }
  }
  const active = new Set();
  const complete = new Set();
  const visit = component => {
    if (active.has(component)) throw new ApiError(400, `Circular salary component dependency detected at "${component.name}".`);
    if (complete.has(component)) return;
    active.add(component);
    for (const dependency of dependencies.get(component)) visit(dependency);
    active.delete(component);
    complete.add(component);
  };
  for (const component of components) visit(component);
};

class SalaryStructureService {
  async ensureSchema() {
    await ensureSalarySchema();
  }

  async getApplicableStructures(employeeId, effectiveDate = new Date().toISOString().slice(0, 10)) {
    await ensureSalarySchema();
    if (!isValidDateOnly(effectiveDate)) {
      throw new ApiError(400, 'Effective date must use YYYY-MM-DD format.');
    }
    const employee = await Employee.findOne({
      where: {
        [Op.or]: [
          { id: employeeId },
          { employeeCode: employeeId },
          { employeeId }
        ]
      }
    });
    if (!employee) throw new ApiError(404, 'Employee not found.');

    const structures = await SalaryStructure.findAll({
      where: {
        isActive: true,
        [Op.and]: [
          {
            [Op.or]: [
              { effectiveFrom: null },
              { effectiveFrom: { [Op.lte]: effectiveDate } }
            ]
          },
          {
            [Op.or]: [
              { effectiveTo: null },
              { effectiveTo: { [Op.gte]: effectiveDate } }
            ]
          }
        ]
      },
      include: [{ model: SalaryComponent, as: 'components' }]
    });
    const allDepartmentIds = [...new Set(structures.flatMap(structure =>
      parseScopeIds(structure.departmentIds).length ? parseScopeIds(structure.departmentIds) : parseScopeIds(structure.departmentId)
    ))];
    const allDesignationIds = [...new Set(structures.flatMap(structure =>
      parseScopeIds(structure.designationIds).length ? parseScopeIds(structure.designationIds) : parseScopeIds(structure.designationId)
    ))];
    const [departments, designations] = await Promise.all([
      allDepartmentIds.length ? Department.findAll({ where: { id: { [Op.in]: allDepartmentIds } } }) : [],
      allDesignationIds.length ? Designation.findAll({ where: { id: { [Op.in]: allDesignationIds } } }) : []
    ]);
    const departmentById = new Map(departments.map(item => [String(item.id), item]));
    const designationById = new Map(designations.map(item => [String(item.id), item]));
    const normalize = value => String(value || '').trim().toLowerCase();
    const employeeDepartment = normalize(employee.department);
    const employeeDesignation = normalize(employee.designation);
    const employeeCategory = normalize(employee.employeeType);

    return structures.filter(structure => {
      const departmentIds = parseScopeIds(structure.departmentIds).length ? parseScopeIds(structure.departmentIds) : parseScopeIds(structure.departmentId);
      const designationIds = parseScopeIds(structure.designationIds).length ? parseScopeIds(structure.designationIds) : parseScopeIds(structure.designationId);
      const departmentMatches = !departmentIds.length || departmentIds.some(id => {
        const department = departmentById.get(String(id));
        return [id, department?.deptName, department?.deptCode].some(value => normalize(value) === employeeDepartment);
      });
      const designationMatches = !designationIds.length || designationIds.some(id => {
        const designation = designationById.get(String(id));
        return [id, designation?.desigName, designation?.desigCode].some(value => normalize(value) === employeeDesignation);
      });
      const employeeGrade = normalize(employee.grade || employee.jobLevel);
      const designationGrade = normalize(designations.find(item =>
        normalize(item.desigName) === employeeDesignation || normalize(item.desigCode) === employeeDesignation
      )?.grade);
      const structureGrade = normalize(structure.grade);
      const gradeMatches = !structureGrade || !employeeGrade && !designationGrade ||
        structureGrade === employeeGrade || structureGrade === designationGrade;
      const structureCategory = normalize(structure.employmentCategory);
      const categoryMatches = !employeeCategory || !structureCategory || structureCategory === employeeCategory;
      return departmentMatches && designationMatches && gradeMatches && categoryMatches;
    });
  }

  async assertNoOverlappingStructures(payload, excludeId = null) {
    const effectiveFrom = payload.effectiveFrom || new Date().toISOString().slice(0, 10);
    const effectiveTo = payload.effectiveTo || '9999-12-31';
    if (!isValidDateOnly(effectiveFrom) || (payload.effectiveTo && !isValidDateOnly(payload.effectiveTo))) {
      throw new ApiError(400, 'Effective dates must use YYYY-MM-DD format.');
    }
    if (effectiveTo < effectiveFrom) {
      throw new ApiError(400, 'Effective To date cannot be earlier than Effective From date.');
    }

    const structures = await SalaryStructure.findAll({
      where: {
        isActive: true,
        ...(excludeId ? { id: { [Op.ne]: excludeId } } : {})
      }
    });
    const requestedDepartments = parseScopeIds(payload.departmentIds).length ? parseScopeIds(payload.departmentIds) : parseScopeIds(payload.departmentId);
    const requestedDesignations = parseScopeIds(payload.designationIds).length ? parseScopeIds(payload.designationIds) : parseScopeIds(payload.designationId);
    const overlapsScope = (requested, existing) => !requested.length || !existing.length || requested.some(id => existing.includes(id));

    const collision = structures.find(structure => {
      const currentFrom = structure.effectiveFrom || '0000-01-01';
      const currentTo = structure.effectiveTo || '9999-12-31';
      if (effectiveFrom > currentTo || currentFrom > effectiveTo) return false;
      if (String(structure.grade || '') !== String(payload.grade || '')) return false;
      if (String(structure.employmentCategory || '') !== String(payload.employmentCategory || 'Full-Time')) return false;
      const existingDepartments = parseScopeIds(structure.departmentIds).length ? parseScopeIds(structure.departmentIds) : parseScopeIds(structure.departmentId);
      const existingDesignations = parseScopeIds(structure.designationIds).length ? parseScopeIds(structure.designationIds) : parseScopeIds(structure.designationId);
      return overlapsScope(requestedDepartments, existingDepartments) &&
        overlapsScope(requestedDesignations, existingDesignations);
    });
    if (collision) {
      throw new ApiError(409, `Effective period overlaps with existing salary structure "${collision.name}".`);
    }
    return { effectiveFrom, effectiveTo: payload.effectiveTo || null };
  }

  async logStructureAction(userId, action, recordId, status, oldValues = null, newValues = null) {
    try {
      const user = await User.findByPk(userId);
      await auditLogService.log({
        userId,
        username: user ? user.email : 'Admin',
        roleName: 'Admin',
        actionType: action,
        moduleName: 'Salary Structure',
        recordId,
        previousValues: oldValues,
        newValues,
        status
      });
    } catch (e) {}
  }

  /**
   * Helper to compute detailed breakdown of gross, deductions, employer contributions, and net pay
   */
  calculateBreakdown(baseGross, components = [], employeeInfo = {}, options = {}) {
    const enteredAmount = Number(baseGross);
    const monthlyGrossReference = options.referenceSalaryType === 'Annual CTC'
      ? enteredAmount / 12
      : enteredAmount;
    const warnings = [];
    if (!Number.isFinite(enteredAmount) || enteredAmount < 0) {
      return { grossSalary: 0, earnings: [], deductions: [], employerContributions: [], warnings: ['Reference salary must be a non-negative number.'], totalDeductions: 0, netSalary: 0, monthlyCtc: 0, annualCtc: 0 };
    }

    const normalizedComponents = components
      .filter(component => component.isActive !== false && component.is_active !== false && component.is_active !== 0)
      .map((component, index) => {
        const category = component.category || component.componentCategory || component.component_category ||
          ((component.type || component.componentType || component.component_type) === 'Deduction' ? 'Employee Deduction' : 'Earning');
        return {
          ...component,
          name: component.name || component.componentName || component.component_name || `Component ${index + 1}`,
          code: component.componentCode || component.component_code || '',
          category,
          calculationType: component.calculationType || component.calculation_type || 'Fixed',
          calculationBase: component.calculationBase || component.calculation_base || component.referenceComponent || component.reference_component || 'Gross',
          value: Number(component.value ?? component.amount ?? 0),
          formula: component.formula || '',
          frequency: component.frequency || 'Monthly',
          displayOrder: Number(component.displayOrder ?? component.display_order ?? index)
        };
      })
      .sort((left, right) => left.displayOrder - right.displayOrder);

    const componentByReference = new Map();
    normalizedComponents.forEach(component => {
      const key = normalizeReference(component.code || component.name);
      if (componentByReference.has(key)) warnings.push(`Duplicate component configuration detected for "${component.name}".`);
      componentByReference.set(normalizeReference(component.name), component);
      if (component.code) componentByReference.set(normalizeReference(component.code), component);
    });

    const computed = new Map();
    const activeCalculations = new Set();
    const calculatedEarningsTotal = () => normalizedComponents
      .filter(component => component.category === 'Earning')
      .reduce((sum, component) => sum + (computed.get(normalizeReference(component.code || component.name))?.amount || 0), 0);
    const aliases = {
      gross: monthlyGrossReference,
      grosssalary: monthlyGrossReference,
      grossearnings: monthlyGrossReference,
      eligiblewages: monthlyGrossReference,
      basic: null
    };

    const resolveBase = (reference, owner) => {
      const normalized = normalizeReference(reference);
      if (['grosssalary', 'grossearnings', 'eligiblewages'].includes(normalized)) {
        if (owner?.category === 'Earning') {
          warnings.push(`${owner.name}: "${reference}" cannot be used as an earning base because it depends on total earnings.`);
          return 0;
        }
        return calculatedEarningsTotal();
      }
      if (normalized in aliases && aliases[normalized] !== null) return aliases[normalized];
      if (normalized === 'basic') {
        const basicComponent = normalizedComponents.find(component =>
          normalizeReference(component.name).includes('basic') ||
          normalizeReference(component.code) === 'basic'
        );
        if (basicComponent) return calculateComponent(basicComponent);
        warnings.push(`${owner?.name || 'Component'}: calculation base "Basic Salary" was not found.`);
        return 0;
      }
      const dependency = componentByReference.get(normalized);
      if (dependency) return calculateComponent(dependency);
      if (!reference || ['gross', 'grosssalary', 'grossearnings', 'eligiblewages'].includes(normalized)) {
        return monthlyGrossReference;
      }
      warnings.push(`${owner?.name || 'Component'}: calculation base "${reference}" was not found.`);
      return 0;
    };

    const calculateComponent = component => {
      const key = normalizeReference(component.code || component.name);
      if (computed.has(key)) return computed.get(key).amount;
      if (activeCalculations.has(key)) {
        warnings.push(`Circular component dependency detected at "${component.name}".`);
        return 0;
      }
      activeCalculations.add(key);

      let eligible = true;
      if (component.eligibilityCondition) {
        try {
          const conditions = typeof component.eligibilityCondition === 'string'
            ? JSON.parse(component.eligibilityCondition)
            : component.eligibilityCondition;
          const grossEarnings = calculatedEarningsTotal();
          eligible = Object.entries(conditions).every(([field, value]) => {
            switch (normalizeReference(field)) {
              case 'minimumgrosssalary': return grossEarnings >= Number(value);
              case 'maximumgrosssalary': return grossEarnings <= Number(value);
              case 'minimumbasicsalary': return resolveBase('Basic', component) >= Number(value);
              case 'maximumbasicsalary': return resolveBase('Basic', component) <= Number(value);
              default: {
                if (employeeInfo[field] === undefined && ['pfApplicable', 'esiApplicable'].includes(field)) {
                  return value === true;
                }
                const employeeValue = employeeInfo[field];
                if (typeof value === 'boolean') {
                  return !['false', '0', 'no', 'off'].includes(String(employeeValue).toLowerCase()) === value;
                }
                return employeeValue === value;
              }
            }
          });
        } catch {
          warnings.push(`${component.name}: eligibility condition must be valid JSON.`);
          eligible = false;
        }
      }

      const base = resolveBase(component.calculationBase, component);
      let amount = 0;
      let explanation = '';
      if (eligible) {
        if (component.calculationType === 'Percentage') {
          amount = base * component.value / 100;
          explanation = `${component.calculationBase} × ${component.value}%`;
        } else if (component.calculationType === 'Formula') {
          const values = {
            ...aliases,
            basic: resolveBase('Basic', component)
          };
          for (const dependency of normalizedComponents) {
            const amount = calculateComponent(dependency);
            values[normalizeReference(dependency.name)] = amount;
            if (dependency.code) values[normalizeReference(dependency.code)] = amount;
          }
          if (component.category !== 'Earning') {
            const grossEarnings = calculatedEarningsTotal();
            values.grosssalary = grossEarnings;
            values.grossearnings = grossEarnings;
            values.eligiblewages = grossEarnings;
          }
          try {
            amount = evaluateFormula(component.formula, values);
          } catch (error) {
            warnings.push(`${component.name}: ${error.message}`);
          }
          explanation = component.formula;
        } else {
          amount = component.value;
          explanation = `Fixed ${component.frequency} amount`;
        }
        if (component.frequency === 'Annual') amount /= 12;
        if (component.minimumAmount != null) amount = Math.max(amount, Number(component.minimumAmount));
        if (component.maximumAmount != null) amount = Math.min(amount, Number(component.maximumAmount));
      }

      if (!Number.isFinite(amount) || amount < 0) {
        warnings.push(`${component.name}: calculated amount is invalid or negative.`);
        amount = 0;
      }
      if (!eligible && component.isStatutory) {
        warnings.push(`${component.name}: statutory component is not eligible for this employee or salary.`);
      }
      if (component.calculationType === 'Percentage') {
        explanation = `${component.calculationBase} ₹${Number(base).toFixed(2)} × ${component.value}% = ₹${amount.toFixed(2)}`;
      } else if (component.calculationType === 'Formula' && eligible) {
        explanation = `${component.formula} = ₹${amount.toFixed(2)}`;
      } else if (component.calculationType !== 'Formula' && eligible) {
        explanation = `${component.frequency} fixed amount ₹${component.value} = ₹${amount.toFixed(2)}`;
      }
      const result = {
        ...component,
        amount: Math.round(amount * 100) / 100,
        explanation: eligible ? explanation : 'Not eligible',
        eligible
      };
      computed.set(key, result);
      activeCalculations.delete(key);
      return result.amount;
    };

    normalizedComponents.filter(component => component.category === 'Earning').forEach(calculateComponent);
    normalizedComponents.forEach(calculateComponent);
    const resultFor = category => normalizedComponents
      .filter(component => component.category === category)
      .map(component => computed.get(normalizeReference(component.code || component.name)));
    const earnings = resultFor('Earning');
    const deductions = resultFor('Employee Deduction');
    const employerContributions = resultFor('Employer Contribution');
    const total = values => Math.round(values.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
    const grossSalary = total(earnings);
    const totalDeductions = total(deductions);
    const totalEmployerContributions = total(employerContributions);
    const monthlyCtc = Math.round((grossSalary + totalEmployerContributions) * 100) / 100;
    const annualCtc = Math.round(monthlyCtc * 12 * 100) / 100;

    if (options.referenceSalaryType === 'Annual CTC' && Math.abs(annualCtc - enteredAmount) > 0.01) {
      warnings.push('Calculated Annual CTC differs from the entered reference amount; review component allocation.');
    }

    return {
      grossSalary,
      totalGross: grossSalary,
      earnings,
      deductions,
      employerContributions,
      totalDeductions,
      totalEmployerContributions,
      netSalary: Math.max(0, Math.round((grossSalary - totalDeductions) * 100) / 100),
      monthlyCtc,
      annualCtc,
      basic: earnings.find(component =>
        normalizeReference(component.name).includes('basic') ||
        normalizeReference(component.code) === 'basic'
      )?.amount || 0,
      employerPf: total(employerContributions.filter(c => /pf|provident/i.test(c.name))),
      employerEsi: total(employerContributions.filter(c => /esi|insurance/i.test(c.name))),
      warnings
    };
  }

  /**
   * 1. Create a new salary structure
   */
  async createSalaryStructure(payload, executorId) {
    await ensureSalarySchema();
    const {
      name,
      description,
      departmentId,
      designationId,
      departmentIds = departmentId ? [departmentId] : [],
      designationIds = designationId ? [designationId] : [],
      grade,
      employmentCategory,
      referenceSalaryType = 'Monthly Gross',
      effectiveFrom,
      effectiveTo,
      components = []
    } = payload;

    if (!name || name.trim().length === 0) {
      throw new ApiError(400, 'Structure name is required.');
    }
    if (!['Monthly Gross', 'Annual CTC'].includes(referenceSalaryType)) {
      throw new ApiError(400, 'Reference salary type must be Monthly Gross or Annual CTC.');
    }
    validateSalaryComponents(components);
    const effectivePeriod = await this.assertNoOverlappingStructures({
      departmentId,
      departmentIds,
      designationId,
      designationIds,
      grade,
      employmentCategory,
      effectiveFrom,
      effectiveTo
    });

    // Validate component values
    for (const comp of components) {
      if (!comp.name || comp.name.trim().length === 0) {
        throw new ApiError(400, 'All components must have a valid name.');
      }
      const val = parseFloat(comp.value);
      if (isNaN(val) || val < 0) {
        throw new ApiError(400, `Invalid amount/percentage for component: ${comp.name}. Negative values not permitted.`);
      }
    }

    const transaction = await sequelize.transaction();
    let structure;
    try {
      structure = await SalaryStructure.create({
        structureName: name.trim(),
        name: name.trim(),
        description: description || null,
        departmentId: departmentIds[0] || departmentId || null,
        designationId: designationIds[0] || designationId || null,
        departmentIds: departmentIds.length ? departmentIds : null,
        designationIds: designationIds.length ? designationIds : null,
        grade: grade || null,
        employmentCategory: employmentCategory || 'Full-Time',
        referenceSalaryType,
        effectiveFrom: effectivePeriod.effectiveFrom,
        effectiveTo: effectivePeriod.effectiveTo,
        createdBy: executorId || null,
        isActive: true
      }, { transaction });

      for (const comp of components) {
        const category = comp.category || (comp.type === 'Deduction' ? 'Employee Deduction' : 'Earning');
        const value = Number(comp.value);
        if (!comp.name?.trim() || !Number.isFinite(value) || value < 0) {
          throw new ApiError(400, `Component "${comp.name || ''}" needs a name and a non-negative numeric value.`);
        }
        if (comp.calculationType === 'Formula') {
          try {
            const formulaValues = Object.fromEntries(components.map(item => [normalizeReference(item.code || item.name), 1]));
            Object.assign(formulaValues, { gross: 1, grosssalary: 1, grossearnings: 1, eligiblewages: 1, basic: 1 });
            evaluateFormula(comp.formula, formulaValues);
          } catch (error) {
            throw new ApiError(400, `${comp.name}: ${error.message}`);
          }
        }
        await SalaryComponent.create({
          salaryStructureId: structure.id,
          componentName: comp.name.trim(),
          name: comp.name.trim(),
          componentCode: comp.code?.trim() || comp.name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
          category,
          componentType: category === 'Employee Deduction' ? 'Deduction' : 'Earning',
          type: category === 'Employee Deduction' ? 'Deduction' : 'Earning',
          calculationType: comp.calculationType || 'Percentage',
          calculationBase: comp.calculationBase || comp.referenceComponent || 'Gross',
          formula: comp.formula || null,
          frequency: comp.frequency || 'Monthly',
          minimumAmount: comp.minimumAmount ?? null,
          maximumAmount: comp.maximumAmount ?? null,
          eligibilityCondition: serializeEligibilityCondition(comp.eligibilityCondition),
          displayOrder: Number(comp.displayOrder) || 0,
          isActive: comp.isActive !== false,
          isTaxable: comp.isTaxable !== false,
          amount: value,
          value,
          percentageBase: comp.calculationBase || comp.referenceComponent || null,
          referenceComponent: comp.referenceComponent || null,
          isStatutory: Boolean(comp.isStatutory)
        }, { transaction });
      }

      await transaction.commit();
    } catch (err) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      throw err;
    }

    await this.logStructureAction(executorId, 'Create', structure.id, 'Success', null, structure);
    return await this.getStructureDetails(structure.id);
  }

  /**
   * 2. Get salary structures with filters, search, pagination
   */
  async getSalaryStructures(query = {}) {
    await ensureSalarySchema();
    const {
      search,
      departmentId,
      designationId,
      grade,
      isActive,
      page = 1,
      limit = 20
    } = query;

    const where = {};
    if (isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true' || isActive === true || isActive === '1';
    }
    if (departmentId) where.departmentId = departmentId;
    if (designationId) where.designationId = designationId;
    if (grade) where.grade = grade;

    if (search && search.trim().length > 0) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search.trim()}%` } },
        { description: { [Op.like]: `%${search.trim()}%` } },
        { grade: { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await SalaryStructure.findAndCountAll({
      where,
      include: [
        { model: SalaryComponent, as: 'components' },
        { model: Department, as: 'departmentDetails', attributes: ['id', 'dept_name', 'dept_code'] },
        { model: Designation, as: 'designationDetails', attributes: ['id', 'desig_name', 'desig_code', 'grade'] }
      ],
      order: [['created_at', 'DESC']],
      limit: limitNum,
      offset,
      distinct: true
    });

    const structureIds = rows.map(row => row.id);
    const assignedCounts = structureIds.length
      ? await EmployeeSalaryAssignment.findAll({
        attributes: [
          'salaryStructureId',
          [sequelize.fn('COUNT', sequelize.col('id')), 'assignedEmployeeCount']
        ],
        where: {
          salaryStructureId: { [Op.in]: structureIds },
          isActive: true,
          approvalStatus: 'Approved',
          effectiveFrom: { [Op.lte]: new Date().toISOString().slice(0, 10) },
          [Op.or]: [
            { effectiveTo: null },
            { effectiveTo: { [Op.gte]: new Date().toISOString().slice(0, 10) } }
          ]
        },
        group: ['salaryStructureId'],
        raw: true
      })
      : [];
    const assignedCountByStructure = new Map(assignedCounts.map(row => [
      row.salaryStructureId,
      Number(row.assignedEmployeeCount) || 0
    ]));

    return {
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(count / limitNum),
      records: rows.map(row => ({
        ...row.toJSON(),
        assignedEmployeeCount: assignedCountByStructure.get(row.id) || 0
      }))
    };
  }

  /**
   * 3. Get single salary structure details
   */
  async getStructureDetails(id) {
    await ensureSalarySchema();
    const structure = await SalaryStructure.findByPk(id, {
      include: [
        { model: SalaryComponent, as: 'components' },
        { model: Department, as: 'departmentDetails' },
        { model: Designation, as: 'designationDetails' }
      ]
    });
    if (!structure) {
      throw new ApiError(404, 'Salary structure not found.');
    }
    return structure;
  }

  /**
   * 4. Update salary structure
   */
  async updateSalaryStructure(id, payload, executorId) {
    await ensureSalarySchema();
    const structure = await SalaryStructure.findByPk(id);
    if (!structure) {
      throw new ApiError(404, 'Salary structure not found.');
    }

    const hasAssignments = await EmployeeSalaryAssignment.count({ where: { salaryStructureId: id } });
    const changesCalculationOrApplicability = [
      'departmentId', 'designationId', 'departmentIds', 'designationIds',
      'grade', 'employmentCategory', 'referenceSalaryType',
      'effectiveFrom', 'effectiveTo', 'components'
    ].some(field => Object.prototype.hasOwnProperty.call(payload, field));
    if (hasAssignments && changesCalculationOrApplicability) {
      throw new ApiError(409, 'This structure is referenced by salary assignments. Create a new structure for a salary revision to preserve history.');
    }

    const oldValues = { ...structure.toJSON() };
    const {
      name,
      description,
      departmentId,
      designationId,
      departmentIds,
      designationIds,
      grade,
      employmentCategory,
      referenceSalaryType,
      effectiveFrom,
      effectiveTo,
      components
    } = payload;

    const effectivePeriod = await this.assertNoOverlappingStructures({
      departmentId: departmentId !== undefined ? departmentId : structure.departmentId,
      departmentIds: departmentIds !== undefined ? departmentIds : (structure.departmentIds || (structure.departmentId ? [structure.departmentId] : [])),
      designationId: designationId !== undefined ? designationId : structure.designationId,
      designationIds: designationIds !== undefined ? designationIds : (structure.designationIds || (structure.designationId ? [structure.designationId] : [])),
      grade: grade !== undefined ? grade : structure.grade,
      employmentCategory: employmentCategory || structure.employmentCategory,
      effectiveFrom: effectiveFrom || structure.effectiveFrom,
      effectiveTo: effectiveTo !== undefined ? effectiveTo : structure.effectiveTo
    }, id);

    if (referenceSalaryType !== undefined && !['Monthly Gross', 'Annual CTC'].includes(referenceSalaryType)) {
      throw new ApiError(400, 'Reference salary type must be Monthly Gross or Annual CTC.');
    }
    if (components !== undefined) validateSalaryComponents(components);

    const transaction = await sequelize.transaction();
    try {
      if (name) structure.structureName = name.trim();
      if (name) structure.name = name.trim();
      if (description !== undefined) structure.description = description;
      if (departmentId !== undefined || departmentIds !== undefined) {
        const ids = departmentIds !== undefined ? departmentIds : (departmentId ? [departmentId] : []);
        structure.departmentId = ids[0] || departmentId || null;
        structure.departmentIds = ids.length ? ids : null;
      }
      if (designationId !== undefined || designationIds !== undefined) {
        const ids = designationIds !== undefined ? designationIds : (designationId ? [designationId] : []);
        structure.designationId = ids[0] || designationId || null;
        structure.designationIds = ids.length ? ids : null;
      }
      if (grade !== undefined) structure.grade = grade || null;
      if (employmentCategory) structure.employmentCategory = employmentCategory;
      if (referenceSalaryType) structure.referenceSalaryType = referenceSalaryType;
      structure.effectiveFrom = effectivePeriod.effectiveFrom;
      structure.effectiveTo = effectivePeriod.effectiveTo;
      await structure.save({ transaction });

      if (components && Array.isArray(components)) {
        await SalaryComponent.destroy({ where: { salaryStructureId: id }, transaction });
        for (const [index, comp] of components.entries()) {
          const val = Number(comp.value);
          if (!comp.name?.trim() || !Number.isFinite(val) || val < 0) {
            throw new ApiError(400, `Component "${comp.name || ''}" needs a name and a non-negative numeric value.`);
          }
          const category = comp.category || (comp.type === 'Deduction' ? 'Employee Deduction' : 'Earning');
          if (comp.calculationType === 'Formula') {
            try {
              const formulaValues = Object.fromEntries(components.map(item => [normalizeReference(item.code || item.name), 1]));
              Object.assign(formulaValues, { gross: 1, grosssalary: 1, grossearnings: 1, eligiblewages: 1, basic: 1 });
              evaluateFormula(comp.formula, formulaValues);
            } catch (error) {
              throw new ApiError(400, `${comp.name}: ${error.message}`);
            }
          }
          await SalaryComponent.create({
            salaryStructureId: id,
            componentName: comp.name.trim(),
            name: comp.name.trim(),
            componentCode: comp.code?.trim() || comp.name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
            category,
            componentType: category === 'Employee Deduction' ? 'Deduction' : 'Earning',
            type: category === 'Employee Deduction' ? 'Deduction' : 'Earning',
            calculationType: comp.calculationType || 'Percentage',
            calculationBase: comp.calculationBase || comp.referenceComponent || 'Gross',
            formula: comp.formula || null,
            frequency: comp.frequency || 'Monthly',
            minimumAmount: comp.minimumAmount ?? null,
            maximumAmount: comp.maximumAmount ?? null,
            eligibilityCondition: serializeEligibilityCondition(comp.eligibilityCondition),
            displayOrder: Number(comp.displayOrder ?? index),
            isActive: comp.isActive !== false,
            isTaxable: comp.isTaxable !== false,
            amount: val,
            value: val,
            percentageBase: comp.calculationBase || comp.referenceComponent || null,
            referenceComponent: comp.referenceComponent || null,
            isStatutory: Boolean(comp.isStatutory)
          }, { transaction });
        }
      }

      await transaction.commit();
    } catch (err) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      throw err;
    }

    await this.logStructureAction(executorId, 'Update', id, 'Success', oldValues, structure);
    return await this.getStructureDetails(id);
  }

  /**
   * 5. Archive / Toggle salary structure active status
   */
  async toggleStructureStatus(id, executorId) {
    const structure = await SalaryStructure.findByPk(id);
    if (!structure) {
      throw new ApiError(404, 'Salary structure not found.');
    }

    const oldValues = { ...structure.toJSON() };
    structure.isActive = !structure.isActive;
    await structure.save();

    await this.logStructureAction(executorId, structure.isActive ? 'Activate' : 'Archive', id, 'Success', oldValues, structure);
    return structure;
  }

  /**
   * 6. Assign salary structure to employee with effective date and overlap validation
   */
  async assignSalaryStructure(payload, executorId) {
    await ensureSalarySchema();
    const {
      employeeId,
      salaryStructureId,
      effectiveFrom,
      baseGross,
      revisionReason,
      componentOverrides
    } = payload;

    if (typeof employeeId !== 'string' || !employeeId.trim() ||
      typeof salaryStructureId !== 'string' || !salaryStructureId.trim() ||
      typeof effectiveFrom !== 'string' || !effectiveFrom ||
      baseGross === undefined || baseGross === null || baseGross === '') {
      throw new ApiError(400, 'Employee, Salary Structure, Effective From date, and Base Gross are required.');
    }

    const grossVal = Number(baseGross);
    if (!Number.isFinite(grossVal) || grossVal <= 0) {
      throw new ApiError(400, 'Base Gross salary must be greater than zero.');
    }

    const employee = await Employee.findOne({
      where: {
        [Op.or]: [
          { id: employeeId },
          { employeeCode: employeeId },
          { employeeId }
        ]
      }
    });
    if (!employee) {
      throw new ApiError(404, 'Employee not found.');
    }

    const structure = await SalaryStructure.findByPk(salaryStructureId, {
      include: [{ model: SalaryComponent, as: 'components' }]
    });
    if (!structure) {
      throw new ApiError(404, 'Salary structure not found.');
    }

    if (!isValidDateOnly(effectiveFrom)) {
      throw new ApiError(400, 'Invalid effectiveFrom date format.');
    }
    if (!structure.isActive) {
      throw new ApiError(400, 'Cannot assign an archived salary structure.');
    }
    if (structure.effectiveFrom && effectiveFrom < structure.effectiveFrom) {
      throw new ApiError(400, 'Assignment date is before the salary structure effective period.');
    }
    if (structure.effectiveTo && effectiveFrom > structure.effectiveTo) {
      throw new ApiError(400, 'Assignment date is after the salary structure effective period.');
    }
    const applicableStructures = await this.getApplicableStructures(employee.id, effectiveFrom);
    if (!applicableStructures.some(item => item.id === structure.id)) {
      throw new ApiError(400, 'Selected salary structure is not applicable to this employee for the effective date.');
    }

    const transaction = await sequelize.transaction();
    let assignment;
    let breakdown;
    try {
      // Find all existing assignments for employee
      const existingAssignments = await EmployeeSalaryAssignment.findAll({
        where: { employeeId: employee.id },
        order: [['effectiveFrom', 'ASC']],
        transaction
      });

      const conflictingAssignment = existingAssignments.find(a =>
        a.effectiveFrom === effectiveFrom ||
        (a.effectiveFrom > effectiveFrom && (!a.effectiveTo || a.effectiveTo >= effectiveFrom))
      );
      if (conflictingAssignment) {
        throw new ApiError(409, `An assignment already exists for this employee starting on ${conflictingAssignment.effectiveFrom}.`);
      }

      breakdown = this.calculateBreakdown(grossVal, structure.components || [], employee, {
        referenceSalaryType: structure.referenceSalaryType
      });

      const monthlyBaseGross = structure.referenceSalaryType === 'Annual CTC' ? grossVal / 12 : grossVal;
      assignment = await EmployeeSalaryAssignment.create({
        employeeId: employee.id,
        salaryStructureId,
        effectiveFrom,
        effectiveTo: null,
        grossSalary: breakdown.grossSalary,
        baseGross: monthlyBaseGross,
        annualCtc: breakdown.annualCtc,
        ctc: breakdown.annualCtc,
        createdBy: executorId || null,
        revisionReason: revisionReason || null,
        approvalStatus: 'Pending',
        status: 'Pending Approval',
        componentOverrides: componentOverrides || null,
        salaryBreakdown: breakdown,
        isActive: true
      }, { transaction });

      await transaction.commit();
    } catch (err) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      throw err;
    }

    await this.logStructureAction(executorId, 'Assign', assignment.id, 'Success', null, assignment);
    return {
      assignment,
      breakdown
    };
  }

  async approveSalaryAssignment(id, executorId) {
    await ensureSalarySchema();
    const transaction = await sequelize.transaction();
    let assignment;
    try {
      assignment = await EmployeeSalaryAssignment.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!assignment) throw new ApiError(404, 'Salary assignment not found.');
      if (assignment.approvalStatus === 'Approved') {
        throw new ApiError(409, 'Salary assignment has already been approved.');
      }
      if (assignment.approvalStatus !== 'Pending') {
        throw new ApiError(409, 'Only pending salary assignments can be approved.');
      }

      const previousAssignments = await EmployeeSalaryAssignment.findAll({
        where: {
          employeeId: assignment.employeeId,
          approvalStatus: 'Approved',
          isActive: true,
          effectiveFrom: { [Op.lt]: assignment.effectiveFrom },
          [Op.or]: [
            { effectiveTo: null },
            { effectiveTo: { [Op.gte]: assignment.effectiveFrom } }
          ]
        },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      const previousEffectiveTo = new Date(`${assignment.effectiveFrom}T00:00:00.000Z`);
      previousEffectiveTo.setUTCDate(previousEffectiveTo.getUTCDate() - 1);
      const effectiveTo = previousEffectiveTo.toISOString().slice(0, 10);
      for (const previous of previousAssignments) {
        previous.effectiveTo = effectiveTo;
        await previous.save({ transaction });
      }

      assignment.approvalStatus = 'Approved';
      assignment.status = 'Active';
      assignment.approvedBy = executorId || null;
      await assignment.save({ transaction });
      await transaction.commit();
    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      throw error;
    }
    await this.logStructureAction(executorId, 'Approve Assignment', assignment.id, 'Success', null, assignment);
    return assignment;
  }

  /**
   * 7. Get salary revision history for employee
   */
  async getEmployeeSalaryHistory(employeeId) {
    await ensureSalarySchema();
    return await EmployeeSalaryAssignment.findAll({
      where: { employeeId },
      include: [
        {
          model: SalaryStructure,
          as: 'structure',
          include: [{ model: SalaryComponent, as: 'components' }]
        }
      ],
      order: [['effective_from', 'DESC']]
    });
  }

  /**
   * 8. Instant calculation preview
   */
  async previewCalculation(payload) {
    const { salaryStructureId, baseGross, customComponents, employeeId, referenceSalaryType } = payload;
    let components = customComponents || [];
    let employeeInfo = {};
    let salaryType = referenceSalaryType || 'Monthly Gross';

    if (salaryStructureId) {
      const struct = await SalaryStructure.findByPk(salaryStructureId, {
        include: [{ model: SalaryComponent, as: 'components' }]
      });
      if (struct) {
        components = struct.components || [];
        salaryType = struct.referenceSalaryType || salaryType;
      }
    }

    if (employeeId) {
      const employee = await Employee.findOne({
        where: {
          [Op.or]: [
            { id: employeeId },
            { employeeCode: employeeId },
            { employeeId }
          ]
        }
      });
      if (!employee) throw new ApiError(404, 'Employee not found for salary preview.');
      employeeInfo = employee;
    }

    return this.calculateBreakdown(baseGross, components, employeeInfo, {
      referenceSalaryType: salaryType
    });
  }
}

module.exports = new SalaryStructureService();
