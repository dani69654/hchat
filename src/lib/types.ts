import type { KeyPairSyncResult } from 'crypto';

export type KeyPair = KeyPairSyncResult<string, string>;
export type UsrPks = Record<string, string>;

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
