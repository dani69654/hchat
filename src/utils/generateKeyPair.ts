/**
 * Generates a new RSA key pair for encryption and signing.
 */
import { generateKeyPairSync } from 'crypto';
export const generateKeyPair = () => {
  return generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });
};
