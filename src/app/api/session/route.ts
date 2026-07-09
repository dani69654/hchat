import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { store } from '@/server/store';
import { startSession } from '@/server/whatsapp';
import type { SessionInfo } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const qrDataUrl = store.qr ? await QRCode.toDataURL(store.qr, { margin: 1, width: 320 }) : null;
  const info: SessionInfo = {
    status: store.status,
    detail: store.detail,
    error: store.error,
    torEnabled: store.torEnabled,
    qrDataUrl,
    me: store.me,
  };
  return NextResponse.json(info);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const tor = Boolean(body?.tor);
  // Fire and forget: the Tor check + Puppeteer launch take a while,
  // the UI polls GET /api/session for progress.
  void startSession({ tor });
  return NextResponse.json({ ok: true });
}
