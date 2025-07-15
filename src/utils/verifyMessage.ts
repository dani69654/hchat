/**
 * Verifies a message signature using the sender's public key and the original message.
 */
import { createVerify } from 'crypto';
export const verifyMessage = (args: { signature: string; pubkey: string; message: string }) => {
  const verify = createVerify('SHA256');
  verify.update(args.message);
  verify.end();
  return verify.verify(args.pubkey, Buffer.from(args.signature, 'hex'));
};
