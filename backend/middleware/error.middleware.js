// backend/middleware/error.middleware.js
const ApiError = require('../utils/apiError');
const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    error = new ApiError(statusCode, message, [], err.stack);
  }

  // Log error stack with Winston
  logger.error(`${req.method} ${req.originalUrl} - Error: ${error.message}\nStack: ${error.stack}`);

  const response = {
    success: false,
    message: error.message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  res.status(error.statusCode).json(response);
};

module.exports = errorHandler;
