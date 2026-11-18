const m = require('../models/index.js');
console.log('Successfully loaded models! Count:', Object.keys(m).length);
const payrollKeys = Object.keys(m).filter(k => k.includes('Payroll') || k.includes('Salary') || k.includes('Statutory'));
console.log('Payroll-related models:', payrollKeys);
process.exit(0);
