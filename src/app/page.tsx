'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatInfo, FeedEvent, SessionInfo } from '@/lib/types';

const STATUS_LABELS: Record<SessionInfo['status'], string> = {
  idle: 'Disconnected',
  checking_tor: 'Checking Tor…',
  starting: 'Starting browser…',
  waiting_qr: 'Scan QR code',
  authenticating: 'Authenticating…',
  ready: 'Connected',
  error: 'Error',
};

export default function Home() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [useTor, setUseTor] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [chats, setChats] = useState<ChatInfo[]>([]);
  const [selectedChat, setSelectedChat] = useState('');
  const [message, setMessage] = useState('');
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [myPublicKey, setMyPublicKey] = useState<string | null>(null);
  const [contactKeys, setContactKeys] = useState<{ id: string }[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  const isReady = session?.status === 'ready';

  // Poll session status.
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch('/api/session');
        const data: SessionInfo = await res.json();
        if (!cancelled) setSession(data);
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const refreshChats = useCallback(async () => {
    try {
      const res = await fetch('/api/chats');
      if (!res.ok) return;
      const data = await res.json();
      setChats(data.chats ?? []);
    } catch {}
  }, []);

  const refreshKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/keys');
      const data = await res.json();
      setMyPublicKey(data.publicKey ?? null);
      setContactKeys(data.contacts ?? []);
    } catch {}
  }, []);

  // Once ready: load chats/keys and subscribe to the event feed.
  useEffect(() => {
    if (!isReady) return;
    refreshChats();
    refreshKeys();
    const source = new EventSource('/api/events');
    source.onmessage = e => {
      const event: FeedEvent = JSON.parse(e.data);
      setEvents(prev => (prev.some(p => p.id === event.id) ? prev : [...prev, event]));
      // Key exchanges show up as system events; keep the key list fresh.
      if (event.kind === 'system' && event.text.includes('key')) {
        refreshKeys();
        refreshChats();
      }
    };
    return () => source.close();
  }, [isReady, refreshChats, refreshKeys]);

  // Auto-scroll the feed.
  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight });
  }, [events]);

  const connect = async () => {
    setConnecting(true);
    try {
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tor: useTor }),
      });
    } finally {
      setConnecting(false);
    }
  };

  const post = async (url: string, body: object) => {
    setActionError(null);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setActionError(data?.error ?? `Request failed (${res.status})`);
      return false;
    }
    return true;
  };

  const send = async () => {
    if (!selectedChat || !message.trim()) return;
    setSending(true);
    try {
      const ok = await post('/api/send', { chatId: selectedChat, message: message.trim() });
      if (ok) setMessage('');
    } finally {
      setSending(false);
    }
  };

  const status = session?.status ?? 'idle';
  const selectedHasKey = chats.find(c => c.id === selectedChat)?.hasKey || contactKeys.some(k => k.id === selectedChat);

  return (
    <div className="app">
      <header className="header">
        <h1>
          h<span>chat</span>
        </h1>
        <span className={`badge ${status === 'ready' ? 'ready' : status === 'error' ? 'error' : ''}`}>
          {STATUS_LABELS[status]}
        </span>
        {session?.torEnabled && status !== 'idle' && <span className="badge tor">Tor</span>}
        {session?.me && <span className="badge mono">{session.me}</span>}
      </header>

      {!isReady && (
        <div className="card connect-card">
          {status === 'idle' || status === 'error' ? (
            <>
              <p>
                Connect your WhatsApp account. A fresh RSA-2048 key pair is generated per session; exchange public keys
                with a contact, then every message is signed and encrypted end-to-end.
              </p>
              <label className="checkbox-row">
                <input type="checkbox" checked={useTor} onChange={e => setUseTor(e.target.checked)} />
                Route traffic through Tor (requires Tor on port 9050)
              </label>
              <button onClick={connect} disabled={connecting}>
                {connecting ? 'Starting…' : 'Connect to WhatsApp'}
              </button>
              {session?.error && <p className="error-text">{session.error}</p>}
            </>
          ) : status === 'waiting_qr' && session?.qrDataUrl ? (
            <>
              <p>Scan this QR code with WhatsApp on your phone (Linked devices → Link a device).</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="qr-img" src={session.qrDataUrl} alt="WhatsApp QR code" />
            </>
          ) : (
            <>
              <p>{STATUS_LABELS[status]}</p>
              {session?.detail && <p className="hint">{session.detail}</p>}
            </>
          )}
        </div>
      )}

      {isReady && (
        <div className="layout">
          <aside className="sidebar">
            <section className="card">
              <h2>
                Chats
                <button className="secondary" onClick={refreshChats}>
                  Refresh
                </button>
              </h2>
              <ul className="chat-list">
                {chats.map(chat => (
                  <li
                    key={chat.id}
                    className={chat.id === selectedChat ? 'selected' : ''}
                    onClick={() => setSelectedChat(chat.id)}
                    title={chat.id}
                  >
                    <span className="chat-name">{chat.name}</span>
                    {chat.hasKey && <span className="key-dot">🔑</span>}
                  </li>
                ))}
                {chats.length === 0 && <li>No chats loaded yet</li>}
              </ul>
            </section>

            <section className="card">
              <h2>My public key</h2>
              {myPublicKey ? <pre className="pubkey-box mono">{myPublicKey}</pre> : <p className="hint">Not ready</p>}
            </section>

            <section className="card">
              <h2>Stored contact keys</h2>
              {contactKeys.length > 0 ? (
                <ul className="keys-list">
                  {contactKeys.map(k => (
                    <li key={k.id} className="mono">
                      🔑 {k.id}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="hint">No keys stored yet. Select a chat and request the contact&apos;s key.</p>
              )}
            </section>
          </aside>

          <main className="main">
            <section className="card">
              <h2>Activity</h2>
              <div className="feed" ref={feedRef}>
                {events.map(event => (
                  <div key={event.id} className={`msg ${event.kind}`}>
                    {event.kind === 'incoming' && (
                      <div className="meta">
                        <span className="mono">{event.from}</span>
                        <span className={`sig ${event.signature}`}>
                          {event.signature === 'valid'
                            ? '✅ signature verified'
                            : event.signature === 'invalid'
                              ? '⚠️ invalid signature'
                              : '⚠️ signature not verified'}
                        </span>
                      </div>
                    )}
                    {event.kind === 'outgoing' && (
                      <div className="meta">
                        <span className="mono">to {event.to}</span>
                        <span>🔒 encrypted &amp; signed</span>
                      </div>
                    )}
                    {event.text}
                  </div>
                ))}
                {events.length === 0 && <p className="hint">Nothing yet. Incoming encrypted messages appear here.</p>}
              </div>
            </section>

            <section className="card composer">
              <div className="target">
                {selectedChat ? (
                  <>
                    To: <code>{selectedChat}</code> {selectedHasKey ? '🔑' : '(no public key yet)'}
                  </>
                ) : (
                  'Select a chat from the sidebar, or type a chat ID below.'
                )}
              </div>
              <input
                type="text"
                className="mono"
                placeholder="Chat ID (e.g. 39333xxxxxxx@c.us)"
                value={selectedChat}
                onChange={e => setSelectedChat(e.target.value.trim())}
              />
              <div className="actions-row">
                <button
                  className="secondary"
                  disabled={!selectedChat}
                  onClick={() => post('/api/pubkey/request', { chatId: selectedChat })}
                >
                  Request their key
                </button>
                <button
                  className="secondary"
                  disabled={!selectedChat}
                  onClick={() => post('/api/pubkey/share', { chatId: selectedChat })}
                >
                  Share my key
                </button>
              </div>
              <div className="composer-row">
                <textarea
                  rows={2}
                  placeholder={selectedHasKey ? 'Encrypted message…' : 'Exchange keys before sending'}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                />
                <button onClick={send} disabled={sending || !selectedChat || !message.trim()}>
                  Send 🔒
                </button>
              </div>
              {actionError && <p className="error-text">{actionError}</p>}
              <p className="hint">
                Messages are signed with your private key and encrypted with the recipient&apos;s public key (RSA-2048),
                so only short text messages are supported.
              </p>
            </section>
          </main>
        </div>
      )}
    </div>
  );
}
