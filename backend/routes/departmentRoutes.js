const express = require('express');
const { body } = require('express-validator');
const {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment
} = require('../controllers/departmentController');

const router = express.Router();

// Validation rules
const departmentValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Department name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Department name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Department name can only contain letters and spaces')
];

// Routes
router.post('/departments', departmentValidation, createDepartment);
router.get('/departments', getAllDepartments);
router.get('/departments/:id', getDepartmentById);
router.put('/departments/:id', departmentValidation, updateDepartment);
router.delete('/departments/:id', deleteDepartment);

module.exports = router;