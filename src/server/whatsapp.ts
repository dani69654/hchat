import { Client } from 'whatsapp-web.js';
import type { Message } from 'whatsapp-web.js';
import { store, pushEvent, rememberNonce } from './store';
import { PUBKEY_REQUEST, WIRE_VERSION } from '../lib/constants';
import type { EncryptedEnvelope } from '../lib/types';
import { generateKeyPair } from '../utils/generateKeyPair';
import { verifyMessage } from '../utils/verifyMessage';
import { encryptMessage } from '../utils/encryptMessage';
import { decryptMessage } from '../utils/decryptMessage';
import { exportKeyBundle, parseKeyBundle } from '../utils/keyBundle';
import { checkTorConnection, getTorPuppeteerArgs, getTorSocksAddress } from '../utils/tor';
import { getBaseBrowserArgs, getBrowserExecutablePath } from '../utils/browser';

/**
 * Starts the WhatsApp session. No-op if a session is already starting or running.
 * @param opts.tor Route the underlying browser through the local Tor SOCKS5 proxy
 */
export const startSession = async (opts: { tor: boolean }): Promise<void> => {
  if (store.status !== 'idle' && store.status !== 'error') {
    return;
  }
  store.error = null;
  store.torEnabled = opts.tor;

  if (opts.tor) {
    store.status = 'checking_tor';
    const isTor = await checkTorConnection();
    if (!isTor) {
      store.status = 'error';
      store.error = `Tor check failed: traffic is NOT routed through Tor. Make sure Tor is running on ${getTorSocksAddress()}.`;
      return;
    }
    pushEvent({ kind: 'system', text: '🟢 Tor check passed: traffic is routed through Tor.' });
  }

  store.status = 'starting';
  const client = new Client({
    puppeteer: {
      executablePath: getBrowserExecutablePath(),
      args: [...getBaseBrowserArgs(), ...(opts.tor ? getTorPuppeteerArgs() : [])],
    },
  });
  store.client = client;

  client.on('qr', qr => {
    store.qr = qr;
    store.status = 'waiting_qr';
    store.detail = null;
  });

  client.on('authenticated', () => {
    store.qr = null;
    store.status = 'authenticating';
    store.detail = null;
  });

  client.on('loading_screen', (percent, message) => {
    store.status = 'authenticating';
    store.detail = `Loading WhatsApp Web… ${percent}% ${message ?? ''}`.trim();
  });

  client.on('change_state', state => {
    store.detail = `Connection state: ${state}`;
    console.log('[hchat] change_state:', state);
  });

  client.on('auth_failure', message => {
    store.status = 'error';
    store.error = `Authentication failed: ${message}`;
    store.qr = null;
    store.detail = null;
  });

  client.on('ready', () => {
    store.qr = null;
    store.status = 'ready';
    store.detail = null;
    store.me = client.info?.wid?._serialized ?? null;
    store.keyPair = generateKeyPair();
    store.seenNonces = new Set();
    store.sharedWith = new Set();
    pushEvent({
      kind: 'system',
      text: '✅ Connected to WhatsApp. Fresh X25519 + Ed25519 identity generated for this session.',
    });
    pushEvent({
      kind: 'system',
      text: `🔐 Your key fingerprint: ${store.keyPair.fingerprint} — have contacts verify it over a trusted channel (call, in person).`,
    });
  });

  client.on('disconnected', reason => {
    store.status = 'error';
    store.error = `Disconnected from WhatsApp: ${reason}`;
    store.client = null;
    store.keyPair = null;
    store.qr = null;
    pushEvent({ kind: 'system', text: `⚠️ Disconnected from WhatsApp (${reason}).` });
  });

  client.on('message', async msg => {
    try {
      await routeIncomingMessage(msg);
    } catch (error) {
      pushEvent({
        kind: 'system',
        text: `❌ Error handling message from ${msg.from}: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  });

  client.initialize().catch(error => {
    store.status = 'error';
    store.error = error instanceof Error ? error.message : String(error);
    store.client = null;
  });
};

/**
 * Routes an incoming WhatsApp message (hchat v2 wire protocol):
 * - `{hchat: 2, type: 'msg'}` envelopes are decrypted, checked and verified
 * - `{hchat: 2, type: 'keys'}` bundles are validated and stored for the sender
 * - `!pubkey` requests are answered with our key bundle
 * - v1 (RSA-era) payloads are flagged as incompatible
 */
const routeIncomingMessage = async (msg: Message): Promise<void> => {
  const body = msg.body;

  let parsed: Record<string, unknown> | null = null;
  try {
    const candidate = JSON.parse(body);
    if (candidate && typeof candidate === 'object') parsed = candidate;
  } catch {}

  if (parsed?.hchat === WIRE_VERSION && parsed.type === 'msg') {
    handleEncryptedMessage(msg, parsed as unknown as EncryptedEnvelope);
    return;
  }

  const bundle = parseKeyBundle(body);
  if (bundle) {
    store.usrPks[msg.from] = bundle;
    pushEvent({
      kind: 'system',
      text: `📝 Key bundle stored for ${msg.from}. Fingerprint: ${bundle.fingerprint} — verify it with them over a trusted channel.`,
    });
    // Complete the handshake automatically: reply with our own bundle, unless
    // we already sent it (which is what triggered their bundle in the first
    // place) — that guard is what prevents an infinite share loop.
    if (store.keyPair && !store.sharedWith.has(msg.from)) {
      store.sharedWith.add(msg.from);
      await msg.reply(exportKeyBundle(store.keyPair));
      pushEvent({ kind: 'system', text: `🔑 Key bundle sent back to ${msg.from} — keys exchanged automatically.` });
    }
    return;
  }

  // v1 (RSA) clients send PEM keys or {encrypted, signature} payloads.
  if (body.includes('-----BEGIN PUBLIC KEY-----') || (parsed && 'encrypted' in parsed && 'signature' in parsed)) {
    pushEvent({
      kind: 'system',
      text: `⚠️ ${msg.from} is running an old hchat version (RSA protocol). Ask them to update — v1 payloads are not supported.`,
    });
    return;
  }

  if (body === PUBKEY_REQUEST) {
    if (store.keyPair) {
      store.sharedWith.add(msg.from);
      await msg.reply(exportKeyBundle(store.keyPair));
      pushEvent({ kind: 'system', text: `🔑 Key bundle sent to ${msg.from} (requested).` });
    } else {
      await msg.reply('❌ Key pair not ready yet');
    }
  }
};

/**
 * Decrypts an incoming envelope, then enforces the payload checks: it must be
 * addressed to our current identity, its nonce must be fresh, and its
 * signature must verify against the sender's stored signing key.
 */
const handleEncryptedMessage = (msg: Message, envelope: EncryptedEnvelope): void => {
  if (!store.keyPair) {
    pushEvent({ kind: 'system', text: `❌ Cannot decrypt message from ${msg.from}: key pair not ready.` });
    return;
  }
  let payload;
  try {
    payload = decryptMessage({ envelope, encryptionPrivateKey: store.keyPair.encryption.privateKey });
  } catch {
    pushEvent({
      kind: 'system',
      text: `⚠️ Received an encrypted message from ${msg.from} that could not be decrypted (wrong key or tampered).`,
    });
    return;
  }
  if (payload.to !== store.keyPair.fingerprint) {
    pushEvent({
      kind: 'system',
      text: `⚠️ Message from ${msg.from} was encrypted for a different identity (${payload.to}) — possible forwarding of a captured message. Ignored.`,
    });
    return;
  }
  if (store.seenNonces.has(payload.nonce)) {
    pushEvent({ kind: 'system', text: `🔁 Replay of an earlier message from ${msg.from} detected. Ignored.` });
    return;
  }
  rememberNonce(payload.nonce);

  const senderKeys = store.usrPks[msg.from];
  let signature: 'valid' | 'invalid' | 'unknown' = 'unknown';
  if (senderKeys) {
    signature = verifyMessage({
      message: payload.message,
      nonce: payload.nonce,
      sentAt: payload.sentAt,
      to: payload.to,
      signature: payload.signature,
      pubkey: senderKeys.signing,
    })
      ? 'valid'
      : 'invalid';
  }
  pushEvent({ kind: 'incoming', from: msg.from, text: payload.message, signature });
};

const requireReadyClient = (): Client => {
  if (store.status !== 'ready' || !store.client) {
    throw new Error('WhatsApp session is not ready');
  }
  return store.client;
};

/**
 * Signs, encrypts (ECIES: ephemeral X25519 → HKDF → AES-256-GCM), and sends a
 * message to a contact whose key bundle we hold. The signature is sealed
 * inside the ciphertext.
 */
export const sendEncrypted = async (args: { chatId: string; message: string }): Promise<void> => {
  const client = requireReadyClient();
  if (!store.keyPair) {
    throw new Error('Key pair not ready yet');
  }
  const recipient = store.usrPks[args.chatId];
  if (!recipient) {
    throw new Error(`No key bundle stored for ${args.chatId}. Request their key first.`);
  }
  const wire = encryptMessage({
    message: args.message,
    recipient,
    senderSigningPrivateKey: store.keyPair.signing.privateKey,
  });
  await client.sendMessage(args.chatId, wire);
  pushEvent({ kind: 'outgoing', to: args.chatId, text: args.message });
};

/**
 * Sends our key bundle to a contact so they can encrypt messages for us.
 */
export const sharePublicKey = async (chatId: string): Promise<void> => {
  const client = requireReadyClient();
  if (!store.keyPair) {
    throw new Error('Key pair not ready yet');
  }
  store.sharedWith.add(chatId);
  await client.sendMessage(chatId, exportKeyBundle(store.keyPair));
  pushEvent({ kind: 'system', text: `🔑 Key bundle shared with ${chatId}. Fingerprint: ${store.keyPair.fingerprint}` });
};

/**
 * Kicks off an automatic key exchange with a contact. We send our bundle; if
 * the contact runs hchat, their client stores it and replies with their own
 * bundle (see routeIncomingMessage), completing the handshake with no manual
 * steps on either side. No-op if we already hold their key.
 */
export const exchangeKeys = async (chatId: string): Promise<{ alreadyExchanged: boolean }> => {
  requireReadyClient();
  if (store.usrPks[chatId]) {
    return { alreadyExchanged: true };
  }
  await sharePublicKey(chatId);
  pushEvent({ kind: 'system', text: `🤝 Key exchange started with ${chatId} — waiting for their key bundle.` });
  return { alreadyExchanged: false };
};

/**
 * Asks a contact for their key bundle using the `!pubkey` wire message.
 */
export const requestPublicKey = async (chatId: string): Promise<void> => {
  const client = requireReadyClient();
  await client.sendMessage(chatId, PUBKEY_REQUEST);
  pushEvent({ kind: 'system', text: `📨 Public key requested from ${chatId}.` });
};

/**
 * Lists recent chats with a flag for whether we hold the contact's key bundle.
 */
export const listChats = async (limit = 50) => {
  const client = requireReadyClient();
  const chats = await client.getChats();
  return chats.slice(0, limit).map(chat => ({
    id: chat.id._serialized,
    name: chat.name || 'Unknown',
    hasKey: Boolean(store.usrPks[chat.id._serialized]),
  }));
};
