const AdminService = require('../services/admin.service');
const CorrectionService = require('../services/correction.service');

class AdminController {
  // Users
  static async getUsers(req, res, next) {
    try {
      const users = await AdminService.getAllUsers();
      res.json({ success: true, data: users });
    } catch (error) { next(error); }
  }

  static async createUser(req, res, next) {
    try {
      const user = await AdminService.createUser(req.body, req.user.id, req.ip);
      res.status(201).json({ success: true, message: 'User created', data: user });
    } catch (error) { next(error); }
  }

  static async updateUser(req, res, next) {
    try {
      const user = await AdminService.updateUser(parseInt(req.params.id, 10), req.body, req.user.id, req.ip);
      res.json({ success: true, message: 'User updated', data: user });
    } catch (error) { next(error); }
  }

  static async deleteUser(req, res, next) {
    try {
      const result = await AdminService.deleteUser(parseInt(req.params.id, 10), req.user.id, req.ip);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  // Attendance & Corrections (full visibility)
  static async getAllAttendance(req, res, next) {
    try {
      const result = await AdminService.getAllAttendance(req.query);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  static async getAllCorrections(req, res, next) {
    try {
      const result = await AdminService.getAllCorrections(req.query);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  static async deleteCorrection(req, res, next) {
    try {
      await CorrectionService.cancelRequest(req.params.id, req.user.id, req.ip, true);
      res.json({ success: true, message: 'Correction request deleted successfully' });
    } catch (error) { next(error); }
  }

  // Rules
  static async getRules(req, res, next) {
    try {
      const rules = await AdminService.getRules();
      res.json({ success: true, data: rules });
    } catch (error) { next(error); }
  }

  static async updateRules(req, res, next) {
    try {
      const rules = await AdminService.updateRules(req.body, req.user.id, req.ip);
      res.json({ success: true, message: 'Rules updated', data: rules });
    } catch (error) { next(error); }
  }

  // Audit Logs
  static async getAuditLogs(req, res, next) {
    try {
      const result = await AdminService.getAuditLogs(req.query);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  // Roles
  static async getRoles(req, res, next) {
    try {
      const roles = await AdminService.getRoles();
      res.json({ success: true, data: roles });
    } catch (error) { next(error); }
  }
}

module.exports = AdminController;
