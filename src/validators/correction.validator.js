const Joi = require('joi');

// ─── Create Correction Request Schema ─────────────────────
const createCorrectionSchema = Joi.object({
  date: Joi.date().iso().required().messages({
    'any.required': 'Date is required',
    'date.format': 'Date must be in YYYY-MM-DD format',
  }),
  type: Joi.string()
    .valid('missed_in', 'missed_out', 'wrong_in', 'wrong_out')
    .required()
    .messages({
      'any.only': 'Type must be one of: missed_in, missed_out, wrong_in, wrong_out',
      'any.required': 'Correction type is required',
    }),
  corrected_time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({
      'string.pattern.base': 'Corrected time must be in HH:MM format (24-hour)',
      'any.required': 'Corrected time is required',
    }),
  reason: Joi.string().min(10).max(500).required().messages({
    'string.min': 'Reason must be at least 10 characters',
    'string.max': 'Reason must not exceed 500 characters',
    'any.required': 'Reason is required',
  }),
});

// ─── Review Correction Request Schema ─────────────────────
const reviewCorrectionSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected').required().messages({
    'any.only': 'Status must be either approved or rejected',
    'any.required': 'Decision (status) is required',
  }),
  remarks: Joi.string().max(500).optional().allow('').messages({
    'string.max': 'Remarks must not exceed 500 characters',
  }),
});

module.exports = { createCorrectionSchema, reviewCorrectionSchema };
