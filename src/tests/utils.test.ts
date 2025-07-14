import { KeyPair } from '../types';
import { generateKeyPair, signMessage, verifyMessage } from '../utils';
import { randomBytes } from 'crypto';

describe('Test sign and verify message', () => {
  const keyPair: KeyPair = generateKeyPair();
  const message: string = randomBytes(20).toString('hex');
  let signature: string = '';

  it('should sign a message', () => {
    signature = signMessage({
      privateKey: keyPair.privateKey,
      message,
    });
    expect(signMessage).toBeDefined();
  });

  it('should verify the signed message', () => {
    expect(signature).toBeDefined();
    const isVerified = verifyMessage({
      pubkey: keyPair.publicKey,
      signature,
      message,
    });
    expect(isVerified).toBe(true);
  });

  it('should not verify with a wrong public key', () => {
    const wrongKeyPair: KeyPair = generateKeyPair();
    const isVerified = verifyMessage({
      pubkey: wrongKeyPair.publicKey,
      signature,
      message,
    });
    expect(isVerified).toBe(false);
  });
});
