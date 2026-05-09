const express = require('express');
const router = express.Router();
const AttendanceController = require('../controllers/attendance.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');

// All attendance routes require authentication
router.use(authenticate);

// POST /api/attendance/clock-in — Employee only
router.post('/clock-in', authorize('employee'), AttendanceController.clockIn);

// POST /api/attendance/clock-out — Employee only
router.post('/clock-out', authorize('employee'), AttendanceController.clockOut);

// GET /api/attendance/today — Employee only
router.get('/today', authorize('employee'), AttendanceController.getTodayStatus);

// GET /api/attendance/history — Employee only (supports: start_date, end_date, status, punctuality)
router.get('/history', authorize('employee'), AttendanceController.getHistory);

// GET /api/attendance/summary — Employee monthly summary
router.get('/summary', authorize('employee'), AttendanceController.getMonthlySummary);

module.exports = router;

