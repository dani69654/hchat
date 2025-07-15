import { encryptMessage } from './encryptMessage';
import { generateKeyPair } from './generateKeyPair';
import { decryptMessage } from './decryptMessage';
describe('encryptMessage', () => {
  it('should encrypt and decrypt a message', () => {
    const { publicKey, privateKey } = generateKeyPair();
    const encrypted = encryptMessage({ message: 'hello', pubkey: publicKey });
    expect(encrypted.startsWith('🔒ENC:')).toBe(true);
    const decrypted = decryptMessage({
      encryptedMessage: encrypted,
      privateKey,
    });
    expect(decrypted).toBe('hello');
  });
});
