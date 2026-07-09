/**
 * Key-bundle wire format: export/parse the JSON bundle exchanged over
 * WhatsApp, and compute the fingerprint contacts compare out-of-band.
 */
import { createHash, createPublicKey } from 'crypto';
import { WIRE_VERSION } from '../lib/constants';
import type { ContactKeys, IdentityKeys } from '../lib/types';

/**
 * SHA-256 over both public keys (SPKI DER), shown as 8 groups of 4 hex chars
 * (128 bits). Both parties read this aloud / compare on a trusted channel to
 * rule out a man-in-the-middle during key exchange.
 */
export const computeFingerprint = (args: { encryptionPublicKey: string; signingPublicKey: string }): string => {
  const encDer = createPublicKey(args.encryptionPublicKey).export({ type: 'spki', format: 'der' });
  const sigDer = createPublicKey(args.signingPublicKey).export({ type: 'spki', format: 'der' });
  const digest = createHash('sha256').update(encDer).update(sigDer).digest('hex').toUpperCase();
  return digest.slice(0, 32).match(/.{4}/g)!.join(' ');
};

export const exportKeyBundle = (identity: IdentityKeys): string => {
  return JSON.stringify({
    hchat: WIRE_VERSION,
    type: 'keys',
    encryption: identity.encryption.publicKey,
    signing: identity.signing.publicKey,
  });
};

/**
 * Parses and validates a key bundle. Returns null unless the payload is a
 * well-formed v2 bundle whose keys really are X25519 + Ed25519 — anything
 * else (RSA keys, malformed PEM, wrong version) is rejected.
 */
export const parseKeyBundle = (body: string): ContactKeys | null => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const bundle = parsed as Record<string, unknown>;
  if (bundle.hchat !== WIRE_VERSION || bundle.type !== 'keys') return null;
  if (typeof bundle.encryption !== 'string' || typeof bundle.signing !== 'string') return null;
  try {
    if (createPublicKey(bundle.encryption).asymmetricKeyType !== 'x25519') return null;
    if (createPublicKey(bundle.signing).asymmetricKeyType !== 'ed25519') return null;
  } catch {
    return null;
  }
  return {
    encryption: bundle.encryption,
    signing: bundle.signing,
    fingerprint: computeFingerprint({ encryptionPublicKey: bundle.encryption, signingPublicKey: bundle.signing }),
  };
};
