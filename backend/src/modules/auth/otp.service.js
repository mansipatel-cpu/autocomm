import { User } from '../users/model.js';
import { Client } from '../clients/model.js';
import { Channel } from '../channels/model.js';
import { EmailService } from '../../integrations/email/nodemailer.service.js';
import { hashPassword } from '../../common/utils/crypto.util.js';
import { signAccessToken, signRefreshToken } from '../../common/utils/jwt.util.js';
import { ROLES, USER_STATUS, CLIENT_STATUS } from '../../config/constants.js';
import { logger } from '../../config/logger.js';
import { AppError } from '../../common/errors/app-error.js';

import { query } from '../../config/postgres.js';

// OTP Configuration: 2 minutes expiry as requested
export const OTP_TTL_MS = 2 * 60 * 1000; // 2 minutes (120 seconds)
export const OTP_EXPIRY_MINUTES = 2;

// In-memory OTP store with automatic expiry + DB persistence
const otpStore = new Map();

const setOtp = async (key, otp, ttlMs = OTP_TTL_MS) => {
  const expiresAtMs = Date.now() + ttlMs;
  const expiresAtDate = new Date(expiresAtMs);
  otpStore.set(key, { otp: String(otp), expiresAt: expiresAtMs });

  try {
    await query(
      `INSERT INTO auth_otps (key, otp, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (key) DO UPDATE 
       SET otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at, created_at = NOW();`,
      [key, String(otp), expiresAtDate]
    );
  } catch (err) {
    logger.warn(`Database OTP persistence note for ${key}: ${err.message}`);
  }

  setTimeout(() => {
    const item = otpStore.get(key);
    if (item && item.expiresAt <= Date.now()) {
      otpStore.delete(key);
    }
  }, ttlMs);
};

const getOtp = async (key) => {
  // 1. Check in-memory store
  const item = otpStore.get(key);
  if (item && item.expiresAt > Date.now()) {
    return item.otp;
  }

  // 2. Query persistent PostgreSQL store
  try {
    const res = await query(
      `SELECT otp, expires_at FROM auth_otps WHERE key = $1 AND expires_at > NOW();`,
      [key]
    );
    if (res && res.rows && res.rows.length > 0) {
      const dbOtp = String(res.rows[0].otp);
      const dbExpiresAt = new Date(res.rows[0].expires_at).getTime();
      otpStore.set(key, { otp: dbOtp, expiresAt: dbExpiresAt });
      return dbOtp;
    }
  } catch (err) {
    logger.warn(`Database OTP lookup note for ${key}: ${err.message}`);
  }

  return null;
};

const deleteOtp = async (key) => {
  otpStore.delete(key);
  try {
    await query(`DELETE FROM auth_otps WHERE key = $1;`, [key]);
  } catch (err) {
    logger.warn(`Database OTP delete note for ${key}: ${err.message}`);
  }
};

export class OtpService {
  /**
   * Send 6-digit OTP for new user registration
   */
  static async sendRegistrationOtp({ email, name }) {
    if (!email) {
      throw AppError.badRequest('Email address is required');
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw AppError.badRequest('An account with this email address already exists. Please log in.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const storeKey = `register:${normalizedEmail}`;
    await setOtp(storeKey, otp, OTP_TTL_MS); // 2 minutes

    logger.info(`🔑 [OTP] Registration verification code for ${normalizedEmail}: ${otp} (valid for ${OTP_EXPIRY_MINUTES}m)`);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded: 8px;">
        <h2 style="color: #1e293b; margin-bottom: 12px;">AutoComm Account Verification</h2>
        <p style="color: #475569; font-size: 15px;">Hello ${name || 'there'},</p>
        <p style="color: #475569; font-size: 15px;">Your verification code to complete your AutoComm registration is:</p>
        <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0284c7;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 13px;">This code will expire in ${OTP_EXPIRY_MINUTES} minutes. If you did not request this verification, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">AutoComm Platform Operations</p>
      </div>
    `;

    const emailResult = await EmailService.sendEmail({
      to: normalizedEmail,
      subject: `Your AutoComm Verification Code: ${otp}`,
      html,
      text: `Your AutoComm verification code is: ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    });

    if (!emailResult.success) {
      logger.error(`❌ Failed to send verification email to ${normalizedEmail}: ${emailResult.error}`);
      throw AppError.internal(`Failed to deliver verification email: ${emailResult.error}`);
    }

    return {
      success: true,
      message: `Verification code sent to your email address (valid for ${OTP_EXPIRY_MINUTES} minutes)`,
      expiresInSeconds: OTP_TTL_MS / 1000,
    };
  }

  /**
   * Verify registration OTP
   */
  static async verifyRegistrationOtp({ email, otpCode }) {
    if (!email || !otpCode) {
      throw AppError.badRequest('Email and OTP code are required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = String(otpCode).trim();
    const storeKey = `register:${normalizedEmail}`;
    const storedOtp = await getOtp(storeKey);

    logger.info(`🔍 [OTP] Verifying registration code for ${normalizedEmail}. Input: "${cleanOtp}", Found: "${storedOtp || 'NONE'}"`);

    if (!storedOtp) {
      throw AppError.badRequest('Verification code has expired or is invalid. Please request a new code.');
    }

    if (storedOtp !== cleanOtp) {
      throw AppError.badRequest('Invalid verification code. Please check and try again.');
    }

    // Mark as verified for 15 minutes to allow registration form completion
    await setOtp(`verified_register:${normalizedEmail}`, 'true', 15 * 60 * 1000);
    await deleteOtp(storeKey);

    return {
      success: true,
      message: 'Email verified successfully',
    };
  }

  /**
   * Complete registration and provision new tenant workspace
   */
  static async register({ email, password, name }) {
    if (!email || !password || !name) {
      throw AppError.badRequest('Name, email, and password are required');
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw AppError.badRequest('An account with this email address already exists. Please log in.');
    }

    // 1. Provision new Client Workspace
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const clientCode = `CLI-${randomSuffix}`;

    const client = await Client.create({
      companyName: `${name.trim()}'s Organization`,
      clientCode,
      status: CLIENT_STATUS.ACTIVE,
      plan: 'Starter',
      contactNumber: '+1000000000',
      adminEmail: normalizedEmail,
      credits: 1000.0,
      assignedPhoneNumbers: [],
    });

    // 2. Provision Admin User
    const passwordHash = await hashPassword(password);
    const user = await User.create({
      clientId: client._id,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
      mustChangePassword: false,
    });

    // 3. Provision Default WhatsApp Channel for Workspace
    await Channel.create({
      clientId: client._id,
      channelName: `${name.trim()}'s WhatsApp`,
      status: 'CONNECTED',
      phoneNumberId: '',
      wabaId: '',
      accessToken: '',
      healthStatus: 'healthy',
    }).catch((err) => {
      logger.warn(`Default channel creation note: ${err.message}`);
    });

    // Clear verification marker
    await deleteOtp(`verified_register:${normalizedEmail}`);

    // 4. Issue JWT Auth Tokens
    const payload = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      clientId: client._id.toString(),
      mustChangePassword: false,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload, false);

    logger.info(`✅ New client registered: ${user.email} (Tenant: ${client.companyName} / ${client.clientCode})`);

    return {
      success: true,
      message: 'Registration successful',
      token: accessToken,
      accessToken,
      refreshToken,
      expiresIn: 3600,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        clientId: client._id,
      },
    };
  }

  /**
   * Send 6-digit OTP for Forgot Password
   */
  static async sendForgotPasswordOtp({ email }) {
    if (!email) {
      throw AppError.badRequest('Email address is required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      throw AppError.notFound('No account found with this email address.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const storeKey = `reset:${normalizedEmail}`;
    await setOtp(storeKey, otp, OTP_TTL_MS);

    logger.info(`🔑 [OTP] Password reset code for ${normalizedEmail}: ${otp} (valid for ${OTP_EXPIRY_MINUTES}m)`);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded: 8px;">
        <h2 style="color: #1e293b; margin-bottom: 12px;">AutoComm Password Reset</h2>
        <p style="color: #475569; font-size: 15px;">Hello,</p>
        <p style="color: #475569; font-size: 15px;">You requested a password reset for your AutoComm account. Use the code below to reset your password:</p>
        <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #dc2626;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 13px;">This code will expire in ${OTP_EXPIRY_MINUTES} minutes. If you did not make this request, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">AutoComm Platform Operations</p>
      </div>
    `;

    const emailResult = await EmailService.sendEmail({
      to: normalizedEmail,
      subject: `Your AutoComm Password Reset Code: ${otp}`,
      html,
      text: `Your AutoComm password reset code is: ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    });

    if (!emailResult.success) {
      logger.error(`❌ Failed to send password reset email to ${normalizedEmail}: ${emailResult.error}`);
      throw AppError.internal(`Failed to deliver password reset email: ${emailResult.error}`);
    }

    return {
      success: true,
      message: `Password reset code sent to your email (valid for ${OTP_EXPIRY_MINUTES} minutes)`,
      expiresInSeconds: OTP_TTL_MS / 1000,
    };
  }

  /**
   * Verify Forgot Password OTP
   */
  static async verifyForgotPasswordOtp({ email, otpCode }) {
    if (!email || !otpCode) {
      throw AppError.badRequest('Email and OTP code are required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = String(otpCode).trim();
    const storeKey = `reset:${normalizedEmail}`;
    const storedOtp = await getOtp(storeKey);

    logger.info(`🔍 [OTP] Verifying reset code for ${normalizedEmail}. Input: "${cleanOtp}", Found: "${storedOtp || 'NONE'}"`);

    if (!storedOtp) {
      throw AppError.badRequest('Password reset code has expired or is invalid. Please request a new code.');
    }

    if (storedOtp !== cleanOtp) {
      throw AppError.badRequest('Invalid verification code. Please check and try again.');
    }

    await setOtp(`verified_reset:${normalizedEmail}`, 'true', 15 * 60 * 1000);
    await deleteOtp(storeKey);

    return {
      success: true,
      message: 'Password reset code verified successfully',
    };
  }

  /**
   * Reset Password with new password
   */
  static async resetPassword({ email, newPassword }) {
    if (!email || !newPassword) {
      throw AppError.badRequest('Email and new password are required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      throw AppError.notFound('User not found');
    }

    user.passwordHash = await hashPassword(newPassword);
    user.mustChangePassword = false;
    await user.save();

    await deleteOtp(`verified_reset:${normalizedEmail}`);

    logger.info(`✅ Password reset successfully for ${normalizedEmail}`);

    return {
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    };
  }
}
