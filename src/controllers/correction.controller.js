const CorrectionService = require('../services/correction.service');

class CorrectionController {
  static async create(req, res, next) {
    try {
      const request = await CorrectionService.createRequest(req.user.id, req.body, req.ip);
      res.status(201).json({ success: true, message: 'Correction request submitted', data: request });
    } catch (error) {
      next(error);
    }
  }

  static async getMyRequests(req, res, next) {
    try {
      const requests = await CorrectionService.getMyRequests(req.user.id);
      res.json({ success: true, data: requests });
    } catch (error) {
      next(error);
    }
  }

  static async cancelRequest(req, res, next) {
    try {
      const { id } = req.params;
      await CorrectionService.cancelRequest(id, req.user.id, req.ip, false);
      res.json({ success: true, message: 'Correction request cancelled successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CorrectionController;
