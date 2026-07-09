import { encryptMessage } from './encryptMessage';
import { decryptMessage } from './decryptMessage';
import { generateKeyPair } from './generateKeyPair';
import { verifyMessage } from './verifyMessage';
import { exportKeyBundle, parseKeyBundle } from './keyBundle';
import type { EncryptedEnvelope } from '../lib/types';

const setup = () => {
  const sender = generateKeyPair();
  const recipient = generateKeyPair();
  const recipientBundle = parseKeyBundle(exportKeyBundle(recipient))!;
  return { sender, recipient, recipientBundle };
};

describe('encryptMessage', () => {
  it('should produce an envelope that decrypts and verifies', () => {
    const { sender, recipient, recipientBundle } = setup();
    const wire = encryptMessage({
      message: 'hello 🔒',
      recipient: recipientBundle,
      senderSigningPrivateKey: sender.signing.privateKey,
    });
    const envelope: EncryptedEnvelope = JSON.parse(wire);
    expect(envelope.hchat).toBe(2);
    expect(envelope.type).toBe('msg');

    const payload = decryptMessage({ envelope, encryptionPrivateKey: recipient.encryption.privateKey });
    expect(payload.message).toBe('hello 🔒');
    expect(payload.to).toBe(recipient.fingerprint);
    expect(
      verifyMessage({
        message: payload.message,
        nonce: payload.nonce,
        sentAt: payload.sentAt,
        to: payload.to,
        signature: payload.signature,
        pubkey: sender.signing.publicKey,
      }),
    ).toBe(true);
  });

  it('should handle messages far beyond the old RSA size limit', () => {
    const { sender, recipient, recipientBundle } = setup();
    const message = 'long 🔑 '.repeat(20000);
    const wire = encryptMessage({
      message,
      recipient: recipientBundle,
      senderSigningPrivateKey: sender.signing.privateKey,
    });
    const payload = decryptMessage({
      envelope: JSON.parse(wire),
      encryptionPrivateKey: recipient.encryption.privateKey,
    });
    expect(payload.message).toBe(message);
  });

  it('should use a fresh ephemeral key per message', () => {
    const { sender, recipientBundle } = setup();
    const args = { message: 'same', recipient: recipientBundle, senderSigningPrivateKey: sender.signing.privateKey };
    const a: EncryptedEnvelope = JSON.parse(encryptMessage(args));
    const b: EncryptedEnvelope = JSON.parse(encryptMessage(args));
    expect(a.epk).not.toBe(b.epk);
    expect(a.ct).not.toBe(b.ct);
  });
});
