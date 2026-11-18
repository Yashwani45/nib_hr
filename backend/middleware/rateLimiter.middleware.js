// backend/middleware/rateLimiter.middleware.js
const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/apiError');

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 10000, // High limit for local testing/development
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: req => /\/attendance\/biometric\/(events|heartbeat)$/.test(req.path),
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many requests from this IP. Please try again after 15 minutes.'));
  },
});





const companyQrPunchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 120, // Allow high-frequency rapid scanning at office kiosk
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many QR scan requests. Please wait a few seconds before trying again.'));
  },
});

apiRateLimiter.companyQrPunchLimiter = companyQrPunchLimiter;

const biometricDeviceLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many biometric bridge requests. Check for a sync loop and retry shortly.'));
  },
});

apiRateLimiter.biometricDeviceLimiter = biometricDeviceLimiter;

module.exports = apiRateLimiter;
