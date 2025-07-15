import { decryptMessage } from './decryptMessage';
import { encryptMessage } from './encryptMessage';
import { generateKeyPair } from './generateKeyPair';
describe('decryptMessage', () => {
  it('should return the original message if not encrypted', () => {
    expect(decryptMessage({ encryptedMessage: 'plain', privateKey: 'key' })).toBe('plain');
  });
  it('should decrypt an encrypted message', () => {
    const { publicKey, privateKey } = generateKeyPair();
    const encrypted = encryptMessage({ message: 'secret', pubkey: publicKey });
    const decrypted = decryptMessage({
      encryptedMessage: encrypted,
      privateKey,
    });
    expect(decrypted).toBe('secret');
  });
});
