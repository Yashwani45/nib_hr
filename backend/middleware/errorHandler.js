const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Department with this name already exists'
    });
  }

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: err.errors.map(e => e.message).join(', ')
    });
  }

  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
};

module.exports = errorHandler;