import { cmdEmpty } from './empty';

describe('cmdEmpty', () => {
  it('should do nothing', () => {
    expect(() => cmdEmpty()).not.toThrow();
  });
});
