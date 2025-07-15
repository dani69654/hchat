/**
 * Handles a public key request from WhatsApp, replying with our public key.
 * @param args The message and our key pair
 */
import type { Message } from 'whatsapp-web.js';
import type { KeyPair } from '../lib/types';
export const handlePubkeyRequest = async (args: { msg: Message; keyPair: KeyPair | null }) => {
  if (args.keyPair) {
    await args.msg.reply(`Here's my public key:\n\n${args.keyPair.publicKey}`);
    console.log(`\n🔑 Public key sent to ${args.msg.from}`);
    console.log('\n💬 Enter command:');
  } else {
    await args.msg.reply('❌ Key pair not ready yet');
  }
};
