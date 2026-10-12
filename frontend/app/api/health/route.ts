import { NextRequest, NextResponse } from 'next/server';
import { TESTNET_GENESIS_HASH } from '@/lib/testnet-sol';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAINNET_GENESIS_HASH = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d';
const TESTNET_FALLBACK = 'https://api.testnet.solana.com';
const MAINNET_FALLBACK = 'https://api.mainnet-beta.solana.com';

type ProbeState = 'not_checked' | 'verified' | 'unavailable' | 'wrong_network';

/** Only fixed operator-configured endpoints are contacted. Never accepts a user URL. */
async function probeRpc(url: string, expectedHash: string): Promise<ProbeState> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getGenesisHash', params: [] }),
      signal: AbortSignal.timeout(4_000),
      cache: 'no-store',
    });
    if (!response.ok) return 'unavailable';
    const body: unknown = await response.json();
    if (!body || typeof body !== 'object' || !('result' in body)) return 'unavailable';
    return (body as { result: unknown }).result === expectedHash ? 'verified' : 'wrong_network';
  } catch {
    return 'unavailable';
  }
}

/** No wallet, API-key, RPC URL, token or stack trace ever leaves this endpoint. */
export async function GET(request: NextRequest) {
  const probe = request.nextUrl.searchParams.get('probe') === '1';
  const configuredAi = Boolean(
    process.env.ANTHROPIC_API_KEY &&
    process.env.ANTHROPIC_MODEL
  );
  const [testnet, mainnet] = probe ? await Promise.all([
    probeRpc(process.env.NEXT_PUBLIC_TESTNET_RPC_URL || TESTNET_FALLBACK, TESTNET_GENESIS_HASH),
    probeRpc(process.env.SOLANA_RPC_URL || MAINNET_FALLBACK, MAINNET_GENESIS_HASH),
  ]) : ['not_checked', 'not_checked'] as const;

  return NextResponse.json({
    project: 'SolNeutral',
    release: '7.6-testnet-sol-reserve',
    backend: 'online',
    environment: process.env.VERCEL_ENV || 'local',
    verifiedAt: new Date().toISOString(),
    execution: {
      cluster: 'testnet-only',
      personalWalletWsolReserveEnabled: true,
      pooledVaultDepositsEnabled: false,
    },
    services: {
      nextApi: { state: 'online', detail: 'Next.js API routes are serving requests.' },
      testnetRpc: { state: testnet, configured: Boolean(process.env.NEXT_PUBLIC_TESTNET_RPC_URL) },
      mainnetResearchRpc: { state: mainnet, configured: Boolean(process.env.SOLANA_RPC_URL), note: 'Read-only research, separate from testnet wallet actions.' },
      aiNarration: { state: configuredAi ? 'configured' : 'optional_not_configured' },
      legacyFundingResearch: { state: 'historical-reference-only', endpoint: '/api/market/funding' },
      solReferenceChart: { state: 'external', endpoint: '/api/market/sol-chart?interval=5m', venue: 'Coinbase SOL/USD spot, separate from wallet reserve' },
    },
    note: 'A healthy API is not proof of a signed testnet deposit, withdrawal, or balance change.',
  }, { headers: { 'Cache-Control': 'no-store' } });
}
