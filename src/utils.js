const crypto = require('crypto');

function encryptMessage(message, publicKey) {
    try {
        const encrypted = crypto.publicEncrypt(publicKey, Buffer.from(message));
        return `🔒ENC:${encrypted.toString('base64')}`;
    } catch (error) {
        console.error('Encryption failed:', error.message);
        return message;
    }
}

function decryptMessage(encryptedMessage, privateKey) {
    try {
        if (!encryptedMessage.startsWith('🔒ENC:')) {
            return encryptedMessage;
        }
        const encryptedData = encryptedMessage.replace('🔒ENC:', '');
        const decrypted = crypto.privateDecrypt(privateKey, Buffer.from(encryptedData, 'base64'));
        return decrypted.toString();
    } catch (error) {
        console.error('Decryption failed:', error.message);
        return encryptedMessage;
    }
}

function isPublicKey(message) {
    return message.includes('-----BEGIN PUBLIC KEY-----') && message.includes('-----END PUBLIC KEY-----');
}

module.exports = {
    encryptMessage,
    decryptMessage,
    isPublicKey,
};
