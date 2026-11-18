// backend/controllers/finance/statutory.controller.js
const statutoryService = require('../../services/finance/statutory.service');
const ApiResponse = require('../../utils/apiResponse');

class StatutoryController {
  async getConfigurations(req, res, next) {
    try {
      const data = await statutoryService.getConfigurations(req.query);
      return res.status(200).json(new ApiResponse(200, data, 'Statutory configurations retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getConfigurationById(req, res, next) {
    try {
      const data = await statutoryService.getConfigurationById(req.params.id);
      return res.status(200).json(new ApiResponse(200, data, 'Statutory configuration retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async createConfiguration(req, res, next) {
    try {
      const userId = req.user?.id || 'admin';
      const data = await statutoryService.createConfiguration(req.body, userId);
      return res.status(201).json(new ApiResponse(201, data, 'Statutory configuration created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async updateConfiguration(req, res, next) {
    try {
      const userId = req.user?.id || 'admin';
      const data = await statutoryService.updateConfiguration(req.params.id, req.body, userId);
      return res.status(200).json(new ApiResponse(200, data, 'Statutory configuration updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async toggleStatus(req, res, next) {
    try {
      const userId = req.user?.id || 'admin';
      const { isActive } = req.body;
      const data = await statutoryService.toggleStatus(req.params.id, isActive, userId);
      return res.status(200).json(new ApiResponse(200, data, 'Statutory configuration status updated successfully'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StatutoryController();
