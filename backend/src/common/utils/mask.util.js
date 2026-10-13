/**
 * Helper to mask sensitive access tokens, secrets, and keys for Super Admin views
 */
export const maskToken = (token) => {
  if (!token || typeof token !== 'string') return '';
  if (token.length <= 8) return '********';
  return `${token.substring(0, 4)}...***${token.substring(token.length - 4)}`;
};

export const maskApiKey = (key) => {
  if (!key || typeof key !== 'string') return '';
  if (key.length <= 6) return '******';
  return `${key.substring(0, 3)}...${key.substring(key.length - 3)}`;
};
