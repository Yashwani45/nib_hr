// backend/middleware/rateLimiter.middleware.js
const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/apiError');

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many requests from this IP. Please try again after 15 minutes.'));
  },
});

module.exports = apiRateLimiter;
