const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// ─── AttendanceRule Model ──────────────────────────────────
// Stores global attendance configuration
// Currently a single-row config table (id=1 is the global rule)
// All thresholds are actively enforced by AttendanceService:
//   - grace_period_minutes + default_shift_start → is_late computation on clock-in
//   - min_hours_full_day / min_hours_half_day → status computation on clock-out
// MULTI_TENANT_HOOK: add company_id FK → companies.id to make rules per-company
const AttendanceRule = sequelize.define('attendance_rules', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  default_shift_start: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: '09:00:00',
    comment: 'Standard shift start time',
  },
  default_shift_end: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: '18:00:00',
    comment: 'Standard shift end time',
  },
  grace_period_minutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 15,
    comment: 'Minutes after shift start before marking late',
  },
  min_hours_full_day: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 8,
    comment: 'Minimum hours to count as full day',
  },
  min_hours_half_day: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 4,
    comment: 'Minimum hours to count as half day',
  },
  auto_absent_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether to auto-mark absent after cutoff',
  },
  auto_absent_cutoff: {
    type: DataTypes.TIME,
    allowNull: true,
    defaultValue: '12:00:00',
    comment: 'If no clock-in by this time, mark absent',
  },
});

module.exports = AttendanceRule;
