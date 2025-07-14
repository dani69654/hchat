import type { Client, Message } from 'whatsapp-web.js';
import { encryptMessage, decryptMessage, isPublicKey } from './utils';
import type { KeyPair, UsrPks } from './types';

/**
 * @description Command prefix
 */
const CP = '!';

/**
 * @event ping
 */
const cmdPing = () => {
  console.log('🏓 Pong!');
};

/**
 * @event pubkey
 */
const cmdPubkey = (keyPair: KeyPair | null) => {
  if (keyPair) {
    console.log('\n🔑 Your Public Key:');
    console.log(keyPair.publicKey);
  } else {
    console.log('❌ Key pair not ready yet');
  }
};

/**
 * @event keys
 */
const cmdKeys = (usrPks: UsrPks) => {
  console.log('\n📋 Stored Public Keys:');
  if (Object.keys(usrPks).length > 0) {
    for (const [user, key] of Object.entries(usrPks)) {
      console.log(`📱 ${user}:`);
      console.log(`   ${key.substring(0, 80)}...`);
    }
  } else {
    console.log('   No keys stored yet');
  }
};

/**
 * @event chats
 */
const cmdChats = async (client: Client) => {
  console.log('\n📱 Getting recent chats...');
  const chats = await client.getChats();
  console.log('Recent chats:');
  for (let i = 0; i < Math.min(10, chats.length); i++) {
    const chat = chats[i];
    const name = chat.name || 'Unknown';
    console.log(`   ${name} - ${chat.id._serialized}`);
  }
};

/**
 * @event send
 */
const cmdSend = async (args: { parts: string[]; usrPks: UsrPks; client: Client }) => {
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

  console.log(`🔐 Encrypting message: "${messageToSend}"`);
  const encrypted = encryptMessage({
    message: messageToSend,
    pubkey: args.usrPks[targetChatId],
  });
  await args.client.sendMessage(targetChatId, encrypted);
  console.log(`✅ Encrypted message sent to ${targetChatId}`);
};

/**
 * @event exit
 */
const cmdExit = () => {
  console.log('👋 Goodbye!');
  process.exit(0);
};

/**
 * @event unknown command
 */
const cmdUnknown = () => {
  console.log('❓ Unknown command. Available commands:');
  console.log('   !ping, !pubkey, !keys, !chats, !send <chatId> <message>, exit');
};

/**
 * @event empty command
 */
const cmdEmpty = () => {
  // Ignore empty lines
};

/**
 * @event handle encrypted message
 */
const handleEncryptedMessage = (args: { msg: Message; keyPair: KeyPair | null }) => {
  if (!args.keyPair) {
    console.log('❌ Cannot decrypt: Key pair not ready');
    return;
  }

  const decryptedMessage = decryptMessage({
    encryptedMessage: args.msg.body,
    privateKey: args.keyPair.privateKey,
  });
  console.log(`\n📨 Encrypted message from ${args.msg.from}:`);
  console.log(`   Decrypted: "${decryptedMessage}"`);
  console.log('\n💬 Enter command:');
};

/**
 * @event handle public key storage
 */
const handlePublicKeyStorage = async (args: { msg: Message; usrPks: UsrPks }) => {
  args.usrPks[args.msg.from] = args.msg.body;
  console.log(`\n📝 Public key received and stored for ${args.msg.from}`);
  await args.msg.reply('✅ Public key received and stored!');
  console.log('\n💬 Enter command:');
};

/**
 * @event handle pubkey request from WhatsApp
 */
const handlePubkeyRequest = async (args: { msg: Message; keyPair: KeyPair | null }) => {
  if (args.keyPair) {
    await args.msg.reply(`Here's my public key:\n\n${args.keyPair.publicKey}`);
    console.log(`\n🔑 Public key sent to ${args.msg.from}`);
    console.log('\n💬 Enter command:');
  } else {
    await args.msg.reply('❌ Key pair not ready yet');
  }
};

/**
 * Terminal command router
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
    });
  }

  // Handle simple commands
  switch (cmd) {
    case `${CP}ping`:
      return cmdPing();
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
 * WhatsApp message router
 */
export const routeMessage = async (args: {
  msg: Message;
  keyPair: KeyPair | null;
  usrPks: UsrPks;
}): Promise<void> => {
  const originalBody = args.msg.body;

  // Handle encrypted messages
  if (originalBody.startsWith('🔒ENC:')) {
    return handleEncryptedMessage({
      msg: args.msg,
      keyPair: args.keyPair,
    });
  }

  // Handle public key storage
  if (isPublicKey(originalBody)) {
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
