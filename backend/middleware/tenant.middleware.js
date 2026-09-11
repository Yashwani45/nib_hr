// backend/middleware/tenant.middleware.js
const { getTenantConnection } = require('../config/connectionManager');
const { tenantStorage } = require('../config/database');

const tenantMiddleware = async (req, res, next) => {
  // 1. Extract Company Code from Header
  let companyCode = req.headers['x-company-code'];

  // 2. Fallback to subdomain routing (e.g., NIB01.nibhrms.com)
  if (!companyCode) {
    const host = req.headers.host || '';
    const parts = host.split('.');
    if (parts.length > 2) {
      companyCode = parts[0];
    }
  }



  

  // 3. Allow bypass for public/system/master provisioning routes that run on the Master DB
  const isMasterRoute = req.path.startsWith('/system') || 
                        req.path.startsWith('/api/system') || 
                        req.path.includes('/provision') ||
                        req.path.includes('/super-admin');
  if (isMasterRoute) {
    return next();
  }

  if (!companyCode) {
    return res.status(400).json({
      success: false,
      error: 'Tenant context error: Missing X-Company-Code header or subdomain routing identifier.'
    });
  }

  try {
    // 4. Resolve the tenant connection pool
    const tenantDb = await getTenantConnection(companyCode);

    // Attach details to Request context for controllers
    req.companyCode = companyCode.toUpperCase();
    req.tenantDb = tenantDb;

    // 5. Run the next middleware/route handler inside the AsyncLocalStorage execution context
    tenantStorage.run(tenantDb, () => {
      next();
    });

  } catch (err) {
    console.error(`[Multi-Tenant Routing Error] ${companyCode}:`, err.message);
    return res.status(403).json({
      success: false,
      error: `Database routing context error: ${err.message}`
    });
  }
};

module.exports = tenantMiddleware;
