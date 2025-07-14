"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeMessage = exports.routeCmd = void 0;
const utils_1 = require("./utils");
/**
 * Command prefix for terminal commands
 */
const CP = '!';
/**
 * Responds to the !ping command with a pong message.
 */
const cmdPing = () => {
    console.log('🏓 Pong!');
};
/**
 * Shows the user's public key in the terminal.
 * @param keyPair The user's RSA key pair
 */
const cmdPubkey = (keyPair) => {
    if (keyPair) {
        console.log('\n🔑 Your Public Key:');
        console.log(keyPair.publicKey);
    }
    else {
        console.log('❌ Key pair not ready yet');
    }
};
/**
 * Lists all stored public keys for contacts.
 * @param usrPks The map of user IDs to public keys
 */
const cmdKeys = (usrPks) => {
    console.log('\n📋 Stored Public Keys:');
    if (Object.keys(usrPks).length > 0) {
        for (const [user, key] of Object.entries(usrPks)) {
            console.log(`📱 ${user}:`);
            // Only show the first 80 chars for brevity
            console.log(`   ${key.substring(0, 80)}...`);
        }
    }
    else {
        console.log('   No keys stored yet');
    }
};
/**
 * Lists recent WhatsApp chats and their IDs.
 * @param client The WhatsApp client instance
 */
const cmdChats = (client) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('\n📱 Getting recent chats...');
    const chats = yield client.getChats();
    console.log('Recent chats:');
    for (let i = 0; i < Math.min(10, chats.length); i++) {
        const chat = chats[i];
        const name = chat.name || 'Unknown';
        console.log(`   ${name} - ${chat.id._serialized}`);
    }
});
/**
 * Handles the !send command: signs, encrypts, and sends a message to a contact.
 * - Signs the plaintext message with the sender's private key.
 * - Encrypts the plaintext with the recipient's public key.
 * - Sends both as a JSON payload.
 * @param args Command arguments, user keys, client, and sender key pair
 */
const cmdSend = (args) => __awaiter(void 0, void 0, void 0, function* () {
    if (args.parts.length < 3) {
        console.log('❌ Usage: !send <chatId> <message>');
        return;
    }
    const targetChatId = args.parts[1];
    const messageToSend = args.parts.slice(2).join(' ');
    // Check if we have the recipient's public key
    if (!args.usrPks[targetChatId]) {
        console.log(`❌ No public key for ${targetChatId}`);
        console.log(`Available keys: ${Object.keys(args.usrPks).join(', ') || 'none'}`);
        return;
    }
    // Check if our key pair is ready
    if (!args.keyPair) {
        console.log('❌ Key pair not ready yet');
        return;
    }
    // Sign the plaintext message with our private key
    const signature = (0, utils_1.signMessage)({
        message: messageToSend,
        privateKey: args.keyPair.privateKey,
    });
    // Encrypt the plaintext message with the recipient's public key
    const encrypted = (0, utils_1.encryptMessage)({
        message: messageToSend,
        pubkey: args.usrPks[targetChatId],
    });
    // Send both as a JSON string
    const payload = JSON.stringify({ encrypted, signature });
    yield args.client.sendMessage(targetChatId, payload);
    console.log(`✅ Encrypted & signed message sent to ${targetChatId}`);
});
/**
 * Handles the exit command, gracefully shutting down the app.
 */
const cmdExit = () => {
    console.log('👋 Goodbye!');
    process.exit(0);
};
/**
 * Handles unknown commands by showing available commands.
 */
const cmdUnknown = () => {
    console.log('❓ Unknown command. Available commands:');
    console.log('   !ping, !pubkey, !keys, !chats, !send <chatId> <message>, exit');
};
/**
 * Ignores empty lines in the terminal.
 */
const cmdEmpty = () => {
    // Ignore empty lines
};
/**
 * Handles incoming encrypted messages:
 * - Parses the JSON payload
 * - Decrypts the message with our private key
 * - Verifies the signature with the sender's public key (if available)
 * - Shows a warning if verification fails
 * @param args The message, our key pair, and the map of user public keys
 */
const handleEncryptedMessage = (args) => {
    if (!args.keyPair) {
        console.log('❌ Cannot decrypt: Key pair not ready');
        return;
    }
    let payload;
    try {
        payload = JSON.parse(args.msg.body);
    }
    catch (_a) {
        console.log('❌ Invalid message format');
        return;
    }
    const { encrypted, signature } = payload;
    // Decrypt the message with our private key
    const decryptedMessage = (0, utils_1.decryptMessage)({
        encryptedMessage: encrypted,
        privateKey: args.keyPair.privateKey,
    });
    // Try to verify the signature with the sender's public key
    const senderPublicKey = args.usrPks[args.msg.from];
    let isValid = false;
    if (senderPublicKey) {
        isValid = (0, utils_1.verifyMessage)({
            message: decryptedMessage,
            signature,
            pubkey: senderPublicKey,
        });
    }
    console.log(`\n📨 Encrypted message from ${args.msg.from}:`);
    console.log(`   Decrypted: "${decryptedMessage}"`);
    if (isValid) {
        console.log('   ✅ Signature verified');
    }
    else {
        console.log('   ⚠️ Signature could not be verified!');
    }
    console.log('\n💬 Enter command:');
};
/**
 * Handles receiving and storing a contact's public key.
 * @param args The message and the map of user public keys
 */
const handlePublicKeyStorage = (args) => __awaiter(void 0, void 0, void 0, function* () {
    args.usrPks[args.msg.from] = args.msg.body;
    console.log(`\n📝 Public key received and stored for ${args.msg.from}`);
    yield args.msg.reply('✅ Public key received and stored!');
    console.log('\n💬 Enter command:');
});
/**
 * Handles a public key request from WhatsApp, replying with our public key.
 * @param args The message and our key pair
 */
const handlePubkeyRequest = (args) => __awaiter(void 0, void 0, void 0, function* () {
    if (args.keyPair) {
        yield args.msg.reply(`Here's my public key:\n\n${args.keyPair.publicKey}`);
        console.log(`\n🔑 Public key sent to ${args.msg.from}`);
        console.log('\n💬 Enter command:');
    }
    else {
        yield args.msg.reply('❌ Key pair not ready yet');
    }
});
/**
 * Routes terminal commands to their handlers.
 * @param args The command, key pair, user public keys, and WhatsApp client
 */
const routeCmd = (args) => __awaiter(void 0, void 0, void 0, function* () {
    const { cmd } = args;
    // Handle empty command
    if (cmd === '') {
        return cmdEmpty();
    }
    // Handle exit command (no prefix)
    if (cmd === 'exit') {
        return cmdExit();
    }
    // Handle send command with arguments
    if (cmd.startsWith(`${CP}send `)) {
        const parts = cmd.split(' ');
        return cmdSend({
            parts,
            usrPks: args.usrPks,
            client: args.client,
            keyPair: args.keyPair,
        });
    }
    // Handle simple commands
    switch (cmd) {
        case `${CP}ping`:
            return cmdPing();
        case `${CP}pubkey`:
            return cmdPubkey(args.keyPair);
        case `${CP}keys`:
            return cmdKeys(args.usrPks);
        case `${CP}chats`:
            return cmdChats(args.client);
        default:
            return cmdUnknown();
    }
});
exports.routeCmd = routeCmd;
/**
 * Routes incoming WhatsApp messages to their handlers.
 * - Handles encrypted messages (JSON payloads)
 * - Handles public key storage
 * - Handles public key requests
 * @param args The message, our key pair, and user public keys
 */
const routeMessage = (args) => __awaiter(void 0, void 0, void 0, function* () {
    const originalBody = args.msg.body;
    // Handle encrypted messages (now JSON payload)
    let isEncryptedPayload = false;
    try {
        const parsed = JSON.parse(originalBody);
        if (parsed && typeof parsed === 'object' && 'encrypted' in parsed && 'signature' in parsed) {
            isEncryptedPayload = true;
        }
    }
    catch (_a) { }
    if (isEncryptedPayload) {
        return handleEncryptedMessage({
            msg: args.msg,
            keyPair: args.keyPair,
            usrPks: args.usrPks,
        });
    }
    // Handle public key storage
    if ((0, utils_1.isPublicKey)(originalBody)) {
        return handlePublicKeyStorage({
            msg: args.msg,
            usrPks: args.usrPks,
        });
    }
    // Handle pubkey request
    if (originalBody === '!pubkey') {
        return handlePubkeyRequest({
            msg: args.msg,
            keyPair: args.keyPair,
        });
    }
});
exports.routeMessage = routeMessage;
