// backend/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const apiRateLimiter = require('./middleware/rateLimiter.middleware');
const tenantMiddleware = require('./middleware/tenant.middleware');
const errorHandler = require('./middleware/error.middleware');
const logger = require('./config/logger');
const apiRoutes = require('./routes');

const app = express();

// Secure Express headers via Helmet
app.use(helmet());

// Cross-Origin Requests enablement
app.use(cors());

// Limit API hits to protect against abuse/DDoS
app.use('/api', apiRateLimiter);

// Bind tenant routing middleware context
app.use('/api', tenantMiddleware);

// Body Parsers with increased limit for rich employee profile payloads and base64 attachments
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Log every incoming HTTP request details via winston
app.use((req, res, next) => {
  logger.info(`HTTP Request: ${req.method} ${req.originalUrl} | IP: ${req.ip}`);
  next();
});

// Mount modular versioned routers
app.use('/api', apiRoutes);

// Centralized error handling
app.use(errorHandler);

module.exports = app;
