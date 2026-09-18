// backend/controllers/core/document.controller.js
const documentService = require('../../services/core/document.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/apiError');
const path = require('path');
const fs = require('fs');

const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await documentService.getDashboardStats(req.tenantDb);
  res.status(200).json(new ApiResponse(200, stats, 'Dashboard stats retrieved.'));
});

const getDocumentTypes = asyncHandler(async (req, res) => {
  const types = await documentService.getDocumentTypes(req.tenantDb);
  res.status(200).json(new ApiResponse(200, types, 'Document types retrieved.'));
});

const createDocumentType = asyncHandler(async (req, res) => {
  const type = await documentService.createDocumentType(req.tenantDb, req.body, req.user);
  res.status(201).json(new ApiResponse(201, type, 'Document type created.'));
});

const updateDocumentType = asyncHandler(async (req, res) => {
  await documentService.updateDocumentType(req.tenantDb, req.params.id, req.body, req.user);
  res.status(200).json(new ApiResponse(200, null, 'Document type updated.'));
});

const getTemplates = asyncHandler(async (req, res) => {
  const templates = await documentService.getTemplates(req.tenantDb);
  res.status(200).json(new ApiResponse(200, templates, 'Templates retrieved.'));
});

const createTemplate = asyncHandler(async (req, res) => {
  const template = await documentService.createTemplate(req.tenantDb, req.body, req.user);
  res.status(201).json(new ApiResponse(201, template, 'Template created.'));
});

const updateTemplate = asyncHandler(async (req, res) => {
  await documentService.updateTemplate(req.tenantDb, req.params.id, req.body, req.user);
  res.status(200).json(new ApiResponse(200, null, 'Template updated.'));
});

const deleteTemplate = asyncHandler(async (req, res) => {
  await documentService.deleteTemplate(req.tenantDb, req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, null, 'Template deleted.'));
});

const createDocument = asyncHandler(async (req, res) => {
  const doc = await documentService.createDocument(req.tenantDb, req.body, req.file, req.user);
  res.status(201).json(new ApiResponse(201, doc, 'Document draft created successfully.'));
});

const updateDocument = asyncHandler(async (req, res) => {
  await documentService.updateDocument(req.tenantDb, req.params.id, req.body, req.file, req.user);
  res.status(200).json(new ApiResponse(200, null, 'Document updated.'));
});

const submitForApproval = asyncHandler(async (req, res) => {
  await documentService.submitForApproval(req.tenantDb, req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, null, 'Document submitted for approval.'));
});

const approveDocument = asyncHandler(async (req, res) => {
  await documentService.approveDocument(req.tenantDb, req.params.id, req.body.comments, req.user);
  res.status(200).json(new ApiResponse(200, null, 'Document approved.'));
});

const rejectDocument = asyncHandler(async (req, res) => {
  await documentService.rejectDocument(req.tenantDb, req.params.id, req.body.reason, req.user);
  res.status(200).json(new ApiResponse(200, null, 'Document rejected.'));
});

const issueDocument = asyncHandler(async (req, res) => {
  await documentService.issueDocument(req.tenantDb, req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, null, 'Document issued to employee/candidate.'));
});

const getEmployeeDocuments = asyncHandler(async (req, res) => {
  let empCode = req.query.employeeCode || req.user.employee?.employeeCode || req.user.employee?.id || req.user.username;
  const docs = await documentService.getEmployeeDocuments(req.tenantDb, empCode);
  res.status(200).json(new ApiResponse(200, docs, 'Employee documents retrieved.'));
});

const recordEmployeeAction = asyncHandler(async (req, res) => {
  const { action } = req.params;
  const { reason, reference } = req.body;
  let empCode = req.user.employee?.employeeCode || req.user.employee?.id || req.user.username;

  await documentService.recordEmployeeAction(req.tenantDb, req.params.id, empCode, action, { reason, reference });
  res.status(200).json(new ApiResponse(200, null, `Employee action [${action}] recorded successfully.`));
});

const previewGeneratedContent = asyncHandler(async (req, res) => {
  const { templateId, employeeId, candidateId } = req.query;
  const preview = await documentService.previewGeneratedContent(req.tenantDb, templateId, employeeId, candidateId, req.query);
  res.status(200).json(new ApiResponse(200, preview, 'Preview generated.'));
});

const downloadDocumentFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { QueryTypes } = require('sequelize');

  const [doc] = await req.tenantDb.query('SELECT * FROM `documents` WHERE id = ? LIMIT 1', {
    replacements: [id],
    type: QueryTypes.SELECT
  });

  if (!doc) throw new ApiError(404, 'Document not found.');

  const userRole = String(req.user?.role?.roleName || req.user?.role?.name || req.user?.role || '').toLowerCase();
  const empCode = req.user.employee?.employeeCode || req.user.employee?.id || req.user.username;
  const isPrivileged = userRole.includes('admin') || userRole.includes('super') || userRole.includes('hr') || userRole.includes('manager') || userRole.includes('head') || userRole.includes('dept');

  if (!isPrivileged && doc.employee_id !== empCode && doc.candidate_id !== empCode) {
    const [assign] = await req.tenantDb.query(
      'SELECT id FROM `document_assignments` WHERE document_id = ? AND (employee_id = ? OR candidate_id = ?) LIMIT 1',
      { replacements: [id, empCode, empCode], type: QueryTypes.SELECT }
    );
    if (!assign) throw new ApiError(403, 'Access denied: You do not have permission to download this document.');
  }

  let filePath = path.join(__dirname, '../../uploads', doc.storage_key);
  if (!fs.existsSync(filePath)) {
    const cleanKey = String(doc.storage_key || doc.file_url || '').replace(/^\/?public\//, '');
    const publicPath1 = path.join(__dirname, '../../public', cleanKey);
    const publicPath2 = path.join(__dirname, '../public', cleanKey);
    if (fs.existsSync(publicPath1)) {
      filePath = publicPath1;
    } else if (fs.existsSync(publicPath2)) {
      filePath = publicPath2;
    }
  }

  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, 'Physical file not found on secure server storage.');
  }

  if (doc.employee_id === empCode || doc.candidate_id === empCode) {
    await documentService.recordEmployeeAction(req.tenantDb, id, empCode, 'download');
  }

  res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${doc.original_file_name || doc.file_name}"`);
  
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

const getDocumentPreview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { QueryTypes } = require('sequelize');

  const [doc] = await req.tenantDb.query('SELECT * FROM `documents` WHERE id = ? LIMIT 1', {
    replacements: [id],
    type: QueryTypes.SELECT
  });

  if (!doc) throw new ApiError(404, 'Document not found.');

  let filePath = path.join(__dirname, '../../uploads', doc.storage_key);
  if (!fs.existsSync(filePath)) {
    const cleanKey = String(doc.storage_key || doc.file_url || '').replace(/^\/?public\//, '');
    const publicPath1 = path.join(__dirname, '../../public', cleanKey);
    const publicPath2 = path.join(__dirname, '../public', cleanKey);
    if (fs.existsSync(publicPath1)) {
      filePath = publicPath1;
    } else if (fs.existsSync(publicPath2)) {
      filePath = publicPath2;
    }
  }

  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, 'Physical file not found.');
  }

  const empCode = req.user.employee?.employeeCode || req.user.employee?.id || req.user.username;
  if (doc.employee_id === empCode || doc.candidate_id === empCode) {
    await documentService.recordEmployeeAction(req.tenantDb, id, empCode, 'view');
  }

  res.setHeader('Content-Type', doc.mime_type || 'text/html');
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

const verifyDocument = asyncHandler(async (req, res) => {
  const { verificationId } = req.params;
  const result = await documentService.verifyDocumentPublic(req.tenantDb, verificationId);
  res.status(200).json(new ApiResponse(200, result, 'Verification details retrieved.'));
});

const convertCandidate = asyncHandler(async (req, res) => {
  const result = await documentService.convertCandidateToEmployee(req.tenantDb, req.params.candidateId, req.body, req.user);
  res.status(200).json(new ApiResponse(200, result, 'Candidate successfully converted to Employee.'));
});

module.exports = {
  getDashboardStats,
  getDocumentTypes,
  createDocumentType,
  updateDocumentType,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  createDocument,
  updateDocument,
  submitForApproval,
  approveDocument,
  rejectDocument,
  issueDocument,
  getEmployeeDocuments,
  recordEmployeeAction,
  previewGeneratedContent,
  downloadDocumentFile,
  getDocumentPreview,
  verifyDocument,
  convertCandidate
};
