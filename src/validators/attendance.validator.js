const Joi = require('joi');

// No body needed for clock-in/clock-out — they use the current timestamp
// These schemas are for query parameter validation on history

// ─── History Query Schema ────────────────────────────────
const historyQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().optional().when('start_date', {
    is: Joi.exist(),
    then: Joi.date().iso().min(Joi.ref('start_date')),
  }),
});

module.exports = { historyQuerySchema };
