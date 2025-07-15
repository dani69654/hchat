/**
 * Prints the list of available terminal commands to the console.
 */
export const promptCommandList = () => {
  console.log('\n📋 Terminal Commands:');
  console.log('  !pubkey - Show your public key');
  console.log('  !send <chatId> <message> - Send encrypted message');
  console.log('  !keys - Show stored public keys');
  console.log('  !chats - Show recent chats');
  console.log('  exit - Quit application');
  console.log('\n💬 Enter command:');
};
