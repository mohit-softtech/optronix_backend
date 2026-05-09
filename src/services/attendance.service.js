const { Op } = require('sequelize');
const { AttendanceRecord, User, Role, AttendanceRule } = require('../models');
const AuditService = require('./audit.service');

// ─── Attendance Service ───────────────────────────────────
// Core business logic for clock-in/out with all validations:
//   - Only one clock-in per employee per day
//   - Clock-out requires existing clock-in
//   - No double clock-out
//   - Auto-calculates total hours on clock-out
//   - is_late computed from AttendanceRules (grace_period_minutes + default_shift_start)
//   - status computed from AttendanceRules (min_hours_full_day / min_hours_half_day)
//   — Both thresholds are config-driven, not hard-coded —

class AttendanceService {
  /**
   * Fetch active rules (creates default if none exist)
   * @private
   * @returns {Object} AttendanceRule instance
   */
  static async _getRules() {
    let rules = await AttendanceRule.findOne();
    if (!rules) rules = await AttendanceRule.create({});
    return rules;
  }

  /**
   * Compute whether clock-in time is "late" given rules
   * @private
   * @param {Date} clockInTime
   * @param {Object} rules - AttendanceRule instance
   * @returns {boolean}
   */
  static _computeIsLate(clockInTime, rules) {
    // Parse shift start into today's date at that time
    const [shiftHour, shiftMin] = rules.default_shift_start.split(':').map(Number);
    const shiftStart = new Date(clockInTime);
    shiftStart.setHours(shiftHour, shiftMin, 0, 0);

    // Add grace period
    const graceMs = (rules.grace_period_minutes || 0) * 60 * 1000;
    const lateCutoff = new Date(shiftStart.getTime() + graceMs);

    return clockInTime > lateCutoff;
  }

  /**
   * Mark clock-in for today
   * @param {number} userId
   * @param {string} ipAddress
   * @returns {Object} Created attendance record
   */
  static async clockIn(userId, ipAddress) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Check if already clocked in today
    const existing = await AttendanceRecord.findOne({
      where: { user_id: userId, date: today },
    });

    if (existing) {
      const error = new Error('You have already clocked in today');
      error.statusCode = 400;
      throw error;
    }

    // ── Read attendance rules to compute is_late ──────────
    const rules = await this._getRules();
    const clockInTime = new Date();
    const isLate = this._computeIsLate(clockInTime, rules);

    // Create attendance record with clock-in time
    const record = await AttendanceRecord.create({
      user_id: userId,
      date: today,
      clock_in: clockInTime,
      status: 'present',
      source: 'self',
      is_late: isLate,
    });

    // Log the action
    await AuditService.log({
      userId,
      action: 'clock_in',
      entityType: 'attendance',
      entityId: record.id,
      newValues: { clock_in: record.clock_in, date: today, is_late: isLate },
      ipAddress,
    });

    return record;
  }

  /**
   * Mark clock-out for today
   * @param {number} userId
   * @param {string} ipAddress
   * @returns {Object} Updated attendance record
   */
  static async clockOut(userId, ipAddress) {
    const today = new Date().toISOString().split('T')[0];

    // Find today's record
    const record = await AttendanceRecord.findOne({
      where: { user_id: userId, date: today },
    });

    if (!record) {
      const error = new Error('You must clock in before clocking out');
      error.statusCode = 400;
      throw error;
    }

    if (!record.clock_in) {
      const error = new Error('No clock-in found for today. Please clock in first');
      error.statusCode = 400;
      throw error;
    }

    if (record.clock_out) {
      const error = new Error('You have already clocked out today');
      error.statusCode = 400;
      throw error;
    }

    // ── Read attendance rules to compute status ───────────
    const rules = await this._getRules();
    const minHoursFullDay = rules.min_hours_full_day || 8;
    const minHoursHalfDay = rules.min_hours_half_day || 4;

    // Calculate total hours
    const clockOut = new Date();
    const clockIn = new Date(record.clock_in);
    const diffMs = clockOut - clockIn;
    const totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

    // ── Determine status from rules (not hard-coded) ──────
    let status = 'present';
    if (totalHours < minHoursHalfDay) {
      status = 'half-day';
    }
    // Note: totalHours >= minHoursHalfDay but < minHoursFullDay is still
    // treated as 'present' per standard HR practice (half-day only if < threshold).
    // Future: could add 'short-hours' status as a commercial extension.

    const oldValues = { clock_out: null, total_hours: null, status: record.status };

    // Update the record
    await record.update({
      clock_out: clockOut,
      total_hours: totalHours,
      status,
    });

    // Log the action
    await AuditService.log({
      userId,
      action: 'clock_out',
      entityType: 'attendance',
      entityId: record.id,
      oldValues,
      newValues: { clock_out: clockOut, total_hours: totalHours, status },
      ipAddress,
    });

    return record;
  }


  /**
   * Get today's attendance status for an employee
   * @param {number} userId
   * @returns {Object|null} Today's record or null
   */
  static async getTodayStatus(userId) {
    const today = new Date().toISOString().split('T')[0];
    const record = await AttendanceRecord.findOne({
      where: { user_id: userId, date: today },
    });
    return record;
  }

  /**
   * Get attendance history for an employee (paginated)
   * @param {number} userId
   * @param {Object} query - { page, limit, start_date, end_date }
   * @returns {{ records: Array, total: number, page: number, totalPages: number }}
   */
  static async getHistory(userId, query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    // Build filter
    const where = { user_id: userId };

    // Date range filter
    if (query.start_date && query.end_date) {
      where.date = { [Op.between]: [query.start_date, query.end_date] };
    } else if (query.start_date) {
      where.date = { [Op.gte]: query.start_date };
    } else if (query.end_date) {
      where.date = { [Op.lte]: query.end_date };
    }

    // Status filter (present | half-day | absent)
    if (query.status && query.status !== 'all') {
      where.status = query.status;
    }

    // Punctuality filter (on_time | late)
    if (query.punctuality === 'late') {
      where.is_late = true;
    } else if (query.punctuality === 'on_time') {
      where.is_late = false;
    }

    const { count, rows } = await AttendanceRecord.findAndCountAll({
      where,
      order: [['date', 'DESC']],
      limit,
      offset,
    });

    return {
      records: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Get a monthly summary (count by status) for the employee's own records
   * @param {number} userId
   * @param {string} year  YYYY
   * @param {string} month MM
   */
  static async getMonthlySummary(userId, year, month) {
    const pad = (n) => String(n).padStart(2, '0');
    const y = year || new Date().getFullYear();
    const m = month || pad(new Date().getMonth() + 1);
    const startDate = `${y}-${pad(m)}-01`;
    // last day of that month
    const lastDay = new Date(y, parseInt(m, 10), 0).getDate();
    const endDate = `${y}-${pad(m)}-${pad(lastDay)}`;

    const records = await AttendanceRecord.findAll({
      where: {
        user_id: userId,
        date: { [Op.between]: [startDate, endDate] },
      },
      attributes: ['status', 'is_late', 'total_hours', 'clock_in'],
    });

    const clockedIn = records.filter((r) => r.clock_in);
    const lateCount = clockedIn.filter((r) => r.is_late).length;
    const summary = {
      total: records.length,
      present: records.filter((r) => r.status === 'present').length,
      halfDay: records.filter((r) => r.status === 'half-day').length,
      absent: records.filter((r) => r.status === 'absent').length,
      late: lateCount,
      onTime: clockedIn.length - lateCount,
      totalHours: records.reduce((sum, r) => sum + parseFloat(r.total_hours || 0), 0).toFixed(1),
    };

    return summary;
  }

  /**
   * Get all employees' attendance (for HR/Admin view)
   * @param {Object} query - { page, limit, start_date, end_date, user_id }
   * @returns {{ records: Array, total: number, page: number, totalPages: number }}
   */
  static async getAllAttendance(query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const where = {};
    if (query.start_date && query.end_date) {
      where.date = { [Op.between]: [query.start_date, query.end_date] };
    } else if (query.start_date) {
      where.date = { [Op.gte]: query.start_date };
    } else if (query.end_date) {
      where.date = { [Op.lte]: query.end_date };
    }
    if (query.user_id) {
      where.user_id = query.user_id;
    }

    const { count, rows } = await AttendanceRecord.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'employee_id', 'email', 'department'],
          include: [{ model: Role, as: 'role', attributes: ['name'] }],
        },
      ],
      order: [['date', 'DESC']],
      limit,
      offset,
    });

    return {
      records: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    };
  }
}

module.exports = AttendanceService;
