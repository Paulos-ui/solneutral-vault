import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export function GET() {
  return NextResponse.json({
    project: 'SolNeutral',
    version: '3.0.0-research-alpha',
    mode: 'integrated-research-preview',
    intelligenceTerminalAvailable: true,
    deterministicAnalystAvailable: true,
    optionalPrivateLanguageModelConfigured: Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_MODEL && process.env.AI_DEMO_ACCESS_TOKEN),
    liveVaultTradingEnabled: false,
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
