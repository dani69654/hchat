/**
 * Handles receiving and storing a contact's public key.
 * @param args The message and the map of user public keys
 */
import type { Message } from 'whatsapp-web.js';
import type { UsrPks } from '../lib/types';
export const handlePublicKeyStorage = async (args: { msg: Message; usrPks: UsrPks }) => {
  args.usrPks[args.msg.from] = args.msg.body;
  console.log(`\n📝 Public key received and stored for ${args.msg.from}`);
  await args.msg.reply('✅ Public key received and stored!');
  console.log('\n💬 Enter command:');
};
