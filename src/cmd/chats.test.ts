import { cmdChats } from './chats';

describe('cmdChats', () => {
  it('should log recent chats', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const mockClient = {
      getChats: jest.fn().mockResolvedValue([
        { name: 'Alice', id: { _serialized: 'id1' } },
        { name: 'Bob', id: { _serialized: 'id2' } },
      ]),
    };
    // @ts-ignore
    await cmdChats(mockClient);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Recent chats'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Alice'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Bob'));
    logSpy.mockRestore();
  });
});
