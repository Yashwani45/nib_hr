// backend/validators/validate.js
const { validationResult } = require('express-validator');
const ApiError = require('../utils/apiError');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  
  const extractedErrors = [];
  errors.array().map((err) => {
    extractedErrors.push({ [err.path || err.param || 'field']: err.msg });
  });

  throw new ApiError(422, 'Invalid input parameters provided.', extractedErrors);
};

module.exports = validate;
