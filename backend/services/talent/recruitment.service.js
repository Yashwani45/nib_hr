// backend/services/talent/recruitment.service.js
const recruitmentRepository = require('../../repositories/talent/recruitment.repository');
const ApiError = require('../../utils/apiError');
const { Op } = require('sequelize');

class RecruitmentService {
  async createJobRequisition(data, executorId) {
    const payload = {
      ...data,
      createdBy: executorId,
    };
    return await recruitmentRepository.create(payload);
  }

  async getJobById(id) {
    const job = await recruitmentRepository.findById(id, ['departmentDetails']);
    if (!job) {
      throw new ApiError(404, 'Job Requisition not found.');
    }
    return job;
  }

  async updateJob(id, data, executorId) {
    const payload = {
      ...data,
      updatedBy: executorId,
    };
    const updated = await recruitmentRepository.update(id, payload);
    if (!updated) {
      throw new ApiError(404, 'Job Requisition not found to update.');
    }
    return updated;
  }

  async deleteJob(id, executorId) {
    await recruitmentRepository.update(id, { deletedBy: executorId });
    const success = await recruitmentRepository.delete(id);
    if (!success) {
      throw new ApiError(404, 'Job Requisition not found to delete.');
    }
    return true;
  }

  async getAllJobs(options = {}) {
    const { page = 1, limit = 10, search = '', sortBy = 'id', sortOrder = 'DESC' } = options;
    const offset = (page - 1) * limit;

    const queryOptions = {
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [[sortBy, sortOrder]],
      where: {},
    };

    if (search) {
      queryOptions.where = {
        [Op.or]: [
          { jobTitle: { [Op.like]: `%${search}%` } },
          { reqId: { [Op.like]: `%${search}%` } },
        ],
      };
    }

    return await recruitmentRepository.findAndCountAll(queryOptions);
  }
}

module.exports = new RecruitmentService();
