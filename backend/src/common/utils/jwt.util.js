import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

export const signAccessToken = (payload) => {
  return jwt.sign(payload, env.JWT.ACCESS_SECRET, {
    expiresIn: env.JWT.ACCESS_EXPIRES_IN,
  });
};

export const generateAccessToken = signAccessToken;

export const signRefreshToken = (payload, rememberMe = false) => {
  return jwt.sign(payload, env.JWT.REFRESH_SECRET, {
    expiresIn: rememberMe ? '30d' : env.JWT.REFRESH_EXPIRES_IN,
  });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT.ACCESS_SECRET);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.JWT.REFRESH_SECRET);
};

export const signSuperAdminToken = (payload) => {
  return jwt.sign(payload, env.JWT.SUPERADMIN_SECRET, {
    expiresIn: env.JWT.SUPERADMIN_EXPIRES_IN,
    audience: 'autocomm:superadmin',
  });
};

export const verifySuperAdminToken = (token) => {
  return jwt.verify(token, env.JWT.SUPERADMIN_SECRET, {
    audience: 'autocomm:superadmin',
  });
};
