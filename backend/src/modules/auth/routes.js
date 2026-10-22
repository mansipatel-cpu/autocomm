import { Router } from 'express';
import { AuthController } from './controller.js';
import { validate } from '../../common/middlewares/validator.middleware.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { loginSchema, refreshTokenSchema, changePasswordSchema } from './validation.js';

const router = Router();

router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.post('/change-password', authenticate, validate(changePasswordSchema), AuthController.changePassword);
router.get('/me', authenticate, AuthController.getMe);

// OTP Registration & Onboarding Routes
router.post('/send-otp', AuthController.sendOtp);
router.post('/verify-otp', AuthController.verifyOtp);
router.post('/register', AuthController.register);

// Forgot Password OTP Flow
router.post('/forgot-password/send-otp', AuthController.forgotPasswordSendOtp);
router.post('/forgot-password/verify-otp', AuthController.forgotPasswordVerifyOtp);
router.post('/forgot-password/reset', AuthController.forgotPasswordReset);

export default router;
