import { NextResponse } from 'next/server';
import { parseDriftFundingResponse } from '@/lib/funding';

export const dynamic = 'force-dynamic';
// Use the documented market endpoint first; the older indexer URL is a
// fallback for deployment/version differences. Never fabricate missing data.
const SOURCES = [
  'https://data.api.drift.trade/market/SOL-PERP/fundingRates',
  'https://data.api.drift.trade/fundingRates?marketName=SOL-PERP',
] as const;
const headers = { 'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=60' };

export async function GET() {
  try {
    let records: ReturnType<typeof parseDriftFundingResponse> = [];
    let source = '';
    for (const endpoint of SOURCES) {
      try {
        const response = await fetch(endpoint, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(5_000),
          next: { revalidate: 60 },
        });
        if (!response.ok) continue;
        records = parseDriftFundingResponse(await response.json());
        if (records.length) { source = endpoint; break; }
      } catch { /* Continue to independently documented fallback. */ }
    }
    if (!records.length) throw new Error('No validated funding records from either upstream endpoint');
    const latest = records[0];
    const ageMinutes = Math.max(0, Math.round((Date.now() - Date.parse(latest.time)) / 60_000));
    return NextResponse.json({
      status: ageMinutes > 180 ? 'stale' : 'observed',
      market: 'SOL-PERP', source, fetchedAt: new Date().toISOString(),
      latest, records: records.slice(0, 24), ageMinutes,
      note: 'Market-wide indexed funding observations, not user positions or vault earnings. Annualization assumes the observed hourly rate persisted for a full year; it is NOT a forecast.',
    }, { headers });
  } catch {
    // Degraded state is explicit. Never invent a rate, backfill with old simulations,
    // or leak unexpected upstream errors to the browser.
    return NextResponse.json({
      status: 'unavailable', market: 'SOL-PERP', source: SOURCES[0],
      message: 'Drift funding records could not be verified. No live figures are displayed.',
      records: [], fetchedAt: new Date().toISOString(),
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
