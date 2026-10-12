import { AppError } from '../errors/app-error.js';

export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (error) {
      const details = error.errors?.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      })) || [error.message];

      const primaryMessage = details[0]?.message || 'Validation error';
      next(AppError.badRequest(primaryMessage, details));
    }
  };
};
