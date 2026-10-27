import { Router } from 'express';
import { RegistrationService } from '../services/registration.service.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * POST /api/register
 * Step 1-6 Registration Flow
 */
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, phone, company, consent } = req.body;

    logger.info(`Received registration request for phone ${phone}`);

    const result = await RegistrationService.registerUser({
      fullName,
      email,
      phone,
      company,
      consent,
    });

    return res.status(201).json({
      success: true,
      data: {
        id: result.id,
        fullName: result.full_name,
        phone: result.phone,
        status: result.status,
        contactStatus: result.contact_status,
        messageStatus: result.message_status,
        callStatus: result.call_status,
        createdAt: result.created_at,
        message: "You're registered successfully! Your contact details have been synced with AutoComm.",
      },
    });
  } catch (error) {
    logger.warn(`Registration rejected: ${error.message}`);
    return res.status(400).json({
      success: false,
      error: error.message || 'Registration failed. Please check your details and try again.',
    });
  }
});

export default router;
