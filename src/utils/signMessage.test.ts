import { signMessage } from './signMessage';
import { verifyMessage } from './verifyMessage';
import { generateKeyPair } from './generateKeyPair';

describe('signMessage', () => {
  it('should sign and verify a transcript', () => {
    const identity = generateKeyPair();
    const fields = { message: 'test', nonce: 'n1', sentAt: 1720000000000, to: 'AAAA BBBB' };
    const signature = signMessage({ ...fields, privateKey: identity.signing.privateKey });
    expect(typeof signature).toBe('string');
    expect(verifyMessage({ ...fields, signature, pubkey: identity.signing.publicKey })).toBe(true);
  });

  it('should not verify when any transcript field changes', () => {
    const identity = generateKeyPair();
    const fields = { message: 'test', nonce: 'n1', sentAt: 1720000000000, to: 'AAAA BBBB' };
    const signature = signMessage({ ...fields, privateKey: identity.signing.privateKey });
    const pubkey = identity.signing.publicKey;
    expect(verifyMessage({ ...fields, message: 'test2', signature, pubkey })).toBe(false);
    expect(verifyMessage({ ...fields, nonce: 'n2', signature, pubkey })).toBe(false);
    expect(verifyMessage({ ...fields, sentAt: 1720000000001, signature, pubkey })).toBe(false);
    expect(verifyMessage({ ...fields, to: 'CCCC DDDD', signature, pubkey })).toBe(false);
  });
});
