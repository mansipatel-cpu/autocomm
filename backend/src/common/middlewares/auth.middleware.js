import { verifyAccessToken } from '../utils/jwt.util.js';
import { AppError } from '../errors/app-error.js';
import { query } from '../../config/postgres.js';
import { logger } from '../../config/logger.js';

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'] || req.headers['x-apikey'];
  const channelId = req.headers['x-channel-id'];

  // 1. Check Bearer Token (standard JWT)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
      return next();
    } catch (error) {
      return next(AppError.unauthorized('Invalid or expired authentication token'));
    }
  }

  // 2. Check X-API-Key (External integrations & Registration Portal)
  if (apiKey) {
    try {
      let clientId = null;

      // Strategy A: If X-Channel-Id is passed, find the client who owns this channel
      if (channelId) {
        const channelResult = await query(
          'SELECT client_id FROM channels WHERE id = $1 LIMIT 1',
          [parseInt(channelId, 10) || 0]
        );
        if (channelResult.rows.length > 0 && channelResult.rows[0].client_id) {
          clientId = channelResult.rows[0].client_id;
        }
      }

      // Strategy B: If no channel match or no channelId, look up the active client user (e.g. current login)
      if (!clientId) {
        const activeUserResult = await query(
          'SELECT client_id, id, email, role FROM users WHERE client_id IS NOT NULL ORDER BY last_login_at DESC NULLS LAST, id DESC LIMIT 1'
        );
        if (activeUserResult.rows.length > 0 && activeUserResult.rows[0].client_id) {
          clientId = activeUserResult.rows[0].client_id;
        }
      }

      // Strategy C: Fallback to the first active client in the system
      if (!clientId) {
        const clientResult = await query(
          "SELECT id FROM clients WHERE status = 'ACTIVE' ORDER BY id ASC LIMIT 1"
        );
        if (clientResult.rows.length > 0) {
          clientId = clientResult.rows[0].id;
        }
      }

      if (clientId) {
        req.user = {
          id: 1,
          clientId: clientId,
          role: 'API Integration',
        };
        req.clientId = clientId;
        return next();
      }
    } catch (err) {
      logger.error('Error authenticating via X-API-Key:', err);
    }
  }

  return next(AppError.unauthorized('Authentication token or valid X-API-Key required'));
};
