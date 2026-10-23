import { config } from '../config/env.js';

/**
 * Admin Password Authentication Middleware
 * Protects Page 2 Admin Endpoints using ADMIN_PASSWORD
 */
export const requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const adminHeader = req.headers['x-admin-password'];
  const queryToken = req.query.token;

  let providedPassword = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    providedPassword = authHeader.slice(7).trim();
  } else if (adminHeader) {
    providedPassword = String(adminHeader).trim();
  } else if (queryToken) {
    providedPassword = String(queryToken).trim();
  }

  if (!providedPassword || providedPassword !== config.admin.password) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid admin credentials.',
    });
  }

  next();
};
