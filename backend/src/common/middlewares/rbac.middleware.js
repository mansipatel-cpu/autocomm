import { AppError } from '../errors/app-error.js';
import { ROLES } from '../../config/constants.js';

export const PERMISSION_MATRIX = {
  // Super Admin has system-wide permissions
  [ROLES.SUPER_ADMIN]: ['*'],

  // Client Admin: Full control over their company tenant
  [ROLES.ADMIN]: [
    'dashboard:read',
    'campaigns:*',
    'templates:*',
    'contacts:*',
    'groups:*',
    'team-inbox:*',
    'channels:*',
    'ai-settings:*',
    'ai-agents:*',
    'knowledge-base:*',
    'voice-library:*',
    'calls:*',
    'quick-crm:*',
    'phone-numbers:*',
    'incoming-connections:*',
    'analytics:*',
    'api-docs:*',
    'users:*',
  ],

  // System Admin: Configuration & integrations
  [ROLES.SYSTEM_ADMIN]: [
    'dashboard:read',
    'channels:*',
    'ai-settings:*',
    'knowledge-base:*',
    'voice-library:*',
    'phone-numbers:*',
    'incoming-connections:*',
    'api-docs:*',
  ],

  // Admin Operator: Marketing, voice and CRM operations
  [ROLES.ADMIN_OPERATOR]: [
    'dashboard:read',
    'campaigns:*',
    'templates:*',
    'contacts:*',
    'groups:*',
    'calls:read',
    'quick-crm:*',
    'analytics:read',
  ],

  // Inbox Agent: Customer messaging and CRM updates
  [ROLES.INBOX_AGENT]: [
    'team-inbox:*',
    'contacts:read',
    'quick-crm:read',
    'quick-crm:update',
  ],
};

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(AppError.unauthorized('User identity or role missing'));
    }

    if (allowedRoles.includes(req.user.role) || req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    return next(AppError.forbidden(`Role '${req.user.role}' is not authorized to access this resource`));
  };
};

export const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(AppError.unauthorized('User identity missing'));
    }

    const userRole = req.user.role;
    const permissions = PERMISSION_MATRIX[userRole] || [];

    if (permissions.includes('*')) {
      return next();
    }

    const hasDirectMatch = permissions.includes(requiredPermission);
    const domain = requiredPermission.split(':')[0];
    const hasWildcardMatch = permissions.includes(`${domain}:*`);

    if (hasDirectMatch || hasWildcardMatch) {
      return next();
    }

    return next(AppError.forbidden(`Missing required permission: ${requiredPermission}`));
  };
};
