import type { Client, Message } from 'whatsapp-web.js';
import type { KeyPair, UsrPks } from './lib/types';
import { cmdPubkey } from './cmd/pubkey';
import { cmdKeys } from './cmd/keys';
import { cmdChats } from './cmd/chats';
import { cmdSend } from './cmd/send';
import { cmdExit } from './cmd/exit';
import { cmdUnknown } from './cmd/unknown';
import { cmdEmpty } from './cmd/empty';
import { handleEncryptedMessage } from './utils/handleEncryptedMessage';
import { handlePubkeyRequest } from './utils/handlePubkeyRequest';
import { handlePublicKeyStorage } from './utils/handlePublicKeyStorage';
import { CP } from './lib/constants';

/**
 * Routes terminal commands to their handlers.
 * @param args The command, key pair, user public keys, and WhatsApp client
 */
export const routeCmd = async (args: {
  cmd: string;
  keyPair: KeyPair | null;
  usrPks: UsrPks;
  client: Client;
}): Promise<void> => {
  const { cmd } = args;

  // Handle empty command
  if (cmd === '') {
    return cmdEmpty();
  }

  // Handle exit command (no prefix)
  if (cmd === 'exit') {
    return cmdExit();
  }

  // Handle send command with arguments
  if (cmd.startsWith(`${CP}send `)) {
    const parts = cmd.split(' ');
    return cmdSend({
      parts,
      usrPks: args.usrPks,
      client: args.client,
      keyPair: args.keyPair,
    });
  }

  // Handle simple commands
  switch (cmd) {
    case `${CP}pubkey`:
      return cmdPubkey(args.keyPair);
    case `${CP}keys`:
      return cmdKeys(args.usrPks);
    case `${CP}chats`:
      return cmdChats(args.client);
    default:
      return cmdUnknown();
  }
};

/**
 * Routes incoming WhatsApp messages to their handlers.
 * - Handles encrypted messages (JSON payloads)
 * - Handles public key storage
 * - Handles public key requests
 * @param args The message, our key pair, and user public keys
 */
export const routeMessage = async (args: { msg: Message; keyPair: KeyPair | null; usrPks: UsrPks }): Promise<void> => {
  const originalBody = args.msg.body;

  // Handle encrypted messages (now JSON payload)
  let isEncryptedPayload = false;
  try {
    const parsed = JSON.parse(originalBody);
    if (parsed && typeof parsed === 'object' && 'encrypted' in parsed && 'signature' in parsed) {
      isEncryptedPayload = true;
    }
  } catch {}
  if (isEncryptedPayload) {
    return handleEncryptedMessage({
      msg: args.msg,
      keyPair: args.keyPair,
      usrPks: args.usrPks,
    });
  }

  // Handle public key storage
  if (
    originalBody &&
    typeof originalBody === 'string' &&
    originalBody.includes('-----BEGIN PUBLIC KEY-----') &&
    originalBody.includes('-----END PUBLIC KEY-----')
  ) {
    return handlePublicKeyStorage({
      msg: args.msg,
      usrPks: args.usrPks,
    });
  }

  // Handle pubkey request
  if (originalBody === '!pubkey') {
    return handlePubkeyRequest({
      msg: args.msg,
      keyPair: args.keyPair,
    });
  }
};
