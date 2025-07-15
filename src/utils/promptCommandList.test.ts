import { promptCommandList } from './promptCommandList';
describe('promptCommandList', () => {
  it('should log the command list', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    promptCommandList();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Terminal Commands'));
    logSpy.mockRestore();
  });
});
