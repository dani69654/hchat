# hchat

A WhatsApp web client built with [Next.js](https://nextjs.org) and [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js), with an end-to-end encryption layer on top of WhatsApp itself: messages are sealed with a one-time key per message (ephemeral X25519 → HKDF-SHA256 → AES-256-GCM) and Ed25519-signed inside the ciphertext, before they ever hit the wire. Optionally routes all WhatsApp traffic through Tor.

## Features

- Connects to WhatsApp Web via QR code shown in the browser
- Optional Tor routing (SOCKS5 proxy on port 9050) with a connectivity check
- Fresh X25519 (key agreement) + Ed25519 (signing) identity per session, with a fingerprint for out-of-band verification
- One-click key exchange with contacts
- ECIES message encryption: a fresh ephemeral key pair per message, AES-256-GCM, no practical size limit
- Signatures are sealed **inside** the ciphertext, so nothing about the message content is observable on the wire
- Replay detection (per-message nonces) and recipient binding (a captured message can't be re-encrypted to someone else)
- Live activity feed (Server-Sent Events) with chat list and stored keys

## How It Works

1. Open the app, choose whether to route through Tor, and connect. Scan the QR code with WhatsApp on your phone.
2. Once connected, a fresh X25519 + Ed25519 identity is generated for the session. Its fingerprint is shown in the UI.
3. Select a chat, then **Request their key** / **Share my key** to exchange key bundles over WhatsApp. Compare fingerprints over a trusted channel (call, in person) to rule out a man-in-the-middle.
4. For each outgoing message, an ephemeral X25519 key pair is generated; ECDH with the recipient's static key plus HKDF-SHA256 derives a one-time AES-256-GCM key. The payload — message, nonce, timestamp, recipient fingerprint, and an Ed25519 signature over all of it — is sealed into the ciphertext.
5. Incoming envelopes are decrypted, checked for replays and recipient binding, and the signature is verified against the sender's stored signing key.

### Why this design

- **Per-message ephemeral keys**: the sender's half of every key agreement is discarded immediately, so a one-time AES key can't be re-derived later from the sender's side.
- **Signature inside the ciphertext**: a plaintext signature would let an observer confirm guessed message contents; sealing it leaks nothing.
- **Recipient fingerprint in the signed transcript**: a recipient can't take your signed message and re-encrypt it to a third party as if you had sent it to them.
- **AAD + HKDF context binding**: the ephemeral public key is bound into both the key derivation and the GCM authenticated data, so envelope parts can't be mixed and matched.

The v2 wire protocol is JSON: `{hchat: 2, type: 'keys', …}` bundles and `{hchat: 2, type: 'msg', epk, iv, ct, tag}` envelopes, plus the `!pubkey` request. It is not compatible with the old RSA-based v1 protocol; v1 payloads are detected and flagged.

## Project Structure

- `src/app/page.tsx` — the single-page UI (connect, QR, chats, keys, activity feed, composer)
- `src/app/api/` — API routes: session lifecycle, chats, keys, send, key exchange, SSE event stream
- `src/server/` — server-side singleton holding the whatsapp-web.js client, session state, and the activity feed
- `src/utils/` — pure crypto utilities (identity generation, key bundles, ECIES encrypt/decrypt, sign/verify) with tests
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

- **Key storage:** Keys are kept in server memory for the session only. Restarting the server generates a new identity; previously stored contact keys are lost.
- **Key verification:** Key bundles travel over WhatsApp itself, so always compare fingerprints over a trusted channel. An unverified fingerprint means WhatsApp (or anyone in the middle) could have substituted keys.
- **Forward secrecy scope:** Message keys are one-time (ephemeral sender keys), but the recipient's session key can decrypt everything received during that session. Session keys are never written to disk and die with the process.
- **Local use:** The app has no authentication of its own — anyone who can reach the server controls your WhatsApp session. Run it locally and do not expose the port.

## Requirements

- Node.js v20 or higher
- WhatsApp account
- (Optional) Tor running on port 9050

## Testing

```bash
npm test
```
