// backend/services/core/document.service.js
const { QueryTypes } = require('sequelize');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const ApiError = require('../../utils/apiError');
const auditLogService = require('./auditLog.service');

class DocumentService {
  async saveFileSecurely(tempFilePath, companyId, employeeOrCandidateId, docTypeCode, docId, versionNum, originalFilename) {
    const fileHash = await this.calculateSHA256(tempFilePath);
    const stats = fs.statSync(tempFilePath);
    const fileSize = stats.size;
    const mimeType = this.getMimeType(originalFilename);

    const year = new Date().getFullYear();
    const relativeDir = path.join(
      'documents',
      String(companyId),
      String(employeeOrCandidateId),
      String(docTypeCode),
      String(year),
      String(docId),
      String(versionNum)
    );

    const secureStorageDir = path.join(__dirname, '../../uploads', relativeDir);
    if (!fs.existsSync(secureStorageDir)) {
      fs.mkdirSync(secureStorageDir, { recursive: true });
    }

    const uniqueFilename = `${Date.now()}-${originalFilename}`;
    const destinationPath = path.join(secureStorageDir, uniqueFilename);
    fs.copyFileSync(tempFilePath, destinationPath);
    fs.unlinkSync(tempFilePath);

    const storageKey = path.join(relativeDir, uniqueFilename).replace(/\\/g, '/');

    return {
      fileName: uniqueFilename,
      originalFileName: originalFilename,
      storageKey,
      storageProvider: 'local',
      mimeType,
      fileSize,
      fileHash
    };
  }

  calculateSHA256(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', err => reject(err));
    });
  }

  getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg'
    };
    return mimes[ext] || 'application/octet-stream';
  }

  async getDashboardStats(tenantDb) {
    const { provisionDocumentTables } = require('./document.provisioner');
    await provisionDocumentTables(tenantDb).catch(() => {});

    const stats = {};
    const executeCount = async (sql, replacements = []) => {
      const res = await tenantDb.query(sql, { replacements, type: QueryTypes.SELECT }).catch(() => []);
      return res && res[0] ? Object.values(res[0])[0] : 0;
    };

    stats.total = await executeCount('SELECT COUNT(*) FROM `documents` WHERE deleted_at IS NULL');
    stats.draft = await executeCount("SELECT COUNT(*) FROM `documents` WHERE status = 'Draft' AND deleted_at IS NULL");
    stats.pendingApproval = await executeCount("SELECT COUNT(*) FROM `documents` WHERE status = 'Pending Approval' AND deleted_at IS NULL");
    stats.approved = await executeCount("SELECT COUNT(*) FROM `documents` WHERE status = 'Approved' AND deleted_at IS NULL");
    stats.issued = await executeCount("SELECT COUNT(*) FROM `documents` WHERE status = 'Issued' AND deleted_at IS NULL");
    stats.expired = await executeCount("SELECT COUNT(*) FROM `documents` WHERE status = 'Expired' AND deleted_at IS NULL");
    stats.archived = await executeCount("SELECT COUNT(*) FROM `documents` WHERE status = 'Archived' AND deleted_at IS NULL");

    stats.pendingEmployeeAction = await executeCount(`
      SELECT COUNT(*) FROM \`document_assignments\` 
      WHERE accepted_at IS NULL AND acknowledged_at IS NULL AND signed_at IS NULL AND rejected_at IS NULL AND deleted_at IS NULL
    `);
    stats.acknowledged = await executeCount("SELECT COUNT(*) FROM `document_assignments` WHERE acknowledged_at IS NOT NULL AND deleted_at IS NULL");
    stats.rejected = await executeCount("SELECT COUNT(*) FROM `document_assignments` WHERE rejected_at IS NOT NULL AND deleted_at IS NULL");
    
    stats.expiringSoon = await executeCount(`
      SELECT COUNT(*) FROM \`documents\` 
      WHERE status = 'Issued' 
        AND expiry_date IS NOT NULL 
        AND STR_TO_DATE(expiry_date, '%Y-%m-%d') BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) 
        AND deleted_at IS NULL
    `);

    return stats;
  }

  async getDocumentTypes(tenantDb) {
    const { provisionDocumentTables } = require('./document.provisioner');
    await provisionDocumentTables(tenantDb).catch(() => {});
    return await tenantDb.query('SELECT * FROM `document_types` WHERE deleted_at IS NULL ORDER BY name ASC', { type: QueryTypes.SELECT }).catch(() => []);
  }

  async createDocumentType(tenantDb, data, user) {
    const id = crypto.randomUUID();
    await tenantDb.query(`
      INSERT INTO \`document_types\` 
      (id, code, name, description, category, requires_approval, requires_acknowledgement, requires_acceptance, requires_signature, has_expiry, default_expiry_days, allow_download, allow_employee_reject, template_required, status, created_by)
      VALUES (:id, :code, :name, :description, :category, :requires_approval, :requires_acknowledgement, :requires_acceptance, :requires_signature, :has_expiry, :default_expiry_days, :allow_download, :allow_employee_reject, :template_required, :status, :created_by)
    `, {
      replacements: {
        id,
        code: data.code,
        name: data.name,
        description: data.description || null,
        category: data.category || 'Other',
        requires_approval: data.requires_approval || 0,
        requires_acknowledgement: data.requires_acknowledgement || 0,
        requires_acceptance: data.requires_acceptance || 0,
        requires_signature: data.requires_signature || 0,
        has_expiry: data.has_expiry || 0,
        default_expiry_days: data.default_expiry_days || 0,
        allow_download: data.allow_download || 1,
        allow_employee_reject: data.allow_employee_reject || 0,
        template_required: data.template_required || 0,
        status: data.status || 'Active',
        created_by: user.email || user.username
      }
    });
    return { id, ...data };
  }

  async updateDocumentType(tenantDb, id, data, user) {
    const updates = Object.keys(data).map(k => `\`${k}\` = :${k}`).join(', ');
    await tenantDb.query(`
      UPDATE \`document_types\` SET ${updates}, \`updated_by\` = :updated_by WHERE \`id\` = :id
    `, {
      replacements: { ...data, id, updated_by: user.email || user.username }
    });
    return true;
  }

  async getTemplates(tenantDb) {
    return await tenantDb.query(`
      SELECT t.*, dt.name as document_type_name 
      FROM \`document_templates\` t
      LEFT JOIN \`document_types\` dt ON t.document_type_id = dt.id
      WHERE t.deleted_at IS NULL 
      ORDER BY t.template_name ASC
    `, { type: QueryTypes.SELECT });
  }

  async createTemplate(tenantDb, data, user) {
    const id = crypto.randomUUID();
    await tenantDb.query(`
      INSERT INTO \`document_templates\` 
      (id, template_code, template_name, document_type_id, company_id, template_file, template_content, version, status, created_by)
      VALUES (:id, :template_code, :template_name, :document_type_id, :company_id, :template_file, :template_content, :version, :status, :created_by)
    `, {
      replacements: {
        id,
        template_code: data.template_code,
        template_name: data.template_name,
        document_type_id: data.document_type_id,
        company_id: data.company_id || 'All',
        template_file: data.template_file || null,
        template_content: data.template_content || '',
        version: data.version || '1.0',
        status: data.status || 'Active',
        created_by: user.email || user.username
      }
    });
    return { id, ...data };
  }

  async updateTemplate(tenantDb, id, data, user) {
    const updates = Object.keys(data).map(k => `\`${k}\` = :${k}`).join(', ');
    await tenantDb.query(`
      UPDATE \`document_templates\` SET ${updates}, \`updated_by\` = :updated_by WHERE \`id\` = :id
    `, {
      replacements: { ...data, id, updated_by: user.email || user.username }
    });
    return true;
  }

  async deleteTemplate(tenantDb, id, user) {
    await tenantDb.query('UPDATE `document_templates` SET deleted_at = NOW(), updated_by = ? WHERE id = ?', {
      replacements: [user.email || user.username, id]
    });
    return true;
  }

  async resolvePlaceholders(tenantDb, employeeId, candidateId, offerData = {}) {
    const data = {
      employee_name: 'N/A',
      employee_id: 'N/A',
      employee_code: 'N/A',
      designation: 'N/A',
      department: 'N/A',
      branch_name: 'N/A',
      company_name: 'N/A',
      reporting_manager: 'N/A',
      employment_type: 'N/A',
      joining_date: 'N/A',
      salary: 'N/A',
      ctc: 'N/A',
      offer_date: offerData.offerDate || offerData.offer_date || new Date().toISOString().split('T')[0],
      offer_expiry_date: offerData.offerExpiryDate || offerData.offer_expiry_date || 'N/A',
      effective_date: offerData.effectiveDate || offerData.effective_date || 'N/A'
    };

    if (employeeId) {
      const [emp] = await tenantDb.query(`
        SELECT e.*, c.company_name, b.branch_name, d.dept_name as department_name, des.designation_name, mgr.employee_name as mgr_name 
        FROM employees e 
        LEFT JOIN companies c ON e.company_id = c.id 
        LEFT JOIN branches b ON e.branch_id = b.id 
        LEFT JOIN departments d ON e.department_id = d.id 
        LEFT JOIN designations des ON e.designation_id = des.id 
        LEFT JOIN employees mgr ON e.manager_id = mgr.id 
        WHERE e.id = ? OR e.employeeCode = ? LIMIT 1
      `, { replacements: [employeeId, employeeId], type: QueryTypes.SELECT }).catch(() => [null]);

      if (emp) {
        data.employee_name = emp.employee_name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'N/A';
        data.employee_id = emp.id;
        data.employee_code = emp.employeeCode || emp.employee_code || emp.id;
        data.designation = emp.designation_name || emp.designation || 'N/A';
        data.department = emp.department_name || emp.department || 'N/A';
        data.branch_name = emp.branch_name || 'N/A';
        data.company_name = emp.company_name || 'N/A';
        data.reporting_manager = emp.mgr_name || 'N/A';
        data.employment_type = emp.employmentType || emp.employment_type || 'N/A';
        data.joining_date = emp.joiningDate || emp.joining_date || 'N/A';
        data.salary = emp.salary || 'N/A';
        data.ctc = emp.ctc || 'N/A';
      }
    } else if (candidateId) {
      const [cand] = await tenantDb.query(`
        SELECT * FROM candidate_database WHERE id = ? OR candidateId = ? LIMIT 1
      `, { replacements: [candidateId, candidateId], type: QueryTypes.SELECT }).catch(() => [null]);

      if (cand) {
        data.employee_name = `${cand.firstName || ''} ${cand.lastName || ''}`.trim() || 'N/A';
        data.employee_id = cand.candidateId || cand.id;
        data.employee_code = cand.candidateId || cand.id;
        data.salary = cand.expectedSalary || 'N/A';
        data.ctc = cand.expectedSalary || 'N/A';
        data.employment_type = 'Candidate';
      }
    }

    return data;
  }

  async previewGeneratedContent(tenantDb, templateId, employeeId, candidateId, offerData) {
    const [template] = await tenantDb.query('SELECT * FROM `document_templates` WHERE id = ? LIMIT 1', {
      replacements: [templateId],
      type: QueryTypes.SELECT
    });
    if (!template) throw new ApiError(404, 'Template not found.');

    const placeholders = await this.resolvePlaceholders(tenantDb, employeeId, candidateId, offerData);
    let content = template.template_content || '';

    Object.keys(placeholders).forEach(key => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      content = content.replace(regex, placeholders[key] || 'N/A');
    });

    return { content, placeholders };
  }

  async createDocument(tenantDb, data, tempFile, user) {
    const docId = crypto.randomUUID();
    const docNumber = `DOC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const verificationId = `VER-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    const companyId = data.company_id || 'All';
    const employeeOrCandidateId = data.employee_id || data.candidate_id || 'unassigned';

    let fileDetails = {};

    const [docType] = await tenantDb.query('SELECT code FROM `document_types` WHERE id = ? LIMIT 1', {
      replacements: [data.document_type_id],
      type: QueryTypes.SELECT
    });
    const docTypeCode = docType ? docType.code : 'OTHER';

    if (tempFile) {
      fileDetails = await this.saveFileSecurely(
        tempFile.path,
        companyId,
        employeeOrCandidateId,
        docTypeCode,
        docId,
        1,
        tempFile.originalname
      );
    } else if (data.template_id) {
      const preview = await this.previewGeneratedContent(tenantDb, data.template_id, data.employee_id, data.candidate_id, data);
      
      const year = new Date().getFullYear();
      const relativeDir = path.join(
        'documents',
        String(companyId),
        String(employeeOrCandidateId),
        String(docTypeCode),
        String(year),
        String(docId),
        '1'
      );
      const secureStorageDir = path.join(__dirname, '../../uploads', relativeDir);
      if (!fs.existsSync(secureStorageDir)) {
        fs.mkdirSync(secureStorageDir, { recursive: true });
      }

      const generatedFilename = `generated-doc-${Date.now()}.html`;
      const generatedPath = path.join(secureStorageDir, generatedFilename);
      fs.writeFileSync(generatedPath, preview.content);

      const stats = fs.statSync(generatedPath);
      const fileHash = crypto.createHash('sha256').update(preview.content).digest('hex');

      fileDetails = {
        fileName: generatedFilename,
        originalFileName: `${data.title || 'Document'}.html`,
        storageKey: path.join(relativeDir, generatedFilename).replace(/\\/g, '/'),
        storageProvider: 'local',
        mimeType: 'text/html',
        fileSize: stats.size,
        fileHash
      };
    } else {
      throw new ApiError(400, 'Either Template ID or File upload is required to create a document.');
    }

    const versionId = crypto.randomUUID();

    await tenantDb.query(`
      INSERT INTO \`documents\` 
      (id, document_number, document_type_id, template_id, company_id, branch_id, department_id, employee_id, candidate_id, title, description, current_version_id, file_name, original_file_name, storage_key, storage_provider, mime_type, file_size, file_hash, issue_date, effective_date, expiry_date, status, verification_id, created_by, remarks)
      VALUES (:id, :document_number, :document_type_id, :template_id, :company_id, :branch_id, :department_id, :employee_id, :candidate_id, :title, :description, :current_version_id, :file_name, :original_file_name, :storage_key, :storage_provider, :mime_type, :file_size, :file_hash, :issue_date, :effective_date, :expiry_date, 'Draft', :verification_id, :created_by, :remarks)
    `, {
      replacements: {
        id: docId,
        document_number: docNumber,
        document_type_id: data.document_type_id,
        template_id: data.template_id || null,
        company_id: data.company_id || null,
        branch_id: data.branch_id || null,
        department_id: data.department_id || null,
        employee_id: data.employee_id || null,
        candidate_id: data.candidate_id || null,
        title: data.title || 'Untitled Document',
        description: data.description || null,
        current_version_id: versionId,
        file_name: fileDetails.fileName,
        original_file_name: fileDetails.originalFileName,
        storage_key: fileDetails.storageKey,
        storage_provider: fileDetails.storageProvider,
        mime_type: fileDetails.mimeType,
        file_size: fileDetails.fileSize,
        file_hash: fileDetails.fileHash,
        issue_date: data.issue_date || null,
        effective_date: data.effective_date || null,
        expiry_date: data.expiry_date || null,
        verification_id: verificationId,
        created_by: user.email || user.username,
        remarks: data.remarks || null
      }
    });

    await tenantDb.query(`
      INSERT INTO \`document_versions\`
      (id, document_id, version_number, file_name, original_file_name, storage_key, storage_provider, mime_type, file_size, file_hash, change_reason, status, created_by)
      VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, 'Initial Creation', 'Active', ?)
    `, {
      replacements: [versionId, docId, fileDetails.fileName, fileDetails.originalFileName, fileDetails.storageKey, fileDetails.storageProvider, fileDetails.mimeType, fileDetails.fileSize, fileDetails.fileHash, user.email || user.username]
    });

    await auditLogService.log({
      userId: user.id,
      username: user.email || user.username,
      roleName: user.role?.name,
      actionType: 'Create',
      moduleName: 'DocumentManagement',
      recordId: docId,
      newValues: { docNumber, title: data.title, employeeOrCandidateId },
      status: 'Success'
    });

    return { id: docId, document_number: docNumber, current_version_id: versionId };
  }

  async updateDocument(tenantDb, id, data, tempFile, user) {
    const [doc] = await tenantDb.query('SELECT * FROM `documents` WHERE id = ? LIMIT 1', {
      replacements: [id],
      type: QueryTypes.SELECT
    });
    if (!doc) throw new ApiError(404, 'Document not found.');
    if (doc.status !== 'Draft' && doc.status !== 'Revision Required') {
      throw new ApiError(400, 'Only Draft or Revision Required documents can be modified.');
    }

    let fileDetails = {};
    if (tempFile) {
      const [docType] = await tenantDb.query('SELECT code FROM `document_types` WHERE id = ? LIMIT 1', {
        replacements: [doc.document_type_id],
        type: QueryTypes.SELECT
      });
      const docTypeCode = docType ? docType.code : 'OTHER';
      const companyId = doc.company_id || 'All';
      const employeeOrCandidateId = doc.employee_id || doc.candidate_id || 'unassigned';

      const [versions] = await tenantDb.query('SELECT COUNT(*) as count FROM `document_versions` WHERE document_id = ?', {
        replacements: [id],
        type: QueryTypes.SELECT
      });
      const newVerNum = (versions ? versions[0].count : 1) + 1;

      fileDetails = await this.saveFileSecurely(
        tempFile.path,
        companyId,
        employeeOrCandidateId,
        docTypeCode,
        id,
        newVerNum,
        tempFile.originalname
      );

      const versionId = crypto.randomUUID();

      await tenantDb.query(`
        INSERT INTO \`document_versions\`
        (id, document_id, version_number, file_name, original_file_name, storage_key, storage_provider, mime_type, file_size, file_hash, change_reason, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Document Updated', 'Active', ?)
      `, {
        replacements: [versionId, id, newVerNum, fileDetails.fileName, fileDetails.originalFileName, fileDetails.storageKey, fileDetails.storageProvider, fileDetails.mimeType, fileDetails.fileSize, fileDetails.fileHash, user.email || user.username]
      });

      data.current_version_id = versionId;
      data.file_name = fileDetails.fileName;
      data.original_file_name = fileDetails.originalFileName;
      data.storage_key = fileDetails.storageKey;
      data.storage_provider = fileDetails.storageProvider;
      data.mime_type = fileDetails.mimeType;
      data.file_size = fileDetails.fileSize;
      data.file_hash = fileDetails.fileHash;
    }

    const updates = Object.keys(data).map(k => `\`${k}\` = :${k}`).join(', ');
    await tenantDb.query(`
      UPDATE \`documents\` SET ${updates}, \`updated_by\` = :updated_by WHERE \`id\` = :id
    `, {
      replacements: { ...data, id, updated_by: user.email || user.username }
    });

    return true;
  }

  async submitForApproval(tenantDb, id, user) {
    const [doc] = await tenantDb.query('SELECT * FROM `documents` WHERE id = ? LIMIT 1', {
      replacements: [id],
      type: QueryTypes.SELECT
    });
    if (!doc) throw new ApiError(404, 'Document not found.');

    await tenantDb.query("UPDATE `documents` SET status = 'Pending Approval' WHERE id = ?", { replacements: [id] });

    const approvalId = crypto.randomUUID();
    await tenantDb.query(`
      INSERT INTO \`document_approvals\` 
      (id, document_id, version_id, approval_level, approver_role_id, status)
      VALUES (?, ?, ?, 1, NULL, 'Pending')
    `, {
      replacements: [approvalId, id, doc.current_version_id]
    });

    return true;
  }

  async approveDocument(tenantDb, id, comments, user) {
    const [doc] = await tenantDb.query('SELECT * FROM `documents` WHERE id = ? LIMIT 1', {
      replacements: [id],
      type: QueryTypes.SELECT
    });
    if (!doc) throw new ApiError(404, 'Document not found.');

    await tenantDb.query("UPDATE `documents` SET status = 'Approved', approved_by = ?, approved_at = NOW() WHERE id = ?", {
      replacements: [user.email || user.username, id]
    });

    await tenantDb.query(`
      UPDATE \`document_approvals\` 
      SET status = 'Approved', comments = ?, action_date = NOW(), approver_user_id = ?
      WHERE document_id = ? AND status = 'Pending'
    `, {
      replacements: [comments || 'Approved by HR', user.id, id]
    });

    return true;
  }

  async rejectDocument(tenantDb, id, reason, user) {
    const [doc] = await tenantDb.query('SELECT * FROM `documents` WHERE id = ? LIMIT 1', {
      replacements: [id],
      type: QueryTypes.SELECT
    });
    if (!doc) throw new ApiError(404, 'Document not found.');

    await tenantDb.query("UPDATE `documents` SET status = 'Revision Required' WHERE id = ?", { replacements: [id] });

    await tenantDb.query(`
      UPDATE \`document_approvals\` 
      SET status = 'Rejected', rejection_reason = ?, action_date = NOW(), approver_user_id = ?
      WHERE document_id = ? AND status = 'Pending'
    `, {
      replacements: [reason || 'Revision required', user.id, id]
    });

    return true;
  }

  async issueDocument(tenantDb, id, user) {
    const [doc] = await tenantDb.query('SELECT * FROM `documents` WHERE id = ? LIMIT 1', {
      replacements: [id],
      type: QueryTypes.SELECT
    });
    if (!doc) throw new ApiError(404, 'Document not found.');
    if (doc.status !== 'Approved') throw new ApiError(400, 'Only Approved documents can be issued.');

    const transaction = await tenantDb.transaction();
    try {
      await tenantDb.query(`
        UPDATE \`documents\` 
        SET status = 'Issued', issued_by = ?, issued_at = NOW() 
        WHERE id = ?
      `, {
        replacements: [user.email || user.username, id],
        transaction
      });

      const assignId = crypto.randomUUID();
      await tenantDb.query(`
        INSERT INTO \`document_assignments\` 
        (id, document_id, employee_id, candidate_id, access_type, visibility_status, issued_at)
        VALUES (?, ?, ?, ?, 'View', 'Visible', NOW())
      `, {
        replacements: [assignId, id, doc.employee_id, doc.candidate_id],
        transaction
      });

      let recipientUserId = null;
      if (doc.employee_id) {
        const [emp] = await tenantDb.query('SELECT user_id FROM employees WHERE id = ? OR employeeCode = ? LIMIT 1', {
          replacements: [doc.employee_id, doc.employee_id],
          type: QueryTypes.SELECT,
          transaction
        });
        if (emp) recipientUserId = emp.user_id;
      }

      if (recipientUserId) {
        await tenantDb.query(`
          INSERT INTO \`notifications\` (recipientId, title, message, type, isRead)
          VALUES (?, 'New Document Issued', ?, 'Document', 0)
        `, {
          replacements: [recipientUserId, `A new document titled "${doc.title}" has been issued to you. Please view and acknowledge it under My Documents.`],
          transaction
        });
      }

      await transaction.commit();
      return true;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async getEmployeeDocuments(tenantDb, employeeCode) {
    return await tenantDb.query(`
      SELECT d.*, dt.name as document_type_name, da.viewed_at, da.downloaded_at, da.acknowledged_at, da.accepted_at, da.rejected_at, da.rejection_reason, da.signed_at 
      FROM \`documents\` d
      INNER JOIN \`document_assignments\` da ON d.id = da.document_id
      LEFT JOIN \`document_types\` dt ON d.document_type_id = dt.id
      WHERE (d.employee_id = :empCode OR da.employee_id = :empCode)
        AND d.status = 'Issued'
        AND d.deleted_at IS NULL
      ORDER BY d.created_at DESC
    `, {
      replacements: { empCode: employeeCode },
      type: QueryTypes.SELECT
    });
  }

  async recordEmployeeAction(tenantDb, docId, employeeCode, actionType, extraData = {}) {
    const assignments = await tenantDb.query(
      'SELECT * FROM `document_assignments` WHERE document_id = ? AND (employee_id = ? OR candidate_id = ?) LIMIT 1',
      { replacements: [docId, employeeCode, employeeCode], type: QueryTypes.SELECT }
    );
    if (!assignments || !assignments.length) throw new ApiError(404, 'Access denied: Document assignment not found.');

    const assign = assignments[0];

    if (actionType === 'view') {
      await tenantDb.query('UPDATE `document_assignments` SET viewed_at = NOW() WHERE id = ?', { replacements: [assign.id] });
      await tenantDb.query(`
        INSERT INTO \`document_access_logs\` (id, document_id, user_id, action, status)
        VALUES (?, ?, ?, 'VIEW', 'Success')
      `, [crypto.randomUUID(), docId, employeeCode]);
    } else if (actionType === 'download') {
      await tenantDb.query('UPDATE `document_assignments` SET downloaded_at = NOW() WHERE id = ?', { replacements: [assign.id] });
      await tenantDb.query(`
        INSERT INTO \`document_access_logs\` (id, document_id, user_id, action, status)
        VALUES (?, ?, ?, 'DOWNLOAD', 'Success')
      `, [crypto.randomUUID(), docId, employeeCode]);
    } else if (actionType === 'accept') {
      await tenantDb.query('UPDATE `document_assignments` SET accepted_at = NOW() WHERE id = ?', { replacements: [assign.id] });
    } else if (actionType === 'reject') {
      await tenantDb.query('UPDATE `document_assignments` SET rejected_at = NOW(), rejection_reason = ? WHERE id = ?', {
        replacements: [extraData.reason || 'Rejected by employee', assign.id]
      });
    } else if (actionType === 'acknowledge') {
      await tenantDb.query('UPDATE `document_assignments` SET acknowledged_at = NOW() WHERE id = ?', { replacements: [assign.id] });
      
      const ackId = crypto.randomUUID();
      const [doc] = await tenantDb.query('SELECT current_version_id FROM `documents` WHERE id = ? LIMIT 1', { replacements: [docId], type: QueryTypes.SELECT });
      await tenantDb.query(`
        INSERT INTO \`document_acknowledgements\` (id, document_id, version_id, employee_id, status, acknowledged_at)
        VALUES (?, ?, ?, ?, 'Acknowledged', NOW())
      `, [ackId, docId, doc?.current_version_id, employeeCode]);
    } else if (actionType === 'sign') {
      await tenantDb.query('UPDATE `document_assignments` SET signed_at = NOW() WHERE id = ?', { replacements: [assign.id] });

      const sigId = crypto.randomUUID();
      const [doc] = await tenantDb.query('SELECT current_version_id FROM `documents` WHERE id = ? LIMIT 1', { replacements: [docId], type: QueryTypes.SELECT });
      await tenantDb.query(`
        INSERT INTO \`document_signatures\` (id, document_id, version_id, signer_id, signer_type, signature_method, signature_reference, signed_at)
        VALUES (?, ?, ?, ?, 'Employee', 'E-Sign', ?, NOW())
      `, [sigId, docId, doc?.current_version_id, employeeCode, extraData.reference || 'E-SIGN-REF']);
    }

    return true;
  }

  async convertCandidateToEmployee(tenantDb, candidateId, employeePayload, user) {
    const transaction = await tenantDb.transaction();
    try {
      const empId = crypto.randomUUID();
      const empCode = employeePayload.employeeCode || `EMP-${Date.now().toString().slice(-4)}`;

      await tenantDb.query(`
        INSERT INTO \`employees\` (id, employee_name, email, department, department_id, company_id, branch_id, manager_id, designation_id, employeeCode, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, {
        replacements: [
          empId,
          employeePayload.employeeName,
          employeePayload.email,
          employeePayload.department || 'General',
          employeePayload.departmentId || null,
          employeePayload.companyId || null,
          employeePayload.branchId || null,
          employeePayload.managerId || null,
          employeePayload.designationId || null,
          empCode
        ],
        transaction
      });

      await tenantDb.query("UPDATE `candidate_database` SET status = 'Hired' WHERE candidateId = ? OR id = ?", {
        replacements: [candidateId, candidateId],
        transaction
      });

      await tenantDb.query(`
        UPDATE \`documents\` 
        SET employee_id = ? 
        WHERE candidate_id = ? OR candidate_id = (SELECT candidateId FROM \`candidate_database\` WHERE id = ? LIMIT 1)
      `, {
        replacements: [empCode, candidateId, candidateId],
        transaction
      });

      await tenantDb.query(`
        UPDATE \`document_assignments\` 
        SET employee_id = ? 
        WHERE candidate_id = ? OR candidate_id = (SELECT candidateId FROM \`candidate_database\` WHERE id = ? LIMIT 1)
      `, {
        replacements: [empCode, candidateId, candidateId],
        transaction
      });

      await transaction.commit();
      return { id: empId, employeeCode: empCode };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async verifyDocumentPublic(tenantDb, verificationId) {
    const [doc] = await tenantDb.query(`
      SELECT d.id, d.document_number, d.title, d.status, d.issue_date, d.expiry_date, dt.name as document_type_name 
      FROM \`documents\` d
      LEFT JOIN \`document_types\` dt ON d.document_type_id = dt.id
      WHERE d.verification_id = ? LIMIT 1
    `, {
      replacements: [verificationId],
      type: QueryTypes.SELECT
    });

    if (!doc) return { verified: false, message: 'Document not found or invalid Verification ID.' };

    const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date();
    const verificationStatus = isExpired ? 'Expired' : doc.status === 'Issued' ? 'Valid & Active' : doc.status;

    await tenantDb.query(`
      INSERT INTO \`document_verifications\` (id, document_id, verification_id, status, verification_count, verified_at)
      VALUES (?, ?, ?, ?, 1, NOW())
      ON DUPLICATE KEY UPDATE verification_count = verification_count + 1, verified_at = NOW()
    `, [crypto.randomUUID(), doc.id, verificationId, verificationStatus]);

    return {
      verified: true,
      documentNumber: doc.document_number,
      documentType: doc.document_type_name,
      title: doc.title,
      status: verificationStatus,
      issueDate: doc.issue_date,
      expiryDate: doc.expiry_date || 'No Expiry'
    };
  }
}

module.exports = new DocumentService();
