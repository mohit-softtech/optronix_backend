const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// ─── User Model ─────────────────────────────────────────────
// Represents all system users (employees, HR personnel, admins)
// Each user belongs to exactly one role via role_id FK
// MULTI_TENANT_HOOK: add company_id FK → companies.id here when going multi-tenant
const User = sequelize.define('users', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  employee_id: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: 'Company-issued employee ID (e.g., EMP-001)',
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'bcrypt hashed password — never stored as plain text',
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'FK → roles.id',
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'General',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Soft-delete flag — inactive users cannot login',
  },
  shift_type: {
    type: DataTypes.ENUM('general', 'morning', 'evening'),
    allowNull: false,
    defaultValue: 'general',
    comment: 'Shift assignment — structural placeholder for future Shift Management module. MULTI_TENANT_HOOK: will link to a shifts table per company.',
  },
});

module.exports = User;
