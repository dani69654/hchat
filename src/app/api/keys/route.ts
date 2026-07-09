import { NextResponse } from 'next/server';
import { store } from '@/server/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    publicKey: store.keyPair?.publicKey ?? null,
    contacts: Object.entries(store.usrPks).map(([id, publicKey]) => ({ id, publicKey })),
  });
}
