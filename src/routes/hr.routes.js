const express = require('express');
const router = express.Router();
const HRController = require('../controllers/hr.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { reviewCorrectionSchema } = require('../validators/correction.validator');

router.use(authenticate, authorize('hr'));

// GET /api/hr/corrections — View all correction requests
router.get('/corrections', HRController.getAllCorrections);

// PUT /api/hr/corrections/:id — Approve or reject
router.put('/corrections/:id', validate(reviewCorrectionSchema), HRController.reviewCorrection);

// GET /api/hr/attendance — View all employee attendance
router.get('/attendance', HRController.getAllAttendance);

module.exports = router;
