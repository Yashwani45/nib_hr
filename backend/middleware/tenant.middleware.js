// backend/middleware/tenant.middleware.js
const { getTenantConnection } = require('../config/connectionManager');
const { tenantStorage, masterSequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

const tenantMiddleware = async (req, res, next) => {
  // 1. Extract Company Code / Tenant Identifier
  let companyCode = req.headers['x-company-code'] || req.headers['x-tenant-id'] || req.headers['tenant-id'] || req.headers['x-company-id'];
  if (companyCode && typeof companyCode === 'string' && companyCode.includes('%')) {
    try { companyCode = decodeURIComponent(companyCode); } catch (e) {}
  }

  // 1.1 Fallback to authenticated user token context if available
  if (!companyCode && req.user) {
    companyCode = req.user.tenantDb || req.user.companyCode || req.user.company_code || req.user.companyName;
  }

  // 1.2 Fallback to subdomain routing (e.g., NIB01.nibhrms.com)
  if (!companyCode) {
    const host = req.headers.host || '';
    const parts = host.split('.');
    if (parts.length > 2 && !['www', 'api', 'localhost', '127'].includes(parts[0].toLowerCase())) {
      companyCode = parts[0];
    }
  }

  // 1.3 Fallback to request query parameter or body
  if (!companyCode) {
    companyCode = req.query?.companyCode || req.body?.companyCode;
  }

  // 1.4 Fallback for QR scan routes: extract tenant directly from QR token payload
  if (!companyCode && req.body?.qrToken) {
    try {
      const tokenParts = String(req.body.qrToken).trim().split('.');
      if (tokenParts.length >= 2) {
        const parsed = JSON.parse(Buffer.from(tokenParts[0], 'base64url').toString('utf8'));
        if (parsed?.companyCode || parsed?.org) {
          companyCode = parsed.companyCode || parsed.org;
        }
      }
    } catch (e) {}
  }

  // 2. System and master provisioning routes run directly on Master DB
  const currentUrl = req.originalUrl || req.path || '';
  const isMasterRoute = currentUrl.startsWith('/system') || 
                        currentUrl.startsWith('/api/system') || 
                        currentUrl.includes('/provision') ||
                        (currentUrl.includes('/super-admin') && !currentUrl.includes('/live-data') && !currentUrl.includes('/branches'));
  if (isMasterRoute && !companyCode) {
    return next();
  }

  // 3. Fallback for attendance & employee-qr & table routes when context is unspecified or default
  if ((!companyCode || companyCode === 'system_master_db' || companyCode === 'DEFAULT') && 
      (currentUrl.includes('/employee-qr') || currentUrl.includes('/attendance') || currentUrl.includes('/table/'))) {
    // Check if there is an active tenant in master registry
    try {
      const [tenants] = await masterSequelize.query(`SELECT id, db_name FROM tenants WHERE status = 'Active' LIMIT 1`);
      if (tenants && tenants.length > 0) {
        companyCode = tenants[0].id;
      }
    } catch (e) {}
  }

  if (!companyCode) {
    return res.status(400).json({
      success: false,
      error: 'Tenant context error: Missing X-Company-Code header or company identifier.'
    });
  }

  try {
    // 4. Resolve the tenant connection pool securely
    const tenantDb = await getTenantConnection(companyCode);

    req.companyCode = String(companyCode).trim();
    req.tenantDb = tenantDb;

    // 5. Extract and Validate Branch Context
    const rawBranchId = req.headers['x-branch-id'] || req.query?.branchId || null;
    const rawBranchCode = req.headers['x-branch-code'] || req.query?.branchCode || null;
    let rawBranchName = req.headers['x-branch-name'] || req.query?.branchName || null;
    if (rawBranchName && rawBranchName.includes('%')) {
      try { rawBranchName = decodeURIComponent(rawBranchName); } catch (e) {}
    }

    if (rawBranchId && String(rawBranchId).toUpperCase() !== 'ALL') {
      // Validate that this branch actually belongs to the current company's tenant database
      let branchRecord = null;
      try {
        const branchRows = await tenantDb.query(
          `SELECT id, 
                  COALESCE(NULLIF(branch_code, ''), branchCode) as branch_code, 
                  COALESCE(NULLIF(branch_name, ''), branchName) as branch_name 
           FROM branches 
           WHERE (id = :id 
              OR branch_code = :code 
              OR branchCode = :code 
              OR branch_name = :name 
              OR branchName = :name) 
             AND deleted_at IS NULL 
           LIMIT 1`,
          {
            replacements: {
              id: rawBranchId,
              code: rawBranchCode || rawBranchId,
              name: rawBranchName || rawBranchId
            },
            type: QueryTypes.SELECT
          }
        );
        if (branchRows && branchRows.length > 0) {
          branchRecord = branchRows[0];
        }
      } catch (branchLookupErr) {
        logger.warn(`[Branch Validation Notice] ${branchLookupErr.message}`);
      }

      if (branchRecord) {
        req.branchId = branchRecord.id;
        req.branchName = branchRecord.branch_name || rawBranchName;
        req.branchCode = branchRecord.branch_code || rawBranchCode;
        req.isAllBranches = false;
      } else {
        // If client sent an explicit branch ID that does not exist in this company,
        // gracefully fall back to all branches instead of deadlocking the frontend with 404
        req.branchId = null;
        req.branchName = null;
        req.branchCode = null;
        req.isAllBranches = true;
      }
    } else {
      req.branchId = null;
      req.branchName = null;
      req.branchCode = null;
      req.isAllBranches = true;
    }

    // 6. Run the next middleware/route handler inside the AsyncLocalStorage execution context
    tenantStorage.run(tenantDb, () => {
      next();
    });

  } catch (err) {
    console.error(`[Multi-Tenant Routing Error] ${companyCode}:`, err.message);
    const isNotFound = err.message.includes('not registered') || err.message.includes('unavailable') || err.message.includes('deactivated');
    return res.status(isNotFound ? 404 : 503).json({
      success: false,
      error: `Database routing context error: ${err.message}`
    });
  }
};

module.exports = tenantMiddleware;
