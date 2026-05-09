// ─── Request Validation Middleware ─────────────────────────
// Takes a Joi schema and validates req.body against it
// Returns 400 with specific error messages if validation fails
// Usage: validate(loginSchema) in route definition
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,      // Report ALL errors, not just first
      stripUnknown: true,     // Remove unknown fields
      allowUnknown: false,    // Don't allow unknown fields
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    next();
  };
};

module.exports = validate;
