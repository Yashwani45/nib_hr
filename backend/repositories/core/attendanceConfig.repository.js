// backend/repositories/core/attendanceConfig.repository.js
const { masterSequelize, tenantStorage, sequelize } = require('../../config/database');
const { getTenantConnection } = require('../../config/connectionManager');
const { v4: uuidv4 } = require('uuid');

class AttendanceConfigRepository {
  getActiveDb() {
    return tenantStorage.getStore() || sequelize;
  }

  /**
   * Retrieves organization attendance configuration with all methods.
   */
  async getConfigWithMethods(companyIdentifier) {
    const activeDb = this.getActiveDb();
    const cleanId = String(companyIdentifier || '').trim();

    // Self-healing migration for method_type column to support all 9 registration ways
    await activeDb.query('ALTER TABLE org_attendance_methods MODIFY COLUMN method_type VARCHAR(50) NOT NULL').catch(() => {});

    // 1. Try querying active tenant DB
    let configs = [];
    try {
      [configs] = await activeDb.query(
        `SELECT * FROM org_attendance_configs 
         WHERE company_id = ? OR company_code = ? OR company_name = ? 
         ORDER BY created_at DESC LIMIT 1`,
        { replacements: [cleanId, cleanId, cleanId] }
      );
    } catch (e) {}

    // Fallback: If not found in activeDb, try masterSequelize
    if ((!configs || configs.length === 0) && activeDb !== masterSequelize) {
      try {
        [configs] = await masterSequelize.query(
          `SELECT * FROM org_attendance_configs 
           WHERE company_id = ? OR company_code = ? OR company_name = ? 
           ORDER BY created_at DESC LIMIT 1`,
          { replacements: [cleanId, cleanId, cleanId] }
        );
      } catch (e) {}
    }

    // Fallback: If still not found, check if companyIdentifier is a tenant and find the first config in activeDb
    if (!configs || configs.length === 0) {
      try {
        [configs] = await activeDb.query(`SELECT * FROM org_attendance_configs LIMIT 1`);
      } catch (e) {}
    }

    if (!configs || configs.length === 0) {
      return null;
    }

    const config = configs[0];

    // Fetch methods from activeDb (or masterSequelize if activeDb lacks them)
    let methods = [];
    try {
      [methods] = await activeDb.query(
        `SELECT id, config_id, method_type, is_enabled, settings, created_at, updated_at 
         FROM org_attendance_methods 
         WHERE config_id = ? 
         ORDER BY method_type ASC`,
        { replacements: [config.id] }
      );
    } catch (e) {}

    if ((!methods || methods.length === 0) && activeDb !== masterSequelize) {
      try {
        [methods] = await masterSequelize.query(
          `SELECT id, config_id, method_type, is_enabled, settings, created_at, updated_at 
           FROM org_attendance_methods 
           WHERE config_id = ? 
           ORDER BY method_type ASC`,
          { replacements: [config.id] }
        );
      } catch (e) {}
    }

    // Parse JSON settings
    const parsedMethods = (methods || []).map(m => {
      let parsedSettings = m.settings;
      if (typeof parsedSettings === 'string') {
        try {
          parsedSettings = JSON.parse(parsedSettings);
        } catch (e) {}
      }
      return {
        ...m,
        is_enabled: Boolean(m.is_enabled),
        settings: parsedSettings || {},
      };
    });

    return {
      ...config,
      is_active: Boolean(config.is_active),
      methods: parsedMethods,
    };
  }

  /**
   * Upserts organization attendance config and its methods.
   */
  async upsertConfig(companyIdentifier, methodsPayload, companyDetails = {}) {
    const cleanId = String(companyIdentifier || '').trim();
    let config = await this.getConfigWithMethods(cleanId);

    const configId = config ? config.id : uuidv4();
    const companyId = companyDetails.companyId || config?.company_id || cleanId;
    const companyCode = companyDetails.companyCode || config?.company_code || cleanId;
    const companyName = companyDetails.companyName || config?.company_name || cleanId;

    const targetDbs = [this.getActiveDb()];
    if (this.getActiveDb() !== masterSequelize) {
      targetDbs.push(masterSequelize);
    }

    // Also get tenant-specific DB connection if identifiable
    try {
      const tenantConn = await getTenantConnection(companyCode);
      if (tenantConn && !targetDbs.includes(tenantConn)) {
        targetDbs.push(tenantConn);
      }
    } catch (e) {}

    for (const db of targetDbs) {
      try {
        await db.query('ALTER TABLE org_attendance_methods MODIFY COLUMN method_type VARCHAR(50) NOT NULL').catch(() => {});

        // Upsert master config record
        await db.query(
          `INSERT INTO org_attendance_configs (id, company_id, company_code, company_name, is_active)
           VALUES (?, ?, ?, ?, 1)
           ON DUPLICATE KEY UPDATE company_code = VALUES(company_code), company_name = VALUES(company_name), is_active = VALUES(is_active)`,
          { replacements: [configId, companyId, companyCode, companyName] }
        );

        // Upsert each method
        for (const [methodType, details] of Object.entries(methodsPayload)) {
          const isEnabled = details.isEnabled !== undefined ? (details.isEnabled ? 1 : 0) : (details.is_enabled ? 1 : 0);
          const settingsJson = JSON.stringify(details.settings || {});
          const methodId = uuidv4();

          await db.query(
            `INSERT INTO org_attendance_methods (id, config_id, method_type, is_enabled, settings)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled), settings = VALUES(settings)`,
            { replacements: [methodId, configId, methodType.toUpperCase(), isEnabled, settingsJson] }
          );
        }
      } catch (err) {
        console.error(`[AttendanceConfigRepository] Failed writing to db:`, err.message);
      }
    }

    return await this.getConfigWithMethods(companyCode);
  }
}

module.exports = new AttendanceConfigRepository();
