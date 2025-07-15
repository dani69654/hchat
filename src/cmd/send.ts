/**
 * Handles the !send command: signs, encrypts, and sends a message to a contact.
 * - Signs the plaintext message with the sender's private key.
 * - Encrypts the plaintext with the recipient's public key.
 * - Sends both as a JSON payload.
 * @param args Command arguments, user keys, client, and sender key pair
 */
import type { Client } from 'whatsapp-web.js';
import type { KeyPair, UsrPks } from '../lib/types';
import { signMessage } from '../utils/signMessage';
import { encryptMessage } from '../utils/encryptMessage';
export const cmdSend = async (args: { parts: string[]; usrPks: UsrPks; client: Client; keyPair: KeyPair | null }) => {
  if (args.parts.length < 3) {
    console.log('❌ Usage: !send <chatId> <message>');
    return;
  }
  const targetChatId = args.parts[1];
  const messageToSend = args.parts.slice(2).join(' ');
  if (!args.usrPks[targetChatId]) {
    console.log(`❌ No public key for ${targetChatId}`);
    console.log(`Available keys: ${Object.keys(args.usrPks).join(', ') || 'none'}`);
    return;
  }
  if (!args.keyPair) {
    console.log('❌ Key pair not ready yet');
    return;
  }
  // Sign the plaintext message with our private key
  const signature = signMessage({
    message: messageToSend,
    privateKey: args.keyPair.privateKey,
  });
  // Encrypt the plaintext message with the recipient's public key
  const encrypted = encryptMessage({
    message: messageToSend,
    pubkey: args.usrPks[targetChatId],
  });
  // Send both as a JSON string
  const payload = JSON.stringify({ encrypted, signature });
  await args.client.sendMessage(targetChatId, payload);
  console.log(`✅ Encrypted & signed message sent to ${targetChatId}`);
};
