const { Employee } = require('../models');
console.log('Employee associations:', Object.keys(Employee.associations));
process.exit(0);
