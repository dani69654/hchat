# hchat

A WhatsApp web client built with [Next.js](https://nextjs.org) and [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js), with end-to-end RSA encryption for messages between users. Send and receive encrypted messages and exchange public keys with your contacts from your browser, optionally routing all WhatsApp traffic through Tor.

## Features

- Connects to WhatsApp Web via QR code shown in the browser
- Optional Tor routing (SOCKS5 proxy on port 9050) with a connectivity check
- Generates an RSA-2048 key pair per session
- One-click public key exchange with contacts
- Signs outgoing messages with your private key and encrypts them with the recipient's public key
- Decrypts incoming messages and verifies their signatures
- Live activity feed (Server-Sent Events) with chat list and stored keys

## How It Works

1. Open the app, choose whether to route through Tor, and connect. Scan the QR code with WhatsApp on your phone.
2. Once connected, an RSA key pair is generated for the session.
3. Select a chat, then **Request their key** / **Share my key** to exchange public keys over WhatsApp.
4. Messages you send are signed with your private key, encrypted with the recipient's public key, and delivered as a JSON payload (`{ encrypted, signature }`).
5. Incoming encrypted messages are decrypted with your private key and their signature is verified against the sender's stored public key.

The wire protocol is unchanged from the CLI versions of hchat (`!pubkey` requests, PEM key messages, `🔒ENC:` payloads), so web and CLI clients interoperate.

## Project Structure

- `src/app/page.tsx` — the single-page UI (connect, QR, chats, keys, activity feed, composer)
- `src/app/api/` — API routes: session lifecycle, chats, keys, send, key exchange, SSE event stream
- `src/server/` — server-side singleton holding the whatsapp-web.js client, session state, and the activity feed
- `src/utils/` — pure crypto utilities (RSA key generation, encrypt/decrypt, sign/verify) with tests
- `src/lib/` — shared types and constants

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start the app:**

   ```bash
   npm run dev        # development
   # or
   npm run build && npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) and **scan the QR code** with your WhatsApp mobile app.

To use Tor, make sure a Tor daemon is listening on `127.0.0.1:9050` before connecting.

## Security Notes

- **Key storage:** Keys are kept in server memory for the session only. Restarting the server generates a new key pair; previously stored contact keys are lost.
- **Message size:** RSA-2048 encrypts the message directly, so only short text messages are supported.
- **Local use:** The app has no authentication of its own — anyone who can reach the server controls your WhatsApp session. Run it locally and do not expose the port.

## Requirements

- Node.js v20 or higher
- WhatsApp account
- (Optional) Tor running on port 9050

## Testing

```bash
npm test
```
