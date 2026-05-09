// ─── Centralized Error Handler ────────────────────────────
// Catches all errors thrown or passed via next(error)
// Returns standardized JSON error responses
// In production: hides stack traces and internal details
const config = require('../config');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Sequelize validation errors (e.g., unique constraint)
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors,
    });
  }

  // Sequelize unique constraint violation
  if (err.name === 'SequelizeUniqueConstraintError') {
    const fields = err.errors.map((e) => e.path).join(', ');
    return res.status(409).json({
      success: false,
      message: `Duplicate entry. The following field(s) must be unique: ${fields}`,
    });
  }

  // Custom application errors (thrown with statusCode)
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Default: Internal server error
  res.status(500).json({
    success: false,
    message: config.nodeEnv === 'development'
      ? err.message
      : 'Internal server error. Please try again later.',
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
