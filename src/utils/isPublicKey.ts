/**
 * Checks if a string contains a PEM-encoded public key.
 */
export const isPublicKey = (message: string) => {
  return message.includes('-----BEGIN PUBLIC KEY-----') && message.includes('-----END PUBLIC KEY-----');
};
