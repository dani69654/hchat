/**
 * Generates a fresh session identity: an X25519 key pair for key agreement
 * (ECIES) and an Ed25519 key pair for signatures.
 */
import { generateKeyPairSync } from 'crypto';
import type { IdentityKeys } from '../lib/types';
import { computeFingerprint } from './keyBundle';

export const generateKeyPair = (): IdentityKeys => {
  const encryption = generateKeyPairSync('x25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  const signing = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return {
    encryption,
    signing,
    fingerprint: computeFingerprint({
      encryptionPublicKey: encryption.publicKey,
      signingPublicKey: signing.publicKey,
    }),
  };
};
