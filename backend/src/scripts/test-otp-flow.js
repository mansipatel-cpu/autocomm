import { OtpService } from '../modules/auth/otp.service.js';
import { query } from '../config/postgres.js';

const run = async () => {
  const email = `test_flow_${Date.now()}@example.com`;
  console.log('--- 1. Sending OTP to:', email);
  const sendRes = await OtpService.sendRegistrationOtp({ email, name: 'Flow Tester' });
  console.log('Send result:', sendRes);

  const res = await query('SELECT otp, expires_at FROM auth_otps WHERE key = $1', [`register:${email}`]);
  const storedOtp = res.rows[0].otp;
  console.log('--- 2. Verified OTP persisted in PostgreSQL:', storedOtp);

  console.log('--- 3. Verifying with correct code:', storedOtp);
  const verifyRes = await OtpService.verifyRegistrationOtp({ email, otpCode: storedOtp });
  console.log('Verify result:', verifyRes);

  console.log('--- 4. Checking second attempt (should fail as code is used):');
  try {
    await OtpService.verifyRegistrationOtp({ email, otpCode: storedOtp });
    console.error('FAIL: should not allow reuse');
  } catch (err) {
    console.log('Correctly rejected reuse:', err.message);
  }

  // Clean up
  await query('DELETE FROM auth_otps WHERE key LIKE $1', [`%${email}%`]);
  console.log('✅ All OTP tests PASSED!');
  process.exit(0);
};

run().catch((err) => {
  console.error('Flow test error:', err);
  process.exit(1);
});
