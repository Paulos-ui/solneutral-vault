import { NextRequest, NextResponse } from 'next/server';
import { DEVNET_GENESIS_HASH } from '@/lib/devnet-execution';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAINNET_GENESIS_HASH = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d';
const DEVNET_FALLBACK = 'https://api.devnet.solana.com';
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
  const [devnet, mainnet] = probe ? await Promise.all([
    probeRpc(process.env.NEXT_PUBLIC_DEVNET_RPC_URL || DEVNET_FALLBACK, DEVNET_GENESIS_HASH),
    probeRpc(process.env.SOLANA_RPC_URL || MAINNET_FALLBACK, MAINNET_GENESIS_HASH),
  ]) : ['not_checked', 'not_checked'] as const;

  return NextResponse.json({
    project: 'SolNeutral',
    release: '7.5-assisted-collateral-and-solneutral-ai',
    backend: 'online',
    environment: process.env.VERCEL_ENV || 'local',
    verifiedAt: new Date().toISOString(),
    execution: {
      cluster: 'devnet-only',
      devnetEnabled: process.env.NEXT_PUBLIC_ENABLE_DEVNET_TRADING !== 'false',
      pooledVaultDepositsEnabled: false,
    },
    services: {
      nextApi: { state: 'online', detail: 'Next.js API routes are serving requests.' },
      devnetRpc: { state: devnet, configured: Boolean(process.env.NEXT_PUBLIC_DEVNET_RPC_URL) },
      mainnetResearchRpc: { state: mainnet, configured: Boolean(process.env.SOLANA_RPC_URL), note: 'Read-only research, separate from devnet trading.' },
      aiNarration: { state: configuredAi ? 'configured' : 'optional_not_configured' },
      fundingData: { state: 'external', endpoint: '/api/market/funding' },
      solReferenceChart: { state: 'external', endpoint: '/api/market/sol-chart?interval=5m', venue: 'Coinbase SOL/USD spot, separate from Drift perp' },
    },
    note: 'A healthy web API does not prove that a Drift account exists or that the external funding indexer is available.',
  }, { headers: { 'Cache-Control': 'no-store' } });
}
