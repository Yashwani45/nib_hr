// backend/controllers/finance/bonus.controller.js
const bonusService = require('../../services/finance/bonus.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const getBonuses = asyncHandler(async (req, res) => {
  const result = await bonusService.getAll();
  res.status(200).json(new ApiResponse(200, result, 'Bonus records retrieved successfully.'));
});

const getBonusById = asyncHandler(async (req, res) => {
  const result = await bonusService.getById(req.params.id);
  res.status(200).json(new ApiResponse(200, result, 'Bonus record details retrieved successfully.'));
});

const createBonus = asyncHandler(async (req, res) => {
  const reqInfo = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
  const result = await bonusService.create(req.body, req.user, reqInfo);
  res.status(201).json(new ApiResponse(201, result, 'Bonus record created successfully.'));
});

const updateBonus = asyncHandler(async (req, res) => {
  const result = await bonusService.update(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, result, 'Bonus record updated successfully.'));
});

const toggleBonusStatus = asyncHandler(async (req, res) => {
  const result = await bonusService.toggleStatus(req.params.id, req.body.status);
  res.status(200).json(new ApiResponse(200, result, 'Bonus status updated successfully.'));
});

const deleteBonus = asyncHandler(async (req, res) => {
  await bonusService.delete(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Bonus record deleted successfully.'));
});

module.exports = {
  getBonuses,
  getBonusById,
  createBonus,
  updateBonus,
  toggleBonusStatus,
  deleteBonus,
};
