#!/usr/bin/env node

import { Client } from 'whatsapp-web.js';
import { routeCmd, routeMessage } from './commands';
import qrCode from 'qrcode-terminal';
import readline from 'readline';
import { KeyPair, UsrPks } from './lib/types';
import { promptCommandList } from './utils/promptCommandList';
import { generateKeyPair } from './utils/generateKeyPair';
import inquirer from 'inquirer';
import { checkTorConnection, getTorPuppeteerArgs } from './utils/tor';

let keyPair: KeyPair | null = null;
let userPublicKeys: UsrPks = {};

const startApp = async () => {
  const { enableTor } = await inquirer.prompt([
    {
      name: 'enableTor',
      type: 'confirm',
      message: 'Do you want to run the app via Tor?',
      default: true,
    },
  ]);

  let puppeteerArgs = undefined;
  if (enableTor) {
    const isTor = await checkTorConnection();
    if (!isTor) {
      console.error('\n❌ Tor check failed: Traffic is NOT routed through Tor. Make sure Tor is running on port 9050.');
      process.exit(1);
    } else {
      console.log('\n🟢 Tor check: Success! Traffic is routed through Tor.');
      puppeteerArgs = getTorPuppeteerArgs();
    }
  }

  const client = new Client({
    puppeteer: puppeteerArgs ? { args: puppeteerArgs } : {},
  });
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  client.on('qr', qr => {
    qrCode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    console.clear();
    keyPair = generateKeyPair();
    promptCommandList();
  });

  // Terminal command handling
  rl.on('line', async input => {
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
  client.on('message_create', async msg => {
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
