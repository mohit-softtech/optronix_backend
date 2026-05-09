// ─── Role-Based Access Control (RBAC) Middleware ───────────
// Factory function that returns middleware checking if user has one of the allowed roles
// Usage: authorize('admin', 'hr') → only admin and HR can access
//
// Flow: authenticate (sets req.user) → authorize (checks role) → controller
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user is set by auth.js middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const userRole = req.user.role?.name;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${userRole || 'unknown'}.`,
      });
    }

    next();
  };
};

module.exports = authorize;
