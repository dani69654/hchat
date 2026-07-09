import { EventEmitter } from 'events';
import type { Client } from 'whatsapp-web.js';
import type { FeedEvent, KeyPair, SessionStatus, UsrPks } from '../lib/types';

const MAX_FEED_EVENTS = 500;

export type Store = {
  status: SessionStatus;
  detail: string | null;
  error: string | null;
  torEnabled: boolean;
  qr: string | null;
  me: string | null;
  client: Client | null;
  keyPair: KeyPair | null;
  usrPks: UsrPks;
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
