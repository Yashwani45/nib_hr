// backend/routes/core.routes.js
const express = require('express');
const {
  createEmployee,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getAllEmployees,
} = require('../controllers/core/employee.controller');
const { employeeValidator } = require('../validators/core/employee.validator');
const verifyJWT = require('../middleware/auth.middleware');
const { authorizeRole } = require('../middleware/role.middleware');
const upload = require('../middleware/upload.middleware');
const path = require('path');
const fs = require('fs');
const { masterSequelize } = require('../config/database');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { sanitizeCompanyFolder } = require('../utils/companyFolderScaffolder');

const { getAuditLogs } = require('../controllers/core/auditLog.controller');
const { getAccessibleUIConfig } = require('../controllers/core/navigation.controller');
const auditLogger = require('../middleware/audit.middleware');

const router = express.Router();

const {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  toggleDepartmentStatus,
  deleteDepartment
} = require('../controllers/core/department.controller');
const {
  departmentCreateValidator,
  departmentUpdateValidator,
  departmentStatusToggleValidator
} = require('../validators/core/department.validator');

const {
  getDesignations,
  getDesignationById,
  createDesignation,
  updateDesignation,
  toggleDesignationStatus,
  deleteDesignation
} = require('../controllers/core/designation.controller');

// All core routes require authentication
router.use(verifyJWT);

// Employee Routes
router.get('/employees', auditLogger('Core'), getAllEmployees);
router.get('/employees/:id', auditLogger('Core'), getEmployeeById);

// Creation, Updating and Deletion restricted to Admin/Manager roles
router.post('/employees', auditLogger('Core'), authorizeRole(['Admin', 'Manager']), employeeValidator, createEmployee);
router.put('/employees/:id', auditLogger('Core'), authorizeRole(['Admin', 'Manager']), employeeValidator, updateEmployee);
router.delete('/employees/:id', auditLogger('Core'), authorizeRole(['Admin']), deleteEmployee);

// Department Master Routes
router.get('/departments', auditLogger('Department'), getDepartments);
router.get('/departments/:id', auditLogger('Department'), getDepartmentById);
router.post('/departments', auditLogger('Department'), authorizeRole(['Admin', 'SuperAdmin', 'Manager']), departmentCreateValidator, createDepartment);
router.put('/departments/:id', auditLogger('Department'), authorizeRole(['Admin', 'SuperAdmin', 'Manager']), departmentUpdateValidator, updateDepartment);
router.patch('/departments/:id/status', auditLogger('Department'), authorizeRole(['Admin', 'SuperAdmin', 'Manager']), departmentStatusToggleValidator, toggleDepartmentStatus);
router.delete('/departments/:id', auditLogger('Department'), authorizeRole(['Admin', 'SuperAdmin']), deleteDepartment);

// Designation Master Routes
router.get('/designations', auditLogger('Designation'), getDesignations);
router.get('/designations/:id', auditLogger('Designation'), getDesignationById);
router.post('/designations', auditLogger('Designation'), authorizeRole(['Admin', 'SuperAdmin', 'Manager']), createDesignation);
router.put('/designations/:id', auditLogger('Designation'), authorizeRole(['Admin', 'SuperAdmin', 'Manager']), updateDesignation);
router.patch('/designations/:id/status', auditLogger('Designation'), authorizeRole(['Admin', 'SuperAdmin', 'Manager']), toggleDesignationStatus);
router.delete('/designations/:id', auditLogger('Designation'), authorizeRole(['Admin', 'SuperAdmin']), deleteDesignation);

// Audit logs retrieval (filtered internally by role)
router.get('/audit-logs', auditLogger('Core'), getAuditLogs);

// Dynamic UI layout config resolver (Menus/Widgets)
router.get('/ui-config', getAccessibleUIConfig);

// File upload endpoint for backend public folder (Company / Department / EmployeeId)
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No file was uploaded.');
    }

    // 1. Resolve Company Name
    let companyName = req.body.companyName;
    if (!companyName) {
      const tenantId = req.headers['x-company-code'] || req.user?.companyCode || req.companyCode || 'NIB01';
      const [tenantRows] = await masterSequelize.query(
        `SELECT company_name FROM tenants WHERE id = ? OR db_name = ? LIMIT 1`,
        { replacements: [tenantId, tenantId] }
      );
      companyName = tenantRows && tenantRows.length > 0 ? tenantRows[0].company_name : tenantId;
    }
    const cleanCompanyFolder = sanitizeCompanyFolder(companyName);

    // 2. Resolve Employee ID / Identifier
    const empIdentifier = req.body.employeeId || req.body.empId || req.body.employeeCode || req.user?.employee?.employeeCode || req.user?.employee?.id || req.body.employeeName || req.user?.employee?.first_name || 'Employee';
    const cleanEmployeeId = String(empIdentifier).trim().replace(/[^a-zA-Z0-9_-]/g, '') || 'Employee';

    // 3. Resolve Department
    let deptName = req.body.department;
    if (!deptName && req.tenantDb) {
      try {
        const [empRows] = await req.tenantDb.query(
          `SELECT department FROM employees WHERE employee_code = :searchId OR employee_id = :searchId OR id = :searchId OR email = :searchId LIMIT 1`,
          { replacements: { searchId: empIdentifier } }
        );
        if (empRows && empRows.length > 0 && empRows[0].department) {
          deptName = empRows[0].department;
        }
      } catch (e) {}
    }
    if (!deptName) deptName = 'General';
    const cleanDepartment = String(deptName).trim().replace(/[^a-zA-Z0-9_-]/g, '') || 'General';

    // 4. Save to Backend public folder: Backend/public/<company_name>/<department>/<employee_id>/
    const publicBaseDir = path.join(__dirname, '..', 'public');
    const targetDir = path.join(publicBaseDir, cleanCompanyFolder, cleanDepartment, cleanEmployeeId);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const targetFilePath = path.join(targetDir, req.file.filename);
    fs.renameSync(req.file.path, targetFilePath);

    const relativeUrl = `/public/${cleanCompanyFolder}/${cleanDepartment}/${cleanEmployeeId}/${req.file.filename}`;

    // 5. Automatically synchronize document with tenant database
    if (req.tenantDb) {
      try {
        const crypto = require('crypto');
        const { QueryTypes } = require('sequelize');
        const { provisionDocumentTables } = require('../services/core/document.provisioner');
        await provisionDocumentTables(req.tenantDb);

        const docTypeRaw = req.body.documentType || req.body.docType || req.body.title || 'Other Document';
        const docTypeName = String(docTypeRaw).trim();
        const docTypeCode = docTypeName.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 40) || 'OTHER';

        // 5a. Find or create document_type
        let typeId = null;
        const [typeRow] = await req.tenantDb.query(
          `SELECT id FROM \`document_types\` WHERE LOWER(name) = LOWER(:name) OR code = :code LIMIT 1`,
          { replacements: { name: docTypeName, code: docTypeCode }, type: QueryTypes.SELECT }
        ).catch(() => [null]);

        if (typeRow && typeRow.id) {
          typeId = typeRow.id;
        } else {
          typeId = crypto.randomUUID();
          await req.tenantDb.query(`
            INSERT INTO \`document_types\` (id, code, name, description, category, requires_approval, requires_acknowledgement, requires_acceptance, requires_signature, status, created_by)
            VALUES (:id, :code, :name, :description, 'Employee Document', 1, 0, 0, 0, 'Active', 'Upload Sync')
          `, {
            replacements: {
              id: typeId,
              code: docTypeCode,
              name: docTypeName,
              description: `${docTypeName} uploaded by employee.`
            }
          }).catch(() => {});
        }

        const employeeNameResolved = req.body.employeeName || (req.user?.employee?.first_name ? `${req.user?.employee?.first_name} ${req.user?.employee?.last_name || ''}`.trim() : (req.user?.username || 'Employee'));
        const docTitle = `${docTypeName} - ${employeeNameResolved}`;
        const issueDate = new Date().toISOString().split('T')[0];

        // 5b. Check if existing document record exists for this employee and type
        const [existingDoc] = await req.tenantDb.query(`
          SELECT id, current_version_id FROM \`documents\`
          WHERE (employee_id = :empId OR employee_id = :empSearch)
            AND (document_type_id = :typeId OR title = :title OR LOWER(title) LIKE LOWER(:titleLike))
            AND deleted_at IS NULL LIMIT 1
        `, {
          replacements: {
            empId: cleanEmployeeId,
            empSearch: empIdentifier,
            typeId,
            title: docTitle,
            titleLike: `${docTypeName}%`
          },
          type: QueryTypes.SELECT
        }).catch(() => [null]);

        let docId = existingDoc ? existingDoc.id : crypto.randomUUID();
        const versionId = crypto.randomUUID();

        if (existingDoc) {
          await req.tenantDb.query(`
            UPDATE \`documents\`
            SET file_name = :fileName,
                original_file_name = :origFileName,
                storage_key = :storageKey,
                file_url = :fileUrl,
                mime_type = :mimeType,
                file_size = :fileSize,
                department = :department,
                employee_name = :employeeName,
                status = 'Pending Approval',
                current_version_id = :versionId,
                updated_by = :updatedBy,
                updated_at = NOW()
            WHERE id = :id
          `, {
            replacements: {
              fileName: req.file.filename,
              origFileName: req.file.originalname,
              storageKey: relativeUrl,
              fileUrl: relativeUrl,
              mimeType: req.file.mimetype || 'application/octet-stream',
              fileSize: req.file.size || 0,
              file_size: req.file.size || 0,
              department: cleanDepartment,
              employeeName: employeeNameResolved,
              versionId,
              updatedBy: employeeNameResolved,
              id: docId
            }
          });
        } else {
          const docNumber = `DOC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
          const verificationId = `VER-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

          await req.tenantDb.query(`
            INSERT INTO \`documents\` (
              id, document_number, document_type_id, department, employee_id, employee_name,
              title, description, current_version_id, file_name, original_file_name,
              storage_key, file_url, storage_provider, mime_type, file_size,
              issue_date, status, verification_id, created_by, remarks
            ) VALUES (
              :id, :document_number, :document_type_id, :department, :employee_id, :employee_name,
              :title, :description, :current_version_id, :file_name, :original_file_name,
              :storage_key, :file_url, 'local', :mime_type, :file_size,
              :issue_date, 'Pending Approval', :verification_id, :created_by, :remarks
            )
          `, {
            replacements: {
              id: docId,
              document_number: docNumber,
              document_type_id: typeId,
              department: cleanDepartment,
              employee_id: cleanEmployeeId,
              employee_name: employeeNameResolved,
              title: docTitle,
              description: `${docTypeName} uploaded by ${employeeNameResolved} (${cleanEmployeeId})`,
              current_version_id: versionId,
              file_name: req.file.filename,
              original_file_name: req.file.originalname,
              storage_key: relativeUrl,
              file_url: relativeUrl,
              mime_type: req.file.mimetype || 'application/octet-stream',
              file_size: req.file.size || 0,
              fileSize: req.file.size || 0,
              issue_date: issueDate,
              verification_id: verificationId,
              created_by: employeeNameResolved,
              remarks: 'Uploaded from employee portal'
            }
          });
        }

        // 5c. Record document version
        await req.tenantDb.query(`
          INSERT INTO \`document_versions\` (
            id, document_id, version_number, file_name, original_file_name,
            storage_key, storage_provider, mime_type, file_size, file_hash,
            change_reason, status, created_by
          ) VALUES (?, ?, 1, ?, ?, ?, 'local', ?, ?, 'sha256-pending', 'Uploaded by Employee', 'Active', ?)
        `, {
          replacements: [
            versionId,
            docId,
            req.file.filename,
            req.file.originalname,
            relativeUrl,
            req.file.mimetype || 'application/octet-stream',
            req.file.size || 0,
            employeeNameResolved
          ]
        }).catch(() => {});

        // 5d. Synchronize back into employees table profile_data JSON
        try {
          const [empCols] = await req.tenantDb.query("SHOW COLUMNS FROM employees", { type: QueryTypes.SELECT }).catch(() => [[]]);
          const empColNames = (empCols || []).map(c => c.Field.toLowerCase());
          const matchFields = [];
          ['id', 'employeecode', 'employee_code', 'emp_code', 'employeeid', 'employee_id', 'email', 'officialemail', 'personalemail', 'user_id', 'userid'].forEach(f => {
            if (empColNames.includes(f)) {
              const actual = (empCols || []).find(c => c.Field.toLowerCase() === f)?.Field;
              if (actual) matchFields.push(`\`${actual}\` = :searchId`);
            }
          });

          let empRow = null;
          if (matchFields.length > 0) {
            const searchCandidates = [cleanEmployeeId, empIdentifier, req.user?.email, req.user?.employee?.employeeCode, req.user?.employee?.id].filter(Boolean);
            for (const cand of searchCandidates) {
              const [res] = await req.tenantDb.query(
                `SELECT id, profile_data, photo FROM employees WHERE ${matchFields.join(' OR ')} LIMIT 1`,
                { replacements: { searchId: cand }, type: QueryTypes.SELECT }
              ).catch(() => [null]);
              if (res) {
                empRow = res;
                break;
              }
            }
          }

          if (empRow) {
            let pData = {};
            if (empRow.profile_data) {
              try {
                pData = typeof empRow.profile_data === 'string' ? JSON.parse(empRow.profile_data) : empRow.profile_data;
              } catch (e) {}
            }
            pData.documents = { ...(pData.documents || {}), [docTypeName]: relativeUrl };
            
            let isPhoto = docTypeName.toLowerCase().includes('photo') || docTypeName.toLowerCase().includes('avatar');
            if (isPhoto) {
              await req.tenantDb.query(
                `UPDATE employees SET profile_data = :pData, photo = :photo WHERE id = :id`,
                { replacements: { pData: JSON.stringify(pData), photo: relativeUrl, id: empRow.id } }
              ).catch(() => {});
            } else {
              await req.tenantDb.query(
                `UPDATE employees SET profile_data = :pData WHERE id = :id`,
                { replacements: { pData: JSON.stringify(pData), id: empRow.id } }
              ).catch(() => {});
            }
          }
        } catch (syncEmpErr) {
          console.warn('[Employee Profile Documents Update Notice]:', syncEmpErr.message);
        }

      } catch (docSyncErr) {
        console.error('[Document Sync Error on Upload]:', docSyncErr);
      }
    }

    return res.status(200).json(new ApiResponse(200, relativeUrl, 'File uploaded and synchronized with document repository successfully.'));
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    next(err);
  }
});

module.exports = router;
