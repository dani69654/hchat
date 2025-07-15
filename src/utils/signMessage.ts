/**
 * Signs a plaintext message with the sender's private key and returns the signature in hex format.
 */
import { createSign } from 'crypto';
export const signMessage = (args: { message: string; privateKey: string }) => {
  const sign = createSign('SHA256');
  sign.write(args.message);
  sign.end();
  return sign.sign(args.privateKey, 'hex');
};
