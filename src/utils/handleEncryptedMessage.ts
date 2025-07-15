/**
 * Handles incoming encrypted messages:
 * - Parses the JSON payload
 * - Decrypts the message with our private key
 * - Verifies the signature with the sender's public key (if available)
 * - Shows a warning if verification fails
 * @param args The message, our key pair, and the map of user public keys
 */
import type { Message } from 'whatsapp-web.js';
import type { KeyPair, UsrPks } from '../lib/types';
import { decryptMessage } from './decryptMessage';
import { verifyMessage } from './verifyMessage';
export const handleEncryptedMessage = (args: { msg: Message; keyPair: KeyPair | null; usrPks: UsrPks }) => {
  if (!args.keyPair) {
    console.log('❌ Cannot decrypt: Key pair not ready');
    return;
  }
  let payload;
  try {
    payload = JSON.parse(args.msg.body);
  } catch {
    console.log('❌ Invalid message format');
    return;
  }
  const { encrypted, signature } = payload;
  // Decrypt the message with our private key
  const decryptedMessage = decryptMessage({
    encryptedMessage: encrypted,
    privateKey: args.keyPair.privateKey,
  });
  // Try to verify the signature with the sender's public key
  const senderPublicKey = args.usrPks[args.msg.from];
  let isValid = false;
  if (senderPublicKey) {
    isValid = verifyMessage({
      message: decryptedMessage,
      signature,
      pubkey: senderPublicKey,
    });
  }
  console.log(`\n📨 Encrypted message from ${args.msg.from}:`);
  console.log(`   Decrypted: "${decryptedMessage}"`);
  if (isValid) {
    console.log('   ✅ Signature verified');
  } else {
    console.log('   ⚠️ Signature could not be verified!');
  }
  console.log('\n💬 Enter command:');
};
