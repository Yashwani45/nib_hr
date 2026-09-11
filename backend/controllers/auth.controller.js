// backend/controllers/auth.controller.js
const authService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const { email, password, roleName } = req.body;
  const result = await authService.register(email, password, roleName);
  res.status(201).json(new ApiResponse(201, result, 'User registered successfully.'));
});

const login = asyncHandler(async (req, res) => {
  const { email, password, companyCode, companyId } = req.body;
  const logger = require('../config/logger');
  logger.info(`LOGIN REQUEST PARAMETERS: email=${email}, companyCode=${companyCode}, companyId=${companyId}`);
  const targetCompanyCode = companyCode || companyId || req.headers['x-company-code'];
  const result = await authService.login(email, password, targetCompanyCode);
  res.status(200).json(new ApiResponse(200, result, 'Logged in successfully.'));
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refresh(refreshToken);
  res.status(200).json(new ApiResponse(200, result, 'Tokens refreshed successfully.'));
});

const logout = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  await authService.logout(userId);
  res.status(200).json(new ApiResponse(200, null, 'Logged out successfully.'));
});

module.exports = {
  register,
  login,
  refresh,
  logout,
};
