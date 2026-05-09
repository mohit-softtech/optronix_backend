const AttendanceService = require('../services/attendance.service');

class AttendanceController {
  static async clockIn(req, res, next) {
    try {
      const record = await AttendanceService.clockIn(req.user.id, req.ip);
      res.status(201).json({ success: true, message: 'Clocked in successfully', data: record });
    } catch (error) {
      next(error);
    }
  }

  static async clockOut(req, res, next) {
    try {
      const record = await AttendanceService.clockOut(req.user.id, req.ip);
      res.json({ success: true, message: 'Clocked out successfully', data: record });
    } catch (error) {
      next(error);
    }
  }

  static async getTodayStatus(req, res, next) {
    try {
      const record = await AttendanceService.getTodayStatus(req.user.id);
      res.json({
        success: true,
        data: record || { status: 'not_clocked_in', message: 'You have not clocked in today' },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getHistory(req, res, next) {
    try {
      const result = await AttendanceService.getHistory(req.user.id, req.query);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getMonthlySummary(req, res, next) {
    try {
      const { year, month } = req.query;
      const result = await AttendanceService.getMonthlySummary(req.user.id, year, month);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AttendanceController;

