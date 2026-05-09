const AttendanceService = require('./attendance.service');
const CorrectionService = require('./correction.service');

class HRService {
  static async getAllCorrections(query) {
    return CorrectionService.getAllRequests(query);
  }

  static async reviewCorrection(requestId, reviewerId, data, ipAddress) {
    return CorrectionService.reviewRequest(requestId, reviewerId, data, ipAddress);
  }

  static async getAllAttendance(query) {
    return AttendanceService.getAllAttendance(query);
  }
}

module.exports = HRService;
