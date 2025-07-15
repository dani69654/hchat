import { verifyMessage } from './verifyMessage';
import { generateKeyPair } from './generateKeyPair';
describe('verifyMessage', () => {
  it('should return false for an invalid signature', () => {
    const { publicKey } = generateKeyPair();
    const isValid = verifyMessage({
      signature: 'deadbeef',
      pubkey: publicKey,
      message: 'msg',
    });
    expect(isValid).toBe(false);
  });
});
