import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Public deployment metadata only; no secrets or unverified financial claims. */
export function GET() {
  const tradingEnabled = process.env.NEXT_PUBLIC_ENABLE_DEVNET_TRADING !== 'false';
  return NextResponse.json({
    project: 'SolNeutral',
    version: '7.5.0-demo',
    backend: 'nextjs-vercel-functions',
    mode: 'devnet-trading-and-research',
    walletConnectionAvailable: true,
    devnetWalletSigningInterfaceAvailable: tradingEnabled,
    verifiedLiveDriftPortfolioMetricsAvailable: false,
    pooledVaultDepositsEnabled: false,
    mainnetExecutionEnabled: false,
    aiDeterministicModeAvailable: true,
    privateAiConfigured: Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_MODEL),
    healthEndpoint: '/api/health',
    fundingEndpoint: '/api/market/funding',
    solReferenceChartEndpoint: '/api/market/sol-chart?interval=5m',
    solReferenceVenue: 'Coinbase Exchange SOL/USD spot',
    timestamp: new Date().toISOString(),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
