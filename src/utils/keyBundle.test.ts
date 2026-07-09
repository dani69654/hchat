import { generateKeyPairSync } from 'crypto';
import { generateKeyPair } from './generateKeyPair';
import { exportKeyBundle, parseKeyBundle } from './keyBundle';

describe('keyBundle', () => {
  it('should round-trip an identity through export and parse', () => {
    const identity = generateKeyPair();
    const bundle = parseKeyBundle(exportKeyBundle(identity));
    expect(bundle).not.toBeNull();
    expect(bundle!.encryption).toBe(identity.encryption.publicKey);
    expect(bundle!.signing).toBe(identity.signing.publicKey);
    expect(bundle!.fingerprint).toBe(identity.fingerprint);
  });

  it('should reject non-JSON and plain text', () => {
    expect(parseKeyBundle('hello')).toBeNull();
    expect(parseKeyBundle('-----BEGIN PUBLIC KEY-----\nabc\n-----END PUBLIC KEY-----')).toBeNull();
  });

  it('should reject bundles with wrong key types', () => {
    const rsa = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    const identity = generateKeyPair();
    const swapped = JSON.stringify({
      hchat: 2,
      type: 'keys',
      encryption: rsa.publicKey,
      signing: identity.signing.publicKey,
    });
    expect(parseKeyBundle(swapped)).toBeNull();
  });

  it('should reject bundles with a wrong version or type', () => {
    const identity = generateKeyPair();
    const bundle = JSON.parse(exportKeyBundle(identity));
    expect(parseKeyBundle(JSON.stringify({ ...bundle, hchat: 1 }))).toBeNull();
    expect(parseKeyBundle(JSON.stringify({ ...bundle, type: 'msg' }))).toBeNull();
  });
});
