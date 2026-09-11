// backend/routes/document.routes.js
const express = require('express');
const verifyJWT = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const documentController = require('../controllers/core/document.controller');

const router = express.Router();

router.get('/verify/:verificationId', documentController.verifyDocument);

router.use(verifyJWT);

router.get('/stats', documentController.getDashboardStats);
router.get('/preview-generated', documentController.previewGeneratedContent);

router.get('/types', documentController.getDocumentTypes);
router.post('/types', documentController.createDocumentType);
router.put('/types/:id', documentController.updateDocumentType);

router.get('/templates', documentController.getTemplates);
router.post('/templates', documentController.createTemplate);
router.put('/templates/:id', documentController.updateTemplate);
router.delete('/templates/:id', documentController.deleteTemplate);

router.post('/', upload.single('file'), documentController.createDocument);
router.put('/:id', upload.single('file'), documentController.updateDocument);

router.post('/:id/submit', documentController.submitForApproval);
router.post('/:id/approve', documentController.approveDocument);
router.post('/:id/reject', documentController.rejectDocument);
router.post('/:id/issue', documentController.issueDocument);

router.get('/employee/documents', documentController.getEmployeeDocuments);
router.get('/employee/documents/:id', documentController.getDocumentPreview);
router.get('/employee/documents/:id/preview', documentController.getDocumentPreview);
router.get('/employee/documents/:id/download', documentController.downloadDocumentFile);
router.post('/employee/documents/:id/:action', documentController.recordEmployeeAction);

router.post('/candidates/:candidateId/convert', documentController.convertCandidate);

module.exports = router;
