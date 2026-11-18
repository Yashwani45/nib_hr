// backend/services/finance/statutory.service.js
const { StatutoryConfiguration, PayrollAuditLog } = require('../../models');
const ApiError = require('../../utils/apiError');
const { Op } = require('sequelize');

class StatutoryService {
  /**
   * List all statutory configurations with optional filters
   */
  async getConfigurations(filters = {}) {
    const where = {};
    if (filters.region) {
      where.applicableRegion = { [Op.like]: `%${filters.region}%` };
    }
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive === 'true' || filters.isActive === true;
    }
    if (filters.ruleCode) {
      where.ruleCode = filters.ruleCode;
    }

    return await StatutoryConfiguration.findAll({
      where,
      order: [['ruleCode', 'ASC'], ['effectiveFrom', 'DESC']]
    });
  }

  /**
   * Get single configuration
   */
  async getConfigurationById(id) {
    const config = await StatutoryConfiguration.findByPk(id);
    if (!config) {
      throw new ApiError(404, 'Statutory configuration rule not found.');
    }
    return config;
  }

  /**
   * Get active rule by rule_code and region
   */
  async getActiveRule(ruleCode, region = 'All India') {
    return await StatutoryConfiguration.findOne({
      where: {
        ruleCode,
        isActive: true,
        [Op.or]: [
          { applicableRegion: region },
          { applicableRegion: 'All India' }
        ]
      },
      order: [['effectiveFrom', 'DESC']]
    });
  }

  /**
   * Create new statutory configuration
   */
  async createConfiguration(data, userId) {
    const existing = await StatutoryConfiguration.findOne({
      where: { ruleCode: data.ruleCode }
    });
    if (existing) {
      throw new ApiError(400, `A statutory configuration with rule code "${data.ruleCode}" already exists.`);
    }

    const config = await StatutoryConfiguration.create({
      ...data,
      createdBy: userId,
      effectiveFrom: data.effectiveFrom || new Date()
    });

    try {
      await PayrollAuditLog.create({
        actorUserId: userId,
        action: 'CREATE_STATUTORY_RULE',
        entityType: 'StatutoryConfiguration',
        entityId: config.id,
        newValues: config.toJSON(),
        reason: `Created statutory rule ${config.ruleCode}`
      });
    } catch (e) {
      console.warn('Audit log error:', e.message);
    }

    return config;
  }

  /**
   * Update statutory configuration
   */
  async updateConfiguration(id, data, userId) {
    const config = await StatutoryConfiguration.findByPk(id);
    if (!config) {
      throw new ApiError(404, 'Statutory configuration rule not found.');
    }

    const oldValues = config.toJSON();
    await config.update({
      ...data,
      approvedBy: userId
    });

    try {
      await PayrollAuditLog.create({
        actorUserId: userId,
        action: 'UPDATE_STATUTORY_RULE',
        entityType: 'StatutoryConfiguration',
        entityId: config.id,
        oldValues,
        newValues: config.toJSON(),
        reason: `Updated statutory rule ${config.ruleCode}`
      });
    } catch (e) {
      console.warn('Audit log error:', e.message);
    }

    return config;
  }

  /**
   * Toggle active status
   */
  async toggleStatus(id, isActive, userId) {
    const config = await StatutoryConfiguration.findByPk(id);
    if (!config) {
      throw new ApiError(404, 'Statutory configuration rule not found.');
    }

    const oldStatus = config.isActive;
    config.isActive = isActive;
    await config.save();

    try {
      await PayrollAuditLog.create({
        actorUserId: userId,
        action: 'TOGGLE_STATUTORY_RULE_STATUS',
        entityType: 'StatutoryConfiguration',
        entityId: config.id,
        oldValues: { isActive: oldStatus },
        newValues: { isActive },
        reason: `Statutory rule ${config.ruleCode} status changed to ${isActive ? 'Active' : 'Inactive'}`
      });
    } catch (e) {
      console.warn('Audit log error:', e.message);
    }

    return config;
  }
}

module.exports = new StatutoryService();
