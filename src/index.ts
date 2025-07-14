import { Client } from 'whatsapp-web.js';
import { promptCommandList } from './utils';
import { routeCmd, routeMessage } from './commands';
import crypto from 'crypto';
import qrCode from 'qrcode-terminal';
import readline from 'readline';
import { KeyPair, UsrPks } from './types';

let keyPair: KeyPair | null = null;
let userPublicKeys: UsrPks = {};

const startApp = () => {
  const client = new Client({});
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  client.on('qr', (qr) => {
    qrCode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    console.clear();

    keyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });
    console.log('Key pair generated successfully!');

    promptCommandList();
  });

  // Terminal command handling
  rl.on('line', async (input) => {
    const command = input.trim();
    try {
      await routeCmd({
        cmd: command,
        keyPair,
        usrPks: userPublicKeys,
        client,
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error('❌ Error executing command:', error.message);
      } else {
        console.error('❌ Error executing command:', error);
      }
    }
    console.log('\n💬 Enter command:');
  });

  // WhatsApp message handling
  client.on('message_create', async (msg) => {
    try {
      await routeMessage({
        msg,
        keyPair,
        usrPks: userPublicKeys,
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error('❌ Error handling message:', error.message);
      } else {
        console.error('❌ Error handling message:', error);
      }
    }
  });

  client.initialize();

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down...');
    rl.close();
    process.exit(0);
  });
};

startApp();
