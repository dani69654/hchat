/**
 * Decrypts an encrypted message using the provided private key.
 * If the message is not encrypted, returns it as is.
 */
import { privateDecrypt } from 'crypto';
export const decryptMessage = (args: { encryptedMessage: string; privateKey: string }) => {
  if (!args.encryptedMessage.startsWith('🔒ENC:')) {
    return args.encryptedMessage;
  }
  const encryptedData = args.encryptedMessage.replace('🔒ENC:', '');
  const decrypted = privateDecrypt(args.privateKey, Buffer.from(encryptedData, 'base64'));
  return decrypted.toString();
};
