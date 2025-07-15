/**
 * Lists all stored public keys for contacts.
 * @param usrPks The map of user IDs to public keys
 */
import type { UsrPks } from '../lib/types';
export const cmdKeys = (usrPks: UsrPks) => {
  console.log('\n📋 Stored Public Keys:');
  if (Object.keys(usrPks).length > 0) {
    for (const [user, key] of Object.entries(usrPks)) {
      console.log(`📱 ${user}:`);
      // Only show the first 80 chars for brevity
      console.log(`   ${key.substring(0, 80)}...`);
    }
  } else {
    console.log('   No keys stored yet');
  }
};
