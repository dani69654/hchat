"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateKeyPair = exports.isPublicKey = exports.verifyMessage = exports.signMessage = exports.decryptMessage = exports.encryptMessage = exports.promptCommandList = void 0;
const crypto_1 = require("crypto");
const promptCommandList = () => {
    console.log('\n📋 Terminal Commands:');
    console.log('  !pubkey - Show your public key');
    console.log('  !send <chatId> <message> - Send encrypted message');
    console.log('  !keys - Show stored public keys');
    console.log('  !ping - Test command');
    console.log('  !chats - Show recent chats');
    console.log('  exit - Quit application');
    console.log('\n💬 Enter command:');
};
exports.promptCommandList = promptCommandList;
const encryptMessage = (args) => {
    const encrypted = (0, crypto_1.publicEncrypt)(args.pubkey, Buffer.from(args.message));
    return `🔒ENC:${encrypted.toString('base64')}`;
};
exports.encryptMessage = encryptMessage;
const decryptMessage = (args) => {
    if (!args.encryptedMessage.startsWith('🔒ENC:')) {
        return args.encryptedMessage;
    }
    const encryptedData = args.encryptedMessage.replace('🔒ENC:', '');
    const decrypted = (0, crypto_1.privateDecrypt)(args.privateKey, Buffer.from(encryptedData, 'base64'));
    return decrypted.toString();
};
exports.decryptMessage = decryptMessage;
const signMessage = (args) => {
    const sign = (0, crypto_1.createSign)('SHA256');
    sign.write(args.message);
    sign.end();
    return sign.sign(args.privateKey, 'hex');
};
exports.signMessage = signMessage;
const verifyMessage = (args) => {
    const verify = (0, crypto_1.createVerify)('SHA256');
    verify.update(args.message);
    verify.end();
    return verify.verify(args.pubkey, Buffer.from(args.signature, 'hex'));
};
exports.verifyMessage = verifyMessage;
const isPublicKey = (message) => {
    return (message.includes('-----BEGIN PUBLIC KEY-----') && message.includes('-----END PUBLIC KEY-----'));
};
exports.isPublicKey = isPublicKey;
const generateKeyPair = () => {
    return (0, crypto_1.generateKeyPairSync)('rsa', {
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
};
exports.generateKeyPair = generateKeyPair;
