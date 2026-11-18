const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'controllers', 'core', 'document.controller.js');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

const previewTarget = `const getDocumentPreview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { QueryTypes } = require('sequelize');

  const [doc] = await req.tenantDb.query('SELECT * FROM \`documents\` WHERE id = ? LIMIT 1', {
    replacements: [id],
    type: QueryTypes.SELECT
  });

  if (!doc) throw new ApiError(404, 'Document not found.');`;

const previewReplacement = `const getDocumentPreview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { QueryTypes } = require('sequelize');

  const [doc] = await req.tenantDb.query('SELECT * FROM \`documents\` WHERE id = ? LIMIT 1', {
    replacements: [id],
    type: QueryTypes.SELECT
  });

  if (!doc) throw new ApiError(404, 'Document not found.');

  const userRole = String(req.user?.role?.roleName || req.user?.role?.name || req.user?.role || '').toLowerCase();
  const empCode = req.user.employee?.employeeCode || req.user.employee?.id || req.user.username;
  const isPrivileged = userRole.includes('admin') || userRole.includes('super') || userRole.includes('hr') || userRole.includes('manager') || userRole.includes('head') || userRole.includes('dept');

  if (!isPrivileged && doc.employee_id !== empCode && doc.candidate_id !== empCode) {
    const [assign] = await req.tenantDb.query(
      'SELECT id FROM \`document_assignments\` WHERE document_id = ? AND (employee_id = ? OR candidate_id = ?) LIMIT 1',
      { replacements: [id, empCode, empCode], type: QueryTypes.SELECT }
    );
    if (!assign) throw new ApiError(403, 'Access denied: You do not have permission to preview this document.');
  }`;

if (content.includes(previewTarget)) {
  content = content.replace(previewTarget, previewReplacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully patched getDocumentPreview IDOR authorization check.');
} else {
  console.error('Target not found in document.controller.js');
}
process.exit(0);
