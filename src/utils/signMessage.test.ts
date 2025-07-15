import { signMessage } from './signMessage';
import { verifyMessage } from './verifyMessage';
import { generateKeyPair } from './generateKeyPair';
describe('signMessage', () => {
  it('should sign and verify a message', () => {
    const { publicKey, privateKey } = generateKeyPair();
    const message = 'test';
    const signature = signMessage({ message, privateKey });
    expect(typeof signature).toBe('string');
    const isValid = verifyMessage({ signature, pubkey: publicKey, message });
    expect(isValid).toBe(true);
  });
});
