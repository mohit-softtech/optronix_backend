const sequelize = require('../config/database');

// ─── Import all models ────────────────────────────────────
const Role = require('./Role');
const User = require('./User');
const AttendanceRecord = require('./AttendanceRecord');
const CorrectionRequest = require('./CorrectionRequest');
const AttendanceRule = require('./AttendanceRule');
const AuditLog = require('./AuditLog');

// ─── Define Associations ──────────────────────────────────
// These define the relationships between tables and enable
// Sequelize eager loading (include) and cascading

// Role ↔ User (One-to-Many)
// A role has many users; each user belongs to one role
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// User ↔ AttendanceRecord (One-to-Many)
// An employee can have many attendance records
User.hasMany(AttendanceRecord, { foreignKey: 'user_id', as: 'attendanceRecords' });
AttendanceRecord.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User ↔ CorrectionRequest (One-to-Many)
// An employee can raise many correction requests
User.hasMany(CorrectionRequest, { foreignKey: 'user_id', as: 'correctionRequests' });
CorrectionRequest.belongsTo(User, { foreignKey: 'user_id', as: 'employee' });

// AttendanceRecord ↔ CorrectionRequest (One-to-Many)
// A correction request may reference an existing attendance record
AttendanceRecord.hasMany(CorrectionRequest, { foreignKey: 'attendance_id', as: 'corrections' });
CorrectionRequest.belongsTo(AttendanceRecord, { foreignKey: 'attendance_id', as: 'attendanceRecord' });

// CorrectionRequest → User (reviewer) — Many-to-One
// The HR user who reviewed the request
CorrectionRequest.belongsTo(User, { foreignKey: 'reviewed_by', as: 'reviewer' });

// User ↔ AuditLog (One-to-Many)
// Every audit log entry tracks which user performed the action
User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ─── Export everything ────────────────────────────────────
module.exports = {
  sequelize,
  Role,
  User,
  AttendanceRecord,
  CorrectionRequest,
  AttendanceRule,
  AuditLog,
};
