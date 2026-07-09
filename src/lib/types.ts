/**
 * Per-session identity: an X25519 key pair for key agreement and an Ed25519
 * key pair for signatures, plus the fingerprint contacts verify out-of-band.
 * All keys are PEM strings (SPKI public / PKCS8 private).
 */
export type IdentityKeys = {
  encryption: { publicKey: string; privateKey: string };
  signing: { publicKey: string; privateKey: string };
  fingerprint: string;
};

/**
 * A contact's public key material, parsed from their key bundle.
 */
export type ContactKeys = {
  encryption: string;
  signing: string;
  fingerprint: string;
};

export type UsrPks = Record<string, ContactKeys>;

/**
 * Wire format of an encrypted message: an ECIES envelope. `epk` is the
 * per-message ephemeral X25519 public key (SPKI DER, base64); `iv`, `ct` and
 * `tag` are the AES-256-GCM parameters (base64).
 */
export type EncryptedEnvelope = {
  hchat: number;
  type: 'msg';
  epk: string;
  iv: string;
  ct: string;
  tag: string;
};

/**
 * What lives inside the ciphertext: the message, a random per-message nonce
 * (replay detection), the send timestamp, the recipient's key fingerprint
 * (prevents re-encrypting a captured message to a third party), and the
 * sender's Ed25519 signature over all of the above.
 */
export type SecurePayload = {
  message: string;
  nonce: string;
  sentAt: number;
  to: string;
  signature: string;
};

/**
 * Lifecycle of the server-side WhatsApp session.
 */
export type SessionStatus = 'idle' | 'checking_tor' | 'starting' | 'waiting_qr' | 'authenticating' | 'ready' | 'error';

/**
 * A single entry in the activity feed streamed to the browser.
 */
export type FeedEvent = {
  id: number;
  at: number;
  kind: 'incoming' | 'outgoing' | 'system';
  from?: string;
  to?: string;
  text: string;
  /** Signature verification result for incoming encrypted messages. */
  signature?: 'valid' | 'invalid' | 'unknown';
};

/**
 * Shape returned by GET /api/session.
 */
export type SessionInfo = {
  status: SessionStatus;
  /** Extra progress detail, e.g. the WhatsApp Web loading-screen percentage. */
  detail: string | null;
  error: string | null;
  torEnabled: boolean;
  qrDataUrl: string | null;
  me: string | null;
};

export type ChatInfo = {
  id: string;
  name: string;
  hasKey: boolean;
};
