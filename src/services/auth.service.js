const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { User, Role } = require('../models');

// ─── Auth Service ─────────────────────────────────────────
// Handles login authentication and JWT token generation
// Password verification uses bcrypt comparison

class AuthService {
  /**
   * Authenticate user with email and password
   * @param {string} email
   * @param {string} password - Plain text password to verify
   * @returns {{ user: Object, token: string }}
   * @throws {Error} If credentials are invalid or account is inactive
   */
  static async login(email, password) {
    // 1. Find user by email (include password_hash for comparison)
    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: 'role' }],
    });

    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // 2. Check if account is active
    if (!user.is_active) {
      const error = new Error('Account is deactivated. Contact admin.');
      error.statusCode = 403;
      throw error;
    }

    // 3. Compare password with stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // 4. Generate JWT with user ID and role
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role.name,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // 5. Return user data (without password) and token
    const userData = user.toJSON();
    delete userData.password_hash;

    return { user: userData, token };
  }

  /**
   * Get current user profile (for /me endpoint)
   * @param {number} userId
   * @returns {Object} User without password
   */
  static async getProfile(userId) {
    const user = await User.findByPk(userId, {
      include: [{ model: Role, as: 'role' }],
      attributes: { exclude: ['password_hash'] },
    });

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    return user;
  }
}

module.exports = AuthService;
