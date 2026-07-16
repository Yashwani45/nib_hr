// backend/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { User, Role, Employee } = require('../models');

const verifyJWT = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    throw new ApiError(401, 'Unauthorized access request. Token missing.');
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || 'access_secret_123');

    const user = await User.findByPk(decoded.id, {
      include: [
        { model: Role, as: 'role' },
        { model: Employee, as: 'employee' }
      ]
    });

    if (!user) {
      throw new ApiError(401, 'Invalid Access Token. User not found.');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Your account is deactivated.');
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error.message || 'Invalid Access Token.');
  }
});

module.exports = verifyJWT;
