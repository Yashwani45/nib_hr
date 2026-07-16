// backend/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const apiRateLimiter = require('./middleware/rateLimiter.middleware');
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

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
