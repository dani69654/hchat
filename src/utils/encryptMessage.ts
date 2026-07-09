/**
 * ECIES encryption: a fresh ephemeral X25519 key pair per message is combined
 * with the recipient's static X25519 key (ECDH), the shared secret is expanded
 * with HKDF-SHA256 (bound to both public keys), and the payload is sealed with
 * AES-256-GCM. The ephemeral private key never leaves this function, so a
 * later compromise of either party's session keys cannot recover the
 * per-message AES key from the sender's side.
 *
 * The sealed payload carries the Ed25519 signature, a random nonce, the send
 * timestamp and the recipient's fingerprint — see SecurePayload in lib/types.
 */
import { createCipheriv, createPublicKey, diffieHellman, generateKeyPairSync, hkdfSync, randomBytes } from 'crypto';
import { ENVELOPE_AAD, HKDF_INFO, WIRE_VERSION } from '../lib/constants';
import type { ContactKeys, EncryptedEnvelope, SecurePayload } from '../lib/types';
import { signMessage } from './signMessage';

export const deriveEnvelopeKey = (sharedSecret: Buffer, ephemeralDer: Buffer, recipientDer: Buffer): Buffer => {
  if (sharedSecret.every(byte => byte === 0)) {
    throw new Error('Key agreement produced an all-zero secret (low-order public key)');
  }
  const info = Buffer.concat([Buffer.from(HKDF_INFO), ephemeralDer, recipientDer]);
  return Buffer.from(hkdfSync('sha256', sharedSecret, Buffer.alloc(0), info, 32));
};

export const encryptMessage = (args: {
  message: string;
  recipient: ContactKeys;
  senderSigningPrivateKey: string;
}): string => {
  const recipientKey = createPublicKey(args.recipient.encryption);
  const ephemeral = generateKeyPairSync('x25519');
  const sharedSecret = diffieHellman({ privateKey: ephemeral.privateKey, publicKey: recipientKey });
  const ephemeralDer = ephemeral.publicKey.export({ type: 'spki', format: 'der' });
  const recipientDer = recipientKey.export({ type: 'spki', format: 'der' });
  const key = deriveEnvelopeKey(sharedSecret, ephemeralDer, recipientDer);

  const payload: SecurePayload = {
    message: args.message,
    nonce: randomBytes(16).toString('base64'),
    sentAt: Date.now(),
    to: args.recipient.fingerprint,
    signature: '',
  };
  payload.signature = signMessage({
    message: payload.message,
    nonce: payload.nonce,
    sentAt: payload.sentAt,
    to: payload.to,
    privateKey: args.senderSigningPrivateKey,
  });

  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.concat([Buffer.from(ENVELOPE_AAD), ephemeralDer]));
  const ct = Buffer.concat([cipher.update(Buffer.from(JSON.stringify(payload))), cipher.final()]);

  const envelope: EncryptedEnvelope = {
    hchat: WIRE_VERSION,
    type: 'msg',
    epk: ephemeralDer.toString('base64'),
    iv: iv.toString('base64'),
    ct: ct.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
  };
  return JSON.stringify(envelope);
};
