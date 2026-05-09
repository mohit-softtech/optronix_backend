const { Op } = require('sequelize');
const { CorrectionRequest, AttendanceRecord, User, Role } = require('../models');
const AuditService = require('./audit.service');

// ─── Correction Service ───────────────────────────────────
// Handles the correction request workflow:
//   Employee raises → HR reviews → Approved (updates attendance) / Rejected
// Key validations:
//   - No duplicate pending requests for the same date
//   - On approval: attendance record is created/updated accordingly

class CorrectionService {
  /**
   * Employee raises a correction request
   * @param {number} userId
   * @param {Object} data - { date, type, corrected_time, reason }
   * @param {string} ipAddress
   * @returns {Object} Created correction request
   */
  static async createRequest(userId, data, ipAddress) {
    // Check for duplicate pending request for same date
    const existing = await CorrectionRequest.findOne({
      where: {
        user_id: userId,
        date: data.date,
        status: 'pending',
      },
    });

    if (existing) {
      const error = new Error('You already have a pending correction request for this date');
      error.statusCode = 400;
      throw error;
    }

    // Find existing attendance record for this date (may not exist for missed_in)
    const attendance = await AttendanceRecord.findOne({
      where: { user_id: userId, date: data.date },
    });

    const request = await CorrectionRequest.create({
      user_id: userId,
      attendance_id: attendance ? attendance.id : null,
      date: data.date,
      type: data.type,
      corrected_time: data.corrected_time,
      reason: data.reason,
      status: 'pending',
    });

    // Log the action
    await AuditService.log({
      userId,
      action: 'correction_request',
      entityType: 'correction',
      entityId: request.id,
      newValues: { date: data.date, type: data.type, corrected_time: data.corrected_time },
      ipAddress,
    });

    return request;
  }

  /**
   * Get correction requests for a specific employee
   * @param {number} userId
   * @returns {Array} Correction requests with status
   */
  static async getMyRequests(userId) {
    const requests = await CorrectionRequest.findAll({
      where: { user_id: userId },
      include: [
        { model: User, as: 'reviewer', attributes: ['id', 'name'] },
        { model: AttendanceRecord, as: 'attendanceRecord' },
      ],
      order: [['created_at', 'DESC']],
    });

    return requests;
  }

  /**
   * Get all correction requests (for HR)
   * @param {Object} query - { status, page, limit }
   * @returns {{ requests: Array, total: number }}
   */
  static async getAllRequests(query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const where = {};
    if (query.status) {
      where.status = query.status;
    }

    const { count, rows } = await CorrectionRequest.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'employee_id', 'email', 'department'],
        },
        { model: User, as: 'reviewer', attributes: ['id', 'name'] },
        { model: AttendanceRecord, as: 'attendanceRecord' },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return {
      requests: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * HR reviews (approves/rejects) a correction request
   * On approval: creates or updates the attendance record
   * @param {number} requestId
   * @param {number} reviewerId - HR user ID
   * @param {Object} data - { status, remarks }
   * @param {string} ipAddress
   * @returns {Object} Updated correction request
   */
  static async reviewRequest(requestId, reviewerId, data, ipAddress) {
    const request = await CorrectionRequest.findByPk(requestId, {
      include: [{ model: AttendanceRecord, as: 'attendanceRecord' }],
    });

    if (!request) {
      const error = new Error('Correction request not found');
      error.statusCode = 404;
      throw error;
    }

    if (request.status !== 'pending') {
      const error = new Error(`This request has already been ${request.status}`);
      error.statusCode = 400;
      throw error;
    }

    const oldValues = { status: request.status };

    // Update the request
    await request.update({
      status: data.status,
      reviewed_by: reviewerId,
      remarks: data.remarks || null,
      reviewed_at: new Date(),
    });

    // If approved, update/create the attendance record
    if (data.status === 'approved') {
      await this._applyCorrection(request);
    }

    // Log the action
    await AuditService.log({
      userId: reviewerId,
      action: data.status === 'approved' ? 'approve' : 'reject',
      entityType: 'correction',
      entityId: request.id,
      oldValues,
      newValues: { status: data.status, remarks: data.remarks },
      ipAddress,
    });

    // Re-fetch with associations
    const updated = await CorrectionRequest.findByPk(requestId, {
      include: [
        { model: User, as: 'employee', attributes: ['id', 'name', 'employee_id'] },
        { model: User, as: 'reviewer', attributes: ['id', 'name'] },
        { model: AttendanceRecord, as: 'attendanceRecord' },
      ],
    });

    return updated;
  }

  /**
   * Apply an approved correction to the attendance record
   * @private
   * @param {Object} request - The approved correction request
   */
  static async _applyCorrection(request) {
    const correctedDateTime = new Date(`${request.date}T${request.corrected_time}`);

    let attendance = await AttendanceRecord.findOne({
      where: { user_id: request.user_id, date: request.date },
    });

    if (!attendance) {
      // Create new attendance record (for missed_in scenario)
      attendance = await AttendanceRecord.create({
        user_id: request.user_id,
        date: request.date,
        source: 'correction',
        status: 'present',
      });

      // Link correction request to the new attendance
      await request.update({ attendance_id: attendance.id });
    }

    // Apply the correction based on type
    const updateData = { source: 'correction' };

    switch (request.type) {
      case 'missed_in':
      case 'wrong_in':
        updateData.clock_in = correctedDateTime;
        break;
      case 'missed_out':
      case 'wrong_out':
        updateData.clock_out = correctedDateTime;
        break;
    }

    await attendance.update(updateData);

    // Recalculate total hours if both clock_in and clock_out exist
    await attendance.reload();
    if (attendance.clock_in && attendance.clock_out) {
      const diffMs = new Date(attendance.clock_out) - new Date(attendance.clock_in);
      const totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
      let status = 'present';
      if (totalHours < 4) status = 'half-day';
      await attendance.update({ total_hours: totalHours, status });
    }
  }

  /**
   * Cancel or delete a correction request
   * @param {number} requestId
   * @param {number} userId - ID of user making the request
   * @param {string} ipAddress
   * @param {boolean} isAdmin - Whether the caller is an admin (can delete any request)
   */
  static async cancelRequest(requestId, userId, ipAddress, isAdmin = false) {
    const request = await CorrectionRequest.findByPk(requestId);

    if (!request) {
      const error = new Error('Correction request not found');
      error.statusCode = 404;
      throw error;
    }

    if (!isAdmin) {
      if (request.user_id !== userId) {
        const error = new Error('Unauthorized to cancel this request');
        error.statusCode = 403;
        throw error;
      }
      if (request.status !== 'pending') {
        const error = new Error('Only pending requests can be cancelled');
        error.statusCode = 400;
        throw error;
      }
    }

    const oldValues = {
      id: request.id,
      status: request.status,
      type: request.type,
      date: request.date
    };

    await request.destroy();

    await AuditService.log({
      userId,
      action: isAdmin ? 'correction_delete' : 'correction_cancel',
      entityType: 'correction',
      entityId: requestId,
      oldValues,
      newValues: null,
      ipAddress,
    });

    return true;
  }
}

module.exports = CorrectionService;
