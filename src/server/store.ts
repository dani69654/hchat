import { EventEmitter } from 'events';
import type { Client } from 'whatsapp-web.js';
import type { FeedEvent, IdentityKeys, SessionStatus, UsrPks } from '../lib/types';

const MAX_FEED_EVENTS = 500;
const MAX_SEEN_NONCES = 5000;

export type Store = {
  status: SessionStatus;
  detail: string | null;
  error: string | null;
  torEnabled: boolean;
  qr: string | null;
  me: string | null;
  client: Client | null;
  keyPair: IdentityKeys | null;
  usrPks: UsrPks;
  /** Nonces of messages already accepted this session, for replay detection. */
  seenNonces: Set<string>;
  events: FeedEvent[];
  nextEventId: number;
  emitter: EventEmitter;
};

const createStore = (): Store => {
  const emitter = new EventEmitter();
  emitter.setMaxListeners(0);
  return {
    status: 'idle',
    detail: null,
    error: null,
    torEnabled: false,
    qr: null,
    me: null,
    client: null,
    keyPair: null,
    usrPks: {},
    seenNonces: new Set(),
    events: [],
    nextEventId: 1,
    emitter,
  };
};

// The WhatsApp client must survive Next.js dev-mode module reloads,
// so the store lives on globalThis.
const g = globalThis as typeof globalThis & { __hchatStore?: Store };
export const store: Store = (g.__hchatStore ??= createStore());

/**
 * Records a message nonce, evicting the oldest once the set is full so the
 * replay window stays bounded in memory.
 */
export const rememberNonce = (nonce: string): void => {
  store.seenNonces.add(nonce);
  if (store.seenNonces.size > MAX_SEEN_NONCES) {
    const oldest = store.seenNonces.values().next().value;
    if (oldest !== undefined) store.seenNonces.delete(oldest);
  }
};

/**
 * Appends an entry to the activity feed and notifies SSE subscribers.
 */
export const pushEvent = (event: Omit<FeedEvent, 'id' | 'at'>): FeedEvent => {
  const full: FeedEvent = { ...event, id: store.nextEventId++, at: Date.now() };
  store.events.push(full);
  if (store.events.length > MAX_FEED_EVENTS) {
    store.events.splice(0, store.events.length - MAX_FEED_EVENTS);
  }
  store.emitter.emit('event', full);
  return full;
};
