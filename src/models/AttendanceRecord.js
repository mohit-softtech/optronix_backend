const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// ─── AttendanceRecord Model ────────────────────────────────
// Stores one row per employee per day
// UNIQUE(user_id, date) ensures no duplicate clock-in for the same day
// Business rules enforced at service layer:
//   - clock_out cannot be set before clock_in
//   - total_hours auto-calculated on clock_out
//   - is_late computed on clock_in against AttendanceRules grace period
// MULTI_TENANT_HOOK: add company_id FK here when expanding to multi-company
const AttendanceRecord = sequelize.define('attendance_records', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'FK → users.id',
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Attendance date (YYYY-MM-DD)',
  },
  clock_in: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Clock-in timestamp',
  },
  clock_out: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Clock-out timestamp',
  },
  total_hours: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Calculated hours worked (clock_out - clock_in)',
  },
  status: {
    type: DataTypes.ENUM('present', 'half-day', 'absent'),
    allowNull: false,
    defaultValue: 'present',
    comment: 'Derived from total_hours vs attendance rules',
  },
  source: {
    type: DataTypes.ENUM('self', 'correction', 'admin'),
    allowNull: false,
    defaultValue: 'self',
    comment: 'How the record was created/modified',
  },
  is_late: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'True if clock_in was after shift_start + grace_period_minutes (from AttendanceRules)',
  },
  // MULTI_TENANT_HOOK: company_id INTEGER FK → companies.id (add when going multi-tenant)
}, {
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'date'],
      name: 'unique_user_date',
      comment: 'Prevents duplicate attendance per user per day',
    },
  ],
});

module.exports = AttendanceRecord;
