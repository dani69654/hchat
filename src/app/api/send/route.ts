import { NextResponse } from 'next/server';
import { sendEncrypted } from '@/server/whatsapp';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const chatId = typeof body?.chatId === 'string' ? body.chatId.trim() : '';
  const message = typeof body?.message === 'string' ? body.message : '';
  if (!chatId || !message) {
    return NextResponse.json({ error: 'chatId and message are required' }, { status: 400 });
  }
  try {
    await sendEncrypted({ chatId, message });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
