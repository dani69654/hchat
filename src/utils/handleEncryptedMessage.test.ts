import { encryptMessage } from './encryptMessage';
import { generateKeyPair } from './generateKeyPair';
import { handleEncryptedMessage } from './handleEncryptedMessage';
import { signMessage } from './signMessage';

describe('handleEncryptedMessage', () => {
  it('should log decrypted message and signature status', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    // Generate a real key pair
    const keyPair = generateKeyPair();
    const message = 'hello world';
    // Sign the message
    const signature = signMessage({ message, privateKey: keyPair.privateKey });
    // Encrypt the message
    const encrypted = encryptMessage({ message, pubkey: keyPair.publicKey });
    const args = {
      msg: { body: JSON.stringify({ encrypted, signature }), from: 'user1' },
      keyPair,
      usrPks: { user1: keyPair.publicKey },
    };
    handleEncryptedMessage(args as any);
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
