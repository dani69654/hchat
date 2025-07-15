/**
 * Handles unknown commands by showing available commands.
 */
export const cmdUnknown = () => {
  console.log('❓ Unknown command. Available commands:');
  console.log('   !pubkey, !keys, !chats, !send <chatId> <message>, exit');
};
