import { verifySuperAdminToken } from '../utils/jwt.util.js';
import { AppError } from '../errors/app-error.js';
import { ROLES } from '../../config/constants.js';

export const authenticateSuperAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Super Admin authentication token required'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifySuperAdminToken(token);
    if (decoded.role !== ROLES.SUPER_ADMIN) {
      return next(AppError.forbidden('Access restricted to Super Admin only'));
    }
    req.user = decoded;
    next();
  } catch (error) {
    return next(AppError.unauthorized('Invalid or expired Super Admin token'));
  }
};
