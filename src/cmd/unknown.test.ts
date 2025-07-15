import { cmdUnknown } from './unknown';

describe('cmdUnknown', () => {
  it('should log available commands', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    cmdUnknown();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown command'));
    logSpy.mockRestore();
  });
});
