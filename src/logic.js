const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const readline = require('readline');
const { encryptMessage, decryptMessage, isPublicKey } = require('./utils');
const crypto = require('crypto');

let keyPair = null;
let userPublicKeys = {};

function startApp() {
    const client = new Client();
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    client.on('qr', (qr) => {
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        console.clear();
        console.log('Client is ready!');
        // Generate RSA key pair
        console.log('Generating RSA key pair...');
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
        console.log('Public key preview:', keyPair.publicKey.substring(0, 100) + '...');
        setTimeout(() => {
            console.log('\n📋 Terminal Commands:');
            console.log('  !pubkey - Show your public key');
            console.log('  !send <chatId> <message> - Send encrypted message');
            console.log('  !keys - Show stored public keys');
            console.log('  !ping - Test command');
            console.log('  !chats - Show recent chats');
            console.log('  exit - Quit application');
            console.log('\n💬 Enter command:');
        }, 1000);
    });

    rl.on('line', async (input) => {
        const command = input.trim();
        try {
            if (command === '!ping') {
                console.log('🏓 Pong!');
            } else if (command === '!pubkey') {
                if (keyPair) {
                    console.log('\n🔑 Your Public Key:');
                    console.log(keyPair.publicKey);
                } else {
                    console.log('❌ Key pair not ready yet');
                }
            } else if (command === '!keys') {
                console.log('\n📋 Stored Public Keys:');
                if (Object.keys(userPublicKeys).length > 0) {
                    for (const [user, key] of Object.entries(userPublicKeys)) {
                        console.log(`📱 ${user}:`);
                        console.log(`   ${key.substring(0, 80)}...`);
                    }
                } else {
                    console.log('   No keys stored yet');
                }
            } else if (command === '!chats') {
                console.log('\n📱 Getting recent chats...');
                const chats = await client.getChats();
                console.log('Recent chats:');
                for (let i = 0; i < Math.min(10, chats.length); i++) {
                    const chat = chats[i];
                    const name = chat.name || 'Unknown';
                    console.log(`   ${name} - ${chat.id._serialized}`);
                }
            } else if (command.startsWith('!send ')) {
                const parts = command.split(' ');
                if (parts.length < 3) {
                    console.log('❌ Usage: !send <chatId> <message>');
                } else {
                    const targetChatId = parts[1];
                    const messageToSend = parts.slice(2).join(' ');
                    if (!userPublicKeys[targetChatId]) {
                        console.log(`❌ No public key for ${targetChatId}`);
                        console.log(`Available keys: ${Object.keys(userPublicKeys).join(', ') || 'none'}`);
                    } else {
                        console.log(`🔐 Encrypting message: "${messageToSend}"`);
                        const encrypted = encryptMessage(messageToSend, userPublicKeys[targetChatId]);
                        await client.sendMessage(targetChatId, encrypted);
                        console.log(`✅ Encrypted message sent to ${targetChatId}`);
                    }
                }
            } else if (command === 'exit') {
                console.log('👋 Goodbye!');
                process.exit(0);
            } else if (command === '') {
                // Ignore empty lines
            } else {
                console.log('❓ Unknown command. Available commands:');
                console.log('   !ping, !pubkey, !keys, !chats, !send <chatId> <message>, exit');
            }
        } catch (error) {
            console.error('❌ Error executing command:', error.message);
        }
        console.log('\n💬 Enter command:');
    });

    client.on('message_create', async (msg) => {
        const originalBody = msg.body;
        const userNumber = msg.from;
        if (originalBody.startsWith('🔒ENC:')) {
            const decryptedMessage = decryptMessage(originalBody, keyPair.privateKey);
            console.log(`\n📨 Encrypted message from ${userNumber}:`);
            console.log(`   Decrypted: "${decryptedMessage}"`);
            console.log('\n💬 Enter command:');
        }
        if (isPublicKey(originalBody)) {
            userPublicKeys[userNumber] = originalBody;
            console.log(`\n📝 Public key received and stored for ${userNumber}`);
            await msg.reply('✅ Public key received and stored!');
            console.log('\n💬 Enter command:');
        }
        if (originalBody === '!pubkey') {
            if (keyPair) {
                await msg.reply(`Here's my public key:\n\n${keyPair.publicKey}`);
                console.log(`\n🔑 Public key sent to ${userNumber}`);
                console.log('\n💬 Enter command:');
            }
        }
    });

    client.initialize();

    process.on('SIGINT', () => {
        console.log('\n👋 Shutting down...');
        rl.close();
        process.exit(0);
    });
}

module.exports = { startApp };
