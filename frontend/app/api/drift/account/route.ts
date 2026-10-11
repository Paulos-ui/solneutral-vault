import { NextRequest, NextResponse } from 'next/server';
import { isSolanaPublicKey } from '@/lib/wallet';
import {
  DRIFT_INDEXER_ORIGIN, parseDriftAccountInfo, parseIndexedPositionRecords,
  type DriftAccountResponse,
} from '@/lib/drift-account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const HEADERS = { 'Cache-Control': 'no-store, max-age=0' };

async function getAccountInfo(account: string) {
  const url = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  const response = await fetch(url, {
    method: 'POST', cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1, method: 'getAccountInfo',
      params: [account, { commitment: 'confirmed', encoding: 'base64', dataSlice: { offset: 0, length: 8 } }],
    }),
    signal: AbortSignal.timeout(7500),
  });
  if (!response.ok) throw new Error('RPC response failed');
  const body: unknown = await response.json();
  const result = body && typeof body === 'object' && 'result' in body && !('error' in body) ? body.result : null;
  return parseDriftAccountInfo(result);
}

export async function POST(request: NextRequest) {
  let account: unknown;
  try {
    if (Number(request.headers.get('content-length') || 0) > 512) throw new Error('Oversized request');
    const raw: unknown = await request.json();
    account = raw && typeof raw === 'object' && !Array.isArray(raw) && 'account' in raw ? raw.account : null;
  } catch {
    return NextResponse.json({ message: 'Provide a public Drift User subaccount address in JSON.' }, { status: 400, headers: HEADERS });
  }
  if (!isSolanaPublicKey(account)) {
    return NextResponse.json({ message: 'A valid 32-byte Solana public subaccount address is required. Never provide private keys.' }, { status: 422, headers: HEADERS });
  }

  const source = `${DRIFT_INDEXER_ORIGIN}/user/${account}/positions`;
  const fetchedAt = new Date().toISOString();
  const limitations = 'Indexed records are not independently verified current positions. Raw quantity fields have provider-defined precision. Liquidation price, leverage, equity and PnL are intentionally not calculated.';
  let onChain;
  try {
    onChain = await getAccountInfo(account);
  } catch {
    onChain = { status: 'unavailable' as const, slot: null, notice: 'RPC verification unavailable. Indexed records were not requested.' };
  }
  const result: DriftAccountResponse = {
    account, network: 'mainnet-beta', fetchedAt, onChain,
    indexed: { status: 'not-checked', records: [], source, notice: 'Indexed records require a verified Drift User subaccount first.' },
    limitations,
  };
  if (onChain.status !== 'verified') {
    return NextResponse.json(result, { status: onChain.status === 'unavailable' ? 503 : 200, headers: HEADERS });
  }

  try {
    const response = await fetch(source, { cache: 'no-store', headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(7500) });
    if (!response.ok) throw new Error('Indexer request failed');
    const raw: unknown = await response.json();
    const records = parseIndexedPositionRecords(raw);
    if (records === null) throw new Error('Indexer data format unsupported');
    result.indexed = records.length
      ? { status: 'observed', records, source, notice: 'Provider-indexed position records. Not independently confirmed as current, open positions.' }
      : { status: 'empty', records, source, notice: 'Indexer returned an empty record set. This does not independently prove zero open positions.' };
  } catch {
    result.indexed = { status: 'unavailable', records: [], source, notice: 'The Drift data indexer did not return records in a verified, supported format. No figures were substituted.' };
  }
  return NextResponse.json(result, { headers: HEADERS });
}
