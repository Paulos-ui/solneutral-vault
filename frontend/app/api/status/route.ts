import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Public deployment metadata only; no secrets or unverified financial claims. */
export function GET() {
  return NextResponse.json({
    project: 'SolNeutral',
    version: '7.6.0-testnet',
    backend: 'nextjs-vercel-functions',
    mode: 'solana-testnet-wallet-reserve-and-research',
    walletConnectionAvailable: true,
    testnetWalletReserveSigningInterfaceAvailable: true,
    reserveCustody: 'user-wallet-owned-wsol-account',
    driftExecutionEnabled: false,
    pooledVaultDepositsEnabled: false,
    mainnetExecutionEnabled: false,
    aiDeterministicModeAvailable: true,
    privateAiConfigured: Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_MODEL),
    healthEndpoint: '/api/health',
    optionalLegacyFundingResearchEndpoint: '/api/market/funding',
    solReferenceChartEndpoint: '/api/market/sol-chart?interval=5m',
    solReferenceVenue: 'Coinbase Exchange SOL/USD spot',
    timestamp: new Date().toISOString(),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
