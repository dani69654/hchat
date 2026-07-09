import { verifyMessage } from './verifyMessage';
import { generateKeyPair } from './generateKeyPair';

describe('verifyMessage', () => {
  it('should return false for an invalid signature', () => {
    const identity = generateKeyPair();
    const isValid = verifyMessage({
      message: 'msg',
      nonce: 'n1',
      sentAt: 1720000000000,
      to: 'AAAA BBBB',
      signature: Buffer.from('deadbeef', 'hex').toString('base64'),
      pubkey: identity.signing.publicKey,
    });
    expect(isValid).toBe(false);
  });

  it('should return false (not throw) on garbage input', () => {
    expect(
      verifyMessage({
        message: 'msg',
        nonce: 'n1',
        sentAt: 0,
        to: 'x',
        signature: '!!!not-base64!!!',
        pubkey: 'not a key',
      }),
    ).toBe(false);
  });
});
