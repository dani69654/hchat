/**
 * Encrypts a message with the recipient's public key and returns a base64-encoded string with a prefix.
 */
import { publicEncrypt } from 'crypto';
export const encryptMessage = (args: { message: string; pubkey: string }) => {
  const encrypted = publicEncrypt(args.pubkey, Buffer.from(args.message));
  return `🔒ENC:${encrypted.toString('base64')}`;
};
