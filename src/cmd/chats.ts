/**
 * Lists recent WhatsApp chats and their IDs.
 * @param client The WhatsApp client instance
 */
import type { Client } from 'whatsapp-web.js';
export const cmdChats = async (client: Client) => {
  console.log('\n📱 Getting recent chats...');
  const chats = await client.getChats();
  console.log('Recent chats:');
  for (let i = 0; i < Math.min(10, chats.length); i++) {
    const chat = chats[i];
    const name = chat.name || 'Unknown';
    console.log(`   ${name} - ${chat.id._serialized}`);
  }
};
