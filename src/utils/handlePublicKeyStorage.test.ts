import { handlePublicKeyStorage } from './handlePublicKeyStorage';

describe('handlePublicKeyStorage', () => {
  it('should log and reply', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const replyMock = jest.fn();
    const args = {
      msg: { from: 'user1', body: 'pubkey', reply: replyMock },
      usrPks: {},
    };
    await handlePublicKeyStorage(args as any);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Public key received and stored'));
    expect(replyMock).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
