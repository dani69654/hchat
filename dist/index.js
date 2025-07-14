#!/usr/bin/env node
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const whatsapp_web_js_1 = require("whatsapp-web.js");
const utils_1 = require("./utils");
const commands_1 = require("./commands");
const qrcode_terminal_1 = __importDefault(require("qrcode-terminal"));
const readline_1 = __importDefault(require("readline"));
let keyPair = null;
let userPublicKeys = {};
const startApp = () => {
    const client = new whatsapp_web_js_1.Client({});
    const rl = readline_1.default.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    client.on('qr', (qr) => {
        qrcode_terminal_1.default.generate(qr, { small: true });
    });
    client.on('ready', () => {
        console.clear();
        keyPair = (0, utils_1.generateKeyPair)();
        (0, utils_1.promptCommandList)();
    });
    // Terminal command handling
    rl.on('line', (input) => __awaiter(void 0, void 0, void 0, function* () {
        const command = input.trim();
        try {
            yield (0, commands_1.routeCmd)({
                cmd: command,
                keyPair,
                usrPks: userPublicKeys,
                client,
            });
        }
        catch (error) {
            if (error instanceof Error) {
                console.error('❌ Error executing command:', error.message);
            }
            else {
                console.error('❌ Error executing command:', error);
            }
        }
        console.log('\n💬 Enter command:');
    }));
    // WhatsApp message handling
    client.on('message_create', (msg) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield (0, commands_1.routeMessage)({
                msg,
                keyPair,
                usrPks: userPublicKeys,
            });
        }
        catch (error) {
            if (error instanceof Error) {
                console.error('❌ Error handling message:', error.message);
            }
            else {
                console.error('❌ Error handling message:', error);
            }
        }
    }));
    client.initialize();
    // Handle process termination
    process.on('SIGINT', () => {
        console.log('\n👋 Shutting down...');
        rl.close();
        process.exit(0);
    });
};
startApp();
