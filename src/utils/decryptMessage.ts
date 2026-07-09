/**
 * Opens an ECIES envelope: ECDH between our static X25519 key and the
 * message's ephemeral public key, HKDF-SHA256, then AES-256-GCM decryption.
 * Throws on any tampering (GCM tag or AAD mismatch) or malformed payload —
 * signature verification and replay/recipient checks happen in the caller,
 * which knows the sender's stored keys.
 */
import { createDecipheriv, createPrivateKey, createPublicKey, diffieHellman } from 'crypto';
import { ENVELOPE_AAD } from '../lib/constants';
import type { EncryptedEnvelope, SecurePayload } from '../lib/types';
import { deriveEnvelopeKey } from './encryptMessage';

export const decryptMessage = (args: { envelope: EncryptedEnvelope; encryptionPrivateKey: string }): SecurePayload => {
  const ephemeralDer = Buffer.from(args.envelope.epk, 'base64');
  const ephemeralKey = createPublicKey({ key: ephemeralDer, format: 'der', type: 'spki' });
  if (ephemeralKey.asymmetricKeyType !== 'x25519') {
    throw new Error('Unexpected ephemeral key type');
  }
  const privateKey = createPrivateKey(args.encryptionPrivateKey);
  const sharedSecret = diffieHellman({ privateKey, publicKey: ephemeralKey });
  const recipientDer = createPublicKey(privateKey).export({ type: 'spki', format: 'der' });
  const key = deriveEnvelopeKey(sharedSecret, ephemeralDer, recipientDer);

  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(args.envelope.iv, 'base64'));
  decipher.setAAD(Buffer.concat([Buffer.from(ENVELOPE_AAD), ephemeralDer]));
  decipher.setAuthTag(Buffer.from(args.envelope.tag, 'base64'));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(args.envelope.ct, 'base64')), decipher.final()]);

  const payload = JSON.parse(plaintext.toString()) as SecurePayload;
  if (
    typeof payload.message !== 'string' ||
    typeof payload.nonce !== 'string' ||
    typeof payload.sentAt !== 'number' ||
    typeof payload.to !== 'string' ||
    typeof payload.signature !== 'string'
  ) {
    throw new Error('Malformed payload');
  }
  return payload;
};
