const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// ─── Role Model ─────────────────────────────────────────────
// Lookup table for user roles: employee, hr, admin
// Keeps role definitions separate for easy extension (e.g., adding 'manager' later)
const Role = sequelize.define('roles', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.ENUM('admin', 'hr', 'employee'),
    allowNull: false,
    unique: true,
    comment: 'Role identifier — determines access level',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Human-readable role description',
  },
});

module.exports = Role;
