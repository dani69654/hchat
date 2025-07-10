# hchat

A simple command-line WhatsApp client using [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) with end-to-end RSA encryption for messages between users. This tool allows you to send and receive encrypted messages and exchange public keys with your contacts, all from your terminal.

## Features

- Connects to WhatsApp Web via QR code authentication
- Generates an RSA key pair for your session
- Allows you to share your public key with contacts
- Encrypts outgoing messages with the recipient's public key
- Decrypts incoming messages encrypted with your public key
- Stores public keys received from contacts
- Simple terminal command interface

## How It Works

1. On first run, the script generates an RSA key pair for your session.
2. You can share your public key with contacts (and receive theirs) via WhatsApp messages.
3. When you send a message using the `!send <chatId> <message>` command, the message is encrypted with the recipient's public key and sent via WhatsApp.
4. When you receive an encrypted message (prefixed with `🔒ENC:`), it is automatically decrypted and displayed in your terminal.
5. You can view your stored public keys and your own public key at any time.

## Project Structure

- `src/main.js`: Entry point. Run this file to start the app.
- `src/logic.js`: Main logic (WhatsApp client, command handling, event listeners).
- `src/utils.js`: Utility functions for encryption, decryption, and key checks.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Start the app:**
   ```bash
   node src/main.js
   ```
3. **Scan the QR code** with your WhatsApp mobile app to authenticate.

## Terminal Commands

- `!pubkey` — Show your public key (share this with contacts for encrypted messaging)
- `!send <chatId> <message>` — Send an encrypted message to a chat
- `!keys` — List stored public keys
- `!ping` — Test command
- `!chats` — List recent chats and their IDs
- `exit` — Quit the application

## Security Notes

- **Key Storage:** Keys are kept in memory for the session only. If you restart the app, a new key pair is generated and previous keys are lost.
- **Encryption:** Only messages prefixed with `🔒ENC:` are treated as encrypted. All other messages are sent/received as plain text.

## Requirements

- Node.js v18 or higher
- WhatsApp account

## License

No idea, do what u want with this. 
