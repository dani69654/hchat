import { NextResponse } from 'next/server';
import { store } from '@/server/store';
import { exportKeyBundle } from '@/utils/keyBundle';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    fingerprint: store.keyPair?.fingerprint ?? null,
    bundle: store.keyPair ? exportKeyBundle(store.keyPair) : null,
    contacts: Object.entries(store.usrPks).map(([id, keys]) => ({ id, fingerprint: keys.fingerprint })),
  });
}
