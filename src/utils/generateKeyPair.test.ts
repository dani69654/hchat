import { generateKeyPair } from './generateKeyPair';
describe('generateKeyPair', () => {
  it('should generate a key pair', () => {
    const kp = generateKeyPair();
    expect(typeof kp.publicKey).toBe('string');
    expect(typeof kp.privateKey).toBe('string');
    expect(kp.publicKey).toMatch(/BEGIN PUBLIC KEY/);
    expect(kp.privateKey).toMatch(/BEGIN PRIVATE KEY/);
  });
});
