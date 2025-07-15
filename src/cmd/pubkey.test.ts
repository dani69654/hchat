import { KeyPair } from '../lib/types';
import { generateKeyPair } from '../utils/generateKeyPair';
import { cmdPubkey } from './pubkey';

describe('Test !pubkey', () => {
  const keyPair: KeyPair = generateKeyPair();

  it('should console log the pubkey', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    cmdPubkey(keyPair);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(keyPair.publicKey));
    logSpy.mockRestore();
  });
});
