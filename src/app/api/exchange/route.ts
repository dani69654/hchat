import { NextResponse } from 'next/server';
import { exchangeKeys } from '@/server/whatsapp';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const chatId = typeof body?.chatId === 'string' ? body.chatId.trim() : '';
  if (!chatId) {
    return NextResponse.json({ error: 'chatId is required' }, { status: 400 });
  }
  try {
    const result = await exchangeKeys(chatId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
