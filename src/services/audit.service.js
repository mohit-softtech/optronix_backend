const { AuditLog } = require('../models');

// ─── Audit Logging Service ────────────────────────────────
// Creates immutable audit trail entries for all significant actions
// Called from other services after successful operations
//
// Usage:
//   await AuditService.log({
//     userId: req.user.id,
//     action: 'clock_in',
//     entityType: 'attendance',
//     entityId: record.id,
//     newValues: { clock_in: record.clock_in },
//     ipAddress: req.ip,
//   });

class AuditService {
  /**
   * Create an audit log entry
   * @param {Object} params
   * @param {number} params.userId - Who performed the action
   * @param {string} params.action - What action was taken
   * @param {string} params.entityType - What type of entity was affected
   * @param {number} [params.entityId] - ID of affected entity
   * @param {Object} [params.oldValues] - State before change
   * @param {Object} [params.newValues] - State after change
   * @param {string} [params.ipAddress] - Client IP
   */
  static async log({ userId, action, entityType, entityId = null, oldValues = null, newValues = null, ipAddress = null }) {
    try {
      await AuditLog.create({
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        old_values: oldValues,
        new_values: newValues,
        ip_address: ipAddress,
      });
    } catch (error) {
      // Audit logging should never break the main flow
      console.error('Audit log error:', error.message);
    }
  }
}

module.exports = AuditService;
