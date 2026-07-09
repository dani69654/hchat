import { encryptMessage } from './encryptMessage';
import { decryptMessage } from './decryptMessage';
import { generateKeyPair } from './generateKeyPair';
import { exportKeyBundle, parseKeyBundle } from './keyBundle';
import type { EncryptedEnvelope, IdentityKeys } from '../lib/types';

const encryptTo = (recipient: IdentityKeys, message = 'secret'): EncryptedEnvelope => {
  const sender = generateKeyPair();
  const recipientBundle = parseKeyBundle(exportKeyBundle(recipient))!;
  return JSON.parse(
    encryptMessage({ message, recipient: recipientBundle, senderSigningPrivateKey: sender.signing.privateKey }),
  );
};

describe('decryptMessage', () => {
  it('should decrypt a message encrypted for us', () => {
    const recipient = generateKeyPair();
    const envelope = encryptTo(recipient);
    const payload = decryptMessage({ envelope, encryptionPrivateKey: recipient.encryption.privateKey });
    expect(payload.message).toBe('secret');
  });

  it('should throw when decrypting with the wrong key', () => {
    const recipient = generateKeyPair();
    const other = generateKeyPair();
    const envelope = encryptTo(recipient);
    expect(() => decryptMessage({ envelope, encryptionPrivateKey: other.encryption.privateKey })).toThrow();
  });

  it('should throw when the ciphertext is tampered with', () => {
    const recipient = generateKeyPair();
    const envelope = encryptTo(recipient);
    const ct = Buffer.from(envelope.ct, 'base64');
    ct[0] ^= 0xff;
    const tampered = { ...envelope, ct: ct.toString('base64') };
    expect(() =>
      decryptMessage({ envelope: tampered, encryptionPrivateKey: recipient.encryption.privateKey }),
    ).toThrow();
  });

  it('should throw when the ephemeral key is swapped (AAD binding)', () => {
    const recipient = generateKeyPair();
    const envelope = encryptTo(recipient);
    const otherEnvelope = encryptTo(recipient);
    const swapped = { ...envelope, epk: otherEnvelope.epk };
    expect(() =>
      decryptMessage({ envelope: swapped, encryptionPrivateKey: recipient.encryption.privateKey }),
    ).toThrow();
  });
});
