import { NextResponse } from 'next/server';
import { listChats } from '@/server/whatsapp';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const chats = await listChats();
    return NextResponse.json({ chats });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 409 });
  }
}
