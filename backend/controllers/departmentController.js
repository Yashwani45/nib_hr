const Department = require('../models/Department');
const { validationResult } = require('express-validator');

// Create Department
const createDepartment = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { name } = req.body;

    // Check if department already exists
    const existingDept = await Department.findOne({ 
      where: { name: name.trim() } 
    });

    if (existingDept) {
      return res.status(400).json({
        success: false,
        message: 'Department already exists'
      });
    }

    // Create new department
    const department = await Department.create({
      name: name.trim()
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department
    });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all departments
const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll({
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      count: departments.length,
      data: departments
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get single department
const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findByPk(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update department
const updateDepartment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const { name } = req.body;

    const department = await Department.findByPk(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if new name already exists
    const existingDept = await Department.findOne({
      where: { name: name.trim() }
    });

    if (existingDept && existingDept.id !== parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'Department name already exists'
      });
    }

    // Update department
    await department.update({ name: name.trim() });

    res.json({
      success: true,
      message: 'Department updated successfully',
      data: department
    });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete department
const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findByPk(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const hrEmail = department.hr_email || department.hrEmail;
    await department.destroy();

    const { masterSequelize } = require('../config/database');
    if (masterSequelize) {
      await masterSequelize.query("DELETE FROM departments WHERE id = ?", { replacements: [id] }).catch(() => {});
      await masterSequelize.query("DELETE FROM department WHERE id = ?", { replacements: [id] }).catch(() => {});
      if (hrEmail) {
        const clean = String(hrEmail).trim().toLowerCase();
        await masterSequelize.query("DELETE FROM departments WHERE LOWER(hr_email) = ?", { replacements: [clean] }).catch(() => {});
        await masterSequelize.query("DELETE FROM department WHERE LOWER(hr_email) = ?", { replacements: [clean] }).catch(() => {});
        await masterSequelize.query("DELETE FROM users WHERE LOWER(email) = ?", { replacements: [clean] }).catch(() => {});
      }
    }

    res.json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment
};