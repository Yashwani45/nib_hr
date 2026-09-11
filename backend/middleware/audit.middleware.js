// backend/middleware/audit.middleware.js
const auditLogService = require('../services/core/auditLog.service');

const parseUserAgent = (userAgent = '') => {
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let device = 'Desktop';

  const ua = userAgent.toLowerCase();

  // Browser detection
  if (ua.includes('chrome') && !ua.includes('chromium')) {
    browser = 'Chrome';
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
  } else if (ua.includes('edge') || ua.includes('edg/')) {
    browser = 'Edge';
  } else if (ua.includes('opr/') || ua.includes('opera')) {
    browser = 'Opera';
  }

  // OS detection
  if (ua.includes('windows')) {
    os = 'Windows';
  } else if (ua.includes('macintosh') || ua.includes('mac os')) {
    os = 'macOS';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  } else if (ua.includes('android')) {
    os = 'Android';
    device = 'Mobile';
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS';
    device = 'Mobile';
  }

  return { browser, os, device };
};

const sanitizeBody = (body) => {
  if (!body) return null;
  const sanitized = { ...body };
  const sensitiveKeys = ['password', 'token', 'refreshToken', 'accessToken', 'oldPassword', 'newPassword'];
  
  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      sanitized[key] = '********';
    }
  }
  return sanitized;
};

const auditLogger = (moduleName = 'General') => {
  return (req, res, next) => {
    // Intercept finish event to capture response status code
    res.on('finish', () => {
      const { browser, os, device } = parseUserAgent(req.headers['user-agent']);
      const sanitizedBody = sanitizeBody(req.body);
      const isSuccess = res.statusCode >= 200 && res.statusCode < 400;

      // Determine action type based on HTTP method
      let actionType = 'Read';
      if (req.method === 'POST') {
        actionType = req.originalUrl.includes('login') ? 'Login' : 'Create';
      } else if (req.method === 'PUT' || req.method === 'PATCH') {
        actionType = 'Update';
      } else if (req.method === 'DELETE') {
        actionType = 'Delete';
      }

      const logData = {
        userId: req.user ? req.user.id : null,
        username: req.user ? req.user.username || req.user.email : 'Anonymous',
        roleName: req.user && req.user.role ? req.user.role.roleName || req.user.role.name : 'Guest',
        actionType,
        moduleName,
        recordId: req.params?.id || null,
        previousValues: null, // Populated on specific service layers if needed
        newValues: req.method !== 'GET' ? sanitizedBody : null,
        httpMethod: req.method,
        apiEndpoint: req.originalUrl,
        requestBody: req.method !== 'GET' ? sanitizedBody : null,
        ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip,
        userAgent: req.headers['user-agent'],
        browser,
        device,
        os,
        status: isSuccess ? 'Success' : 'Failed',
        failureReason: isSuccess ? null : `HTTP Status ${res.statusCode}`,
      };

      // Asynchronously log to the database
      auditLogService.log(logData);
    });

    next();
  };
};

module.exports = auditLogger;
