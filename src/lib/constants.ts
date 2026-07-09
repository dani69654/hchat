/**
 * Wire-protocol message that asks a contact to reply with their public key bundle.
 */
export const PUBKEY_REQUEST = '!pubkey';

/**
 * Version tag carried by every hchat wire payload (messages and key bundles).
 */
export const WIRE_VERSION = 2;

/**
 * Domain-separation labels. Baked into the HKDF info, the AES-GCM AAD, and the
 * signed transcript so ciphertexts and signatures from one context can never be
 * replayed into another.
 */
export const HKDF_INFO = 'hchat/v2/ecies';
export const ENVELOPE_AAD = 'hchat/v2/envelope';
export const TRANSCRIPT_PREFIX = 'hchat/v2/transcript';
