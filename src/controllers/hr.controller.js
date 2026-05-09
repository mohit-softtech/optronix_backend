const HRService = require('../services/hr.service');

class HRController {
  static async getAllCorrections(req, res, next) {
    try {
      const result = await HRService.getAllCorrections(req.query);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async reviewCorrection(req, res, next) {
    try {
      const result = await HRService.reviewCorrection(
        parseInt(req.params.id, 10), req.user.id, req.body, req.ip
      );
      res.json({ success: true, message: `Request ${req.body.status}`, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getAllAttendance(req, res, next) {
    try {
      const result = await HRService.getAllAttendance(req.query);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = HRController;
