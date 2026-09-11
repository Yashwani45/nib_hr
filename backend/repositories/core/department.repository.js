// backend/repositories/core/department.repository.js
const { Op } = require('sequelize');
const BaseRepository = require('../base.repository');
const { Department, Branch, Employee } = require('../../models');

class DepartmentRepository extends BaseRepository {
  constructor() {
    super(Department);
  }

  /**
   * Server-side paginated, searchable, filterable, and sortable list query
   */
  async findPaginated({
    companyId = null,
    search = '',
    branchId = null,
    status = null,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'DESC'
  }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const where = {};

    if (companyId) {
      where[Op.or] = [
        { companyId: companyId },
        { companyId: null }
      ];
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (status) {
      where.status = status;
    }

    if (search && search.trim() !== '') {
      const query = `%${search.trim()}%`;
      where[Op.or] = [
        { deptCode: { [Op.like]: query } },
        { deptName: { [Op.like]: query } },
        { description: { [Op.like]: query } }
      ];
    }

    const allowedSortFields = {
      deptCode: 'deptCode',
      deptName: 'deptName',
      status: 'status',
      createdAt: 'createdAt',
      created_at: 'createdAt',
      updatedAt: 'updatedAt'
    };

    const dbSortField = allowedSortFields[sortBy] || 'createdAt';
    const orderDirection = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let count = 0;
    let rows = [];

    try {
      const result = await this.model.findAndCountAll({
        where,
        limit: limitNum,
        offset,
        order: [[dbSortField, orderDirection]],
        include: [
          {
            model: Branch,
            as: 'branchDetails',
            attributes: ['id', 'branchCode', 'branchName', 'city', 'state']
          },
          {
            model: Employee,
            as: 'headEmployeeDetails',
            attributes: ['id', 'employeeName', 'email']
          },
          {
            model: Department,
            as: 'parentDeptDetails',
            attributes: ['id', 'deptCode', 'deptName']
          }
        ],
        distinct: true
      });
      count = result.count;
      rows = result.rows;
    } catch (err) {
      // Safe fallback query without complex includes
      const result = await this.model.findAndCountAll({
        where,
        limit: limitNum,
        offset,
        order: [[dbSortField, orderDirection]]
      }).catch(() => ({ count: 0, rows: [] }));
      count = result.count || 0;
      rows = result.rows || [];
    }

    return {
      totalItems: count,
      totalPages: Math.ceil(count / limitNum) || 1,
      currentPage: pageNum,
      limit: limitNum,
      departments: rows
    };
  }

  async findByCode(companyId, deptCode) {
    const where = { deptCode };
    if (companyId) {
      where[Op.or] = [{ companyId }, { companyId: null }];
    }
    return await this.model.findOne({ where }).catch(() => null);
  }

  async countAssignedEmployees(departmentId) {
    try {
      return await Employee.count({ where: { departmentId } }).catch(() => 0);
    } catch (e) {
      return 0;
    }
  }
}

module.exports = new DepartmentRepository();
