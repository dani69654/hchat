import { cmdKeys } from './keys';

describe('cmdKeys', () => {
  it('should log stored public keys', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    cmdKeys({ user1: 'PUBKEY1', user2: 'PUBKEY2' });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Stored Public Keys'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('user1'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('user2'));
    logSpy.mockRestore();
  });
});
