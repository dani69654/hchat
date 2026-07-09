import { generateKeyPair } from './generateKeyPair';

describe('generateKeyPair', () => {
  it('should generate an X25519 + Ed25519 identity with a fingerprint', () => {
    const identity = generateKeyPair();
    expect(identity.encryption.publicKey).toMatch(/BEGIN PUBLIC KEY/);
    expect(identity.encryption.privateKey).toMatch(/BEGIN PRIVATE KEY/);
    expect(identity.signing.publicKey).toMatch(/BEGIN PUBLIC KEY/);
    expect(identity.signing.privateKey).toMatch(/BEGIN PRIVATE KEY/);
    expect(identity.fingerprint).toMatch(/^([0-9A-F]{4} ){7}[0-9A-F]{4}$/);
  });

  it('should generate a distinct identity every time', () => {
    expect(generateKeyPair().fingerprint).not.toBe(generateKeyPair().fingerprint);
  });
});
