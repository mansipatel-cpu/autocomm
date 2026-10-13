import { AppError } from '../errors/app-error.js';

export const requireTenant = (req, res, next) => {
  if (!req.user || !req.user.clientId) {
    return next(AppError.forbidden('Tenant context is missing. Action denied.'));
  }

  req.clientId = req.user.clientId;

  // Helper method attached to req for strict query scoping
  req.tenantFilter = (additionalFilter = {}) => {
    return {
      clientId: req.clientId,
      ...additionalFilter,
    };
  };

  next();
};

export const optionalTenantForSuperAdmin = (req, res, next) => {
  // If Super Admin supplies clientId query parameter or header, use it to inspect specific tenant
  const explicitClientId = req.query.clientId || req.headers['x-tenant-id'];
  if (explicitClientId && mongoose.Types.ObjectId.isValid(explicitClientId)) {
    req.targetClientId = new mongoose.Types.ObjectId(explicitClientId);
  }
  next();
};
