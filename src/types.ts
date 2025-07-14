import type { KeyPairSyncResult } from 'crypto';

export type KeyPair = KeyPairSyncResult<string, string>;
export type UsrPks = Record<string, string>;
