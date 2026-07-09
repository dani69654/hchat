import { Client } from 'whatsapp-web.js';
import type { Message } from 'whatsapp-web.js';
import { store, pushEvent } from './store';
import { PUBKEY_REQUEST } from '../lib/constants';
import { generateKeyPair } from '../utils/generateKeyPair';
import { signMessage } from '../utils/signMessage';
import { verifyMessage } from '../utils/verifyMessage';
import { encryptMessage } from '../utils/encryptMessage';
import { decryptMessage } from '../utils/decryptMessage';
import { isPublicKey } from '../utils/isPublicKey';
import { checkTorConnection, getTorPuppeteerArgs } from '../utils/tor';

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
      store.error = 'Tor check failed: traffic is NOT routed through Tor. Make sure Tor is running on port 9050.';
      return;
    }
    pushEvent({ kind: 'system', text: '🟢 Tor check passed: traffic is routed through Tor.' });
  }

  store.status = 'starting';
  const client = new Client({
    puppeteer: opts.tor ? { args: getTorPuppeteerArgs() } : {},
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
    pushEvent({ kind: 'system', text: '✅ Connected to WhatsApp. Fresh RSA key pair generated for this session.' });
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
 * Routes an incoming WhatsApp message, mirroring the CLI wire protocol:
 * - JSON payloads with `encrypted` + `signature` are decrypted and verified
 * - PEM public keys are stored for the sender
 * - `!pubkey` requests are answered with our public key
 */
const routeIncomingMessage = async (msg: Message): Promise<void> => {
  const body = msg.body;

  let payload: { encrypted: string; signature: string } | null = null;
  try {
    const parsed = JSON.parse(body);
    if (parsed && typeof parsed === 'object' && 'encrypted' in parsed && 'signature' in parsed) {
      payload = parsed;
    }
  } catch {}

  if (payload) {
    if (!store.keyPair) {
      pushEvent({ kind: 'system', text: `❌ Cannot decrypt message from ${msg.from}: key pair not ready.` });
      return;
    }
    let decrypted: string;
    try {
      decrypted = decryptMessage({ encryptedMessage: payload.encrypted, privateKey: store.keyPair.privateKey });
    } catch {
      pushEvent({
        kind: 'system',
        text: `⚠️ Received an encrypted message from ${msg.from} that could not be decrypted (wrong key?).`,
      });
      return;
    }
    const senderPublicKey = store.usrPks[msg.from];
    let signature: 'valid' | 'invalid' | 'unknown' = 'unknown';
    if (senderPublicKey) {
      signature = verifyMessage({ message: decrypted, signature: payload.signature, pubkey: senderPublicKey })
        ? 'valid'
        : 'invalid';
    }
    pushEvent({ kind: 'incoming', from: msg.from, text: decrypted, signature });
    return;
  }

  if (isPublicKey(body)) {
    store.usrPks[msg.from] = body;
    await msg.reply('✅ Public key received and stored!');
    pushEvent({ kind: 'system', text: `📝 Public key received and stored for ${msg.from}.` });
    return;
  }

  if (body === PUBKEY_REQUEST) {
    if (store.keyPair) {
      await msg.reply(`Here's my public key:\n\n${store.keyPair.publicKey}`);
      pushEvent({ kind: 'system', text: `🔑 Public key sent to ${msg.from} (requested).` });
    } else {
      await msg.reply('❌ Key pair not ready yet');
    }
  }
};

const requireReadyClient = (): Client => {
  if (store.status !== 'ready' || !store.client) {
    throw new Error('WhatsApp session is not ready');
  }
  return store.client;
};

/**
 * Signs, encrypts, and sends a message to a contact whose public key we hold.
 */
export const sendEncrypted = async (args: { chatId: string; message: string }): Promise<void> => {
  const client = requireReadyClient();
  if (!store.keyPair) {
    throw new Error('Key pair not ready yet');
  }
  const pubkey = store.usrPks[args.chatId];
  if (!pubkey) {
    throw new Error(`No public key stored for ${args.chatId}. Request their key first.`);
  }
  const signature = signMessage({ message: args.message, privateKey: store.keyPair.privateKey });
  const encrypted = encryptMessage({ message: args.message, pubkey });
  await client.sendMessage(args.chatId, JSON.stringify({ encrypted, signature }));
  pushEvent({ kind: 'outgoing', to: args.chatId, text: args.message });
};

/**
 * Sends our public key to a contact so they can encrypt messages for us.
 */
export const sharePublicKey = async (chatId: string): Promise<void> => {
  const client = requireReadyClient();
  if (!store.keyPair) {
    throw new Error('Key pair not ready yet');
  }
  await client.sendMessage(chatId, store.keyPair.publicKey);
  pushEvent({ kind: 'system', text: `🔑 Public key shared with ${chatId}.` });
};

/**
 * Asks a contact for their public key using the `!pubkey` wire message.
 */
export const requestPublicKey = async (chatId: string): Promise<void> => {
  const client = requireReadyClient();
  await client.sendMessage(chatId, PUBKEY_REQUEST);
  pushEvent({ kind: 'system', text: `📨 Public key requested from ${chatId}.` });
};

/**
 * Lists recent chats with a flag for whether we hold the contact's public key.
 */
export const listChats = async (limit = 20) => {
  const client = requireReadyClient();
  const chats = await client.getChats();
  return chats.slice(0, limit).map(chat => ({
    id: chat.id._serialized,
    name: chat.name || 'Unknown',
    hasKey: Boolean(store.usrPks[chat.id._serialized]),
  }));
};
