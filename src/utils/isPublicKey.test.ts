import { isPublicKey } from './isPublicKey';
describe('isPublicKey', () => {
  it('should return true for a PEM public key', () => {
    const pem = '-----BEGIN PUBLIC KEY-----\nabc\n-----END PUBLIC KEY-----';
    expect(isPublicKey(pem)).toBe(true);
  });
  it('should return false for a non-key string', () => {
    expect(isPublicKey('hello')).toBe(false);
  });
});
