// backend/services/core/document.provisioner.js
const { QueryTypes } = require('sequelize');

async function provisionDocumentTables(tenantDb) {
  try {
    // 1. Create document_types
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`document_types\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`code\` VARCHAR(50) NOT NULL UNIQUE,
        \`name\` VARCHAR(100) NOT NULL,
        \`description\` TEXT,
        \`category\` VARCHAR(100) DEFAULT 'Other',
        \`requires_approval\` TINYINT(1) DEFAULT 0,
        \`requires_acknowledgement\` TINYINT(1) DEFAULT 0,
        \`requires_acceptance\` TINYINT(1) DEFAULT 0,
        \`requires_signature\` TINYINT(1) DEFAULT 0,
        \`has_expiry\` TINYINT(1) DEFAULT 0,
        \`default_expiry_days\` INT DEFAULT 0,
        \`allow_download\` TINYINT(1) DEFAULT 1,
        \`allow_employee_reject\` TINYINT(1) DEFAULT 0,
        \`template_required\` TINYINT(1) DEFAULT 0,
        \`status\` VARCHAR(20) DEFAULT 'Active',
        \`created_by\` VARCHAR(100),
        \`updated_by\` VARCHAR(100),
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Create document_templates
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`document_templates\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`template_code\` VARCHAR(50) NOT NULL UNIQUE,
        \`template_name\` VARCHAR(100) NOT NULL,
        \`document_type_id\` CHAR(36) NOT NULL,
        \`company_id\` VARCHAR(50) DEFAULT 'All',
        \`template_file\` VARCHAR(255),
        \`template_content\` LONGTEXT,
        \`version\` VARCHAR(20) DEFAULT '1.0',
        \`status\` VARCHAR(20) DEFAULT 'Active',
        \`created_by\` VARCHAR(100),
        \`updated_by\` VARCHAR(100),
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL,
        FOREIGN KEY (\`document_type_id\`) REFERENCES \`document_types\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Create documents
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`documents\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`document_number\` VARCHAR(50) NOT NULL UNIQUE,
        \`document_type_id\` CHAR(36) NOT NULL,
        \`template_id\` CHAR(36) NULL,
        \`company_id\` CHAR(36) NULL,
        \`branch_id\` CHAR(36) NULL,
        \`department_id\` CHAR(36) NULL,
        \`department\` VARCHAR(255) NULL,
        \`employee_id\` VARCHAR(50) NULL,
        \`employee_name\` VARCHAR(255) NULL,
        \`candidate_id\` VARCHAR(50) NULL,
        \`title\` VARCHAR(200) NOT NULL,
        \`description\` TEXT,
        \`current_version_id\` CHAR(36) NULL,
        \`file_name\` VARCHAR(255) NULL,
        \`original_file_name\` VARCHAR(255) NULL,
        \`storage_key\` VARCHAR(500) NULL,
        \`file_url\` TEXT NULL,
        \`storage_provider\` VARCHAR(50) DEFAULT 'local',
        \`mime_type\` VARCHAR(100) NULL,
        \`file_size\` INT DEFAULT 0,
        \`file_hash\` VARCHAR(64) NULL,
        \`issue_date\` VARCHAR(20) NULL,
        \`effective_date\` VARCHAR(20) NULL,
        \`expiry_date\` VARCHAR(20) NULL,
        \`status\` VARCHAR(30) DEFAULT 'Draft',
        \`verification_id\` VARCHAR(50) UNIQUE NULL,
        \`approved_by\` VARCHAR(100) NULL,
        \`approved_at\` TIMESTAMP NULL,
        \`issued_by\` VARCHAR(100) NULL,
        \`issued_at\` TIMESTAMP NULL,
        \`created_by\` VARCHAR(100),
        \`updated_by\` VARCHAR(100),
        \`remarks\` TEXT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL,
        FOREIGN KEY (\`document_type_id\`) REFERENCES \`document_types\`(\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Self-healing columns for documents table
    try {
      const docCols = await tenantDb.query("SHOW COLUMNS FROM `documents`", { type: QueryTypes.SELECT });
      const docColNames = (docCols || []).map(c => c.Field.toLowerCase());
      if (!docColNames.includes('employee_name')) {
        await tenantDb.query("ALTER TABLE `documents` ADD COLUMN `employee_name` VARCHAR(255) NULL").catch(() => {});
      }
      if (!docColNames.includes('department')) {
        await tenantDb.query("ALTER TABLE `documents` ADD COLUMN `department` VARCHAR(255) NULL").catch(() => {});
      }
      if (!docColNames.includes('file_url')) {
        await tenantDb.query("ALTER TABLE `documents` ADD COLUMN `file_url` TEXT NULL").catch(() => {});
      }
    } catch (dhErr) {}

    // 4. Create document_versions
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`document_versions\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`document_id\` CHAR(36) NOT NULL,
        \`version_number\` INT NOT NULL,
        \`file_name\` VARCHAR(255) NOT NULL,
        \`original_file_name\` VARCHAR(255) NOT NULL,
        \`storage_key\` VARCHAR(500) NOT NULL,
        \`storage_provider\` VARCHAR(50) DEFAULT 'local',
        \`mime_type\` VARCHAR(100) NOT NULL,
        \`file_size\` INT DEFAULT 0,
        \`file_hash\` VARCHAR(64) NOT NULL,
        \`change_reason\` TEXT,
        \`status\` VARCHAR(20) DEFAULT 'Active',
        \`created_by\` VARCHAR(100),
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (\`document_id\`) REFERENCES \`documents\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Create document_approvals
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`document_approvals\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`document_id\` CHAR(36) NOT NULL,
        \`version_id\` CHAR(36) NOT NULL,
        \`approval_level\` INT NOT NULL,
        \`approver_role_id\` CHAR(36) NULL,
        \`approver_user_id\` CHAR(36) NULL,
        \`status\` VARCHAR(20) DEFAULT 'Pending',
        \`comments\` TEXT,
        \`rejection_reason\` TEXT,
        \`action_date\` TIMESTAMP NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`document_id\`) REFERENCES \`documents\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`version_id\`) REFERENCES \`document_versions\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 6. Create document_assignments
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`document_assignments\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`document_id\` CHAR(36) NOT NULL,
        \`employee_id\` VARCHAR(50) NULL,
        \`candidate_id\` VARCHAR(50) NULL,
        \`access_type\` VARCHAR(20) DEFAULT 'View',
        \`visibility_status\` VARCHAR(20) DEFAULT 'Visible',
        \`issued_at\` TIMESTAMP NULL,
        \`viewed_at\` TIMESTAMP NULL,
        \`downloaded_at\` TIMESTAMP NULL,
        \`accepted_at\` TIMESTAMP NULL,
        \`rejected_at\` TIMESTAMP NULL,
        \`rejection_reason\` TEXT NULL,
        \`acknowledged_at\` TIMESTAMP NULL,
        \`signed_at\` TIMESTAMP NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL,
        FOREIGN KEY (\`document_id\`) REFERENCES \`documents\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 7. Create document_acknowledgements
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`document_acknowledgements\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`document_id\` CHAR(36) NOT NULL,
        \`version_id\` CHAR(36) NOT NULL,
        \`employee_id\` VARCHAR(50) NOT NULL,
        \`status\` VARCHAR(30) DEFAULT 'Acknowledged',
        \`acknowledged_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`document_id\`) REFERENCES \`documents\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`version_id\`) REFERENCES \`document_versions\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 8. Create document_signatures
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`document_signatures\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`document_id\` CHAR(36) NOT NULL,
        \`version_id\` CHAR(36) NOT NULL,
        \`signer_id\` VARCHAR(50) NOT NULL,
        \`signer_type\` VARCHAR(20) DEFAULT 'Employee',
        \`signature_method\` VARCHAR(50) DEFAULT 'E-Sign',
        \`signature_reference\` VARCHAR(100) NOT NULL,
        \`signed_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`document_id\`) REFERENCES \`documents\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`version_id\`) REFERENCES \`document_versions\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 9. Create document_verifications
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`document_verifications\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`document_id\` CHAR(36) NOT NULL,
        \`verification_id\` VARCHAR(50) NOT NULL UNIQUE,
        \`status\` VARCHAR(30) NOT NULL,
        \`verification_count\` INT DEFAULT 0,
        \`verified_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`document_id\`) REFERENCES \`documents\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 10. Create document_access_logs
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`document_access_logs\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`document_id\` CHAR(36) NOT NULL,
        \`user_id\` VARCHAR(50) NOT NULL,
        \`action\` VARCHAR(50) NOT NULL,
        \`ip_address\` VARCHAR(45) NULL,
        \`user_agent\` VARCHAR(500) NULL,
        \`status\` VARCHAR(20) DEFAULT 'Success',
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`document_id\`) REFERENCES \`documents\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Pre-seed default document types if missing
    const crypto = require('crypto');
    const seedTypes = [
      { code: 'OFFER', name: 'Offer Letter', category: 'Offer Letter', requires_approval: 1, requires_acknowledgement: 1, requires_acceptance: 1, requires_signature: 1 },
      { code: 'CONTRACT', name: 'Employment Contract', category: 'Contract', requires_approval: 1, requires_acknowledgement: 1, requires_acceptance: 1, requires_signature: 1 },
      { code: 'POLICY', name: 'Company Policy', category: 'Policy', requires_approval: 0, requires_acknowledgement: 1, requires_acceptance: 0, requires_signature: 0 },
      { code: 'AADHAAR', name: 'Aadhar Card', category: 'Identification', requires_approval: 1, requires_acknowledgement: 0, requires_acceptance: 0, requires_signature: 0 },
      { code: 'PAN', name: 'PAN Card', category: 'Identification', requires_approval: 1, requires_acknowledgement: 0, requires_acceptance: 0, requires_signature: 0 },
      { code: '10TH_MARKSHEET', name: '10th Marksheet', category: 'Education', requires_approval: 1, requires_acknowledgement: 0, requires_acceptance: 0, requires_signature: 0 },
      { code: '12TH_MARKSHEET', name: '12th Marksheet', category: 'Education', requires_approval: 1, requires_acknowledgement: 0, requires_acceptance: 0, requires_signature: 0 },
      { code: 'DEGREE', name: 'Degree Certificate', category: 'Education', requires_approval: 1, requires_acknowledgement: 0, requires_acceptance: 0, requires_signature: 0 },
      { code: 'EXPERIENCE', name: 'Experience Letter', category: 'Experience', requires_approval: 1, requires_acknowledgement: 0, requires_acceptance: 0, requires_signature: 0 },
      { code: 'RESUME', name: 'Resume', category: 'Profile', requires_approval: 1, requires_acknowledgement: 0, requires_acceptance: 0, requires_signature: 0 },
      { code: 'OTHER', name: 'Other Document', category: 'General', requires_approval: 1, requires_acknowledgement: 0, requires_acceptance: 0, requires_signature: 0 }
    ];

    for (const t of seedTypes) {
      const [existing] = await tenantDb.query('SELECT id FROM `document_types` WHERE code = ? OR LOWER(name) = LOWER(?) LIMIT 1', {
        replacements: [t.code, t.name],
        type: QueryTypes.SELECT
      }).catch(() => [null]);

      if (!existing) {
        await tenantDb.query(`
          INSERT INTO \`document_types\` (id, code, name, description, category, requires_approval, requires_acknowledgement, requires_acceptance, requires_signature, status, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', 'System Seed')
        `, [
          crypto.randomUUID(), t.code, t.name, `${t.name} official employee document type.`, t.category, t.requires_approval, t.requires_acknowledgement, t.requires_acceptance, t.requires_signature
        ]).catch(() => {});
      }
    }

    const [templatesCount] = await tenantDb.query('SELECT COUNT(*) as count FROM `document_templates`', { type: QueryTypes.SELECT });
    if (templatesCount && (Number(templatesCount.count) === 0 || templatesCount.count === 0)) {
      const crypto = require('crypto');
      const types = await tenantDb.query('SELECT id, code, name FROM `document_types`', { type: QueryTypes.SELECT });
      for (const type of types) {
        let content = '';
        if (type.code === 'OFFER') {
          content = `Dear {{employee_name}},\n\nWe are pleased to offer you employment at Yashtech Pvt Ltd as a {{designation}} in the {{department}} department. Your joining date will be {{joining_date}} and your salary will be {{salary}}.\n\nBest Regards,\nHiring Team`;
        } else if (type.code === 'CONTRACT') {
          content = `Employment Agreement:\n\nThis contract is entered between Yashtech Pvt Ltd and {{employee_name}} (Employee Code: {{employee_code}}). Designation: {{designation}}. Effective Date: {{effective_date}}.`;
        } else {
          content = `Company Policy:\n\nStandard guidelines and protocols for all team members at Yashtech Pvt Ltd.`;
        }
        await tenantDb.query(`
          INSERT INTO \`document_templates\` (id, template_code, template_name, document_type_id, company_id, template_content, version, status, created_by)
          VALUES (?, ?, ?, ?, 'All', ?, '1.0', 'Active', 'System Seed')
        `, [
          crypto.randomUUID(), `${type.code}_DEFAULT`, `Default ${type.name} Template`, type.id, content
        ]);
      }
      console.log('[Document Provisioner] Templates seeding completed.');
    }

  } catch (err) {
    console.error('[Document Provisioner] Failed to provision tables:', err);
    throw err;
  }
}

module.exports = { provisionDocumentTables };
