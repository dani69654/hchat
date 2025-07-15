import { generateKeyPair } from '../utils/generateKeyPair';
import { cmdSend } from './send';
import type { Client } from 'whatsapp-web.js';

describe('cmdSend', () => {
  it('should log and send a message', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const mockClient = { sendMessage: jest.fn() } as unknown as Client;
    const mockKeyPair = generateKeyPair(); // Use a real key pair
    const usrPks = { chat123: mockKeyPair.publicKey }; // Use a real public key
    const args = {
      parts: ['!send', 'chat123', 'hello'],
      usrPks,
      client: mockClient,
      keyPair: mockKeyPair,
    };
    await cmdSend(args);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Encrypted & signed message sent'));
    expect(mockClient.sendMessage).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
