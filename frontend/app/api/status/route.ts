import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export function GET() {
  return NextResponse.json({
    project: 'SolNeutral',
    version: '2.0.0-alpha.4',
    mode: 'research-preview',
    executionEnabled: false,
    depositsEnabled: false,
    walletSigningEnabled: false,
    liveVaultMetricsAvailable: false,
    modeledScenarioAvailable: true,
    readOnlyWalletBalancesEndpoint: '/api/chain/wallet',
    readOnlyMarketFundingEndpoint: '/api/market/funding',
    readOnlyDriftAccountEndpoint: '/api/drift/account',
    verifiedLiveDriftPortfolioMetricsAvailable: false,
    readOnlyDataMayBeUnavailable: true,
    timestamp: new Date().toISOString(),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
