/**
 * Phone formatting and validation helper (E.164 standard)
 */

export const E164_REGEX = /^\+[1-9]\d{7,14}$/;

/**
 * Validates whether a phone string conforms to E.164
 * e.g. "+14155552671", "+919876543210"
 */
export const isValidE164 = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const trimmed = phone.trim();
  return E164_REGEX.test(trimmed);
};

/**
 * Normalizes phone number into E.164 if possible
 */
export const normalizeToE164 = (countryCode, nationalNumber) => {
  if (!nationalNumber) return '';
  const cleanCode = (countryCode || '').trim().replace(/[^0-9+]/g, '');
  const cleanNumber = nationalNumber.trim().replace(/[^0-9]/g, '');

  let prefix = cleanCode.startsWith('+') ? cleanCode : `+${cleanCode}`;
  if (prefix === '+') prefix = '';

  // If national number already has a leading +, return stripped digits with leading +
  if (nationalNumber.trim().startsWith('+')) {
    return `+${cleanNumber}`;
  }

  return `${prefix}${cleanNumber}`;
};
