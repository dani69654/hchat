import crypto from 'crypto';

export const promptCommandList = () => {
  console.log('\n📋 Terminal Commands:');
  console.log('  !pubkey - Show your public key');
  console.log('  !send <chatId> <message> - Send encrypted message');
  console.log('  !keys - Show stored public keys');
  console.log('  !ping - Test command');
  console.log('  !chats - Show recent chats');
  console.log('  exit - Quit application');
  console.log('\n💬 Enter command:');
};

export const encryptMessage = (args: { message: string; pubkey: string }) => {
  const encrypted = crypto.publicEncrypt(args.pubkey, Buffer.from(args.message));
  return `🔒ENC:${encrypted.toString('base64')}`;
};

export const decryptMessage = (args: { encryptedMessage: string; privateKey: string }) => {
  if (!args.encryptedMessage.startsWith('🔒ENC:')) {
    return args.encryptedMessage;
  }
  const encryptedData = args.encryptedMessage.replace('🔒ENC:', '');
  const decrypted = crypto.privateDecrypt(args.privateKey, Buffer.from(encryptedData, 'base64'));
  return decrypted.toString();
};

export const isPublicKey = (message: string) => {
  return (
    message.includes('-----BEGIN PUBLIC KEY-----') && message.includes('-----END PUBLIC KEY-----')
  );
};
