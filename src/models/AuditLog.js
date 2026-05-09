const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// ─── AuditLog Model ───────────────────────────────────────
// Immutable log of all significant actions in the system
// Used for compliance, debugging, and admin oversight
// old_values / new_values store JSON snapshots of what changed
const AuditLog = sequelize.define('audit_logs', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'FK → users.id (who performed the action)',
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Action type: clock_in, clock_out, correction_request, approve, reject, user_create, user_update, rule_update',
  },
  entity_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'What was affected: attendance, correction, user, rule',
  },
  entity_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID of the affected record',
  },
  old_values: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Snapshot of values before the change',
  },
  new_values: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Snapshot of values after the change',
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'Client IP for security tracking',
  },
}, {
  updatedAt: false,  // Audit logs are immutable — no updates
});

module.exports = AuditLog;
