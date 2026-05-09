const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loginSchema } = require('../validators/auth.validator');

// POST /api/auth/login — Public
router.post('/login', validate(loginSchema), AuthController.login);

// GET /api/auth/me — Protected (any role)
router.get('/me', authenticate, AuthController.getProfile);

module.exports = router;
