"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const crypto_1 = require("crypto");
describe('Test sign and verify message', () => {
    const keyPair = (0, utils_1.generateKeyPair)();
    const message = (0, crypto_1.randomBytes)(20).toString('hex');
    let signature = '';
    it('should sign a message', () => {
        signature = (0, utils_1.signMessage)({
            privateKey: keyPair.privateKey,
            message,
        });
        expect(utils_1.signMessage).toBeDefined();
    });
    it('should verify the signed message', () => {
        expect(signature).toBeDefined();
        const isVerified = (0, utils_1.verifyMessage)({
            pubkey: keyPair.publicKey,
            signature,
            message,
        });
        expect(isVerified).toBe(true);
    });
    it('should not verify with a wrong public key', () => {
        const wrongKeyPair = (0, utils_1.generateKeyPair)();
        const isVerified = (0, utils_1.verifyMessage)({
            pubkey: wrongKeyPair.publicKey,
            signature,
            message,
        });
        expect(isVerified).toBe(false);
    });
});
