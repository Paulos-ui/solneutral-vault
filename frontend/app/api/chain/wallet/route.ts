import { NextRequest, NextResponse } from 'next/server';
import { isSolanaPublicKey, MAINNET_USDC_MINT, parseSolBalance, parseUsdcBalance } from '@/lib/wallet';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const NO_STORE = { 'Cache-Control': 'no-store, max-age=0' };

async function rpcRead(method: 'getBalance' | 'getTokenAccountsByOwner', params: unknown[]) {
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(7500),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('RPC request rejected');
  const body: unknown = await response.json();
  if (!body || typeof body !== 'object' || !('result' in body) || !body.result || 'error' in body) throw new Error('RPC returned no usable result');
  return body.result;
}

export async function POST(request: NextRequest) {
  let input: unknown;
  try {
    if (Number(request.headers.get('content-length') || 0) > 512) throw new Error('Oversized payload');
    input = await request.json();
  } catch {
    return NextResponse.json({ message: 'Send a public Solana address in JSON.' }, { status: 400, headers: NO_STORE });
  }
  const address = input && typeof input === 'object' && 'address' in input ? input.address : undefined;
  if (!isSolanaPublicKey(address)) {
    return NextResponse.json({ message: 'Enter a valid 32-byte base58 Solana public address. Never paste a private key or seed phrase.' }, { status: 400, headers: NO_STORE });
  }

  const settled = await Promise.allSettled([
    rpcRead('getBalance', [address, { commitment: 'confirmed' }]),
    rpcRead('getTokenAccountsByOwner', [address, { mint: MAINNET_USDC_MINT }, { encoding: 'jsonParsed', commitment: 'confirmed' }]),
  ]);
  const sol = settled[0].status === 'fulfilled' ? parseSolBalance(settled[0].value) : null;
  const usdc = settled[1].status === 'fulfilled' ? parseUsdcBalance(settled[1].value) : null;
  const status = sol && usdc ? 'observed' : sol || usdc ? 'partial' : 'unavailable';
  const message = status === 'observed'
    ? 'Confirmed RPC reads for native SOL and canonical USDC. This does not include Drift positions, token prices, or DeFi collateral.'
    : status === 'partial'
      ? 'The RPC provider returned only part of the data. Missing values are unknown, not zero. Try again or configure a dedicated provider.'
      : 'The Solana RPC provider did not return verifiable balances. Try again later or configure SOLANA_RPC_URL.';
  return NextResponse.json({
    status, network: 'mainnet-beta', address, fetchedAt: new Date().toISOString(), sol, usdc, notice: message,
  }, { status: status === 'unavailable' ? 503 : 200, headers: NO_STORE });
}
