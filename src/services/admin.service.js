const bcrypt = require('bcryptjs');
const { User, Role, AttendanceRule, AuditLog, AttendanceRecord, CorrectionRequest } = require('../models');
const AuditService = require('./audit.service');
const AttendanceService = require('./attendance.service');
const CorrectionService = require('./correction.service');

class AdminService {
  // ─── User Management ─────────────────────────────────────
  static async getAllUsers() {
    return User.findAll({
      include: [{ model: Role, as: 'role' }],
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']],
    });
  }

  static async createUser(data, adminId, ipAddress) {
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await User.create({
      employee_id: data.employee_id,
      name: data.name,
      email: data.email,
      password_hash: passwordHash,
      role_id: data.role_id,
      department: data.department || 'General',
    });

    await AuditService.log({
      userId: adminId,
      action: 'user_create',
      entityType: 'user',
      entityId: user.id,
      newValues: { name: data.name, email: data.email, role_id: data.role_id },
      ipAddress,
    });

    const created = await User.findByPk(user.id, {
      include: [{ model: Role, as: 'role' }],
      attributes: { exclude: ['password_hash'] },
    });
    return created;
  }

  static async updateUser(id, data, adminId, ipAddress) {
    const user = await User.findByPk(id);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const oldValues = { name: user.name, email: user.email, role_id: user.role_id, is_active: user.is_active };
    const updateData = {};

    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.role_id) updateData.role_id = data.role_id;
    if (data.department) updateData.department = data.department;
    if (typeof data.is_active === 'boolean') updateData.is_active = data.is_active;
    if (data.password) updateData.password_hash = await bcrypt.hash(data.password, 12);

    await user.update(updateData);

    await AuditService.log({
      userId: adminId,
      action: 'user_update',
      entityType: 'user',
      entityId: id,
      oldValues,
      newValues: updateData,
      ipAddress,
    });

    const updated = await User.findByPk(id, {
      include: [{ model: Role, as: 'role' }],
      attributes: { exclude: ['password_hash'] },
    });
    return updated;
  }

  static async deleteUser(id, adminId, ipAddress) {
    const user = await User.findByPk(id);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    await user.update({ is_active: false });

    await AuditService.log({
      userId: adminId,
      action: 'user_deactivate',
      entityType: 'user',
      entityId: id,
      oldValues: { is_active: true },
      newValues: { is_active: false },
      ipAddress,
    });

    return { message: 'User deactivated successfully' };
  }

  // ─── Attendance Rules ─────────────────────────────────────
  static async getRules() {
    let rules = await AttendanceRule.findOne();
    if (!rules) {
      rules = await AttendanceRule.create({});
    }
    return rules;
  }

  static async updateRules(data, adminId, ipAddress) {
    let rules = await AttendanceRule.findOne();
    if (!rules) {
      rules = await AttendanceRule.create({});
    }
    const oldValues = rules.toJSON();
    await rules.update(data);

    await AuditService.log({
      userId: adminId,
      action: 'rule_update',
      entityType: 'rule',
      entityId: rules.id,
      oldValues,
      newValues: data,
      ipAddress,
    });

    return rules;
  }

  // ─── Audit Logs ───────────────────────────────────────────
  static async getAuditLogs(query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 30;
    const offset = (page - 1) * limit;

    const { count, rows } = await AuditLog.findAndCountAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'employee_id'] }],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return { logs: rows, total: count, page, totalPages: Math.ceil(count / limit) };
  }

  // ─── Full Visibility ─────────────────────────────────────
  static async getAllAttendance(query) {
    return AttendanceService.getAllAttendance(query);
  }

  static async getAllCorrections(query) {
    return CorrectionService.getAllRequests(query);
  }

  // ─── Roles ────────────────────────────────────────────────
  static async getRoles() {
    return Role.findAll();
  }
}

module.exports = AdminService;
