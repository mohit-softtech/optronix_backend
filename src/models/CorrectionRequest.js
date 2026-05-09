const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// ─── CorrectionRequest Model ──────────────────────────────
// Workflow: Employee raises request → HR reviews → Approved/Rejected
// Types cover all correction scenarios:
//   missed_in  — forgot to clock in
//   missed_out — forgot to clock out
//   wrong_in   — clocked in at wrong time
//   wrong_out  — clocked out at wrong time
// On approval, HR updates the linked AttendanceRecord
const CorrectionRequest = sequelize.define('correction_requests', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'FK → users.id (employee who raised the request)',
  },
  attendance_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'FK → attendance_records.id (nullable if record does not exist yet)',
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'The date being corrected',
  },
  type: {
    type: DataTypes.ENUM('missed_in', 'missed_out', 'wrong_in', 'wrong_out'),
    allowNull: false,
    comment: 'What kind of correction is needed',
  },
  corrected_time: {
    type: DataTypes.TIME,
    allowNull: false,
    comment: 'The correct time the employee claims',
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Employee explanation for the correction',
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
  },
  reviewed_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'FK → users.id (HR user who reviewed)',
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'HR remarks on approval/rejection',
  },
  reviewed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the review happened',
  },
});

module.exports = CorrectionRequest;
