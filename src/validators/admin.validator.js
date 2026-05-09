const Joi = require('joi');

// ─── Create User Schema ──────────────────────────────────
const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  employee_id: Joi.string().min(2).max(20).required(),
  role_id: Joi.number().integer().min(1).required(),
  department: Joi.string().max(100).optional().default('General'),
});

// ─── Update User Schema ──────────────────────────────────
const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  role_id: Joi.number().integer().min(1).optional(),
  department: Joi.string().max(100).optional(),
  is_active: Joi.boolean().optional(),
  password: Joi.string().min(6).max(100).optional(),
}).min(1); // At least one field must be provided

// ─── Update Attendance Rules Schema ──────────────────────
const updateRulesSchema = Joi.object({
  default_shift_start: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
    .optional(),
  default_shift_end: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
    .optional(),
  grace_period_minutes: Joi.number().integer().min(0).max(120).optional(),
  min_hours_full_day: Joi.number().integer().min(1).max(24).optional(),
  min_hours_half_day: Joi.number().integer().min(1).max(24).optional(),
  auto_absent_enabled: Joi.boolean().optional(),
  auto_absent_cutoff: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
    .optional(),
}).min(1);

module.exports = { createUserSchema, updateUserSchema, updateRulesSchema };
