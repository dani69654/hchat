import crypto, {
  createSign,
  publicEncrypt,
  privateDecrypt,
  generateKeyPairSync,
  createVerify,
} from 'crypto';

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
  const encrypted = publicEncrypt(args.pubkey, Buffer.from(args.message));
  return `🔒ENC:${encrypted.toString('base64')}`;
};

export const decryptMessage = (args: { encryptedMessage: string; privateKey: string }) => {
  if (!args.encryptedMessage.startsWith('🔒ENC:')) {
    return args.encryptedMessage;
  }
  const encryptedData = args.encryptedMessage.replace('🔒ENC:', '');
  const decrypted = privateDecrypt(args.privateKey, Buffer.from(encryptedData, 'base64'));
  return decrypted.toString();
};

export const signMessage = (args: { message: string; privateKey: string }) => {
  const sign = createSign('SHA256');
  sign.write(args.message);
  sign.end();
  return sign.sign(args.privateKey, 'hex');
};

export const verifyMessage = (args: { signature: string; pubkey: string; message: string }) => {
  const verify = createVerify('SHA256');
  verify.update(args.message);
  verify.end();
  return verify.verify(args.pubkey, Buffer.from(args.signature, 'hex'));
};

export const isPublicKey = (message: string) => {
  return (
    message.includes('-----BEGIN PUBLIC KEY-----') && message.includes('-----END PUBLIC KEY-----')
  );
};

export const generateKeyPair = () => {
  return generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });
};
