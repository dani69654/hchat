import { cmdExit } from './exit';

describe('cmdExit', () => {
  it('should log and call process.exit', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    expect(() => cmdExit()).toThrow('exit');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Goodbye'));
    exitSpy.mockRestore();
    logSpy.mockRestore();
  });
});
