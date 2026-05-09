const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { createUserSchema, updateUserSchema, updateRulesSchema } = require('../validators/admin.validator');

router.use(authenticate, authorize('admin'));

// Users
router.get('/users', AdminController.getUsers);
router.post('/users', validate(createUserSchema), AdminController.createUser);
router.put('/users/:id', validate(updateUserSchema), AdminController.updateUser);
router.delete('/users/:id', AdminController.deleteUser);

// Attendance & Corrections (full visibility)
router.get('/attendance', AdminController.getAllAttendance);
router.get('/corrections', AdminController.getAllCorrections);
router.delete('/corrections/:id', AdminController.deleteCorrection);

// Rules
router.get('/rules', AdminController.getRules);
router.put('/rules', validate(updateRulesSchema), AdminController.updateRules);

// Audit Logs
router.get('/audit-logs', AdminController.getAuditLogs);

// Roles lookup
router.get('/roles', AdminController.getRoles);

module.exports = router;
