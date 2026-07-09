/**
 * Verifies an Ed25519 transcript signature against the sender's stored
 * signing key. Returns false (never throws) on malformed input.
 */
import { verify } from 'crypto';
import { transcript, type Transcript } from './signMessage';

export const verifyMessage = (args: Transcript & { signature: string; pubkey: string }): boolean => {
  try {
    return verify(null, transcript(args), args.pubkey, Buffer.from(args.signature, 'base64'));
  } catch {
    return false;
  }
};
