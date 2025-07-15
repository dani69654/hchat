import { KeyPair } from '../lib/types';

/**
 * Shows the user's public key in the terminal.
 * @param keyPair The user's RSA key pair
 */
export const cmdPubkey = (keyPair: KeyPair | null) => {
  if (keyPair) {
    console.log('\n🔑 Your Public Key:');
    console.log(keyPair.publicKey);
  } else {
    console.log('❌ Key pair not ready yet');
  }
};
