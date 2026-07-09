/**
 * Ed25519 signature over the message transcript. The transcript binds the
 * nonce, timestamp and recipient fingerprint to the message text, so a
 * signature can't be replayed or re-targeted at a different recipient.
 * The signature travels INSIDE the encrypted envelope — it is never visible
 * on the wire, so it can't be used to confirm guessed plaintexts.
 */
import { sign } from 'crypto';
import { TRANSCRIPT_PREFIX } from '../lib/constants';

export type Transcript = { message: string; nonce: string; sentAt: number; to: string };

/** Message text goes last so embedded newlines can't forge other fields. */
export const transcript = (args: Transcript): Buffer => {
  return Buffer.from([TRANSCRIPT_PREFIX, args.nonce, String(args.sentAt), args.to, args.message].join('\n'));
};

export const signMessage = (args: Transcript & { privateKey: string }): string => {
  return sign(null, transcript(args), args.privateKey).toString('base64');
};
